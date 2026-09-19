import { NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';

const GDELT_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GDELT_QUERY = '("fire exchange" OR "armed clash" OR "artillery" OR "airstrike" OR "drone strike" OR "missile attack" OR "shelling" OR "troops killed" OR "soldiers killed" OR "military operation" OR "offensive launched" OR "insurgent attack")';
const RATE_LIMIT_MS = 7500;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function nodeGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: 30000,
        headers: {
          'User-Agent': GDELT_USER_AGENT,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Pragma': 'no-cache',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode || 200, body: Buffer.concat(chunks).toString('utf8') }));
        res.on('error', reject);
      }
    );
    req.on('timeout', () => req.destroy(new Error('Timeout')));
    req.on('error', reject);
    req.end();
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timespan = searchParams.get('timespan') || '240h';
  const maxrecords = searchParams.get('maxrecords') || '25';

  const params = new URLSearchParams({
    query: GDELT_QUERY,
    mode: 'ArtList',
    maxrecords,
    format: 'json',
    timespan,
    sort: 'DateDesc',
  });

  const gdeltUrl = 'https://api.gdeltproject.org/api/v2/doc/doc?' + params.toString();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log('[GDELT-Proxy] Attempt ' + (attempt + 1) + '/' + MAX_RETRIES);
      const { status, body } = await nodeGet(gdeltUrl);

      if (status === 429 || body.includes('one every 5 seconds') || body.includes('rate limit')) {
        console.warn('[GDELT-Proxy] Rate limited, waiting ' + RATE_LIMIT_MS + 'ms...');
        await sleep(RATE_LIMIT_MS);
        continue;
      }

      if (status >= 400) {
        console.error('[GDELT-Proxy] HTTP ' + status + ': ' + body.slice(0, 200));
        return NextResponse.json({ articles: [], error: 'GDELT HTTP ' + status }, { status: 200 });
      }

      let parsed: { articles?: unknown[] };
      try {
        parsed = JSON.parse(body) as { articles?: unknown[] };
      } catch {
        console.error('[GDELT-Proxy] JSON parse error:', body.slice(0, 200));
        return NextResponse.json({ articles: [] }, { status: 200 });
      }

      const articles = Array.isArray(parsed.articles) ? parsed.articles : [];
      console.log('[GDELT-Proxy] Success: ' + articles.length + ' articles');
      return NextResponse.json({ articles }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GDELT-Proxy] Error attempt ' + (attempt + 1) + ': ' + msg);
      if (attempt < MAX_RETRIES - 1) await sleep(RATE_LIMIT_MS);
    }
  }

  console.error('[GDELT-Proxy] All retries exhausted');
  return NextResponse.json({ articles: [], error: 'GDELT unreachable after retries' }, { status: 200 });
}