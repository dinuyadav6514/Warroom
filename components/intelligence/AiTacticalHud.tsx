'use client';

/**
 * AiTacticalHud — Military-styled dark HUD panel displaying real-time
 * intelligence analytics computed by the deterministic AI engine.
 *
 * Displays:
 *  - Top 3 Flashpoint Predictions (48h forecast)
 *  - Global Chokepoint Alert
 *  - Live Sensor Corroboration Rate
 *  - Active Battlefront Cluster Count
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Radar,
  Network,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { EscalationForecast, GlobalEscalationReport } from '@/lib/intelligence/escalation-forecaster';
import { SensorFusionSummary } from '@/lib/intelligence/sensor-fusion';
import { BattlefrontCluster } from '@/lib/intelligence/spatial-clustering';
import { NetworkAnalysis } from '@/lib/intelligence/network-centrality';

interface AiTacticalHudProps {
  escalationReport: GlobalEscalationReport;
  sensorFusionSummary: SensorFusionSummary;
  battlefrontClusters: BattlefrontCluster[];
  networkAnalysis: NetworkAnalysis;
  globalThreatIndex: number;
  onClose?: () => void;
  className?: string;
}

/** Format a probability (0.0-1.0) as a percentage string */
function fmtPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/** Threat index color */
function threatColor(index: number): string {
  if (index >= 80) return '#ff2247';
  if (index >= 60) return '#ff8800';
  if (index >= 40) return '#ffea00';
  return '#00e676';
}

/** Trend icon */
function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'ESCALATING') return <TrendingUp className="w-3 h-3 text-red-400" />;
  if (trend === 'DEESCALATING') return <TrendingDown className="w-3 h-3 text-emerald-400" />;
  return <Minus className="w-3 h-3 text-amber-400" />;
}

