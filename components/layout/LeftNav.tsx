'use client';

import React from 'react';
import { FilterState, Severity, ConflictEvent, Conflict, ApiExchange } from '@/types/conflict';
import { LiveTerminalOutput } from '@/components/navigation/LiveTerminalOutput';
import { SelectedNewsDisplay } from '@/components/navigation/SelectedNewsDisplay';
import { RelationNetworkTable } from '@/components/navigation/RelationNetworkTable';
import { RelationshipNetwork, CountryRelation } from '@/lib/data/country-relationships';

export type NavView = 'WORLD' | 'CONFLICTS' | 'ESCALATION' | 'TIMELINE' | 'ACTORS' | 'SOURCES';

interface LeftNavProps {
  currentView?: NavView;
  onSelectView?: (view: NavView) => void;
  filters: FilterState;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onOpenSources?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  availableSources?: string[];
  isRefreshing?: boolean;
  lastSyncAt?: string | null;
  eventsCount?: number;
  events?: ConflictEvent[];
  apiExchange?: ApiExchange | null;
  selectedEvent?: ConflictEvent | null;
  selectedConflict?: Conflict | null;
  relationNetwork?: RelationshipNetwork | null;
  onSelectRelation?: (relation: CountryRelation) => void;
  onClearRelationNetwork?: () => void;
  onClearSelection?: () => void;
  onSelectEvent?: (event: ConflictEvent) => void;
  onOpenEventModal?: (event: ConflictEvent) => void;
  onOpenFullStream?: () => void;
}

const ALL_PIPELINES = [
  'GDELT',
  'ReliefWeb & Wires',
  'FreeNewsApi',
  'Currents News',
  'NewsAPI.org',
  'GNews',
  'NewsData.io',
  'World News API',
  'NewsAPI.ai',
  'Mediastack',
  'The Guardian',
  'Hacker News',
];

export const LeftNav: React.FC<LeftNavProps> = ({
  filters,
  onUpdateFilters,
  isOpenMobile,
  onCloseMobile,
  availableSources = ALL_PIPELINES,
  isRefreshing = false,
  lastSyncAt,
  eventsCount = 0,
  events = [],
  apiExchange,
  selectedEvent = null,
  selectedConflict = null,
  relationNetwork = null,
  onSelectRelation,
  onClearRelationNetwork,
  onClearSelection,
  onSelectEvent,
  onOpenEventModal,
  onOpenFullStream,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`w-72 sm:w-80 md:w-64 glass-panel-heavy-grain border border-white/[0.14] rounded-[28px] overflow-hidden flex flex-col font-mono text-xs select-none transition-transform z-40 fixed md:static inset-y-2 left-2 md:my-1 md:ml-3 md:mb-3 md:h-[calc(100%-16px)] shadow-[0_20px_50px_rgba(0,0,0,0.85)] ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Nav Header */}
        <div className="p-3 border-b border-white/[0.06] flex items-center justify-between text-slate-300 shrink-0 bg-white/[0.02]">
          <span className="text-cyan-300 tracking-wider text-[11px] font-sans font-bold uppercase">
            Radar &amp; Intel Nav
          </span>
          <span className="text-[9px] text-slate-500 font-mono">SYS.01</span>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 min-h-0 flex flex-col p-2 gap-2 overflow-y-auto overflow-x-hidden">
          {/* Dynamic Display: Line Relation Table when country map active, Related News when dot clicked, or Live Terminal by default */}
          <div className="flex-1 min-h-0 flex flex-col">
            {relationNetwork ? (
              <RelationNetworkTable
                network={relationNetwork}
                onSelectRelation={onSelectRelation}
                onClose={onClearRelationNetwork}
              />
            ) : selectedEvent || selectedConflict ? (
              <SelectedNewsDisplay
                event={selectedEvent}
                conflict={selectedConflict}
                onClose={() => onClearSelection?.()}
                onSelectEvent={onSelectEvent}
                onOpenEventModal={onOpenEventModal}
                allEvents={events}
              />
            ) : (
              <LiveTerminalOutput
                apiExchange={apiExchange}
                isRefreshing={isRefreshing}
                lastSyncAt={lastSyncAt}
                eventsCount={eventsCount}
                events={events}
                availableSources={availableSources}
                onSelectEvent={onSelectEvent}
                onOpenFullStream={onOpenFullStream}
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
