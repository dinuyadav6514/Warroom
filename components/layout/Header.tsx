'use client';

import React, { useState, useEffect } from 'react';
import { DataFreshness, ApiExchange } from '@/types/conflict';
import { formatRelativeTime } from '@/lib/data/date-utils';
import { RefreshCw, ShieldAlert, Radio, HelpCircle, KeyRound, AlertTriangle, Menu } from 'lucide-react';

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
  apiExchange,
  onToggleMobilePanel,
  onToggleMobileNav,
  conflictsCount,
}) => {
  const [utcClock, setUtcClock] = useState<string>('');

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

  const getStatusBadge = () => {
    return (
      <div className="flex items-center gap-2">
        {/* 100% Free Live News Pipeline Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-[11px] font-mono bg-emerald-950/70 text-accent-green border border-emerald-600/80">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-accent-green animate-ping" />
          <span className="font-bold hidden md:inline">● NEWS PIPELINE LIVE (GDELT / RELIEFWEB)</span>
          <span className="font-bold md:hidden">● NEWS LIVE</span>
        </div>

        {/* Optional Gemini AI Key for Analyst Terminal */}
        <button
          onClick={onOpenSetup}
          className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono bg-panel-subtle hover:bg-panel-hover text-text-secondary hover:text-amber-300 border border-border transition-colors cursor-pointer"
          title="Configure optional Gemini API key for AI Analyst & SitRep terminal"
        >
          <KeyRound className="w-3 h-3 text-amber-400" />
          <span>AI TERMINAL [KEY]</span>
        </button>
      </div>
    );
  };

  return (
    <header className="h-12 bg-panel border-b border-border px-2 md:px-4 flex items-center justify-between z-30 font-mono select-none">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-2 md:gap-3">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-1.5 hover:bg-panel-hover text-text-secondary hover:text-accent-cyan border border-border/70 rounded transition-colors"
            title="Open Workstation Views"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 md:gap-2">
          <Radio className="w-4 h-4 text-accent-cyan animate-pulse" />
          <span className="font-bold text-sm md:text-base text-text-primary tracking-wider">
            WARROOM
          </span>
          <span className="text-border-glow text-xs hidden sm:inline">//</span>
          <span className="text-xs text-text-secondary tracking-widest hidden lg:inline">
            GLOBAL CONFLICT INTELLIGENCE
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Operational Indicators */}
      <div className="flex items-center gap-2 md:gap-4 text-[11px]">
        {/* Dynamic UTC Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-text-secondary border-r border-border pr-3">
          <span className="text-muted-foreground">TIME ::</span>
          <span className="text-text-primary">{utcClock}</span>
        </div>

        {/* Data Window Indicator */}
        <div className="flex items-center gap-1 bg-panel-subtle px-2 py-0.5 border border-border">
          <span className="text-text-secondary hidden sm:inline">WINDOW ::</span>
          <div className="flex items-center gap-0.5 text-[10px]">
            <button
              onClick={() => onSelectDays(3)}
              className={`px-1.5 py-0.5 transition-colors ${
                freshness?.dataWindowDays === 3
                  ? 'bg-accent-cyan text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => onSelectDays(7)}
              className={`px-1.5 py-0.5 transition-colors ${
                freshness?.dataWindowDays === 7 || !freshness
                  ? 'bg-accent-cyan text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => onSelectDays(10)}
              className={`px-1.5 py-0.5 transition-colors ${
                freshness?.dataWindowDays === 10
                  ? 'bg-accent-cyan text-black font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              10D
            </button>
          </div>
        </div>

        {/* Sync Freshness */}
        <div className="hidden xl:flex items-center gap-1.5 text-text-secondary">
          <span>SYNC ::</span>
          <span className="text-text-primary">
            {freshness?.lastSyncAt ? formatRelativeTime(freshness.lastSyncAt) : 'N/A'}
          </span>
        </div>

        {/* Data Source */}
        <div className="hidden sm:flex items-center gap-1 text-text-secondary">
          <span>DATA ::</span>
          <span className="text-accent-cyan font-semibold">
            GDELT 2.0 + UN RELIEFWEB (LIVE)
          </span>
        </div>

        {/* Auto Refresh Toggle */}
        <button
          onClick={onToggleAutoRefresh}
          title="Toggle 4-hour background auto-refresh (or refresh manually anytime)"
          className={`hidden md:flex items-center gap-1 px-2 py-0.5 border transition-colors ${
            autoRefresh
              ? 'border-emerald-700/60 text-accent-green bg-emerald-950/30'
              : 'border-border text-text-secondary hover:text-text-primary bg-panel-subtle'
          }`}
        >
          <span>AUTO ::</span>
          <span>{autoRefresh ? '4H ON' : 'OFF'}</span>
        </button>

        {/* Mobile Intel Drawer Trigger */}
        {onToggleMobilePanel && (
          <button
            onClick={onToggleMobilePanel}
            className="lg:hidden flex items-center gap-1 px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-accent-cyan/60 text-accent-cyan text-[11px] font-bold transition-colors cursor-pointer"
            title="Open Conflict Intelligence & Telemetry Workstation"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-accent-cyan" />
            <span>INTEL</span>
            {conflictsCount !== undefined && (
              <span className="text-[9px] px-1 bg-cyan-900/80 border border-accent-cyan/40">
                {conflictsCount}
              </span>
            )}
          </button>
        )}

        {/* Force Live API Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/50 hover:bg-cyan-900/70 active:bg-accent-cyan/30 border border-accent-cyan/60 hover:border-accent-cyan text-accent-cyan text-[11px] font-bold tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh 100+ live global conflict spots immediately (bypasses cache)"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-accent-cyan' : 'text-accent-cyan'}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'FETCHING API...' : 'REFRESH LIVE DATA'}</span>
          <span className="sm:hidden">{isRefreshing ? 'SYNC...' : 'REFRESH'}</span>
        </button>

        {/* Sources / Info Modal Button */}
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
