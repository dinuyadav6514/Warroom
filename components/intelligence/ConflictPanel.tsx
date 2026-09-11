'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Conflict, ConflictEvent, ApiExchange } from '@/types/conflict';
import { formatRelativeTime, formatShortDate } from '@/lib/data/date-utils';
import {
  ShieldAlert,
  Flame,
  TrendingUp,
  Skull,
  Maximize2,
  Cpu,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Radio,
  Clock,
  MapPin,
  Layers,
  Activity,
  Globe,
  ExternalLink,
} from 'lucide-react';

export interface ConflictPanelProps {
  conflict: Conflict | null;
  allConflicts: Conflict[];
  allEvents?: ConflictEvent[];
  onSelectConflict: (conflict: Conflict | null) => void;
  onOpenConflictModal: (conflict?: Conflict) => void;
  onSelectEvent: (event: ConflictEvent) => void;
  windowDays: number;
  apiExchange?: ApiExchange | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
  onSelectView?: (view: any) => void;
  onUpdateFilters?: (updates: any) => void;
}

type WorkstationTab = 'DOSSIER' | 'DEVELOPMENTS';

export const ConflictPanel: React.FC<ConflictPanelProps> = ({
  conflict,
  allConflicts,
  allEvents = [],
  onSelectConflict,
  onOpenConflictModal,
  onSelectEvent,
  windowDays,
  apiExchange,
  isRefreshing = false,
  onRefresh,
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
  isMobileDrawer = false,
  onSelectView,
  onUpdateFilters,
}) => {
  const [activeTab, setActiveTab] = useState<WorkstationTab>('DOSSIER');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  // Active conflict resolution: null means WORLD AREA mode
  const activeConflict = conflict;

  // Reset search when active conflict changes
  useEffect(() => {
    setEventSearch('');
  }, [activeConflict?.id]);

  // Handle outside click to close theater selector
  const selectorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setIsSelectorOpen(false);
      }
    };
    if (isSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelectorOpen]);

  // Sorted & filtered conflicts for the quick selector
  const filteredConflicts = useMemo(() => {
    const sorted = [...allConflicts].sort((a, b) => b.escalationIndex - a.escalationIndex);
    if (!selectorSearch.trim()) return sorted;
    const q = selectorSearch.toLowerCase();
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        (c.region && c.region.toLowerCase().includes(q))
    );
  }, [allConflicts, selectorSearch]);

  // Filtered recent events for the events tab
  const filteredEvents = useMemo(() => {
    const rawEvents = activeConflict ? activeConflict.recentEvents : allEvents;
    if (!eventSearch.trim()) return rawEvents;
    const q = eventSearch.toLowerCase();
    return rawEvents.filter(
      (e) =>
        e.eventType.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        (e.country && e.country.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
    );
  }, [activeConflict, allEvents, eventSearch]);

  // Global Aggregated Stats for World Area mode
  const globalStats = useMemo(() => {
    const totalFatalities = allConflicts.reduce((sum, c) => sum + (c.fatalities7d || 0), 0);
    const totalEvents = allEvents.length > 0
      ? allEvents.length
      : allConflicts.reduce((sum, c) => sum + (c.eventCount7d || 0), 0);
    const escalatingTheaters = allConflicts.filter((c) => c.status === 'ESCALATING' || c.escalationTrend === 'UP');
    const criticalTheaters = allConflicts.filter((c) => c.escalationIndex >= 70);
    const avgEscalation = allConflicts.length > 0
      ? Math.round(allConflicts.reduce((sum, c) => sum + c.escalationIndex, 0) / allConflicts.length)
      : 50;
    const avgIntensity = allConflicts.length > 0
      ? Math.round(allConflicts.reduce((sum, c) => sum + c.intensity, 0) / allConflicts.length)
      : 50;

    // Top 6 flashpoints
    const topFlashpoints = [...allConflicts]
      .sort((a, b) => b.escalationIndex - a.escalationIndex)
      .slice(0, 6);

    // Regional breakdown
    const regionCounts: Record<string, number> = {};
    allConflicts.forEach((c) => {
      const r = c.region || 'Other';
      regionCounts[r] = (regionCounts[r] || 0) + 1;
    });

    return {
      totalFatalities,
      totalEvents,
      escalatingCount: escalatingTheaters.length,
      criticalCount: criticalTheaters.length,
      avgEscalation,
      avgIntensity,
      topFlashpoints,
      regionCounts,
    };
  }, [allConflicts, allEvents]);

  // Threat Level calculation
  const threatLevel = useMemo(() => {
    if (!activeConflict) {
      return {
        label: 'GLOBAL WATCH',
        defcon: 'DEFCON 2',
        color: 'text-amber-400 bg-amber-950/80 border-amber-600/80',
        badge: 'bg-amber-500 animate-pulse',
      };
    }
    const idx = activeConflict.escalationIndex;
    const intensity = activeConflict.intensity;
    if (idx >= 75 || intensity >= 80) {
      return { label: 'CRITICAL', defcon: 'DEFCON 1', color: 'text-red-400 bg-red-950/80 border-red-600/80', badge: 'bg-red-500 animate-ping' };
    }
    if (idx >= 55 || intensity >= 60) {
      return { label: 'HIGH', defcon: 'DEFCON 2', color: 'text-amber-400 bg-amber-950/80 border-amber-600/80', badge: 'bg-amber-500' };
    }
    if (idx >= 35 || intensity >= 40) {
      return { label: 'ELEVATED', defcon: 'DEFCON 3', color: 'text-yellow-300 bg-yellow-950/70 border-yellow-600/70', badge: 'bg-yellow-400' };
    }
    return { label: 'MODERATE', defcon: 'DEFCON 4', color: 'text-emerald-400 bg-emerald-950/70 border-emerald-600/70', badge: 'bg-emerald-400' };
  }, [activeConflict]);

  // Helper to render segmented 10-block bar
  const renderSegmentedBar = (val: number, max: number = 100, activeColor: string) => {
    const activeBlocks = Math.min(10, Math.max(0, Math.round((val / max) * 10)));
    return (
      <div className="flex items-center gap-0.5 h-2 w-full">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-full flex-1 rounded-[1px] transition-colors ${
              i < activeBlocks ? activeColor : 'bg-slate-800/80'
            }`}
          />
        ))}
      </div>
    );
  };

  // -------------------------------------------------------------
  // DESKTOP COLLAPSED RAIL MODE
  // -------------------------------------------------------------
  if (isCollapsed && !isMobileDrawer) {
    return (
      <aside
        onClick={onToggleCollapse}
        className="w-full h-full bg-[#040810] border-l border-border flex flex-col items-center justify-between py-3 cursor-pointer hover:bg-panel-hover text-text-secondary hover:text-accent-cyan transition-colors select-none group"
        title="Expand Strategic Conflict Intelligence & Telemetry Workstation"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleCollapse) onToggleCollapse();
          }}
          className="p-1 rounded hover:bg-cyan-950/60 text-accent-cyan mb-3 transition-colors"
          title="Expand Panel"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        </button>

        {/* Rotated Vertical Title */}
        <div className="flex items-center gap-2 [writing-mode:vertical-rl] rotate-180 text-[10px] font-bold tracking-widest text-text-secondary group-hover:text-accent-cyan">
          <Radio className="w-3 h-3 text-accent-green inline rotate-90 animate-pulse" />
          <span>// STRATEGIC INTEL & TELEMETRY</span>
          <span className="text-accent-cyan font-mono truncate max-w-[200px]">
            [{activeConflict ? activeConflict.name : 'WORLD AREA'}]
          </span>
        </div>

        {/* Bottom indicator */}
        <div className="mt-auto flex flex-col items-center gap-1.5 text-[9px] text-text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="[writing-mode:vertical-rl] rotate-180 font-mono tracking-wider text-accent-cyan font-bold">
            EXPAND
          </span>
        </div>
      </aside>
    );
  }

  // -------------------------------------------------------------
  // EXPANDED WORKSTATION MODE
  // -------------------------------------------------------------
  return (
    <aside className="w-full h-full bg-[#050a12] border-l border-border flex flex-col font-mono text-xs select-text overflow-hidden relative z-30 shadow-2xl">
      {/* 1. MASTER WORKSTATION HEADER */}
      <div className="h-10 px-3 bg-[#08101a] border-b border-border flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
          <span className="font-bold text-[11px] tracking-wider text-text-primary truncate">
            // STRATEGIC INTEL
          </span>
          <span
            className={`px-1.5 py-0.2 text-[9px] font-bold border rounded-[2px] shrink-0 ${threatLevel.color}`}
          >
            {threatLevel.label}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {activeConflict ? (
            <button
              onClick={() => {
                onSelectConflict(activeConflict);
                onOpenConflictModal(activeConflict);
              }}
              className="p-1 hover:text-accent-cyan text-text-secondary transition-colors cursor-pointer"
              title="Launch Full Deep-Dive Theater Modal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onOpenConflictModal(allConflicts[0])}
              className="p-1 hover:text-accent-cyan text-text-secondary transition-colors cursor-pointer"
              title="Launch Conflict Terminal"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isMobileDrawer ? (
            <button
              onClick={onCloseMobile}
              className="p-1 hover:text-red-400 text-text-secondary transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 hover:text-accent-cyan text-text-secondary transition-colors cursor-pointer"
                title="Collapse Panel"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. THEATER SWITCHER & SECTOR BAR */}
      <div className="px-3 py-2 bg-[#060c16] border-b border-border/80 flex items-center justify-between shrink-0 relative gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] text-text-muted flex items-center gap-1.5">
            <span>THEATER / SECTOR</span>
            <span className="text-border-glow">&bull;</span>
            <span className="text-accent-cyan truncate">
              {activeConflict ? activeConflict.country : 'WORLDWIDE SURVEILLANCE'}
            </span>
          </div>
          <div className="font-bold text-xs text-text-primary truncate tracking-wide mt-0.5">
            {activeConflict ? activeConflict.name : 'WORLD AREA // GLOBAL OVERVIEW'}
          </div>
        </div>

        {/* Buttons: Dedicated WORLD AREA button + SWITCH THEATER button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dedicated WORLD AREA Button */}
          <button
            onClick={() => onSelectConflict(null)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold border transition-all cursor-pointer ${
              !activeConflict
                ? 'bg-accent-cyan text-black border-accent-cyan shadow-[0_0_10px_rgba(0,240,255,0.4)] font-bold'
                : 'bg-panel-subtle hover:bg-panel-hover text-text-secondary hover:text-accent-cyan border-border'
            }`}
            title={!activeConflict ? 'World Area is currently active' : 'Switch to World Area / Global Overview'}
          >
            <Globe className="w-3 h-3" />
            <span>WORLD</span>
          </button>

          {/* Quick Theater Switcher Dropdown Trigger */}
          <div ref={selectorRef} className="relative shrink-0">
            <button
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className="flex items-center gap-1 px-2 py-1 bg-panel-subtle hover:bg-panel-hover border border-border text-accent-cyan text-[10px] font-bold transition-colors cursor-pointer"
              title="Switch Combat Theater"
            >
              <span>THEATERS</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isSelectorOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 sm:w-80 bg-[#070e1a] border border-border shadow-2xl z-50 p-2 flex flex-col font-mono text-xs">
                {/* Pinned World Area Option at Top */}
                <button
                  onClick={() => {
                    onSelectConflict(null);
                    setIsSelectorOpen(false);
                    setSelectorSearch('');
                  }}
                  className={`w-full text-left p-2 border transition-colors flex items-center justify-between gap-2 mb-2 ${
                    !activeConflict
                      ? 'border-accent-cyan bg-cyan-950/60 text-accent-cyan font-bold'
                      : 'border-border/70 hover:bg-panel-hover text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
                    <div className="truncate">
                      <div className="text-[11px] font-bold">WORLD AREA // GLOBAL OVERVIEW</div>
                      <div className="text-[9px] text-text-muted truncate">
                        All {allConflicts.length} monitored theaters
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-accent-cyan px-1.5 py-0.5 bg-cyan-950 border border-accent-cyan/60 shrink-0">
                    GLOBAL
                  </span>
                </button>

                {/* Search Input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-text-muted absolute left-2 top-2" />
                  <input
                    type="text"
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    placeholder="Search 100+ conflicts..."
                    className="w-full bg-[#03060c] border border-border/80 pl-7 pr-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan"
                    autoFocus
                  />
                </div>

                {/* Conflict List */}
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredConflicts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectConflict(c);
                        setIsSelectorOpen(false);
                        setSelectorSearch('');
                      }}
                      className={`w-full text-left p-1.5 border transition-colors flex items-center justify-between gap-2 ${
                        activeConflict?.id === c.id
                          ? 'border-accent-cyan bg-cyan-950/40 text-accent-cyan font-bold'
                          : 'border-border/50 hover:bg-panel-hover text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="truncate flex-1">
                        <div className="text-[11px] truncate">{c.name}</div>
                        <div className="text-[9px] text-text-muted truncate">
                          {c.country} &bull; {c.region}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold text-severity-critical">
                          {c.escalationIndex}%
                        </div>
                        <div className="text-[9px] text-text-muted">
                          {c.eventCount7d} ev
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. UNIFIED 2-TAB WORKSTATION NAVIGATION STRIP */}
      <div className="h-8 bg-[#040810] border-b border-border flex items-center shrink-0 text-[10px] select-none">
        <button
          onClick={() => setActiveTab('DOSSIER')}
          className={`flex-1 h-full font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'DOSSIER'
              ? 'border-accent-cyan text-accent-cyan bg-panel-hover'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>[01] THEATER DOSSIER</span>
        </button>

        <button
          onClick={() => setActiveTab('DEVELOPMENTS')}
          className={`flex-1 h-full font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'DEVELOPMENTS'
              ? 'border-accent-cyan text-accent-cyan bg-panel-hover'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>[02] KINETIC EVENTS</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-border/80 text-accent-cyan font-semibold">
            {activeConflict ? activeConflict.recentEvents.length : allEvents.length}
          </span>
        </button>
      </div>

      {/* 4. ACTIVE TAB WORKSTATION CONTENT */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        {/* ============================================================ */}
        {/* TAB 1: THEATER DOSSIER & OPERATIONAL METRICS */}
        {/* ============================================================ */}
        {activeTab === 'DOSSIER' && (
          <div className="p-3 space-y-3.5">
            {activeConflict ? (
              /* Specific Theater Dossier */
              <div className="space-y-3.5">
                {/* Executive Threat Assessment Card */}
                <div className={`p-2.5 border rounded-[2px] ${threatLevel.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${threatLevel.badge}`} />
                    <div>
                      <div className="text-[9px] tracking-wider text-text-muted">EXECUTIVE THREAT ASSESSMENT</div>
                      <div className="text-xs font-bold tracking-wider">{threatLevel.label} ({threatLevel.defcon})</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-text-muted">THEATER STATUS</span>
                    <div className="text-xs font-bold">{activeConflict.status}</div>
                  </div>
                </div>

                {/* Escalation & Combat Intensity Meters */}
                <div className="p-2.5 bg-panel-subtle border border-border space-y-2.5">
                  {/* Escalation Index */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-text-muted">ESCALATION INDEX</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-text-primary">{activeConflict.escalationIndex}/100</span>
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 border rounded-[2px] ${
                            activeConflict.escalationTrend === 'UP'
                              ? 'text-red-400 border-red-700 bg-red-950/60'
                              : activeConflict.escalationTrend === 'DOWN'
                              ? 'text-emerald-400 border-emerald-700 bg-emerald-950/60'
                              : 'text-slate-300 border-slate-700 bg-slate-900/60'
                          }`}
                        >
                          {activeConflict.escalationTrend === 'UP'
                            ? '↑ ESCALATING'
                            : activeConflict.escalationTrend === 'DOWN'
                            ? '↓ DE-ESCALATING'
                            : '→ STABLE'}
                        </span>
                      </div>
                    </div>
                    {renderSegmentedBar(
                      activeConflict.escalationIndex,
                      100,
                      activeConflict.escalationIndex >= 70
                        ? 'bg-red-500'
                        : activeConflict.escalationIndex >= 40
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    )}
                  </div>

                  {/* Kinetic Combat Intensity */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-text-muted">RECENT COMBAT INTENSITY</span>
                      <span className="text-accent-cyan font-bold">{activeConflict.intensity}%</span>
                    </div>
                    {renderSegmentedBar(activeConflict.intensity, 100, 'bg-accent-cyan')}
                  </div>
                </div>

                {/* 2x2 Tactical Counters Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <Skull className="w-3 h-3 text-red-400" />
                      <span>FATALITIES REPORTED</span>
                    </div>
                    <div className="text-base font-bold text-severity-critical">
                      {activeConflict.fatalities7d} KIA
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      Last {windowDays}D window
                    </div>
                  </div>

                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>OBSERVED INCIDENTS</span>
                    </div>
                    <div className="text-base font-bold text-text-primary">
                      {activeConflict.eventCount7d} Strikes
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      Verified telemetry
                    </div>
                  </div>

                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <ShieldAlert className="w-3 h-3 text-accent-cyan" />
                      <span>ENGAGEMENT LEVEL</span>
                    </div>
                    <div className="text-xs font-bold text-text-primary mt-1">
                      {activeConflict.intensity > 70 ? 'HIGH ATTRITION' : activeConflict.intensity > 40 ? 'ACTIVE COMBAT' : 'LOW SKIRMISH'}
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      Kinetic threshold
                    </div>
                  </div>

                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <Clock className="w-3 h-3 text-text-secondary" />
                      <span>LAST STRIKE RECORDED</span>
                    </div>
                    <div className="text-xs font-bold text-text-primary mt-1 truncate">
                      {activeConflict.lastEventAt ? formatRelativeTime(activeConflict.lastEventAt) : 'N/A'}
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5 truncate">
                      Telemetry timestamp
                    </div>
                  </div>
                </div>

                {/* Verified Escalation Driver Callout */}
                {activeConflict.escalationReason && (
                  <div className="bg-panel-subtle/80 p-2.5 border-l-2 border-accent-cyan border-y border-r border-border">
                    <div className="text-[9px] text-accent-cyan font-bold tracking-wider mb-1">
                      // VERIFIED ESCALATION DRIVER
                    </div>
                    <div className="text-[11px] text-text-secondary leading-relaxed">
                      {activeConflict.escalationReason}
                    </div>
                  </div>
                )}

                {/* Combatants & Primary Actors */}
                <div className="space-y-1.5">
                  <div className="text-[9px] text-text-muted flex items-center justify-between">
                    <span>// IDENTIFIED COMBATANTS & BELLIGERENTS</span>
                    <span>[{activeConflict.actors.length} RECORDED]</span>
                  </div>
                  <div className="space-y-1">
                    {activeConflict.actors.length > 0 ? (
                      activeConflict.actors.map((actor, idx) => (
                        <div
                          key={idx}
                          className="text-[11px] bg-panel-subtle px-2 py-1 border border-border text-text-primary truncate flex items-center justify-between"
                        >
                          <span className="truncate">{actor}</span>
                          <span className="text-[9px] text-text-muted uppercase shrink-0 font-mono">
                            ACTOR #{idx + 1}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-text-muted text-[10px]">Unidentified actors</div>
                    )}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-1 space-y-2">
                  <button
                    onClick={() => {
                      onSelectConflict(activeConflict);
                      onOpenConflictModal(activeConflict);
                    }}
                    className="w-full py-2 bg-panel-hover hover:bg-accent-cyan/20 border border-accent-cyan/60 text-accent-cyan text-[11px] font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>LAUNCH FULL THEATER TERMINAL</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('DEVELOPMENTS')}
                    className="w-full py-1.5 bg-panel-subtle hover:bg-panel-hover border border-border text-text-secondary hover:text-accent-cyan text-[10px] font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-3 h-3 text-accent-cyan" />
                    <span>VIEW VERIFIED DEVELOPMENTS ({activeConflict.recentEvents.length})</span>
                  </button>
                </div>
              </div>
            ) : (
              /* World Area Global Dossier */
              <div className="space-y-3.5">
                {/* Executive World Assessment Card */}
                <div className="p-2.5 border rounded-[2px] text-amber-400 bg-amber-950/80 border-amber-600/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent-cyan shrink-0 animate-pulse" />
                    <div>
                      <div className="text-[9px] tracking-wider text-text-muted">GLOBAL CONFLICT ASSESSMENT</div>
                      <div className="text-xs font-bold tracking-wider">ELEVATED KINETIC ESCALATION</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-text-muted">SURVEILLANCE</span>
                    <div className="text-xs font-bold text-accent-cyan">{allConflicts.length} THEATERS</div>
                  </div>
                </div>

                {/* 2x2 Global Tactical Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <Skull className="w-3 h-3 text-red-400" />
                      <span>GLOBAL FATALITIES</span>
                    </div>
                    <div className="text-base font-bold text-severity-critical">
                      {globalStats.totalFatalities} KIA
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      Last {windowDays}D window
                    </div>
                  </div>

                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>OBSERVED STRIKES</span>
                    </div>
                    <div className="text-base font-bold text-text-primary">
                      {globalStats.totalEvents} Events
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      Verified telemetry
                    </div>
                  </div>

                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <ShieldAlert className="w-3 h-3 text-accent-cyan" />
                      <span>MONITORED THEATERS</span>
                    </div>
                    <div className="text-base font-bold text-text-primary">
                      {allConflicts.length} Zones
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      5 Global regions
                    </div>
                  </div>

                  <div className="bg-panel-subtle p-2.5 border border-border">
                    <div className="flex items-center gap-1.5 text-[9px] text-text-muted mb-1">
                      <TrendingUp className="w-3 h-3 text-red-400" />
                      <span>ESCALATING FRONTS</span>
                    </div>
                    <div className="text-base font-bold text-red-400">
                      {globalStats.escalatingCount} Theaters
                    </div>
                    <div className="text-[9px] text-text-muted mt-0.5">
                      Upward trajectory
                    </div>
                  </div>
                </div>

                {/* Global Escalation & Intensity Meters */}
                <div className="p-2.5 bg-panel-subtle border border-border space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-text-muted">AVERAGE GLOBAL ESCALATION</span>
                      <span className="font-bold text-text-primary">{globalStats.avgEscalation}/100</span>
                    </div>
                    {renderSegmentedBar(globalStats.avgEscalation, 100, 'bg-amber-400')}
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-text-muted">GLOBAL KINETIC INTENSITY</span>
                      <span className="text-accent-cyan font-bold">{globalStats.avgIntensity}%</span>
                    </div>
                    {renderSegmentedBar(globalStats.avgIntensity, 100, 'bg-accent-cyan')}
                  </div>
                </div>

                {/* Active Global Flashpoints List */}
                <div className="space-y-1.5">
                  <div className="text-[9px] text-text-muted flex items-center justify-between">
                    <span>// TOP GLOBAL FLASHPOINTS & HOTSPOTS</span>
                    <span>[CLICK TO INSPECT]</span>
                  </div>
                  <div className="space-y-1">
                    {globalStats.topFlashpoints.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectConflict(c)}
                        className="w-full text-left p-2 bg-panel-subtle hover:bg-panel-hover border border-border hover:border-accent-cyan/60 transition-all flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <div className="truncate flex-1">
                          <div className="text-[11px] font-bold text-text-primary group-hover:text-accent-cyan transition-colors truncate">
                            {c.name}
                          </div>
                          <div className="text-[9px] text-text-muted truncate">
                            {c.country} &bull; {c.region}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-severity-critical block">
                            {c.escalationIndex}%
                          </span>
                          <span className="text-[9px] text-text-muted">
                            {c.fatalities7d} KIA
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Regional Breakdown Chips */}
                <div>
                  <div className="text-[9px] text-text-muted mb-1.5">// REGIONAL THEATER COUNTS</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(globalStats.regionCounts).map(([region, count]) => (
                      <span
                        key={region}
                        className="text-[9px] bg-panel-subtle px-2 py-0.5 border border-border text-text-secondary"
                      >
                        {region}: <strong className="text-accent-cyan">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action: View All Global Events */}
                <button
                  onClick={() => setActiveTab('DEVELOPMENTS')}
                  className="w-full py-2 bg-panel-subtle hover:bg-panel-hover border border-border hover:border-accent-cyan text-accent-cyan text-[11px] font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Activity className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>INSPECT ALL GLOBAL DEVELOPMENTS ({allEvents.length})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: VERIFIED DEVELOPMENTS STREAM */}
        {/* ============================================================ */}
        {activeTab === 'DEVELOPMENTS' && (
          <div className="p-3 space-y-2.5">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3 h-3 text-text-muted absolute left-2 top-2" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder={
                  activeConflict
                    ? `Filter incidents in ${activeConflict.name}...`
                    : 'Filter all global incidents (drone, artillery, location)...'
                }
                className="w-full bg-[#040810] border border-border pl-7 pr-2 py-1 text-[10px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan"
              />
            </div>

            <div className="text-[9px] text-text-muted flex items-center justify-between pb-1 border-b border-border/60">
              <span>
                {activeConflict
                  ? `// ${activeConflict.name.toUpperCase()} (LAST ${windowDays}D)`
                  : `// GLOBAL DEVELOPMENTS STREAM (LAST ${windowDays}D)`}
              </span>
              <span>{filteredEvents.length} INCIDENTS</span>
            </div>

            {/* Events List */}
            <div className="space-y-2">
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 30).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-2.5 bg-panel-subtle hover:bg-panel-hover border border-border hover:border-accent-cyan/60 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-accent-cyan font-bold">
                          [{formatShortDate(ev.eventDate)}]
                        </span>
                        <span className="text-text-muted text-[9px]">
                          {formatRelativeTime(ev.timestamp || ev.eventDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {ev.fatalities ? (
                          <span className="text-severity-critical font-bold text-[10px] px-1 bg-red-950/60 border border-red-800">
                            +{ev.fatalities} KIA
                          </span>
                        ) : null}
                        <span
                          className={`text-[9px] px-1 font-bold border rounded-[2px] ${
                            ev.severity === 'CRITICAL'
                              ? 'text-red-400 border-red-700 bg-red-950/50'
                              : ev.severity === 'HIGH'
                              ? 'text-amber-400 border-amber-700 bg-amber-950/50'
                              : 'text-cyan-400 border-cyan-700 bg-cyan-950/50'
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-text-primary group-hover:text-accent-cyan transition-colors truncate">
                      {ev.eventType}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-text-secondary truncate">
                      <MapPin className="w-3 h-3 text-text-muted shrink-0" />
                      <span className="truncate">
                        {ev.location}, <strong className="text-text-primary">{ev.country}</strong>
                      </span>
                    </div>

                    {ev.notes && (
                      <div className="text-[10px] text-text-muted line-clamp-2 italic bg-black/40 p-1.5 border-l border-border/80">
                        &ldquo;{ev.notes}&rdquo;
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-text-muted text-xs">
                  No developments found matching &ldquo;{eventSearch}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
