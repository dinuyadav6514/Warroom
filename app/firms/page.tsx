'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FirmsMap } from '@/components/map/FirmsMap';
import { IsometricRadarGlobe } from '@/components/navigation/IsometricRadarGlobe';
import {
  Radio,
  RefreshCw,
  Globe,
  Flame,
  Filter,
  Layers,
  ChevronRight,
  Crosshair,
  ExternalLink,
  Satellite,
  Clock,
} from 'lucide-react';

export default function FirmsPage() {
  const [utcClock, setUtcClock] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [firmsGeoJson, setFirmsGeoJson] = useState<any>(null);
  const [firmsCount, setFirmsCount] = useState<number>(0);
  const [isFirmsLoading, setIsFirmsLoading] = useState<boolean>(true);
  const [selectedTheater, setSelectedTheater] = useState<string>('ALL');
  const [minFrp, setMinFrp] = useState<number>(0);
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);

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

  // Fetch FIRMS Data
  const loadFirmsData = useCallback(async (force = false) => {
    setIsFirmsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/firms${force ? '?force=true' : ''}`);
      const data = await res.json();
      if (data.success && data.geojson) {
        setFirmsGeoJson(data.geojson);
        setFirmsCount(data.count || data.geojson.features?.length || 0);
      }
    } catch (e) {
      console.warn('Failed to load NASA FIRMS data:', e);
    } finally {
      setIsFirmsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFirmsData(false);
  }, [loadFirmsData]);

  // Extract features array
  const allFeatures = useMemo(() => {
    if (!firmsGeoJson?.features) return [];
    return firmsGeoJson.features;
  }, [firmsGeoJson]);

  // Extract unique theaters
  const availableTheaters = useMemo(() => {
    const set = new Set<string>();
    for (const f of allFeatures) {
      if (f.properties?.theater) set.add(f.properties.theater);
    }
    return ['ALL', ...Array.from(set)];
  }, [allFeatures]);

  // Filter features
  const filteredFeatures = useMemo(() => {
    return allFeatures.filter((f: any) => {
      const p = f.properties || {};
      if (selectedTheater !== 'ALL' && p.theater !== selectedTheater) return false;
      if (minFrp > 0 && Number(p.frp || 0) < minFrp) return false;
      return true;
    });
  }, [allFeatures, selectedTheater, minFrp]);

  // Top FRP hotspots
  const topHotspots = useMemo(() => {
    return [...filteredFeatures].sort((a: any, b: any) => {
      return Number(b.properties?.frp || 0) - Number(a.properties?.frp || 0);
    });
  }, [filteredFeatures]);

  // Filtered GeoJSON passed to map
  const activeMapGeoJson = useMemo(() => {
    if (!firmsGeoJson) return null;
    return {
      type: 'FeatureCollection',
      features: filteredFeatures,
    };
  }, [firmsGeoJson, filteredFeatures]);

  const handleHotspotClick = (props: any, coords: [number, number]) => {
    setSelectedHotspot(props);
    setTargetLocation([coords[1], coords[0]]); // [lat, lng]
  };

  return (
    <div className="flex flex-col h-screen bg-[#070a0d] text-[#e6edf3] font-mono overflow-hidden select-none">
      {/* ── TOP HEADER (Days & Pipeline filters removed) ── */}
      <header className="h-12 bg-panel border-b border-border px-3 md:px-4 flex items-center justify-between z-30 font-mono select-none gap-2 shrink-0">
        {/* Logo & Title */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-bold text-sm md:text-base text-text-primary tracking-wider">
              WARROOM
            </span>
            <span className="text-border-glow text-xs hidden sm:inline">//</span>
            <span className="text-xs text-amber-400 font-bold tracking-widest hidden md:inline">
              NASA FIRMS THERMAL SENSOR RADAR
            </span>
          </div>

          {/* Satellite Sensor Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/40 border border-amber-800/60 rounded-[2px] text-[10px] text-amber-300">
            <Satellite className="w-3 h-3 text-amber-400" />
            <span>VIIRS 375m // NOAA-20 & SUOMI-NPP (24H NRT)</span>
          </div>
        </div>

        {/* Right Section: World Time & Refresh */}
        <div className="flex items-center gap-2 md:gap-3 text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 text-text-secondary bg-panel-subtle/80 px-2 py-1 border border-border/80 rounded-[2px]">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-muted-foreground text-[10px] hidden md:inline">WORLD TIME ::</span>
            <span className="text-text-primary font-bold text-[10.5px] md:text-[11px] tracking-wide">
              {utcClock}
            </span>
          </div>

          <button
            onClick={() => loadFirmsData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 active:bg-amber-700/30 border border-amber-600/70 hover:border-amber-500 text-amber-400 text-[10.5px] md:text-[11px] font-bold tracking-wider rounded-[2px] transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.18)] disabled:opacity-50"
            title="Force refresh NASA FIRMS satellite data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'SYNCING...' : 'REFRESH SATELLITE'}</span>
            <span className="sm:hidden">{isRefreshing ? '...' : 'REFRESH'}</span>
          </button>
        </div>
      </header>

      {/* ── FIRMS FILTER BAR (No days / pipelines filter) ── */}
      <div className="bg-[#0b0f14] border-b border-border/80 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0 z-20">
        <div className="flex flex-wrap items-center gap-2">
          {/* Theater Filter */}
          <div className="flex items-center gap-1 bg-panel-subtle px-2 py-0.5 border border-border">
            <Filter className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-text-secondary mr-1">THEATER:</span>
            <select
              value={selectedTheater}
              onChange={(e) => setSelectedTheater(e.target.value)}
              aria-label="Filter by operational theater"
              className="bg-transparent text-amber-300 text-[10.5px] font-bold focus:outline-none cursor-pointer"
            >
              {availableTheaters.map((th) => (
                <option key={th} value={th} className="bg-[#0f172a] text-zinc-200">
                  {th}
                </option>
              ))}
            </select>
          </div>

          {/* Min FRP Threshold */}
          <div className="flex items-center gap-1 bg-panel-subtle px-2 py-0.5 border border-border">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] text-text-secondary mr-1">POWER (FRP):</span>
            <div className="flex items-center gap-1 text-[10px]">
              {[
                { label: 'ALL', val: 0 },
                { label: '>10MW', val: 10 },
                { label: '>25MW', val: 25 },
                { label: '>50MW', val: 50 },
                { label: '>100MW (BLAST)', val: 100 },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setMinFrp(item.val)}
                  className={`px-1.5 py-0.5 transition-colors cursor-pointer rounded-[1px] ${
                    minFrp === item.val
                      ? 'bg-amber-500 text-black font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hotspot Count Counter */}
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>SENSED HOTSPOTS:</span>
            <strong className="text-amber-400 font-bold text-xs">{filteredFeatures.length}</strong>
            {filteredFeatures.length !== firmsCount && (
              <span className="text-[10px] text-zinc-500">/ {firmsCount} TOTAL</span>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Feed Sidebar */}
        <aside className="w-72 md:w-80 bg-panel border-r border-border h-full flex flex-col font-mono text-xs select-none shrink-0 z-10">
          {/* Sidebar Header */}
          <div className="p-2.5 border-b border-border flex items-center justify-between text-text-secondary shrink-0 bg-panel-subtle/50">
            <span className="text-amber-400 tracking-widest text-[11px] font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              // THERMAL SIGNATURE FEED
            </span>
            <span className="text-[10px] text-text-muted">NRT.VIIRS</span>
          </div>

          {/* Hotspot Scroll List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isFirmsLoading ? (
              <div className="p-4 text-center text-amber-400/80 animate-pulse text-xs">
                Acquiring NASA FIRMS satellite observations...
              </div>
            ) : topHotspots.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-xs">
                No thermal anomalies match the active filter criteria.
              </div>
            ) : (
              topHotspots.map((feat: any, idx: number) => {
                const p = feat.properties || {};
                const coords = feat.geometry?.coordinates || [0, 0];
                const frpNum = Number(p.frp || 0);
                const frpBadgeColor =
                  frpNum > 80
                    ? 'border-red-500 text-red-400 bg-red-950/40'
                    : frpNum > 30
                    ? 'border-orange-500 text-orange-400 bg-orange-950/40'
                    : 'border-amber-500 text-amber-400 bg-amber-950/40';

                return (
                  <div
                    key={p.id || idx}
                    onClick={() => handleHotspotClick(p, coords)}
                    className="p-2 bg-[#090d12] hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-amber-600/70 transition-all cursor-pointer rounded-[2px] group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-zinc-200 group-hover:text-amber-300 transition-colors truncate">
                        {p.theater || 'Active Conflict Zone'}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded border ${frpBadgeColor}`}
                      >
                        {p.frp} MW
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9.5px] text-zinc-400">
                      <div>
                        TEMP: <span className="text-zinc-200">{p.brightness} K</span>
                      </div>
                      <div>
                        CONF: <span className="text-emerald-400">{p.confidence?.toUpperCase()}</span>
                      </div>
                      <div>
                        TIME: <span className="text-sky-300">{p.acqTime} UTC</span>
                      </div>
                      <div>
                        PASS: <span className="text-amber-400">{p.daynight === 'D' ? 'DAY' : 'NIGHT'}</span>
                      </div>
                    </div>

                    <div className="mt-1.5 pt-1 border-t border-zinc-800/60 flex items-center justify-between text-[9px] text-zinc-500">
                      <span>{Number(p.latitude).toFixed(3)}°, {Number(p.longitude).toFixed(3)}°</span>
                      <span className="group-hover:text-amber-400 transition-colors flex items-center gap-0.5">
                        <Crosshair className="w-2.5 h-2.5" />
                        TRACK
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Map Center */}
        <main className="flex-1 h-full relative overflow-hidden">
          <FirmsMap
            firmsGeoJson={activeMapGeoJson}
            firmsCount={filteredFeatures.length}
            isFirmsLoading={isFirmsLoading}
            targetLocation={targetLocation}
            onSelectHotspot={setSelectedHotspot}
          />
        </main>
      </div>
    </div>
  );
}
