import { NextRequest, NextResponse } from 'next/server';
import { getLiveMilitaryAviation } from '@/lib/data/military-aviation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true' || searchParams.get('refresh') === 'true';

    const data = await getLiveMilitaryAviation(force);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60',
      },
    });
  } catch (error: any) {
    console.error('[API /api/aviation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch military aviation feed',
      },
      { status: 500 }
    );
  }
}
