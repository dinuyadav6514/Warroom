import { NextRequest, NextResponse } from 'next/server';
import { runConflictSync } from '@/lib/providers';
import { isWithinWindow, isHistoricalOrStaleConflict } from '@/lib/data/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '7', 10);
    const days: 3 | 7 | 10 = daysParam === 3 ? 3 : daysParam === 10 ? 10 : 7;
    const region = searchParams.get('region');
    const sort = searchParams.get('sort') || 'activity';
    const force = searchParams.get('force') === 'true' || searchParams.get('refresh') === 'true';

    const result = await runConflictSync(days, force);

    let conflicts = result.conflicts.map((c) => ({
      ...c,
      recentEvents: c.recentEvents.filter((e) => isWithinWindow(e.eventDate, days) && !isHistoricalOrStaleConflict(e)),
    })).filter((c) => c.recentEvents.length > 0);

    if (region && region !== 'ALL') {
      conflicts = conflicts.filter((c) => c.region?.toLowerCase() === region.toLowerCase());
    }

    // Sort order handling
    conflicts.sort((a, b) => {
      if (sort === 'fatalities') {
        return b.fatalities7d - a.fatalities7d;
      }
      if (sort === 'recent') {
        const timeA = new Date(a.lastEventAt || 0).getTime();
        const timeB = new Date(b.lastEventAt || 0).getTime();
        return timeB - timeA;
      }
      if (sort === 'severity') {
        return b.intensity - a.intensity;
      }
      if (sort === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      // default: activity (event count)
      return b.eventCount7d - a.eventCount7d;
    });

    return NextResponse.json({
      success: true,
      count: conflicts.length,
      dataWindowDays: days,
      freshness: result.freshness,
      globalStats: result.globalStats,
      conflicts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
