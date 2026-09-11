import { Conflict, ConflictEvent, GlobalOverviewStats } from '@/types/conflict';

/**
 * Calculates global high-level overview metrics from the current dynamic window dataset.
 */
export function calculateGlobalOverviewStats(
  conflicts: Conflict[],
  events: ConflictEvent[]
): GlobalOverviewStats {
  const activeConflictAreas = conflicts.length;

  // Distinct regions with significant activity
  const regionCounts = new Map<string, number>();
  for (const c of conflicts) {
    if (c.region) {
      regionCounts.set(c.region, (regionCounts.get(c.region) || 0) + c.eventCount7d);
    }
  }

  // Regions with >= 5 events considered high-activity
  let highActivityRegions = 0;
  for (const count of regionCounts.values()) {
    if (count >= 5) highActivityRegions++;
  }
  if (highActivityRegions === 0 && regionCounts.size > 0) {
    highActivityRegions = regionCounts.size;
  }

  const recentIncidents = events.length;

  let fatalitiesReported = 0;
  for (const ev of events) {
    fatalitiesReported += ev.fatalities || 0;
  }

  const escalatingAreas = conflicts.filter(
    (c) => c.status === 'ESCALATING' || c.escalationTrend === 'UP'
  ).length;

  return {
    activeConflictAreas,
    highActivityRegions,
    recentIncidents,
    fatalitiesReported,
    escalatingAreas,
  };
}
