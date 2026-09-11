'use client';

import React from 'react';
import { MapMode } from '@/types/conflict';

interface MapLegendProps {
  mapMode: MapMode;
  onChangeMode: (mode: MapMode) => void;
  eventCount: number;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  mapMode,
  onChangeMode,
  eventCount,
}) => {
  const modes: MapMode[] = ['CONFLICTS', 'EVENTS', 'ESCALATION', 'HEATMAP'];

  return (
    <div className="absolute bottom-3 left-3 z-20 flex flex-col gap-2 font-mono select-none pointer-events-auto">
      {/* Map Mode Selector */}
      <div className="bg-panel/95 border border-border px-2 py-1 flex items-center gap-1 shadow-lg backdrop-blur-sm">
        <span className="text-[10px] text-text-muted mr-1.5 hidden sm:inline">MODE ::</span>
        {modes.map((m) => {
          const isActive = mapMode === m;
          return (
            <button
              key={m}
              onClick={() => onChangeMode(m)}
              className={`px-2 py-0.5 text-[10px] font-bold transition-colors ${
                isActive
                  ? 'bg-accent-cyan text-black shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-panel-hover'
              }`}
            >
              [{m}]
            </button>
          );
        })}
      </div>

      {/* Terminal Map Legend */}
      <div className="bg-panel/95 border border-border px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-text-muted pb-1 border-b border-border/60">
          <span>// MAP LEGEND</span>
          <span className="text-accent-cyan">{eventCount} PLOTTED</span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1e3a5f] border border-[#2563eb] shadow-[0_0_5px_#2563eb]" />
            <span className="text-text-primary">GENERAL NEWS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-severity-critical shadow-[0_0_5px_#ef4444]" />
            <span className="text-text-primary">CRITICAL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-severity-high shadow-[0_0_5px_#f97316]" />
            <span className="text-text-primary">HIGH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-severity-moderate shadow-[0_0_5px_#eab308]" />
            <span className="text-text-primary">MODERATE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-severity-low shadow-[0_0_5px_#38bdf8]" />
            <span className="text-text-primary">LOW</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[9px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#1e3a5f] border border-[#2563eb]" />
            NEWS DOT
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-severity-critical animate-ping opacity-75" />
            &lt;24H PULSE
          </span>
        </div>
      </div>
    </div>
  );
};
