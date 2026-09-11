'use client';

import React from 'react';
import { Conflict } from '@/types/conflict';
import { TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface EscalationViewProps {
  conflicts: Conflict[];
  onSelectConflict: (conflict: Conflict) => void;
  onOpenConflictModal: () => void;
  windowDays: number;
}

export const EscalationView: React.FC<EscalationViewProps> = ({
  conflicts,
  onSelectConflict,
  onOpenConflictModal,
  windowDays,
}) => {
  // Sort by escalationIndex descending
  const sorted = [...conflicts].sort((a, b) => b.escalationIndex - a.escalationIndex);

  return (
    <div className="h-full flex flex-col bg-panel font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-border bg-panel-subtle flex items-center justify-between">
        <div>
          <div className="text-accent-cyan font-bold text-sm tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-severity-critical" />
            <span>THEATER ESCALATION MONITOR // MEASURED VELOCITY</span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            COMPARING OBSERVED 24-HOUR INCIDENT FREQUENCY TO PRECEDING BASELINE DAYS &bull; STRICTLY NON-PREDICTIVE
          </div>
        </div>
      </div>

      {/* List of Theaters */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {sorted.map((conflict) => {
          const isUp = conflict.escalationTrend === 'UP';
          const isDown = conflict.escalationTrend === 'DOWN';

          return (
            <div
              key={conflict.id}
              onClick={() => {
                onSelectConflict(conflict);
                onOpenConflictModal();
              }}
              className="p-3 bg-panel-subtle hover:bg-panel-hover border border-border hover:border-accent-cyan/60 cursor-pointer transition-all space-y-2 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1 border ${
                      isUp
                        ? 'bg-red-950/50 text-severity-critical border-red-800/60'
                        : isDown
                        ? 'bg-blue-950/50 text-severity-low border-blue-800/60'
                        : 'bg-panel text-text-muted border-border'
                    }`}
                  >
                    {isUp ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : isDown ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-text-primary group-hover:text-accent-cyan transition-colors">
                      {conflict.name}
                    </span>
                    <span className="text-[10px] text-text-muted ml-2">
                      {conflict.country} &bull; {conflict.region}
                    </span>
                  </div>
                </div>

                {/* Index Pill */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-[9px] text-text-muted">ESCALATION INDEX</div>
                    <div className="text-base font-bold text-text-primary">
                      {conflict.escalationIndex}
                      <span className="text-xs text-text-muted">/100</span>
                    </div>
                  </div>

                  <div
                    className={`px-2 py-1 text-[11px] font-bold border ${
                      conflict.escalationIndex >= 70
                        ? 'bg-red-950/50 text-severity-critical border-red-800/80'
                        : conflict.escalationIndex >= 45
                        ? 'bg-orange-950/50 text-severity-high border-orange-800/80'
                        : 'bg-yellow-950/50 text-severity-moderate border-yellow-800/80'
                    }`}
                  >
                    {conflict.status}
                  </div>
                </div>
              </div>

              {/* Factual Velocity Reason */}
              <div className="text-[11px] text-text-secondary leading-relaxed bg-black/30 p-2 border-l-2 border-accent-cyan">
                {conflict.escalationReason}
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
                <div className="flex items-center gap-3">
                  <span>TOTAL EVENTS ({windowDays}D): <strong className="text-text-primary">{conflict.eventCount7d}</strong></span>
                  <span>FATALITIES: <strong className="text-severity-critical">{conflict.fatalities7d}</strong></span>
                </div>
                <span className="text-accent-cyan group-hover:underline">VIEW THEATER AUDIT &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
