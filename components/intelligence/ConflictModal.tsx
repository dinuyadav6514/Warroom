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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-mono select-none cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-panel-subtle border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="text-accent-cyan font-bold text-xs ml-2 tracking-wider">
              CONFLICT TERMINAL :: {conflict.name.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-accent-cyan transition-colors p-1"
            title="Close Terminal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Top Key Attributes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-panel-subtle p-3 border border-border">
            <div>
              <div className="text-[10px] text-text-muted">STATUS</div>
              <div
                className={`font-bold mt-0.5 ${
                  conflict.status === 'ESCALATING'
                    ? 'text-severity-critical'
                    : conflict.status === 'DEESCALATING'
                    ? 'text-severity-low'
                    : 'text-severity-high'
                }`}
              >
                {conflict.status}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">REGION</div>
              <div className="text-text-primary font-semibold mt-0.5">{conflict.region}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">WINDOW</div>
              <div className="text-accent-cyan font-semibold mt-0.5">LAST {windowDays} DAYS</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">ESCALATION INDEX</div>
              <div className="text-text-primary font-bold mt-0.5">
                {conflict.escalationIndex}/100 ({conflict.escalationTrend})
              </div>
            </div>
          </div>

          {/* Conflict Actors Tree */}
          <div className="bg-panel-subtle p-3 border border-border">
            <div className="text-[10px] text-text-muted mb-2">// ACTIVE THEATER ACTORS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {conflict.actors.length > 0 ? (
                conflict.actors.map((act, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-text-primary text-[11px]">
                    <span className="text-text-muted">
                      {idx === conflict.actors.length - 1 ? '└─' : '├─'}
                    </span>
                    <span className="truncate">{act}</span>
                  </div>
                ))
              ) : (
                <div className="text-text-muted text-[11px]">Unidentified actors</div>
              )}
            </div>
          </div>

          {/* Activity Sparkline */}
          <ActivitySparkline events={conflict.recentEvents} windowDays={windowDays} />

          {/* Event Timeline */}
          <div>
            <div className="text-[11px] text-accent-cyan font-bold mb-3 flex items-center justify-between pb-1 border-b border-border">
              <span>// CHRONOLOGICAL EVENT TIMELINE (LAST {windowDays} DAYS)</span>
              <span className="text-[10px] text-text-muted">
                {conflict.recentEvents.length} DOCUMENTED EVENTS
              </span>
            </div>
            <ConflictTimeline events={conflict.recentEvents} onSelectEvent={onSelectEvent} />
          </div>

          {/* Data Sources */}
          <div className="bg-panel-subtle p-3 border border-border">
            <div className="text-[10px] text-text-muted mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-accent-cyan" />
              <span>// PRIMARY DATA SOURCES & PROVENANCE</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {sourcesList.length > 0 ? (
                sourcesList.map((src, idx) => (
                  <div key={idx} className="text-text-secondary flex items-center gap-2">
                    <span className="text-accent-cyan">[{String(idx + 1).padStart(2, '0')}]</span>
                    <span>{src}</span>
                    <span className="text-[10px] text-text-muted">(STRUCTURED INCIDENT RECORD)</span>
                  </div>
                ))
              ) : (
                <div className="text-text-muted text-[11px]">GEMINI SEARCH GROUNDING // VERIFIED DISPATCH</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-4 py-2 bg-panel-subtle border-t border-border flex items-center justify-between text-[10px] text-text-muted">
          <span>WARROOM OPERATIONAL LOGS</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-panel hover:bg-panel-hover border border-border text-text-primary"
          >
            CLOSE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
