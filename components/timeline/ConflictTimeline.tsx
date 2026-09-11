'use client';

import React from 'react';
import { ConflictEvent } from '@/types/conflict';
import { formatShortDate } from '@/lib/data/date-utils';
import { AlertCircle, Crosshair, ShieldAlert, ChevronRight } from 'lucide-react';

interface ConflictTimelineProps {
  events: ConflictEvent[];
  onSelectEvent: (event: ConflictEvent) => void;
  selectedEventId?: string;
}

export const ConflictTimeline: React.FC<ConflictTimelineProps> = ({
  events,
  onSelectEvent,
  selectedEventId,
}) => {
  // Group events by date (sorted descending)
  const grouped = new Map<string, ConflictEvent[]>();

  for (const ev of events) {
    const dStr = ev.eventDate || 'Unknown Date';
    if (!grouped.has(dStr)) {
      grouped.set(dStr, []);
    }
    grouped.get(dStr)!.push(ev);
  }

  const dateKeys = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  if (dateKeys.length === 0) {
    return (
      <div className="p-4 text-center font-mono text-text-muted text-xs">
        NO INCIDENTS DOCUMENTED IN CURRENT DATE WINDOW
      </div>
    );
  }

  return (
    <div className="font-mono text-xs select-none space-y-4 pr-1">
      {dateKeys.map((dateStr, dIdx) => {
        const dayEvents = grouped.get(dateStr)!;
        const formattedHeader = formatShortDate(dateStr);

        return (
          <div key={dateStr} className="relative pl-4 border-l border-border/70">
            {/* Timeline Day Header Node */}
            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent-cyan ring-2 ring-panel" />
            <div className="text-[11px] font-bold text-accent-cyan tracking-wider mb-2 flex items-center gap-2">
              <span>{formattedHeader}</span>
              <span className="text-[9px] text-text-muted">({dayEvents.length} incidents)</span>
            </div>

            {/* Events for this day */}
            <div className="space-y-1.5 pl-1">
              {dayEvents.map((ev, eIdx) => {
                const isSelected = selectedEventId === ev.id;
                const isLast = eIdx === dayEvents.length - 1;

                const sevColor =
                  ev.severity === 'CRITICAL'
                    ? 'text-severity-critical'
                    : ev.severity === 'HIGH'
                    ? 'text-severity-high'
                    : ev.severity === 'MODERATE'
                    ? 'text-severity-moderate'
                    : 'text-severity-low';

                return (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className={`w-full text-left p-2 border transition-all flex items-start justify-between group ${
                      isSelected
                        ? 'bg-panel-hover border-accent-cyan shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'bg-panel-subtle border-border/80 hover:border-border-glow hover:bg-panel-hover'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted text-[10px]">{isLast ? '└──' : '├──'}</span>
                        <span className={`text-[10px] font-bold ${sevColor}`}>[{ev.severity}]</span>
                        <span className="text-text-primary font-medium truncate">{ev.eventType}</span>
                      </div>
                      <div className="text-[10px] text-text-secondary pl-6 mt-0.5 truncate">
                        {ev.location} &bull; <span className="text-text-muted">{ev.actor1 || 'Unidentified'}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      {ev.fatalities !== undefined && ev.fatalities > 0 ? (
                        <span className="text-[10px] text-severity-critical font-bold">
                          +{ev.fatalities} KIA
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted">0 KIA</span>
                      )}
                      <ChevronRight className="w-3 h-3 text-text-muted group-hover:text-accent-cyan transition-colors mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
