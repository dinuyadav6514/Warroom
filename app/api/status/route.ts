import { NextResponse } from 'next/server';
import { getActiveProvider } from '@/lib/providers';
import { CacheService } from '@/lib/data/cache';

export async function GET() {
  const { isConfigured } = getActiveProvider();
  const cached = CacheService.getCache();

  const hasAiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

  return NextResponse.json({
    application: 'WARROOM',
    version: '0.1.0',
    title: 'GLOBAL CONFLICT INTELLIGENCE TERMINAL',
    dataConfig: {
      provider: 'GDELT 2.0 + UN RELIEFWEB (LIVE NEWS PIPELINE)',
      status: 'LIVE',
      isConfigured: true,
      hasAiKey,
      lastSyncAt: cached.lastSyncAt || 'NONE',
      lastEventAt: cached.lastEventAt || 'NONE',
      cachedRecordsCount: cached.events.length,
      cacheFreshnessTtlHours: 4.5,
    },
    systemNotice: 'Terminal operational. Conflict news discovered via open media pipelines without Gemini API dependency.',
  });
}
