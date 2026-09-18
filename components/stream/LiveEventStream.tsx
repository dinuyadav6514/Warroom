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
    <div className="bg-panel border border-border h-full flex flex-col font-mono text-xs select-none">
      <div className="p-2.5 border-b border-border flex items-center justify-between bg-panel-subtle">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-accent-green animate-pulse" />
          <span className="text-[11px] font-bold text-accent-cyan tracking-wider">
            // LIVE CONFLICT STREAM
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 hover:text-accent-cyan text-text-muted hover:bg-panel-hover transition-colors disabled:opacity-50 cursor-pointer"
              title="Query live news feeds for latest events"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-accent-cyan' : ''}`} />
            </button>
          )}
          <span className="text-[10px] text-text-muted font-mono">{events.length} RECENT</span>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:text-accent-cyan text-text-muted hover:bg-panel-hover transition-colors cursor-pointer ml-1"
              title="Collapse Live Stream Panel"
            >
              <ChevronRight className="hidden md:inline w-3.5 h-3.5" />
              <ChevronDown className="md:hidden w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-border/40">
        {sorted.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-[11px]">
            NO ACTIVE EVENTS DETECTED IN WINDOW
          </div>
        ) : (
          sorted.map((ev) => {
            const isSelected = selectedEventId === ev.id;
            const sevColor =
              ev.severity === 'CRITICAL'
                ? 'bg-severity-critical/20 text-severity-critical border-severity-critical/50'
                : ev.severity === 'HIGH'
                ? 'bg-severity-high/20 text-severity-high border-severity-high/50'
                : ev.severity === 'MODERATE'
                ? 'bg-severity-moderate/20 text-severity-moderate border-severity-moderate/50'
                : 'bg-severity-low/20 text-severity-low border-severity-low/50';

            const headline = ev.notes ? ev.notes.split('.')[0] : ev.eventType;
            const category = ev.primaryCategory || ev.eventType;
            const categoryBadge =
              category === 'Warfare & Combat'
                ? 'bg-red-950/40 text-severity-critical border-red-800/40'
                : category === 'Defense & Strategy'
                ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                : category === 'Geopolitics & Policy'
                ? 'bg-blue-950/40 text-blue-400 border-blue-800/40'
                : category === 'Economy & Global'
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                : 'bg-panel-subtle text-text-muted border-border';

            return (
              <button
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className={`w-full pt-2 pb-1.5 px-1.5 text-left transition-colors cursor-pointer group rounded-[2px] ${
                  isSelected ? 'bg-panel-hover border-l-2 border-accent-cyan' : 'hover:bg-panel-subtle'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-muted">[{formatTimeOrDate(ev)}]</span>
                    <span className={`text-[9px] px-1.5 py-0.2 border font-bold ${sevColor}`}>
                      {ev.severity}
                    </span>
                    <span className={`text-[8.5px] px-1 py-0.2 border font-semibold ${categoryBadge}`}>
                      {category.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted group-hover:text-accent-cyan">
                    {ev.country}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-text-primary line-clamp-2 leading-snug">
                  {headline}
                </div>

                <div className="text-[10px] text-text-secondary truncate mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>{ev.location}</span>
                    {ev.mergedCount && ev.mergedCount > 1 && (
                      <span className="text-[9px] font-bold px-1 py-0.2 bg-cyan-950/80 border border-cyan-800 text-accent-cyan rounded-[2px]">
                        +{ev.mergedCount - 1} SOURCES
                      </span>
                    )}
                  </div>
                  {ev.fatalities !== undefined && ev.fatalities > 0 && (
                    <span className="text-severity-critical font-bold">+{ev.fatalities} KIA</span>
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