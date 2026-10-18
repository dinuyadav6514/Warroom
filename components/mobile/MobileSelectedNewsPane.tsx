'use client';

import React from 'react';
import { ConflictEvent, Conflict } from '@/types/conflict';
import {
  X,
  FileText,
  MapPin,
  Calendar,
  ShieldAlert,
  Sparkles,
  Radio,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { summarizeEventWithInbuiltAi, cleanHtmlAndMarkup } from '@/lib/intelligence/event-summarizer';

interface MobileSelectedNewsPaneProps {
  event: ConflictEvent | null;
  conflict: Conflict | null;
  onClose: () => void;
  onOpenEventModal: (event: ConflictEvent) => void;
  theme?: 'dark' | 'light';
}

export const MobileSelectedNewsPane: React.FC<MobileSelectedNewsPaneProps> = ({
  event,
  conflict,
  onClose,
  onOpenEventModal,
  theme = 'dark',
}) => {
  if (!event && !conflict) return null;

  const isLight = theme === 'light';

  // If conflict selected without specific event
  if (conflict && !event) {
    return (
      <div
        className={`w-full h-full flex flex-col justify-between p-3 select-none font-mono text-[11px] border-0 outline-none transition-colors ${
          isLight
            ? 'bg-slate-100/90 text-slate-800'
            : 'bg-black/90 text-white backdrop-blur-md'
        }`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
            <span className="text-[9px] font-bold tracking-wider text-cyan-400 uppercase">
              THEATER RECON
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Close and return to full globe"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h3
            className={`font-bold text-xs uppercase leading-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {conflict.name}
          </h3>

          <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400">
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>{conflict.country || 'Global'}</span>
            <span>&bull;</span>
            <span
              className={`font-bold ${
                conflict.status === 'ESCALATING'
                  ? 'text-red-400'
                  : conflict.status === 'DEESCALATING'
                  ? 'text-emerald-400'
                  : 'text-amber-300'
              }`}
            >
              {conflict.status}
            </span>
          </div>

          <div
            className={`p-2 rounded-lg text-[10px] leading-relaxed ${
              isLight ? 'bg-white text-slate-700' : 'bg-white/5 text-slate-300'
            }`}
          >
            {conflict.escalationReason ||
              'Active kinetic engagement theater monitored across military and wire surveillance feeds.'}
          </div>
        </div>

        <div className="pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[10.5px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <span>DISMISS THEATER</span>
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  // Inbuilt AI tactical synthesis
  const sitrep = summarizeEventWithInbuiltAi(event);
  const headline = cleanHtmlAndMarkup(
    sitrep.cleanHeadline || event.notes || event.eventType
  );
  const severity = event.severity || 'MODERATE';
  const severityColor =
    severity === 'CRITICAL'
      ? 'bg-red-500/20 text-red-400 border-red-500/40'
      : severity === 'HIGH'
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      : severity === 'MODERATE'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';

  return (
    <div
      className={`w-full h-full flex flex-col justify-between p-2.5 sm:p-3 select-none font-mono text-[11px] border-0 outline-none animate-in fade-in slide-in-from-right duration-200 transition-colors ${
        isLight
          ? 'bg-slate-100/95 text-slate-900 shadow-xl'
          : 'bg-black/90 text-white backdrop-blur-md shadow-2xl'
      }`}
    >
      {/* Scrollable Upper News Information Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-0.5">
        {/* Top Dismiss Row + Tactical Badges */}
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border uppercase ${severityColor}`}
            >
              {severity}
            </span>
            {event.primaryCategory && (
              <span
                className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[120px] ${
                  isLight
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-white/10 text-cyan-300'
                }`}
              >
                {event.primaryCategory}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Close and return to full globe"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clean Event Headline */}
        <h3
          className={`font-bold text-[11px] sm:text-xs leading-snug tracking-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {headline}
        </h3>

        {/* Location, Country, and Date Metadata */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-300">
              {event.location || event.country || 'Target Area'}
            </span>
            {event.country && event.country !== event.location && (
              <span>({event.country})</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{event.eventDate || 'LIVE'}</span>
          </div>
        </div>

        {/* Inbuilt AI Situation Brief */}
        <div
          className={`p-2 rounded-xl text-[10px] leading-relaxed space-y-1 ${
            isLight
              ? 'bg-white text-slate-700 border border-slate-200'
              : 'bg-white/5 text-slate-300 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-1 text-[9px] font-bold text-cyan-400">
            <Sparkles className="w-2.5 h-2.5" />
            <span>INBUILT AI TACTICAL SITREP</span>
          </div>
          <p className="line-clamp-4">{sitrep.situationBrief}</p>
        </div>

        {/* Sensor Corroboration Badge */}
        {event.confidenceLabel && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            <span>SENSOR STATUS: {event.confidenceLabel}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Area: READ FULL NEWS Button */}
      <div className="pt-2 shrink-0">
        <button
          type="button"
          onClick={() => onOpenEventModal(event)}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold text-[10.5px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-[0_0_16px_rgba(6,182,212,0.35)] cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>READ FULL NEWS</span>
        </button>
      </div>
    </div>
  );
};
