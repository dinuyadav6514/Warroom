import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { FreeNewsApiProvider } from '@/lib/providers/freenewsapi.provider';
import { CurrentsNewsProvider } from '@/lib/providers/currents.provider';
import { NewsApiOrgProvider } from '@/lib/providers/newsapi.provider';
import { GNewsProvider } from '@/lib/providers/gnews.provider';
import { NewsDataIoProvider } from '@/lib/providers/newsdata.provider';
import { WorldNewsApiProvider } from '@/lib/providers/worldnews.provider';
import { NewsApiAiProvider } from '@/lib/providers/newsapi-ai.provider';
import { MediastackProvider } from '@/lib/providers/mediastack.provider';
import { GuardianProvider } from '@/lib/providers/guardian.provider';
import { HackerNewsProvider } from '@/lib/providers/hackernews.provider';
import { GDELTProvider } from '@/lib/providers/gdelt.provider';
import { ReliefWebProvider } from '@/lib/providers/reliefweb.provider';
import { getRecentDateRange } from '@/lib/data/date-utils';
import { classifyEvent } from '@/lib/classification/event-classifier';
import { mergeSimilarStories } from '@/lib/aggregation/story-merging';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerName = (searchParams.get('provider') || 'all').toLowerCase();
  const dateRange = getRecentDateRange(10);

  const providerMap: Record<string, { name: string; run: () => Promise<any> }> = {
    freenewsapi: {
      name: 'FreeNewsApi',
      run: () => new FreeNewsApiProvider().fetchRecentEvents(dateRange),
    },
    currents: {
      name: 'Currents News API',
      run: () => new CurrentsNewsProvider().fetchRecentEvents(dateRange),
    },
    newsapi: {
      name: 'NewsAPI.org',
      run: () => new NewsApiOrgProvider().fetchRecentEvents(dateRange),
    },
    gnews: {
      name: 'GNews API',
      run: () => new GNewsProvider().fetchRecentEvents(dateRange),
    },
    newsdata: {
      name: 'NewsData.io',
      run: () => new NewsDataIoProvider().fetchRecentEvents(dateRange),
    },
    worldnews: {
      name: 'World News API',
      run: () => new WorldNewsApiProvider().fetchRecentEvents(dateRange),
    },
    'newsapi-ai': {
      name: 'NewsAPI.ai (Event Registry)',
      run: () => new NewsApiAiProvider().fetchRecentEvents(dateRange),
    },
    mediastack: {
      name: 'Mediastack',
      run: () => new MediastackProvider().fetchRecentEvents(dateRange),
    },
    guardian: {
      name: 'The Guardian Open Platform',
      run: () => new GuardianProvider().fetchRecentEvents(dateRange),
    },
    hackernews: {
      name: 'Hacker News API',
      run: () => new HackerNewsProvider().fetchRecentEvents(dateRange),
    },
    gdelt: {
      name: 'GDELT 2.0 Global Media Pipeline',
      run: () => new GDELTProvider().fetchRecentArticles(dateRange),
    },
    reliefweb: {
      name: 'UN OCHA ReliefWeb',
      run: () => new ReliefWebProvider().fetchRecentReports(dateRange),
    },
  };

  try {
    if (providerName === 'classifier') {
      const testCases = [
        {
          title: 'Missile strike and heavy artillery shelling reported along frontline outside Pokrovsk',
          expectedCategory: 'Warfare & Combat',
        },
        {
          title: 'Pentagon signs $2.4B defense procurement contract for Patriot missile interceptors and radar systems',
          expectedCategory: 'Defense & Strategy',
        },
        {
          title: 'UN Security Council convenes emergency bilateral diplomatic summit to negotiate ceasefire resolution',
          expectedCategory: 'Geopolitics & Policy',
        },
        {
          title: 'US announces new reciprocal tariffs on electric vehicles and critical mineral supply chains',
          expectedCategory: 'Economy & Global',
        },
        {
          title: 'Doctors gather at annual conference to combat seasonal winter influenza in local clinics',
          expectedCategory: 'News/General',
        },
      ];

      const results = testCases.map((tc) => {
        const res = classifyEvent(tc.title);
        return {
          title: tc.title,
          expectedCategory: tc.expectedCategory,
          actualCategory: res.category,
          confidence: res.confidence,
          matchedWordsCount: res.matchedWordsCount,
          matchedTerms: res.matchedTerms,
          subEventType: res.subEventType,
          pass: res.category === tc.expectedCategory,
        };
      });

      return NextResponse.json({
        test: 'classifier',
        allPassed: results.every((r) => r.pass),
        results,
      });
    }

    if (providerName === 'merging') {
      const mockEvents: any[] = [
        {
          id: 'GDELT-001',
          eventDate: '2026-09-18',
          publishedAt: '2026-09-18T10:00:00Z',
          timestamp: '2026-09-18T10:00:00Z',
          country: 'Lebanon',
          location: 'Southern Suburbs of Beirut',
          latitude: 33.85,
          longitude: 35.50,
          eventType: 'Air/Drone Strike',
          subEventType: 'Airstrike',
          fatalities: 4,
          severity: 'HIGH',
          isConflict: true,
          verificationStatus: 'REPORTED',
          source: 'GDELT Project 2.0',
          sourceUrl: 'https://gdelt.org/story/1',
          primaryCategory: 'Warfare & Combat',
          categoryConfidence: 0.92,
          notes: 'Airstrike targets command center in southern Beirut suburbs, Lebanese state media reports 4 dead and several wounded.',
        },
        {
          id: 'GUARDIAN-002',
          eventDate: '2026-09-18',
          publishedAt: '2026-09-18T11:30:00Z',
          timestamp: '2026-09-18T11:30:00Z',
          country: 'Lebanon',
          location: 'Beirut, Dahieh District',
          latitude: 33.86,
          longitude: 35.51,
          eventType: 'Air/Drone Strike',
          subEventType: 'Airstrike',
          fatalities: 5,
          severity: 'HIGH',
          isConflict: true,
          verificationStatus: 'VERIFIED',
          source: 'The Guardian',
          sourceUrl: 'https://theguardian.com/world/2026/sep/18/beirut-airstrike',
          primaryCategory: 'Warfare & Combat',
          categoryConfidence: 0.94,
          notes: 'Heavy airstrike hits Dahieh district in southern Beirut suburbs causing plumes of smoke. Rescuers search rubble as 5 confirmed dead.',
        },
        {
          id: 'NEWSAPI-003',
          eventDate: '2026-09-18',
          publishedAt: '2026-09-18T12:15:00Z',
          timestamp: '2026-09-18T12:15:00Z',
          country: 'Lebanon',
          location: 'Beirut Southern Suburbs',
          latitude: 33.855,
          longitude: 35.505,
          eventType: 'Air/Drone Strike',
          subEventType: 'Airstrike',
          fatalities: 4,
          severity: 'HIGH',
          isConflict: true,
          verificationStatus: 'REPORTED',
          source: 'NewsAPI.org',
          sourceUrl: 'https://newsapi.org/article/beirut-strike',
          primaryCategory: 'Warfare & Combat',
          categoryConfidence: 0.91,
          notes: 'Explosions rock southern suburbs of Beirut following precision missile airstrike targeting operational hub.',
        },
        {
          id: 'GNEWS-004',
          eventDate: '2026-09-18',
          publishedAt: '2026-09-18T09:00:00Z',
          timestamp: '2026-09-18T09:00:00Z',
          country: 'Germany',
          location: 'Berlin',
          latitude: 52.52,
          longitude: 13.405,
          eventType: 'Strategic Developments',
          subEventType: 'Defense Procurement',
          fatalities: 0,
          severity: 'LOW',
          isConflict: false,
          verificationStatus: 'VERIFIED',
          source: 'GNews API',
          sourceUrl: 'https://gnews.io/article/berlin-defense',
          primaryCategory: 'Defense & Strategy',
          categoryConfidence: 0.88,
          notes: 'Germany announces defense procurement expansion for air defense interceptors and radar surveillance systems.',
        },
      ];

      const merged = mergeSimilarStories(mockEvents);
      const primaryStory = merged.mergedEvents.find((e) => e.country === 'Lebanon');
      const pass =
        merged.totalOriginal === 4 &&
        merged.totalUnique === 2 &&
        merged.totalMerged === 2 &&
        primaryStory?.mergedCount === 3 &&
        primaryStory?.mergedEvents?.length === 3 &&
        primaryStory?.mergedSources?.includes('The Guardian') &&
        primaryStory?.mergedSources?.includes('GDELT Project 2.0') &&
        primaryStory?.mergedSources?.includes('NewsAPI.org');

      return NextResponse.json({
        test: 'merging',
        allPassed: Boolean(pass),
        stats: {
          original: merged.totalOriginal,
          unique: merged.totalUnique,
          merged: merged.totalMerged,
        },
        primaryStory: {
          location: primaryStory?.location,
          mergedCount: primaryStory?.mergedCount,
          mergedSources: primaryStory?.mergedSources,
          subEventsCount: primaryStory?.mergedEvents?.length,
        },
      });
    }

    if (providerName === 'all') {
      const results: Record<string, any> = {};
      for (const [key, p] of Object.entries(providerMap)) {
        const start = Date.now();
        try {
          const events = await p.run();
          results[key] = {
            name: p.name,
            success: true,
            count: events.length,
            timeMs: Date.now() - start,
            sampleEvent: events[0] || null,
            hasCoordinates: events.every((e: any) => typeof e.latitude === 'number' && typeof e.longitude === 'number'),
          };
        } catch (err: any) {
          results[key] = {
            name: p.name,
            success: false,
            error: err.message,
            timeMs: Date.now() - start,
          };
        }
      }

      return NextResponse.json({
        tested: 'all',
        totalProviders: Object.keys(providerMap).length,
        timestamp: new Date().toISOString(),
        results,
      });
    }

    const selected = providerMap[providerName];
    if (!selected) {
      return NextResponse.json(
        {
          error: `Provider '${providerName}' not found. Available providers: ${Object.keys(providerMap).join(', ')}, all`,
        },
        { status: 400 }
      );
    }

    const start = Date.now();
    const events = await selected.run();
    const duration = Date.now() - start;

    return NextResponse.json({
      provider: selected.name,
      success: true,
      count: events.length,
      durationMs: duration,
      hasCoordinates: events.every((e: any) => typeof e.latitude === 'number' && typeof e.longitude === 'number'),
      events,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error executing provider test' },
      { status: 500 }
    );
  }
}
