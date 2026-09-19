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
 * All inputs are routed to the AI analyst.
 * No Linux-style commands are supported.
 */
export function executeLinuxCommand(
  rawInput: string,
  _context: CommandContext
): CommandExecutionResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { output: '' };
  }

  return {
    output: (
      <div className="text-text-muted text-[11px]">
        Ask the AI analyst a question — end your query with{' '}
        <span className="text-amber-300 font-bold">&apos;?&apos;</span> or prefix with{' '}
        <span className="text-accent-cyan font-bold">ask</span> /{' '}
        <span className="text-accent-cyan font-bold">intel</span>.
      </div>
    ),
    isError: false,
  };
}
