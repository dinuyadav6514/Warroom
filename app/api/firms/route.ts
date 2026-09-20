import { NextRequest, NextResponse } from 'next/server';
import { getFirmsThermalHotspots } from '@/lib/data/firms';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true' || searchParams.get('refresh') === 'true';

    const data = await getFirmsThermalHotspots(force);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (error: any) {
    console.error('[API /api/firms] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch FIRMS satellite data',
      },
      { status: 500 }
    );
  }
}
