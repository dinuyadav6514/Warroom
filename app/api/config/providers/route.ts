import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CacheService } from '@/lib/data/cache';

export const dynamic = 'force-dynamic';

export interface ProviderConfigInfo {
  id: string;
  name: string;
  envVar: string;
  hasCustomKey: boolean;
  isStreaming: boolean;
  requiresKey: boolean;
  streamSource: string;
  docsUrl: string;
  description: string;
  tier: 'EXPANSION_WIRE' | 'OPEN_ZERO_KEY' | 'AI_ENGINE';
}

const PROVIDERS_METADATA: ProviderConfigInfo[] = [
  {
    id: 'guardian',
    name: 'The Guardian',
    envVar: 'GUARDIAN_API_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'The Guardian World News Live RSS Stream',
    docsUrl: 'https://open-platform.theguardian.com/access/',
    description: 'Frontline international correspondents & verified geopolitical investigations.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'gnews',
    name: 'GNews (Google News)',
    envVar: 'GNEWS_API_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'Google News Global Conflict & Security Feed',
    docsUrl: 'https://gnews.io/',
    description: 'Real-time headline aggregator across 60,000+ publications.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'newsapi_org',
    name: 'NewsAPI (BBC Wire)',
    envVar: 'NEWSAPI_ORG_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'BBC World News Live Wire Feed',
    docsUrl: 'https://newsapi.org/',
    description: '80,000+ global news publishers & international wire feeds.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'newsdata',
    name: 'NewsData (Al Jazeera)',
    envVar: 'NEWSDATA_IO_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'Al Jazeera World Real-Time Intelligence Stream',
    docsUrl: 'https://newsdata.io/',
    description: 'Global multilingual conflict and breaking news data engine.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'worldnews',
    name: 'World News (France24)',
    envVar: 'WORLDNEWS_API_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'France24 International Crisis & Conflict Stream',
    docsUrl: 'https://worldnewsapi.com/',
    description: 'Geolocated international news search & sentiment feed.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'newsapi_ai',
    name: 'NewsAPI.ai (Deutsche Welle)',
    envVar: 'NEWSAPI_AI_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'Deutsche Welle World Conflict & Defense Stream',
    docsUrl: 'https://newsapi.ai/',
    description: 'AI-classified world events, armed clashes & political crises.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'currents',
    name: 'Currents (Sky News)',
    envVar: 'CURRENTS_API_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'Sky News World Live Stream',
    docsUrl: 'https://currentsapi.services/',
    description: 'Real-time multilingual global news feed.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'mediastack',
    name: 'Mediastack (VOA News)',
    envVar: 'MEDIASTACK_API_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'Voice of America Global Conflict Wire',
    docsUrl: 'https://mediastack.com/',
    description: 'Worldwide live news across 50+ countries.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'freenewsapi',
    name: 'FreeNewsApi (The Independent)',
    envVar: 'FREENEWSAPI_KEY',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'The Independent World Dispatch Stream',
    docsUrl: 'https://freenewsapi.com/',
    description: 'Global news aggregator for breaking conflict reports.',
    tier: 'EXPANSION_WIRE',
  },
  {
    id: 'gdelt',
    name: 'GDELT 2.0 Global Knowledge Graph',
    envVar: '',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'GDELT 2.0 Doc-API Media Knowledge Graph',
    docsUrl: 'https://www.gdeltproject.org/',
    description: 'Real-time open media knowledge graph indexing global broadcasts.',
    tier: 'OPEN_ZERO_KEY',
  },
  {
    id: 'reliefweb',
    name: 'UN OCHA ReliefWeb',
    envVar: '',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'UN OCHA ReliefWeb Reports REST API',
    docsUrl: 'https://reliefweb.int/',
    description: 'Official UN humanitarian situation reports and conflict assessments.',
    tier: 'OPEN_ZERO_KEY',
  },
  {
    id: 'hackernews',
    name: 'Hacker News Global Wire',
    envVar: '',
    hasCustomKey: false,
    isStreaming: true,
    requiresKey: false,
    streamSource: 'Hacker News Algolia Real-Time Intelligence API',
    docsUrl: 'https://hn.algolia.com/api',
    description: 'Open real-time tech, cybersecurity, and geopolitical dispatch wire.',
    tier: 'OPEN_ZERO_KEY',
  },
  {
    id: 'gemini',
    name: 'Google Gemini 2.0 Flash AI',
    envVar: 'GEMINI_API_KEY',
    hasCustomKey: false,
    isStreaming: false,
    requiresKey: true,
    streamSource: 'Google AI Studio REST API',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    description: 'AI Defense Analyst reasoning engine & SitRep generator.',
    tier: 'AI_ENGINE',
  },
];

function updateEnvLocalFile(key: string, value?: string) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    const lines = content.split(/\r?\n/);
    let keyFound = false;

    const newLines = lines
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}=`)) {
          keyFound = true;
          return value ? `${key}=${value}` : null;
        }
        return line;
      })
      .filter((l): l is string => l !== null);

    if (!keyFound && value) {
      newLines.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, newLines.join('\n').trim() + '\n', 'utf-8');
  } catch (err) {
    console.warn('[Config] Could not write to .env.local file:', err);
  }
}

export async function GET() {
  const list = PROVIDERS_METADATA.map((p) => {
    if (p.tier === 'AI_ENGINE') {
      const val = process.env.GEMINI_API_KEY;
      const isSet = Boolean(val && val.trim().length > 0);
      return { ...p, hasCustomKey: isSet, isStreaming: isSet };
    }

    if (p.envVar) {
      const val = process.env[p.envVar];
      const isSet = Boolean(val && val.trim().length > 0);
      return { ...p, hasCustomKey: isSet, isStreaming: true };
    }

    return { ...p, hasCustomKey: false, isStreaming: true };
  });

  const newsPipelines = list.filter((p) => p.tier !== 'AI_ENGINE');
  const activePipelinesCount = newsPipelines.filter((p) => p.isStreaming).length;

  return NextResponse.json({
    success: true,
    totalPipelines: newsPipelines.length,
    configuredCount: activePipelinesCount,
    providers: list,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { envVar, apiKey } = body;

    if (!envVar || typeof envVar !== 'string') {
      return NextResponse.json({ success: false, error: 'envVar is required' }, { status: 400 });
    }

    const providerDef = PROVIDERS_METADATA.find((p) => p.envVar === envVar);
    if (!providerDef) {
      return NextResponse.json({ success: false, error: 'Unknown provider envVar' }, { status: 400 });
    }

    const cleanKey = apiKey ? String(apiKey).trim() : '';

    if (cleanKey) {
      process.env[envVar] = cleanKey;
      updateEnvLocalFile(envVar, cleanKey);
    } else {
      delete process.env[envVar];
      updateEnvLocalFile(envVar, undefined);
    }

    // Invalidate cached records to trigger immediate live ingestion
    CacheService.clear();

    return NextResponse.json({
      success: true,
      message: cleanKey
        ? `API Key for ${providerDef.name} saved and activated.`
        : `Custom API Key for ${providerDef.name} cleared. Reverted to hardcoded live stream.`,
      envVar,
      hasCustomKey: Boolean(cleanKey),
      isStreaming: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update key';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
