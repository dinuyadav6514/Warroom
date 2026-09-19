'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ConflictEvent,
  Conflict,
  GlobalOverviewStats,
  DataFreshness,
  FilterState,
  MapMode,
  ApiExchange,
} from '@/types/conflict';
import { Header } from '@/components/layout/Header';
import { LeftNav, NavView } from '@/components/layout/LeftNav';
import { GlobalStatsStrip } from '@/components/layout/GlobalStatsStrip';
import { ConflictMap } from '@/components/map/ConflictMap';
import { FullLiveStreamModal } from '@/components/stream/FullLiveStreamModal';
import { ConflictPanel } from '@/components/intelligence/ConflictPanel';
import { ConflictModal } from '@/components/intelligence/ConflictModal';
import { EventModal } from '@/components/intelligence/EventModal';
import { CommandLine } from '@/components/terminal/CommandLine';
import { SourcesModal } from '@/components/modals/SourcesModal';
import { SetupModal } from '@/components/modals/SetupModal';
import { VectorIntelModal } from '@/components/intelligence/VectorIntelModal';
import { ConflictsView } from '@/components/views/ConflictsView';
import { EscalationView } from '@/components/views/EscalationView';
import { ActorsView } from '@/components/views/ActorsView';
import { TimelineView } from '@/components/views/TimelineView';
import { isWithinWindow, isHistoricalOrStaleConflict } from '@/lib/data/date-utils';
import { calculateGlobalOverviewStats } from '@/lib/aggregation/stats';
import { mergeSimilarStories } from '@/lib/aggregation/story-merging';
import { IntelFilterBar } from '@/components/filters/IntelFilterBar';
import { ShieldAlert, Terminal, Menu, X, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

import { getMultiCountryView, parseCountryInput, matchCountryOrContinent } from '@/lib/data/country-coords';
import { RelationshipNetwork, buildRelationshipNetwork, CountryRelation } from '@/lib/data/country-relationships';

export default function WarRoomDashboard() {
  /** Target map center & zoom dispatched from terminal country selection or UI navigation */
  const [mapTargetLocation, setMapTargetLocation] = useState<{
    lng: number;
    lat: number;
    zoom?: number;
    timestamp: number;
    noZoom?: boolean;
  } | null>(null);

  /** Active kinetic relationship vector network (rendered as trajectory lines on the map) */
  const [relationNetwork, setRelationNetwork] = useState<RelationshipNetwork | null>(null);

  // Navigation & View State
  const [currentView, setCurrentView] = useState<NavView>('WORLD');
  const [mapMode, setMapMode] = useState<MapMode>('EVENTS');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    days: 7,
    severity: 'ALL',
    eventType: 'ALL',
    region: '',
    country: '',
    searchQuery: '',
    intelMode: 'ALL',
    storyMerging: true,
    sources: [],
  });

  // 10-Day Pre-loaded Dataset Store (Request 10 days first as instructed)
  const [allEvents10D, setAllEvents10D] = useState<ConflictEvent[]>([]);
  const [allConflicts10D, setAllConflicts10D] = useState<Conflict[]>([]);
  const [serverStats, setServerStats] = useState<GlobalOverviewStats | null>(null);
  const [freshness, setFreshness] = useState<DataFreshness | null>(null);
  const [apiExchange, setApiExchange] = useState<ApiExchange | null>(null);

  // Selection & Modals
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ConflictEvent | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<CountryRelation | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isVectorModalOpen, setIsVectorModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isFullStreamModalOpen, setIsFullStreamModalOpen] = useState(false);

  // Operational Flags
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStatsPanel, setShowStatsPanel] = useState<boolean>(false);

  // Load 10-Day Dataset Function (Only called on initial mount, on explicit force refresh, or 1-minute background timer)
  const load10DayData = useCallback(async (showRefreshingBanner = false) => {
    if (showRefreshingBanner) {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      // Request 10 days first as instructed: pre-loads the full 10-day dataset once
      const [eventsRes, conflictsRes] = await Promise.all([
        fetch('/api/events?days=10'),
        fetch('/api/conflicts?days=10'),
      ]);

      const eventsJson = await eventsRes.json();
      const conflictsJson = await conflictsRes.json();

      if (!eventsJson.success) {
        throw new Error(eventsJson.error || 'Failed to fetch events');
      }

      const rawEvents: ConflictEvent[] = eventsJson.allEvents || eventsJson.events || [];
      const rawConflicts: Conflict[] = conflictsJson.conflicts || [];

      setAllEvents10D(rawEvents);
      setAllConflicts10D(rawConflicts);
      setServerStats(conflictsJson.globalStats || null);
      setFreshness(
        eventsJson.freshness
          ? { ...eventsJson.freshness, dataWindowDays: filters.days }
          : null
      );
      if (eventsJson.apiExchange) {
        setApiExchange(eventsJson.apiExchange);
      }

      // Check if unconfigured
      if (eventsJson.freshness?.status === 'NOT_CONFIGURED') {
        setIsSetupModalOpen(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      if (showRefreshingBanner) {
        setIsRefreshing(false);
      }
    }
  }, [filters.days]);

  // Initial 10-Day Data Load
  useEffect(() => {
    load10DayData(true);
  }, []);

  // 15-Second High-Frequency Auto-Refresh Timer (maintains live 10-day dataset in minimum time)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      load10DayData(false);
    }, 15 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, load10DayData]);

  // Force Live API Refresh Function (bypasses cache, calls Gemini live, refreshes 10-day dataset)
  const handleForceRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const syncRes = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 10 }), // Always request 10 days first from Gemini
      });
      const syncJson = await syncRes.json();
      if (!syncJson.success) {
        throw new Error(syncJson.error || 'Failed to sync with Gemini API');
      }

      if (syncJson.apiExchange) {
        setApiExchange(syncJson.apiExchange);
      }

      await load10DayData(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, [load10DayData]);

  // Compute all available unique sources across the 10-day dataset
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    for (const ev of allEvents10D) {
      if (ev.source) set.add(ev.source);
      if (ev.mergedSources) {
        ev.mergedSources.forEach((s) => set.add(s));
      }
    }
    return Array.from(set).sort();
  }, [allEvents10D]);

  // Smart Story Merging & Deduplication Engine (memoized across 10-day dataset)
  const mergedResult = useMemo(() => {
    if (!allEvents10D || allEvents10D.length === 0) {
      return { mergedEvents: [], totalOriginal: 0, totalUnique: 0, totalMerged: 0 };
    }
    if (filters.storyMerging === false) {
      return {
        mergedEvents: allEvents10D,
        totalOriginal: allEvents10D.length,
        totalUnique: allEvents10D.length,
        totalMerged: 0,
      };
    }
    return mergeSimilarStories(allEvents10D);
  }, [allEvents10D, filters.storyMerging]);

  // Category counts calculated dynamically for the Intel mode pills
  const categoryCounts = useMemo(() => {
    const inWindow = mergedResult.mergedEvents.filter(
      (e) => isWithinWindow(e.eventDate, filters.days) && !isHistoricalOrStaleConflict(e)
    );
    return {
      ALL: inWindow.length,
      WAR_COMBAT: inWindow.filter((e) => e.primaryCategory === 'Warfare & Combat' || e.isConflict).length,
      DEFENSE_STRATEGY: inWindow.filter((e) => e.primaryCategory === 'Defense & Strategy').length,
      GEOPOLITICS: inWindow.filter((e) => e.primaryCategory === 'Geopolitics & Policy').length,
      ECONOMY: inWindow.filter((e) => e.primaryCategory === 'Economy & Global').length,
    };
  }, [mergedResult.mergedEvents, filters.days]);

  // Filter events by date window (3D, 7D, 10D), Intel mode, sources, and facets locally
  const events = useMemo(() => {
    const base = mergedResult.mergedEvents;
    if (!base || base.length === 0) return [];

    return base.filter((e) => {
      // Filter according to date window (3D, 7D, 10D)
      if (!isWithinWindow(e.eventDate, filters.days)) return false;
      if (isHistoricalOrStaleConflict(e)) return false;

      // Intel Mode filter
      if (filters.intelMode && filters.intelMode !== 'ALL') {
        if (filters.intelMode === 'WAR_COMBAT') {
          if (e.primaryCategory !== 'Warfare & Combat' && !e.isConflict) return false;
        } else if (filters.intelMode === 'DEFENSE_STRATEGY') {
          if (e.primaryCategory !== 'Defense & Strategy') return false;
        } else if (filters.intelMode === 'GEOPOLITICS') {
          if (e.primaryCategory !== 'Geopolitics & Policy') return false;
        } else if (filters.intelMode === 'ECONOMY') {
          if (e.primaryCategory !== 'Economy & Global') return false;
        }
      }

      // Pipeline / Sources filter
      if (filters.sources && filters.sources.length > 0) {
        const hasMatchingSource = filters.sources.some((s) => {
          if (e.source && (e.source.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(e.source.toLowerCase()))) return true;
          if (e.mergedSources && e.mergedSources.some((ms) => ms.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ms.toLowerCase()))) return true;
          return false;
        });
        if (!hasMatchingSource) return false;
      }

      // Facet filters
      if (filters.region && filters.region !== 'ALL' && e.region?.toLowerCase() !== filters.region.toLowerCase()) return false;
      // Multi-country / continent terminal filter takes precedence over single country UI filter
      if (filters.countries && filters.countries.length > 0) {
        if (!matchCountryOrContinent(e, filters.countries)) return false;
      } else if (filters.country && filters.country !== 'ALL' && e.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.severity && filters.severity !== 'ALL' && e.severity !== filters.severity) return false;
      if (filters.eventType && filters.eventType !== 'ALL' && !e.eventType?.toLowerCase().includes(filters.eventType.toLowerCase())) return false;
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const match =
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.country && e.country.toLowerCase().includes(q)) ||
          (e.actor1 && e.actor1.toLowerCase().includes(q)) ||
          (e.actor2 && e.actor2.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          (e.primaryCategory && e.primaryCategory.toLowerCase().includes(q)) ||
          (e.id && (e.id.toLowerCase().includes(q) || e.id.includes(q)));
        if (!match) return false;
      }
      return true;
    });
  }, [mergedResult.mergedEvents, filters]);

  // Filter conflicts by date window and facets locally - WITHOUT requesting another prompt!
  const conflicts = useMemo(() => {
    if (!allConflicts10D || allConflicts10D.length === 0) return [];
    return allConflicts10D
      .map((c) => {
        const inWindowEvents = c.recentEvents.filter(
          (e) => isWithinWindow(e.eventDate, filters.days) && !isHistoricalOrStaleConflict(e)
        );
        const totalFat = inWindowEvents.reduce((acc, ev) => acc + (ev.fatalities || 0), 0);
        return {
          ...c,
          recentEvents: inWindowEvents,
          eventCount7d: inWindowEvents.length,
          fatalities7d: totalFat,
        };
      })
      .filter((c) => {
        if (c.recentEvents.length === 0) return false;
        if (filters.region && filters.region !== 'ALL' && c.region?.toLowerCase() !== filters.region.toLowerCase()) return false;
        if (filters.countries && filters.countries.length > 0) {
          if (!matchCountryOrContinent(c, filters.countries)) return false;
        } else if (filters.country && filters.country !== 'ALL' && c.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
        return true;
      });
  }, [allConflicts10D, filters]);

  // Calculated global KPI metrics from the active filtered dataset
  const globalStats = useMemo(() => {
    if (conflicts.length === 0 && events.length === 0) return serverStats;
    return calculateGlobalOverviewStats(conflicts, events);
  }, [conflicts, events, serverStats]);

  // Update Filters helper (changes 3D/7D/10D locally with zero prompt requests)
  const handleUpdateFilters = (updates: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      if (updates.days) {
        setFreshness((f) => (f ? { ...f, dataWindowDays: updates.days! } : null));
      }
      return next;
    });
  };

  // Keyboard Shortcuts — only Escape (safe non-character key) to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsConflictModalOpen(false);
        setIsEventModalOpen(false);
        setIsVectorModalOpen(false);
        setSelectedEvent(null);
        setSelectedRelation(null);
        setIsSourcesModalOpen(false);
        setIsSetupModalOpen(false);
        setIsFullStreamModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Command handlers
  const handleSelectEventById = (id: string) => {
    if (!id) return;
    const searchId = id.toLowerCase();
    const found = events.find((e) => (e.id && e.id.toLowerCase() === searchId) || (e.id && e.id.includes(id)));
    if (found) {
      setSelectedEvent(found);
      setIsEventModalOpen(true);
    } else {
      setErrorMessage(`Event ${id} not found in current operational window.`);
    }
  };

  const handleSelectCountries = useCallback(
    (countryNames: string[], keepRelations = false) => {
      // If not keeping relations, clear any active relationship lines
      if (!keepRelations) {
        setRelationNetwork(null);
        setSelectedRelation(null);
        setIsVectorModalOpen(false);
      }

      // 1. If empty or cleared, reset filter and reset map view
      if (!countryNames || countryNames.length === 0) {
        setRelationNetwork(null);
        setSelectedRelation(null);
        setIsVectorModalOpen(false);
        setFilters((prev) => ({ ...prev, countries: [], country: '' }));
        setSelectedEvent(null);
        setSelectedConflict(null);
        setMapTargetLocation({ lng: 25, lat: 20, zoom: 2.2, timestamp: Date.now() });
        return;
      }

      // 2. Ensure we are in Map/WORLD view so user sees the result immediately
      setCurrentView('WORLD');
      setSelectedEvent(null);
      setSelectedConflict(null);

      // 3. Update filters (multi-country array takes precedence in useMemo)
      setFilters((prev) => ({
        ...prev,
        countries: countryNames,
        country: countryNames.length === 1 ? countryNames[0] : '',
      }));

      // 4. Calculate map view & fly to it
      const view = getMultiCountryView(countryNames, allEvents10D);
      if (view) {
        setMapTargetLocation({ ...view, timestamp: Date.now() });
      } else {
        // Fallback: search in loaded 10D events
        const matched = allEvents10D.filter(
          (e) =>
            typeof e.longitude === 'number' &&
            typeof e.latitude === 'number' &&
            matchCountryOrContinent(e, countryNames)
        );
        if (matched.length > 0) {
          const avgLng = matched.reduce((s, e) => s + e.longitude!, 0) / matched.length;
          const avgLat = matched.reduce((s, e) => s + e.latitude!, 0) / matched.length;
          setMapTargetLocation({ lng: avgLng, lat: avgLat, zoom: 5.5, timestamp: Date.now() });
        }
      }
    },
    [allEvents10D]
  );

  const handleSelectCountry = (countryName: string) => {
    if (!countryName || countryName === 'ALL') {
      handleSelectCountries([]);
    } else {
      handleSelectCountries([countryName]);
    }
  };

  /**
   * Builds and displays the kinetic relationship network for a focal country.
   * Renders incoming (red) and outgoing (cyan) trajectory lines on the map,
   * isolates marker dots to the connected nations, and zooms to frame the theater.
   */
  const handleShowRelationNetwork = useCallback(
    (countryName: string): RelationshipNetwork | null => {
      if (!countryName) {
        setRelationNetwork(null);
        handleSelectCountries([]);
        return null;
      }

      const network = buildRelationshipNetwork(countryName, allEvents10D, allConflicts10D);
      if (!network) {
        handleSelectCountry(countryName);
        return null;
      }

      setRelationNetwork(network);

      // 1. Switch to Map/WORLD view
      setCurrentView('WORLD');
      setSelectedEvent(null);
      setSelectedConflict(null);

      // 2. Filter events & conflicts to only show dots of the focal and connected countries
      setFilters((prev) => ({
        ...prev,
        countries: network.connectedCountries,
        country: '',
      }));

      // 3. Recenter map on focal country without zooming in, keeping wide overview
      // so all incoming and outgoing trajectory lines across nations remain fully visible.
      setMapTargetLocation({
        lng: network.focalCoords.lng,
        lat: network.focalCoords.lat,
        timestamp: Date.now(),
        noZoom: true,
      });

      return network;
    },
    [allEvents10D, allConflicts10D, handleSelectCountries, handleSelectCountry]
  );

  const handleSelectRelation = useCallback((relation: CountryRelation) => {
    setSelectedRelation(relation);
    setIsVectorModalOpen(true);
  }, []);

  const handleSelectRegion = (regionName: string) => {
    setFilters((prev) => ({ ...prev, region: regionName }));
  };

  const handleExecuteSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const handleOpenConflictModal = (conflict?: Conflict) => {
    const target = conflict || selectedConflict || conflicts[0] || null;
    if (target) {
      setSelectedConflict(target);
      setIsConflictModalOpen(true);
    }
  };

  const handleSelectEvent = useCallback((ev: ConflictEvent | null) => {
    setSelectedEvent(ev);
    if (!ev) {
      setSelectedConflict(null);
    }
  }, []);

  const handleSelectConflict = useCallback((c: Conflict | null) => {
    setSelectedConflict(c);
    if (c && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobilePanelOpen(true);
    }
    if (!c) {
      setSelectedEvent(null);
    }
  }, []);

  const handleOpenFullStream = useCallback(() => {
    if (currentView !== 'WORLD') {
      setCurrentView('WORLD');
    }
    setIsFullStreamModalOpen(true);
  }, [currentView]);

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-text-primary overflow-hidden font-mono">
      {/* Top Header */}
      <Header
        freshness={freshness}
        onRefresh={handleForceRefresh}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        onOpenSources={() => setIsSourcesModalOpen(true)}
        onOpenSetup={() => setIsSetupModalOpen(true)}
        onSelectDays={(days) => handleUpdateFilters({ days })}
        apiExchange={apiExchange}
        onToggleMobilePanel={() => setMobilePanelOpen(!mobilePanelOpen)}
        onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        conflictsCount={conflicts.length}
        showStatsPanel={showStatsPanel}
        onToggleStatsPanel={() => setShowStatsPanel((prev) => !prev)}
      />

      {/* Live Refresh In-Flight Indicator */}
      {isRefreshing && (
        <div className="bg-cyan-950/90 border-b border-accent-cyan/60 px-4 py-1.5 text-[11px] font-mono text-accent-cyan flex items-center justify-center gap-2 z-30 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-cyan" />
          <span>// INGESTING LIVE GDELT & RELIEFWEB DATA :: DISPATCHING GLOBAL RECONNAISSANCE QUERY...</span>
        </div>
      )}

      {/* Error / Offline Alert Bar */}
      {errorMessage && (
        <div className="bg-red-950/90 border-b border-red-700/80 px-4 py-1.5 text-[11px] text-red-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span>OPERATIONAL WARNING: {errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-text-muted hover:text-text-primary p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Intel Category & Pipeline Filter Bar — full-width, above all three panes */}
      <IntelFilterBar
        intelMode={filters.intelMode || 'ALL'}
        onSelectIntelMode={(mode) => handleUpdateFilters({ intelMode: mode })}
        storyMerging={filters.storyMerging !== false}
        onToggleStoryMerging={() =>
          handleUpdateFilters({ storyMerging: filters.storyMerging === false ? true : false })
        }
        selectedSources={filters.sources || []}
        onToggleSource={(source) => {
          const current =
            filters.sources && filters.sources.length > 0
              ? filters.sources
              : [...availableSources];
          const next = current.includes(source)
            ? current.filter((s) => s !== source)
            : [...current, source];
          handleUpdateFilters({
            sources: next.length === availableSources.length ? [] : next,
          });
        }}
        onSelectAllSources={() => {
          const isAll =
            !filters.sources ||
            filters.sources.length === 0 ||
            filters.sources.length === availableSources.length;
          if (isAll) {
            handleUpdateFilters({ sources: ['__NONE__'] });
          } else {
            handleUpdateFilters({ sources: [] });
          }
        }}
        selectedRegion={filters.region || 'ALL'}
        onSelectRegion={(region) => handleUpdateFilters({ region: region === 'ALL' ? '' : region })}
        selectedSeverity={filters.severity || 'ALL'}
        onSelectSeverity={(severity) => handleUpdateFilters({ severity })}
        selectedEventType={filters.eventType || 'ALL'}
        onSelectEventType={(eventType) => handleUpdateFilters({ eventType: eventType === 'ALL' ? '' : eventType })}
        categoryCounts={categoryCounts}
        storyMergeStats={{
          original: mergedResult.totalOriginal,
          unique: mergedResult.totalUnique,
          merged: mergedResult.totalMerged,
        }}
        availableSources={availableSources}
      />

      {/* Active Workstation Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Navigation Pane */}
        <LeftNav
          currentView={currentView}
          onSelectView={setCurrentView}
          filters={filters}
          onUpdateFilters={handleUpdateFilters}
          onOpenSources={() => setIsSourcesModalOpen(true)}
          isOpenMobile={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          availableSources={availableSources}
          isRefreshing={isRefreshing}
          lastSyncAt={freshness?.lastSyncAt}
          eventsCount={events.length}
          events={allEvents10D}
          apiExchange={apiExchange}
          selectedEvent={selectedEvent}
          selectedConflict={selectedConflict}
          relationNetwork={relationNetwork}
          onSelectRelation={handleSelectRelation}
          onClearRelationNetwork={() => {
            setRelationNetwork(null);
            handleSelectCountries([]);
          }}
          onClearSelection={() => {
            setSelectedEvent(null);
            setSelectedConflict(null);
          }}
          onSelectEvent={handleSelectEvent}
          onOpenEventModal={(e) => {
            setSelectedEvent(e);
            setIsEventModalOpen(true);
          }}
          onOpenFullStream={handleOpenFullStream}
        />

        {/* Primary Operational Center Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#070a0d] relative overflow-hidden">
          {/* Collapsible Headline KPI Metric Strip */}
          {showStatsPanel && (
            <GlobalStatsStrip
              stats={globalStats}
              windowDays={filters.days}
              onClose={() => setShowStatsPanel(false)}
            />
          )}

          {/* Center Dynamic Workspace Views */}
          <div className="flex-1 relative overflow-hidden">
            {currentView === 'WORLD' && (
              <div className="w-full h-full relative">
                <ConflictMap
                  events={events}
                  conflicts={conflicts}
                  selectedConflict={selectedConflict}
                  selectedEvent={selectedEvent}
                  onSelectConflict={handleSelectConflict}
                  onSelectEvent={handleSelectEvent}
                  onOpenEventModal={(e) => {
                    setSelectedEvent(e);
                    setIsEventModalOpen(true);
                  }}
                  mapMode={mapMode}
                  onChangeMapMode={setMapMode}
                  targetLocation={mapTargetLocation}
                  relationNetwork={relationNetwork}
                  onSelectRelation={handleSelectRelation}
                />
              </div>
            )}

            {currentView === 'CONFLICTS' && (
              <ConflictsView
                conflicts={conflicts}
                onSelectConflict={handleSelectConflict}
                onOpenConflictModal={handleOpenConflictModal}
                windowDays={filters.days}
              />
            )}

            {currentView === 'ESCALATION' && (
              <EscalationView
                conflicts={conflicts}
                onSelectConflict={handleSelectConflict}
                onOpenConflictModal={handleOpenConflictModal}
                windowDays={filters.days}
              />
            )}

            {currentView === 'TIMELINE' && (
              <TimelineView
                events={events}
                onSelectEvent={(e) => {
                  setSelectedEvent(e);
                  setIsEventModalOpen(true);
                }}
                windowDays={filters.days}
              />
            )}

            {currentView === 'ACTORS' && (
              <ActorsView
                conflicts={conflicts}
                events={events}
                onSelectEvent={(e) => {
                  setSelectedEvent(e);
                  setIsEventModalOpen(true);
                }}
                onSelectConflict={handleSelectConflict}
                onOpenConflictModal={handleOpenConflictModal}
                windowDays={filters.days}
              />
            )}
          </div>

          {/* Bottom Terminal Command Line (Anchored directly inside map/workspace area, never spanning below LeftNav or RightNav) */}
          <CommandLine
            onSelectView={setCurrentView}
            onUpdateFilters={handleUpdateFilters}
            onRefresh={handleForceRefresh}
            onOpenSources={() => setIsSourcesModalOpen(true)}
            onExecuteSearch={handleExecuteSearch}
            onSelectEventById={handleSelectEventById}
            onSelectCountry={handleSelectCountry}
            onSelectCountries={handleSelectCountries}
            onShowRelationNetwork={handleShowRelationNetwork}
            onSelectRegion={handleSelectRegion}
            allConflicts={conflicts}
            allEvents={events}
            activeConflict={selectedConflict}
            onSelectConflict={handleSelectConflict}
          />
        </main>

        {/* Right-Side Strategic Conflict Intelligence & Telemetry Workstation (Desktop) */}
        <div
          className={`${
            isPanelCollapsed
              ? 'w-9'
              : 'w-80 xl:w-96 2xl:w-[420px]'
          } hidden lg:flex flex-col h-full bg-panel border-l border-border transition-all duration-300 shrink-0 overflow-hidden relative z-30`}
        >
          <ConflictPanel
            conflict={selectedConflict}
            allConflicts={conflicts}
            allEvents={events}
            onSelectConflict={handleSelectConflict}
            onOpenConflictModal={handleOpenConflictModal}
            onSelectEvent={(e) => {
              setSelectedEvent(e);
              setIsEventModalOpen(true);
            }}
            windowDays={filters.days}
            apiExchange={apiExchange}
            isRefreshing={isRefreshing}
            onRefresh={handleForceRefresh}
            isCollapsed={isPanelCollapsed}
            onToggleCollapse={() => setIsPanelCollapsed((prev) => !prev)}
            onSelectView={setCurrentView}
            onUpdateFilters={handleUpdateFilters}
          />
        </div>
      </div>

      {/* Mobile & Tablet Slide-Over Intelligence Drawer (< 1024px) */}
      {mobilePanelOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            onClick={() => setMobilePanelOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] max-w-full bg-[#050a12] border-l border-border shadow-2xl flex flex-col lg:hidden animate-in slide-in-from-right duration-200">
            <ConflictPanel
              conflict={selectedConflict}
              allConflicts={conflicts}
              allEvents={events}
              onSelectConflict={handleSelectConflict}
              onOpenConflictModal={handleOpenConflictModal}
              onSelectEvent={(e) => {
                setSelectedEvent(e);
                setIsEventModalOpen(true);
              }}
              windowDays={filters.days}
              apiExchange={apiExchange}
              isRefreshing={isRefreshing}
              onRefresh={handleForceRefresh}
              isMobileDrawer={true}
              onCloseMobile={() => setMobilePanelOpen(false)}
              onSelectView={setCurrentView}
              onUpdateFilters={handleUpdateFilters}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {isConflictModalOpen && (selectedConflict || conflicts[0]) && (
        <ConflictModal
          conflict={selectedConflict || conflicts[0]}
          isOpen={isConflictModalOpen}
          onClose={() => setIsConflictModalOpen(false)}
          onSelectEvent={(e) => {
            setSelectedEvent(e);
            setIsEventModalOpen(true);
          }}
          windowDays={filters.days}
        />
      )}

      {isEventModalOpen && selectedEvent && (
        <EventModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {isVectorModalOpen && selectedRelation && (
        <VectorIntelModal
          relation={selectedRelation}
          isOpen={isVectorModalOpen}
          onClose={() => {
            setIsVectorModalOpen(false);
            setSelectedRelation(null);
          }}
          onSelectEvent={(e) => {
            setSelectedEvent(e);
            setIsEventModalOpen(true);
          }}
          onFilterPair={(countries) => {
            handleSelectCountries(countries, true);
            setIsVectorModalOpen(false);
          }}
        />
      )}

      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
      />

      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        isConfigured={typeof window !== 'undefined' && !!localStorage.getItem('warroom_gemini_key')}
        onKeyConfigured={handleForceRefresh}
      />

      <FullLiveStreamModal
        isOpen={isFullStreamModalOpen}
        onClose={() => setIsFullStreamModalOpen(false)}
        events={allEvents10D}
        onSelectEvent={(e) => {
          handleSelectEvent(e);
          setIsFullStreamModalOpen(false);
        }}
        onOpenEventModal={(e) => {
          setSelectedEvent(e);
          setIsEventModalOpen(true);
        }}
        isRefreshing={isRefreshing}
        onRefresh={handleForceRefresh}
      />
    </div>
  );
}
