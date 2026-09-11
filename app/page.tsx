'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { LiveEventStream } from '@/components/stream/LiveEventStream';
import { ConflictPanel } from '@/components/intelligence/ConflictPanel';
import { ConflictModal } from '@/components/intelligence/ConflictModal';
import { EventModal } from '@/components/intelligence/EventModal';
import { CommandLine } from '@/components/terminal/CommandLine';
import { SourcesModal } from '@/components/modals/SourcesModal';
import { SetupModal } from '@/components/modals/SetupModal';
import { ConflictsView } from '@/components/views/ConflictsView';
import { EscalationView } from '@/components/views/EscalationView';
import { ActorsView } from '@/components/views/ActorsView';
import { TimelineView } from '@/components/views/TimelineView';
import { isWithinWindow, isHistoricalOrStaleConflict } from '@/lib/data/date-utils';
import { calculateGlobalOverviewStats } from '@/lib/aggregation/stats';
import { ShieldAlert, Terminal, Menu, X, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function WarRoomDashboard() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<NavView>('WORLD');
  const [mapMode, setMapMode] = useState<MapMode>('EVENTS');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [isStreamCollapsed, setIsStreamCollapsed] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    days: 7,
    severity: 'ALL',
    eventType: 'ALL',
    region: '',
    country: '',
    searchQuery: '',
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
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Operational Flags
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load 10-Day Dataset Function (Only called on initial mount, on explicit force refresh, or 4-hour background timer)
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

  // 4-Hour Auto-Refresh Timer (maintains fresh 10-day dataset in background)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      load10DayData(false);
    }, 4 * 60 * 60 * 1000);
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

  // Filter events by date window (3D, 7D, 10D) and facets locally - WITHOUT requesting another prompt!
  const events = useMemo(() => {
    if (!allEvents10D || allEvents10D.length === 0) return [];
    return allEvents10D.filter((e) => {
      // Filter according to date window (3D, 7D, 10D)
      if (!isWithinWindow(e.eventDate, filters.days)) return false;
      if (isHistoricalOrStaleConflict(e)) return false;

      // Facet filters
      if (filters.region && filters.region !== 'ALL' && e.region?.toLowerCase() !== filters.region.toLowerCase()) return false;
      if (filters.country && filters.country !== 'ALL' && e.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
      if (filters.severity && filters.severity !== 'ALL' && e.severity !== filters.severity) return false;
      if (filters.eventType && filters.eventType !== 'ALL' && !e.eventType?.toLowerCase().includes(filters.eventType.toLowerCase())) return false;
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const match =
          e.location.toLowerCase().includes(q) ||
          e.country.toLowerCase().includes(q) ||
          (e.actor1 && e.actor1.toLowerCase().includes(q)) ||
          (e.actor2 && e.actor2.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allEvents10D, filters]);

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
        if (filters.country && filters.country !== 'ALL' && c.country?.toLowerCase() !== filters.country.toLowerCase()) return false;
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

  // Keyboard Shortcuts (M, T, 1: 3D, 2: 7D, 3: 10D, R: Refresh, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        setIsConflictModalOpen(false);
        setIsEventModalOpen(false);
        setSelectedEvent(null);
        setIsSourcesModalOpen(false);
        setIsSetupModalOpen(false);
      } else if (e.key === 'm' || e.key === 'M') {
        setCurrentView('WORLD');
      } else if (e.key === 't' || e.key === 'T') {
        setCurrentView('TIMELINE');
      } else if (e.key === 'r' || e.key === 'R') {
        handleForceRefresh();
      } else if (e.key === '1') {
        handleUpdateFilters({ days: 3 });
      } else if (e.key === '2') {
        handleUpdateFilters({ days: 7 });
      } else if (e.key === '3') {
        handleUpdateFilters({ days: 10 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleForceRefresh]);

  // Command handlers
  const handleSelectEventById = (id: string) => {
    const found = events.find((e) => e.id.toLowerCase() === id.toLowerCase() || e.id.includes(id));
    if (found) {
      setSelectedEvent(found);
      setIsEventModalOpen(true);
    } else {
      setErrorMessage(`Event ${id} not found in current operational window.`);
    }
  };

  const handleSelectCountry = (countryName: string) => {
    setFilters((prev) => ({ ...prev, country: countryName }));
  };

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

  const handleSelectConflict = (c: Conflict | null) => {
    setSelectedConflict(c);
    if (c && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobilePanelOpen(true);
    }
  };

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
        />

        {/* Primary Operational Center Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#070a0d] relative overflow-hidden">
          {/* Headline KPI Metric Strip */}
          <GlobalStatsStrip stats={globalStats} windowDays={filters.days} />

          {/* Center Dynamic Workspace Views */}
          <div className="flex-1 relative overflow-hidden">
            {currentView === 'WORLD' && (
              <div className="w-full h-full flex flex-col md:flex-row">
                {/* Strategic Map Canvas */}
                <div className="flex-1 h-2/3 md:h-full relative min-h-[300px]">
                  <ConflictMap
                    events={events}
                    conflicts={conflicts}
                    selectedConflict={selectedConflict}
                    selectedEvent={selectedEvent}
                    onSelectConflict={handleSelectConflict}
                    onSelectEvent={(e) => {
                      setSelectedEvent(e);
                    }}
                    onOpenEventModal={(e) => {
                      setSelectedEvent(e);
                      setIsEventModalOpen(true);
                    }}
                    mapMode={mapMode}
                    onChangeMapMode={setMapMode}
                    onRefresh={handleForceRefresh}
                    isRefreshing={isRefreshing}
                  />
                </div>

                {/* Split Live Conflict Stream (Collapsible) */}
                <div
                  className={`${
                    isStreamCollapsed
                      ? 'w-full md:w-9 h-8 md:h-full'
                      : 'w-full md:w-80 lg:w-72 h-1/3 md:h-full'
                  } border-t md:border-t-0 md:border-l border-border bg-panel flex flex-col transition-all duration-300 shrink-0 overflow-hidden`}
                >
                  <LiveEventStream
                    events={events}
                    onSelectEvent={(e) => {
                      setSelectedEvent(e);
                      setIsEventModalOpen(true);
                    }}
                    selectedEventId={selectedEvent?.id}
                    onRefresh={handleForceRefresh}
                    isRefreshing={isRefreshing}
                    isCollapsed={isStreamCollapsed}
                    onToggleCollapse={() => setIsStreamCollapsed((prev) => !prev)}
                  />
                </div>
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

      {/* Bottom Terminal Command Line */}
      <CommandLine
        onSelectView={setCurrentView}
        onUpdateFilters={handleUpdateFilters}
        onRefresh={handleForceRefresh}
        onOpenSources={() => setIsSourcesModalOpen(true)}
        onExecuteSearch={handleExecuteSearch}
        onSelectEventById={handleSelectEventById}
        onSelectCountry={handleSelectCountry}
        onSelectRegion={handleSelectRegion}
        allConflicts={conflicts}
        allEvents={events}
        activeConflict={selectedConflict}
        onSelectConflict={handleSelectConflict}
      />

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
    </div>
  );
}
