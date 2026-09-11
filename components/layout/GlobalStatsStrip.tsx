'use client';

import React from 'react';
import { GlobalOverviewStats } from '@/types/conflict';
import { Flame, Globe, AlertTriangle, Skull, TrendingUp } from 'lucide-react';

interface GlobalStatsStripProps {
  stats: GlobalOverviewStats | null;
  windowDays: number;
}

export const GlobalStatsStrip: React.FC<GlobalStatsStripProps> = ({ stats, windowDays }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-2.5 bg-panel border-b border-border font-mono select-none">
      {/* Active Conflict Areas */}
      <div className="flex items-center gap-3 p-2 bg-panel-subtle border border-border/80">
        <div className="p-1.5 bg-red-950/40 border border-red-800/40 text-severity-critical">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-text-muted tracking-wider">ACTIVE CONFLICT AREAS</div>
          <div className="text-base font-bold text-text-primary tracking-tight">
            {stats ? stats.activeConflictAreas : '—'}
          </div>
        </div>
      </div>

      {/* High-Activity Regions */}
      <div className="flex items-center gap-3 p-2 bg-panel-subtle border border-border/80">
        <div className="p-1.5 bg-cyan-950/40 border border-cyan-800/40 text-accent-cyan">
          <Globe className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-text-muted tracking-wider">HIGH-ACTIVITY REGIONS</div>
          <div className="text-base font-bold text-text-primary tracking-tight">
            {stats ? stats.highActivityRegions : '—'}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="flex items-center gap-3 p-2 bg-panel-subtle border border-border/80">
        <div className="p-1.5 bg-amber-950/40 border border-amber-800/40 text-severity-moderate">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-text-muted tracking-wider">
            RECENT INCIDENTS ({windowDays}D)
          </div>
          <div className="text-base font-bold text-text-primary tracking-tight">
            {stats ? stats.recentIncidents : '—'}
          </div>
        </div>
      </div>

      {/* Fatalities Reported */}
      <div className="flex items-center gap-3 p-2 bg-panel-subtle border border-border/80">
        <div className="p-1.5 bg-orange-950/40 border border-orange-800/40 text-severity-high">
          <Skull className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-text-muted tracking-wider">FATALITIES REPORTED</div>
          <div className="text-base font-bold text-text-primary tracking-tight">
            {stats ? stats.fatalitiesReported : '—'}
          </div>
        </div>
      </div>

      {/* Escalating Areas */}
      <div className="col-span-2 sm:col-span-1 flex items-center gap-3 p-2 bg-panel-subtle border border-border/80">
        <div className="p-1.5 bg-red-950/40 border border-red-800/40 text-severity-critical">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-text-muted tracking-wider">ESCALATING THEATERS</div>
          <div className="text-base font-bold text-severity-critical tracking-tight flex items-center gap-1.5">
            {stats ? stats.escalatingAreas : '—'}
            <span className="text-[10px] font-normal text-text-muted">↑ ACCELERATING</span>
          </div>
        </div>
      </div>
    </div>
  );
};
