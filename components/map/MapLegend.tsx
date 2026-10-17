'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapMode } from '@/types/conflict';

export type ActiveNavPage = 'MAIN' | 'FIRMS' | 'RADAR';

interface MapLegendProps {
  mapMode?: MapMode;
  onChangeMode?: (mode: MapMode) => void;
  eventCount?: number;
  activePage?: ActiveNavPage;
  showFirms?: boolean;
  onToggleFirms?: () => void;
  firmsCount?: number;
  isFirmsLoading?: boolean;
  showAviation?: boolean;
  onToggleAviation?: () => void;
  aviationCount?: number;
  isAviationLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  mapMode = 'CONFLICTS',
  onChangeMode,
  activePage = 'MAIN',
  showFirms = false,
  onToggleFirms,
  firmsCount,
  isFirmsLoading = false,
  showAviation = false,
  onToggleAviation,
  aviationCount,
  isAviationLoading = false,
  className,
  style,
}) => {
  const router = useRouter();
  const modes: MapMode[] = ['CONFLICTS', 'EVENTS', 'ESCALATION'];

  const handleModeClick = (m: MapMode) => {
    if (activePage === 'MAIN') {
      onChangeMode?.(m);
    } else {
      router.push(`/?mode=${m.toLowerCase()}`);
    }
  };

  const handleFirmsClick = () => {
    if (activePage === 'FIRMS') {
      onToggleFirms?.();
    } else {
      router.push('/firms');
    }
  };

  const handleAviationClick = () => {
    if (activePage === 'RADAR') {
      onToggleAviation?.();
    } else {
      router.push('/radar');
    }
  };

  const isFirmsActive = activePage === 'FIRMS' || showFirms;
  const isAviationActive = activePage === 'RADAR' || showAviation;

  return (
    <div
      style={style}
      className={`absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2.5 font-mono select-none pointer-events-auto transition-all duration-300 ${
        className || ''
      }`}
    >
      {/* Tactical Military Mode Selector */}
      <div className="glass-panel rounded-full px-2.5 py-1.5 flex items-center gap-1.5 shadow-xl border border-white/10 backdrop-blur-md">
        <span className="text-[10px] text-zinc-400 font-semibold tracking-wider px-1 hidden sm:inline">MODE:</span>
        {modes.map((m) => {
          const isActive = activePage === 'MAIN' && mapMode === m;
          return (
            <button
              key={m}
              onClick={() => handleModeClick(m)}
              className={`px-2.5 py-1 text-[10px] font-bold tracking-wider transition-all duration-200 cursor-pointer rounded-full ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* NASA FIRMS Satellite Thermal Anomaly Sensor Toggle */}
      <div className="glass-panel rounded-full p-1 flex items-center shadow-xl border border-white/10 backdrop-blur-md">
        <button
          onClick={handleFirmsClick}
          className={`px-3 py-1.5 text-[10px] font-bold tracking-wider transition-all duration-200 cursor-pointer rounded-full flex items-center gap-2 ${
            isFirmsActive
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
          title="Open NASA FIRMS Near-Real-Time Satellite Thermal & Strike Overlay (VIIRS 375m)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isFirmsActive ? 'bg-amber-400 animate-pulse ring-2 ring-amber-400/30' : 'bg-zinc-500'
            }`}
          />
          <span>FIRMS THERMAL</span>
          {isFirmsLoading ? (
            <span className="text-[9px] text-amber-400 animate-pulse">...</span>
          ) : firmsCount !== undefined && firmsCount > 0 ? (
            <span className="text-[9px] text-amber-300/90 font-mono px-1 py-0.2 rounded-full bg-amber-500/10">
              {firmsCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Military & Recon ADS-B Radar Tracker Toggle */}
      <div className="glass-panel rounded-full p-1 flex items-center shadow-xl border border-white/10 backdrop-blur-md">
        <button
          onClick={handleAviationClick}
          className={`px-3 py-1.5 text-[10px] font-bold tracking-wider transition-all duration-200 cursor-pointer rounded-full flex items-center gap-2 ${
            isAviationActive
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
          }`}
          title="Open Real-Time Military & Recon Flight Radar (ADS-B Global Transponders)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAviationActive ? 'bg-cyan-400 animate-pulse ring-2 ring-cyan-400/30' : 'bg-zinc-500'
            }`}
          />
          <span>MIL-AIR RADAR</span>
          {isAviationLoading ? (
            <span className="text-[9px] text-cyan-400 animate-pulse">...</span>
          ) : aviationCount !== undefined && aviationCount > 0 ? (
            <span className="text-[9px] text-cyan-300/90 font-mono px-1 py-0.2 rounded-full bg-cyan-500/10">
              {aviationCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
};
