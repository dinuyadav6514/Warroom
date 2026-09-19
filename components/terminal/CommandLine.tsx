'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, X, RefreshCw } from 'lucide-react';
import { NavView } from '../layout/LeftNav';
import { FilterState, Conflict, ConflictEvent } from '@/types/conflict';
import {
  isAiQuery,
} from './terminal-commands';
import { isCountryFilterCommand, parseCountryInput, matchCountryOrContinent } from '@/lib/data/country-coords';
import { isRelationCommand, RelationshipNetwork } from '@/lib/data/country-relationships';

export interface CommandLineProps {
  onSelectView: (view: NavView) => void;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onRefresh: () => void;
  onOpenSources: () => void;
  onExecuteSearch: (query: string) => void;
  onSelectEventById: (id: string) => void;
  onSelectCountry: (country: string) => void;
  onSelectCountries?: (countries: string[]) => void;
  onShowRelationNetwork?: (countryName: string) => RelationshipNetwork | null;
  onSelectRegion: (region: string) => void;
  allConflicts?: Conflict[];
  allEvents?: ConflictEvent[];
  activeConflict?: Conflict | null;
  onSelectConflict?: (conflict: Conflict | null) => void;
}

interface CommandLog {
  id: string;
  command: string;
  output?: string | React.ReactNode;
  isError?: boolean;
}

