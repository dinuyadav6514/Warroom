'use client';

import React from 'react';
import { Globe, BookOpen, BarChart3, Radio } from 'lucide-react';

export type MobileTab = 'HOME' | 'READ' | 'ANALYSIS';

interface MobileBottomBarProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  eventsCount?: number;
  threatIndex?: number;
  theme?: 'dark' | 'light';
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTab,
  onChangeTab,
  eventsCount = 0,
  threatIndex = 0,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`w-full h-14 shrink-0 px-3 flex items-center justify-around z-30 font-mono select-none transition-colors ${
        isLight
          ? 'bg-slate-100/95 border-t border-slate-300 text-slate-800 backdrop-blur-lg shadow-[0_-4px_16px_rgba(0,0,0,0.06)]'
          : 'bg-black/95 border-t border-white/12 text-white backdrop-blur-lg shadow-[0_-8px_24px_rgba(0,0,0,0.8)]'
      }`}
    >
      {/* 1. HOME BUTTON */}
      <button
        type="button"
        onClick={() => onChangeTab('HOME')}
        className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'HOME'
            ? isLight
              ? 'text-cyan-800 font-extrabold bg-cyan-100/70 shadow-xs'
              : 'text-cyan-400 font-extrabold bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            : isLight
            ? 'text-slate-600 hover:text-slate-900'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Globe className={`w-4 h-4 ${activeTab === 'HOME' ? 'animate-spin-slow' : ''}`} />
          {activeTab === 'HOME' && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          )}
        </div>
        <span className="text-[10px] tracking-wider mt-0.5">HOME</span>
      </button>

      {/* 2. READ BUTTON */}
      <button
        type="button"
        onClick={() => onChangeTab('READ')}
        className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'READ'
            ? isLight
              ? 'text-cyan-800 font-extrabold bg-cyan-100/70 shadow-xs'
              : 'text-cyan-400 font-extrabold bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            : isLight
            ? 'text-slate-600 hover:text-slate-900'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="relative flex items-center">
          <BookOpen className="w-4 h-4" />
          {eventsCount > 0 && (
            <span
              className={`ml-1 text-[8px] font-bold px-1 rounded-full ${
                activeTab === 'READ'
                  ? isLight
                    ? 'bg-cyan-700 text-white'
                    : 'bg-cyan-400 text-black'
                  : isLight
                  ? 'bg-slate-300 text-slate-700'
                  : 'bg-white/10 text-slate-300'
              }`}
            >
              {eventsCount > 99 ? '99+' : eventsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-wider mt-0.5">READ</span>
      </button>

      {/* 3. ANALYSIS BUTTON */}
      <button
        type="button"
        onClick={() => onChangeTab('ANALYSIS')}
        className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'ANALYSIS'
            ? isLight
              ? 'text-cyan-800 font-extrabold bg-cyan-100/70 shadow-xs'
              : 'text-cyan-400 font-extrabold bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            : isLight
            ? 'text-slate-600 hover:text-slate-900'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className="relative flex items-center">
          <BarChart3 className="w-4 h-4" />
          <span
            className={`ml-1 text-[8px] font-bold px-1 rounded-full ${
              threatIndex >= 70
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {threatIndex}
          </span>
        </div>
        <span className="text-[10px] tracking-wider mt-0.5">ANALYSIS</span>
      </button>
    </nav>
  );
};
