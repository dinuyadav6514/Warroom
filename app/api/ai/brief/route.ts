import { NextRequest, NextResponse } from 'next/server';
import { runConflictSync, getActiveProvider } from '@/lib/providers';
import { generateConflictBrief } from '@/lib/ai/summarizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { conflictId, days = 7 } = body;

    if (!conflictId) {
      return NextResponse.json({ success: false, error: 'conflictId is required' }, { status: 400 });
    }

    // Read user's key from request header (set by browser from localStorage)
    const userApiKey = request.headers.get('X-Gemini-Key') || undefined;

    const syncResult = await runConflictSync(days === 3 ? 3 : days === 10 ? 10 : 7);
    const conflict = syncResult.conflicts.find((c) => c.id === conflictId);

    if (!conflict) {
      return NextResponse.json(
        { success: false, error: 'Conflict not found in current active window' },
        { status: 404 }
      );
    }

    const brief = await generateConflictBrief(conflict, days, userApiKey);

    return NextResponse.json({
      success: true,
      conflictId,
      brief,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI service error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
