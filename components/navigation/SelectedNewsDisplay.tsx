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
} from 'lucide-react';

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
      <div className="h-full flex flex-col bg-[#05080c] border border-border/80 rounded-[2px] overflow-hidden select-none font-mono">
        {/* Header with Back Button */}
        <div className="bg-[#090e15] border-b border-border/80 px-2.5 py-1.5 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-[10.5px] font-bold text-accent-cyan hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>// LIVE TERMINAL</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-panel-subtle rounded transition-colors cursor-pointer"
            title="Close theater and return to terminal"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Theater Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted tracking-wider">// THEATER INTEL</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-[2px] ${statusColor}`}>
              {conflict.status}
            </span>
          </div>

          <div>
            <TypewriterText
              as="h3"
              text={conflict.name}
              className="text-sm font-bold text-text-primary leading-snug cursor-pointer"
              speed={14}
            />
            <div className="flex items-center gap-1 text-[10.5px] text-accent-cyan mt-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <TypewriterText
                text={`${conflict.country || 'Global'}${conflict.region ? ` (${conflict.region})` : ''}`}
                cursor={false}
                delay={200}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-2 bg-black/40 border border-border/60 rounded-[2px] text-[10px]">
            <div>
              <span className="text-text-muted">7D CASUALTIES:</span>
              <div className="text-severity-critical font-bold text-[11px]">{conflict.fatalities7d || 0}</div>
            </div>
            <div>
              <span className="text-text-muted">7D INCIDENTS:</span>
              <div className="text-accent-cyan font-bold text-[11px]">{conflict.eventCount7d || conflict.recentEvents?.length || 0}</div>
            </div>
          </div>

          {/* Recent incidents in this theater */}
          {conflict.recentEvents && conflict.recentEvents.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[9.5px] font-bold text-text-muted tracking-wider">
                // INCIDENTS IN THEATER ({conflict.recentEvents.length})
              </div>
              <div className="space-y-1">
                {conflict.recentEvents.slice(0, 4).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent?.(ev)}
                    className="w-full p-1.5 bg-panel-subtle/50 hover:bg-panel-hover border border-border/50 hover:border-accent-cyan/60 rounded text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[9px] text-text-muted mb-0.5">
                      <span className="text-accent-cyan truncate">{ev.location}</span>
                      <span>{ev.eventDate}</span>
                    </div>
                    <div className="text-[10px] text-text-primary line-clamp-2 group-hover:text-accent-cyan leading-tight">
                      {ev.notes || ev.eventType}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-2 py-1.5 border border-border hover:border-accent-cyan/60 bg-panel-subtle text-text-secondary hover:text-text-primary text-[10px] font-bold rounded-[2px] transition-colors cursor-pointer"
          >
            ← RETURN TO LIVE TERMINAL
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

  return (
    <div className="h-full flex flex-col bg-[#05080c] border border-border/80 rounded-[2px] overflow-hidden select-none font-mono">
      {/* Header Bar with Back Button */}
      <div className="bg-[#090e15] border-b border-border/80 px-2.5 py-1.5 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[10.5px] font-bold text-accent-cyan hover:text-cyan-300 transition-colors cursor-pointer"
          title="Return to live terminal"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>// LIVE TERMINAL</span>
        </button>

        <button
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-primary hover:bg-panel-subtle rounded transition-colors cursor-pointer"
          title="Deselect and return to terminal"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Main News Content Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5 text-xs">
        {/* Badges strip */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-[2px] ${
              isNews ? 'bg-blue-950/60 text-blue-400 border-blue-700/80' : severityBadgeClass
            }`}
          >
            {isNews ? 'NEWS DISPATCH' : severity}
          </span>

          {event!.primaryCategory && (
            <span className="text-[9px] px-1.5 py-0.5 border border-border/60 bg-black/50 text-text-secondary rounded-[2px]">
              {event!.primaryCategory.toUpperCase()}
            </span>
          )}

          {event!.verificationStatus && (
            <span className="text-[8.5px] px-1 py-0.5 border border-cyan-900/60 bg-cyan-950/30 text-accent-cyan rounded-[2px] ml-auto">
              [{event!.verificationStatus}]
            </span>
          )}
        </div>

        {/* Headline / Summary */}
        <div>
          <TypewriterText
            as="h2"
            text={event!.notes || `${event!.eventType} in ${event!.location}, ${event!.country}`}
            className="text-[12px] font-bold text-text-primary leading-snug cursor-pointer"
            speed={12}
          />
          <div className="flex items-center gap-1 text-[10px] text-accent-cyan mt-1">
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
        <div className="grid grid-cols-2 gap-1.5 p-2 bg-black/40 border border-border/60 rounded-[2px] text-[9.5px]">
          <div>
            <span className="text-text-muted">EVENT TYPE:</span>
            <div className="text-text-primary font-semibold truncate">
              <TypewriterText text={event!.eventType} cursor={false} delay={300} />
            </div>
          </div>
          <div>
            <span className="text-text-muted">DATE / TIME:</span>
            <div className="text-text-secondary font-mono">
              <TypewriterText text={event!.eventDate || event!.publishedAt || 'RECENT'} cursor={false} delay={400} />
            </div>
          </div>
          {!isNews && (
            <div>
              <span className="text-text-muted">CASUALTIES:</span>
              <div className={`font-bold ${event!.fatalities && event!.fatalities > 0 ? 'text-severity-critical' : 'text-text-secondary'}`}>
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
              <span className="text-text-muted">THEATER:</span>
              <div className="text-text-secondary truncate">
                <TypewriterText text={event!.region} cursor={false} delay={600} />
              </div>
            </div>
          )}
        </div>

        {/* Source & Direct Link Button */}
        <div className="p-2 bg-[#080d13] border border-border/70 rounded-[2px] space-y-1.5">
          <div className="flex items-center justify-between text-[9.5px]">
            <span className="text-text-muted">ORIGINAL SOURCE:</span>
            <span className="text-accent-cyan font-bold truncate max-w-[130px]">
              <TypewriterText text={event!.source || 'Verified International Wire'} cursor={false} delay={350} />
            </span>
          </div>

          {event!.sourceUrl && (
            <a
              href={event!.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-1 px-2 bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan text-accent-cyan text-[10px] font-bold rounded-[2px] transition-colors"
            >
              <span>READ ORIGINAL POST</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Smart Merging Corroboration */}
        {(event!.mergedCount && event!.mergedCount > 1) || (event!.mergedSources && event!.mergedSources.length > 0) ? (
          <div className="p-2 bg-cyan-950/20 border border-cyan-800/40 rounded-[2px] space-y-1">
            <div className="flex items-center gap-1 text-[9.5px] text-accent-cyan font-bold">
              <Layers className="w-3 h-3" />
              <span>CORROBORATING SOURCES ({event!.mergedSources?.length || event!.mergedCount}):</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {(event!.mergedSources || []).map((s, idx) => (
                <span
                  key={idx}
                  className="text-[8.5px] px-1 py-0.2 bg-black/60 border border-border/70 text-text-secondary rounded"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Related Dispatches in Theater */}
        {relatedRegionalEvents.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[9.5px] font-bold text-text-muted tracking-wider">
              // MORE IN {event!.country?.toUpperCase()} ({relatedRegionalEvents.length})
            </div>
            <div className="space-y-1">
              {relatedRegionalEvents.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => onSelectEvent?.(rel)}
                  className="w-full p-1.5 bg-panel-subtle/40 hover:bg-panel-hover border border-border/50 hover:border-accent-cyan/50 rounded text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[8.5px] text-text-muted mb-0.5">
                    <span className="text-accent-cyan truncate max-w-[120px]">{rel.location}</span>
                    <span>{rel.eventDate}</span>
                  </div>
                  <div className="text-[9.5px] text-text-secondary group-hover:text-text-primary line-clamp-2 leading-tight">
                    {rel.notes || rel.eventType}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-1 space-y-1.5">
          {onOpenEventModal && (
            <button
              onClick={() => onOpenEventModal(event!)}
              className="w-full py-1.5 bg-panel-subtle hover:bg-panel-hover border border-border hover:border-accent-cyan/60 text-text-primary text-[10px] font-bold rounded-[2px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>INSPECT FULL INTEL DOSSIER</span>
              <ChevronRight className="w-3 h-3 text-accent-cyan" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-1 border border-border/60 hover:border-border bg-black/30 hover:bg-panel-subtle text-text-muted hover:text-text-secondary text-[9.5px] rounded-[2px] transition-colors cursor-pointer"
          >
            ← RETURN TO LIVE TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
};
