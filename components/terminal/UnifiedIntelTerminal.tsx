'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ApiExchange, Conflict, ConflictEvent } from '@/types/conflict';
import {
  Terminal,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2,
  Send,
} from 'lucide-react';
import { isAiQuery } from './terminal-commands';
import { isCountryFilterCommand, parseCountryInput, matchCountryOrContinent } from '@/lib/data/country-coords';
import { isRelationCommand, RelationshipNetwork } from '@/lib/data/country-relationships';

export interface UnifiedIntelTerminalProps {
  exchange?: ApiExchange | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  fullHeight?: boolean;
  hideHeader?: boolean;
  activeConflict?: Conflict | null;
  allConflicts?: Conflict[];
  allEvents?: ConflictEvent[];
  onSelectConflict?: (conflict: Conflict | null) => void;
  onSelectView?: (view: any) => void;
  onUpdateFilters?: (updates: any) => void;
  onSelectCountries?: (countries: string[]) => void;
  onShowRelationNetwork?: (countryName: string) => RelationshipNetwork | null;
  windowDays?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  command: string;
  output?: React.ReactNode;
  isError?: boolean;
  isAiResponse?: boolean;
  isLoading?: boolean;
}

export const UnifiedIntelTerminal: React.FC<UnifiedIntelTerminalProps> = ({
  exchange,
  isRefreshing = false,
  onRefresh,
  fullHeight = false,
  hideHeader = false,
  activeConflict = null,
  allConflicts = [],
  allEvents = [],
  onSelectConflict,
  onSelectView,
  onUpdateFilters,
  onSelectCountries,
  onShowRelationNetwork,
  windowDays = 10,
}) => {
  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toTimeString().slice(0, 8),
      command: 'sys.init --tactical',
      output: (
        <div className="space-y-1 text-slate-300">
          <div className="text-accent-cyan font-bold">
            WARROOM INTELLIGENCE TERMINAL v1.2 [ONLINE]
          </div>
          <div className="text-text-secondary text-[10px]">
            &bull; Theater Filter: <span className="text-accent-cyan font-bold">Type country or continent</span> (e.g. &ldquo;Asia&rdquo;, &ldquo;Europe&rdquo;, &ldquo;India &amp; Pakistan&rdquo;) to filter &amp; zoom map.
          </div>
          <div className="text-text-secondary text-[10px]">
            &bull; Type any tactical question ending with <span className="text-amber-300 font-bold">&apos;?&apos;</span> to query the AI Defense Analyst.
          </div>
        </div>
      ),
    },
  ]);

  // Global hotkey: Ctrl+K to focus & expand this terminal
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setIsMinimized(false);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Auto-scroll on logs change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Execute terminal input
  const handleExecute = async (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const logId = `entry-${Date.now()}`;
    const timestamp = new Date().toTimeString().slice(0, 8);

    // ── Terminal Shortcut Commands ────────────────────────────────────────────
    const lower = trimmed.toLowerCase();

    // clc — clear logs and collapse terminal
    if (lower === 'clc') {
      setLogs([]);
      setIsMinimized(true);
      return;
    }

    // m — switch to Map view
    if (lower === 'm') {
      if (onSelectView) onSelectView('WORLD');
      setLogs((prev) => [...prev, {
        id: logId, timestamp, command: trimmed,
        output: <span className="text-accent-cyan">[VIEW] Switching to MAP view...</span>,
      }]);
      return;
    }

    // t — switch to Timeline view
    if (lower === 't') {
      if (onSelectView) onSelectView('TIMELINE');
      setLogs((prev) => [...prev, {
        id: logId, timestamp, command: trimmed,
        output: <span className="text-accent-cyan">[VIEW] Switching to TIMELINE view...</span>,
      }]);
      return;
    }

    // 1 / 2 / 3 — change rolling data window
    if (trimmed === '1') {
      if (onUpdateFilters) onUpdateFilters({ days: 3 });
      setLogs((prev) => [...prev, {
        id: logId, timestamp, command: trimmed,
        output: <span className="text-amber-300">[FILTER] Data window → 3 DAYS</span>,
      }]);
      return;
    }
    if (trimmed === '2') {
      if (onUpdateFilters) onUpdateFilters({ days: 7 });
      setLogs((prev) => [...prev, {
        id: logId, timestamp, command: trimmed,
        output: <span className="text-amber-300">[FILTER] Data window → 7 DAYS</span>,
      }]);
      return;
    }
    if (trimmed === '3') {
      if (onUpdateFilters) onUpdateFilters({ days: 10 });
      setLogs((prev) => [...prev, {
        id: logId, timestamp, command: trimmed,
        output: <span className="text-amber-300">[FILTER] Data window → 10 DAYS</span>,
      }]);
      return;
    }

    // ── Tactical Country Relation Map Command (e.g. "Israel map", "Russia rel") ──
    const relCheck = isRelationCommand(trimmed);
    if (relCheck.isRelation && relCheck.countryName) {
      if (onShowRelationNetwork) {
        const net = onShowRelationNetwork(relCheck.countryName);
        if (net) {
          const outgoing = net.relations.filter((r) => r.direction === 'OUTGOING');
          const incoming = net.relations.filter((r) => r.direction === 'INCOMING');

          setLogs((prev) => [
            ...prev,
            {
              id: logId,
              timestamp,
              command: trimmed,
              output: (
                <div className="space-y-1 text-[10.5px] font-mono py-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan inline-block animate-pulse" />
                    <span className="text-accent-cyan font-bold">[TACTICAL VECTORS ACTIVE]</span>
                    <span className="text-white font-bold uppercase tracking-wide">{net.focalCountry}</span>
                    <span className="text-text-muted text-[10px]">
                      &bull; {net.connectedCountries.length} Theaters &bull; {net.totalEvents} Incidents
                    </span>
                  </div>

                  <div className="pl-3 text-[10px] text-slate-300 flex flex-wrap gap-x-4 gap-y-0.5">
                    <div>
                      <span className="text-accent-cyan font-bold">OUTGOING ({outgoing.length}): </span>
                      {outgoing.length === 0 ? (
                        <span className="text-text-muted">None</span>
                      ) : (
                        outgoing.map((r) => `${r.toCountry} [${r.eventCount}]`).join(', ')
                      )}
                    </div>
                    <div>
                      <span className="text-red-400 font-bold">INCOMING ({incoming.length}): </span>
                      {incoming.length === 0 ? (
                        <span className="text-text-muted">None</span>
                      ) : (
                        incoming.map((r) => `${r.fromCountry} [${r.eventCount}]`).join(', ')
                      )}
                    </div>
                  </div>
                </div>
              ),
            },
          ]);
          return;
        } else {
          setLogs((prev) => [
            ...prev,
            {
              id: logId,
              timestamp,
              command: trimmed,
              isError: true,
              output: (
                <div className="text-red-400 text-[11px]">
                  [RELATION ERROR] Could not locate coordinates or relationship data for &quot;{relCheck.countryName}&quot;.
                </div>
              ),
            },
          ]);
          return;
        }
      }
    }

    // ── Country / Multi-Country Filter Command ──────────────────────────────
    const knownCountries = [
      ...new Set([
        ...allConflicts.map((c) => c.country || ''),
        ...allEvents.map((e) => e.country || ''),
      ]),
    ].filter(Boolean);

    if (isCountryFilterCommand(trimmed, knownCountries)) {
      if (
        [
          'all',
          'world',
          'reset',
          'global',
          'clear country',
          'clear countries',
          'reset country',
          'reset countries',
          'reset filter',
          'clear filter',
        ].includes(lower)
      ) {
        if (onSelectCountries) {
          onSelectCountries([]);
        } else if (onUpdateFilters) {
          onUpdateFilters({ countries: [], country: '' });
          if (onSelectView) onSelectView('WORLD');
        }
        setLogs((prev) => [
          ...prev,
          {
            id: logId,
            timestamp,
            command: trimmed,
            output: (
              <div className="text-accent-cyan flex items-center gap-1.5 text-[11px]">
                <span className="font-bold">●</span>
                <span>[FILTER RESET] Cleared all country filters. Reset to global theater on map.</span>
              </div>
            ),
          },
        ]);
        return;
      }

      const countries = parseCountryInput(trimmed);
      if (countries.length > 0) {
        if (onSelectCountries) {
          onSelectCountries(countries);
        } else if (onUpdateFilters) {
          onUpdateFilters({ countries, country: countries.length === 1 ? countries[0] : '' });
          if (onSelectView) onSelectView('WORLD');
        }

        const countEvents = allEvents.filter((e) => matchCountryOrContinent(e, countries)).length;

        setLogs((prev) => [
          ...prev,
          {
            id: logId,
            timestamp,
            command: trimmed,
            output: (
              <div className="space-y-1 text-[11px]">
                <div className="text-accent-green font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-green inline-block animate-pulse" />
                  <span>[THEATER LOCK]</span>
                  <span className="text-text-primary uppercase tracking-wide">
                    {countries.join(' & ')}
                  </span>
                </div>
                <div className="text-text-secondary text-[10px]">
                  Map focused &amp; zoomed. Markers filtered to {countries.join(', ')} ({countEvents} incidents).
                </div>
                <div className="text-text-muted text-[9px]">
                  Type <span className="text-accent-cyan font-bold">&quot;all&quot;</span> to reset global view.
                </div>
              </div>
            ),
          },
        ]);
        return;
      }
    }

    // Route to AI analyst
    if (isAiQuery(trimmed)) {
      setLogs((prev) => [
        ...prev,
        {
          id: logId,
          timestamp,
          command: trimmed,
          isLoading: true,
          output: (
            <div className="flex items-center gap-2 text-amber-400 animate-pulse text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>&gt;&gt;&gt; [AI-ANALYST] QUERYING 10-DAY KINETIC TELEMETRY...</span>
            </div>
          ),
        },
      ]);

      try {
        const contextualQuery = activeConflict
          ? `[THEATER: ${activeConflict.name} (${activeConflict.country})]: ${trimmed}`
          : `[GLOBAL WATCH // 120 THEATERS]: ${trimmed}`;

        const res = await fetch('/api/ai/analyst', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Key': localStorage.getItem('warroom_gemini_key') || '',
          },
          body: JSON.stringify({ query: contextualQuery, mode: 'QUERY', days: windowDays }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Failed to synthesize intelligence analysis');
        }

        const r = json.result;
        setLogs((prev) =>
          prev.map((entry) =>
            entry.id === logId
              ? {
                  ...entry,
                  isLoading: false,
                  isAiResponse: true,
                  output: (
                    <div className="space-y-2 text-slate-200 bg-black/60 p-2.5 border-l-2 border-amber-400 text-[11px]">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span className="text-amber-300 font-bold">
                          // TACTICAL INTELLIGENCE ASSESSMENT [{r.source}]
                        </span>
                        <span className="text-[9px] text-text-muted">
                          LATENCY: {r.queryTimeMs}ms | UTC: {new Date(r.timestamp).toTimeString().slice(0, 8)}
                        </span>
                      </div>

                      {r.keyFindings && r.keyFindings.length > 0 && (
                        <div className="bg-amber-950/20 p-2 border border-amber-500/30 space-y-1">
                          <div className="text-amber-300 font-bold text-[9px]">KEY TELEMETRY FINDINGS:</div>
                          {r.keyFindings.map((finding: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1 text-slate-300 text-[10px]">
                              <span className="text-amber-400 font-bold">&raquo;</span>
                              <span>{finding}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed text-slate-300 pt-0.5">
                        {r.answer}
                      </div>

                      {r.citations && r.citations.length > 0 && (
                        <div className="border-t border-border/40 pt-1 text-[9px] text-text-muted flex items-center gap-1 flex-wrap">
                          <span className="text-accent-cyan font-bold">CITATIONS:</span>
                          {r.citations.slice(0, 4).map((c: string, idx: number) => (
                            <span key={idx} className="bg-panel-subtle px-1.5 py-0.2 border border-border">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                }
              : entry
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setLogs((prev) =>
          prev.map((entry) =>
            entry.id === logId
              ? {
                  ...entry,
                  isLoading: false,
                  isError: true,
                  output: `[AI-ANALYST ERROR]: ${msg}`,
                }
              : entry
          )
        );
      }
      return;
    }

    // Non-AI input: prompt the user to use AI syntax
    setLogs((prev) => [
      ...prev,
      {
        id: logId,
        timestamp,
        command: trimmed,
        output: (
          <div className="text-text-muted text-[11px]">
            Ask the AI analyst a question — end your query with{' '}
            <span className="text-amber-300 font-bold">&apos;?&apos;</span> or prefix with{' '}
            <span className="text-accent-cyan font-bold">ask</span> /{' '}
            <span className="text-accent-cyan font-bold">intel</span>.
          </div>
        ),
        isError: false,
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        handleExecute(input);
        setInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(nextIdx);
          setInput(history[nextIdx] || '');
        }
      }
    }
  };

  const handleCopyLogs = async () => {
    const text = logs
      .map((l) => `[${l.timestamp}] war@warroom:~$ ${l.command}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`bg-[#03070d] flex flex-col font-mono text-xs transition-all duration-300 relative z-30 shadow-2xl pointer-events-auto w-full ${
        fullHeight
          ? 'h-full flex-1 border-t-0'
          : isMinimized
          ? 'h-8 border-t border-border'
          : isExpanded
          ? 'h-96 border-t border-border'
          : 'h-72 border-t border-border'
      }`}
    >
      {/* 1. Terminal Title Bar */}
      {!hideHeader && (
        <div className="h-8 px-3 bg-[#08101a] border-b border-border flex items-center justify-between pointer-events-auto shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-accent-green shrink-0" />
            <span className="font-bold text-[11px] tracking-wider text-text-primary whitespace-nowrap">
              WARROOM // LINUX INTELLIGENCE TERMINAL
            </span>

            {isRefreshing ? (
              <span className="flex items-center gap-1 text-[9px] text-accent-cyan font-semibold animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                SYNCING
              </span>
            ) : (
              <span className="text-[9px] text-accent-green font-bold bg-emerald-950/60 px-1.5 py-0.2 border border-emerald-600/70">
                ● ACTIVE (GDELT + RELIEFWEB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setLogs([])}
              className="p-1 text-text-secondary hover:text-red-400 transition-colors cursor-pointer"
              title="Clear screen (clear)"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <button
              onClick={handleCopyLogs}
              className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
              title="Copy session output"
            >
              {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
            </button>

            {!fullHeight && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
                title={isExpanded ? 'Dock height' : 'Maximize terminal'}
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            )}

            {!fullHeight && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer ml-1"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronUp className="w-3.5 h-3.5 text-accent-cyan" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. AI Query Context Strip */}
      {!isMinimized && (
        <>
          <div className="h-7 px-2.5 bg-[#05090e] border-b border-border/50 flex items-center justify-between text-[10px] shrink-0 pointer-events-auto select-none">
            <div className="flex items-center gap-2 text-text-muted">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>AI DEFENSE ANALYST</span>
              <span className="text-border">|</span>
              <span>
                CONTEXT:{' '}
                <strong className="text-accent-cyan">
                  {activeConflict ? activeConflict.name : 'WORLD AREA'}
                </strong>
              </span>
            </div>
            <span className="hidden sm:inline text-[9px] text-text-muted">
              End query with <span className="text-amber-300 font-bold">&apos;?&apos;</span> · prefix with{' '}
              <span className="text-accent-cyan">ask</span> /{' '}
              <span className="text-accent-cyan">intel</span>
            </span>
          </div>

          {/* Terminal Body: AI Query Log */}
          <div
            ref={scrollRef}
            onClick={() => inputRef.current?.focus()}
            className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#03060a] text-slate-300 select-text cursor-text pointer-events-auto relative font-mono text-[11px]"
          >
            {logs.map((entry) => (
              <div key={entry.id} className="space-y-1">
                <div className="flex items-center gap-1.5 text-accent-green">
                  <span className="text-text-muted text-[10px]">[{entry.timestamp}]</span>
                  <span className="font-bold">war@warroom:~$</span>
                  <span className="text-text-primary font-semibold">{entry.command}</span>
                </div>

                {entry.output && (
                  <div className={`pl-4 leading-relaxed ${entry.isError ? 'text-red-400' : ''}`}>
                    {entry.output}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Command Prompt Line */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="h-10 px-3 bg-[#060c16] border-t border-border flex items-center gap-2 shrink-0 cursor-text pointer-events-auto relative z-20"
          >
            <span className="text-accent-green font-bold text-xs whitespace-nowrap select-none shrink-0">
              war@warroom:~$
            </span>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type country, relation map (e.g. 'Israel map'), continent, or ask AI '?'"
              className="flex-1 bg-transparent text-text-primary text-xs focus:outline-none placeholder:text-text-muted font-mono select-text cursor-text pointer-events-auto"
              autoComplete="off"
              spellCheck="false"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              {input.trim().endsWith('?') && (
                <span className="px-1.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-500/70 text-[9px] font-bold animate-pulse">
                  AI PROMPT DETECTED
                </span>
              )}

              <button
                onClick={() => {
                  if (input.trim()) {
                    handleExecute(input);
                    setInput('');
                  }
                }}
                disabled={!input.trim()}
                className="px-2 py-1 bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/60 text-accent-cyan text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-30 flex items-center gap-1"
                title="Send Query [Enter]"
              >
                <Send className="w-3 h-3" />
                <span>SEND</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
