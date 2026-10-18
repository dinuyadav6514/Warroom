'use client';

import React, { useState, useRef } from 'react';
import { Terminal, Search, X, Crosshair } from 'lucide-react';
import { Conflict } from '@/types/conflict';

interface MobileTopSearchBarProps {
  onSelectCountry: (country: string) => void;
  onSelectConflict: (conflict: Conflict | null) => void;
  onExecuteSearch: (query: string) => void;
  onClearFilter: () => void;
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
  allConflicts,
  activeCountry = '',
  theme = 'dark',
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isLight = theme === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      onClearFilter();
      return;
    }

    // Check if query matches a known conflict theater
    const matchingConflict = allConflicts.find(
      (c) =>
        c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        c.country?.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (matchingConflict) {
      onSelectConflict(matchingConflict);
      if (matchingConflict.country) {
        onSelectCountry(matchingConflict.country);
      }
    } else {
      // Direct country selection or free search
      onSelectCountry(trimmed);
      onExecuteSearch(trimmed);
    }

    inputRef.current?.blur();
  };

  const handleSelectQuick = (country: string) => {
    if (!country) {
      setQuery('');
      onClearFilter();
      onSelectConflict(null);
    } else {
      setQuery(country);
      const matchingConflict = allConflicts.find(
        (c) => c.country?.toLowerCase() === country.toLowerCase()
      );
      if (matchingConflict) {
        onSelectConflict(matchingConflict);
      }
      onSelectCountry(country);
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
      className={`w-full shrink-0 px-2.5 pt-2 pb-1.5 font-mono z-30 transition-colors ${
        isLight
          ? 'bg-slate-100/90 border-b border-slate-300 backdrop-blur-md'
          : 'bg-black/85 border-b border-white/10 backdrop-blur-md'
      }`}
    >
      {/* Terminal Command Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 relative">
        <div
          className={`flex-1 flex items-center gap-2 h-9 px-3 rounded-xl border transition-all ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 focus-within:border-cyan-600 focus-within:ring-1 focus-within:ring-cyan-600/30'
              : 'bg-white/5 border-white/12 text-white focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/30'
          }`}
        >
          <Terminal
            className={`w-3.5 h-3.5 shrink-0 ${
              isLight ? 'text-cyan-700' : 'text-cyan-400 animate-pulse'
            }`}
          />
          <span
            className={`text-[11px] font-bold shrink-0 ${
              isLight ? 'text-cyan-700' : 'text-cyan-400'
            }`}
          >
            &gt;_
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT THEATER / COMMAND (e.g. ukraine, somalia)..."
            className={`w-full bg-transparent text-[11px] font-mono tracking-wider focus:outline-none ${
              isLight
                ? 'text-slate-900 placeholder:text-slate-400'
                : 'text-white placeholder:text-slate-500'
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
          className="h-9 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[10.5px] tracking-wider shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>GO</span>
        </button>
      </form>

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
                  ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
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
