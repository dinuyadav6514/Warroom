'use client';

import React from 'react';
import { ConflictEvent } from '@/types/conflict';
import {
  MapPin,
  Calendar,
  Radio,
  ExternalLink,
  Crosshair,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { cleanHtmlAndMarkup, summarizeEventWithInbuiltAi } from '@/lib/intelligence/event-summarizer';

interface MobileReadViewProps {
  events: ConflictEvent[];
  onFocusOnMap: (event: ConflictEvent) => void;
  onOpenEventModal: (event: ConflictEvent) => void;
  theme?: 'dark' | 'light';
}

export const MobileReadView: React.FC<MobileReadViewProps> = ({
  events,
  onFocusOnMap,
  onOpenEventModal,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  if (!events || events.length === 0) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-6 text-center font-mono ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}
      >
        <Radio className="w-8 h-8 text-cyan-400 mb-2 animate-pulse" />
        <h3 className="font-bold text-sm tracking-wider uppercase mb-1">
          AWAITING NEWS TELEMETRY
        </h3>
        <p className="text-xs max-w-xs text-slate-500">
          No live conflict events match current filter parameters. Dispatching live intelligence refresh...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full overflow-y-auto px-3 py-3 font-mono space-y-2.5 transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-black/90 text-white'
      }`}
    >
      <div className="flex items-center justify-between pb-1 px-1 border-b border-white/5">
        <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
          LIVE NEWS WIRE &bull; {events.length} INCIDENTS
        </span>
        <span className="text-[9px] text-slate-400">PULL DOWN TO REFRESH</span>
      </div>

      {events.map((event) => {
        const headline = cleanHtmlAndMarkup(
          event.notes || event.eventType || 'Unspecified Incident'
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
            key={event.id}
            className={`p-3 rounded-2xl border transition-all ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-sm hover:border-cyan-600/40'
                : 'glass-panel border-white/10 hover:border-cyan-400/50 shadow-md'
            }`}
          >
            {/* Top Badge Row */}
            <div className="flex items-center justify-between gap-1.5 pb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border uppercase ${severityColor}`}
                >
                  {severity}
                </span>

                {event.primaryCategory && (
                  <span
                    className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isLight
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-white/10 text-cyan-300'
                    }`}
                  >
                    {event.primaryCategory}
                  </span>
                )}
              </div>

              {event.source && (
                <span className="text-[8px] text-slate-400 truncate max-w-[100px] uppercase">
                  {event.source}
                </span>
              )}
            </div>

            {/* Event Headline */}
            <h4
              onClick={() => onOpenEventModal(event)}
              className={`font-bold text-xs leading-snug tracking-tight mb-1.5 cursor-pointer hover:text-cyan-400 transition-colors ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {headline}
            </h4>

            {/* Location & Date */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-slate-400 mb-2">
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
              {event.fatalities !== undefined && event.fatalities > 0 && (
                <span className="text-red-400 font-bold">
                  {event.fatalities} Fatalities
                </span>
              )}
            </div>

            {/* Sensor Corroboration Label */}
            {event.confidenceLabel && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 mb-2">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>SENSOR FUSION: {event.confidenceLabel}</span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => onFocusOnMap(event)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-cyan-300'
                    : 'bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>FOCUS ON GLOBE</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenEventModal(event)}
                className={`py-1.5 px-3 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                <span>DETAILS</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
