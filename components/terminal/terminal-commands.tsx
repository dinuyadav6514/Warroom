import React from 'react';
import { Conflict, ConflictEvent } from '@/types/conflict';

export interface CommandContext {
  allConflicts: Conflict[];
  allEvents: ConflictEvent[];
  activeConflict: Conflict | null;
  onSelectConflict?: (conflict: Conflict | null) => void;
  onSelectView?: (view: any) => void;
  onUpdateFilters?: (updates: any) => void;
  onRefresh?: () => void;
  onOpenSources?: () => void;
  onSelectEventById?: (id: string) => void;
  onSelectCountry?: (country: string) => void;
  onSelectRegion?: (region: string) => void;
}

export interface CommandExecutionResult {
  output: React.ReactNode;
  isError?: boolean;
  isClear?: boolean;
  isAiQuery?: boolean;
  aiQueryText?: string;
  isSitRep?: boolean;
}

/**
 * Checks if the input is meant as an AI Analyst natural language query.
 * Matches:
 * - Any text ending with '?' (e.g. "What is happening in Kharkiv?", "drone strikes in Red Sea?")
 * - Any text starting with '?' (e.g. "? analyze escalation risk in Taiwan")
 * - Text starting with 'ask ', 'ai ', 'intel:', 'query:'
 * - Natural question words: 'what', 'why', 'how', 'who', 'when', 'where', 'is', 'are', 'can', 'will', 'explain', 'analyze', 'summarize', 'assess'
 */
export function isAiQuery(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  if (t.endsWith('?')) return true;
  if (t.startsWith('?')) return true;

  const lower = t.toLowerCase();
  if (
    lower.startsWith('ask ') ||
    lower.startsWith('ai ') ||
    lower.startsWith('intel:') ||
    lower.startsWith('intel ') ||
    lower.startsWith('query:') ||
    lower.startsWith('query ')
  ) {
    return true;
  }

  const questionWords = [
    'what ',
    'why ',
    'how ',
    'who ',
    'when ',
    'where ',
    'is ',
    'are ',
    'can ',
    'will ',
    'explain ',
    'analyze ',
    'summarize ',
    'assess ',
    'report on ',
  ];

  return questionWords.some((w) => lower.startsWith(w));
}

/**
 * Extracts clean question text from an AI query command.
 */
export function extractAiQuery(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('?')) {
    cleaned = cleaned.slice(1).trim();
  }
  const lower = cleaned.toLowerCase();
  if (lower.startsWith('ask ')) cleaned = cleaned.slice(4).trim();
  else if (lower.startsWith('ai ')) cleaned = cleaned.slice(3).trim();
  else if (lower.startsWith('intel:')) cleaned = cleaned.slice(6).trim();
  else if (lower.startsWith('intel ')) cleaned = cleaned.slice(6).trim();
  else if (lower.startsWith('query:')) cleaned = cleaned.slice(6).trim();
  else if (lower.startsWith('query ')) cleaned = cleaned.slice(6).trim();

  return cleaned;
}

/**
 * Execute Linux-style commands against the WarRoom data context.
 */
