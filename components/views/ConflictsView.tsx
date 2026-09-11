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
    <div className="h-full flex flex-col bg-panel font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-border bg-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-accent-cyan font-bold text-sm tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-severity-critical" />
            <span>ACTIVE CONFLICT THEATERS // GLOBAL RANKING</span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            MEASURED OVER ROLLING {windowDays}-DAY OPERATIONAL WINDOW &bull; {conflicts.length} THEATERS ACTIVE
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-text-muted mr-1">SORT:</span>
          {(['activity', 'fatalities', 'severity', 'recent', 'alphabetical'] as const).map((sf) => (
            <button
              key={sf}
              onClick={() => handleSort(sf)}
              className={`px-2 py-1 border transition-colors ${
                sortField === sf
                  ? 'bg-accent-cyan text-black font-bold border-accent-cyan'
                  : 'bg-panel-subtle text-text-secondary hover:text-text-primary border-border'
              }`}
            >
              {sf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-black/40 border-b border-border text-[10px] text-text-muted font-bold tracking-wider">
        <div className="col-span-1">RANK</div>
        <div className="col-span-4 sm:col-span-3">THEATER / THEATER NAME</div>
        <div className="col-span-2 hidden sm:block">REGION</div>
        <div className="col-span-2 text-right">EVENTS ({windowDays}D)</div>
        <div className="col-span-2 text-right">FATALITIES</div>
        <div className="col-span-3 sm:col-span-2 text-right">TREND / SEVERITY</div>
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {sortedConflicts.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-xs">
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
                className="grid grid-cols-12 gap-2 px-3 py-2.5 hover:bg-panel-hover cursor-pointer transition-colors items-center group"
              >
                {/* Rank */}
                <div className="col-span-1 text-text-muted text-[11px] font-bold">
                  {String(idx + 1).padStart(2, '0')}
                </div>

                {/* Name */}
                <div className="col-span-4 sm:col-span-3">
                  <div className="text-text-primary font-bold group-hover:text-accent-cyan transition-colors truncate">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">
                    {c.country} &bull; {c.actors.slice(0, 2).join(' vs ')}
                  </div>
                </div>

                {/* Region */}
                <div className="col-span-2 hidden sm:block text-text-secondary text-[11px] truncate">
                  {c.region}
                </div>

                {/* Events */}
                <div className="col-span-2 text-right text-text-primary font-bold text-[11px]">
                  {c.eventCount7d}
                </div>

                {/* Fatalities */}
                <div className="col-span-2 text-right text-severity-critical font-bold text-[11px]">
                  {c.fatalities7d}
                </div>

                {/* Trend & Severity */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                  <span
                    className={`text-[11px] font-bold ${
                      isEscalating
                        ? 'text-severity-critical'
                        : isDeescalating
                        ? 'text-severity-low'
                        : 'text-text-secondary'
                    }`}
                  >
                    {isEscalating ? '↑' : isDeescalating ? '↓' : '→'}
                  </span>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 border font-bold ${
                      c.intensity >= 70
                        ? 'bg-red-950/40 text-severity-critical border-red-800/60'
                        : c.intensity >= 45
                        ? 'bg-orange-950/40 text-severity-high border-orange-800/60'
                        : 'bg-yellow-950/40 text-severity-moderate border-yellow-800/60'
                    }`}
                  >
                    {c.intensity >= 70 ? 'CRITICAL' : c.intensity >= 45 ? 'HIGH' : 'MODERATE'}
                  </span>

                  <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-cyan transition-colors ml-1 hidden sm:inline" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
