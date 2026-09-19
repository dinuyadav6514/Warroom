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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 font-mono select-none cursor-pointer animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#050a12] border border-border/80 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl cursor-default rounded-sm overflow-hidden"
        style={{
          boxShadow: `0 0 35px ${themeGlow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div
          className="px-4 py-3 bg-[#08101a] border-b border-border flex items-center justify-between"
          style={{ borderLeft: `4px solid ${themeColor}` }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: themeColor }}
            />
            <span
              className="font-bold text-xs tracking-wider uppercase"
              style={{ color: themeColor }}
            >
              KINETIC VECTOR INTELLIGENCE DISPATCH
            </span>
            <span className="hidden sm:inline-block text-[10px] text-text-muted">
              [{relation.id}]
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            title="Close Dispatch (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Focal Vector Banner */}
        <div className="p-4 bg-gradient-to-r from-[#0b1424] to-[#060b13] border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold">
              <span className="text-white uppercase tracking-wide">{relation.fromCountry}</span>
              {isOutgoing ? (
                <div className="flex items-center gap-1 text-accent-cyan px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-xs font-semibold">
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                  <span>OUTGOING [CYAN]</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-xs font-semibold">
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
            className={`p-3 rounded bg-black/50 border ${themeBorder} text-xs leading-relaxed`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" style={{ color: themeColor }} />
              <span style={{ color: themeColor }}>WHY THIS LINE IS MAPPED :: STRATEGIC &amp; KINETIC RATIONALE</span>
            </div>
            <div className="text-slate-200 font-sans text-xs sm:text-[13px] leading-relaxed">
              {relation.primaryReason || relation.strategicContext || 'Active kinetic interaction detected in real-time defense telemetry.'}
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#03060a] border-b border-border/60 text-xs">
          <div className="p-2 bg-panel-subtle/50 border border-border/40 rounded">
            <div className="text-[10px] text-text-muted">VECTOR TYPE</div>
            <div
              className="font-bold mt-0.5 uppercase tracking-wide text-xs"
              style={{ color: themeColor }}
            >
              {isOutgoing ? 'Strike / Offensive' : 'Hostile Inbound Threat'}
            </div>
          </div>
          <div className="p-2 bg-panel-subtle/50 border border-border/40 rounded">
            <div className="text-[10px] text-text-muted">RECORDED INCIDENTS</div>
            <div className="font-bold text-white mt-0.5 text-xs">
              {relation.eventCount} Operations
            </div>
          </div>
          <div className="p-2 bg-panel-subtle/50 border border-border/40 rounded">
            <div className="text-[10px] text-text-muted">TOTAL CASUALTIES</div>
            <div
              className={`font-bold mt-0.5 text-xs ${
                relation.fatalities > 0 ? 'text-red-400' : 'text-text-secondary'
              }`}
            >
              {relation.fatalities > 0 ? `${relation.fatalities} Fatalities` : 'None / Standoff'}
            </div>
          </div>
          <div className="p-2 bg-panel-subtle/50 border border-border/40 rounded">
            <div className="text-[10px] text-text-muted">ACTIVE DISPATCHES</div>
            <div className="font-bold text-accent-cyan mt-0.5 text-xs">
              {relation.relatedEvents.length} Verified Reports
            </div>
          </div>
        </div>

        {/* Content Body: Full News & Dispatches Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 text-xs bg-[#040810]">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/40">
            <div className="flex items-center gap-2 text-text-secondary text-xs">
              <Radio className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
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
                className="px-2 py-0.5 bg-black/60 border border-border/60 rounded text-[11px] text-slate-200 placeholder:text-text-muted focus:outline-none focus:border-accent-cyan w-36 sm:w-48"
              />
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-xs italic">
              No matching events found for &quot;{searchFilter}&quot;.
            </div>
          ) : (
            filteredEvents.map((ev, idx) => {
              const severityColor =
                ev.severity === 'CRITICAL'
                  ? 'text-red-500 border-red-500/50 bg-red-950/30'
                  : ev.severity === 'HIGH'
                  ? 'text-orange-400 border-orange-500/50 bg-orange-950/30'
                  : ev.severity === 'MODERATE'
                  ? 'text-yellow-400 border-yellow-500/50 bg-yellow-950/30'
                  : 'text-green-400 border-green-500/50 bg-green-950/30';

              return (
                <div
                  key={ev.id || idx}
                  className="p-3 bg-[#08111e]/90 border border-border/70 rounded hover:border-slate-500/50 transition-all space-y-2 group"
                >
                  {/* Event Meta Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-accent-cyan font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {ev.eventDate || 'Recent'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${severityColor}`}>
                        {ev.severity || 'TACTICAL'}
                      </span>
                      {ev.eventType && (
                        <span className="text-white font-semibold uppercase tracking-wide">
                          {ev.eventType}
                        </span>
                      )}
                    </div>

                    {ev.location && (
                      <span className="text-text-muted flex items-center gap-1 text-[10px]">
                        <MapPin className="w-3 h-3 text-text-secondary" />
                        {ev.location}
                      </span>
                    )}
                  </div>

                  {/* Full News Notes / Dispatch Description */}
                  <div className="text-slate-200 text-xs font-sans leading-relaxed pl-1 border-l-2 border-slate-700">
                    {ev.notes || 'Tactical operational vector activity recorded in theater.'}
                  </div>

                  {/* Combatant Actors & Casualties Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-text-muted pt-1 border-t border-border/30">
                    <div className="flex flex-wrap items-center gap-3">
                      {ev.actor1 && (
                        <span>
                          <strong className="text-slate-400">Actor 1:</strong>{' '}
                          <span className="text-slate-200">{ev.actor1}</span>
                        </span>
                      )}
                      {ev.actor2 && (
                        <span>
                          <strong className="text-slate-400">Actor 2:</strong>{' '}
                          <span className="text-slate-200">{ev.actor2}</span>
                        </span>
                      )}
                      {ev.fatalities !== undefined && ev.fatalities > 0 && (
                        <span className="text-red-400 font-semibold">
                          Fatalities: {ev.fatalities}
                        </span>
                      )}
                      {ev.source && (
                        <span className="text-text-muted">
                          Source: <span className="text-accent-cyan">{ev.source}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectEvent && (
                        <button
                          onClick={() => onSelectEvent(ev)}
                          className="text-[10px] text-accent-cyan hover:underline flex items-center gap-1 font-mono"
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
        <div className="px-4 py-2.5 bg-[#060c14] border-t border-border flex items-center justify-between text-[11px] text-text-muted">
          <span>
            Press <kbd className="px-1 py-0.5 bg-black/60 border border-border/70 rounded text-[10px] text-slate-300">ESC</kbd> or click outside to dismiss.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
