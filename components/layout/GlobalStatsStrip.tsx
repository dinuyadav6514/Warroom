import React from 'react';
import { GlobalOverviewStats } from '@/types/conflict';
import { Flame, Globe, AlertTriangle, Skull, TrendingUp, X, BarChart3 } from 'lucide-react';

interface GlobalStatsStripProps {
  stats: GlobalOverviewStats | null;
  windowDays: number;
  onClose?: () => void;
}

export const GlobalStatsStrip: React.FC<GlobalStatsStripProps> = ({ stats, windowDays, onClose }) => {
  return (
    <div className="bg-[#0b1016] border-b border-border/90 font-mono select-none shadow-md">
      <div className="flex items-center justify-between px-3 py-1 bg-panel-subtle/90 border-b border-border/60 text-[10.5px]">
        <div className="flex items-center gap-2 text-text-secondary">
          <BarChart3 className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-accent-cyan font-bold tracking-wide">// GLOBAL STRATEGIC OVERVIEW METRICS</span>
          <span className="text-[10px] text-text-muted hidden sm:inline">[{windowDays}-DAY OPERATIONAL WINDOW]</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-panel border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Hide Global Stats Panel"
          >
            <span>HIDE</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-2 md:p-2.5">
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
  </div>
  );
};
