/**
 * GDELT (Global Database of Events, Language, and Tone) Provider
 *
 * Fetches live conflict articles from the GDELT 2.0 API and converts
 * them into ConflictEvent objects for the WarRoom intelligence pipeline.
 *
 * Key engineering features:
 * - Uses HTTP (port 80) to avoid TLS handshake hangs on Windows/restricted networks
 * - Module-level rate-limiter ensuring >= 6.5 seconds between outbound requests
 * - 15-minute in-memory caching to prevent redundant upstream calls
 * - Browser User-Agent spoofing
 * - Automatic retry with 7-second backoff on rate-limit warnings ("one every 5 seconds")
 */

import http from 'http';
import { ConflictEvent, FilterState } from '@/types/conflict';
import { DateRangeQuery, ConflictDataProvider } from '@/types/provider';
import { calculateSeverity } from '../scoring/severity';
import { isWithinWindow, isHistoricalOrStaleConflict } from '../data/date-utils';

// --- Country centroid coordinates ---
const COUNTRY_COORDS: Record<string, [number, number]> = {
  ukraine: [48.3794, 31.1656],
  russia: [61.524, 105.3188],
  israel: [31.0461, 34.8516],
  palestine: [31.9522, 35.2332],
  gaza: [31.3547, 34.3088],
  'west bank': [31.9, 35.2],
  lebanon: [33.8547, 35.8623],
  syria: [34.8021, 38.9968],
  yemen: [15.5527, 48.5164],
  iraq: [33.2232, 43.6793],
  iran: [32.4279, 53.688],
  sudan: [12.8628, 30.2176],
  'south sudan': [6.877, 31.307],
  ethiopia: [9.145, 40.4897],
  somalia: [5.1521, 46.1996],
  nigeria: [9.082, 8.6753],
  mali: [17.5707, -3.9962],
  'burkina faso': [12.3641, -1.5197],
  niger: [17.607, 8.0817],
  chad: [15.4542, 18.7322],
  'democratic republic of congo': [-4.0383, 21.7587],
  'dr congo': [-4.0383, 21.7587],
  drc: [-4.0383, 21.7587],
  congo: [-4.0383, 21.7587],
  mozambique: [-18.6657, 35.5296],
  cameroon: [3.848, 11.5021],
  libya: [26.3351, 17.2283],
  kenya: [-0.0236, 37.9062],
  myanmar: [21.9162, 95.956],
  pakistan: [30.3753, 69.3451],
  afghanistan: [33.9391, 67.71],
  india: [20.5937, 78.9629],
  philippines: [12.8797, 121.774],
  colombia: [4.5709, -74.2973],
  mexico: [23.6345, -102.5528],
  haiti: [18.9712, -72.2852],
  venezuela: [6.4238, -66.5897],
  ecuador: [-1.8312, -78.1834],
  taiwan: [23.6978, 120.9605],
  china: [35.8617, 104.1954],
  'north korea': [40.3399, 127.5101],
  georgia: [42.3154, 43.3569],
  armenia: [40.0691, 45.0382],
  azerbaijan: [40.1431, 47.5769],
  turkey: [38.9637, 35.2433],
  'saudi arabia': [23.8859, 45.0792],
  bangladesh: [23.685, 90.3563],
  indonesia: [-0.7893, 113.9213],
  thailand: [15.87, 100.9925],
  'central african republic': [6.6111, 20.9394],
  burundi: [-3.3731, 29.9189],
  rwanda: [-1.9403, 29.8739],
  kosovo: [42.6026, 20.903],
  serbia: [44.0165, 21.0059],
  belarus: [53.7098, 27.9534],
  moldova: [47.4116, 28.3699],
  kazakhstan: [48.0196, 66.9237],
  tajikistan: [38.861, 71.2761],
  kyrgyzstan: [41.2044, 74.7661],
  brazil: [-14.235, -51.9253],
  honduras: [15.1999, -86.2419],
};

function extractCountryFromText(text: string): { country: string; lat: number; lon: number } | null {
  const lower = text.toLowerCase();
  const sortedKeys = Object.keys(COUNTRY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lower.includes(key)) {
      const [lat, lon] = COUNTRY_COORDS[key];
      const country = key
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return { country, lat, lon };
    }
  }
  return null;
}

function parseGdeltDate(seendate: string): string {
  if (seendate && seendate.length >= 15) {
    const y = seendate.slice(0, 4);
    const mo = seendate.slice(4, 6);
    const d = seendate.slice(6, 8);
    const h = seendate.slice(9, 11);
    const mi = seendate.slice(11, 13);
    const s = seendate.slice(13, 15);
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  }
  return new Date().toISOString();
}

// Keywords that indicate a kinetic/violent conflict event.
// Used to set the isConflict flag (red dot vs. dark blue dot on map).
const CONFLICT_KEYWORDS = [
  'airstrike', 'air strike', 'drone strike', 'drone attack',
  'missile', 'rocket', 'shelling', 'artillery', 'bombardment',
  'explosion', 'blast', 'bomb', 'bombing',
  'clash', 'clashes', 'battle', 'offensive', 'assault',
  'attack', 'ambush', 'raid',
  'killed', 'dead', 'fatalities', 'casualties',
  'massacre', 'gunfire', 'sniper', 'mortar',
  'troops', 'soldiers', 'fighters', 'militant', 'insurgent', 'rebel',
  'fire exchange', 'cross-border', 'frontline', 'warfare',
] as const;

