'use client';

import React from 'react';
import { FilterState, Severity } from '@/types/conflict';
import {
  Globe,
  Flame,
  TrendingUp,
  Clock,
  Users,
  BookOpen,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';

export type NavView = 'WORLD' | 'CONFLICTS' | 'ESCALATION' | 'TIMELINE' | 'ACTORS' | 'SOURCES';

interface LeftNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  filters: FilterState;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onOpenSources: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const REGIONS = [
  'ALL',
  'Europe',
  'Middle East',
  'Africa',
  'South Asia',
  'East Asia',
  'Southeast Asia',
  'Central Asia',
  'Americas',
];

const SEVERITIES: Array<'ALL' | Severity> = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

const EVENT_TYPES = [
  'ALL',
  'Battles',
  'Explosions/Remote violence',
  'Violence against civilians',
  'Riots',
  'Protests',
];

export const LeftNav: React.FC<LeftNavProps> = ({
  currentView,
  onSelectView,
  filters,
  onUpdateFilters,
  onOpenSources,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: NavView; num: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'WORLD', num: '[01]', label: 'WORLD', icon: Globe },
    { id: 'CONFLICTS', num: '[02]', label: 'CONFLICTS', icon: Flame },
    { id: 'ESCALATION', num: '[03]', label: 'ESCALATION', icon: TrendingUp },
    { id: 'TIMELINE', num: '[04]', label: 'TIMELINE', icon: Clock },
    { id: 'ACTORS', num: '[05]', label: 'ACTORS', icon: Users },
    { id: 'SOURCES', num: '[06]', label: 'SOURCES', icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`w-64 bg-panel border-r border-border h-full flex flex-col font-mono text-xs select-none transition-transform z-40 fixed md:static inset-y-0 left-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Nav Header */}
        <div className="p-3 border-b border-border flex items-center justify-between text-text-secondary">
          <span className="text-accent-cyan tracking-widest text-[11px] font-bold">
            // TERMINAL NAV
          </span>
          <span className="text-[10px] text-text-muted">SYS.01</span>
        </div>

        {/* Scrollable Nav Sections */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Main Navigation Views */}
          <div>
            <div className="text-[10px] text-text-muted tracking-wider px-2 py-1">
              // WORKSTATION VIEWS
            </div>
            <div className="space-y-0.5 mt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'SOURCES') {
                        onOpenSources();
                      } else {
                        onSelectView(item.id);
                      }
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 transition-all text-left border-l-2 ${
                      isActive
                        ? 'border-accent-cyan bg-panel-subtle text-accent-cyan font-bold shadow-[inset_1px_0_0_0_#00f0ff]'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-panel-hover'
                    }`}
                  >
                    <span className="text-text-muted text-[10px]">{item.num}</span>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="tracking-wider">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Window Filters */}
          <div className="pt-2 border-t border-border/60">
            <div className="text-[10px] text-text-muted tracking-wider px-2 py-1 flex items-center justify-between">
              <span>// RECENT WINDOW</span>
              <Clock className="w-3 h-3 text-text-muted" />
            </div>
            <div className="grid grid-cols-3 gap-1 px-1 mt-1">
              {([3, 7, 10] as const).map((days) => {
                const isActive = filters.days === days;
                return (
                  <button
                    key={days}
                    onClick={() => onUpdateFilters({ days })}
                    className={`py-1 text-[10px] text-center border font-bold transition-colors ${
                      isActive
                        ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan shadow-[0_0_6px_rgba(0,240,255,0.2)]'
                        : 'border-border text-text-secondary hover:text-text-primary hover:border-border-glow'
                    }`}
                  >
                    [{days}D]
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regional Theater Selection */}
          <div className="pt-2 border-t border-border/60">
            <div className="text-[10px] text-text-muted tracking-wider px-2 py-1 flex items-center justify-between">
              <span>// THEATERS / REGIONS</span>
              <Globe className="w-3 h-3 text-text-muted" />
            </div>
            <div className="space-y-0.5 mt-1">
              {REGIONS.map((region) => {
                const isSelected = (filters.region || 'ALL') === region;
                return (
                  <button
                    key={region}
                    onClick={() => onUpdateFilters({ region: region === 'ALL' ? '' : region })}
                    className={`w-full flex items-center justify-between px-2.5 py-1 text-left text-[11px] transition-colors ${
                      isSelected
                        ? 'bg-accent-cyan/15 text-accent-cyan font-bold border-r border-accent-cyan'
                        : 'text-text-secondary hover:text-text-primary hover:bg-panel-subtle'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-text-muted text-[10px]">{isSelected ? '>' : '·'}</span>
                      {region.toUpperCase()}
                    </span>
                    {isSelected && <ChevronRight className="w-3 h-3 text-accent-cyan" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity Filter */}
          <div className="pt-2 border-t border-border/60">
            <div className="text-[10px] text-text-muted tracking-wider px-2 py-1 flex items-center justify-between">
              <span>// SEVERITY THRESHOLD</span>
              <Filter className="w-3 h-3 text-text-muted" />
            </div>
            <div className="space-y-0.5 mt-1">
              {SEVERITIES.map((sev) => {
                const isSelected = (filters.severity || 'ALL') === sev;
                const dotColor =
                  sev === 'CRITICAL'
                    ? 'bg-severity-critical'
                    : sev === 'HIGH'
                    ? 'bg-severity-high'
                    : sev === 'MODERATE'
                    ? 'bg-severity-moderate'
                    : sev === 'LOW'
                    ? 'bg-severity-low'
                    : 'bg-text-secondary';
                return (
                  <button
                    key={sev}
                    onClick={() => onUpdateFilters({ severity: sev })}
                    className={`w-full flex items-center justify-between px-2.5 py-1 text-left text-[11px] transition-colors ${
                      isSelected
                        ? 'bg-panel-hover text-text-primary font-bold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-panel-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span>{sev}</span>
                    </div>
                    {isSelected && <span className="text-[10px] text-accent-cyan">[x]</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Category Filter */}
          <div className="pt-2 border-t border-border/60">
            <div className="text-[10px] text-text-muted tracking-wider px-2 py-1 flex items-center justify-between">
              <span>// EVENT TYPE</span>
              <Layers className="w-3 h-3 text-text-muted" />
            </div>
            <div className="space-y-0.5 mt-1 pb-4">
              {EVENT_TYPES.map((type) => {
                const isSelected = (filters.eventType || 'ALL') === type;
                return (
                  <button
                    key={type}
                    onClick={() => onUpdateFilters({ eventType: type === 'ALL' ? '' : type })}
                    className={`w-full flex items-center justify-between px-2 py-1 text-left text-[10px] truncate transition-colors ${
                      isSelected
                        ? 'bg-panel-hover text-accent-cyan font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-panel-subtle'
                    }`}
                    title={type}
                  >
                    <span className="truncate">{type.toUpperCase()}</span>
                    {isSelected && <span className="text-accent-cyan ml-1">●</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
