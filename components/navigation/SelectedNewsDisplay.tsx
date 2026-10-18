'use client';

import React from 'react';
import { ConflictEvent, Conflict } from '@/types/conflict';
import { TypewriterText } from '@/components/ui/TypewriterText';
import {
  ArrowLeft,
  X,
  ExternalLink,
  MapPin,
  Calendar,
  AlertTriangle,
  Globe,
  Radio,
  FileText,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { summarizeEventWithInbuiltAi } from '@/lib/intelligence/event-summarizer';

interface SelectedNewsDisplayProps {
  event: ConflictEvent | null;
  conflict: Conflict | null;
  onClose: () => void;
  onSelectEvent?: (event: ConflictEvent) => void;
  onOpenEventModal?: (event: ConflictEvent) => void;
  allEvents?: ConflictEvent[];
}

export const SelectedNewsDisplay: React.FC<SelectedNewsDisplayProps> = ({
  event,
  conflict,
  onClose,
  onSelectEvent,
  onOpenEventModal,
  allEvents = [],
}) => {
  if (!event && !conflict) return null;

  // Render theater/conflict if selected without specific event
  if (conflict && !event) {
    const statusColor =
      conflict.status === 'ESCALATING'
        ? 'text-severity-critical border-red-600 bg-red-950/40'
        : conflict.status === 'DEESCALATING'
        ? 'text-blue-400 border-blue-600 bg-blue-950/40'
        : 'text-amber-400 border-amber-600 bg-amber-950/40';

    return (
      <div className="w-full flex-1 flex flex-col bg-transparent select-none font-mono min-h-[380px]">
        {/* Minimal Transparent Return Link */}
        <div className="flex items-center justify-between pb-2 pt-0.5 text-[10px] shrink-0 border-b border-white/5 mb-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-[10.5px] font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO STREAM</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close theater and return to stream"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Theater Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-semibold tracking-wider">// THEATER INTEL</span>
            <span className={`text-[9.5px] font-bold px-2 py-0.5 border rounded-full ${statusColor}`}>
              {conflict.status}
            </span>
          </div>

          <div className="glass-panel-subtle rounded-2xl p-3 border border-white/[0.10] space-y-1">
            <TypewriterText
              as="h3"
              text={conflict.name}
              className="text-sm font-bold text-white leading-snug cursor-pointer"
              speed={14}
            />
            <div className="flex items-center gap-1 text-[10.5px] text-cyan-300 mt-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <TypewriterText
                text={`${conflict.country || 'Global'}${conflict.region ? ` (${conflict.region})` : ''}`}
                cursor={false}
                delay={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-2.5 glass-panel-subtle rounded-2xl border border-white/[0.10] text-[10px]">
            <div>
              <span className="text-zinc-500">7D CASUALTIES:</span>
              <div className="text-rose-400 font-bold text-[11px] mt-0.5">{conflict.fatalities7d || 0}</div>
            </div>
            <div>
              <span className="text-zinc-500">7D INCIDENTS:</span>
              <div className="text-cyan-300 font-bold text-[11px] mt-0.5">{conflict.eventCount7d || conflict.recentEvents?.length || 0}</div>
            </div>
          </div>

          {/* Recent incidents in this theater */}
          {conflict.recentEvents && conflict.recentEvents.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[9.5px] font-bold text-zinc-400 tracking-wider">
                // INCIDENTS IN THEATER ({conflict.recentEvents.length})
              </div>
              <div className="space-y-1.5">
                {conflict.recentEvents.slice(0, 4).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent?.(ev)}
                    className="w-full p-2.5 rounded-lg glass-panel-subtle hover:border-white/20 border border-white/5 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-0.5">
                      <span className="text-cyan-300 font-medium truncate">{ev.location}</span>
                      <span>{ev.eventDate}</span>
                    </div>
                    <div className="text-[10px] text-zinc-200 line-clamp-2 group-hover:text-white leading-tight">
                      {ev.notes || ev.eventType}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-2 py-1.5 rounded-full glass-pill text-zinc-300 hover:text-white text-[10.5px] font-semibold transition-all cursor-pointer"
          >
            ← RETURN TO LIVE STREAM
          </button>
        </div>
      </div>
    );
  }

  // Active conflict or general news event
  const isNews = event!.isConflict === false;
  const severity = event!.severity || 'MODERATE';
  const severityBadgeClass =
    severity === 'CRITICAL'
      ? 'bg-red-950/60 text-severity-critical border-red-700/80'
      : severity === 'HIGH'
      ? 'bg-amber-950/60 text-severity-high border-amber-700/80'
      : severity === 'MODERATE'
      ? 'bg-yellow-950/60 text-severity-moderate border-yellow-700/80'
      : 'bg-emerald-950/60 text-severity-low border-emerald-700/80';

  // Find related events in the same country/region
  const relatedRegionalEvents = allEvents
    .filter(
      (e) =>
        e.id !== event!.id &&
        (e.country?.toLowerCase() === event!.country?.toLowerCase() ||
          (e.region && event!.region && e.region.toLowerCase() === event!.region.toLowerCase()))
    )
    .slice(0, 3);

  const aiSummary = event ? summarizeEventWithInbuiltAi(event) : null;

  return (
    <div className="w-full flex-1 flex flex-col bg-transparent select-none font-mono min-h-[380px]">
      {/* Minimal Transparent Return Link */}
      <div className="flex items-center justify-between pb-2 pt-0.5 text-[10px] shrink-0 border-b border-white/5 mb-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[10.5px] font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer"
          title="Return to live conflict stream"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO STREAM</span>
        </button>

        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Deselect and return to stream"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main News Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 text-xs">
        {/* Badges strip */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[9.5px] font-bold px-2 py-0.5 border rounded-full ${
              isNews ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : severityBadgeClass
            }`}
          >
            {isNews ? 'NEWS DISPATCH' : severity}
          </span>

          {event!.primaryCategory && (
            <span className="text-[9px] px-2 py-0.5 border border-white/10 bg-white/5 text-zinc-300 rounded-full font-medium">
              {event!.primaryCategory.toUpperCase()}
            </span>
          )}

          {event!.verificationStatus === 'VERIFIED' && (
            <span className="text-[9px] px-2 py-0.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 rounded-full font-bold ml-auto">
              [VERIFIED]
            </span>
          )}
        </div>

        {/* Headline / Inbuilt AI SITREP */}
        <div className="glass-panel-subtle rounded-xl p-3 border border-white/5 space-y-2">
          <TypewriterText
            as="h2"
            text={aiSummary?.cleanHeadline || event!.notes || `${event!.eventType} in ${event!.location}`}
            className="text-[12.5px] font-bold text-white leading-snug cursor-pointer"
            speed={12}
          />

          {aiSummary?.situationBrief && (
            <div className="rounded-xl p-2.5 bg-white/[0.04] dark:bg-black/35 border border-white/[0.08] flex flex-col gap-1.5 text-[10px]">
              <div className="max-h-[160px] overflow-y-auto pr-1 text-zinc-300 text-[9.5px] font-sans leading-relaxed space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                {aiSummary.situationBrief.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
              {aiSummary.impactAssessment && (
                <div className="text-[8.5px] text-zinc-400 font-mono pt-1 border-t border-white/[0.05] flex items-center justify-between">
                  <span>{aiSummary.impactAssessment}</span>
                  <span className="text-cyan-400 font-bold">{event?.source || 'INTEL WIRE'}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10.5px] text-cyan-300 pt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            <TypewriterText
              text={`${event!.location}, ${event!.country}`}
              className="truncate"
              cursor={false}
              delay={250}
            />
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 p-2.5 glass-panel-subtle rounded-xl border border-white/5 text-[10px]">
          <div>
            <span className="text-zinc-500">EVENT TYPE:</span>
            <div className="text-white font-semibold truncate mt-0.5">
              <TypewriterText text={event!.eventType} cursor={false} delay={300} />
            </div>
          </div>
          <div>
            <span className="text-zinc-500">DATE / TIME:</span>
            <div className="text-zinc-300 font-mono mt-0.5">
              <TypewriterText text={event!.eventDate || event!.publishedAt || 'RECENT'} cursor={false} delay={400} />
            </div>
          </div>
          {!isNews && (
            <div>
              <span className="text-zinc-500">CASUALTIES:</span>
              <div className={`font-bold mt-0.5 ${event!.fatalities && event!.fatalities > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
                <TypewriterText
                  text={event!.fatalities && event!.fatalities > 0 ? `${event!.fatalities} reported` : 'None reported'}
                  cursor={false}
                  delay={500}
                />
              </div>
            </div>
          )}
          {event!.region && (
            <div>
              <span className="text-zinc-500">THEATER:</span>
              <div className="text-zinc-300 truncate mt-0.5">
                <TypewriterText text={event!.region} cursor={false} delay={600} />
              </div>
            </div>
          )}
        </div>

        {/* Source & Direct Link Button */}
        <div className="p-2.5 glass-panel-subtle rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">ORIGINAL SOURCE:</span>
            <span className="text-cyan-300 font-bold truncate max-w-[140px]">
              <TypewriterText text={event!.source || 'Verified International Wire'} cursor={false} delay={350} />
            </span>
          </div>

          {event!.sourceUrl && (
            <a
              href={event!.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full glass-pill text-cyan-300 hover:text-white text-[10.5px] font-bold transition-all"
            >
              <span>READ ORIGINAL POST</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Smart Merging Corroboration */}
        {(event!.mergedCount && event!.mergedCount > 1) || (event!.mergedSources && event!.mergedSources.length > 0) ? (
          <div className="p-2.5 glass-panel-subtle border border-cyan-500/20 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>CORROBORATING SOURCES ({event!.mergedSources?.length || event!.mergedCount}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {(event!.mergedSources || []).map((s, idx) => (
                <span
                  key={idx}
                  className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/10 text-zinc-300 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Related Dispatches in Theater */}
        {relatedRegionalEvents.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[9.5px] font-bold text-zinc-400 tracking-wider">
              // MORE IN {event!.country?.toUpperCase()} ({relatedRegionalEvents.length})
            </div>
            <div className="space-y-1.5">
              {relatedRegionalEvents.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => onSelectEvent?.(rel)}
                  className="w-full p-2.5 rounded-lg glass-panel-subtle hover:border-white/20 border border-white/5 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-0.5">
                    <span className="text-cyan-300 font-medium truncate max-w-[130px]">{rel.location}</span>
                    <span>{rel.eventDate}</span>
                  </div>
                  <div className="text-[10px] text-zinc-200 group-hover:text-white line-clamp-2 leading-tight">
                    {rel.notes || rel.eventType}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-1.5 space-y-2">
          {onOpenEventModal && (
            <button
              onClick={() => onOpenEventModal(event!)}
              className="w-full py-2 rounded-full glass-panel border border-cyan-400/40 hover:border-cyan-400 text-white text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <span>INSPECT FULL INTEL DOSSIER</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-1.5 rounded-full glass-pill text-zinc-400 hover:text-white text-[10px] transition-all cursor-pointer font-medium"
          >
            ← RETURN TO LIVE STREAM
          </button>
        </div>
      </div>
    </div>
  );
};
