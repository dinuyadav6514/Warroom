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
    <div className="h-full flex flex-col bg-panel font-mono text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-border bg-panel-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="text-accent-cyan font-bold text-sm tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-accent-cyan" />
            <span>IDENTIFIED BELLIGERENTS & ACTORS DIRECTORY</span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            PARTICIPATING ARMED FORCES, MILITIAS, AND ORGANIZATIONS (LAST {windowDays} DAYS)
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-text-muted" />
          <input
            type="text"
            placeholder="Filter actors or countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1 bg-panel border border-border focus:border-accent-cyan focus:outline-none text-[11px] text-text-primary w-56 font-mono"
          />
        </div>
      </div>

      {/* Grid of Actors */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {actorList.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-text-muted">
            NO ACTORS MATCHING SEARCH IN CURRENT TIME WINDOW
          </div>
        ) : (
          actorList.map((actor) => (
            <div
              key={actor.name}
              className="p-3 bg-panel-subtle border border-border hover:border-accent-cyan/50 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="font-bold text-text-primary text-[12px] truncate pr-2">
                  {actor.name}
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-accent-cyan font-bold">{actor.incidentCount}</span>{' '}
                  <span className="text-[10px] text-text-muted">INCIDENTS</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-text-secondary">
                <div>
                  <span className="text-text-muted">THEATERS / COUNTRIES:</span>{' '}
                  <span className="text-text-primary">
                    {Array.from(actor.countries).join(', ') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">LINKED FATALITIES:</span>{' '}
                  <span className="text-severity-critical font-bold">{actor.fatalities}</span>
                </div>
              </div>

              {/* Sample Recent Incidents */}
              <div className="pt-1">
                <div className="text-[9px] text-text-muted mb-1">// RECENT INVOLVEMENT</div>
                <div className="space-y-1">
                  {actor.recentIncidents.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="w-full text-left p-1.5 bg-panel hover:bg-panel-hover border border-border/50 text-[10px] text-text-secondary hover:text-text-primary truncate transition-colors flex items-center justify-between"
                    >
                      <span className="truncate">
                        [{ev.eventDate}] {ev.eventType} in {ev.location}
                      </span>
                      <span className="text-accent-cyan text-[9px] ml-2">INSPECT &rarr;</span>
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
