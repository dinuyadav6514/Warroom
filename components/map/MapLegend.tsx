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
}) => {
  const router = useRouter();
  const modes: MapMode[] = ['CONFLICTS', 'EVENTS', 'ESCALATION', 'HEATMAP'];

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
    <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 font-mono select-none pointer-events-auto">
      {/* Tactical Military Mode Selector */}
      <div className="bg-[#090d12]/95 border border-zinc-800 px-2 py-1 flex items-center gap-1 shadow-md">
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider mr-1.5 hidden sm:inline">TAC-MODE ::</span>
        {modes.map((m) => {
          const isActive = activePage === 'MAIN' && mapMode === m;
          return (
            <button
              key={m}
              onClick={() => handleModeClick(m)}
              className={`px-2 py-0.5 text-[10px] font-bold tracking-wider transition-colors cursor-pointer rounded-[1px] ${
                isActive
                  ? 'bg-[#365314] text-emerald-200 border border-[#4d7c0f]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              [{m}]
            </button>
          );
        })}
      </div>

      {/* NASA FIRMS Satellite Thermal Anomaly Sensor Toggle */}
      <div className="bg-[#090d12]/95 border border-zinc-800 px-2 py-1 flex items-center shadow-md">
        <button
          onClick={handleFirmsClick}
          className={`px-2 py-0.5 text-[10px] font-bold tracking-wider transition-colors cursor-pointer rounded-[1px] flex items-center gap-1.5 ${
            isFirmsActive
              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/90 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-zinc-800/80'
          }`}
          title="Open NASA FIRMS Near-Real-Time Satellite Thermal & Strike Overlay (VIIRS 375m)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isFirmsActive ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'
            }`}
          />
          <span>[FIRMS THERMAL]</span>
          {isFirmsLoading ? (
            <span className="text-[9px] text-amber-400 animate-pulse">...</span>
          ) : firmsCount !== undefined && firmsCount > 0 ? (
            <span className="text-[9px] text-amber-400/90 font-mono">
              ({firmsCount})
            </span>
          ) : null}
        </button>
      </div>

      {/* Military & Recon ADS-B Radar Tracker Toggle */}
      <div className="bg-[#090d12]/95 border border-zinc-800 px-2 py-1 flex items-center shadow-md">
        <button
          onClick={handleAviationClick}
          className={`px-2 py-0.5 text-[10px] font-bold tracking-wider transition-colors cursor-pointer rounded-[1px] flex items-center gap-1.5 ${
            isAviationActive
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/90 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-zinc-800/80'
          }`}
          title="Open Real-Time Military & Recon Flight Radar (ADS-B Global Transponders)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAviationActive ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-600'
            }`}
          />
          <span>✈ [MIL-AIR RADAR]</span>
          {isAviationLoading ? (
            <span className="text-[9px] text-cyan-400 animate-pulse">...</span>
          ) : aviationCount !== undefined && aviationCount > 0 ? (
            <span className="text-[9px] text-cyan-400/90 font-mono">
              ({aviationCount})
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
};
