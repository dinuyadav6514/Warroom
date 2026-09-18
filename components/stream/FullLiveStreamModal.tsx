'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ConflictEvent, Severity } from '@/types/conflict';
import {
  X,
  Radio,
  Search,
  RefreshCw,
  Crosshair,
  ExternalLink,
  MapPin,
  ArrowUpDown,
  ShieldAlert,
} from 'lucide-react';

interface FullLiveStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ConflictEvent[];
  onSelectEvent: (event: ConflictEvent) => void;
  onOpenEventModal?: (event: ConflictEvent) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const FullLiveStreamModal: React.FC<FullLiveStreamModalProps> = ({
  isOpen,
  onClose,
  events,
  onSelectEvent,
  onOpenEventModal,
  isRefreshing = false,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SEVERITY' | 'CASUALTIES'>('NEWEST');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Categories extracted from events
  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((ev) => {
      if (ev.primaryCategory) set.add(ev.primaryCategory);
    });
    return Array.from(set).sort();
  }, [events]);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return events
      .filter((ev) => {
        // Severity filter
        if (selectedSeverity !== 'ALL' && ev.severity !== selectedSeverity) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && ev.primaryCategory !== selectedCategory) {
          return false;
        }

        // Search query
        if (q) {
          const matchNotes = ev.notes?.toLowerCase().includes(q);
          const matchCountry = ev.country?.toLowerCase().includes(q);
          const matchLoc = ev.location?.toLowerCase().includes(q);
          const matchType = ev.eventType?.toLowerCase().includes(q);
          const matchSource = ev.source?.toLowerCase().includes(q);
          if (!matchNotes && !matchCountry && !matchLoc && !matchType && !matchSource) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'CASUALTIES') {
          return (b.fatalities || 0) - (a.fatalities || 0);
        }
        if (sortBy === 'SEVERITY') {
          const rank = (s?: Severity) =>
            s === 'CRITICAL' ? 4 : s === 'HIGH' ? 3 : s === 'MODERATE' ? 2 : 1;
          return rank(b.severity) - rank(a.severity);
        }
        // Default: NEWEST first
        const timeA = new Date(a.timestamp || a.eventDate).getTime() || 0;
        const timeB = new Date(b.timestamp || b.eventDate).getTime() || 0;
        return timeB - timeA;
      });
  }, [events, searchQuery, selectedSeverity, selectedCategory, sortBy]);

  // Critical counts
  const criticalCount = useMemo(
    () => events.filter((e) => e.severity === 'CRITICAL').length,
    [events]
  );
  const totalFatalities = useMemo(
    () => events.reduce((acc, e) => acc + (e.fatalities || 0), 0),
    [events]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 font-mono select-none cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl rounded-[2px] overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-panel-subtle border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Radio className="w-4 h-4 text-accent-green animate-pulse" />
              <span className="text-accent-cyan font-bold text-xs sm:text-sm tracking-wider">
                // FULL LIVE CONFLICT STREAM TERMINAL
              </span>
              <span className="hidden sm:inline text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {events.length} ACTIVE INCIDENTS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-text-muted hover:text-accent-cyan border border-border hover:border-accent-cyan/40 rounded transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh live news feeds"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-accent-cyan' : ''}`} />
                <span className="hidden md:inline">SYNC WIRE</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Stream (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Intel Telemetry Strip */}
        <div className="px-4 py-2 bg-black/40 border-b border-border/80 flex items-center justify-between text-[11px] flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-text-muted">TOTAL INCIDENTS: </span>
              <span className="text-text-primary font-bold">{events.length}</span>
            </div>
            <div>
              <span className="text-text-muted">CRITICAL CONFLICTS: </span>
              <span className="text-severity-critical font-bold">{criticalCount}</span>
            </div>
            <div>
              <span className="text-text-muted">TOTAL CASUALTIES: </span>
              <span className="text-amber-400 font-bold">{totalFatalities} reported</span>
            </div>
          </div>
          <div className="text-[10.5px] text-text-muted font-mono">
            FILTERED: <span className="text-accent-cyan font-bold">{filteredEvents.length}</span> / {events.length}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3 bg-panel-subtle border-b border-border flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conflicts by country, region, keyword, source..."
                className="w-full bg-black/50 border border-border focus:border-accent-cyan rounded px-2.5 py-1.5 pl-8 text-xs text-text-primary placeholder:text-text-muted/60 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 text-[10px]">
              {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((sev) => {
                const isActive = selectedSeverity === sev;
                const activeClasses =
                  sev === 'CRITICAL'
                    ? 'bg-red-950/80 border-red-500 text-red-400'
                    : sev === 'HIGH'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-400'
                    : sev === 'MODERATE'
                    ? 'bg-yellow-950/80 border-yellow-500 text-yellow-400'
                    : sev === 'LOW'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
                    : 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan';

                return (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2 py-1 rounded-[2px] border transition-colors cursor-pointer font-bold ${
                      isActive
                        ? activeClasses
                        : 'bg-black/30 border-border text-text-muted hover:text-text-secondary hover:border-white/20'
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-1 text-[10px] ml-auto">
              <ArrowUpDown className="w-3 h-3 text-text-muted" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/50 border border-border text-text-secondary rounded px-2 py-1 outline-none text-[10px] cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="SEVERITY">Highest Severity</option>
                <option value="CASUALTIES">Highest Casualties</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills (if any) */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto text-[9.5px] pt-1">
              <span className="text-text-muted text-[9px] shrink-0 font-semibold">THEATERS:</span>
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan font-bold'
                    : 'bg-black/30 border-border text-text-muted hover:text-text-secondary'
                }`}
              >
                ALL ({events.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan font-bold'
                      : 'bg-black/30 border-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Event Feed Table */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-white/5">
          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-text-muted text-xs flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-text-muted/50" />
              <span>NO CONFLICT DISPATCHES MATCH CRITERIA</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeverity('ALL');
                  setSelectedCategory('ALL');
                }}
                className="text-accent-cyan text-[11px] underline mt-1 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const sevColor =
                ev.severity === 'CRITICAL'
                  ? 'border-red-600/80 bg-red-950/50 text-severity-critical'
                  : ev.severity === 'HIGH'
                  ? 'border-amber-600/80 bg-amber-950/50 text-severity-high'
                  : ev.severity === 'MODERATE'
                  ? 'border-yellow-600/80 bg-yellow-950/50 text-severity-moderate'
                  : 'border-emerald-600/80 bg-emerald-950/50 text-severity-low';

              const headline = ev.notes || `${ev.eventType} reported in ${ev.location}`;

              return (
                <div
                  key={ev.id}
                  className="pt-2.5 pb-2 px-2 rounded-[2px] hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left: Dispatch Intel Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded-[2px] ${sevColor}`}>
                        {ev.severity}
                      </span>
                      {ev.primaryCategory && (
                        <span className="text-[9px] px-1.5 py-0.5 border border-white/10 text-text-secondary rounded-[2px]">
                          {ev.primaryCategory.toUpperCase()}
                        </span>
                      )}
                      {ev.verificationStatus && (
                        <span className="text-[8.5px] px-1 py-0.5 border border-accent-cyan/30 text-accent-cyan rounded-[2px]">
                          [{ev.verificationStatus}]
                        </span>
                      )}
                      <span className="text-[9.5px] text-text-muted font-mono ml-auto sm:ml-0">
                        {ev.eventDate || 'RECENT'}
                      </span>
                    </div>

                    {/* Headline */}
                    <div
                      className="text-[12px] font-bold text-text-primary group-hover:text-accent-cyan leading-snug line-clamp-2 transition-colors cursor-pointer"
                      onClick={() => onSelectEvent(ev)}
                    >
                      {headline}
                    </div>

                    {/* Location, Casualties, and Source Wire */}
                    <div className="flex items-center gap-3 text-[10px] text-text-muted mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1 text-accent-cyan">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="font-semibold">{ev.location}, {ev.country}</span>
                        {ev.latitude != null && ev.longitude != null && (
                          <span className="text-text-muted font-mono text-[9px]">
                            [{ev.latitude.toFixed(1)}°, {ev.longitude.toFixed(1)}°]
                          </span>
                        )}
                      </div>

                      {ev.fatalities !== undefined && ev.fatalities > 0 && (
                        <span className="text-severity-critical font-bold bg-red-950/40 border border-red-900/60 px-1.5 py-0.2 rounded">
                          +{ev.fatalities} CASUALTIES
                        </span>
                      )}

                      {ev.source && (
                        <span className="text-text-muted font-mono text-[9.5px]">
                          SRC: <span className="text-text-secondary">{ev.source}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Tactical Action Controls */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onSelectEvent(ev)}
                      className="px-2.5 py-1.5 text-[10.5px] font-bold bg-accent-cyan/15 hover:bg-accent-cyan/30 border border-accent-cyan/50 hover:border-accent-cyan text-accent-cyan rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Locate & zoom to this conflict on the map"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>LOCATE ON MAP</span>
                    </button>

                    {onOpenEventModal && (
                      <button
                        onClick={() => onOpenEventModal(ev)}
                        className="px-2.5 py-1.5 text-[10.5px] font-bold bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-text-secondary hover:text-white rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="View comprehensive intel analysis dossier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>INTEL DOSSIER</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tactical Footer */}
        <div className="px-4 py-2.5 bg-panel-subtle border-t border-border flex items-center justify-between text-[10px] text-text-muted shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span>LIVE INTEL STREAM READY</span>
          </div>
          <div className="text-[9.5px] font-mono text-text-secondary">
            CLICK "LOCATE ON MAP" TO PINPOINT • PRESS [ESC] TO CLOSE
          </div>
        </div>
      </div>
    </div>
  );
};
