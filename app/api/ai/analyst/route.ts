import { NextRequest, NextResponse } from 'next/server';
import { runConflictSync } from '@/lib/providers';
import { askIntelligenceAnalyst, generateGlobalSitRep } from '@/lib/ai/analyst';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { query, mode = 'QUERY', days = 10 } = body;

    // Read user's key from request header (set by browser from localStorage)
    const userApiKey = request.headers.get('X-Gemini-Key') || undefined;

    const validDays = days === 3 ? 3 : days === 7 ? 7 : 10;
    const syncResult = await runConflictSync(validDays);

    const { events, conflicts, globalStats } = syncResult;

    if (mode === 'SITREP') {
      const sitrep = await generateGlobalSitRep(events, conflicts, globalStats, userApiKey);
      return NextResponse.json({
        success: true,
        mode: 'SITREP',
        sitrep,
      });
    }

    // Default: Natural language intelligence analyst query
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Query string is required for QUERY mode' },
        { status: 400 }
      );
    }

    const analystResult = await askIntelligenceAnalyst(query.trim(), events, conflicts, userApiKey);

    return NextResponse.json({
      success: true,
      mode: 'QUERY',
      query: query.trim(),
      result: analystResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI Analyst service error';
    console.error('[API/AI/Analyst] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}