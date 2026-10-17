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
    <div className="glass-panel mx-4 my-2 rounded-2xl border border-white/[0.12] font-mono select-none shadow-[0_16px_40px_rgba(0,0,0,0.85)] relative z-20 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-[11px]">
        <div className="flex items-center gap-2 text-zinc-300">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white font-bold tracking-wider">GLOBAL STRATEGIC OVERVIEW</span>
          <span className="text-[10px] text-zinc-500 hidden sm:inline">[{windowDays}-DAY OPERATIONAL WINDOW]</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded-full hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
            title="Hide Global Stats Panel"
          >
            <span>HIDE</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-3">
        {/* Active Conflict Areas */}
        <div className="glass-panel-subtle rounded-xl p-3 flex items-center gap-3 border border-red-500/20 hover:border-red-500/40 transition-all shadow-md group">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9.5px] text-zinc-400 tracking-wider uppercase font-medium">Conflict Areas</div>
            <div className="text-lg font-bold text-white tracking-tight mt-0.5">
              {stats ? stats.activeConflictAreas : '—'}
            </div>
          </div>
        </div>

        {/* High-Activity Regions */}
        <div className="glass-panel-subtle rounded-xl p-3 flex items-center gap-3 border border-cyan-500/20 hover:border-cyan-500/40 transition-all shadow-md group">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-300 group-hover:scale-105 transition-transform">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9.5px] text-zinc-400 tracking-wider uppercase font-medium">Active Regions</div>
            <div className="text-lg font-bold text-white tracking-tight mt-0.5">
              {stats ? stats.highActivityRegions : '—'}
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="glass-panel-subtle rounded-xl p-3 flex items-center gap-3 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-md group">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-300 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9.5px] text-zinc-400 tracking-wider uppercase font-medium">
              Incidents ({windowDays}D)
            </div>
            <div className="text-lg font-bold text-white tracking-tight mt-0.5">
              {stats ? stats.recentIncidents : '—'}
            </div>
          </div>
        </div>

        {/* Fatalities Reported */}
        <div className="glass-panel-subtle rounded-xl p-3 flex items-center gap-3 border border-rose-500/20 hover:border-rose-500/40 transition-all shadow-md group">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
            <Skull className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9.5px] text-zinc-400 tracking-wider uppercase font-medium">Fatalities</div>
            <div className="text-lg font-bold text-rose-300 tracking-tight mt-0.5">
              {stats ? stats.fatalitiesReported : '—'}
            </div>
          </div>
        </div>

        {/* Escalating Areas */}
        <div className="col-span-2 sm:col-span-1 glass-panel-subtle rounded-xl p-3 flex items-center gap-3 border border-orange-500/20 hover:border-orange-500/40 transition-all shadow-md group">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9.5px] text-zinc-400 tracking-wider uppercase font-medium">Accelerating</div>
            <div className="text-lg font-bold text-orange-300 tracking-tight flex items-center gap-1.5 mt-0.5">
              {stats ? stats.escalatingAreas : '—'}
              <span className="text-[10px] font-semibold text-orange-400/80 px-1.5 py-0.2 rounded-full bg-orange-500/10">↑ UP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
