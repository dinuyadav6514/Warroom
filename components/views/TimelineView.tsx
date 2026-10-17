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
    <div className="glass-panel h-full flex flex-col font-mono text-xs select-none backdrop-blur-2xl border border-white/[0.12] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] m-3">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>GLOBAL INCIDENT TIMELINE // CHRONOLOGICAL LOG</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            ALL REPORTED CONFLICT EVENTS ACROSS RECENT {windowDays}-DAY OPERATIONAL WINDOW
          </div>
        </div>
        <span className="text-cyan-300 font-bold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs">
          {events.length} TOTAL INCIDENTS
        </span>
      </div>

      {/* Sparkline Density */}
      <div className="p-4 border-b border-white/5 bg-white/[0.01]">
        <ActivitySparkline events={events} windowDays={windowDays} />
      </div>

      {/* Vertical Timeline */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <ConflictTimeline events={events} onSelectEvent={onSelectEvent} />
      </div>
    </div>
  );
};
