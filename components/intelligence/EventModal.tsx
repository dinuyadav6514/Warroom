'use client';

import React, { useEffect } from 'react';
import { ConflictEvent } from '@/types/conflict';
import { formatTerminalUtc } from '@/lib/data/date-utils';
import { X, ExternalLink, ShieldCheck, AlertCircle, MapPin, Layers, Sparkles } from 'lucide-react';
import { cleanHtmlAndMarkup, summarizeEventWithInbuiltAi } from '@/lib/intelligence/event-summarizer';

interface EventModalProps {
  event: ConflictEvent | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, isOpen = true, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 font-mono select-none cursor-pointer animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-[32px] border border-white/12 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_30px_70px_rgba(0,0,0,0.9)] cursor-default overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Window Header */}
        <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-white font-bold text-xs ml-2 tracking-wider flex items-center gap-2">
              <span>EVENT INTEL DOSSIER</span>
              <span className="text-[10px] text-zinc-500 font-normal">[{event.id}]</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 cursor-pointer"
            title="Close Terminal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {/* Key Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 glass-panel-subtle rounded-xl p-3.5 border border-white/5">
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">EVENT DATE (UTC)</div>
              <div className="text-white font-bold mt-0.5">{event.eventDate || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">SEVERITY LEVEL</div>
              <div
                className={`font-bold mt-0.5 ${
                  event.severity === 'CRITICAL'
                    ? 'text-rose-400'
                    : event.severity === 'HIGH'
                    ? 'text-orange-400'
                    : event.severity === 'MODERATE'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {event.severity}
              </div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">FATALITIES</div>
              <div className="text-rose-400 font-bold mt-0.5">
                {event.fatalities !== undefined ? `${event.fatalities} REPORTED` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">PRIMARY CATEGORY</div>
              <div className="text-zinc-200 mt-0.5">{event.eventType || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">SUB-EVENT TYPE</div>
              <div className="text-zinc-200 mt-0.5">{event.subEventType || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">VERIFICATION</div>
              <div className="text-emerald-400 font-semibold mt-0.5">
                {event.verificationStatus || 'REPORTED'}
              </div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">AI CONFIDENCE (NO-LLM)</div>
              <div className={`font-bold mt-0.5 font-mono ${
                (event.confidenceScore ?? 0) >= 0.70 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {event.confidenceLabel || `${Math.round((event.confidenceScore ?? 0.52) * 100)}% SENSOR CONFIDENCE`}
              </div>
            </div>
            {event.sensorHits && (
              <div>
                <div className="text-[9.5px] text-zinc-400 font-medium">SENSOR CROSS-HITS</div>
                <div className="text-cyan-300 font-bold mt-0.5 font-mono text-[11px]">
                  FIRMS: {event.sensorHits.firmsCount} | ADS-B: {event.sensorHits.aviationCount}
                </div>
              </div>
            )}
          </div>

          {/* Location & Coordinates */}
          <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5 space-y-1.5">
            <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>GEOGRAPHIC IDENTIFIERS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-zinc-500">LOCATION:</span>{' '}
                <span className="text-white font-medium">{event.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500">ADMIN REGION:</span>{' '}
                <span className="text-zinc-300">{event.admin1 || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500">COUNTRY / THEATER:</span>{' '}
                <span className="text-zinc-300">{event.country || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500">COORDINATES:</span>{' '}
                <span className="text-cyan-400 font-mono">
                  {event.latitude && event.longitude
                    ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Belligerents / Actors */}
          <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5 space-y-2">
            <div className="text-[10px] text-zinc-400 font-semibold">// INVOLVED ACTORS</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold px-1.5 py-0.2 rounded bg-cyan-500/10">[ACTOR 1]</span>
                <span className="text-white">{event.actor1 || 'Unidentified'}</span>
              </div>
              {event.actor2 && (
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-bold px-1.5 py-0.2 rounded bg-orange-500/10">[ACTOR 2]</span>
                  <span className="text-white">{event.actor2}</span>
                </div>
              )}
            </div>
          </div>

          {/* Corroborating Dispatches & Merged Posts */}
          {event.mergedEvents && event.mergedEvents.length > 1 && (
            <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>CORROBORATING SOURCES ({event.mergedEvents.length} DISPATCHES)</span>
                </div>
                <span className="text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10">DEDUPLICATED & MERGED</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 divide-y divide-white/5">
                {event.mergedEvents.map((mergedEv, idx) => (
                  <div key={mergedEv.id || idx} className="pt-2 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold rounded-full">
                        {mergedEv.source || 'Wire Source'}
                      </span>
                      <span className="text-zinc-500">
                        {mergedEv.publishedAt
                          ? new Date(mergedEv.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : mergedEv.eventDate}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-200 font-medium leading-snug">
                      {mergedEv.notes ? mergedEv.notes.split('.')[0] : mergedEv.eventType}
                    </div>
                    {mergedEv.sourceUrl && (
                      <div className="pt-0.5">
                        <a
                          href={mergedEv.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10.5px] text-cyan-400 hover:text-cyan-300 hover:underline font-bold"
                        >
                          <span>READ FULL POST / DISPATCH &rarr;</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structured Inbuilt AI Tactical SITREP */}
          {(() => {
            const aiSummary = summarizeEventWithInbuiltAi(event);
            return (
              <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                    TACTICAL SITUATION BRIEF
                  </span>
                  <span className="text-zinc-500 font-mono text-[9px] uppercase">
                    {aiSummary.corroborationStatus}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-200 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5 space-y-1.5">
                  <div className="text-white font-bold text-xs">{aiSummary.cleanHeadline}</div>
                  <p className="text-zinc-300 font-sans text-[11px]">{aiSummary.situationBrief}</p>
                  {aiSummary.impactAssessment && (
                    <div className="text-[10px] text-zinc-400 font-mono pt-1 border-t border-white/5">
                      {aiSummary.impactAssessment}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Source Attribution & Link */}
          <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <div>
              <span className="text-zinc-500">SOURCE:</span>{' '}
              <span className="text-white font-bold">{event.source || 'Wire Service'}</span>
            </div>
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline font-bold tracking-wide"
              >
                <span>
                  {event.sourceUrl.includes('google.com/search')
                    ? 'VIEW VERIFIED NEWS DISPATCHES'
                    : 'VIEW ORIGINAL POST / DISPATCH'}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white/[0.03] border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500">
          <span>EVENT HASH: {event.id}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-full glass-pill text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            DISMISS [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
