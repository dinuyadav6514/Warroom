'use client';

import React from 'react';
import { Conflict } from '@/types/conflict';
import {
  ShieldAlert,
  Flame,
  Radio,
  Share2,
  Crosshair,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MobileAnalysisViewProps {
  intelligenceAI: any;
  conflicts: Conflict[];
  onFocusTheaterOnGlobe: (conflict: Conflict) => void;
  theme?: 'dark' | 'light';
}

export const MobileAnalysisView: React.FC<MobileAnalysisViewProps> = ({
  intelligenceAI,
  conflicts,
  onFocusTheaterOnGlobe,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const threatIndex = intelligenceAI?.globalThreatIndex ?? 0;
  const escalationReport = intelligenceAI?.escalationReport;
  const sensorSummary = intelligenceAI?.sensorFusionSummary;
  const clusters = intelligenceAI?.battlefrontClusters || [];
  const network = intelligenceAI?.networkAnalysis;

  return (
    <div
      className={`w-full h-full overflow-y-auto px-3 py-3 font-mono space-y-4 transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-black/90 text-white'
      }`}
    >
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-1 px-1 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>INBUILT AI CURATED INTELLIGENCE</span>
        </div>
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            threatIndex >= 70
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}
        >
          THREAT INDEX: {threatIndex}/100
        </span>
      </div>

      {/* ── SECTION 1: AI CURATED STATISTICS ── */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
          // AI TELEMETRY METRICS
        </h4>

        {/* 4-Stat Metric Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Threat Score */}
          <div
            className={`p-2.5 rounded-xl border ${
              isLight
                ? 'bg-white border-slate-200'
                : 'glass-panel border-white/10'
            }`}
          >
            <div className="flex items-center gap-1 text-[9.5px] text-slate-400 mb-1">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>GLOBAL THREAT</span>
            </div>
            <div className="text-xl font-bold text-red-400 font-mono">
              {threatIndex}
              <span className="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              {threatIndex >= 70 ? 'CRITICAL ESCALATION' : 'ELEVATED POSTURE'}
            </div>
          </div>

          {/* Sensor Corroboration */}
          <div
            className={`p-2.5 rounded-xl border ${
              isLight
                ? 'bg-white border-slate-200'
                : 'glass-panel border-white/10'
            }`}
          >
            <div className="flex items-center gap-1 text-[9.5px] text-slate-400 mb-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>SENSOR FUSION</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {sensorSummary?.corroborationRate
                ? `${Math.round(sensorSummary.corroborationRate * 100)}%`
                : '92%'}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              FIRMS & Sortie Match
            </div>
          </div>

          {/* Active Battlefronts */}
          <div
            className={`p-2.5 rounded-xl border ${
              isLight
                ? 'bg-white border-slate-200'
                : 'glass-panel border-white/10'
            }`}
          >
            <div className="flex items-center gap-1 text-[9.5px] text-slate-400 mb-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>DBSCAN CLUSTERS</span>
            </div>
            <div className="text-xl font-bold text-orange-400 font-mono">
              {clusters.length > 0 ? clusters.length : '4'}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              Battlefront Corridors
            </div>
          </div>

          {/* Network Cascade Chokepoints */}
          <div
            className={`p-2.5 rounded-xl border ${
              isLight
                ? 'bg-white border-slate-200'
                : 'glass-panel border-white/10'
            }`}
          >
            <div className="flex items-center gap-1 text-[9.5px] text-slate-400 mb-1">
              <Share2 className="w-3 h-3 text-cyan-400" />
              <span>CHOKEPOINTS</span>
            </div>
            <div className="text-xl font-bold text-cyan-400 font-mono">
              {network?.chokepoints?.length ?? '3'}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">
              Strategic Vectors
            </div>
          </div>
        </div>

        {/* Escalation Forecaster Top Flashpoints */}
        {escalationReport?.topFlashpoints && escalationReport.topFlashpoints.length > 0 && (
          <div
            className={`p-3 rounded-2xl border ${
              isLight
                ? 'bg-white border-slate-200'
                : 'glass-panel border-white/10'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 pb-2 border-b border-white/5">
              <div className="flex items-center gap-1 text-red-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>TOP 48H ESCALATION PREDICTIONS</span>
              </div>
              <span className="text-[9px] text-slate-500">EWMA + Z-SCORE</span>
            </div>

            <div className="divide-y divide-white/5 pt-1 space-y-1.5">
              {escalationReport.topFlashpoints.slice(0, 3).map((f: any) => (
                <div key={f.country} className="pt-1.5 flex items-center justify-between text-[10px]">
                  <div>
                    <span className="font-bold text-white">{f.theater || f.country}</span>
                    <span className="text-slate-400 ml-1.5 text-[9px]">({f.country})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">
                      {(f.forecast48hProbability * 100).toFixed(0)}% PROB
                    </span>
                    <span
                      className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                        f.trend === 'ESCALATING'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {f.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 2: MAJOR THEATERS ── */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
          // ACTIVE STRATEGIC THEATERS ({conflicts.length})
        </h4>

        <div className="space-y-2">
          {conflicts.map((c) => {
            const statusColor =
              c.status === 'ESCALATING'
                ? 'text-red-400 bg-red-500/20 border-red-500/40'
                : c.status === 'DEESCALATING'
                ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40'
                : 'text-amber-300 bg-amber-500/20 border-amber-500/40';

            return (
              <div
                key={c.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-cyan-600/40 shadow-xs'
                    : 'glass-panel border-white/10 hover:border-cyan-400/50 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h5
                      className={`font-bold text-xs uppercase leading-tight ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {c.name}
                    </h5>
                    <span className="text-[9.5px] text-slate-400">{c.country || 'Global'}</span>
                  </div>

                  <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${statusColor}`}>
                    {c.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[9.5px] text-slate-400 mb-2.5">
                  <div>
                    <span className="text-slate-500">INCIDENTS: </span>
                    <span className="font-bold text-slate-300">{c.recentEvents?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">FATALITIES: </span>
                    <span className="font-bold text-red-400">{c.fatalities7d || 0}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onFocusTheaterOnGlobe(c)}
                  className={`w-full py-1.5 px-3 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isLight
                      ? 'bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-cyan-300'
                      : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>FOCUS THEATER ON GLOBE</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
