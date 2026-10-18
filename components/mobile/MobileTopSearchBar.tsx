'use client';

import React, { useState, useRef } from 'react';
import { Terminal, Search, X, Crosshair } from 'lucide-react';
import { Conflict, FilterState } from '@/types/conflict';
import { parseIntelCommand } from '@/lib/intelligence/command-parser';
import { isCountryFilterCommand, parseCountryInput } from '@/lib/data/country-coords';
import { isRelationCommand, RelationshipNetwork } from '@/lib/data/country-relationships';
import { MobileTab } from './MobileBottomBar';

interface MobileTopSearchBarProps {
  onSelectCountry: (country: string) => void;
  onSelectConflict: (conflict: Conflict | null) => void;
  onExecuteSearch: (query: string) => void;
  onClearFilter: () => void;
  onUpdateFilters?: (updates: Partial<FilterState>) => void;
  onToggleTheme?: (targetTheme?: 'dark' | 'light') => void;
  onChangeTab?: (tab: MobileTab) => void;
  onShowRelationNetwork?: (countryName: string) => RelationshipNetwork | null;
  allConflicts: Conflict[];
  activeCountry?: string;
  theme?: 'dark' | 'light';
}

const QUICK_THEATERS = [
  { label: 'ALL THEATERS', country: '' },
  { label: 'UKRAINE', country: 'Ukraine' },
  { label: 'MIDDLE EAST', country: 'Israel' },
  { label: 'RED SEA', country: 'Yemen' },
  { label: 'SUDAN', country: 'Sudan' },
  { label: 'SOMALIA', country: 'Somalia' },
  { label: 'MYANMAR', country: 'Myanmar' },
  { label: 'TAIWAN', country: 'Taiwan' },
];