export function executeLinuxCommand(
  rawInput: string,
  context: CommandContext
): CommandExecutionResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { output: '' };
  }

  // Check if this is an AI query
  if (isAiQuery(trimmed)) {
    return {
      output: null,
      isAiQuery: true,
      aiQueryText: extractAiQuery(trimmed),
    };
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const argStr = args.join(' ').trim();
  const flags = args.filter((a) => a.startsWith('-'));
  const nonFlagArgs = args.filter((a) => !a.startsWith('-'));

  switch (cmd) {
    case 'help':
    case 'man':
      return { output: renderHelpManual(nonFlagArgs[0]) };

    case 'clear':
    case 'cls':
    case 'reset':
      return { output: '', isClear: true };

    case 'ls':
    case 'dir':
      return { output: renderLs(nonFlagArgs, flags, context) };

    case 'top':
    case 'ps':
    case 'htop':
      return { output: renderTop(context) };

    case 'cat':
      return { output: renderCat(nonFlagArgs.join(' '), context) };

    case 'grep':
      if (!argStr) {
        return {
          output: 'grep: missing search pattern. Usage: grep <keyword>',
          isError: true,
        };
      }
      return { output: renderGrep(argStr, context) };

    case 'status':
    case 'systemctl':
      return { output: renderStatus(context) };

    case 'sitrep':
      return {
        output: '>>> DISPATCHING EXECUTIVE SITUATION REPORT COMPILER...',
        isSitRep: true,
      };

    case 'date':
      return {
        output: `${new Date().toUTCString()} [DEFCON 2 WATCH ACTIVE]`,
      };

    case 'whoami':
      return {
        output: 'warroom-operator (Defense Tactical Intelligence Specialist // Station: ALPHA-1)',
      };

    case 'uname':
      if (flags.includes('-a') || flags.includes('--all') || flags.length === 0) {
        return {
          output:
            'Linux warroom-tactical-node 6.8.0-warroom-intel #1 SMP PREEMPT_DYNAMIC UTC 2026 x86_64 GNU/Linux',
        };
      }
      return { output: 'Linux' };

    case 'curl':
      return { output: renderCurl(argStr, context) };

    case 'echo':
      return { output: argStr };

    case 'sync':
    case 'refresh':
    case 'reload':
      if (context.onRefresh) context.onRefresh();
      return {
        output: (
          <div className="text-accent-cyan">
            [SYS: OK] Flushed cache and dispatched live reconnaissance across GDELT 2.0 & UN ReliefWeb pipelines.
          </div>
        ),
      };

    case 'view':
      if (!argStr) {
        return {
          output: 'Usage: view <world|conflicts|escalation|timeline|actors>',
          isError: true,
        };
      }
      const v = argStr.toUpperCase();
      if (['WORLD', 'CONFLICTS', 'ESCALATION', 'TIMELINE', 'ACTORS'].includes(v)) {
        if (context.onSelectView) context.onSelectView(v);
        return { output: `Navigated workstation view to: ${v}` };
      }
      return {
        output: `Unknown view: "${argStr}". Available: world, conflicts, escalation, timeline, actors`,
        isError: true,
      };

    case 'filter':
      if (argStr === '3d' || argStr === '3') {
        if (context.onUpdateFilters) context.onUpdateFilters({ days: 3 });
        return { output: 'Data retention window set to: 3 DAYS (Rolling)' };
      }
      if (argStr === '7d' || argStr === '7') {
        if (context.onUpdateFilters) context.onUpdateFilters({ days: 7 });
        return { output: 'Data retention window set to: 7 DAYS (Rolling)' };
      }
      if (argStr === '10d' || argStr === '10') {
        if (context.onUpdateFilters) context.onUpdateFilters({ days: 10 });
        return { output: 'Data retention window set to: 10 DAYS (Rolling)' };
      }
      return {
        output: 'Usage: filter <3d|7d|10d>',
        isError: true,
      };

    case 'country':
      if (!argStr) return { output: 'Usage: country <name>', isError: true };
      if (context.onSelectCountry) context.onSelectCountry(argStr);
      return { output: `Filtered active theater feed by country: "${argStr}"` };

    case 'region':
      if (!argStr) return { output: 'Usage: region <name>', isError: true };
      if (context.onSelectRegion) context.onSelectRegion(argStr);
      return { output: `Filtered active theater feed by region: "${argStr}"` };

    case 'history':
      return { output: 'Use Up/Down Arrow keys to cycle through recent command history.' };

    case 'exit':
    case 'quit':
      return { output: 'Session active. WarRoom terminal cannot be terminated.' };

    default:
      return {
        output: (
          <div className="text-red-400">
            command not found: <span className="font-bold">{cmd}</span>. Type <span className="text-accent-cyan font-bold">help</span> for Linux commands or end your query with <span className="text-amber-300 font-bold">&apos;?&apos;</span> for AI analysis.
          </div>
        ),
        isError: true,
      };
  }
}

// ----------------------------------------------------------------------------
// Helper Renderers
// ----------------------------------------------------------------------------

