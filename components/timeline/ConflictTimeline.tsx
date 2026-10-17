'use client';

import React from 'react';
import { ConflictEvent } from '@/types/conflict';
import { formatShortDate } from '@/lib/data/date-utils';
import { ChevronRight } from 'lucide-react';

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
      <div className="p-4 text-center font-mono text-zinc-500 text-xs">
        NO INCIDENTS DOCUMENTED IN CURRENT DATE WINDOW
      </div>
    );
  }

  return (
    <div className="font-mono text-xs select-none space-y-4 pr-1">
      {dateKeys.map((dateStr) => {
        const dayEvents = grouped.get(dateStr)!;
        const formattedHeader = formatShortDate(dateStr);

        return (
          <div key={dateStr} className="relative pl-5 border-l border-white/10">
            {/* Timeline Day Header Node */}
            <div className="absolute -left-[5px] top-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <div className="text-[11px] font-bold text-white tracking-wider mb-2.5 flex items-center gap-2">
              <span className="text-cyan-300">{formattedHeader}</span>
              <span className="text-[9.5px] text-zinc-500 font-normal">({dayEvents.length} incidents)</span>
            </div>

            {/* Events for this day */}
            <div className="space-y-2">
              {dayEvents.map((ev) => {
                const isSelected = selectedEventId === ev.id;

                const sevColor =
                  ev.severity === 'CRITICAL'
                    ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
                    : ev.severity === 'HIGH'
                    ? 'text-orange-300 bg-orange-500/15 border-orange-500/30'
                    : ev.severity === 'MODERATE'
                    ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                    : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';

                return (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between group cursor-pointer ${
                      isSelected
                        ? 'glass-panel border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'glass-panel-subtle border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.2 rounded-full border font-bold ${sevColor}`}>
                          {ev.severity}
                        </span>
                        <span className="text-white font-medium truncate text-[11.5px]">{ev.eventType}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 truncate">
                        {ev.location} &bull; <span className="text-zinc-500">{ev.actor1 || 'Unidentified'}</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      {ev.fatalities !== undefined && ev.fatalities > 0 ? (
                        <span className="text-[10px] text-rose-400 font-bold">
                          +{ev.fatalities} KIA
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">0 KIA</span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 transition-colors mt-1" />
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
