'use client';

import React, { useState } from 'react';
import { Conflict, ConflictEvent } from '@/types/conflict';
import { Flame, ArrowUpDown, ChevronRight, TrendingUp, Skull } from 'lucide-react';
import { formatRelativeTime } from '@/lib/data/date-utils';

interface ConflictsViewProps {
  conflicts: Conflict[];
  onSelectConflict: (conflict: Conflict) => void;
  onOpenConflictModal: () => void;
  windowDays: number;
}

type SortField = 'activity' | 'fatalities' | 'recent' | 'severity' | 'alphabetical';

export const ConflictsView: React.FC<ConflictsViewProps> = ({
  conflicts,
  onSelectConflict,
  onOpenConflictModal,
  windowDays,
}) => {
  const [sortField, setSortField] = useState<SortField>('activity');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const sortedConflicts = [...conflicts].sort((a, b) => {
    let comp = 0;
    if (sortField === 'activity') comp = b.eventCount7d - a.eventCount7d;
    else if (sortField === 'fatalities') comp = b.fatalities7d - a.fatalities7d;
    else if (sortField === 'severity') comp = b.intensity - a.intensity;
    else if (sortField === 'alphabetical') comp = a.name.localeCompare(b.name);
    else if (sortField === 'recent') {
      const ta = new Date(a.lastEventAt || 0).getTime();
      const tb = new Date(b.lastEventAt || 0).getTime();
      comp = tb - ta;
    }
    return sortDesc ? comp : -comp;
  });

  return (
    <div className="glass-panel h-full flex flex-col font-mono text-xs select-none backdrop-blur-2xl border border-white/[0.12] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] m-3">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>ACTIVE CONFLICT THEATERS // GLOBAL RANKING</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            MEASURED OVER ROLLING {windowDays}-DAY OPERATIONAL WINDOW &bull; {conflicts.length} THEATERS ACTIVE
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-zinc-500 mr-1 font-semibold">SORT:</span>
          {(['activity', 'fatalities', 'severity', 'recent', 'alphabetical'] as const).map((sf) => (
            <button
              key={sf}
              onClick={() => handleSort(sf)}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer font-bold ${
                sortField === sf
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'glass-panel-subtle text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {sf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/5 text-[10px] text-zinc-400 font-bold tracking-wider">
        <div className="col-span-1">RANK</div>
        <div className="col-span-4 sm:col-span-3">THEATER / THEATER NAME</div>
        <div className="col-span-2 hidden sm:block">REGION</div>
        <div className="col-span-2 text-right">EVENTS ({windowDays}D)</div>
        <div className="col-span-2 text-right">FATALITIES</div>
        <div className="col-span-3 sm:col-span-2 text-right">TREND / SEVERITY</div>
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {sortedConflicts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            NO CONFLICT THEATERS IDENTIFIED IN CURRENT FILTER STATE
          </div>
        ) : (
          sortedConflicts.map((c, idx) => {
            const isEscalating = c.status === 'ESCALATING' || c.escalationTrend === 'UP';
            const isDeescalating = c.status === 'DEESCALATING' || c.escalationTrend === 'DOWN';

            return (
              <div
                key={c.id}
                onClick={() => {
                  onSelectConflict(c);
                  onOpenConflictModal();
                }}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-all items-center group"
              >
                {/* Rank */}
                <div className="col-span-1 text-zinc-500 text-[11px] font-bold group-hover:text-cyan-400 transition-colors">
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Name */}
                <div className="col-span-4 sm:col-span-3">
                  <div className="text-white font-bold group-hover:text-cyan-300 transition-colors truncate">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {c.country} &bull; {c.actors.slice(0, 2).join(' vs ')}
                  </div>
                </div>

                {/* Region */}
                <div className="col-span-2 hidden sm:block text-zinc-400 text-[11px] truncate">
                  {c.region}
                </div>

                {/* Events */}
                <div className="col-span-2 text-right text-white font-bold text-[11px]">
                  {c.eventCount7d}
                </div>

                {/* Fatalities */}
                <div className="col-span-2 text-right text-rose-400 font-bold text-[11px]">
                  {c.fatalities7d}
                </div>

                {/* Trend & Severity */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                  <span
                    className={`text-[11px] font-bold ${
                      isEscalating
                        ? 'text-rose-400'
                        : isDeescalating
                        ? 'text-emerald-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {isEscalating ? '↑' : isDeescalating ? '↓' : '→'}
                  </span>

                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${
                      c.intensity >= 70
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : c.intensity >= 45
                        ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {c.intensity >= 70 ? 'CRITICAL' : c.intensity >= 45 ? 'HIGH' : 'MODERATE'}
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-cyan-400 transition-colors ml-1 hidden sm:inline" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