function renderHelpManual(specificCmd?: string) {
  return (
    <div className="space-y-2 text-[11px] leading-relaxed text-slate-300 font-mono">
      <div className="text-accent-cyan font-bold border-b border-border pb-1">
        WARROOM TACTICAL INTELLIGENCE TERMINAL // LINUX-STYLE CLI MANUAL
      </div>

      <div className="space-y-1">
        <div className="text-amber-400 font-bold">1. AI DEFENSE ANALYST [NATURAL LANGUAGE]</div>
        <div className="pl-3 space-y-0.5 text-text-secondary">
          <div><span className="text-amber-300 font-bold">&lt;question&gt;?</span> — Any prompt ending with a question mark invokes AI analysis!</div>
          <div><span className="text-amber-300 font-bold">? &lt;question&gt;</span> — Shorthand prefix for rapid tactical analysis</div>
          <div><span className="text-amber-300 font-bold">ask &lt;prompt&gt;</span> / <span className="text-amber-300 font-bold">ai &lt;prompt&gt;</span> — Explicit AI command dispatch</div>
          <div className="text-[10px] text-text-muted italic">Example: &ldquo;What are the latest drone strikes in the Red Sea?&rdquo;</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-accent-cyan font-bold">2. CORE LINUX COMMANDS</div>
        <div className="pl-3 space-y-0.5 text-text-secondary">
          <div><span className="text-text-primary font-bold">ls [-l] [/theaters|/events]</span> — List monitored conflict theaters or events</div>
          <div><span className="text-text-primary font-bold">top</span> / <span className="text-text-primary font-bold">ps</span> — Real-time table of top escalating combat zones & casualties</div>
          <div><span className="text-text-primary font-bold">cat &lt;target&gt;</span> — Display dossier, situation report, or pipeline status</div>
          <div><span className="text-text-primary font-bold">grep &lt;keyword&gt;</span> — Search through all live incidents and theaters</div>
          <div><span className="text-text-primary font-bold">status</span> / <span className="text-text-primary font-bold">systemctl</span> — Check GDELT & ReliefWeb pipeline health</div>
          <div><span className="text-text-primary font-bold">clear</span> — Clear terminal output buffer</div>
          <div><span className="text-text-primary font-bold">date</span> / <span className="text-text-primary font-bold">whoami</span> / <span className="text-text-primary font-bold">uname -a</span> — System and identity diagnostics</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-red-400 font-bold">3. DEFENSE OPERATIONS</div>
        <div className="pl-3 space-y-0.5 text-text-secondary">
          <div><span className="text-red-300 font-bold">sitrep</span> — Compile and output executive Situation Report</div>
          <div><span className="text-text-primary font-bold">sync</span> / <span className="text-text-primary font-bold">refresh</span> — Force immediate news wire sync across 100+ hotspots</div>
          <div><span className="text-text-primary font-bold">filter &lt;3d|7d|10d&gt;</span> — Switch operational rolling retention window</div>
          <div><span className="text-text-primary font-bold">view &lt;world|conflicts|escalation|timeline|actors&gt;</span> — Switch active view</div>
        </div>
      </div>
    </div>
  );
}