/**
 * Returns true if the title indicates a kinetic/violent conflict event.
 * Non-kinetic articles (speeches, summits, sanctions, etc.) return false
 * and will be shown as dark blue "general news" dots on the map.
 */
function isConflictEvent(title: string): boolean {
  const lower = title.toLowerCase();
  return CONFLICT_KEYWORDS.some((kw) => lower.includes(kw));
}

function inferEventType(title: string): { eventType: string; subEventType: string } {
  const t = title.toLowerCase();
  if (t.includes('airstrike') || t.includes('air strike') || t.includes('drone strike') || t.includes('drone attack')) {
    return { eventType: 'Air/Drone Strike', subEventType: 'Air strike' };
  }
  if (t.includes('missile') || t.includes('rocket')) {
    return { eventType: 'Explosions/Remote Violence', subEventType: 'Missile attack' };
  }
  if (t.includes('shelling') || t.includes('artillery') || t.includes('bombardment')) {
    return { eventType: 'Explosions/Remote Violence', subEventType: 'Shelling/artillery/mortar' };
  }
  if (t.includes('explosion') || t.includes('blast') || t.includes('bomb')) {
    return { eventType: 'Explosions/Remote Violence', subEventType: 'Explosion' };
  }
  if (t.includes('clash') || t.includes('battle') || t.includes('offensive') || t.includes('assault')) {
    return { eventType: 'Battles', subEventType: 'Armed clash' };
  }
  if (t.includes('attack') || t.includes('ambush') || t.includes('raid')) {
    return { eventType: 'Battles', subEventType: 'Attack' };
  }
  if (t.includes('civilian') || t.includes('massacre') || t.includes('killing')) {
    return { eventType: 'Violence Against Civilians', subEventType: 'Attack' };
  }
  if (t.includes('ceasefire') || t.includes('truce')) {
    return { eventType: 'Strategic Development', subEventType: 'Ceasefire agreement' };
  }
  if (t.includes('sanction') || t.includes('diplomat') || t.includes('summit') || t.includes('treaty') || t.includes('agreement')) {
    return { eventType: 'Diplomatic', subEventType: 'Diplomatic event' };
  }
  if (t.includes('speech') || t.includes('statement') || t.includes('address') || t.includes('declared') || t.includes('announced')) {
    return { eventType: 'Statement/Speech', subEventType: 'Official statement' };
  }
  // Generic news articles
  return { eventType: 'News/General', subEventType: 'News report' };
}

function estimateFatalities(title: string): number {
  const numMatch = title.match(/(\d+)\s*(?:killed|dead|fatalities|casualties|troops?|soldiers?|fighters?)/i);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    return isNaN(n) ? 0 : Math.min(n, 500);
  }
  if (/\b(massacre|dozens?|scores?|hundreds?)\b/i.test(title)) return 15;
  if (/\bseveral\b/i.test(title)) return 4;
  if (/\bmultiple\b/i.test(title)) return 3;
  return 0;
}

