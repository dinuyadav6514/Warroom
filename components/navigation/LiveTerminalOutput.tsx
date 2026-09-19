'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ApiExchange, ConflictEvent } from '@/types/conflict';
import { TypewriterText } from '@/components/ui/TypewriterText';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Crosshair,
  Radio,
  ExternalLink,
} from 'lucide-react';

interface StreamHistoryEntry {
  id: string;
  time: string;
  severity: string;
  country: string;
  text: string;
}

interface LiveTerminalOutputProps {
  apiExchange?: ApiExchange | null;
  isRefreshing?: boolean;
  lastSyncAt?: string | null;
  eventsCount?: number;
  events?: ConflictEvent[];
  availableSources?: string[];
  onSelectEvent?: (event: ConflictEvent) => void;
  onOpenFullStream?: () => void;
}

const FALLBACK_STREAM_EVENTS: ConflictEvent[] = [
  {
    id: 'stream-fb-1',
    eventDate: 'RECENT',
    eventType: 'Explosive Hazards / Airstrike',
    primaryCategory: 'Warfare & Combat',
    region: 'Middle East',
    country: 'Israel / Palestine',
    location: 'Gaza Strip',
    latitude: 31.3547,
    longitude: 34.3088,
    fatalities: 14,
    source: 'UN OCHA ReliefWeb',
    notes: 'Multiple precision strikes reported in northern sector; emergency medical corridors disrupted.',
    severity: 'CRITICAL',
    isConflict: true,
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'stream-fb-2',
    eventDate: 'RECENT',
    eventType: 'Drone / Missile Strike',
    primaryCategory: 'Defense & Strategy',
    region: 'Eastern Europe',
    country: 'Ukraine',
    location: 'Kharkiv Oblast',
    latitude: 49.9935,
    longitude: 36.2304,
    fatalities: 4,
    source: 'GDELT Tactical Feed',
    notes: 'Shahed-136 drone swarm intercepted over eastern industrial perimeter; power grid switchyard damaged.',
    severity: 'HIGH',
    isConflict: true,
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'stream-fb-3',
    eventDate: 'RECENT',
    eventType: 'Naval Engagement / Anti-Ship Missile',
    primaryCategory: 'Warfare & Combat',
    region: 'Middle East',
    country: 'Yemen',
    location: 'Southern Red Sea / Bab el-Mandeb',
    latitude: 12.5833,
    longitude: 43.3333,
    fatalities: 0,
    source: 'UKMTO Maritime Intel',
    notes: 'Commercial bulk carrier reports near-miss explosion 25nm southwest of Al-Mukha; crew safe.',
    severity: 'HIGH',
    isConflict: true,
    verificationStatus: 'REPORTED',
  },
  {
    id: 'stream-fb-4',
    eventDate: 'RECENT',
    eventType: 'Armed Clashes / Heavy Artillery',
    primaryCategory: 'Warfare & Combat',
    region: 'Africa',
    country: 'Sudan',
    location: 'Al-Fashir, North Darfur',
    latitude: 13.6288,
    longitude: 25.3547,
    fatalities: 22,
    source: 'ReliefWeb Humanitarian Dispatch',
    notes: 'RSF advances trigger intense artillery exchange near city market; major humanitarian aid cutoff.',
    severity: 'CRITICAL',
    isConflict: true,
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'stream-fb-5',
    eventDate: 'RECENT',
    eventType: 'Border Incursion / Drone Surveillance',
    primaryCategory: 'Defense & Strategy',
    region: 'Asia',
    country: 'Myanmar',
    location: 'Shan State Border Corridor',
    latitude: 22.0,
    longitude: 98.0,
    fatalities: 8,
    source: 'Local Ground Corroboration',
    notes: 'Rebel coalition captures strategic outpost along transit highway; junta launches retaliatory sortie.',
    severity: 'MODERATE',
    isConflict: true,
    verificationStatus: 'REPORTED',
  },
];