function renderLs(args: string[], flags: string[], context: CommandContext) {
  const target = args[0] ? args[0].toLowerCase() : '/theaters';

  if (target === '/events' || target === 'events') {
    const list = context.allEvents.slice(0, 15);
    return (
      <div className="space-y-1 text-[10px] font-mono">
        <div className="text-text-muted">total {context.allEvents.length} events (showing recent 15):</div>
        <div className="grid grid-cols-1 gap-0.5">
          {list.map((e, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-300">
              <span className="text-text-muted">[{e.eventDate}]</span>
              <span className={`font-bold ${e.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                {e.severity.padEnd(8)}
              </span>
              <span className="text-accent-cyan truncate w-44">{e.country}: {e.location}</span>
              <span className="text-text-secondary truncate">{e.eventType}</span>
              {(e.fatalities ?? 0) > 0 && <span className="text-red-400 font-bold">+{e.fatalities} KIA</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: list theaters
  const list = context.allConflicts.slice(0, 20);
  return (
    <div className="space-y-1 text-[10px] font-mono">
      <div className="text-text-muted">total {context.allConflicts.length} monitored theaters (showing top 20):</div>
      <div className="border-b border-border/60 pb-0.5 text-text-muted flex gap-2">
        <span className="w-10">ESCAL</span>
        <span className="w-48">THEATER</span>
        <span className="w-28">COUNTRY</span>
        <span className="w-16">EVENTS</span>
        <span className="w-16">STATUS</span>
      </div>
      <div className="space-y-0.5">
        {list.map((c, idx) => (
          <div
            key={idx}
            onClick={() => context.onSelectConflict && context.onSelectConflict(c)}
            className="flex items-center gap-2 hover:bg-cyan-950/40 cursor-pointer py-0.5 text-slate-300"
          >
            <span className={`w-10 font-bold ${c.escalationIndex >= 70 ? 'text-red-400' : 'text-amber-400'}`}>
              {c.escalationIndex}%
            </span>
            <span className="w-48 text-accent-cyan truncate">{c.name}</span>
            <span className="w-28 text-text-secondary truncate">{c.country}</span>
            <span className="w-16 text-text-muted">{c.eventCount7d} ev</span>
            <span className={`w-16 text-[9px] font-bold ${c.status === 'ESCALATING' ? 'text-red-400' : 'text-emerald-400'}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
      {context.allConflicts.length > 20 && (
        <div className="text-text-muted pt-1">
          ... and {context.allConflicts.length - 20} more theaters. Type &ldquo;grep &lt;keyword&gt;&rdquo; to filter.
        </div>
      )}
    </div>
  );
}

function renderTop(context: CommandContext) {
  const sorted = [...context.allConflicts].sort((a, b) => b.escalationIndex - a.escalationIndex).slice(0, 10);
  const now = new Date().toTimeString().slice(0, 8);

  return (
    <div className="space-y-1 text-[10px] font-mono leading-tight">
      <div className="text-accent-cyan font-bold flex items-center justify-between border-b border-border pb-1">
        <span>TOP KINETIC FLASHPOINTS — {now} UTC</span>
        <span>THEATERS: {context.allConflicts.length} | EVENTS: {context.allEvents.length}</span>
      </div>
      <div className="text-text-muted flex gap-2 font-bold py-0.5 border-b border-border/40">
        <span className="w-8">PID</span>
        <span className="w-48">THEATER</span>
        <span className="w-24">COUNTRY</span>
        <span className="w-12">ESCAL</span>
        <span className="w-12">INTEN</span>
        <span className="w-12">FATAL</span>
        <span className="w-16">TREND</span>
      </div>
      {sorted.map((c, idx) => (
        <div
          key={idx}
          onClick={() => context.onSelectConflict && context.onSelectConflict(c)}
          className="flex items-center gap-2 hover:bg-cyan-950/40 cursor-pointer py-0.5 text-slate-200"
        >
          <span className="w-8 text-text-muted">{(idx + 1).toString().padStart(3, '0')}</span>
          <span className="w-48 text-accent-cyan truncate">{c.name}</span>
          <span className="w-24 text-text-secondary truncate">{c.country}</span>
          <span className={`w-12 font-bold ${c.escalationIndex >= 70 ? 'text-red-400' : 'text-amber-400'}`}>
            {c.escalationIndex}%
          </span>
          <span className="w-12 text-slate-300">{c.intensity}%</span>
          <span className="w-12 text-red-400 font-bold">{c.fatalities7d || 0}</span>
          <span className={`w-16 text-[9px] font-bold ${c.escalationTrend === 'UP' ? 'text-red-400' : 'text-emerald-400'}`}>
            {c.escalationTrend === 'UP' ? '↑ UP' : c.escalationTrend === 'DOWN' ? '↓ DOWN' : '→ STABLE'}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderCat(target: string, context: CommandContext) {
  if (!target) {
    return 'cat: missing operand. Usage: cat <sitrep|status|telemetry|<theater-name>>';
  }

  const t = target.toLowerCase();

  if (t === 'status' || t === '/proc/status') {
    return renderStatus(context);
  }

  if (t === 'telemetry' || t === '/dev/telemetry') {
    return (
      <div className="space-y-1 text-[10px] text-slate-300 font-mono">
        <div className="text-accent-cyan font-bold">// REAL-TIME DATA PIPELINE TELEMETRY</div>
        <div>STREAM 1 : GDELT 2.0 Global Media Knowledge Graph (HTTP Port 80, Rate-Limited 6.5s)</div>
        <div>STREAM 2 : UN OCHA ReliefWeb Humanitarian Dispatches (Public REST API)</div>
        <div>STREAM 3 : Accredited Hard-News Defense Wires (ISW, UKMTO, Reuters, Al Jazeera)</div>
        <div>INGESTION : 100% Key-Free, Automated Deduplication Mutex Active</div>
      </div>
    );
  }

  if (t === 'sitrep') {
    return 'Type "sitrep" to compile a real-time fresh executive Situation Report.';
  }

  // Check matching conflict
  const found = context.allConflicts.find(
    (c) =>
      c.id.toLowerCase().includes(t) ||
      c.name.toLowerCase().includes(t) ||
      (c.country && c.country.toLowerCase().includes(t))
  );

  if (found) {
    return (
      <div className="space-y-1.5 text-[10px] font-mono text-slate-200 p-2 bg-black/60 border border-border">
        <div className="text-accent-cyan font-bold text-xs flex items-center justify-between">
          <span>{found.name.toUpperCase()}</span>
          <span className="text-red-400 font-bold">ESCALATION: {found.escalationIndex}%</span>
        </div>
        <div>COUNTRY: <strong className="text-text-primary">{found.country}</strong> | REGION: {found.region}</div>
        <div>STATUS: <strong className="text-amber-400">{found.status}</strong> (Trend: {found.escalationTrend})</div>
        <div>OBSERVED 7-DAY STRIKES: <strong className="text-accent-cyan">{found.eventCount7d}</strong> | FATALITIES: <strong className="text-red-400">{found.fatalities7d} KIA</strong></div>
        {found.actors && (
          <div>BELLIGERENTS: <span className="text-text-secondary">{found.actors.join(', ')}</span></div>
        )}
        {found.recentEvents && found.recentEvents[0] && (
          <div className="pt-1 text-text-muted border-t border-border/40">
            LATEST STRIKE: [{found.recentEvents[0].eventDate}] {found.recentEvents[0].location} — &ldquo;{found.recentEvents[0].notes}&rdquo;
          </div>
        )}
      </div>
    );
  }

  return `cat: ${target}: No such file or conflict theater. Type "ls" to view valid names.`;
}

function renderGrep(keyword: string, context: CommandContext) {
  const q = keyword.replace(/^["']|["']$/g, '').toLowerCase();
  const matches = context.allEvents
    .filter(
      (e) =>
        e.country.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        (e.source && e.source.toLowerCase().includes(q))
    )
    .slice(0, 15);

  if (matches.length === 0) {
    return `grep: pattern "${keyword}" returned 0 matches across active events.`;
  }

  return (
    <div className="space-y-1 text-[10px] font-mono">
      <div className="text-text-muted">grep: found {matches.length} matching events for &ldquo;{keyword}&rdquo;:</div>
      <div className="space-y-0.5">
        {matches.map((e, idx) => (
          <div key={idx} className="text-slate-300">
            <span className="text-text-muted">[{e.eventDate}] </span>
            <span className="text-accent-cyan font-bold">{e.country} ({e.location}): </span>
            <span className="text-text-secondary">{e.eventType} — </span>
            <span className="text-slate-400 italic">
              {e.notes ? e.notes.slice(0, 90) + '...' : 'Incident recorded.'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderStatus(context: CommandContext) {
  const count = context.allConflicts.length;
  const eventsCount = context.allEvents.length;

  return (
    <div className="space-y-1 text-[10px] font-mono text-slate-300">
      <div className="text-accent-green font-bold">
        ● news-pipeline.service - Real-Time Geopolitical Ingestion Daemon
      </div>
      <div className="pl-3 space-y-0.5">
        <div>Loaded: <strong className="text-emerald-400">loaded</strong> (/etc/systemd/system/news-pipeline.service; enabled)</div>
        <div>Active: <strong className="text-emerald-400">active (running)</strong> since bootstrap; 100% key-free</div>
        <div>Providers: <span className="text-accent-cyan">GDELT 2.0 Project + UN OCHA ReliefWeb + Defense Wires</span></div>
        <div>Theaters Monitored: <strong className="text-text-primary">{count} Active Zones</strong></div>
        <div>Kinetic Events Ingested: <strong className="text-text-primary">{eventsCount} Verified Dispatches</strong></div>
        <div>Rate Limiting: <strong className="text-emerald-400">6,500ms mutex window enforced</strong></div>
        <div>AI Analyst Status: <strong className="text-amber-300">Online (Gemini Grounded / Deterministic Fallback)</strong></div>
      </div>
    </div>
  );
}

function renderCurl(path: string, context: CommandContext) {
  const cleanPath = path.toLowerCase().replace(/['"]/g, '');
  if (cleanPath.includes('status')) {
    return JSON.stringify(
      {
        status: 200,
        provider: 'GDELT 2.0 + UN RELIEFWEB',
        theaters: context.allConflicts.length,
        events: context.allEvents.length,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }
  return `curl: (200 OK) Simulating request to ${path || '/api'}. Use "status" or "sync" for direct operational commands.`;
}
