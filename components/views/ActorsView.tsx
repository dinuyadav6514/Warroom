'use client';

import React, { useState } from 'react';
import { Conflict, ConflictEvent } from '@/types/conflict';
import { Users, Shield, Search } from 'lucide-react';

interface ActorsViewProps {
  conflicts: Conflict[];
  events: ConflictEvent[];
  onSelectEvent: (event: ConflictEvent) => void;
  onSelectConflict: (conflict: Conflict) => void;
  onOpenConflictModal: () => void;
  windowDays: number;
}

export const ActorsView: React.FC<ActorsViewProps> = ({
  conflicts,
  events,
  onSelectEvent,
  onSelectConflict,
  onOpenConflictModal,
  windowDays,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate actors
  const actorMap = new Map<
    string,
    {
      name: string;
      incidentCount: number;
      fatalities: number;
      theaters: Set<string>;
      countries: Set<string>;
      recentIncidents: ConflictEvent[];
    }
  >();

  for (const ev of events) {
    const list = [ev.actor1, ev.actor2].filter((a): a is string => Boolean(a && a.trim() !== ''));
    for (const act of list) {
      if (!actorMap.has(act)) {
        actorMap.set(act, {
          name: act,
          incidentCount: 0,
          fatalities: 0,
          theaters: new Set(),
          countries: new Set(),
          recentIncidents: [],
        });
      }
      const entry = actorMap.get(act)!;
      entry.incidentCount++;
      entry.fatalities += ev.fatalities || 0;
      if (ev.location) entry.theaters.add(ev.location);
      if (ev.country) entry.countries.add(ev.country);
      entry.recentIncidents.push(ev);
    }
  }

  let actorList = Array.from(actorMap.values()).sort((a, b) => b.incidentCount - a.incidentCount);

  if (searchTerm.trim() !== '') {
    const lower = searchTerm.toLowerCase();
    actorList = actorList.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        Array.from(a.countries).some((c) => c.toLowerCase().includes(lower))
    );
  }

  return (
    <div className="glass-panel h-full flex flex-col font-mono text-xs select-none backdrop-blur-2xl border border-white/[0.12] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] m-3">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>IDENTIFIED BELLIGERENTS &amp; ACTORS DIRECTORY</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            PARTICIPATING ARMED FORCES, MILITIAS, AND ORGANIZATIONS (LAST {windowDays} DAYS)
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Filter actors or countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-white/[0.04] border border-white/10 rounded-full focus:border-cyan-400/60 focus:outline-none text-[11px] text-white placeholder:text-zinc-500 w-60 font-mono transition-all"
          />
        </div>
      </div>

      {/* Grid of Actors */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {actorList.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-zinc-500">
            NO ACTORS MATCHING SEARCH IN CURRENT TIME WINDOW
          </div>
        ) : (
          actorList.map((actor) => (
            <div
              key={actor.name}
              className="p-4 rounded-xl glass-panel-subtle border border-white/5 hover:border-white/20 transition-all space-y-2.5 shadow-md"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="font-bold text-white text-[12.5px] truncate pr-2">
                  {actor.name}
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px]">
                    {actor.incidentCount} INCIDENTS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10.5px] text-zinc-300">
                <div>
                  <span className="text-zinc-500">THEATERS:</span>{' '}
                  <span className="text-white font-medium">
                    {Array.from(actor.countries).join(', ') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">CASUALTIES:</span>{' '}
                  <span className="text-rose-400 font-bold">{actor.fatalities}</span>
                </div>
              </div>

              {/* Sample Recent Incidents */}
              <div className="pt-1">
                <div className="text-[9.5px] text-zinc-400 mb-1.5 font-semibold">// RECENT ENGAGEMENTS</div>
                <div className="space-y-1.5">
                  {actor.recentIncidents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="w-full text-left p-2 rounded-lg glass-panel hover:bg-white/[0.08] border border-white/5 text-[10.5px] text-zinc-300 hover:text-white truncate transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">
                        [{ev.eventDate}] {ev.eventType} in {ev.location}
                      </span>
                      <span className="text-cyan-400 text-[10px] font-semibold ml-2 shrink-0">INSPECT &rarr;</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
