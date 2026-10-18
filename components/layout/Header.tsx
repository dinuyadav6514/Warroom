'use client';

import React, { useState, useEffect } from 'react';
import { DataFreshness, ApiExchange } from '@/types/conflict';
import { formatRelativeTime } from '@/lib/data/date-utils';
import { RefreshCw, ShieldAlert, Radio, HelpCircle, Menu, Globe, Clock, BarChart3, KeyRound, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  freshness: DataFreshness | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onOpenSources: () => void;
  onOpenSetup: () => void;
  onSelectDays: (days: 3 | 7 | 10) => void;
  apiExchange?: ApiExchange | null;
  onToggleMobilePanel?: () => void;
  onToggleMobileNav?: () => void;
  conflictsCount?: number;
  showStatsPanel?: boolean;
  onToggleStatsPanel?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  freshness,
  onRefresh,
  isRefreshing,
  autoRefresh,
  onToggleAutoRefresh,
  onOpenSources,
  onOpenSetup,
  onSelectDays,
  onToggleMobilePanel,
  onToggleMobileNav,
  conflictsCount,
  showStatsPanel,
  onToggleStatsPanel,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [utcClock, setUtcClock] = useState<string>('');
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(15);

  // Live UTC World Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcClock(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 15-Second high-frequency countdown timer for next background auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setNextRefreshSec((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Reset countdown upon active refresh execution
  useEffect(() => {
    if (isRefreshing) {
      setNextRefreshSec(15);
    }
  }, [isRefreshing]);

  return (
    <header className="h-12 glass-panel mx-3 mt-2.5 mb-1 rounded-2xl md:rounded-[22px] border border-white/[0.12] px-3 md:px-5 flex items-center justify-between z-30 font-mono select-none gap-2 shrink-0 shadow-[0_12px_36px_rgba(0,0,0,0.7)]">
      {/* LEFT SECTION: Logo -> Refresh -> Day Selector */}
      <div className="flex items-center gap-2 md:gap-3.5 min-w-0">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-1.5 glass-pill text-text-secondary hover:text-accent-cyan rounded-md transition-all"
            title="Open Workstation Views"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* 1. Logo with Modern Radial Glow */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_14px_rgba(0,240,255,0.25)]">
            <Radio className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
          </div>
          <span className="font-extrabold text-sm md:text-base text-white tracking-widest bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
            WARROOM
          </span>
          <span className="text-white/20 text-xs hidden sm:inline">|</span>
          <span className="text-[10px] text-slate-400 font-sans tracking-widest hidden xl:inline uppercase font-medium">
            Defense Intelligence Platform
          </span>
        </div>

        {/* 2. Quick Refresh Pill */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 py-1 glass-pill text-slate-300 hover:text-white text-[10.5px] rounded-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
          title="Refresh intelligence pipeline data immediately"
        >
          <RefreshCw className={`w-3 h-3 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="font-semibold hidden sm:inline">REFRESH</span>
          {freshness?.lastSyncAt ? (
            <span className="text-[9.5px] text-slate-400 border-l border-white/10 pl-1.5 font-sans">
              {formatRelativeTime(freshness.lastSyncAt)}
            </span>
          ) : (
            <span className="text-[9.5px] text-cyan-400 border-l border-white/10 pl-1.5 font-bold">
              LIVE
            </span>
          )}
        </button>

        {/* 3. Day Selector Pill Group */}
        <div className="flex items-center gap-1 glass-panel-subtle px-2 py-0.5 rounded-md border border-white/[0.06] shrink-0">
          <span className="text-slate-400 text-[10px] font-sans font-medium hidden sm:inline">HORIZON</span>
          <div className="flex items-center gap-0.5 text-[10px]">
            <button
              onClick={() => onSelectDays(3)}
              className={`px-2 py-0.5 transition-all cursor-pointer rounded ${
                freshness?.dataWindowDays === 3
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Show 3-Day operational window"
            >
              3D
            </button>
            <button
              onClick={() => onSelectDays(7)}
              className={`px-2 py-0.5 transition-all cursor-pointer rounded ${
                freshness?.dataWindowDays === 7 || !freshness
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Show 7-Day operational window"
            >
              7D
            </button>
            <button
              onClick={() => onSelectDays(10)}
              className={`px-2 py-0.5 transition-all cursor-pointer rounded ${
                freshness?.dataWindowDays === 10
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Show 10-Day operational window"
            >
              10D
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: current World time -> Refresh -> Next refresh timer */}
      <div className="flex items-center gap-2 md:gap-3 text-[11px] shrink-0">
        {/* 4. Current World Time */}
        <div className="flex items-center gap-1.5 glass-panel-subtle px-2.5 py-1 rounded-md border border-white/[0.06]">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 text-[10px] font-sans font-medium hidden md:inline">UTC CLOCK</span>
          <span className="text-white font-bold text-[10.5px] md:text-[11px] tracking-wide font-mono">
            {utcClock}
          </span>
        </div>

        {/* 5. Refresh (Primary Action Button) */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-[10.5px] md:text-[11px] font-bold tracking-wider transition-all cursor-pointer shadow-[0_0_14px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title="Force immediate live multi-pipeline sync (bypasses cache)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-300' : 'text-cyan-400'}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'SYNCING...' : 'LIVE REFRESH'}</span>
          <span className="sm:hidden">{isRefreshing ? 'SYNC...' : 'SYNC'}</span>
        </button>

        {/* 6. Next Refresh Timer (with countdown & auto-refresh toggle) */}
        <button
          onClick={onToggleAutoRefresh}
          title={`Click to ${autoRefresh ? 'pause' : 'resume'} 15-second auto-refresh`}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-mono transition-all cursor-pointer shrink-0 ${
            autoRefresh
              ? 'glass-pill border-emerald-500/40 text-emerald-300 hover:border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
              : 'glass-panel-subtle text-slate-400 hover:text-white'
          }`}
        >
          <Clock className={`w-3 h-3 ${autoRefresh ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden md:inline text-slate-400 text-[10px] font-sans">CYCLE</span>
          {isRefreshing ? (
            <span className="text-cyan-300 animate-pulse font-bold text-[10px]">SYNCING</span>
          ) : autoRefresh ? (
            <span className="font-bold text-emerald-400">
              {String(Math.floor(nextRefreshSec / 60)).padStart(2, '0')}:
              {String(nextRefreshSec % 60).padStart(2, '0')}
            </span>
          ) : (
            <span className="text-amber-400 font-bold text-[10px]">PAUSED</span>
          )}
          <span
            className={`text-[8.5px] px-1 py-0.2 rounded font-bold ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-slate-500'
            }`}
          >
            {autoRefresh ? '15S' : 'OFF'}
          </span>
        </button>

        {/* 7. Global Overview Stats Strip Toggle Button */}
        {onToggleStatsPanel && (
          <button
            onClick={onToggleStatsPanel}
            title={showStatsPanel ? 'Hide Global Overview Stats Strip' : 'Show Global Overview Stats Strip'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] transition-all cursor-pointer shrink-0 ${
              showStatsPanel
                ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'glass-pill text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold hidden sm:inline">STATS</span>
            <span
              className={`text-[8.5px] px-1 py-0.2 rounded font-bold ${
                showStatsPanel
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                  : 'bg-white/5 text-slate-500'
              }`}
            >
              {showStatsPanel ? 'ON' : 'OFF'}
            </span>
          </button>
        )}


        {/* Pipeline & API Keys Configuration Button */}
        <button
          onClick={onOpenSetup}
          className="flex items-center gap-1.5 px-2 py-1 border border-accent-cyan/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-accent-cyan rounded-[2px] text-[10.5px] font-mono transition-colors cursor-pointer shrink-0 shadow-[0_0_8px_rgba(0,240,255,0.15)]"
          title="Configure 12 Intelligence Pipelines & API Keys"
        >
          <KeyRound className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="font-bold hidden lg:inline">PIPELINES</span>
          <span className="text-[9px] px-1 bg-cyan-900/80 border border-cyan-600 rounded-[1px] font-bold">
            12
          </span>
        </button>

        {/* Sources Attribution Modal Trigger */}
        <button
          onClick={onOpenSources}
          className="p-1 text-text-secondary hover:text-accent-cyan transition-colors"
          title="Data sources, attribution, and methodology"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Dynamic Dark / Light Mode Visual Switcher */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1 rounded text-text-secondary hover:text-accent-cyan hover:bg-white/5 transition-colors cursor-pointer"
            title={`Toggle Theme [Current: ${theme.toUpperCase()}] · Type 'theme' in terminal`}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-800 hover:text-cyan-600 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300 hover:text-amber-200 transition-colors" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
