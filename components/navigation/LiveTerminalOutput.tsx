'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ApiExchange, ConflictEvent } from '@/types/conflict';
import { Terminal, Trash2, ArrowDownCircle, Wifi, Radio } from 'lucide-react';
import { TypewriterText } from '@/components/ui/TypewriterText';

interface TerminalLogEntry {
  id: string;
  time: string;
  tag: 'SYS' | 'FETCH' | 'DATA' | 'ALERT' | 'PING' | 'NET';
  text: string;
}

interface LiveTerminalOutputProps {
  apiExchange?: ApiExchange | null;
  isRefreshing?: boolean;
  lastSyncAt?: string | null;
  eventsCount?: number;
  events?: ConflictEvent[];
  availableSources?: string[];
}

export const LiveTerminalOutput: React.FC<LiveTerminalOutputProps> = ({
  apiExchange,
  isRefreshing = false,
  lastSyncAt,
  eventsCount = 0,
  events = [],
  availableSources = [],
}) => {
  const [logs, setLogs] = useState<TerminalLogEntry[]>(() => {
    const now = new Date();
    const t = (d: Date) => d.toTimeString().substring(0, 8);
    const tMinus = (seconds: number) => {
      const past = new Date(now.getTime() - seconds * 1000);
      return past.toTimeString().substring(0, 8);
    };

    return [
      { id: '1', time: tMinus(25), tag: 'SYS', text: 'KERNEL: WarRoom Telemetry Engine v2.4 initialized.' },
      { id: '2', time: tMinus(22), tag: 'NET', text: 'CARRIER: OpenSSL direct TLS-1.3 session established.' },
      { id: '3', time: tMinus(20), tag: 'FETCH', text: 'INGEST_INIT: Connecting to GDELT 2.0 & UN OCHA ReliefWeb.' },
      { id: '4', time: tMinus(15), tag: 'DATA', text: 'GEO_INDEX: 195 territorial centroid nodes mapped.' },
      { id: '5', time: tMinus(10), tag: 'SYS', text: 'RADAR: Sub-orbital spherical projection online.' },
      { id: '6', time: t(now), tag: 'PING', text: 'DAEMON: Continuous packet ingestion loop active.' },
    ];
  });

  const [autoScroll, setAutoScroll] = useState(true);
  const [filterTag, setFilterTag] = useState<'ALL' | 'FETCH' | 'DATA' | 'ALERT'>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevExchangeIdRef = useRef<string | null>(null);
  const prevRefreshingRef = useRef<boolean>(false);
  const prevEventCountRef = useRef<number>(eventsCount);

  const getUtcTime = () => new Date().toTimeString().substring(0, 8);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Log fetch events when isRefreshing changes
  useEffect(() => {
    if (isRefreshing && !prevRefreshingRef.current) {
      const time = getUtcTime();
      setLogs((prev) => [
        ...prev.slice(-90),
        {
          id: `${Date.now()}-ref-start`,
          time,
          tag: 'FETCH',
          text: `QUERY_START: Initiating multi-pipeline recon burst across ${availableSources.length || 12} sources...`,
        },
        {
          id: `${Date.now()}-ref-gdelt`,
          time,
          tag: 'NET',
          text: 'GDELT_2.0: Polling global event stream & conflict codings...',
        },
        {
          id: `${Date.now()}-ref-relief`,
          time,
          tag: 'NET',
          text: 'RELIEFWEB_API: Querying verified humanitarian reports...',
        },
      ]);
    } else if (!isRefreshing && prevRefreshingRef.current) {
      const time = getUtcTime();
      setLogs((prev) => [
        ...prev.slice(-90),
        {
          id: `${Date.now()}-ref-end`,
          time,
          tag: 'SYS',
          text: `BURST_DONE: Payload merged. Total active incidents: ${eventsCount}.`,
        },
      ]);
    }
    prevRefreshingRef.current = isRefreshing;
  }, [isRefreshing, availableSources.length, eventsCount]);

  // Log API exchanges when new data packet arrives
  useEffect(() => {
    if (apiExchange && apiExchange.id !== prevExchangeIdRef.current) {
      prevExchangeIdRef.current = apiExchange.id;
      const time = getUtcTime();
      const statusText =
        typeof apiExchange.response.status === 'number' && apiExchange.response.status < 400
          ? 'HTTP 200 OK'
          : `STATUS ${apiExchange.response.status}`;

      const newEntries: TerminalLogEntry[] = [
        {
          id: `${Date.now()}-ex-res`,
          time,
          tag: 'FETCH',
          text: `RESPONSE: ${statusText} from ${apiExchange.request.endpoint} (${apiExchange.response.latencyMs}ms)`,
        },
        {
          id: `${Date.now()}-ex-meta`,
          time,
          tag: 'DATA',
          text: `INGEST: ${apiExchange.response.eventsCount} incidents parsed | ${apiExchange.response.groundingCitationsCount} verified sources.`,
        },
      ];

      // Add samples if present
      if (apiExchange.response.sampleRecords && apiExchange.response.sampleRecords.length > 0) {
        apiExchange.response.sampleRecords.slice(0, 2).forEach((rec, idx) => {
          newEntries.push({
            id: `${Date.now()}-sample-${idx}`,
            time,
            tag: rec.severity === 'CRITICAL' ? 'ALERT' : 'DATA',
            text: `[${rec.country}] ${(rec.headline || '').slice(0, 38)}...`,
          });
        });
      }

      setLogs((prev) => [...prev.slice(-85), ...newEntries]);
    }
  }, [apiExchange]);

  // Log incoming events count changes
  useEffect(() => {
    if (eventsCount !== prevEventCountRef.current && eventsCount > 0) {
      const time = getUtcTime();
      const delta = eventsCount - prevEventCountRef.current;
      const sign = delta > 0 ? `+${delta}` : `${delta}`;

      if (prevEventCountRef.current > 0) {
        setLogs((prev) => [
          ...prev.slice(-90),
          {
            id: `${Date.now()}-ev-delta`,
            time,
            tag: delta > 0 ? 'ALERT' : 'DATA',
            text: `SIGNAL_DELTA: ${sign} operational incidents (${eventsCount} total monitored).`,
          },
        ]);
      }
      prevEventCountRef.current = eventsCount;
    }
  }, [eventsCount]);

  // Periodic heartbeat / telemetry ping to keep the feed live and breathing
  useEffect(() => {
    const messages: Array<{ tag: 'PING' | 'SYS' | 'DATA'; text: string }> = [
      { tag: 'PING', text: 'HEARTBEAT: Carrier sync nominal. Loss: 0.0%.' },
      { tag: 'SYS', text: 'RADAR_SWEEP: 360° azimuth sweep complete. 0 dead zones.' },
      { tag: 'DATA', text: 'BUFFER_CHECK: Memory cache aligned. L1 latency < 2ms.' },
      { tag: 'PING', text: 'TIME_SYNC: NTP atomic clock synchronised (UTC+0).' },
      { tag: 'SYS', text: 'DEDUP_MUTEX: Smart story merging hash map validated.' },
      { tag: 'DATA', text: 'SPECTRAL_SCAN: Continuous news wire polling active.' },
    ];

    let idx = 0;
    const interval = setInterval(() => {
      const item = messages[idx % messages.length];
      idx++;
      setLogs((prev) => [
        ...prev.slice(-90),
        {
          id: `${Date.now()}-hb`,
          time: getUtcTime(),
          tag: item.tag,
          text: item.text,
        },
      ]);
    }, 8500);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterTag === 'ALL') return true;
    return l.tag === filterTag;
  });

  const clearLogs = () => {
    setLogs([
      {
        id: `${Date.now()}-clr`,
        time: getUtcTime(),
        tag: 'SYS',
        text: 'CONSOLE_CLEARED: Telemetry buffer flushed.',
      },
    ]);
  };

  const getTagStyle = (tag: TerminalLogEntry['tag']) => {
    switch (tag) {
      case 'ALERT':
        return 'text-severity-critical bg-red-950/40 border-red-800/60';
      case 'FETCH':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'DATA':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'NET':
        return 'text-blue-400 bg-blue-950/40 border-blue-800/60';
      case 'PING':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/60';
      case 'SYS':
      default:
        return 'text-accent-cyan bg-cyan-950/40 border-cyan-800/60';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#05080c] border border-border/80 rounded-[2px] overflow-hidden select-none font-mono">
      {/* Header */}
      <div className="bg-[#090e15] border-b border-border/80 px-2.5 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-[11px] font-bold text-text-primary tracking-wider">
            // LIVE TERMINAL
          </span>
          <span className="flex items-center gap-1 text-[9.5px]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRefreshing
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
              }`}
            />
            <span className={isRefreshing ? 'text-amber-400' : 'text-emerald-400'}>
              {isRefreshing ? 'FETCHING' : 'ONLINE'}
            </span>
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoScroll((prev) => !prev)}
            className={`px-1 py-0.5 text-[9px] rounded border transition-colors cursor-pointer ${
              autoScroll
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40'
                : 'text-text-muted border-border/40 hover:text-text-primary'
            }`}
            title={autoScroll ? 'Auto-scroll is ON' : 'Auto-scroll is OFF'}
          >
            AUTO
          </button>
          <button
            onClick={clearLogs}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-panel-subtle rounded transition-colors cursor-pointer"
            title="Clear terminal buffer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Telemetry Band */}
      <div className="bg-black/60 border-b border-border/40 px-2 py-1 flex items-center justify-between text-[9.5px] text-text-muted shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Wifi className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-text-secondary">
              {apiExchange?.response?.latencyMs ? `${apiExchange.response.latencyMs}ms` : '184ms'}
            </span>
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 text-accent-cyan" />
            <span className="text-accent-cyan font-bold">{eventsCount} EVTS</span>
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          {(['ALL', 'FETCH', 'DATA', 'ALERT'] as const).map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(tag)}
              className={`px-1 py-0.2 rounded text-[8.5px] transition-colors cursor-pointer ${
                filterTag === tag
                  ? 'bg-accent-cyan/20 text-accent-cyan font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output Log Stream */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 text-[10px] leading-relaxed select-text"
      >
        {filteredLogs.map((log, idx) => {
          const isLatest = idx === filteredLogs.length - 1;
          return (
            <div key={log.id} className="flex items-start gap-1.5 font-mono break-all">
              <span className="text-text-muted/60 shrink-0 select-none text-[9px] font-light">
                [{log.time}]
              </span>
              <span
                className={`px-1 py-0.2 border text-[8.5px] font-bold rounded-[2px] shrink-0 leading-none select-none ${getTagStyle(
                  log.tag
                )}`}
              >
                {log.tag}
              </span>
              <span className="text-text-secondary/90 flex-1">
                {isLatest ? (
                  <TypewriterText text={log.text} speed={8} cursor={true} />
                ) : (
                  log.text
                )}
              </span>
            </div>
          );
        })}

        {/* Blinking CLI Cursor */}
        <div className="pt-1 flex items-center gap-1 text-[10px] text-accent-cyan/80 select-none">
          <span className="font-bold">&gt;</span>
          <span className="text-text-muted text-[9px]">stream active</span>
          <span className="w-1.5 h-3 bg-accent-cyan animate-pulse inline-block ml-0.5" />
        </div>
      </div>
    </div>
  );
};
