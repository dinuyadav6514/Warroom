'use client';

import React from 'react';
import { ConflictEvent } from '@/types/conflict';
import { ConflictTimeline } from '../timeline/ConflictTimeline';
import { ActivitySparkline } from '../timeline/ActivitySparkline';
import { Clock } from 'lucide-react';

interface TimelineViewProps {
  events: ConflictEvent[];
  onSelectEvent: (event: ConflictEvent) => void;
  windowDays: number;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  onSelectEvent,
  windowDays,
}) => {
  return (
    <div className="h-full flex flex-col bg-panel font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-border bg-panel-subtle flex items-center justify-between">
        <div>
          <div className="text-accent-cyan font-bold text-sm tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent-cyan" />
            <span>GLOBAL INCIDENT TIMELINE // CHRONOLOGICAL LOG</span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            ALL REPORTED CONFLICT EVENTS ACROSS RECENT {windowDays}-DAY OPERATIONAL WINDOW
          </div>
        </div>
        <span className="text-accent-cyan font-bold">{events.length} TOTAL INCIDENTS</span>
      </div>

      {/* Sparkline Density */}
      <div className="p-3 border-b border-border bg-black/20">
        <ActivitySparkline events={events} windowDays={windowDays} />
      </div>

      {/* Vertical Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <ConflictTimeline events={events} onSelectEvent={onSelectEvent} />
      </div>
    </div>
  );
};
