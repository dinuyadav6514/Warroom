'use client';

import React from 'react';
import { MapMode } from '@/types/conflict';

interface MapLegendProps {
  mapMode: MapMode;
  onChangeMode: (mode: MapMode) => void;
  eventCount?: number;
  showFirms?: boolean;
  onToggleFirms?: () => void;
  firmsCount?: number;
  isFirmsLoading?: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  mapMode,
  onChangeMode,
  showFirms = false,
  onToggleFirms,
  firmsCount,
  isFirmsLoading = false,
}) => {
  const modes: MapMode[] = ['CONFLICTS', 'EVENTS', 'ESCALATION', 'HEATMAP'];

  return (
    <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 font-mono select-none pointer-events-auto">
      {/* Tactical Military Mode Selector */}
      <div className="bg-[#090d12]/95 border border-zinc-800 px-2 py-1 flex items-center gap-1 shadow-md">
        <span className="text-[10px] text-zinc-500 font-bold tracking-wider mr-1.5 hidden sm:inline">TAC-MODE ::</span>
        {modes.map((m) => {
          const isActive = mapMode === m;
          return (
            <button
              key={m}
              onClick={() => onChangeMode(m)}
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
      {onToggleFirms && (
        <div className="bg-[#090d12]/95 border border-zinc-800 px-2 py-1 flex items-center shadow-md">
          <button
            onClick={onToggleFirms}
            className={`px-2 py-0.5 text-[10px] font-bold tracking-wider transition-colors cursor-pointer rounded-[1px] flex items-center gap-1.5 ${
              showFirms
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/90 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 border border-zinc-800/80'
            }`}
            title="Toggle NASA FIRMS Near-Real-Time Satellite Thermal & Strike Overlay (VIIRS 375m)"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                showFirms ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span>[FIRMS THERMAL]</span>
            {isFirmsLoading ? (
              <span className="text-[9px] text-amber-400 animate-pulse">...</span>
            ) : showFirms && firmsCount !== undefined && firmsCount > 0 ? (
              <span className="text-[9px] text-amber-400/90 font-mono">
                ({firmsCount})
              </span>
            ) : null}
          </button>
        </div>
      )}
    </div>
  );
};
