'use client';

import React from 'react';
import { ConflictEvent } from '@/types/conflict';
import { Radio, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, RefreshCw, PanelRightClose } from 'lucide-react';

interface LiveEventStreamProps {
  events: ConflictEvent[];
  onSelectEvent: (event: ConflictEvent) => void;
  selectedEventId?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const LiveEventStream: React.FC<LiveEventStreamProps> = ({
  events,
  onSelectEvent,
  selectedEventId,
  onRefresh,
  isRefreshing = false,
  onToggleCollapse,
  isCollapsed = false,
}) => {
  // Sort newest first
  const sorted = [...events].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.eventDate).getTime();
    const timeB = new Date(b.timestamp || b.eventDate).getTime();
    return timeB - timeA;
  });

  const formatTimeOrDate = (ev: ConflictEvent) => {
    if (ev.timestamp && ev.timestamp.includes('T')) {
      const parts = ev.timestamp.split('T')[1].split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    return ev.eventDate || 'N/A';
  };

  // Collapsed Minimal Strip
  if (isCollapsed) {
    return (
      <div
        onClick={onToggleCollapse}
        className="w-full h-full bg-panel border-l border-border flex md:flex-col items-center justify-between md:justify-start px-3 py-1.5 md:px-0 md:py-3 cursor-pointer hover:bg-panel-hover text-text-secondary hover:text-accent-cyan transition-colors select-none group"
        title="Expand Live Conflict Stream Panel"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleCollapse) onToggleCollapse();
          }}
          className="p-1 rounded hover:bg-cyan-950/60 text-accent-cyan md:mb-3"
          title="Expand Stream"
        >
          <ChevronLeft className="hidden md:inline w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <ChevronUp className="md:hidden w-4 h-4" />
        </button>

        {/* Vertical text on desktop, horizontal on mobile */}
        <div className="hidden md:flex items-center gap-2 [writing-mode:vertical-rl] rotate-180 text-[10px] font-bold tracking-widest text-text-secondary group-hover:text-accent-cyan">
          <Radio className="w-3 h-3 text-accent-green inline rotate-90 animate-pulse" />
          <span>// LIVE CONFLICT STREAM</span>
          <span className="text-text-muted font-mono">[{events.length}]</span>
        </div>

        {/* Horizontal text on mobile */}
        <div className="md:hidden flex items-center gap-2 text-[10px] font-bold text-accent-cyan">
          <Radio className="w-3 h-3 text-accent-green animate-pulse" />
          <span>// LIVE STREAM [{events.length} RECENT]</span>
        </div>

        <span className="md:hidden text-[10px] text-text-muted">[TAP TO EXPAND]</span>
      </div>
    );
  }

  return (
    <div className="glass-panel border border-white/[0.12] h-full flex flex-col font-mono text-xs select-none backdrop-blur-2xl rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-white tracking-wider">
            LIVE CONFLICT STREAM
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 hover:text-white text-zinc-400 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              title="Query live news feeds for latest events"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}

          <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
            {events.length} RECENT
          </span>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:text-white text-zinc-400 hover:bg-white/10 rounded-full transition-colors cursor-pointer ml-1"
              title="Collapse Live Stream Panel"
            >
              <ChevronRight className="hidden md:inline w-3.5 h-3.5" />
              <ChevronDown className="md:hidden w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {sorted.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-[11px]">
            NO ACTIVE EVENTS DETECTED IN WINDOW
          </div>
        ) : (
          sorted.map((ev) => {
            const isSelected = selectedEventId === ev.id;
            const sevColor =
              ev.severity === 'CRITICAL'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : ev.severity === 'HIGH'
                ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                : ev.severity === 'MODERATE'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

            const headline = ev.notes ? ev.notes.split('.')[0] : ev.eventType;
            const category = ev.primaryCategory || ev.eventType;
            const categoryBadge =
              category === 'Warfare & Combat'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                : category === 'Defense & Strategy'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : category === 'Geopolitics & Policy'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : category === 'Economy & Global'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-white/5 text-zinc-400 border-white/10';

            return (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`w-full p-2.5 text-left transition-all cursor-pointer group rounded-xl border ${
                  isSelected
                    ? 'glass-panel border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'glass-panel-subtle border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500">[{formatTimeOrDate(ev)}]</span>
                    <span className={`text-[9px] px-2 py-0.2 rounded-full border font-bold ${sevColor}`}>
                      {ev.severity}
                    </span>
                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded-full border font-semibold ${categoryBadge}`}>
                      {category.split(' ')[0]}
                    </span>
                    {ev.confidenceLabel && (
                      <span className={`text-[8px] px-1.5 py-0.2 font-mono font-bold rounded-full border ${
                        (ev.confidenceScore ?? 0) >= 0.70
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/5 text-zinc-400 border-white/10'
                      }`}>
                        {(ev.confidenceScore ?? 0) >= 0.70 ? '✓' : '•'} {Math.round((ev.confidenceScore ?? 0.4) * 100)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-cyan-300 transition-colors font-medium">
                    {ev.country}
                  </span>
                </div>

                <div className="text-[11.5px] font-medium text-white line-clamp-2 leading-snug">
                  {headline}
                </div>

                <div className="text-[10px] text-zinc-400 truncate mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>{ev.location}</span>
                    {ev.mergedCount && ev.mergedCount > 1 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-full">
                        +{ev.mergedCount - 1} SOURCES
                      </span>
                    )}
                  </div>
                  {ev.fatalities !== undefined && ev.fatalities > 0 && (
                    <span className="text-rose-400 font-bold">+{ev.fatalities} KIA</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};