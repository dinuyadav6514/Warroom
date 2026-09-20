'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RadarMap } from '@/components/map/RadarMap';
import { MilitaryAircraftCategory } from '@/types/conflict';
import { getAircraftTacticalIntel } from '@/lib/data/aircraft-intel';
import {
  Radio,
  RefreshCw,
  Globe,
  Plane,
  Filter,
  Search,
  Crosshair,
  Clock,
  Navigation,
  X,
  MapPin,
  Shield,
  Zap,
  Target,
  Activity,
  BarChart3,
  Layers,
} from 'lucide-react';

function getAircraftOriginName(callsign?: string): string {
  const cs = (callsign || '').toUpperCase();
  if (cs.startsWith('FORTE') || cs.startsWith('UAV') || cs.startsWith('REAP') || cs.startsWith('BLK')) {
    return 'NAS SIGONELLA (NATO/USN 9TH RW)';
  }
  if (cs.startsWith('RRR') || cs.startsWith('HOMER')) {
    return 'RAF WADDINGTON (51 SQN)';
  }
  if (cs.startsWith('RCH') || cs.startsWith('MOOSE')) {
    return 'RAMSTEIN AIR BASE (86TH AW)';
  }
  if (cs.startsWith('LAGR') || cs.startsWith('NCHO') || cs.startsWith('VIPER')) {
    return 'RAF MILDENHALL / SPANGDAHLEM';
  }
  return 'TACTICAL DEPARTURE CORRIDOR';
}

function getHeadingCardinal(deg: number): string {
  const cardinals = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(((deg % 360) / 22.5)) % 16;
  return cardinals[idx];
}

const CATEGORY_CHIPS: Array<{ label: string; value: 'ALL' | MilitaryAircraftCategory }> = [
  { label: 'ALL', value: 'ALL' },
  { label: 'RECON / ISR', value: 'RECON_ISR' },
  { label: 'AWACS / AEW', value: 'AIRBORNE_EARLY_WARNING' },
  { label: 'TANKERS', value: 'TANKER_REFUEL' },
  { label: 'FIGHTERS', value: 'FIGHTER_STRIKE' },
  { label: 'TRANSPORT', value: 'TRANSPORT_CARGO' },
  { label: 'PATROL / SPEC', value: 'TRAINER_PATROL' },
];

