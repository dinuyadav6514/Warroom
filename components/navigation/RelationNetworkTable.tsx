'use client';

import React, { useState } from 'react';
import { RelationshipNetwork, CountryRelation } from '@/lib/data/country-relationships';
import {
  ArrowLeft,
  X,
  ExternalLink,
} from 'lucide-react';

interface RelationNetworkTableProps {
  network: RelationshipNetwork;
  onSelectRelation?: (relation: CountryRelation) => void;
  onClose?: () => void;
}

export const RelationNetworkTable: React.FC<RelationNetworkTableProps> = ({
  network,
  onSelectRelation,
  onClose,
}) => {
  const [filterDir, setFilterDir] = useState<'ALL' | 'OUTGOING' | 'INCOMING'>('ALL');

  const filteredRelations = network.relations.filter((r) => {
    if (filterDir === 'OUTGOING') return r.direction === 'OUTGOING';
    if (filterDir === 'INCOMING') return r.direction === 'INCOMING';
    return true;
  });

  const totalFatalities = network.relations.reduce((s, r) => s + (r.fatalities || 0), 0);

  return (
    <div className="w-full flex-1 flex flex-col bg-transparent select-none font-mono text-xs min-h-[420px]">
      {/* Return to live feed bar */}
      <div className="flex items-center justify-between pb-1.5 pt-0.5 text-[10px] shrink-0 border-b border-border/50 mb-1.5">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[10px] font-bold text-accent-cyan hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO STREAM</span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"
            title="Close relation network and return to stream"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Theater & Vector KPI Header */}
      <div className="shrink-0 space-y-1.5 mb-2 bg-[#040810] border border-border/60 p-2 rounded-[2px]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-accent-cyan font-bold tracking-wider">// VECTOR MATRIX</span>
          <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950/60 border border-cyan-500/40 text-accent-cyan rounded-[2px] font-bold animate-pulse">
            LIVE ARCS
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white uppercase tracking-wide">
            {network.focalCountry}
          </div>
          <div className="text-[9px] text-text-muted">
            {network.connectedCountries.length} Theaters
          </div>
        </div>

        {/* 3-Cell Telemetry Strip */}
        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/40 text-[9.5px]">
          <div>
            <span className="text-text-muted text-[8px] block">TOTAL OPS</span>
            <span className="text-white font-bold">{network.totalEvents}</span>
          </div>
          <div>
            <span className="text-text-muted text-[8px] block">K.I.A</span>
            <span className={`font-bold ${totalFatalities > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {totalFatalities}
            </span>
          </div>
          <div>
            <span className="text-text-muted text-[8px] block">ARCS</span>
            <span className="text-accent-cyan font-bold">{network.outgoingCount}</span>
            <span className="text-text-muted text-[8px]"> / </span>
            <span className="text-red-400 font-bold">{network.incomingCount}</span>
          </div>
        </div>
      </div>

      {/* Direction Filter Tabs */}
      <div className="flex items-center gap-1 shrink-0 mb-1.5 text-[9px] bg-black/40 p-0.5 border border-border/40 rounded-[2px]">
        <button
          onClick={() => setFilterDir('ALL')}
          className={`flex-1 py-1 rounded-[1px] font-bold text-center transition-colors cursor-pointer ${
            filterDir === 'ALL'
              ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
              : 'text-text-muted hover:text-slate-300'
          }`}
        >
          ALL ({network.relations.length})
        </button>
        <button
          onClick={() => setFilterDir('OUTGOING')}
          className={`flex-1 py-1 rounded-[1px] font-bold text-center transition-colors cursor-pointer ${
            filterDir === 'OUTGOING'
              ? 'bg-cyan-950/80 text-accent-cyan border border-cyan-500/50'
              : 'text-text-muted hover:text-accent-cyan'
          }`}
        >
          ➔ OUT ({network.outgoingCount})
        </button>
        <button
          onClick={() => setFilterDir('INCOMING')}
          className={`flex-1 py-1 rounded-[1px] font-bold text-center transition-colors cursor-pointer ${
            filterDir === 'INCOMING'
              ? 'bg-red-950/80 text-red-400 border border-red-500/50'
              : 'text-text-muted hover:text-red-400'
          }`}
        >
          ◄ IN ({network.incomingCount})
        </button>
      </div>

      {/* Relation Lines Table */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden border border-border/50 rounded-[2px] bg-[#020509]">
        {/* Table Header */}
        <div className="flex items-center bg-[#070e1a] px-2 py-1 border-b border-border/60 text-[9px] text-text-muted font-bold tracking-wider shrink-0">
          <div className="flex-1">ROUTE / THEATER</div>
          <div className="w-9 text-center">DIR</div>
          <div className="w-9 text-right">EVTS</div>
          <div className="w-10 text-right">K.I.A</div>
        </div>

        {/* Scrollable Table Rows */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border/30">
          {filteredRelations.length === 0 ? (
            <div className="p-3 text-center text-text-muted text-[10px] italic">
              No relations match selected filter
            </div>
          ) : (
            filteredRelations.map((rel) => {
              const isOutgoing = rel.direction === 'OUTGOING';
              const targetCountry = isOutgoing ? rel.toCountry : rel.fromCountry;
              const themeColor = isOutgoing ? '#06b6d4' : '#ef4444';

              return (
                <div key={rel.id} className="group">
                  <div
                    onClick={() => onSelectRelation?.(rel)}
                    className="flex items-center px-2 py-1.5 text-[10px] hover:bg-white/[0.05] transition-colors cursor-pointer"
                    style={{
                      borderLeft: `2px solid ${themeColor}`,
                    }}
                    title={`Click to view full ${targetCountry} dispatches`}
                  >
                    {/* Route */}
                    <div className="flex-1 flex items-center gap-1 truncate pr-1">
                      <span
                        className="font-bold text-[10px]"
                        style={{ color: themeColor }}
                      >
                        {isOutgoing ? '➔' : '◄'}
                      </span>
                      <span className="text-white font-bold truncate group-hover:text-cyan-300 transition-colors">
                        {targetCountry}
                      </span>
                    </div>

                    {/* Dir Badge */}
                    <div className="w-9 text-center shrink-0">
                      <span
                        className="text-[8px] font-bold px-1 py-0.5 rounded-[2px]"
                        style={{
                          backgroundColor: isOutgoing ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: themeColor,
                          border: `1px solid ${themeColor}40`,
                        }}
                      >
                        {isOutgoing ? 'OUT' : 'IN'}
                      </span>
                    </div>

                    {/* Event Count */}
                    <div className="w-9 text-right font-bold text-slate-200 shrink-0">
                      {rel.eventCount}
                    </div>

                    {/* Fatalities */}
                    <div
                      className={`w-10 text-right font-bold shrink-0 ${
                        rel.fatalities > 0 ? 'text-red-400' : 'text-slate-500'
                      }`}
                    >
                      {rel.fatalities > 0 ? rel.fatalities : '—'}
                    </div>
                  </div>

                  {/* Brief Strategic Rationale / Why Mapped */}
                  <div
                    className="px-2 py-1 bg-black/40 text-[9.5px] border-t border-border/20 text-slate-300 space-y-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRelation?.(rel);
                    }}
                  >
                    <div className="text-text-muted text-[8.5px] line-clamp-2 leading-relaxed">
                      <strong style={{ color: themeColor }}>WHY MAPPED: </strong>
                      {rel.primaryReason || rel.strategicContext || 'Kinetic conflict vector recorded.'}
                    </div>
                    <div className="flex justify-end pt-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRelation?.(rel);
                        }}
                        className="text-[8.5px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        style={{ color: themeColor }}
                      >
                        <span>VIEW FULL DISPATCHES</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer Prompt */}
        <div className="p-1.5 bg-[#050b14] border-t border-border/50 text-[9px] text-text-muted flex items-center justify-between shrink-0">
          <span className="truncate">Click row to open dispatches modal</span>
          <span className="text-accent-cyan font-bold shrink-0">[MODAL ➔]</span>
        </div>
      </div>
    </div>
  );
};
