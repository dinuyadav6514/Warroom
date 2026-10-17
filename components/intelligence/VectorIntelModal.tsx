'use client';

import React, { useEffect, useState } from 'react';
import { CountryRelation } from '@/lib/data/country-relationships';
import { ConflictEvent } from '@/types/conflict';
import {
  X,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Calendar,
  Filter,
  Activity,
  Radio,
} from 'lucide-react';

interface VectorIntelModalProps {
  relation: CountryRelation | null;
  isOpen?: boolean;
  onClose: () => void;
  onSelectEvent?: (event: ConflictEvent) => void;
  onFilterPair?: (countries: string[]) => void;
}

export const VectorIntelModal: React.FC<VectorIntelModalProps> = ({
  relation,
  isOpen = true,
  onClose,
  onSelectEvent,
  onFilterPair,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !relation) return null;

  const isOutgoing = relation.direction === 'OUTGOING';
  const themeColor = isOutgoing ? '#06b6d4' : '#ef4444';
  const themeGlow = isOutgoing ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  const themeBorder = isOutgoing ? 'border-cyan-500/40' : 'border-red-500/40';

  const filteredEvents = relation.relatedEvents.filter((ev) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (ev.notes || '').toLowerCase().includes(q) ||
      (ev.eventType || '').toLowerCase().includes(q) ||
      (ev.location || '').toLowerCase().includes(q) ||
      (ev.actor1 || '').toLowerCase().includes(q) ||
      (ev.actor2 || '').toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 font-mono select-none cursor-pointer animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-panel border border-white/12 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_30px_70px_rgba(0,0,0,0.9)] cursor-default rounded-[32px] overflow-hidden backdrop-blur-2xl"
        style={{
          boxShadow: `0 0 45px ${themeGlow}, 0 30px 70px rgba(0,0,0,0.9)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div
          className="px-5 py-3.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between"
          style={{ borderLeft: `4px solid ${themeColor}` }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-md"
              style={{ backgroundColor: themeColor }}
            />
            <span
              className="font-bold text-xs tracking-wider uppercase text-white"
            >
              KINETIC VECTOR INTELLIGENCE DISPATCH
            </span>
            <span className="hidden sm:inline-block text-[10px] text-zinc-500">
              [{relation.id}]
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
            title="Close Dispatch (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Focal Vector Banner */}
        <div className="p-4 bg-white/[0.02] border-b border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold">
              <span className="text-white uppercase tracking-wide">{relation.fromCountry}</span>
              {isOutgoing ? (
                <div className="flex items-center gap-1.5 text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-semibold shadow-sm">
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                  <span>OUTGOING [CYAN]</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-300 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs font-semibold shadow-sm">
                  <ArrowLeft className="w-3.5 h-3.5 animate-pulse" />
                  <span>INCOMING [RED]</span>
                </div>
              )}
              <span className="text-white uppercase tracking-wide">{relation.toCountry}</span>
            </div>

            {onFilterPair && (
              <button
                onClick={() => onFilterPair([relation.fromCountry, relation.toCountry])}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-panel-subtle hover:bg-white/10 text-accent-cyan border border-accent-cyan/30 rounded transition-colors"
                title="Isolate map strictly to this bilateral vector"
              >
                <Filter className="w-3 h-3" />
                <span>FILTER THEATER TO THIS VECTOR</span>
              </button>
            )}
          </div>

          {/* Rationale Callout: Why this line is mapped */}
          <div
            className="p-3.5 rounded-xl glass-panel-subtle border border-white/10 text-xs leading-relaxed"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" style={{ color: themeColor }} />
              <span style={{ color: themeColor }}>WHY THIS LINE IS MAPPED :: STRATEGIC &amp; KINETIC RATIONALE</span>
            </div>
            <div className="text-zinc-200 font-sans text-xs sm:text-[13px] leading-relaxed">
              {relation.primaryReason || relation.strategicContext || 'Active kinetic interaction detected in real-time defense telemetry.'}
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Strip with AI Centrality */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-white/[0.01] border-b border-white/5 text-xs">
          <div className="p-2.5 glass-panel-subtle border border-white/5 rounded-xl">
            <div className="text-[9.5px] text-zinc-400 font-medium">VECTOR TYPE</div>
            <div
              className="font-bold mt-0.5 uppercase tracking-wide text-xs"
              style={{ color: themeColor }}
            >
              {isOutgoing ? 'Strike / Offensive' : 'Hostile Inbound Threat'}
            </div>
          </div>
          <div className="p-2.5 glass-panel-subtle border border-white/5 rounded-xl">
            <div className="text-[9.5px] text-zinc-400 font-medium">RECORDED INCIDENTS</div>
            <div className="font-bold text-white mt-0.5 text-xs">
              {relation.eventCount} Operations
            </div>
          </div>
          <div className="p-2.5 glass-panel-subtle border border-white/5 rounded-xl">
            <div className="text-[9.5px] text-zinc-400 font-medium">TOTAL CASUALTIES</div>
            <div
              className={`font-bold mt-0.5 text-xs ${
                relation.fatalities > 0 ? 'text-rose-400' : 'text-zinc-400'
              }`}
            >
              {relation.fatalities > 0 ? `${relation.fatalities} Fatalities` : 'None / Standoff'}
            </div>
          </div>
          <div className="p-2.5 glass-panel-subtle border border-white/5 rounded-xl">
            <div className="text-[9.5px] text-zinc-400 font-medium">ACTIVE DISPATCHES</div>
            <div className="font-bold text-cyan-300 mt-0.5 text-xs">
              {relation.relatedEvents.length} Reports
            </div>
          </div>
          <div className="p-2.5 glass-panel-subtle border border-white/5 rounded-xl">
            <div className="text-[9.5px] text-zinc-400 font-medium">AI CASCADE RISK</div>
            <div className="font-bold text-amber-400 mt-0.5 text-xs font-mono">
              {relation.cascadeRisk !== undefined ? `${Math.round(relation.cascadeRisk * 100)}% CONTAGION` : 'EVALUATING'}
            </div>
          </div>
        </div>

        {/* Content Body: Full News & Dispatches Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
            <div className="flex items-center gap-2 text-zinc-300 text-xs">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider">
                Full Intelligence Dispatches &amp; News Reports ({filteredEvents.length})
              </span>
            </div>

            {relation.relatedEvents.length > 2 && (
              <input
                type="text"
                placeholder="Filter events..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[11px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400/60 w-36 sm:w-48 transition-all"
              />
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 italic">
              No matching events found for &quot;{searchFilter}&quot;.
            </div>
          ) : (
            filteredEvents.map((ev, idx) => {
              const severityBadge =
                ev.severity === 'CRITICAL'
                  ? 'text-rose-300 border-rose-500/30 bg-rose-500/15'
                  : ev.severity === 'HIGH'
                  ? 'text-orange-300 border-orange-500/30 bg-orange-500/15'
                  : ev.severity === 'MODERATE'
                  ? 'text-amber-300 border-amber-500/30 bg-amber-500/15'
                  : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15';

              return (
                <div
                  key={ev.id || idx}
                  className="p-3.5 rounded-xl glass-panel-subtle border border-white/5 hover:border-white/20 transition-all space-y-2 group"
                >
                  {/* Event Meta Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ev.eventDate || 'Recent'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${severityBadge}`}>
                        {ev.severity || 'TACTICAL'}
                      </span>
                      {ev.eventType && (
                        <span className="text-white font-semibold uppercase tracking-wide">
                          {ev.eventType}
                        </span>
                      )}
                    </div>

                    {ev.location && (
                      <span className="text-zinc-400 flex items-center gap-1 text-[10px]">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {ev.location}
                      </span>
                    )}
                  </div>

                  {/* Full News Notes / Dispatch Description */}
                  <div className="text-zinc-200 text-xs sm:text-[13px] leading-relaxed pl-2 border-l-2 border-cyan-500/40">
                    {ev.notes || 'Tactical operational vector activity recorded in theater.'}
                  </div>

                  {/* Combatant Actors & Casualties Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-400 pt-1.5 border-t border-white/5">
                    <div className="flex flex-wrap items-center gap-3">
                      {ev.actor1 && (
                        <span>
                          <strong className="text-zinc-300">Actor 1:</strong>{' '}
                          <span className="text-white">{ev.actor1}</span>
                        </span>
                      )}
                      {ev.actor2 && (
                        <span>
                          <strong className="text-zinc-300">Actor 2:</strong>{' '}
                          <span className="text-white">{ev.actor2}</span>
                        </span>
                      )}
                      {ev.fatalities !== undefined && ev.fatalities > 0 && (
                        <span className="text-rose-400 font-semibold">
                          Fatalities: {ev.fatalities}
                        </span>
                      )}
                      {ev.source && (
                        <span className="text-zinc-400">
                          Source: <span className="text-cyan-300">{ev.source}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectEvent && (
                        <button
                          onClick={() => onSelectEvent(ev)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-mono font-semibold cursor-pointer"
                          title="Open detailed single-event inspection"
                        >
                          <span>INSPECT DISPATCH</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white/[0.03] border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-zinc-300">ESC</kbd> or click outside to dismiss.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded-full glass-pill text-zinc-200 hover:text-white text-xs transition-all cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
