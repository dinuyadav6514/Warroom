'use client';

import React from 'react';
import { MapMode } from '@/types/conflict';

interface MapLegendProps {
  mapMode: MapMode;
  onChangeMode: (mode: MapMode) => void;
  eventCount?: number;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  mapMode,
  onChangeMode,
}) => {
  const modes: MapMode[] = ['CONFLICTS', 'EVENTS', 'ESCALATION', 'HEATMAP'];

  return (
    <div className="absolute bottom-3 left-3 z-20 flex items-center font-mono select-none pointer-events-auto">
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
    </div>
  );
};
