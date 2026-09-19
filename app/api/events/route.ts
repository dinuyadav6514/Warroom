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
    const country = searchParams.get('country');
    const severity = searchParams.get('severity');
    const eventType = searchParams.get('eventType');
    const search = searchParams.get('search')?.toLowerCase();
    const force = searchParams.get('force') === 'true' || searchParams.get('refresh') === 'true';

    const result = await runConflictSync(days, force);

    // Filter events by selected criteria AND strictly enforce recent date window and reject stale/historical spots
    let filtered = result.events.filter((e) => isWithinWindow(e.eventDate, days) && !isHistoricalOrStaleConflict(e));

    if (region && region !== 'ALL') {
      filtered = filtered.filter((e) => e.region?.toLowerCase() === region.toLowerCase());
    }

    if (country && country !== 'ALL') {
      filtered = filtered.filter((e) => e.country?.toLowerCase() === country.toLowerCase());
    }

    if (severity && severity !== 'ALL') {
      filtered = filtered.filter((e) => e.severity === severity);
    }

    if (eventType && eventType !== 'ALL') {
      filtered = filtered.filter((e) => e.eventType?.toLowerCase().includes(eventType.toLowerCase()));
    }

    if (search && search.trim() !== '') {
      filtered = filtered.filter((e) => {
        return (
          (e.location && e.location.toLowerCase().includes(search)) ||
          (e.country && e.country.toLowerCase().includes(search)) ||
          (e.actor1 && e.actor1.toLowerCase().includes(search)) ||
          (e.actor2 && e.actor2.toLowerCase().includes(search)) ||
          (e.notes && e.notes.toLowerCase().includes(search)) ||
          (e.id && e.id.toLowerCase().includes(search))
        );
      });
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      dataWindowDays: days,
      freshness: result.freshness,
      events: filtered,
      allEvents: result.allEvents || result.events,
      apiExchange: result.apiExchange,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
