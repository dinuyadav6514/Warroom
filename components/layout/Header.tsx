'use client';

import React, { useState, useEffect } from 'react';
import { DataFreshness, ApiExchange } from '@/types/conflict';
import { formatRelativeTime } from '@/lib/data/date-utils';
import { RefreshCw, ShieldAlert, Radio, HelpCircle, Menu, Globe, Clock, BarChart3, KeyRound } from 'lucide-react';

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
}) => {
  const [utcClock, setUtcClock] = useState<string>('');
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(60);

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

  // 1-Minute countdown timer for next background auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setNextRefreshSec((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Reset countdown upon active refresh execution
  useEffect(() => {
    if (isRefreshing) {
      setNextRefreshSec(60);
    }
  }, [isRefreshing]);

  return (
    <header className="h-12 bg-panel border-b border-border px-2 md:px-4 flex items-center justify-between z-30 font-mono select-none gap-2">
      {/* LEFT SECTION: Logo -> Refresh -> Day Selector */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-1.5 hover:bg-panel-hover text-text-secondary hover:text-accent-cyan border border-border/70 rounded transition-colors"
            title="Open Workstation Views"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* 1. Logo */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Radio className="w-4 h-4 text-accent-cyan animate-pulse" />
          <span className="font-bold text-sm md:text-base text-text-primary tracking-wider">
            WARROOM
          </span>
          <span className="text-border-glow text-xs hidden sm:inline">//</span>
          <span className="text-xs text-text-secondary tracking-widest hidden xl:inline">
            GLOBAL CONFLICT INTELLIGENCE
          </span>
        </div>

        {/* 2. Refresh (Quick Refresh & Last Sync Indicator) */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2 py-1 bg-panel-subtle hover:bg-panel-hover border border-border text-text-secondary hover:text-text-primary text-[10.5px] rounded-[2px] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          title="Refresh intelligence pipeline data immediately"
        >
          <RefreshCw className={`w-3 h-3 text-accent-cyan ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="font-semibold text-text-primary hidden sm:inline">REFRESH</span>
          {freshness?.lastSyncAt ? (
            <span className="text-[9.5px] text-text-muted border-l border-border/70 pl-1.5">
              {formatRelativeTime(freshness.lastSyncAt)}
            </span>
          ) : (
            <span className="text-[9.5px] text-accent-cyan border-l border-border/70 pl-1.5">
              LIVE
            </span>
          )}
        </button>

        {/* 3. Day Selector */}
        <div className="flex items-center gap-1 bg-panel-subtle px-2 py-0.5 border border-border shrink-0">
          <span className="text-text-secondary text-[10px] hidden sm:inline">WINDOW ::</span>
          <div className="flex items-center gap-0.5 text-[10px]">
            <button
              onClick={() => onSelectDays(3)}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer rounded-[1px] ${
                freshness?.dataWindowDays === 3
                  ? 'bg-accent-cyan text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-panel-hover'
              }`}
              title="Show 3-Day operational window"
            >
              3D
            </button>
            <button
              onClick={() => onSelectDays(7)}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer rounded-[1px] ${
                freshness?.dataWindowDays === 7 || !freshness
                  ? 'bg-accent-cyan text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-panel-hover'
              }`}
              title="Show 7-Day operational window"
            >
              7D
            </button>
            <button
              onClick={() => onSelectDays(10)}
              className={`px-1.5 py-0.5 transition-colors cursor-pointer rounded-[1px] ${
                freshness?.dataWindowDays === 10
                  ? 'bg-accent-cyan text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-panel-hover'
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
        <div className="flex items-center gap-1.5 text-text-secondary bg-panel-subtle/80 px-2 py-1 border border-border/80 rounded-[2px]">
          <Globe className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-muted-foreground text-[10px] hidden md:inline">WORLD TIME ::</span>
          <span className="text-text-primary font-bold text-[10.5px] md:text-[11px] tracking-wide">
            {utcClock}
          </span>
        </div>

        {/* 5. Refresh (Primary Action Button) */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 active:bg-accent-cyan/30 border border-accent-cyan/70 hover:border-accent-cyan text-accent-cyan text-[10.5px] md:text-[11px] font-bold tracking-wider rounded-[2px] transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.18)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title="Force immediate live multi-pipeline sync (bypasses cache)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent-cyan' : 'text-accent-cyan'}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'SYNCING...' : 'REFRESH LIVE DATA'}</span>
          <span className="sm:hidden">{isRefreshing ? 'SYNC...' : 'REFRESH'}</span>
        </button>

        {/* 6. Next Refresh Timer (with countdown & auto-refresh toggle) */}
        <button
          onClick={onToggleAutoRefresh}
          title={`Click to ${autoRefresh ? 'pause' : 'resume'} 1-minute auto-refresh`}
          className={`flex items-center gap-1.5 px-2 py-1 border rounded-[2px] text-[10.5px] font-mono transition-colors cursor-pointer shrink-0 ${
            autoRefresh
              ? 'border-emerald-700/70 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40'
              : 'border-border bg-panel-subtle text-text-muted hover:text-text-primary'
          }`}
        >
          <Clock className={`w-3 h-3 ${autoRefresh ? 'text-accent-green' : 'text-text-muted'}`} />
          <span className="hidden md:inline text-text-secondary text-[10px]">NEXT REFRESH ::</span>
          {isRefreshing ? (
            <span className="text-accent-cyan animate-pulse font-bold text-[10px]">SYNCING</span>
          ) : autoRefresh ? (
            <span className="font-bold text-accent-green">
              {String(Math.floor(nextRefreshSec / 60)).padStart(2, '0')}:
              {String(nextRefreshSec % 60).padStart(2, '0')}
            </span>
          ) : (
            <span className="text-amber-400 font-bold text-[10px]">PAUSED</span>
          )}
          <span
            className={`text-[9px] px-1 py-0.2 rounded-[2px] border ${
              autoRefresh
                ? 'bg-emerald-900/80 border-emerald-600 text-emerald-300'
                : 'bg-black/50 border-border text-text-muted'
            }`}
          >
            {autoRefresh ? '1M ON' : 'OFF'}
          </span>
        </button>

        {/* 7. Global Overview Stats Strip Toggle Button */}
        {onToggleStatsPanel && (
          <button
            onClick={onToggleStatsPanel}
            title={showStatsPanel ? 'Hide Global Overview Stats Strip' : 'Show Global Overview Stats Strip'}
            className={`flex items-center gap-1.5 px-2 py-1 border rounded-[2px] text-[10.5px] font-mono transition-colors cursor-pointer shrink-0 ${
              showStatsPanel
                ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                : 'border-border bg-panel-subtle text-text-secondary hover:text-text-primary hover:bg-panel-hover'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="font-semibold hidden sm:inline">STATS</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded-[2px] border ${
                showStatsPanel
                  ? 'bg-cyan-950 border-cyan-700 text-accent-cyan'
                  : 'bg-black/50 border-border text-text-muted'
              }`}
            >
              {showStatsPanel ? 'ON' : 'OFF'}
            </span>
          </button>
        )}

        {/* Mobile Intel Drawer Trigger */}
        {onToggleMobilePanel && (
          <button
            onClick={onToggleMobilePanel}
            className="lg:hidden flex items-center gap-1 px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-accent-cyan/60 text-accent-cyan text-[11px] font-bold transition-colors cursor-pointer"
            title="Open Conflict Intelligence & Telemetry Workstation"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="hidden sm:inline">INTEL</span>
            {conflictsCount !== undefined && (
              <span className="text-[9px] px-1 bg-cyan-900/80 border border-accent-cyan/40">
                {conflictsCount}
              </span>
            )}
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
      </div>
    </header>
  );
};