export default function RadarPage() {
  const [utcClock, setUtcClock] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aviationGeoJson, setAviationGeoJson] = useState<any>(null);
  const [aviationCount, setAviationCount] = useState<number>(0);
  const [isAviationLoading, setIsAviationLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | MilitaryAircraftCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [altitudeBand, setAltitudeBand] = useState<'ALL' | 'HIGH' | 'MID' | 'LOW'>('ALL');
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<any | null>(null);
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(30);

  // UTC Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcClock(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 30-second countdown for next radar transponder sweep
  useEffect(() => {
    const interval = setInterval(() => {
      setNextRefreshSec((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Aviation Data
  const loadAviationData = useCallback(async (force = false) => {
    setIsAviationLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/aviation${force ? '?force=true' : ''}`);
      const data = await res.json();
      if (data.success && data.geojson) {
        setAviationGeoJson(data.geojson);
        setAviationCount(data.count || data.geojson.features?.length || 0);
        setNextRefreshSec(30);
      }
    } catch (e) {
      console.warn('Failed to load Military Aviation ADS-B data:', e);
    } finally {
      setIsAviationLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAviationData(false);
  }, [loadAviationData]);

  // 30-Second Polling
  useEffect(() => {
    const interval = setInterval(() => {
      loadAviationData(false);
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, [loadAviationData]);

  // Extract features array
  const allFeatures = useMemo(() => {
    if (!aviationGeoJson?.features) return [];
    return aviationGeoJson.features;
  }, [aviationGeoJson]);

  // Filter features
  const filteredFeatures = useMemo(() => {
    return allFeatures.filter((f: any) => {
      const p = f.properties || {};

      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }

      // Search query filter (callsign, hex, model, typeCode)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const callsign = (p.callsign || '').toLowerCase();
        const hex = (p.hex || '').toLowerCase();
        const model = (p.modelDescription || '').toLowerCase();
        const type = (p.typeCode || '').toLowerCase();
        if (!callsign.includes(q) && !hex.includes(q) && !model.includes(q) && !type.includes(q)) {
          return false;
        }
      }

      // Altitude Band Filter
      if (altitudeBand !== 'ALL') {
        const alt = Number(p.altitudeFt || 0);
        if (altitudeBand === 'HIGH' && alt < 30000) return false;
        if (altitudeBand === 'MID' && (alt < 15000 || alt >= 30000)) return false;
        if (altitudeBand === 'LOW' && alt >= 15000) return false;
      }

      return true;
    });
  }, [allFeatures, selectedCategory, searchQuery, altitudeBand]);

  // Sorted sorties (Highest altitude first)
  const sortedSorties = useMemo(() => {
    return [...filteredFeatures].sort((a: any, b: any) => {
      const altA = typeof a.properties?.altitudeFt === 'number' ? a.properties.altitudeFt : 0;
      const altB = typeof b.properties?.altitudeFt === 'number' ? b.properties.altitudeFt : 0;
      return altB - altA;
    });
  }, [filteredFeatures]);

  // Compute comprehensive theater fleet statistics for idle right panel
  const theaterStats = useMemo(() => {
    const total = allFeatures.length;
    let dronesCount = 0;
    let awacsCount = 0;
    let tankersCount = 0;
    let fightersCount = 0;
    let transportCount = 0;
    let isrCount = 0;
    let highAltCount = 0; // >= 30,000 ft
    let midAltCount = 0;  // 15,000 - 29,999 ft
    let lowAltCount = 0;  // < 15,000 ft
    const emergencySquawks: any[] = [];
    const highPrioritySorties: any[] = [];

    for (const f of allFeatures) {
      const p = f.properties || {};
      const cat = p.category;
      const icon = p.iconName || '';
      const model = (p.modelDescription || '').toLowerCase();
      const alt = typeof p.altitudeFt === 'number' ? p.altitudeFt : 0;
      const sq = String(p.squawk || '');
      const cs = (p.callsign || '').toUpperCase();

      if (
        icon.includes('drone') ||
        model.includes('drone') ||
        model.includes('hawk') ||
        model.includes('reaper') ||
        model.includes('shahed') ||
        cs.startsWith('FORTE') ||
        cs.startsWith('UAV') ||
        cs.startsWith('REAP')
      ) {
        dronesCount++;
        if (highPrioritySorties.length < 5) highPrioritySorties.push(p);
      } else if (cat === 'AIRBORNE_EARLY_WARNING' || icon === 'aircraft-awacs' || cs.startsWith('NATO')) {
        awacsCount++;
        if (highPrioritySorties.length < 5) highPrioritySorties.push(p);
      } else if (cat === 'TANKER_REFUEL' || icon === 'aircraft-tanker' || cs.startsWith('LAGR') || cs.startsWith('QUID')) {
        tankersCount++;
      } else if (cat === 'FIGHTER_STRIKE' || icon === 'aircraft-fighter' || cs.startsWith('VIPER')) {
        fightersCount++;
      } else if (cat === 'TRANSPORT_CARGO' || icon === 'aircraft-transport' || cs.startsWith('RCH') || cs.startsWith('MOOSE')) {
        transportCount++;
      } else {
        isrCount++;
        if (cs.startsWith('RRR') || cs.startsWith('HOMER') || cs.startsWith('JAKE')) {
          if (highPrioritySorties.length < 5) highPrioritySorties.push(p);
        }
      }

      if (alt >= 30000) highAltCount++;
      else if (alt >= 15000) midAltCount++;
      else lowAltCount++;

      if (sq === '7700' || sq === '7600' || sq === '7500') {
        emergencySquawks.push({ callsign: p.callsign, squawk: sq });
      }
    }

    return {
      total,
      dronesCount,
      awacsCount,
      tankersCount,
      fightersCount,
      transportCount,
      isrCount,
      highAltCount,
      midAltCount,
      lowAltCount,
      emergencySquawks,
      highPrioritySorties,
    };
  }, [allFeatures]);

  // Filtered GeoJSON passed to map
  const activeMapGeoJson = useMemo(() => {
    if (!aviationGeoJson) return null;
    return {
      type: 'FeatureCollection',
      features: filteredFeatures,
    };
  }, [aviationGeoJson, filteredFeatures]);

  // Unified select handler to prevent camera snap-back
  const handleSelectAircraft = useCallback((aircraft: any) => {
    if (!aircraft) {
      setSelectedAircraft(null);
      setTargetLocation(null);
      return;
    }
    const enriched = {
      ...aircraft,
      originName: aircraft.originName || getAircraftOriginName(aircraft.callsign),
    };
    setSelectedAircraft(enriched);
    const lat = Number(aircraft.latitude || aircraft.curLat || 0);
    const lng = Number(aircraft.longitude || aircraft.curLng || 0);
    if (lat && lng) {
      setTargetLocation([lat, lng]);
    }
  }, []);

  // Deselect aircraft on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSelectAircraft(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectAircraft]);

  return (
    <div className="flex flex-col h-screen bg-[#070a0d] text-[#e6edf3] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER (Days & Pipeline filters removed) ── */}
      <header className="h-12 bg-panel border-b border-border px-3 md:px-4 flex items-center justify-between z-30 font-mono select-none gap-2 shrink-0">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <Plane className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-bold text-sm md:text-base text-text-primary tracking-wider">
              WARROOM
            </span>
            <span className="text-border-glow text-xs hidden sm:inline">//</span>
            <span className="text-xs text-cyan-400 font-bold tracking-widest hidden md:inline">
              MILITARY & RECON FLIGHT RADAR
            </span>
          </div>

          {/* Transponder Feed Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-cyan-950/40 border border-cyan-800/60 rounded-[2px] text-[10px] text-cyan-300">
            <Navigation className="w-3 h-3 text-cyan-400" />
            <span>1090MHz ADS-B // MODE-S MIL FEED (30S CYCLE)</span>
          </div>
        </div>

        {/* Right Section: World Time, Countdown & Refresh */}
        <div className="flex items-center gap-2 md:gap-3 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 text-text-secondary bg-panel-subtle/80 px-2 py-1 border border-border/80 rounded-[2px]">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-muted-foreground text-[10px] hidden md:inline">WORLD TIME ::</span>
            <span className="text-text-primary font-bold text-[10.5px] md:text-[11px] tracking-wide">
              {utcClock}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 border border-border bg-panel-subtle text-[10.5px] text-zinc-400">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] text-zinc-500">SWEEP:</span>
            <span className="text-cyan-400 font-bold">{nextRefreshSec}s</span>
          </div>

          <button
            onClick={() => loadAviationData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 active:bg-cyan-700/30 border border-cyan-500/70 hover:border-cyan-400 text-cyan-400 text-[10.5px] md:text-[11px] font-bold tracking-wider rounded-[2px] transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.18)] disabled:opacity-50"
            title="Force refresh military ADS-B transponder feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'SWEEPING...' : 'REFRESH RADAR'}</span>
            <span className="sm:hidden">{isRefreshing ? '...' : 'REFRESH'}</span>
          </button>
        </div>
      </header>

      {/* ── RADAR FILTER BAR (No days / pipelines filter) ── */}
      <div className="bg-[#0b0f14] border-b border-border/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0 z-20">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mission Category Chips */}
          <div className="flex items-center gap-1 bg-panel-subtle px-1.5 py-0.5 border border-border">
            <span className="text-[10px] text-text-secondary mr-1">MISSION:</span>
            <div className="flex items-center gap-0.5">
              {CATEGORY_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setSelectedCategory(chip.value)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-[1px] transition-colors cursor-pointer ${
                    selectedCategory === chip.value
                      ? 'bg-cyan-500 text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Altitude Band Filter */}
          <div className="flex items-center gap-1 bg-panel-subtle px-1.5 py-0.5 border border-border">
            <span className="text-[10px] text-text-secondary mr-1">ALT:</span>
            <div className="flex items-center gap-0.5 text-[10px]">
              {(['ALL', 'HIGH', 'MID', 'LOW'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setAltitudeBand(b)}
                  className={`px-1.5 py-0.5 rounded-[1px] transition-colors cursor-pointer ${
                    altitudeBand === b
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Callsign / Hex Search */}
          <div className="flex items-center gap-1 bg-panel-subtle px-2 py-0.5 border border-border">
            <Search className="w-3 h-3 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CALLSIGN / HEX..."
              className="bg-transparent text-cyan-300 text-[10px] placeholder:text-zinc-600 focus:outline-none w-36 uppercase"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-white text-[10px] ml-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Airborne Targets Counter Badge */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>AIRBORNE TARGETS:</span>
            <strong className="text-cyan-400 font-bold text-xs">{filteredFeatures.length}</strong>
            {filteredFeatures.length !== aviationCount && (
              <span className="text-[10px] text-zinc-500">/ {aviationCount} TOTAL</span>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sorties Sidebar */}
        <aside className="w-72 md:w-80 bg-panel border-r border-border h-full flex flex-col font-mono text-xs select-none shrink-0 z-10">
          {/* Sidebar Header */}
          <div className="p-2.5 border-b border-border flex items-center justify-between text-text-secondary shrink-0 bg-panel-subtle/50">
            <span className="text-cyan-400 tracking-widest text-[11px] font-bold flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" />
              // AIRBORNE SORTIES STREAM
            </span>
            <span className="text-[10px] text-text-muted">ADS-B.1090</span>
          </div>

          {/* Sortie Scroll List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isAviationLoading ? (
              <div className="p-4 text-center text-cyan-400/80 animate-pulse text-xs">
                Scanning global military 1090MHz transponder feeds...
              </div>
            ) : sortedSorties.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-xs">
                No military aircraft match the active filter criteria.
              </div>
            ) : (
              sortedSorties.map((feat: any, idx: number) => {
                const p = feat.properties || {};
                const coords = feat.geometry?.coordinates || [0, 0];
                const color = p.color || '#06b6d4';

                const isSelected =
                  selectedAircraft &&
                  (selectedAircraft.id === p.id || selectedAircraft.hex === p.hex);

                return (
                  <div
                    key={p.id || idx}
                    onClick={() => handleSelectAircraft(p)}
                    className={`p-2 transition-all cursor-pointer rounded-[2px] group ${
                      isSelected
                        ? 'bg-cyan-950/80 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#090d12] hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-cyan-500/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[11.5px] font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {p.callsign || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isSelected && (
                          <span className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-400 animate-pulse">
                            PATH
                          </span>
                        )}
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded border"
                          style={{ borderColor: `${color}60`, color: color, backgroundColor: `${color}15` }}
                        >
                          {p.category ? p.category.replace('_', ' ') : 'AIRBORNE'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-zinc-400 truncate mb-1">
                      {p.modelDescription || p.typeCode || 'Military Airframe'}
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9.5px] text-zinc-400">
                      <div>
                        ALT: <span className="text-cyan-300 font-bold">{p.altitudeLabel}</span>
                      </div>
                      <div>
                        SPD: <span className="text-zinc-200">{p.speedKnots} KTS</span>
                      </div>
                      <div>
                        HDG: <span className="text-zinc-200">{p.trackDeg}°</span>
                      </div>
                      <div>
                        SQ: <span className="text-amber-400">{p.squawk || 'MIL'}</span>
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[9px] text-zinc-500">
                      <span>HEX: {p.hex?.toUpperCase()}</span>
                      <span className="group-hover:text-cyan-400 transition-colors flex items-center gap-0.5">
                        <Crosshair className="w-2.5 h-2.5" />
                        {isSelected ? 'TRACKING' : 'VIEW PATH'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Map Center */}
        {/* Map Center */}
        <main className="flex-1 h-full relative overflow-hidden">
          <RadarMap
            aviationGeoJson={activeMapGeoJson}
            aviationCount={filteredFeatures.length}
            isAviationLoading={isAviationLoading}
            targetLocation={targetLocation}
            selectedAircraft={selectedAircraft}
            onSelectAircraft={handleSelectAircraft}
          />
        </main>

        {/* Right-Side Flight Telemetry / Theater Fleet Overview Panel (Always Active) */}
        <aside className="w-80 sm:w-92 lg:w-[410px] bg-[#080c11] border-l border-zinc-800 h-full flex flex-col font-mono text-xs select-none shrink-0 z-20 shadow-2xl">
          {selectedAircraft ? (
            (() => {
              const intel = getAircraftTacticalIntel(
                selectedAircraft.typeCode,
                selectedAircraft.callsign,
                selectedAircraft.modelDescription,
                selectedAircraft.category
              );

              return (
                <>
                  {/* Telemetry Header */}
                  <div className="p-3 border-b border-zinc-800 bg-[#0c1218] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
                        style={{ backgroundColor: selectedAircraft.color || '#06b6d4' }}
                      />
                      <div className="truncate">
                        <span className="text-[10px] text-zinc-500 block leading-tight">// TACTICAL FLIGHT TRACK</span>
                        <span className="text-sm font-bold text-white tracking-wider truncate block">
                          {selectedAircraft.callsign || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase"
                        style={{
                          borderColor: `${selectedAircraft.color || '#06b6d4'}80`,
                          color: selectedAircraft.color || '#06b6d4',
                          backgroundColor: `${selectedAircraft.color || '#06b6d4'}15`,
                        }}
                      >
                        {selectedAircraft.category ? String(selectedAircraft.category).replace('_', ' ') : 'MILITARY'}
                      </span>
                      <button
                        onClick={() => handleSelectAircraft(null)}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        title="Close Flight Panel [ESC]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Telemetry & Intelligence Details */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* 1. Drone / Aircraft Classification Banner */}
                    {intel.isDrone ? (
                      <div className="p-2.5 bg-rose-950/30 border border-rose-500/60 rounded-[2px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                            UNMANNED AERIAL SYSTEM (UAS)
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 border border-rose-500">
                            DRONE
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white tracking-wide">
                          {intel.droneTypeBadge || intel.airframeCategoryTag}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/50 rounded-[2px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            MILITARY AVIATION ASSET
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-500">
                            CREWED
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white tracking-wide">
                          {intel.airframeCategoryTag}
                        </div>
                      </div>
                    )}

                    {/* 2. Airframe Model & Registry */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-0.5">AIRFRAME MODEL</div>
                      <div className="text-xs font-bold text-zinc-100">
                        {intel.airframeTypeTitle}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-zinc-800/60">
                        <div>
                          <span className="text-zinc-500 block">ICAO 24-BIT HEX:</span>
                          <strong className="text-cyan-300 font-mono">
                            {String(selectedAircraft.hex || selectedAircraft.id || '').toUpperCase()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">TYPE CODE:</span>
                          <strong className="text-zinc-300 font-mono">{selectedAircraft.typeCode || 'MIL-AIR'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3. Tactical Mission Profile */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1 flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-cyan-400" />
                        <span>MISSION PROFILE & OPERATIONAL ROLE</span>
                      </div>
                      <div className="text-[11px] text-zinc-200 leading-relaxed font-sans">
                        {intel.primaryMission}
                      </div>
                    </div>

                    {/* 4. Tactical Capabilities */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>TACTICAL CAPABILITIES</span>
                      </div>
                      <ul className="space-y-1.5 text-[10.5px] text-zinc-300">
                        {intel.keyCapabilities.map((cap, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-cyan-400 font-bold shrink-0 mt-0.5">▸</span>
                            <span className="leading-tight">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 5. Weapons Loadout / Armament & Payload */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1 flex items-center gap-1.5">
                        <Crosshair className="w-3 h-3 text-rose-400" />
                        <span>ARMAMENT & PAYLOAD CAPACITY</span>
                      </div>
                      <div className="text-[11px] text-zinc-200 leading-relaxed">
                        {intel.armamentAndPayload}
                      </div>
                    </div>

                    {/* 6. Sensors, Radars & Avionics Suite */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1 flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-emerald-400" />
                        <span>SENSORS & AVIONICS SUITE</span>
                      </div>
                      <div className="text-[11px] text-zinc-200 leading-relaxed">
                        {intel.sensorsAndAvionics}
                      </div>
                    </div>

                    {/* 7. Operational Flight Envelope */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>OPERATIONAL FLIGHT ENVELOPE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-[#090d12] p-2 border border-zinc-800 rounded-[2px]">
                          <span className="text-zinc-500 block text-[9px]">MAX SERVICE CEILING</span>
                          <strong className="text-cyan-300 block text-[11px] mt-0.5">{intel.operationalEnvelope.maxCeiling}</strong>
                        </div>
                        <div className="bg-[#090d12] p-2 border border-zinc-800 rounded-[2px]">
                          <span className="text-zinc-500 block text-[9px]">MAX LOITER ENDURANCE</span>
                          <strong className="text-emerald-300 block text-[11px] mt-0.5">{intel.operationalEnvelope.endurance}</strong>
                        </div>
                        <div className="bg-[#090d12] p-2 border border-zinc-800 rounded-[2px]">
                          <span className="text-zinc-500 block text-[9px]">COMBAT RADIUS / RANGE</span>
                          <strong className="text-amber-300 block text-[11px] mt-0.5">{intel.operationalEnvelope.combatRange}</strong>
                        </div>
                        <div className="bg-[#090d12] p-2 border border-zinc-800 rounded-[2px]">
                          <span className="text-zinc-500 block text-[9px]">MAX SPEED / MACH</span>
                          <strong className="text-zinc-100 block text-[11px] mt-0.5">{intel.operationalEnvelope.maxSpeed}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 8. Deploying Military Operators */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1 flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span>DEPLOYING MILITARY FORCES</span>
                      </div>
                      <div className="text-[11px] text-zinc-300 leading-relaxed">
                        {intel.operators}
                      </div>
                    </div>

                    {/* 9. Live Avionics HUD Grid (Altitude, Speed, Heading, Squawk) */}
                    <div className="border-t border-zinc-800/80 pt-3">
                      <div className="text-[10px] text-zinc-500 uppercase mb-2 flex items-center gap-1.5">
                        <Navigation className="w-3 h-3 text-cyan-400" />
                        <span>LIVE ADS-B TELEMETRY FEED</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Altitude */}
                        <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                            <span>ALTITUDE</span>
                            <span className="text-[9px] text-cyan-400 font-bold">
                              {selectedAircraft.altitudeLabel || 'FL---'}
                            </span>
                          </div>
                          <div className="text-base font-bold text-cyan-300">
                            {selectedAircraft.altitudeFt === 'GROUND'
                              ? 'GROUND'
                              : typeof selectedAircraft.altitudeFt === 'number'
                              ? `${selectedAircraft.altitudeFt.toLocaleString()} FT`
                              : `${selectedAircraft.altitudeFt || '---'} FT`}
                          </div>
                          <div className="w-full bg-zinc-800 h-1 mt-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-400 h-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(5, (Number(selectedAircraft.altitudeFt || 0) / 60000) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Ground Speed */}
                        <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                            <span>GROUND SPEED</span>
                            <span className="text-[9px] text-zinc-400">
                              {Math.round(Number(selectedAircraft.speedKnots || 0) * 1.852)} KM/H
                            </span>
                          </div>
                          <div className="text-base font-bold text-zinc-100">
                            {selectedAircraft.speedKnots || '---'} <span className="text-xs text-zinc-400 font-normal">KTS</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1 mt-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(5, (Number(selectedAircraft.speedKnots || 0) / 700) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Heading / Bearing */}
                        <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                            <span>TRUE HEADING</span>
                            <span className="text-[9px] text-cyan-400 font-bold">
                              {getHeadingCardinal(Number(selectedAircraft.trackDeg || 0))}
                            </span>
                          </div>
                          <div className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                            <Navigation
                              className="w-3.5 h-3.5 text-cyan-400 shrink-0 inline"
                              style={{ transform: `rotate(${selectedAircraft.trackDeg || 0}deg)` }}
                            />
                            <span>{selectedAircraft.trackDeg || 0}°</span>
                          </div>
                          <div className="text-[9.5px] text-zinc-500 mt-1">COMPASS BEARING</div>
                        </div>

                        {/* Transponder / Squawk */}
                        <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                            <span>TRANSPONDER</span>
                            <span className="text-[9px] text-emerald-400 font-bold">MODE-S</span>
                          </div>
                          <div className="text-base font-bold text-amber-400 font-mono">
                            {selectedAircraft.squawk || 'MIL'}
                          </div>
                          <div className="text-[9.5px] text-zinc-500 mt-1">SQUAWK CODE</div>
                        </div>
                      </div>
                    </div>

                    {/* 10. Live Position Coordinates */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1">LIVE POSITION COORDINATES</div>
                      <div className="flex items-center justify-between font-mono text-xs text-zinc-200">
                        <span>
                          LAT: <strong className="text-cyan-300">{Number(selectedAircraft.latitude || selectedAircraft.curLat || 0).toFixed(4)}°</strong>
                        </span>
                        <span>
                          LON: <strong className="text-cyan-300">{Number(selectedAircraft.longitude || selectedAircraft.curLng || 0).toFixed(4)}°</strong>
                        </span>
                      </div>
                    </div>

                    {/* 11. Operating Air Base / Corridor */}
                    <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>OPERATING AIR BASE / CORRIDOR</span>
                      </div>
                      <div className="text-xs font-bold text-zinc-100">
                        {selectedAircraft.originName || getAircraftOriginName(selectedAircraft.callsign)}
                      </div>
                      <div className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1.5 pt-1.5 border-t border-zinc-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span>FLIGHT PATH GROUND-ANCHORED ON SCOPE</span>
                      </div>
                    </div>

                    {/* 12. Tactical Scope Controls */}
                    <div className="pt-1 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          const lat = Number(selectedAircraft.latitude || selectedAircraft.curLat || 0);
                          const lng = Number(selectedAircraft.longitude || selectedAircraft.curLng || 0);
                          setTargetLocation([lat, lng]);
                        }}
                        className="w-full py-2 bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-500/70 hover:border-cyan-400 text-cyan-300 font-bold rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>RE-CENTER RADAR SCOPE</span>
                      </button>
                      <button
                        onClick={() => handleSelectAircraft(null)}
                        className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-[2px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>DISMISS SELECTION [ESC]</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            <>
              {/* Theater Overview Header */}
              <div className="p-3 border-b border-zinc-800 bg-[#0c1218] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-zinc-500 block leading-tight">// THEATER AIR PICTURE</span>
                    <span className="text-sm font-bold text-white tracking-wider truncate block">
                      FLEET STATUS OVERVIEW
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded border border-cyan-500/50 text-cyan-300 bg-cyan-950/40">
                    1090MHz ACTIVE
                  </span>
                </div>
              </div>

              {/* Scrollable Theater Overview Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* 1. Total Active Sorties Hero Card */}
                <div className="p-3 bg-gradient-to-br from-cyan-950/40 via-[#0d141d] to-[#090d12] border border-cyan-500/40 rounded-[2px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      AIRBORNE ASSETS IN THEATER
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-500">
                      LIVE FEED
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-white font-mono tracking-tight">
                      {theaterStats.total}
                    </span>
                    <span className="text-xs text-cyan-400 font-bold">ACTIVE MIL SORTIES</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                    Eastern European, Black Sea & Mediterranean airspace monitored via OpenSky Mode-S ADS-B telemetry sweeps.
                  </div>
                </div>

                {/* 2. Tactical Military Asset Breakdown */}
                <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                  <div className="text-[10px] text-zinc-400 uppercase mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-zinc-300">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      MILITARY ASSET INVENTORY
                    </span>
                    <span className="text-[9.5px] text-zinc-500">{theaterStats.total} TOTAL</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Drones */}
                    <div>
                      <div className="flex items-center justify-between text-[10.5px] mb-1">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span>UNMANNED SYSTEMS (UAS / DRONES)</span>
                        </span>
                        <strong className="text-cyan-400">{theaterStats.dronesCount}</strong>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-400 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(theaterStats.dronesCount > 0 ? 6 : 0, (theaterStats.dronesCount / Math.max(1, theaterStats.total)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">RQ-4 Global Hawk, MQ-9 Reaper, Bayraktar TB2, Shahed</div>
                    </div>

                    {/* AWACS */}
                    <div>
                      <div className="flex items-center justify-between text-[10.5px] mb-1">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>AIRBORNE EARLY WARNING (AWACS)</span>
                        </span>
                        <strong className="text-amber-400">{theaterStats.awacsCount}</strong>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(theaterStats.awacsCount > 0 ? 6 : 0, (theaterStats.awacsCount / Math.max(1, theaterStats.total)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">Boeing E-3 Sentry, E-7 Wedgetail 360° S-Band rotodomes</div>
                    </div>

                    {/* Tankers */}
                    <div>
                      <div className="flex items-center justify-between text-[10.5px] mb-1">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                          <span>REFUELING TANKERS (AAR)</span>
                        </span>
                        <strong className="text-purple-400">{theaterStats.tankersCount}</strong>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-400 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(theaterStats.tankersCount > 0 ? 6 : 0, (theaterStats.tankersCount / Math.max(1, theaterStats.total)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">KC-135 Stratotanker, Airbus A330 MRTT Voyager tracks</div>
                    </div>

                    {/* Fighters */}
                    <div>
                      <div className="flex items-center justify-between text-[10.5px] mb-1">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                          <span>COMBAT AIR PATROL / FIGHTERS</span>
                        </span>
                        <strong className="text-rose-400">{theaterStats.fightersCount}</strong>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-400 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(theaterStats.fightersCount > 0 ? 6 : 0, (theaterStats.fightersCount / Math.max(1, theaterStats.total)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">F-35 Lightning II, F-16 Falcon, Eurofighter Typhoon</div>
                    </div>

                    {/* Transport / Cargo */}
                    <div>
                      <div className="flex items-center justify-between text-[10.5px] mb-1">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          <span>STRATEGIC AIRLIFT & CARGO</span>
                        </span>
                        <strong className="text-blue-400">{theaterStats.transportCount}</strong>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-400 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(theaterStats.transportCount > 0 ? 6 : 0, (theaterStats.transportCount / Math.max(1, theaterStats.total)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">Boeing C-17 Globemaster, C-130 Hercules, Airbus A400M</div>
                    </div>

                    {/* SIGINT / Patrol */}
                    <div>
                      <div className="flex items-center justify-between text-[10.5px] mb-1">
                        <span className="flex items-center gap-1.5 text-zinc-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>RECON / SIGINT / ASW</span>
                        </span>
                        <strong className="text-emerald-400">{theaterStats.isrCount}</strong>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(theaterStats.isrCount > 0 ? 6 : 0, (theaterStats.isrCount / Math.max(1, theaterStats.total)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">RC-135 Rivet Joint, Boeing P-8A Poseidon maritime surveillance</div>
                    </div>
                  </div>
                </div>

                {/* 3. Altitude Distribution Bands */}
                <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                  <div className="text-[10px] text-zinc-400 uppercase mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-zinc-300">
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                      ALTITUDE DISTRIBUTION BANDS
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 bg-[#090d12] border border-zinc-800 rounded-[2px]">
                      <span className="text-zinc-500 block text-[9px]">HIGH (FL300+)</span>
                      <strong className="text-cyan-300 block text-base mt-0.5 font-mono">
                        {theaterStats.highAltCount}
                      </strong>
                      <span className="text-[9px] text-zinc-400">
                        {theaterStats.total > 0 ? Math.round((theaterStats.highAltCount / theaterStats.total) * 100) : 0}% fleet
                      </span>
                    </div>
                    <div className="p-2 bg-[#090d12] border border-zinc-800 rounded-[2px]">
                      <span className="text-zinc-500 block text-[9px]">MID (FL150-300)</span>
                      <strong className="text-amber-300 block text-base mt-0.5 font-mono">
                        {theaterStats.midAltCount}
                      </strong>
                      <span className="text-[9px] text-zinc-400">
                        {theaterStats.total > 0 ? Math.round((theaterStats.midAltCount / theaterStats.total) * 100) : 0}% fleet
                      </span>
                    </div>
                    <div className="p-2 bg-[#090d12] border border-zinc-800 rounded-[2px]">
                      <span className="text-zinc-500 block text-[9px]">LOW (&lt;FL150)</span>
                      <strong className="text-emerald-300 block text-base mt-0.5 font-mono">
                        {theaterStats.lowAltCount}
                      </strong>
                      <span className="text-[9px] text-zinc-400">
                        {theaterStats.total > 0 ? Math.round((theaterStats.lowAltCount / theaterStats.total) * 100) : 0}% fleet
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Transponder Squawk & Alert Status */}
                <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                  <div className="text-[10px] text-zinc-400 uppercase mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-zinc-300">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      IFF / TRANSPONDER READINESS
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-[#090d12] border border-zinc-800 rounded-[2px]">
                      <span className="text-zinc-500 block text-[9px]">MODE-S DISCRETE</span>
                      <strong className="text-emerald-400 block text-[11px] mt-0.5">SYNCHRONIZED</strong>
                    </div>
                    <div className="p-2 bg-[#090d12] border border-zinc-800 rounded-[2px]">
                      <span className="text-zinc-500 block text-[9px]">EMERGENCY (7700)</span>
                      {theaterStats.emergencySquawks.length === 0 ? (
                        <strong className="text-emerald-400 block text-[11px] mt-0.5">0 ALERTS // SECURE</strong>
                      ) : (
                        <strong className="text-rose-400 block text-[11px] mt-0.5">
                          {theaterStats.emergencySquawks.length} ACTIVE SQUAWK
                        </strong>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. High-Priority Operational Airframes (Quick Focus) */}
                {theaterStats.highPrioritySorties.length > 0 && (
                  <div className="p-2.5 bg-[#0d141d] border border-zinc-800/80 rounded-[2px]">
                    <div className="text-[10px] text-zinc-400 uppercase mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-zinc-300">
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        STRATEGIC ASSETS IN FLIGHT
                      </span>
                      <span className="text-[9px] text-zinc-500">QUICK TRACK</span>
                    </div>
                    <div className="space-y-1.5">
                      {theaterStats.highPrioritySorties.slice(0, 4).map((p: any, idx: number) => (
                        <div
                          key={p.id || idx}
                          className="p-2 bg-[#090d12] hover:bg-zinc-800/60 border border-zinc-800 hover:border-cyan-500/60 rounded-[2px] flex items-center justify-between gap-2 transition-all cursor-pointer group"
                          onClick={() => handleSelectAircraft(p)}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.color || '#06b6d4' }}
                              />
                              <span className="text-[11px] font-bold text-white group-hover:text-cyan-300 truncate">
                                {p.callsign || 'UNKNOWN'}
                              </span>
                              <span className="text-[9px] text-zinc-500 font-mono">
                                {p.altitudeLabel || 'FL---'}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-zinc-400 truncate mt-0.5">
                              {p.modelDescription || p.typeCode}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAircraft(p);
                            }}
                            className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/70 text-cyan-300 text-[9.5px] font-bold rounded-[2px] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Crosshair className="w-2.5 h-2.5" />
                            <span>TRACK</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Operator Guidance Card */}
                <div className="p-2.5 bg-cyan-950/20 border border-cyan-800/40 rounded-[2px] text-zinc-300 text-[10.5px]">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TACTICAL RADAR SCOPE INSTRUCTIONS</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[10px]">
                    Select any military aircraft or drone from the map or the airborne sortie stream on the left to display its complete ground-anchored flight trajectory, origin airbase, armament and ordnance capabilities, sensor suites, and live telemetry dossier.
                  </p>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
