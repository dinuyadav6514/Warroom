import { NextRequest, NextResponse } from 'next/server';
import { runConflictSync } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const daysParam = parseInt(body.days || '7', 10);
    const days: 3 | 7 | 10 = daysParam === 3 ? 3 : daysParam === 10 ? 10 : 7;

    // Force live request to Gemini API (bypassing cache)
    const result = await runConflictSync(days, true);

    return NextResponse.json({
      success: true,
      syncTimestamp: new Date().toISOString(),
      freshness: result.freshness,
      totalEvents: result.events.length,
      totalConflicts: result.conflicts.length,
      globalStats: result.globalStats,
      events: result.events,
      conflicts: result.conflicts,
      apiExchange: result.apiExchange,
      error: result.error,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = parseInt(searchParams.get('days') || '7', 10);
    const days: 3 | 7 | 10 = daysParam === 3 ? 3 : daysParam === 10 ? 10 : 7;

    // Force live request to Gemini API (bypassing cache)
    const result = await runConflictSync(days, true);

    return NextResponse.json({
      success: true,
      syncTimestamp: new Date().toISOString(),
      freshness: result.freshness,
      totalEvents: result.events.length,
      totalConflicts: result.conflicts.length,
      globalStats: result.globalStats,
      events: result.events,
      conflicts: result.conflicts,
      apiExchange: result.apiExchange,
      error: result.error,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
