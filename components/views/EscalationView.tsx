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
    <div className="glass-panel h-full flex flex-col font-mono text-xs select-none backdrop-blur-2xl border border-white/[0.12] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] m-3">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span>THEATER ESCALATION MONITOR // MEASURED VELOCITY</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            COMPARING OBSERVED 24-HOUR INCIDENT FREQUENCY TO PRECEDING BASELINE DAYS &bull; STRICTLY NON-PREDICTIVE
          </div>
        </div>
      </div>

      {/* List of Theaters */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
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
              className="p-4 rounded-xl glass-panel-subtle border border-white/5 hover:border-white/20 cursor-pointer transition-all space-y-3 group shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span
                    className={`p-1.5 rounded-lg border ${
                      isUp
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : isDown
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-white/5 text-zinc-400 border-white/10'
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
                    <span className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {conflict.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-2">
                      {conflict.country} &bull; {conflict.region}
                    </span>
                  </div>
                </div>

                {/* Index Pill */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-[9px] text-zinc-400">ESCALATION INDEX</div>
                    <div className="text-base font-bold text-white">
                      {conflict.escalationIndex}
                      <span className="text-xs text-zinc-500">/100</span>
                    </div>
                  </div>

                  <div
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                      conflict.escalationIndex >= 70
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : conflict.escalationIndex >= 45
                        ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {conflict.status}
                  </div>
                </div>
              </div>

              {/* Factual Velocity Reason */}
              <div className="text-[11.5px] text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded-lg border-l-2 border-cyan-400">
                {conflict.escalationReason}
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                <div className="flex items-center gap-3">
                  <span>TOTAL EVENTS ({windowDays}D): <strong className="text-white">{conflict.eventCount7d}</strong></span>
                  <span>FATALITIES: <strong className="text-rose-400">{conflict.fatalities7d}</strong></span>
                </div>
                <span className="text-cyan-400 group-hover:underline font-semibold flex items-center gap-1">
                  VIEW THEATER AUDIT &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
