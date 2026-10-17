'use client';

import React, { useEffect } from 'react';
import { Conflict, ConflictEvent } from '@/types/conflict';
import { ConflictTimeline } from '../timeline/ConflictTimeline';
import { ActivitySparkline } from '../timeline/ActivitySparkline';
import { X, ExternalLink, ShieldAlert, BookOpen } from 'lucide-react';

interface ConflictModalProps {
  conflict: Conflict | null;
  isOpen?: boolean;
  onClose: () => void;
  onSelectEvent: (event: ConflictEvent) => void;
  windowDays: number;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflict,
  isOpen = true,
  onClose,
  onSelectEvent,
  windowDays,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !conflict) return null;

  // Distinct sources
  const sourcesSet = new Set<string>();
  conflict.recentEvents.forEach((e) => {
    if (e.source) sourcesSet.add(e.source);
  });
  const sourcesList = Array.from(sourcesSet);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 font-mono select-none cursor-pointer animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-[32px] border border-white/12 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_30px_70px_rgba(0,0,0,0.9)] cursor-default overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="px-5 py-3.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-white font-bold text-xs ml-2 tracking-wider">
              CONFLICT DOSSIER :: {conflict.name.toUpperCase()}
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

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Top Key Attributes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 glass-panel-subtle rounded-xl p-3.5 border border-white/5">
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">STATUS</div>
              <div
                className={`font-bold mt-0.5 ${
                  conflict.status === 'ESCALATING'
                    ? 'text-rose-400'
                    : conflict.status === 'DEESCALATING'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {conflict.status}
              </div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">REGION</div>
              <div className="text-white font-semibold mt-0.5">{conflict.region}</div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">WINDOW</div>
              <div className="text-cyan-300 font-semibold mt-0.5">LAST {windowDays} DAYS</div>
            </div>
            <div>
              <div className="text-[9.5px] text-zinc-400 font-medium">ESCALATION INDEX</div>
              <div className="text-white font-bold mt-0.5">
                {conflict.escalationIndex}/100 ({conflict.escalationTrend})
              </div>
            </div>
          </div>

          {/* Conflict Actors Tree */}
          <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5">
            <div className="text-[10px] text-zinc-400 font-semibold mb-2">// ACTIVE THEATER ACTORS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {conflict.actors.length > 0 ? (
                conflict.actors.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-zinc-200 text-[11px]">
                    <span className="text-cyan-400 font-bold">
                      {idx === conflict.actors.length - 1 ? '└─' : '├─'}
                    </span>
                    <span className="truncate">{act}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-[11px]">Unidentified actors</div>
              )}
            </div>
          </div>

          {/* Activity Sparkline */}
          <div className="glass-panel-subtle rounded-xl p-3 border border-white/5">
            <ActivitySparkline events={conflict.recentEvents} windowDays={windowDays} />
          </div>

          {/* Event Timeline */}
          <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5">
            <div className="text-[11px] text-cyan-300 font-bold mb-3 flex items-center justify-between pb-1.5 border-b border-white/5">
              <span>// CHRONOLOGICAL EVENT TIMELINE (LAST {windowDays} DAYS)</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                {conflict.recentEvents.length} DOCUMENTED EVENTS
              </span>
            </div>
            <ConflictTimeline events={conflict.recentEvents} onSelectEvent={onSelectEvent} />
          </div>

          {/* Data Sources */}
          <div className="glass-panel-subtle rounded-xl p-3.5 border border-white/5">
            <div className="text-[10px] text-zinc-400 font-semibold mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>// PRIMARY DATA SOURCES &amp; PROVENANCE</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {sourcesList.length > 0 ? (
                sourcesList.map((src, idx) => (
                  <div key={idx} className="text-zinc-300 flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">[{String(idx + 1).padStart(2, '0')}]</span>
                    <span>{src}</span>
                    <span className="text-[10px] text-zinc-500">(STRUCTURED INCIDENT RECORD)</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-[11px]">VERIFIED DISPATCH INTELLIGENCE</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3 bg-white/[0.03] border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-500">
          <span>WARROOM INTEL ARCHIVE</span>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded-full glass-pill text-zinc-200 hover:text-white transition-all cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