/** Single flashpoint row */
function FlashpointRow({
  rank,
  forecast,
}: {
  rank: number;
  forecast: EscalationForecast;
}) {
  const color = threatColor(forecast.threatIndex);

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
      {/* Rank badge */}
      <div
        className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-black"
        style={{ background: `${color}22`, border: `1px solid ${color}66`, color }}
      >
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-white uppercase tracking-wide truncate">
            {forecast.country}
          </span>
          <TrendIcon trend={forecast.trend} />
          {forecast.isAnomaly && (
            <span className="text-[8px] font-bold text-red-400 bg-red-950/60 border border-red-700/50 px-1 py-0.5 animate-pulse">
              ANOMALY
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-0.5">
          {/* Threat Index bar */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-500">IDX</span>
            <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${forecast.threatIndex}%`, background: color }}
              />
            </div>
            <span className="text-[9px] font-bold" style={{ color }}>
              {forecast.threatIndex}
            </span>
          </div>

          {/* 48h probability */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-500">48H</span>
            <span className="text-[9px] font-bold text-amber-300">
              {fmtPct(forecast.forecast48hProbability)}
            </span>
          </div>

          {/* Velocity */}
          <div className="flex items-center gap-0.5">
            <Activity className="w-2.5 h-2.5 text-zinc-500" />
            <span className="text-[9px] text-zinc-400">
              {forecast.escalationVelocity > 0 ? '+' : ''}
              {forecast.escalationVelocity.toFixed(1)}/d
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AiTacticalHud: React.FC<AiTacticalHudProps> = ({
  escalationReport,
  sensorFusionSummary,
  battlefrontClusters,
  networkAnalysis,
  globalThreatIndex,
  onClose,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const top3 = escalationReport.topFlashpoints.slice(0, 3);
  const topChokepoint = networkAnalysis.chokepoints[0];
  const topCascade    = networkAnalysis.highestCascadeRisk[0];
  const globalColor   = threatColor(globalThreatIndex);

  const corroborationPct = Math.round(sensorFusionSummary.corroborationRate * 100);
  const avgConfPct        = Math.round(sensorFusionSummary.avgConfidence * 100);

  return (
    <div
      className={`glass-panel rounded-[28px] border border-white/12 shadow-[0_24px_60px_rgba(0,0,0,0.9)] font-mono text-xs backdrop-blur-2xl overflow-hidden ${className}`}
    >
      {/* ── HUD Header ─────────────────────────────────────────────────── */}
      <div className="h-9 px-3.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[10.5px] font-bold tracking-widest text-white uppercase">
            AI TACTICAL HUD
          </span>
          <span className="text-[8.5px] text-zinc-500 font-normal hidden sm:inline">// DETERMINISTIC CORE</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Global Threat Index badge */}
          <div
            className="px-2 py-0.5 text-[9.5px] font-bold rounded-full border shadow-sm"
            style={{
              background: `${globalColor}18`,
              borderColor: `${globalColor}55`,
              color: globalColor,
            }}
          >
            THREAT {globalThreatIndex}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
            title={isCollapsed ? 'Expand HUD' : 'Collapse HUD'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer rounded-full hover:bg-white/5"
              title="Close HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3.5 space-y-3.5">
          {/* ── Section 1: Top Flashpoint Predictions ──────────────────── */}
          <div className="glass-panel-subtle rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[9.5px] font-bold text-orange-300 uppercase tracking-widest">
                Top Flashpoints — 48H Forecast
              </span>
            </div>

            <div className="space-y-0">
              {top3.length === 0 ? (
                <div className="text-[10px] text-zinc-500 italic py-1">
                  Awaiting live kinetic telemetry...
                </div>
              ) : (
                top3.map((f, i) => (
                  <FlashpointRow key={f.country} rank={i + 1} forecast={f} />
                ))
              )}
            </div>

            {escalationReport.totalAnomalies > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[9px] text-rose-400 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse inline-block" />
                <span>
                  {escalationReport.totalAnomalies} statistical anomal
                  {escalationReport.totalAnomalies === 1 ? 'y' : 'ies'} detected (Z ≥ 2.0σ)
                </span>
              </div>
            )}
          </div>

          {/* ── Section 2: Global Chokepoint Alert ─────────────────────── */}
          <div className="glass-panel-subtle rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[9.5px] font-bold text-cyan-300 uppercase tracking-widest">
                Chokepoint Alert
              </span>
            </div>

            {topChokepoint ? (
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 w-2 h-2 rounded-full bg-cyan-400 mt-1 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white uppercase">
                      {topChokepoint.country}
                    </span>
                    <span className="text-[9px] text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                      BETWEENNESS {(topChokepoint.betweenness * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[9.5px] text-zinc-400">
                    <span>IN: <strong className="text-white">{topChokepoint.inDegree}</strong></span>
                    <span>OUT: <strong className="text-white">{topChokepoint.outDegree}</strong></span>
                    <span className="text-amber-400 font-semibold">
                      CASCADE {(topChokepoint.cascadeRisk * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : topCascade ? (
              <div className="text-[10px] text-zinc-300">
                <span className="text-white font-bold">{topCascade.country}</span>
                {' '}— Cascade Risk{' '}
                <span className="text-amber-300 font-bold">
                  {(topCascade.cascadeRisk * 100).toFixed(0)}%
                </span>
              </div>
            ) : (
              <div className="text-[10px] text-zinc-500 italic">
                No relation network loaded.
              </div>
            )}
          </div>

          {/* ── Section 3: Live Sensor Corroboration ───────────────────── */}
          <div className="glass-panel-subtle rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Radar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[9.5px] font-bold text-emerald-300 uppercase tracking-widest">
                Sensor Corroboration
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Corroboration Rate */}
              <div className="glass-panel rounded-lg p-2.5 flex flex-col items-center gap-0.5 border border-emerald-500/20">
                <div className="text-base font-black text-emerald-400">{corroborationPct}%</div>
                <div className="text-[8px] text-zinc-400 uppercase text-center font-medium">Corroborated</div>
              </div>

              {/* Avg Confidence */}
              <div className="glass-panel rounded-lg p-2.5 flex flex-col items-center gap-0.5 border border-cyan-500/20">
                <div className="text-base font-black text-cyan-400">{avgConfPct}%</div>
                <div className="text-[8px] text-zinc-400 uppercase text-center font-medium">Avg Conf.</div>
              </div>

              {/* Active Battlefronts */}
              <div className="glass-panel rounded-lg p-2.5 flex flex-col items-center gap-0.5 border border-orange-500/20">
                <div className="text-base font-black text-orange-400">
                  {battlefrontClusters.length}
                </div>
                <div className="text-[8px] text-zinc-400 uppercase text-center font-medium">Battlefronts</div>
              </div>
            </div>

            {/* Verified Incident count */}
            <div className="mt-2 text-[9px] text-zinc-400 flex items-center justify-between">
              <span>
                {sensorFusionSummary.totalVerified} incidents cross-correlated
              </span>
              <span className="text-emerald-400 font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10">
                {sensorFusionSummary.highConfidenceCount} HIGH CONF
              </span>
            </div>
          </div>

          {/* ── Footer: Engine Status ───────────────────────────────────── */}
          <div className="pt-1 flex items-center justify-between text-[8px] text-zinc-500">
            <span>DETERMINISTIC ENGINE // ZERO LLM OVERHEAD</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OPERATIONAL
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiTacticalHud;
