'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ApiExchange } from '@/types/conflict';
import {
  Terminal,
  RefreshCw,
  Play,
  FastForward,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  Send,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export interface ApiTerminalExchangeProps {
  exchange?: ApiExchange | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  fullHeight?: boolean;
  hideHeader?: boolean;
  initialTab?: TerminalTab;
}

export type TerminalTab = 'STREAM' | 'REQUEST' | 'RETURNED' | 'ANALYST' | 'SITREP';

interface AnalystResult {
  answer: string;
  citations: string[];
  keyFindings: string[];
  source: string;
  timestamp: string;
  queryTimeMs: number;
}

interface SitRepResult {
  title: string;
  summary: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
  executiveSummary: string;
  flashpoints: Array<{
    theater: string;
    country: string;
    incidents: number;
    fatalities: number;
    assessment: string;
  }>;
  tacticalDevelopments: string[];
  source: string;
  timestamp: string;
}

const QUICK_QUERIES = [
  'Latest drone strikes and air interdiction',
  'Heavy artillery exchanges and front-line advances',
  'Middle East conflict axis escalation',
  'Civilian casualties and infrastructure strikes',
];

export const ApiTerminalExchange: React.FC<ApiTerminalExchangeProps> = ({
  exchange,
  isRefreshing = false,
  onRefresh,
  fullHeight = false,
  hideHeader = false,
  initialTab = 'STREAM',
}) => {
  const [tab, setTab] = useState<TerminalTab>(initialTab);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Typewriter states
  const [displayedLength, setDisplayedLength] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bottom interactive input ref
  const bottomInputRef = useRef<HTMLInputElement>(null);
  const [bottomCommand, setBottomCommand] = useState<string>('');

  // AI Analyst State
  const [analystInput, setAnalystInput] = useState<string>('');
  const [analystLoading, setAnalystLoading] = useState<boolean>(false);
  const [analystResult, setAnalystResult] = useState<AnalystResult | null>(null);
  const [analystError, setAnalystError] = useState<string | null>(null);

  // SitRep State
  const [sitrepLoading, setSitrepLoading] = useState<boolean>(false);
  const [sitrepResult, setSitrepResult] = useState<SitRepResult | null>(null);
  const [sitrepError, setSitrepError] = useState<string | null>(null);

  // Build formatted terminal text representation based on active tab
  const fullText = useMemo(() => {
    if (isRefreshing) {
      const nowUtc = new Date().toISOString().substring(11, 19);
      return [
        `[SYS: ${nowUtc} UTC] >>> DISPATCHING MULTI-STREAM RECONNAISSANCE SYNC...`,
        `> PROTOCOL       : HTTP / REST / OpenSSL Direct (100% Key-Free Media Stream)`,
        `> STREAM 1       : GDELT 2.0 GLOBAL KNOWLEDGE GRAPH (Real-Time Media Pipeline)`,
        `> STREAM 2       : UN OCHA RELIEFWEB / VERIFIED HARD-NEWS WIRE DISPATCHES`,
        `> BASELINE THEATERS: 120 Verified Global Kinetic Fronts (Ukraine, Levant, Red Sea, Sahel)`,
        `> STATUS         : INGESTING GROUNDED INTELLIGENCE PACKETS...`,
        `> DEDUPLICATION  : Mutex locked. Multi-stream records aggregating...`,
      ].join('\n');
    }

    if (!exchange) {
      return [
        `[SYS: STANDBY] >>> TELEMETRY TERMINAL READY. WAITING FOR PIPELINE SYNC.`,
        `> Click "REFRESH LIVE DATA" or press "R" to trigger live multi-stream reconnaissance.`,
      ].join('\n');
    }

    const { request, response } = exchange;
    const reqTime = exchange.timestamp ? exchange.timestamp.substring(11, 19) : '00:00:00';

    const requestLines = [
      `[REQ: ${reqTime} UTC] >>> TRANSMITTED MULTI-STREAM RECON QUERY`,
      `METHOD   : ${request.method}`,
      `ENDPOINT : ${request.endpoint}`,
      `MODEL    : ${request.model} (Multi-Source Live)`,
      `TOOLS    : ${request.tools.join(', ')}`,
      `WINDOW   : ${request.dateWindow.start} -> ${request.dateWindow.end} (${request.dateWindow.days}D Rolling Retain)`,
      `SOURCES  : GDELT 2.0 Global Media Pipeline + UN OCHA ReliefWeb + Verified Hard-News Wires`,
      ``,
      `--- RECONNAISSANCE SYSTEM INSTRUCTION ---`,
      `"${request.promptSnippet}"`,
      ``,
      `--- INGESTION PROTOCOL CRITERIA ---`,
      `- Strictly accredited international/regional hard news (zero entertainment/music)`,
      `- Verified event dates within the rolling operational window`,
      `- Geo-coordinate centroid resolution and transparent severity scoring`,
    ];

    const isError = Boolean(
      response.error ||
      response.status === '400/ERROR' ||
      (typeof response.status === 'number' && response.status >= 400)
    );

    const responseLines = [
      `[RES: ${reqTime} UTC] <<< MULTI-STREAM INTELLIGENCE INBOUND`,
      `HTTP STATUS : ${response.status} (${response.statusText})`,
      `LATENCY     : ${response.latencyMs}ms`,
      `CITATIONS   : ${response.groundingCitationsCount} verified sources indexed`,
      `INCIDENTS   : ${response.eventsCount} operational conflict events parsed and geolocated`,
      ``,
      isError
        ? [
            `--- TELEMETRY STATUS NOTE ---`,
            `> NOTICE : ${response.error || 'External provider note logged'}`,
            `> REDUNDANCY : Seamlessly served from active multi-stream dataset & 120 baseline combat theaters.`,
          ].join('\n')
        : [
            `--- TELEMETRY SAMPLES (RECENT INGESTIONS) ---`,
            JSON.stringify(response.sampleRecords.slice(0, 3), null, 2),
            ``,
            `>> MULTI-STREAM INGESTION COMPLETE. ALL INCIDENTS MERGED INTO MAP CANVAS.`,
          ].join('\n'),
    ];

    if (tab === 'REQUEST') {
      return requestLines.join('\n');
    }
    if (tab === 'RETURNED') {
      return responseLines.join('\n');
    }

    return [...requestLines, '', ...responseLines].join('\n');
  }, [exchange, isRefreshing, tab]);

  // Handle Typewriter Animation
  useEffect(() => {
    if (tab === 'ANALYST' || tab === 'SITREP') {
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const stepSize = Math.max(8, Math.floor(fullText.length / 80));
    const intervalTime = 16;

    timerRef.current = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = prev + stepSize;
        if (next >= fullText.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTyping(false);
          return fullText.length;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fullText, tab]);

  // Auto-scroll
  useEffect(() => {
    if (!isMinimized && scrollRef.current && isTyping) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLength, isMinimized, isTyping]);

  const handleSkipTyping = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayedLength(fullText.length);
    setIsTyping(false);
  };

  const handleReplay = () => {
    setDisplayedLength(0);
    setIsTyping(true);
  };

  const handleCopy = async () => {
    let textToCopy = fullText;
    if (tab === 'ANALYST' && analystResult) {
      textToCopy = analystResult.answer;
    } else if (tab === 'SITREP' && sitrepResult) {
      textToCopy = `${sitrepResult.title}\n\n${sitrepResult.executiveSummary}`;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Submit AI Analyst Query
  const handleRunAnalystQuery = async (queryToRun?: string) => {
    const q = queryToRun || analystInput || bottomCommand;
    if (!q || !q.trim()) return;

    setTab('ANALYST');
    setAnalystLoading(true);
    setAnalystError(null);

    try {
      const res = await fetch('/api/ai/analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': localStorage.getItem('warroom_gemini_key') || '',
        },
        body: JSON.stringify({ query: q.trim(), mode: 'QUERY', days: 10 }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to generate intelligence analysis');
      }

      setAnalystResult(json.result);
      setAnalystInput('');
      setBottomCommand('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAnalystError(msg);
    } finally {
      setAnalystLoading(false);
    }
  };

  // Generate Global SitRep
  const handleGenerateSitRep = async () => {
    setTab('SITREP');
    setSitrepLoading(true);
    setSitrepError(null);

    try {
      const res = await fetch('/api/ai/analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': localStorage.getItem('warroom_gemini_key') || '',
        },
        body: JSON.stringify({ mode: 'SITREP', days: 10 }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to compile Situation Report');
      }

      setSitrepResult(json.sitrep);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSitrepError(msg);
    } finally {
      setSitrepLoading(false);
    }
  };

  const currentText = fullText.slice(0, displayedLength);

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
      {/* Terminal Title Bar */}
      {!hideHeader && (
        <div className="h-8 px-3 bg-[#08101a] border-b border-border flex items-center justify-between pointer-events-auto shrink-0">
          {/* Left: Terminal Status */}
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
            <span className="font-bold text-[11px] tracking-wider text-text-primary whitespace-nowrap">
              WARROOM // INTELLIGENCE & TELEMETRY TERMINAL
            </span>

            {isRefreshing ? (
              <span className="flex items-center gap-1 text-[9px] text-accent-cyan font-semibold animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                RECON SYNC
              </span>
            ) : (
              <span className="text-[9px] text-accent-green font-bold bg-emerald-950/60 px-1.5 py-0.2 border border-emerald-600/70">
                ● ACTIVE (GDELT + RELIEFWEB)
              </span>
            )}
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center gap-1">
            {!isMinimized && (
              <>
                {isTyping && tab !== 'ANALYST' && tab !== 'SITREP' && (
                  <button
                    onClick={handleSkipTyping}
                    className="px-1.5 py-0.5 text-[9px] font-bold text-accent-cyan hover:bg-panel-hover border border-accent-cyan/40 transition-colors cursor-pointer"
                    title="Skip typewriter animation"
                  >
                    <FastForward className="w-2.5 h-2.5 inline mr-1" />
                    SKIP
                  </button>
                )}

                {tab !== 'ANALYST' && tab !== 'SITREP' && (
                  <button
                    onClick={handleReplay}
                    className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
                    title="Replay animation"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
                  title="Copy terminal content"
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
              </>
            )}

            {!fullHeight && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer ml-1"
                title={isMinimized ? 'Expand terminal' : 'Minimize'}
              >
                {isMinimized ? <ChevronUp className="w-3.5 h-3.5 text-accent-cyan" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Terminal Body */}
      {!isMinimized && (
        <>
          {/* Subheader Navigation Tabs */}
          <div className="h-7 px-2.5 bg-[#05090e] border-b border-border/50 flex items-center justify-between text-[10px] shrink-0 pointer-events-auto">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                onClick={() => setTab('STREAM')}
                className={`px-2 py-0.5 border transition-colors cursor-pointer ${
                  tab === 'STREAM'
                    ? 'border-accent-cyan text-accent-cyan bg-cyan-950/40 font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                [TELEMETRY: ALL]
              </button>
              <button
                onClick={() => setTab('REQUEST')}
                className={`px-2 py-0.5 border transition-colors cursor-pointer ${
                  tab === 'REQUEST'
                    ? 'border-accent-cyan text-accent-cyan bg-cyan-950/40 font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                [REQUEST: DISPATCH]
              </button>
              <button
                onClick={() => setTab('RETURNED')}
                className={`px-2 py-0.5 border transition-colors cursor-pointer ${
                  tab === 'RETURNED'
                    ? 'border-accent-cyan text-accent-cyan bg-cyan-950/40 font-bold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                [RETURNED: PAYLOAD]
              </button>
              <button
                onClick={() => setTab('ANALYST')}
                className={`px-2 py-0.5 border transition-colors cursor-pointer flex items-center gap-1 ${
                  tab === 'ANALYST'
                    ? 'border-amber-400 text-amber-300 bg-amber-950/40 font-bold'
                    : 'border-transparent text-amber-400/70 hover:text-amber-300'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                [AI ANALYST]
              </button>
              <button
                onClick={() => {
                  setTab('SITREP');
                  if (!sitrepResult && !sitrepLoading) {
                    handleGenerateSitRep();
                  }
                }}
                className={`px-2 py-0.5 border transition-colors cursor-pointer flex items-center gap-1 ${
                  tab === 'SITREP'
                    ? 'border-red-500 text-red-400 bg-red-950/40 font-bold'
                    : 'border-transparent text-red-400/70 hover:text-red-300'
                }`}
              >
                <FileText className="w-2.5 h-2.5 text-red-400" />
                [SITREP]
              </button>
            </div>

            <div className="flex items-center gap-2">
              {exchange && (
                <div className="hidden sm:flex items-center gap-2 text-[9px] text-text-muted">
                  <span>LATENCY: <strong className="text-text-primary">{exchange.response.latencyMs}ms</strong></span>
                  <span>SOURCES: <strong className="text-accent-cyan">GDELT + ReliefWeb</strong></span>
                </div>
              )}

              {hideHeader && (
                <div className="flex items-center gap-1 ml-2">
                  {isTyping && tab !== 'ANALYST' && tab !== 'SITREP' && (
                    <button
                      onClick={handleSkipTyping}
                      className="px-1.5 py-0.5 text-[9px] font-bold text-accent-cyan hover:bg-panel-hover border border-accent-cyan/40 transition-colors cursor-pointer"
                      title="Skip typewriter animation"
                    >
                      <FastForward className="w-2.5 h-2.5 inline mr-1" />
                      SKIP
                    </button>
                  )}
                  {tab !== 'ANALYST' && tab !== 'SITREP' && (
                    <button
                      onClick={handleReplay}
                      className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
                      title="Replay animation"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={handleCopy}
                    className="p-1 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
                    title="Copy terminal content"
                  >
                    {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab 1, 2, 3: Telemetry Console */}
          {(tab === 'STREAM' || tab === 'REQUEST' || tab === 'RETURNED') && (
            <div
              ref={scrollRef}
              onClick={() => {
                if (isTyping) handleSkipTyping();
                bottomInputRef.current?.focus();
              }}
              className="flex-1 overflow-y-auto p-2.5 font-mono text-[10px] leading-relaxed bg-[#03060a] text-slate-300 whitespace-pre-wrap select-text cursor-text relative pointer-events-auto"
              style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
            >
              {currentText}
              <span
                className={`inline-block w-2 h-3.5 bg-accent-cyan align-middle ml-0.5 ${
                  isTyping ? 'animate-pulse' : 'animate-[ping_1.2s_ease-in-out_infinite]'
                }`}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-15" />
            </div>
          )}

          {/* Tab 4: AI Analyst Terminal */}
          {tab === 'ANALYST' && (
            <div className="flex-1 flex flex-col bg-[#03060a] p-2.5 overflow-hidden pointer-events-auto">
              {/* Quick Query Pills */}
              <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 text-[9px] shrink-0 pointer-events-auto">
                <span className="text-text-muted shrink-0">FAST PROMPTS:</span>
                {QUICK_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setBottomCommand(q);
                      handleRunAnalystQuery(q);
                    }}
                    className="px-1.5 py-0.5 bg-panel-subtle hover:bg-panel-hover text-text-secondary hover:text-amber-300 border border-border transition-colors whitespace-nowrap cursor-pointer pointer-events-auto"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Analyst Output Screen */}
              <div
                onClick={() => bottomInputRef.current?.focus()}
                className="flex-1 overflow-y-auto border border-border/40 bg-black/60 p-2.5 text-[10px] space-y-2 select-text cursor-text pointer-events-auto"
              >
                {analystLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-amber-400 space-y-2 animate-pulse select-none">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <div>&gt;&gt;&gt; EXAMINING 10-DAY KINETIC TELEMETRY VIA GEMINI INTEL ENGINE...</div>
                  </div>
                ) : analystError ? (
                  <div className="p-2 border border-red-800 bg-red-950/40 text-red-300">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                    ERROR: {analystError}
                  </div>
                ) : analystResult ? (
                  <div className="space-y-2 text-slate-200">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1">
                      <span className="text-amber-400 font-bold">
                        // TACTICAL INTELLIGENCE ASSESSMENT [{analystResult.source}]
                      </span>
                      <span className="text-text-muted text-[9px]">
                        QUERY TIME: {analystResult.queryTimeMs}ms | {new Date(analystResult.timestamp).toTimeString().slice(0, 8)} UTC
                      </span>
                    </div>

                    {/* Key Findings */}
                    {analystResult.keyFindings.length > 0 && (
                      <div className="bg-amber-950/20 border-l-2 border-amber-400 p-2 space-y-1">
                        <div className="text-amber-300 font-bold text-[9px]">KEY TELEMETRY FINDINGS:</div>
                        {analystResult.keyFindings.map((f, i) => (
                          <div key={i} className="text-slate-300 flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">»</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Full Assessment */}
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                      {analystResult.answer}
                    </div>

                    {/* Citations */}
                    {analystResult.citations.length > 0 && (
                      <div className="border-t border-border/40 pt-1 text-[9px] text-text-muted flex items-center gap-2 flex-wrap">
                        <span className="text-accent-cyan font-bold">GROUNDED CITATIONS:</span>
                        {analystResult.citations.map((c, i) => (
                          <span key={i} className="bg-panel-subtle px-1.5 py-0.2 border border-border text-text-secondary">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted space-y-1 text-center select-none">
                    <Sparkles className="w-5 h-5 text-amber-400/60 mb-1" />
                    <div className="text-slate-300 font-bold">AI DEFENSE ANALYST TERMINAL READY</div>
                    <div>Type any question in the prompt bar below or click a fast prompt above to query active telemetry.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Situation Report (SitRep) */}
          {tab === 'SITREP' && (
            <div className="flex-1 flex flex-col bg-[#03060a] p-2.5 overflow-hidden pointer-events-auto">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold text-[11px]">
                    // EXECUTIVE DEFENSE SITUATION REPORT (SITREP)
                  </span>
                  {sitrepResult && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 border ${
                        sitrepResult.threatLevel === 'CRITICAL'
                          ? 'bg-red-950/70 text-red-300 border-red-600'
                          : sitrepResult.threatLevel === 'HIGH'
                          ? 'bg-amber-950/70 text-amber-300 border-amber-600'
                          : 'bg-yellow-950/70 text-yellow-300 border-yellow-600'
                      }`}
                    >
                      THREAT LEVEL: {sitrepResult.threatLevel}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleGenerateSitRep}
                  disabled={sitrepLoading}
                  className="px-2.5 py-1 bg-red-950/70 border border-red-600 text-red-300 font-bold hover:bg-red-900/80 disabled:opacity-40 cursor-pointer flex items-center gap-1 text-[10px]"
                >
                  <RefreshCw className={`w-3 h-3 ${sitrepLoading ? 'animate-spin' : ''}`} />
                  COMPILE RE-FRESHED SITREP
                </button>
              </div>

              {/* SitRep Content */}
              <div className="flex-1 overflow-y-auto border border-border/40 bg-black/60 p-2.5 text-[10px] space-y-3 select-text cursor-text pointer-events-auto">
                {sitrepLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-red-400 space-y-2 animate-pulse select-none">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <div>&gt;&gt;&gt; COMPILING GLOBAL MULTI-THEATER SITREP VIA GEMINI ENGINE...</div>
                  </div>
                ) : sitrepError ? (
                  <div className="p-2 border border-red-800 bg-red-950/40 text-red-300">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-red-400" />
                    ERROR: {sitrepError}
                  </div>
                ) : sitrepResult ? (
                  <div className="space-y-3 text-slate-200">
                    <div className="border-b border-border/40 pb-1.5 flex items-center justify-between">
                      <div className="font-bold text-accent-cyan">{sitrepResult.title}</div>
                      <div className="text-text-muted text-[9px]">{sitrepResult.summary}</div>
                    </div>

                    {/* Executive Summary */}
                    <div className="bg-panel-subtle border-l-2 border-red-500 p-2.5 text-slate-300 leading-relaxed whitespace-pre-wrap">
                      <div className="text-red-400 font-bold text-[9px] mb-1">1. STRATEGIC EXECUTIVE OVERVIEW:</div>
                      {sitrepResult.executiveSummary}
                    </div>

                    {/* Critical Flashpoints */}
                    {sitrepResult.flashpoints.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-accent-cyan font-bold text-[9px]">2. PRIMARY MONITORED COMBAT THEATERS:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {sitrepResult.flashpoints.map((fp, idx) => (
                            <div key={idx} className="bg-black/50 border border-border p-2 space-y-0.5">
                              <div className="flex items-center justify-between text-text-primary font-bold">
                                <span>{fp.theater} ({fp.country})</span>
                                <span className="text-red-400 text-[9px]">{fp.incidents} events / {fp.fatalities} KIA</span>
                              </div>
                              <div className="text-text-secondary text-[9px]">{fp.assessment}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tactical Developments */}
                    {sitrepResult.tacticalDevelopments.length > 0 && (
                      <div className="border-t border-border/40 pt-2 space-y-1">
                        <div className="text-amber-300 font-bold text-[9px]">3. VERIFIED KINETIC PEAKS:</div>
                        {sitrepResult.tacticalDevelopments.map((td, idx) => (
                          <div key={idx} className="text-slate-300 text-[9px] flex items-start gap-1">
                            <span className="text-red-400 font-bold">⚡</span>
                            <span>{td}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Universal Interactive Command & Prompt Bar (Always accessible at bottom of terminal) */}
          <div
            onClick={() => bottomInputRef.current?.focus()}
            className="h-10 px-3 bg-[#060d17] border-t border-border/80 flex items-center gap-2 cursor-text relative z-40 pointer-events-auto shrink-0"
          >
            <span className="text-amber-400 font-bold text-xs whitespace-nowrap select-none shrink-0 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              intel:~$
            </span>
            <input
              ref={bottomInputRef}
              type="text"
              value={bottomCommand}
              onChange={(e) => setBottomCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && bottomCommand.trim()) {
                  const val = bottomCommand.trim();
                  setBottomCommand('');
                  if (val.toLowerCase() === 'sitrep') {
                    setTab('SITREP');
                    handleGenerateSitRep();
                  } else if (val.toLowerCase() === 'telemetry' || val.toLowerCase() === 'stream') {
                    setTab('STREAM');
                  } else if (val.toLowerCase() === 'request') {
                    setTab('REQUEST');
                  } else if (val.toLowerCase() === 'returned') {
                    setTab('RETURNED');
                  } else {
                    setTab('ANALYST');
                    setAnalystInput(val);
                    handleRunAnalystQuery(val);
                  }
                }
              }}
              placeholder="Ask AI defense analyst or enter command ('sitrep', 'telemetry', 'drone strikes')..."
              className="flex-1 bg-transparent text-xs text-text-primary focus:outline-none placeholder:text-text-muted font-mono select-text cursor-text pointer-events-auto z-50 relative"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              onClick={() => {
                if (bottomCommand.trim()) {
                  const val = bottomCommand.trim();
                  setBottomCommand('');
                  setTab('ANALYST');
                  setAnalystInput(val);
                  handleRunAnalystQuery(val);
                }
              }}
              disabled={analystLoading || !bottomCommand.trim()}
              className="px-2.5 py-1 bg-amber-950/70 border border-amber-500/80 text-amber-300 font-bold hover:bg-amber-900/80 disabled:opacity-40 cursor-pointer flex items-center gap-1 text-[10px] shrink-0"
            >
              {analystLoading ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
              EXECUTE
            </button>
          </div>
        </>
      )}
    </div>
  );
};