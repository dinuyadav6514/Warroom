'use client';

import React, { useEffect } from 'react';
import { ConflictEvent } from '@/types/conflict';
import { formatTerminalUtc } from '@/lib/data/date-utils';
import { X, ExternalLink, ShieldCheck, AlertCircle, MapPin } from 'lucide-react';

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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-mono select-none cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Window Header */}
        <div className="px-4 py-2.5 bg-panel-subtle border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="text-accent-cyan font-bold text-xs ml-2 tracking-wider">
              EVENT DETAIL TERMINAL :: {event.id}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Key Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-panel-subtle p-3 border border-border">
            <div>
              <div className="text-[10px] text-text-muted">EVENT DATE (UTC)</div>
              <div className="text-text-primary font-bold mt-0.5">{event.eventDate || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">SEVERITY LEVEL</div>
              <div
                className={`font-bold mt-0.5 ${
                  event.severity === 'CRITICAL'
                    ? 'text-severity-critical'
                    : event.severity === 'HIGH'
                    ? 'text-severity-high'
                    : event.severity === 'MODERATE'
                    ? 'text-severity-moderate'
                    : 'text-severity-low'
                }`}
              >
                {event.severity}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">FATALITIES</div>
              <div className="text-severity-critical font-bold mt-0.5">
                {event.fatalities !== undefined ? `${event.fatalities} REPORTED` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">PRIMARY CATEGORY</div>
              <div className="text-text-primary mt-0.5">{event.eventType || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">SUB-EVENT TYPE</div>
              <div className="text-text-primary mt-0.5">{event.subEventType || 'N/A'}</div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted">VERIFICATION</div>
              <div className="text-accent-green font-semibold mt-0.5">
                {event.verificationStatus || 'REPORTED'}
              </div>
            </div>
          </div>

          {/* Location & Coordinates */}
          <div className="bg-panel-subtle p-3 border border-border space-y-1.5">
            <div className="text-[10px] text-text-muted flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
              <span>// GEOGRAPHIC IDENTIFIERS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-text-muted">LOCATION:</span>{' '}
                <span className="text-text-primary font-medium">{event.location || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted">ADMIN REGION:</span>{' '}
                <span className="text-text-primary">{event.admin1 || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted">COUNTRY / THEATER:</span>{' '}
                <span className="text-text-primary">{event.country || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted">COORDINATES:</span>{' '}
                <span className="text-accent-cyan">
                  {event.latitude && event.longitude
                    ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Belligerents / Actors */}
          <div className="bg-panel-subtle p-3 border border-border space-y-2">
            <div className="text-[10px] text-text-muted">// INVOLVED ACTORS</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-accent-cyan font-bold">[ACTOR 1]</span>
                <span className="text-text-primary">{event.actor1 || 'Unidentified'}</span>
              </div>
              {event.actor2 && (
                <div className="flex items-center gap-2">
                  <span className="text-severity-high font-bold">[ACTOR 2]</span>
                  <span className="text-text-primary">{event.actor2}</span>
                </div>
              )}
            </div>
          </div>

          {/* Structured Source Notes */}
          <div className="bg-panel-subtle p-3 border border-border space-y-1.5">
            <div className="text-[10px] text-text-muted">// RAW SOURCE INCIDENT LOG</div>
            <div className="text-[11px] text-text-primary leading-relaxed bg-black/40 p-2.5 border border-border/60">
              {event.notes ? event.notes : 'No raw descriptive notes attached to this record.'}
            </div>
          </div>

          {/* Source Attribution & Link */}
          <div className="bg-panel-subtle p-3 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <div>
              <span className="text-text-muted">SOURCE ATTRIBUTION:</span>{' '}
              <span className="text-text-primary font-bold">{event.source || 'GEMINI GROUNDED INTEL'}</span>
            </div>
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-accent-cyan hover:underline font-bold tracking-wide"
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
        <div className="px-4 py-2 bg-panel-subtle border-t border-border flex items-center justify-between text-[10px] text-text-muted">
          <span>EVENT HASH: {event.id}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-panel hover:bg-panel-hover border border-border text-text-primary"
          >
            DISMISS [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
