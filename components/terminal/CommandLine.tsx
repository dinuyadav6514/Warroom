'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, X, RefreshCw } from 'lucide-react';
import { NavView } from '../layout/LeftNav';
import { FilterState, Conflict, ConflictEvent } from '@/types/conflict';
import {
  executeLinuxCommand,
  isAiQuery,
  CommandContext,
} from './terminal-commands';

export interface CommandLineProps {
  onSelectView: (view: NavView) => void;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onRefresh: () => void;
  onOpenSources: () => void;
  onExecuteSearch: (query: string) => void;
  onSelectEventById: (id: string) => void;
  onSelectCountry: (country: string) => void;
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
      command: 'sys.init --linux-shell',
      output: (
        <div className="space-y-1 text-slate-300">
          <div className="text-accent-cyan font-bold">
            WARROOM Geopolitical Conflict Intelligence Terminal v1.2 [ONLINE]
          </div>
          <div className="text-[10px] text-text-secondary">
            &bull; Linux CLI: <span className="text-text-primary font-bold">ls, top, cat, grep, status, sitrep, clear, help</span>
          </div>
          <div className="text-[10px] text-text-secondary">
            &bull; AI Defense Analyst: <span className="text-amber-300 font-bold">Type any query ending with &apos;?&apos;</span> (e.g. &ldquo;latest drone strikes in Red Sea?&rdquo;)
          </div>
        </div>
      ),
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const commandContext: CommandContext = {
    allConflicts,
    allEvents,
    activeConflict,
    onSelectConflict,
    onSelectView,
    onUpdateFilters,
    onRefresh,
    onOpenSources,
    onSelectEventById,
    onSelectCountry,
    onSelectRegion,
  };

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

    // 1. Check if AI query (ends with ?, starts with ?, or natural question word)
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

    // 2. Execute Linux-style command
    const res = executeLinuxCommand(trimmed, commandContext);

    if (res.isClear) {
      setLogs([]);
      return;
    }

    if (res.isSitRep) {
      setLogs((prev) => [
        ...prev,
        {
          id: logId,
          command: trimmed,
          output: (
            <div className="flex items-center gap-2 text-red-400 animate-pulse text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>&gt;&gt;&gt; COMPILING EXECUTIVE SITUATION REPORT (SITREP)...</span>
            </div>
          ),
        },
      ]);

      try {
        const resAi = await fetch('/api/ai/analyst', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Key': localStorage.getItem('warroom_gemini_key') || '',
          },
          body: JSON.stringify({ mode: 'SITREP', days: 10 }),
        });
        const data = await resAi.json();
        if (!data.success || !data.sitrep) {
          throw new Error(data.error || 'Failed to compile Situation Report');
        }
        const sr = data.sitrep;

        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  output: (
                    <div className="space-y-1.5 text-[11px] text-slate-200 bg-black/60 p-2.5 border-l-2 border-red-500">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span className="text-red-400 font-bold text-xs">{sr.title}</span>
                        <span className="px-1.5 py-0.2 bg-red-950 text-red-300 font-bold border border-red-700 text-[9px]">
                          THREAT: {sr.threatLevel}
                        </span>
                      </div>
                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{sr.executiveSummary}</div>
                      {sr.flashpoints && (
                        <div className="space-y-1 pt-1">
                          <div className="text-accent-cyan font-bold text-[9px]">PRIMARY MONITORED THEATERS:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {sr.flashpoints.slice(0, 4).map((f: any, idx: number) => (
                              <div key={idx} className="bg-panel-subtle p-1.5 border border-border text-[10px]">
                                <div className="font-bold text-text-primary flex items-center justify-between">
                                  <span>{f.theater} ({f.country})</span>
                                  <span className="text-red-400 text-[9px]">{f.fatalities} KIA</span>
                                </div>
                                <div className="text-text-muted text-[9px] mt-0.5">{f.assessment}</div>
                              </div>
                            ))}
                          </div>
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
              ? { ...l, output: `[SitRep Error]: ${msg}`, isError: true }
              : l
          )
        );
      }
      return;
    }

    setLogs((prev) => [
      ...prev,
      {
        id: logId,
        command: trimmed,
        output: res.output,
        isError: res.isError,
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
    <div className="bg-panel border-t border-border font-mono text-xs z-30 flex flex-col pointer-events-auto relative">
      {/* Expandable Command Log Output Box */}
      {isExpanded && (
        <div className="max-h-56 overflow-y-auto p-3 bg-[#03060a] border-b border-border/80 space-y-2 select-text cursor-text">
          <div className="flex items-center justify-between pb-1 border-b border-border/40 text-[10px] text-text-muted select-none">
            <div className="flex items-center gap-2">
              <span className="text-accent-green font-bold">// LINUX TERMINAL &amp; AI EXECUTION LOG</span>
              <span className="text-[9px] text-text-muted">Type &apos;help&apos; or ask &apos;?&apos;</span>
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
                title="Minimize Log"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {logs.map((item) => (
            <div key={item.id} className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-accent-green">
                <span className="font-bold">war@warroom:~$</span>
                <span className="text-text-primary font-semibold">{item.command}</span>
              </div>
              {item.output && (
                <div
                  className={`pl-4 text-[11px] leading-relaxed select-text cursor-text ${
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
          placeholder='Type Linux command ("help", "ls", "top", "status") or ask AI question ending with "?" (Ctrl+K)'
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