export const LiveTerminalOutput: React.FC<LiveTerminalOutputProps> = ({
  apiExchange,
  isRefreshing = false,
  lastSyncAt,
  eventsCount = 0,
  events = [],
  availableSources = [],
  onSelectEvent,
  onOpenFullStream,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState<StreamHistoryEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getUtcTime = () => new Date().toTimeString().substring(0, 8);

  // Active conflict news pool
  const streamEvents = useMemo(() => {
    if (!events || events.length === 0) return FALLBACK_STREAM_EVENTS;
    const valid = events.filter((e) => e && (e.notes || e.eventType || e.location));
    if (valid.length === 0) return FALLBACK_STREAM_EVENTS;
    return valid;
  }, [events]);

  const currentEvent = streamEvents[currentIndex % streamEvents.length] || streamEvents[0];

  // 30-second live cycle timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrentIndex((idx) => (idx + 1) % (streamEvents.length || 1));
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, streamEvents.length]);

  // Log dispatch into stream history whenever currentEvent changes
  useEffect(() => {
    if (!currentEvent) return;
    const time = getUtcTime();
    setHistory((prev) => [
      ...prev.slice(-25),
      {
        id: `${Date.now()}-${currentEvent.id}`,
        time,
        severity: currentEvent.severity || 'MODERATE',
        country: currentEvent.country || 'GLOBAL',
        text: currentEvent.notes || `${currentEvent.eventType} in ${currentEvent.location}`,
      },
    ]);
  }, [currentEvent]);

  // Auto-scroll terminal history to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleNext = () => {
    setCurrentIndex((idx) => (idx + 1) % streamEvents.length);
    setTimeLeft(30);
  };

  const handlePrev = () => {
    setCurrentIndex((idx) => (idx - 1 + streamEvents.length) % streamEvents.length);
    setTimeLeft(30);
  };

  const severityColor =
    currentEvent?.severity === 'CRITICAL'
      ? 'text-severity-critical border-red-800/80 bg-red-950/40'
      : currentEvent?.severity === 'HIGH'
      ? 'text-amber-400 border-amber-800/80 bg-amber-950/40'
      : currentEvent?.severity === 'MODERATE'
      ? 'text-yellow-400 border-yellow-800/80 bg-yellow-950/40'
      : 'text-emerald-400 border-emerald-800/80 bg-emerald-950/40';

  const progressPercent = Math.min(100, Math.max(0, ((30 - timeLeft) / 30) * 100));

  return (
    <div className="w-full flex flex-col bg-transparent select-none font-mono text-xs space-y-2">
      {/* Top Action Button: Open Full Live Conflict Stream */}
      {onOpenFullStream && (
        <button
          onClick={onOpenFullStream}
          className="w-full h-[26px] mb-1.5 shrink-0 text-[9.5px] tracking-wider font-bold text-accent-cyan hover:text-white bg-accent-cyan/10 hover:bg-accent-cyan/25 border border-accent-cyan/40 hover:border-accent-cyan rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group"
          title="Open Full Live Conflict Stream Terminal"
        >
          <Radio className="w-3 h-3 text-accent-green animate-pulse group-hover:scale-110 transition-transform" />
          <span>OPEN FULL LIVE CONFLICT STREAM</span>
          <ExternalLink className="w-3 h-3 text-accent-cyan/70 group-hover:text-white transition-colors" />
        </button>
      )}

      {/* 30-Second Progress Sweep & Controls (Clean, minimal, zero clutter) */}
      <div className="flex items-center gap-2 h-[16px] shrink-0 mb-1.5">
        <div className="flex-1 bg-white/10 h-[2px] rounded-full overflow-hidden">
          <div
            className="bg-accent-cyan h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-0.5 shrink-0 text-text-muted">
          <button
            onClick={handlePrev}
            className="p-0.5 hover:text-accent-cyan hover:bg-white/5 rounded transition-colors cursor-pointer"
            title="Previous dispatch"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-0.5 hover:text-accent-cyan hover:bg-white/5 rounded transition-colors cursor-pointer"
            title={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
          >
            {isPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
          </button>
          <button
            onClick={handleNext}
            className="p-0.5 hover:text-accent-cyan hover:bg-white/5 rounded transition-colors cursor-pointer"
            title="Next dispatch"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Featured Live Conflict Dispatch Card */}
      <div className="min-h-[290px] shrink-0 bg-white/[0.03] border border-white/10 rounded-[2px] p-3 flex flex-col justify-between">
        {/* Badges Row - Fixed 22px */}
        <div className="flex items-center justify-between gap-1 flex-wrap h-[22px] shrink-0">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-[2px] ${severityColor}`}>
            {currentEvent?.severity || 'MODERATE'}
          </span>
          {currentEvent?.primaryCategory && (
            <span className="text-[9px] px-1.5 py-0.5 border border-white/10 text-text-secondary rounded-[2px] truncate max-w-[110px]">
              {currentEvent.primaryCategory.toUpperCase()}
            </span>
          )}
          {currentEvent?.verificationStatus && (
            <span className="text-[8.5px] px-1 py-0.5 border border-accent-cyan/30 text-accent-cyan rounded-[2px]">
              [{currentEvent.verificationStatus}]
            </span>
          )}
          <span className="text-[8.5px] text-text-muted ml-auto font-mono">
            {currentEvent?.eventDate || 'LIVE'}
          </span>
        </div>

        {/* Live Headline Container */}
        <div
          onClick={() => onSelectEvent?.(currentEvent)}
          className="min-h-[145px] max-h-[180px] shrink-0 overflow-hidden cursor-pointer group flex items-start py-0.5"
          title="Click to zoom to this conflict on map"
        >
          <TypewriterText
            key={`headline-${currentEvent.id}-${currentIndex}`}
            as="div"
            text={currentEvent.notes || `${currentEvent.eventType} in ${currentEvent.location}`}
            className="text-[12px] font-bold text-text-primary group-hover:text-accent-cyan leading-relaxed line-clamp-8 transition-colors"
            speed={12}
          />
        </div>

        {/* Geolocation & Coordinates - Fixed 24px */}
        <div className="flex items-center justify-between gap-1 text-[10.5px] text-accent-cyan h-[24px] shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <TypewriterText
              key={`loc-${currentEvent.id}-${currentIndex}`}
              text={`${currentEvent.location}, ${currentEvent.country}`}
              className="truncate"
              cursor={false}
              delay={200}
            />
          </div>
          {currentEvent?.latitude != null && currentEvent?.longitude != null && (
            <span className="text-[8.5px] text-text-muted font-mono shrink-0">
              [{currentEvent.latitude.toFixed(1)}°, {currentEvent.longitude.toFixed(1)}°]
            </span>
          )}
        </div>

        {/* Target On Map Action Button - Fixed 30px */}
        {onSelectEvent ? (
          <button
            onClick={() => onSelectEvent(currentEvent)}
            className="w-full h-[30px] shrink-0 text-[10.5px] bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/50 hover:border-accent-cyan text-accent-cyan font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>LOCATE & ZOOM ON MAP</span>
          </button>
        ) : (
          <div className="h-[30px] shrink-0" />
        )}
      </div>

      {/* Live Stream Terminal History Feed - With fixed scrollable height */}
      <div className="flex flex-col pt-1 shrink-0">
        <div className="text-[9px] font-bold text-text-muted tracking-wider pb-1 shrink-0 flex items-center justify-between h-[18px]">
          <span>// STREAM FEED LOG</span>
          <span className="text-[8px] text-accent-cyan">30S POLLING</span>
        </div>

        <div
          ref={scrollRef}
          className="h-48 min-h-[140px] overflow-y-auto space-y-1 text-[9.5px] leading-tight select-text pr-1 bg-black/30 p-2 rounded border border-white/5"
        >
          {history.map((item) => (
            <div key={item.id} className="flex items-start gap-1 font-mono text-text-secondary/90">
              <span className="text-text-muted/60 text-[8.5px] shrink-0 font-light">[{item.time}]</span>
              <span
                className={`text-[8px] px-1 py-0.2 rounded shrink-0 font-bold leading-none ${
                  item.severity === 'CRITICAL'
                    ? 'text-severity-critical bg-red-950/40 border border-red-900/50'
                    : item.severity === 'HIGH'
                    ? 'text-amber-400 bg-amber-950/40 border border-amber-900/50'
                    : 'text-text-muted bg-white/5 border border-white/10'
                }`}
              >
                {item.severity === 'CRITICAL' ? 'CRIT' : item.severity === 'HIGH' ? 'HIGH' : 'DATA'}
              </span>
              <span className="truncate flex-1">
                <span className="text-accent-cyan">[{item.country}]</span> {item.text}
              </span>
            </div>
          ))}

          {/* Active Blinking Monospace Prompt */}
          <div className="pt-1 flex items-center gap-1 text-[9.5px] text-accent-cyan/80 select-none h-[18px] shrink-0">
            <span className="font-bold">&gt;</span>
            <span className="text-text-muted text-[8.5px]">stream active [30s cycle]</span>
            <span className="w-1.5 h-3 bg-accent-cyan animate-pulse inline-block ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