export const MobileTopSearchBar: React.FC<MobileTopSearchBarProps> = ({
  onSelectCountry,
  onSelectConflict,
  onExecuteSearch,
  onClearFilter,
  onUpdateFilters,
  onToggleTheme,
  onChangeTab,
  onShowRelationNetwork,
  allConflicts,
  activeCountry = '',
  theme = 'dark',
}) => {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLight = theme === 'light';

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleCommandExecution = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      onClearFilter();
      return;
    }

    const lower = trimmed.toLowerCase();

    // 1. Clear Command
    if (lower === 'clc' || lower === 'clear' || lower === 'reset') {
      setQuery('');
      onClearFilter();
      onSelectConflict(null);
      showFeedback('// FILTERS CLEARED · OVERVIEW RESTORED');
      return;
    }

    // 2. View Switching Commands
    if (lower === 'home' || lower === 'm' || lower === 'map' || lower === 'globe') {
      onChangeTab?.('HOME');
      showFeedback('// SWITCHED TO 3D GLOBE VIEW');
      return;
    }
    if (lower === 'read' || lower === 'news' || lower === 'feed' || lower === 'wire' || lower === 't') {
      onChangeTab?.('READ');
      showFeedback('// SWITCHED TO NEWS WIRE');
      return;
    }
    if (lower === 'analysis' || lower === 'stats' || lower === 'intel') {
      onChangeTab?.('ANALYSIS');
      showFeedback('// SWITCHED TO AI ANALYSIS');
      return;
    }

    // 3. Horizon / Days Commands (1, 2, 3, 3d, 7d, 10d)
    if (lower === '1' || lower === '3d' || lower === '3') {
      onUpdateFilters?.({ days: 3 });
      showFeedback('// HORIZON SET TO 3 DAYS');
      return;
    }
    if (lower === '2' || lower === '7d' || lower === '7') {
      onUpdateFilters?.({ days: 7 });
      showFeedback('// HORIZON SET TO 7 DAYS');
      return;
    }
    if (lower === '3' || lower === '10d' || lower === '10') {
      onUpdateFilters?.({ days: 10 });
      showFeedback('// HORIZON SET TO 10 DAYS');
      return;
    }

    // 4. Theme Toggle Commands
    if (
      lower === 'theme' ||
      lower === 'theme toggle' ||
      lower === 'theme light' ||
      lower === 'theme dark' ||
      lower === 'light' ||
      lower === 'dark' ||
      lower === 'mode light' ||
      lower === 'mode dark' ||
      lower === 'day' ||
      lower === 'night'
    ) {
      let targetTheme: 'dark' | 'light' | undefined;
      if (lower.includes('light') || lower.includes('day')) {
        targetTheme = 'light';
      } else if (lower.includes('dark') || lower.includes('night')) {
        targetTheme = 'dark';
      }
      onToggleTheme?.(targetTheme);
      showFeedback(`// THEME SWITCHED TO ${targetTheme ? targetTheme.toUpperCase() : 'TOGGLED'}`);
      return;
    }

    // 5. Tactical Relation Vector Command (e.g. "israel map", "russia rel")
    const relCheck = isRelationCommand(trimmed);
    if (relCheck.isRelation && relCheck.countryName) {
      if (onShowRelationNetwork) {
        const net = onShowRelationNetwork(relCheck.countryName);
        if (net) {
          onChangeTab?.('HOME');
          showFeedback(`// VECTORS ACTIVE: ${net.focalCountry} (${net.connectedCountries.length} Theaters)`);
          return;
        }
      }
    }

    // 6. AI Intelligence Command Intents (hotspots, forecast, chokepoints, sorties, etc.)
    const parsed = parseIntelCommand(trimmed, allConflicts.map((c) => c.country || ''));
    if (parsed.intent !== 'UNKNOWN') {
      if (parsed.intent === 'FORECAST' || parsed.intent === 'THREAT_INDEX' || parsed.intent === 'FLASHPOINTS') {
        onChangeTab?.('ANALYSIS');
        showFeedback(`// INTEL: [${parsed.intent}] ENGAGED`);
        return;
      }
      if (parsed.intent === 'HOT_SPOTS' || parsed.intent === 'SORTIES_NEAR' || parsed.intent === 'CLUSTER_MAP' || parsed.intent === 'CHOKEPOINTS') {
        onChangeTab?.('HOME');
        if (parsed.country) {
          onSelectCountry(parsed.country);
        }
        showFeedback(`// INTEL: [${parsed.intent}] DISPLAYING ON GLOBE`);
        return;
      }
    }

    // 7. Check if input matches a known Conflict Theater or Country
    const matchingConflict = allConflicts.find(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.country?.toLowerCase() === lower
    );

    if (matchingConflict) {
      onSelectConflict(matchingConflict);
      if (matchingConflict.country) {
        onSelectCountry(matchingConflict.country);
      }
      onChangeTab?.('HOME');
      showFeedback(`// THEATER LOCKED: ${matchingConflict.name.toUpperCase()}`);
      return;
    }

    // 8. General Country Resolution
    const knownCountries = [
      ...new Set(allConflicts.map((c) => c.country || '').filter(Boolean)),
    ];
    if (isCountryFilterCommand(trimmed, knownCountries)) {
      const parsedCountries = parseCountryInput(trimmed);
      if (parsedCountries.length > 0) {
        onSelectCountry(parsedCountries[0]);
        onChangeTab?.('HOME');
        showFeedback(`// RECON TARGET: ${parsedCountries[0].toUpperCase()}`);
        return;
      }
    }

    // 9. Free-text Search
    onSelectCountry(trimmed);
    onExecuteSearch(trimmed);
    showFeedback(`// SEARCH DISPATCHED: "${trimmed}"`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCommandExecution(query);
    inputRef.current?.blur();
  };

  const handleSelectQuick = (country: string) => {
    if (!country) {
      setQuery('');
      onClearFilter();
      onSelectConflict(null);
      showFeedback('// ALL THEATERS ACTIVE');
    } else {
      setQuery(country);
      handleCommandExecution(country);
    }
  };

  const handleClear = () => {
    setQuery('');
    onClearFilter();
    onSelectConflict(null);
    inputRef.current?.focus();
  };

  return (
    <div
      className={`w-full shrink-0 px-3 pt-2 pb-1.5 font-mono z-30 transition-all ${
        isLight
          ? 'glass-panel border-b border-slate-300/80 bg-white/70 backdrop-blur-md text-slate-900'
          : 'glass-panel border-b border-white/10 bg-black/40 backdrop-blur-md text-white'
      }`}
    >
      {/* Terminal Command Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
        <div
          className={`flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border transition-all ${
            isLight
              ? 'bg-white/80 border-slate-300 text-slate-900 focus-within:border-cyan-600 focus-within:ring-1 focus-within:ring-cyan-600/30 shadow-xs'
              : 'bg-white/[0.04] border-white/12 text-white focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30'
          }`}
        >
          <Terminal
            className={`w-3.5 h-3.5 shrink-0 ${
              isLight ? 'text-cyan-700' : 'text-cyan-400 animate-pulse'
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ENTER COMMAND OR THEATER (e.g. ukraine, theme, hotspots)..."
            className={`w-full bg-transparent text-[11px] font-mono tracking-wider focus:outline-none ${
              isLight
                ? 'text-slate-900 placeholder:text-slate-500'
                : 'text-white placeholder:text-slate-400'
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-slate-400 hover:text-white shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="h-9 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-[10.5px] tracking-wider shrink-0 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] active:scale-95"
        >
          <Search className="w-3.5 h-3.5" />
          <span>GO</span>
        </button>
      </form>

      {/* Terminal Feedback Output Toast */}
      {feedback && (
        <div className="pt-1 text-[10px] font-bold text-cyan-400 tracking-wider animate-in fade-in duration-150">
          {feedback}
        </div>
      )}

      {/* Quick Theater Select Horizontal Scroll Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 pb-0.5 text-[9.5px]">
        {QUICK_THEATERS.map((t) => {
          const isActive =
            (!t.country && !activeCountry && !query) ||
            (t.country &&
              (activeCountry.toLowerCase() === t.country.toLowerCase() ||
                query.toLowerCase() === t.country.toLowerCase()));

          return (
            <button
              key={t.label}
              type="button"
              onClick={() => handleSelectQuick(t.country)}
              className={`px-2 py-0.5 rounded-md font-mono font-bold tracking-wider uppercase shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                isActive
                  ? isLight
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : isLight
                  ? 'bg-slate-200/90 text-slate-700 hover:bg-slate-300'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {isActive && <Crosshair className="w-2.5 h-2.5 animate-spin" />}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