interface GdeltArticle {
  title: string;
  url: string;
  seendate?: string;
  domain?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

// Module-level rate limiting & caching variables
let lastGdeltCallTime = 0;
const MIN_GDELT_INTERVAL_MS = 6500; // GDELT strictly enforces >= 5 seconds
const CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute cache
let cachedEvents: ConflictEvent[] = [];
let cacheTimestamp = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs an HTTP GET request to the GDELT 2.0 API with browser headers.
 * Uses HTTP (port 80) for rock-solid connection reliability.
 */
function httpGet(urlStr: string, timeoutMs = 15000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: 80,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: timeoutMs,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          Connection: 'close',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 200,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
        res.on('error', reject);
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`GDELT request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
    req.end();
  });
}

export class GDELTProvider implements ConflictDataProvider {
  readonly name = 'GDELT 2.0 Global Media Pipeline';

  // GDELT 2.0 API endpoint (HTTP port 80 avoids TLS handshake drops)
  private static readonly API_URL = 'http://api.gdeltproject.org/api/v2/doc/doc';
  // Broad geopolitical query: covers conflict, diplomacy, politics, and general world news in monitored regions.
  // Avoids 3-letter words which GDELT rejects ("The specified phrase is too short").
  private static readonly QUERY =
    '("fire exchange" OR "armed clash" OR "artillery" OR "warfare" OR "airstrike" OR "military strike" OR "offensive" OR "diplomatic" OR "sanctions" OR "ceasefire" OR "summit" OR "military" OR "troops" OR "president" OR "minister")';
  private static readonly MAX_RETRIES = 3;

  isConfigured(): boolean {
    return true;
  }

  async getRecentEvents(query: DateRangeQuery, _filters?: Partial<FilterState>): Promise<ConflictEvent[]> {
    return this.fetchRecentArticles(query);
  }

  async getEventDetails(id: string): Promise<ConflictEvent | null> {
    const match = cachedEvents.find((e) => e.id === id);
    return match || null;
  }

  async fetchRecentArticles(_query?: DateRangeQuery): Promise<ConflictEvent[]> {
    // Return cached events if fresh
    if (cachedEvents.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      console.log(`[GDELT] Serving ${cachedEvents.length} events from in-memory cache.`);
      return cachedEvents;
    }

    const params = new URLSearchParams({
      query: GDELTProvider.QUERY,
      mode: 'ArtList',
      maxrecords: '50',
      format: 'json',
      timespan: '24h',
      sort: 'DateDesc',
    });

    const fullUrl = `${GDELTProvider.API_URL}?${params.toString()}`;

    for (let attempt = 0; attempt < GDELTProvider.MAX_RETRIES; attempt++) {
      // Respect the 5-second rate-limit window globally
      const elapsedSinceLastCall = Date.now() - lastGdeltCallTime;
      if (elapsedSinceLastCall < MIN_GDELT_INTERVAL_MS) {
        const waitMs = MIN_GDELT_INTERVAL_MS - elapsedSinceLastCall;
        console.log(`[GDELT] Enforcing rate-limit interval: waiting ${waitMs}ms...`);
        await sleep(waitMs);
      }

      try {
        console.log(`[GDELT] Requesting live feed (attempt ${attempt + 1}/${GDELTProvider.MAX_RETRIES})...`);
        lastGdeltCallTime = Date.now();

        const { status, body } = await httpGet(fullUrl, 15000);

        // Check rate-limit response signals
        if (status === 429 || body.includes('one every 5 seconds') || body.includes('limit requests')) {
          console.warn(`[GDELT] Rate limit triggered. Backing off 7000ms before retry...`);
          await sleep(7000);
          continue;
        }

        if (status !== 200) {
          console.warn(`[GDELT] Non-200 status (${status}): ${body.slice(0, 150)}`);
          await sleep(5000);
          continue;
        }

        let data: GdeltResponse;
        try {
          data = JSON.parse(body) as GdeltResponse;
        } catch {
          console.warn(`[GDELT] Failed to parse JSON response: ${body.slice(0, 200)}`);
          return cachedEvents;
        }

        const articles = data.articles || [];
        console.log(`[GDELT] Successfully received ${articles.length} raw articles.`);

        const events = this.convertArticlesToEvents(articles);
        if (events.length > 0) {
          cachedEvents = events;
          cacheTimestamp = Date.now();
        }

        return events;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[GDELT] Network error on attempt ${attempt + 1}: ${msg}`);
        if (attempt < GDELTProvider.MAX_RETRIES - 1) {
          await sleep(6500);
        }
      }
    }

    console.warn('[GDELT] All attempts exhausted, returning cached/empty events.');
    return cachedEvents;
  }

  private convertArticlesToEvents(articles: GdeltArticle[]): ConflictEvent[] {
    const events: ConflictEvent[] = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      if (!article.title || !article.url) continue;

      const loc =
        extractCountryFromText(article.title) ||
        (article.sourcecountry ? extractCountryFromText(article.sourcecountry) : null);

      if (!loc) continue;

      const isoDate = article.seendate ? parseGdeltDate(article.seendate) : new Date().toISOString();
      const eventDate = isoDate.slice(0, 10);

      if (!isWithinWindow(eventDate, 10)) continue;

      const conflict = isConflictEvent(article.title);
      const { eventType, subEventType } = inferEventType(article.title);
      const fatalities = conflict ? estimateFatalities(article.title) : 0;

      const severityDetail = calculateSeverity({
        fatalities,
        eventType,
        subEventType,
        eventDate,
        timestamp: isoDate,
      });

      const event: ConflictEvent = {
        id: `GDELT-${i.toString().padStart(3, '0')}-${Date.now()}`,
        eventDate,
        publishedAt: isoDate,
        timestamp: isoDate,
        country: loc.country,
        location: loc.country,
        latitude: loc.lat + (Math.random() - 0.5) * 0.4,
        longitude: loc.lon + (Math.random() - 0.5) * 0.4,
        eventType,
        subEventType,
        fatalities,
        severity: severityDetail.severity,
        isConflict: conflict,
        verificationStatus: 'REPORTED',
        source: article.domain || 'GDELT Global Wire',
        sourceUrl: article.url,
        notes: conflict
          ? `${article.title}. Real-time conflict report via GDELT Project Global Knowledge Graph. Outlet: ${article.domain || 'GDELT'}. Assessment: ${severityDetail.explanation}.`
          : `${article.title}. Latest geopolitical news dispatch via GDELT Project Global Media Monitor. Outlet: ${article.domain || 'GDELT'}.`,
      };

      if (isHistoricalOrStaleConflict(event)) continue;

      events.push(event);
    }

    const conflictCount = events.filter((e) => e.isConflict).length;
    console.log(`[GDELT] Converted ${events.length} events (${conflictCount} conflict, ${events.length - conflictCount} general news).`);
    return events;
  }
}