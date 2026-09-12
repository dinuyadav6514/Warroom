/**
 * UCDP (Uppsala Conflict Data Program) GED Provider
 *
 * Fetches georeferenced conflict events from the UCDP GED API v26.1
 * and converts them into ConflictEvent objects for the WarRoom intelligence pipeline.
 *
 * UCDP GED is a scholarly conflict database maintained by Uppsala University (Sweden)
 * that provides detailed, verified records of armed conflict incidents worldwide.
 *
 * API endpoint: https://ucdpapi.pcr.uu.se/api/gedevents/26.1
 * No API key required — free public REST API.
 *
 * Key engineering notes:
 * - UCDP data is verified/curated, not real-time. Coverage is up to ~2025.
 * - We fetch the most recent year's events and filter by the rolling 10-day window.
 * - Results are deduplicated against live GDELT/ReliefWeb events in the sync engine.
 * - Each event includes exact lat/lng from UCDP's georeferenced database.
 */

import https from 'https';
import { ConflictEvent } from '@/types/conflict';
import { calculateSeverity } from '../scoring/severity';
import { isWithinWindow, isHistoricalOrStaleConflict } from '../data/date-utils';

const UCDP_API_BASE = 'https://ucdpapi.pcr.uu.se/api/gedevents/26.1';
const PAGE_SIZE = 200;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6-hour cache

let cachedEvents: ConflictEvent[] = [];
let cacheTimestamp = 0;

const UCDP_EVENT_TYPE_MAP: Record<number, { eventType: string; subEventType: string }> = {
  1: { eventType: 'Battles', subEventType: 'Government vs. rebels' },
  2: { eventType: 'Battles', subEventType: 'Government vs. militias' },
  3: { eventType: 'Battles', subEventType: 'Government vs. civilians' },
  4: { eventType: 'Battles', subEventType: 'Rebel vs. rebel' },
  5: { eventType: 'Battles', subEventType: 'Rebel vs. civilians' },
  6: { eventType: 'Violence Against Civilians', subEventType: 'One-sided violence' },
};

const UCDP_COUNTRY_COORDS: Record<string, [number, number]> = {
  ukraine: [48.3794, 31.1656],
  russia: [61.524, 105.3188],
  israel: [31.0461, 34.8516],
  myanmar: [21.9162, 95.956],
  sudan: [12.8628, 30.2176],
  'south sudan': [6.877, 31.307],
  ethiopia: [9.145, 40.4897],
  somalia: [5.1521, 46.1996],
  mali: [17.5707, -3.9962],
  nigeria: [9.082, 8.6753],
  'democratic republic of the congo': [-4.0383, 21.7587],
  'dr congo': [-4.0383, 21.7587],
  mozambique: [-18.6657, 35.5296],
  afghanistan: [33.9391, 67.71],
  pakistan: [30.3753, 69.3451],
  iraq: [33.2232, 43.6793],
  syria: [34.8021, 38.9968],
  yemen: [15.5527, 48.5164],
  colombia: [4.5709, -74.2973],
  mexico: [23.6345, -102.5528],
  haiti: [18.9712, -72.2852],
  philippines: [12.8797, 121.774],
  cameroon: [3.848, 11.5021],
  'central african republic': [6.6111, 20.9394],
  chad: [15.4542, 18.7322],
  niger: [17.607, 8.0817],
  'burkina faso': [12.3641, -1.5197],
  libya: [26.3351, 17.2283],
  kenya: [-0.0236, 37.9062],
  burundi: [-3.3731, 29.9189],
  india: [20.5937, 78.9629],
  bangladesh: [23.685, 90.3563],
  iran: [32.4279, 53.688],
  turkey: [38.9637, 35.2433],
};

function getFallbackCoords(country: string): [number, number] | null {
  const key = country.toLowerCase();
  for (const [k, v] of Object.entries(UCDP_COUNTRY_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

interface UcdpEvent {
  id: number;
  conflict_name?: string;
  dyad_name?: string;
  side_a?: string;
  side_b?: string;
  date_start?: string;
  deaths_a?: number;
  deaths_b?: number;
  deaths_civilians?: number;
  deaths_unknown?: number;
  best?: number;
  country?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  event_type?: number;
  source_article?: string;
  source_headline?: string;
  adm_1?: string;
  adm_2?: string;
  where_description?: string;
}

interface UcdpApiResponse {
  Result?: UcdpEvent[];
  TotalCount?: number;
}

function httpsGet(urlStr: string, timeoutMs = 20000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        timeout: timeoutMs,
        headers: {
          'User-Agent': 'WarRoom-Intelligence/1.0 (research dashboard)',
          Accept: 'application/json',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode || 200, body: Buffer.concat(chunks).toString('utf8') })
        );
        res.on('error', reject);
      }
    );
    req.on('timeout', () => req.destroy(new Error(`UCDP timed out after ${timeoutMs}ms`)));
    req.on('error', reject);
    req.end();
  });
}

function mapUcdpEventType(typeCode: number | undefined): { eventType: string; subEventType: string } {
  if (typeCode !== undefined && UCDP_EVENT_TYPE_MAP[typeCode]) {
    return UCDP_EVENT_TYPE_MAP[typeCode];
  }
  return { eventType: 'Battles', subEventType: 'Armed conflict' };
}

