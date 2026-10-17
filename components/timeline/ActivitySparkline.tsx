'use client';

import React from 'react';
import { ConflictEvent } from '@/types/conflict';

interface ActivitySparklineProps {
  events: ConflictEvent[];
  windowDays: number;
}

export const ActivitySparkline: React.FC<ActivitySparklineProps> = ({ events, windowDays }) => {
  // Aggregate events by day for the selected window
  const now = new Date();
  const daysMap = new Map<string, { label: string; count: number; dateStr: string }>();

  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    const dayOfMonth = String(d.getUTCDate()).padStart(2, '0');
    daysMap.set(ymd, { label: dayOfMonth, count: 0, dateStr: ymd });
  }

  for (const ev of events) {
    if (ev.eventDate && daysMap.has(ev.eventDate)) {
      const item = daysMap.get(ev.eventDate)!;
      item.count++;
    }
  }

  const daysList = Array.from(daysMap.values());
  const maxCount = Math.max(...daysList.map((d) => d.count), 1);

  return (
    <div className="glass-panel-subtle rounded-2xl border border-white/[0.10] p-3.5 font-mono select-none">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-2 border-b border-white/5">
        <span className="font-semibold text-white">ACTIVITY HISTOGRAM</span>
        <span className="text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px]">
          EVENTS / DAY ({windowDays}D)
        </span>
      </div>

      <div className="mt-3.5 flex items-end justify-between gap-1.5 h-16 px-1">
        {daysList.map((day) => {
          const heightPercent = Math.max(6, Math.round((day.count / maxCount) * 100));
          const isHigh = day.count >= maxCount * 0.7 && day.count > 0;

          return (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 group">
              {/* Tooltip on hover */}
              <div className="text-[9px] text-zinc-500 group-hover:text-cyan-300 transition-colors font-medium">
                {day.count > 0 ? day.count : '·'}
              </div>

              {/* Bar */}
              <div className="w-full bg-white/[0.03] rounded-t-sm overflow-hidden h-11 flex items-end border-b border-white/10">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isHigh
                      ? 'bg-gradient-to-t from-rose-500/80 to-orange-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                      : day.count > 0
                      ? 'bg-gradient-to-t from-cyan-600/70 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-transparent'
                  }`}
                />
              </div>

              {/* Day label */}
              <div className="text-[9px] text-zinc-500 group-hover:text-white transition-colors">
                {day.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
