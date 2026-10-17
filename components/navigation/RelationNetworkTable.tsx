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
      <div className="flex items-center justify-between pb-2 pt-0.5 text-[10px] shrink-0 border-b border-white/5 mb-2">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[10.5px] font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO STREAM</span>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close relation network and return to stream"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Theater & Vector KPI Header */}
      <div className="shrink-0 space-y-2 mb-2.5 glass-panel-subtle rounded-2xl border border-white/[0.10] p-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-cyan-300 font-bold tracking-wider">// VECTOR MATRIX</span>
          <span className="text-[9px] px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-full font-bold animate-pulse">
            LIVE ARCS
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white uppercase tracking-wide">
            {network.focalCountry}
          </div>
          <div className="text-[10px] text-zinc-400">
            {network.connectedCountries.length} Theaters
          </div>
        </div>

        {/* 4-Cell Telemetry Strip with AI Centrality */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/5 text-[9.5px]">
          <div>
            <span className="text-zinc-500 text-[8.5px] block">TOTAL OPS</span>
            <span className="text-white font-bold">{network.totalEvents}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[8.5px] block">K.I.A</span>
            <span className={`font-bold ${totalFatalities > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {totalFatalities}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 text-[8.5px] block">ARCS</span>
            <span className="text-cyan-300 font-bold">{network.outgoingCount}</span>
            <span className="text-zinc-500 text-[8.5px]"> / </span>
            <span className="text-rose-400 font-bold">{network.incomingCount}</span>
          </div>
          <div>
            <span className="text-zinc-500 text-[8.5px] block">AI CASCADE</span>
            <span className={`font-bold font-mono ${
              (network.focalCascadeRisk ?? 0) >= 0.5 ? 'text-amber-400' : 'text-cyan-300'
            }`}>
              {network.focalCascadeRisk !== undefined ? `${Math.round(network.focalCascadeRisk * 100)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Direction Filter Tabs */}
      <div className="flex items-center gap-1 shrink-0 mb-2 text-[9.5px] glass-panel p-1 rounded-full border border-white/10">
        <button
          onClick={() => setFilterDir('ALL')}
          className={`flex-1 py-1 rounded-full font-bold text-center transition-all cursor-pointer ${
            filterDir === 'ALL'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          ALL ({network.relations.length})
        </button>
        <button
          onClick={() => setFilterDir('OUTGOING')}
          className={`flex-1 py-1 rounded-full font-bold text-center transition-all cursor-pointer ${
            filterDir === 'OUTGOING'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-cyan-300 border border-transparent'
          }`}
        >
          ➔ OUT ({network.outgoingCount})
        </button>
        <button
          onClick={() => setFilterDir('INCOMING')}
          className={`flex-1 py-1 rounded-full font-bold text-center transition-all cursor-pointer ${
            filterDir === 'INCOMING'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-sm'
              : 'text-zinc-400 hover:text-rose-300 border border-transparent'
          }`}
        >
          ◄ IN ({network.incomingCount})
        </button>
      </div>

      {/* Relation Lines Table */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden border border-white/5 rounded-xl glass-panel-subtle">
        {/* Table Header */}
        <div className="flex items-center bg-white/[0.02] px-3 py-1.5 border-b border-white/5 text-[9px] text-zinc-400 font-bold tracking-wider shrink-0">
          <div className="flex-1">ROUTE / THEATER</div>
          <div className="w-10 text-center">DIR</div>
          <div className="w-9 text-right">EVTS</div>
          <div className="w-10 text-right">K.I.A</div>
        </div>

        {/* Scrollable Table Rows */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5">
          {filteredRelations.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-[10px] italic">
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
                    className="flex items-center px-3 py-2 text-[10px] hover:bg-white/[0.04] transition-colors cursor-pointer"
                    style={{
                      borderLeft: `3px solid ${themeColor}`,
                    }}
                    title={`Click to view full ${targetCountry} dispatches`}
                  >
                    {/* Route */}
                    <div className="flex-1 flex items-center gap-1.5 truncate pr-1">
                      <span
                        className="font-bold text-[10px]"
                        style={{ color: themeColor }}
                      >
                        {isOutgoing ? '➔' : '◄'}
                      </span>
                      <span className="text-white font-bold truncate group-hover:text-cyan-300 transition-colors">
                        {targetCountry}
                      </span>
                      {rel.isStrategicChokepoint && (
                        <span className="text-[7.5px] px-1.5 py-0.2 bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold rounded-full shrink-0">
                          HUB
                        </span>
                      )}
                      {rel.cascadeRisk !== undefined && (
                        <span className="text-[8px] text-zinc-400 font-mono shrink-0">
                          {Math.round(rel.cascadeRisk * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Dir Badge */}
                    <div className="w-10 text-center shrink-0">
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
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
                    <div className="w-9 text-right font-bold text-zinc-200 shrink-0">
                      {rel.eventCount}
                    </div>

                    {/* Fatalities */}
                    <div
                      className={`w-10 text-right font-bold shrink-0 ${
                        rel.fatalities > 0 ? 'text-rose-400' : 'text-zinc-500'
                      }`}
                    >
                      {rel.fatalities > 0 ? rel.fatalities : '—'}
                    </div>
                  </div>

                  {/* Brief Strategic Rationale / Why Mapped */}
                  <div
                    className="px-3 py-1.5 bg-white/[0.01] text-[9.5px] border-t border-white/5 text-zinc-300 space-y-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRelation?.(rel);
                    }}
                  >
                    <div className="text-zinc-400 text-[8.5px] line-clamp-2 leading-relaxed">
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
        <div className="p-2 bg-white/[0.02] border-t border-white/5 text-[9px] text-zinc-500 flex items-center justify-between shrink-0">
          <span className="truncate">Click row to open dispatches modal</span>
          <span className="text-cyan-300 font-bold shrink-0">[MODAL ➔]</span>
        </div>
      </div>
    </div>
  );
};
