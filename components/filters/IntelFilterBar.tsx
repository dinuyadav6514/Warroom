'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IntelMode, Severity } from '@/types/conflict';
import {
  Flame,
  Shield,
  Landmark,
  TrendingUp,
  Layers,
  ChevronDown,
  Check,
  Radio,
  Filter,
  Globe,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const REGIONS = [
  'ALL',
  'Americas',
  'Europe',
  'Middle East',
  'Africa',
  'South Asia',
  'East Asia',
  'Southeast Asia',
  'Central Asia',
  'Oceania & Pacific',
  'Maritime & Global',
];

export const SEVERITIES: Array<'ALL' | Severity> = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

export const EVENT_TYPES = [
  'ALL',
  'Battles',
  'Explosions/Remote violence',
  'Air/Drone Strike',
  'Violence against civilians',
  'Defense & Security',
  'Geopolitics & Policy',
  'Economy & Trade',
  'Diplomatic',
  'Riots',
  'Protests',
];

interface IntelFilterBarProps {
  intelMode: IntelMode;
  onSelectIntelMode: (mode: IntelMode) => void;
  storyMerging: boolean;
  onToggleStoryMerging: () => void;
  selectedSources: string[];
  onToggleSource: (source: string) => void;
  onSelectAllSources: () => void;
  selectedRegion?: string;
  onSelectRegion?: (region: string) => void;
  selectedSeverity?: 'ALL' | Severity;
  onSelectSeverity?: (severity: 'ALL' | Severity) => void;
  selectedEventType?: string;
  onSelectEventType?: (eventType: string) => void;
  categoryCounts: {
    ALL: number;
    WAR_COMBAT: number;
    DEFENSE_STRATEGY: number;
    GEOPOLITICS: number;
    ECONOMY: number;
  };
  storyMergeStats?: {
    original: number;
    unique: number;
    merged: number;
  };
  availableSources: string[];
}

export const IntelFilterBar: React.FC<IntelFilterBarProps> = ({
  intelMode,
  onSelectIntelMode,
  storyMerging,
  onToggleStoryMerging,
  selectedSources,
  onToggleSource,
  onSelectAllSources,
  selectedRegion = 'ALL',
  onSelectRegion,
  selectedSeverity = 'ALL',
  onSelectSeverity,
  selectedEventType = 'ALL',
  onSelectEventType,
  categoryCounts,
  storyMergeStats,
  availableSources,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'REGION' | 'SEVERITY' | 'EVENT_TYPE' | 'PIPELINES' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (key: 'REGION' | 'SEVERITY' | 'EVENT_TYPE' | 'PIPELINES') => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  const modes: Array<{
    id: IntelMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    activeClass: string;
    badgeClass: string;
  }> = [
    {
      id: 'ALL',
      label: 'ALL INTEL',
      icon: Radio,
      count: categoryCounts.ALL,
      activeClass: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan shadow-[0_0_8px_rgba(0,240,255,0.25)]',
      badgeClass: 'bg-cyan-950/80 text-accent-cyan border-cyan-800/60',
    },
    {
      id: 'WAR_COMBAT',
      label: 'WARFARE & COMBAT',
      icon: Flame,
      count: categoryCounts.WAR_COMBAT,
      activeClass: 'bg-red-950/40 text-severity-critical border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.3)]',
      badgeClass: 'bg-red-950/80 text-severity-critical border-red-800/60',
    },
    {
      id: 'DEFENSE_STRATEGY',
      label: 'DEFENSE & STRATEGY',
      icon: Shield,
      count: categoryCounts.DEFENSE_STRATEGY,
      activeClass: 'bg-amber-950/40 text-amber-400 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
      badgeClass: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    },
    {
      id: 'GEOPOLITICS',
      label: 'GEOPOLITICS & POLICY',
      icon: Landmark,
      count: categoryCounts.GEOPOLITICS,
      activeClass: 'bg-blue-950/40 text-blue-400 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.25)]',
      badgeClass: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    },
    {
      id: 'ECONOMY',
      label: 'ECONOMY & GLOBAL',
      icon: TrendingUp,
      count: categoryCounts.ECONOMY,
      activeClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]',
      badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    },
  ];

  const areAllSourcesSelected =
    (selectedSources.length === 0 || selectedSources.length === availableSources.length) &&
    !selectedSources.includes('__NONE__');
  const activeSelectedCount = areAllSourcesSelected
    ? availableSources.length
    : selectedSources.filter((s) => s !== '__NONE__').length;

  return (
    <div
      className="relative z-50 bg-[#090d12] border-b border-border px-2 py-0.5 font-mono text-xs select-none flex items-center gap-1.5 overflow-visible"
      ref={containerRef}
    >
      {/* Intel Mode buttons (Scrollable independently if screen is narrow) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = intelMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectIntelMode(m.id)}
              className={`flex items-center gap-1 px-2 py-0.5 border rounded-[2px] transition-all text-[10px] font-medium tracking-wide whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? m.activeClass
                  : 'bg-panel-subtle/70 border-border/80 text-text-secondary hover:text-text-primary hover:bg-panel-hover'
              }`}
              title={`Filter by ${m.label}`}
            >
              <Icon className="w-2.5 h-2.5 shrink-0" />
              <span>{m.label}</span>
              <span className={`text-[9px] px-1 border rounded-[2px] font-bold ${m.badgeClass}`}>
                {m.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-border/60 mx-0.5 shrink-0" />

      {/* Right Controls: Story Merging, Region, Severity, Event Type, Pipelines */}
      <div className="flex items-center gap-1 ml-auto shrink-0 relative overflow-visible z-50">
        {/* Story Merging Deduplication Toggle */}
        <button
          type="button"
          onClick={onToggleStoryMerging}
          className={`flex items-center gap-1 px-2 py-0.5 border rounded-[2px] text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
            storyMerging
              ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan shadow-[0_0_6px_rgba(0,240,255,0.2)]'
              : 'bg-panel-subtle text-text-muted border-border hover:text-text-primary'
          }`}
          title={
            storyMerging
              ? 'Smart Story Merging Active: duplicate news across pipelines is consolidated into a single story with source links'
              : 'Raw Mode: every individual news dispatch is plotted separately'
          }
        >
          <Layers className="w-3 h-3" />
          <span>STORY MERGING:</span>
          <span className={storyMerging ? 'text-accent-cyan' : 'text-text-muted'}>
            {storyMerging ? '[ON]' : '[OFF]'}
          </span>
          {storyMergeStats && storyMerging && storyMergeStats.merged > 0 && (
            <span className="text-[9px] px-1 bg-cyan-950/80 border border-cyan-800 text-accent-cyan rounded-[2px]">
              -{storyMergeStats.merged} DUPES
            </span>
          )}
        </button>

        {/* 1. REGION / THEATER DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('REGION')}
            className={`flex items-center gap-1 px-2 py-0.5 border rounded-[2px] text-[10px] font-medium tracking-wide transition-all cursor-pointer ${
              selectedRegion && selectedRegion !== 'ALL'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan shadow-[0_0_6px_rgba(0,240,255,0.2)]'
                : 'bg-panel-subtle text-text-secondary hover:text-text-primary border-border hover:bg-panel-hover'
            }`}
            title="Filter by Regional Theater"
          >
            <Globe className="w-3 h-3 text-accent-cyan" />
            <span>REGION:</span>
            <span className={selectedRegion && selectedRegion !== 'ALL' ? 'text-accent-cyan font-bold' : 'text-text-primary'}>
              {(selectedRegion || 'ALL').toUpperCase()}
            </span>
            <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${openDropdown === 'REGION' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'REGION' && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#090d12]/95 backdrop-blur-md border border-border shadow-[0_10px_35px_rgba(0,0,0,0.95)] z-[100] p-1.5 text-xs font-mono space-y-0.5 rounded-[2px]">
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/60 text-[10px] text-text-muted px-1.5">
                <span>// THEATER / REGION</span>
                {selectedRegion && selectedRegion !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRegion?.('ALL');
                      setOpenDropdown(null);
                    }}
                    className="text-accent-cyan hover:underline text-[9px] cursor-pointer"
                  >
                    RESET
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {REGIONS.map((region) => {
                  const isSelected = (selectedRegion || 'ALL') === region;
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => {
                        onSelectRegion?.(region);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 text-left text-[11px] rounded-[2px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-accent-cyan/15 text-accent-cyan font-bold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-panel-subtle'
                      }`}
                    >
                      <span>{region.toUpperCase()}</span>
                      {isSelected && <Check className="w-3 h-3 text-accent-cyan" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. SEVERITY THRESHOLD DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('SEVERITY')}
            className={`flex items-center gap-1 px-2 py-0.5 border rounded-[2px] text-[10px] font-medium tracking-wide transition-all cursor-pointer ${
              selectedSeverity && selectedSeverity !== 'ALL'
                ? 'bg-amber-950/30 text-amber-400 border-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.2)]'
                : 'bg-panel-subtle text-text-secondary hover:text-text-primary border-border hover:bg-panel-hover'
            }`}
            title="Filter by Minimum Severity Threshold"
          >
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>SEVERITY:</span>
            <span className={selectedSeverity && selectedSeverity !== 'ALL' ? 'text-amber-400 font-bold' : 'text-text-primary'}>
              {selectedSeverity || 'ALL'}
            </span>
            <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${openDropdown === 'SEVERITY' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'SEVERITY' && (
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#090d12]/95 backdrop-blur-md border border-border shadow-[0_10px_35px_rgba(0,0,0,0.95)] z-[100] p-1.5 text-xs font-mono space-y-0.5 rounded-[2px]">
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/60 text-[10px] text-text-muted px-1.5">
                <span>// SEVERITY THRESHOLD</span>
                {selectedSeverity && selectedSeverity !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSeverity?.('ALL');
                      setOpenDropdown(null);
                    }}
                    className="text-amber-400 hover:underline text-[9px] cursor-pointer"
                  >
                    RESET
                  </button>
                )}
              </div>
              <div className="space-y-0.5">
                {SEVERITIES.map((sev) => {
                  const isSelected = (selectedSeverity || 'ALL') === sev;
                  const dotColor =
                    sev === 'CRITICAL'
                      ? 'bg-severity-critical shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                      : sev === 'HIGH'
                      ? 'bg-severity-high shadow-[0_0_6px_rgba(249,115,22,0.6)]'
                      : sev === 'MODERATE'
                      ? 'bg-severity-moderate shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                      : sev === 'LOW'
                      ? 'bg-severity-low shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                      : 'bg-text-secondary';
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => {
                        onSelectSeverity?.(sev);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 text-left text-[11px] rounded-[2px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-panel-hover text-text-primary font-bold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-panel-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span>{sev}</span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-accent-cyan" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. EVENT TYPE DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('EVENT_TYPE')}
            className={`flex items-center gap-1 px-2 py-0.5 border rounded-[2px] text-[10px] font-medium tracking-wide transition-all cursor-pointer ${
              selectedEventType && selectedEventType !== 'ALL'
                ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan shadow-[0_0_6px_rgba(0,240,255,0.2)]'
                : 'bg-panel-subtle text-text-secondary hover:text-text-primary border-border hover:bg-panel-hover'
            }`}
            title="Filter by Event Category"
          >
            <Zap className="w-3 h-3 text-accent-cyan" />
            <span>EVENT:</span>
            <span className={`max-w-[90px] truncate ${selectedEventType && selectedEventType !== 'ALL' ? 'text-accent-cyan font-bold' : 'text-text-primary'}`}>
              {(selectedEventType || 'ALL').toUpperCase()}
            </span>
            <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${openDropdown === 'EVENT_TYPE' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'EVENT_TYPE' && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#090d12]/95 backdrop-blur-md border border-border shadow-[0_10px_35px_rgba(0,0,0,0.95)] z-[100] p-1.5 text-xs font-mono space-y-0.5 rounded-[2px]">
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/60 text-[10px] text-text-muted px-1.5">
                <span>// EVENT TYPE</span>
                {selectedEventType && selectedEventType !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectEventType?.('ALL');
                      setOpenDropdown(null);
                    }}
                    className="text-accent-cyan hover:underline text-[9px] cursor-pointer"
                  >
                    RESET
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {EVENT_TYPES.map((type) => {
                  const isSelected = (selectedEventType || 'ALL') === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        onSelectEventType?.(type);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 text-left text-[11px] rounded-[2px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-panel-hover text-accent-cyan font-bold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-panel-subtle'
                      }`}
                    >
                      <span className="truncate">{type.toUpperCase()}</span>
                      {isSelected && <Check className="w-3 h-3 text-accent-cyan" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. PIPELINE SOURCES DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('PIPELINES')}
            className={`flex items-center gap-1 px-2 py-0.5 border rounded-[2px] text-[10px] font-medium tracking-wide transition-all cursor-pointer ${
              !areAllSourcesSelected
                ? 'bg-amber-950/30 text-amber-400 border-amber-500/80 shadow-[0_0_6px_rgba(245,158,11,0.2)]'
                : 'bg-panel-subtle text-text-secondary hover:text-text-primary border-border hover:bg-panel-hover'
            }`}
            title="Filter Ingestion Pipelines"
          >
            <Filter className="w-3 h-3 text-accent-cyan" />
            <span>PIPELINES</span>
            <span className="text-[9px] px-1 py-0.2 bg-black/60 border border-border text-text-primary rounded-[2px] font-bold">
              {activeSelectedCount}/{availableSources.length}
            </span>
            <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${openDropdown === 'PIPELINES' ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {openDropdown === 'PIPELINES' && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#090d12]/95 backdrop-blur-md border border-border shadow-[0_10px_35px_rgba(0,0,0,0.95)] z-[100] p-2 text-xs font-mono space-y-1 rounded-[2px]">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/60 text-[10px] text-text-muted">
                <span>// SELECT PIPELINES</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectAllSources();
                  }}
                  className="text-accent-cyan hover:underline cursor-pointer"
                >
                  {areAllSourcesSelected ? 'DESELECT ALL' : 'SELECT ALL'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-border/30">
                {availableSources.map((sourceName) => {
                  const isChecked =
                    areAllSourcesSelected || selectedSources.includes(sourceName);
                  return (
                    <button
                      key={sourceName}
                      type="button"
                      onClick={() => onToggleSource(sourceName)}
                      className="w-full flex items-center justify-between pt-1 px-1.5 py-1 text-left text-[11px] hover:bg-panel-subtle rounded transition-colors cursor-pointer group"
                    >
                      <span className="truncate group-hover:text-accent-cyan text-text-primary">
                        {sourceName}
                      </span>
                      <div
                        className={`w-3.5 h-3.5 border flex items-center justify-center rounded-[2px] transition-colors ${
                          isChecked
                            ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                            : 'border-border bg-black/40'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
