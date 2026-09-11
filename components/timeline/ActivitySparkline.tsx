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
    <div className="bg-panel-subtle border border-border p-2.5 font-mono select-none">
      <div className="flex items-center justify-between text-[10px] text-text-muted pb-1.5 border-b border-border/60">
        <span>// RECENT ACTIVITY HISTOGRAM</span>
        <span className="text-accent-cyan">EVENTS / DAY (LAST {windowDays}D)</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-1 h-14 px-1">
        {daysList.map((day) => {
          const heightPercent = Math.max(8, Math.round((day.count / maxCount) * 100));
          const isHigh = day.count >= maxCount * 0.7 && day.count > 0;

          return (
            <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip on hover */}
              <div className="text-[9px] text-text-muted group-hover:text-accent-cyan transition-colors">
                {day.count > 0 ? day.count : '·'}
              </div>

              {/* Bar */}
              <div className="w-full bg-border/40 rounded-none overflow-hidden h-10 flex items-end">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full transition-all duration-300 ${
                    isHigh
                      ? 'bg-severity-high group-hover:bg-severity-critical'
                      : day.count > 0
                      ? 'bg-accent-cyan/80 group-hover:bg-accent-cyan'
                      : 'bg-transparent'
                  }`}
                />
              </div>

              {/* Day label */}
              <div className="text-[9px] text-text-secondary group-hover:text-text-primary">
                {day.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
