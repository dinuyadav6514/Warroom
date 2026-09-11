'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ApiExchange, Conflict, ConflictEvent } from '@/types/conflict';
import {
  Terminal,
  RefreshCw,
  Sparkles,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Trash2,
  HelpCircle,
  Radio,
  FileText,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { executeLinuxCommand, isAiQuery, CommandContext } from './terminal-commands';

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

const FAST_PILLS = [
  'help',
  'top',
  'sitrep',
  'ls /theaters',
  'What is the current situation?',
  'status',
  'grep drone',
];

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
  windowDays = 10,
}) => {
  const [terminalMode, setTerminalMode] = useState<'SHELL' | 'TELEMETRY'>('SHELL');
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
            WARROOM LINUX INTELLIGENCE TERMINAL v1.2 [ONLINE]
          </div>
          <div className="text-text-secondary text-[10px]">
            &bull; Type <span className="text-accent-cyan font-bold">&quot;help&quot;</span> for Linux-style commands (<span className="text-text-primary">ls, top, cat, grep, status, sitrep</span>).
          </div>
          <div className="text-text-secondary text-[10px]">
            &bull; Type any tactical question ending with <span className="text-amber-300 font-bold">&apos;?&apos;</span> to query the AI Defense Analyst.
          </div>
        </div>
      ),
    },
  ]);

  // Command context
  const commandContext: CommandContext = {
    allConflicts,
    allEvents,
    activeConflict,
    onSelectConflict,
    onSelectView,
    onUpdateFilters,
    onRefresh,
  };

  // Auto-scroll on logs change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, terminalMode]);

  // Execute terminal input or clicked pill
  const handleExecute = async (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const logId = `entry-${Date.now()}`;
    const timestamp = new Date().toTimeString().slice(0, 8);

    // 1. Check if AI query
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
          timestamp,
          command: trimmed,
          isLoading: true,
          output: (
            <div className="flex items-center gap-2 text-red-400 animate-pulse text-[11px]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>&gt;&gt;&gt; COMPILING EXECUTIVE DEFENSE SITUATION REPORT (SITREP)...</span>
            </div>
          ),
        },
      ]);

      try {
        const r = await fetch('/api/ai/analyst', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gemini-Key': localStorage.getItem('warroom_gemini_key') || '',
          },
          body: JSON.stringify({ mode: 'SITREP', days: windowDays }),
        });
        const data = await r.json();
        if (!data.success || !data.sitrep) {
          throw new Error(data.error || 'Failed to compile SitRep');
        }
        const sr = data.sitrep;

        setLogs((prev) =>
          prev.map((entry) =>
            entry.id === logId
              ? {
                  ...entry,
                  isLoading: false,
                  output: (
                    <div className="space-y-2 text-slate-200 bg-black/60 p-2.5 border-l-2 border-red-500 text-[11px]">
                      <div className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span className="text-red-400 font-bold text-xs">{sr.title}</span>
                        <span className="px-1.5 py-0.2 bg-red-950 text-red-300 font-bold border border-red-700 text-[9px]">
                          THREAT: {sr.threatLevel}
                        </span>
                      </div>

                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {sr.executiveSummary}
                      </div>

                      {sr.flashpoints && sr.flashpoints.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="text-accent-cyan font-bold text-[9px]">PRIMARY MONITORED THEATERS:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {sr.flashpoints.slice(0, 4).map((fp: any, idx: number) => (
                              <div key={idx} className="bg-panel-subtle p-1.5 border border-border text-[10px]">
                                <div className="flex items-center justify-between font-bold text-text-primary">
                                  <span>{fp.theater} ({fp.country})</span>
                                  <span className="text-red-400 text-[9px]">{fp.fatalities} KIA</span>
                                </div>
                                <div className="text-text-muted text-[9px] mt-0.5">{fp.assessment}</div>
                              </div>
                            ))}
                          </div>
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
                  output: `[SITREP ERROR]: ${msg}`,
                }
              : entry
          )
        );
      }
      return;
    }

    setLogs((prev) => [
      ...prev,
      {
        id: logId,
        timestamp,
        command: trimmed,
        output: res.output,
        isError: res.isError,
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

      {/* 2. Mode Strip & Fast Action Pills */}
      {!isMinimized && (
        <>
          <div className="h-7 px-2.5 bg-[#05090e] border-b border-border/50 flex items-center justify-between text-[10px] shrink-0 pointer-events-auto select-none">
            {/* View Mode Switches */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTerminalMode('SHELL')}
                className={`px-2 py-0.5 border transition-colors cursor-pointer flex items-center gap-1 ${
                  terminalMode === 'SHELL'
                    ? 'border-accent-green text-accent-green bg-emerald-950/40 font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Terminal className="w-2.5 h-2.5" />
                <span>[SHELL CLI &amp; AI]</span>
              </button>

              <button
                onClick={() => setTerminalMode('TELEMETRY')}
                className={`px-2 py-0.5 border transition-colors cursor-pointer flex items-center gap-1 ${
                  terminalMode === 'TELEMETRY'
                    ? 'border-accent-cyan text-accent-cyan bg-cyan-950/40 font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Radio className="w-2.5 h-2.5" />
                <span>[RAW TELEMETRY]</span>
              </button>
            </div>

            {/* Context indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[9px] text-text-muted">
              <span>CONTEXT: <strong className="text-accent-cyan">{activeConflict ? activeConflict.name : 'WORLD AREA'}</strong></span>
              <span>PROMPT: <strong className="text-amber-300">Linux CLI / &apos;?&apos; for AI</strong></span>
            </div>
          </div>

          {/* Quick Command Pills */}
          {terminalMode === 'SHELL' && (
            <div className="px-2.5 py-1.5 bg-[#040810] border-b border-border/40 flex items-center gap-1.5 overflow-x-auto text-[9px] shrink-0 select-none">
              <span className="text-text-muted shrink-0">COMMANDS:</span>
              {FAST_PILLS.map((pill) => (
                <button
                  key={pill}
                  onClick={() => {
                    handleExecute(pill);
                    inputRef.current?.focus();
                  }}
                  className="px-1.5 py-0.5 bg-panel-subtle hover:bg-panel-hover text-text-secondary hover:text-accent-cyan border border-border transition-colors whitespace-nowrap cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* 3. Terminal Body: SHELL MODE */}
          {terminalMode === 'SHELL' && (
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
          )}

          {/* 3b. Terminal Body: RAW TELEMETRY MODE */}
          {terminalMode === 'TELEMETRY' && (
            <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[10px] leading-relaxed bg-[#03060a] text-slate-300 whitespace-pre-wrap select-text cursor-text pointer-events-auto">
              <div className="text-accent-cyan font-bold mb-1">// MULTI-STREAM TELEMETRY EXCHANGE LOG</div>
              {exchange ? (
                <div className="space-y-2">
                  <div className="text-text-secondary">
                    [REQ: {exchange.timestamp}] {exchange.request.method} {exchange.request.endpoint}
                  </div>
                  <div>MODEL    : {exchange.request.model}</div>
                  <div>TOOLS    : {exchange.request.tools.join(', ')}</div>
                  <div>WINDOW   : {exchange.request.dateWindow.start} -&gt; {exchange.request.dateWindow.end} ({exchange.request.dateWindow.days}D)</div>
                  <div>SOURCES  : {exchange.request.sourcesQueried.join(' • ')}</div>
                  <div className="border-t border-border/50 pt-1 text-accent-green">
                    [RES: {exchange.response.status}] {exchange.response.statusText} ({exchange.response.latencyMs}ms latency)
                  </div>
                  <div>INCIDENTS PARSED: {exchange.response.eventsCount} | CONFLICT THEATERS: {exchange.response.conflictsCount}</div>
                  <div className="border-t border-border/50 pt-1 text-[9px] text-text-muted">
                    SAMPLE INGESTED RECORD:
                  </div>
                  <div className="bg-black/50 p-2 border border-border/60 text-slate-300">
                    {JSON.stringify(exchange.response.sampleRecords.slice(0, 2), null, 2)}
                  </div>
                </div>
              ) : (
                <div className="text-text-muted">No raw exchange packet logged yet. Run &quot;sync&quot; or press R to fetch live data.</div>
              )}
            </div>
          )}

          {/* 4. Interactive Linux Command Prompt Line */}
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
              placeholder="Type Linux command ('help', 'ls', 'top', 'status') or ask question ending with '?'"
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
                title="Execute Command [Enter]"
              >
                <Send className="w-3 h-3" />
                <span>EXEC</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