export const CommandLine: React.FC<CommandLineProps> = ({
  onSelectView,
  onUpdateFilters,
  onRefresh,
  onOpenSources,
  onExecuteSearch,
  onSelectEventById,
  onSelectCountry,
  onSelectCountries,
  onShowRelationNetwork,
  onSelectRegion,
  allConflicts = [],
  allEvents = [],
  activeConflict = null,
  onSelectConflict,
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: 'init-1',
      command: 'sys.status',
      output: (
        <div className="text-[10.5px] text-slate-300 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block animate-pulse" />
          <span className="text-accent-green font-bold">[TERMINAL READY]</span>
          <span className="text-text-secondary">
            Type country or &ldquo;&lt;country&gt; map&rdquo; (e.g. &ldquo;Israel map&rdquo;) for vectors &bull; Shortcuts: m, t, 1-3, clc
          </span>
        </div>
      ),
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Global hotkeys: Ctrl+K or / to focus command line
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsExpanded(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto scroll logs
  useEffect(() => {
    if (isExpanded) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const logId = `cmd-${Date.now()}`;

    // ── Terminal Shortcut Commands ────────────────────────────────────────────
    const lower = trimmed.toLowerCase();

    // clc — clear logs and collapse terminal
    if (lower === 'clc') {
      setLogs([]);
      setIsExpanded(false);
      return;
    }

    // m — switch to Map view
    if (lower === 'm') {
      onSelectView('WORLD');
      setLogs((prev) => [...prev, {
        id: logId, command: trimmed,
        output: <span className="text-accent-cyan">[VIEW] Switching to MAP view...</span>,
      }]);
      return;
    }

    // t — switch to Timeline view
    if (lower === 't') {
      onSelectView('TIMELINE');
      setLogs((prev) => [...prev, {
        id: logId, command: trimmed,
        output: <span className="text-accent-cyan">[VIEW] Switching to TIMELINE view...</span>,
      }]);
      return;
    }

    // 1 / 2 / 3 — change rolling data window
    if (trimmed === '1') {
      onUpdateFilters({ days: 3 });
      setLogs((prev) => [...prev, {
        id: logId, command: trimmed,
        output: <span className="text-amber-300">[FILTER] Data window → 3 DAYS</span>,
      }]);
      return;
    }
    if (trimmed === '2') {
      onUpdateFilters({ days: 7 });
      setLogs((prev) => [...prev, {
        id: logId, command: trimmed,
        output: <span className="text-amber-300">[FILTER] Data window → 7 DAYS</span>,
      }]);
      return;
    }
    if (trimmed === '3') {
      onUpdateFilters({ days: 10 });
      setLogs((prev) => [...prev, {
        id: logId, command: trimmed,
        output: <span className="text-amber-300">[FILTER] Data window → 10 DAYS</span>,
      }]);
      return;
    }
    // ── End Shortcut Commands ─────────────────────────────────────────────────

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
        } else {
          onSelectCountry('');
        }
        setLogs((prev) => [
          ...prev,
          {
            id: logId,
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
        } else {
          onSelectCountry(countries[0]);
        }

        const countEvents = allEvents.filter((e) => matchCountryOrContinent(e, countries)).length;

        setLogs((prev) => [
          ...prev,
          {
            id: logId,
            command: trimmed,
            output: (
              <div className="flex items-center gap-2 flex-wrap text-[10.5px] py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block animate-pulse" />
                <span className="text-accent-green font-bold">[THEATER LOCK]</span>
                <span className="text-white uppercase font-bold tracking-wide">
                  {countries.join(' & ')}
                </span>
                <span className="text-text-secondary text-[10px]">
                  &bull; {countEvents} incidents active &bull; Type &quot;all&quot; to reset
                </span>
              </div>
            ),
          },
        ]);
        return;
      }
    }

    // Check if AI query (ends with ?, starts with ?, or natural question word)
    if (isAiQuery(trimmed)) {
      setLogs((prev) => [
        ...prev,
        {
          id: logId,
          command: trimmed,
          output: (
            <div className="flex items-center gap-2 text-amber-400 animate-pulse text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>&gt;&gt;&gt; [AI-ANALYST] CONSULTING 10-DAY KINETIC TELEMETRY...</span>
            </div>
          ),
        },
      ]);

      try {
        const contextualQuery = activeConflict
          ? `[THEATER: ${activeConflict.name} (${activeConflict.country})]: ${trimmed}`
          : `[GLOBAL CONFLICT MATRIX]: ${trimmed}`;

        const res = await fetch('/api/ai/analyst', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Key': localStorage.getItem('warroom_gemini_key') || '',
          },
          body: JSON.stringify({ query: contextualQuery, mode: 'QUERY', days: 10 }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'AI Analyst error');
        const r = data.result;

        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  output: (
                    <div className="space-y-1.5 text-[11px] text-slate-200 bg-black/60 p-2.5 border-l-2 border-amber-400">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span className="text-amber-400 font-bold">
                          // AI DEFENSE ANALYST ASSESSMENT [{r.source}]
                        </span>
                        <span className="text-[9px] text-text-muted">
                          LATENCY: {r.queryTimeMs}ms
                        </span>
                      </div>

                      {r.keyFindings && r.keyFindings.length > 0 && (
                        <div className="bg-amber-950/20 border border-amber-500/30 p-1.5 space-y-0.5">
                          <div className="text-amber-300 font-bold text-[9px]">KEY TELEMETRY FINDINGS:</div>
                          {r.keyFindings.map((f: string, i: number) => (
                            <div key={i} className="text-slate-300 text-[10px]">» {f}</div>
                          ))}
                        </div>
                      )}

                      <div className="whitespace-pre-wrap leading-relaxed text-slate-300">{r.answer}</div>

                      {r.citations && r.citations.length > 0 && (
                        <div className="text-[9px] text-text-muted border-t border-border/40 pt-1">
                          <span className="text-accent-cyan font-bold">CITATIONS: </span>
                          {r.citations.slice(0, 4).join(' • ')}
                        </div>
                      )}
                    </div>
                  ),
                }
              : l
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? { ...l, output: `[AI Analyst Error]: ${msg}`, isError: true }
              : l
          )
        );
      }
      return;
    }

    // Non-AI / Non-Country input: prompt user
    setLogs((prev) => [
      ...prev,
      {
        id: logId,
        command: trimmed,
        output: (
          <div className="text-text-muted text-[11px]">
            Type a country name (e.g. <span className="text-accent-cyan font-bold">&quot;India&quot;</span> or <span className="text-accent-cyan font-bold">&quot;India &amp; Pakistan &amp; Nepal&quot;</span>) to filter &amp; zoom map, or ask AI question ending with <span className="text-amber-300 font-bold">&apos;?&apos;</span>.
          </div>
        ),
        isError: false,
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (input.trim()) {
        handleCommand(input);
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

  return (
    <div className="bg-panel border-t border-border font-mono text-xs z-30 flex flex-col pointer-events-auto relative shrink-0">
      {/* Expandable Command Log Output Box - Compact Floating Status Monitor */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 right-0 max-h-28 sm:max-h-36 overflow-y-auto px-3 py-1.5 bg-[#03060a]/95 backdrop-blur-md border-t border-border/80 space-y-1 select-text cursor-text shadow-2xl z-40">
          <div className="flex items-center justify-between pb-1 border-b border-border/40 text-[10px] text-text-muted select-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block animate-pulse" />
              <span className="text-accent-green font-bold tracking-wider">// TERMINAL STATUS MONITOR</span>
              <span className="text-[9px] text-text-muted hidden sm:inline">&bull; Shortcuts: m (Map), t (Timeline), 1-3 (Days), clc (Clear)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs([])}
                className="text-text-muted hover:text-red-400 text-[10px] cursor-pointer"
              >
                [CLEAR]
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-text-secondary hover:text-text-primary p-0.5 cursor-pointer"
                title="Minimize Terminal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {logs.map((item) => (
            <div key={item.id} className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-accent-green">
                <span className="font-bold">war@warroom:~$</span>
                <span className="text-text-primary font-semibold">{item.command}</span>
              </div>
              {item.output && (
                <div
                  className={`pl-3 text-[10.5px] leading-snug select-text cursor-text ${
                    item.isError ? 'text-severity-critical' : 'text-text-secondary'
                  }`}
                >
                  {item.output}
                </div>
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}

      {/* Main Command Input Line */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="h-10 px-3 flex items-center gap-2 bg-[#060c16] cursor-text pointer-events-auto relative z-40"
      >
        <Terminal className="w-3.5 h-3.5 text-accent-green shrink-0" />
        <span className="text-accent-green font-bold text-xs whitespace-nowrap select-none shrink-0">
          war@warroom:~$
        </span>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
          placeholder="Type country, relation map (e.g. 'Israel map'), continent, or ask AI '?' · Ctrl+K"
          className="flex-1 bg-transparent text-text-primary text-xs focus:outline-none placeholder:text-text-muted font-mono select-text cursor-text pointer-events-auto z-50 relative"
          autoComplete="off"
          spellCheck="false"
        />

        <div className="flex items-center gap-2 text-[10px] text-text-muted shrink-0">
          {input.trim().endsWith('?') && (
            <span className="px-1.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-500/70 text-[9px] font-bold animate-pulse">
              AI QUESTION
            </span>
          )}
          <span className="hidden md:inline text-[9px]">[Ctrl+K /]</span>
          <button
            onClick={() => {
              if (input.trim()) {
                handleCommand(input);
                setInput('');
              }
            }}
            disabled={!input.trim()}
            className="p-1 hover:text-accent-cyan text-text-secondary disabled:opacity-30 cursor-pointer"
            title="Execute Command"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