function mapUcdpRegion(region: string | undefined): string {
  if (!region) return 'Global';
  const r = region.toLowerCase();
  if (r.includes('africa')) return 'Africa';
  if (r.includes('europe')) return 'Europe';
  if (r.includes('middle east')) return 'Middle East';
  if (r.includes('asia') || r.includes('oceania')) return 'Asia-Pacific';
  if (r.includes('america') || r.includes('caribbean')) return 'Americas';
  return region;
}

export class UCDPProvider {
  readonly name = 'UCDP GED 26.1 (Uppsala Conflict Data Program)';

  async fetchRecentEvents(): Promise<ConflictEvent[]> {
    if (cachedEvents.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      console.log(`[UCDP] Serving ${cachedEvents.length} events from cache.`);
      return cachedEvents;
    }

    const currentYear = new Date().getUTCFullYear();
    const lastYear = currentYear - 1;

    const currentYearEvents = await this.fetchForYear(currentYear);
    // If very few recent events found in current year, also check last year
    const lastYearEvents = currentYearEvents.length < 5 ? await this.fetchForYear(lastYear) : [];

    const allFetched = [...currentYearEvents, ...lastYearEvents];

    if (allFetched.length > 0) {
      cachedEvents = allFetched;
      cacheTimestamp = Date.now();
    }

    console.log(`[UCDP] Total events within window: ${allFetched.length}`);
    return allFetched;
  }

  private async fetchForYear(year: number): Promise<ConflictEvent[]> {
    const params = new URLSearchParams({
      pagesize: String(PAGE_SIZE),
      page: '1',
      Year: String(year),
    });

    const url = `${UCDP_API_BASE}?${params.toString()}`;
    console.log(`[UCDP] Fetching year ${year}: ${url}`);

    try {
      const { status, body } = await httpsGet(url, 20000);

      if (status !== 200) {
        console.warn(`[UCDP] HTTP ${status} for year ${year}`);
        return [];
      }

      let data: UcdpApiResponse;
      try {
        data = JSON.parse(body) as UcdpApiResponse;
      } catch {
        console.error('[UCDP] JSON parse error:', body.slice(0, 200));
        return [];
      }

      const results = Array.isArray(data.Result) ? data.Result : [];
      console.log(`[UCDP] Year ${year}: ${results.length} raw events`);

      return this.convertToConflictEvents(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[UCDP] Error for year ${year}: ${msg}`);
      return [];
    }
  }

  private convertToConflictEvents(rawEvents: UcdpEvent[]): ConflictEvent[] {
    const events: ConflictEvent[] = [];

    for (let i = 0; i < rawEvents.length; i++) {
      const raw = rawEvents[i];
      if (!raw.date_start) continue;

      const dateStr = raw.date_start.slice(0, 10);
      const eventDate = dateStr;
      const timestamp = `${dateStr}T00:00:00Z`;

      if (!isWithinWindow(eventDate, 10)) continue;

      const country = raw.country || 'Unknown';
      const region = mapUcdpRegion(raw.region);

      let lat: number;
      let lng: number;

      if (typeof raw.latitude === 'number' && typeof raw.longitude === 'number') {
        lat = raw.latitude;
        lng = raw.longitude;
      } else {
        const fallback = getFallbackCoords(country);
        if (!fallback) continue;
        [lat, lng] = fallback;
      }

      const fatalities =
        typeof raw.best === 'number'
          ? raw.best
          : (raw.deaths_a || 0) + (raw.deaths_b || 0) + (raw.deaths_civilians || 0) + (raw.deaths_unknown || 0);

      const { eventType, subEventType } = mapUcdpEventType(raw.event_type);
      const actor1 = raw.side_a || undefined;
      const actor2 = raw.side_b || undefined;

      const severityDetail = calculateSeverity({
        fatalities,
        eventType,
        subEventType,
        eventDate,
        timestamp,
        actor1,
        actor2,
      });

      const location = raw.where_description || raw.adm_1 || country;
      const conflictName =
        raw.conflict_name || raw.dyad_name || `${actor1 || 'Unknown'} vs ${actor2 || 'Unknown'}`;

      const notes = [
        `${conflictName}.`,
        actor1 && actor2 ? `Parties: ${actor1} vs. ${actor2}.` : actor1 ? `Actor: ${actor1}.` : '',
        `Fatalities (best estimate): ${fatalities}.`,
        raw.source_headline ? `Source: "${raw.source_headline}".` : '',
        `UCDP GED Dataset v26.1 — Uppsala University. Assessment: ${severityDetail.explanation}.`,
      ]
        .filter(Boolean)
        .join(' ');

      const event: ConflictEvent = {
        id: `UCDP-${raw.id}-${dateStr}`,
        eventDate,
        publishedAt: timestamp,
        timestamp,
        country,
        region,
        admin1: raw.adm_1 || undefined,
        location,
        latitude: lat + (Math.random() - 0.5) * 0.05,
        longitude: lng + (Math.random() - 0.5) * 0.05,
        eventType,
        subEventType,
        actor1,
        actor2,
        fatalities,
        severity: severityDetail.severity,
        isConflict: true,
        verificationStatus: 'VERIFIED',
        source: 'UCDP GED 26.1',
        sourceUrl: raw.source_article || 'https://ucdpapi.pcr.uu.se/',
        notes,
      };

      if (isHistoricalOrStaleConflict(event)) continue;

      events.push(event);
    }

    console.log(`[UCDP] ${events.length} events pass rolling window filter.`);
    return events;
  }
}
