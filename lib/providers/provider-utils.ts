import { ConflictEvent, Severity } from '@/types/conflict';
import { calculateSeverity } from '../scoring/severity';
import { isWithinWindow, isHistoricalOrStaleConflict } from '../data/date-utils';
import { COUNTRY_TO_REGION } from '../aggregation/clustering';
import { classifyEvent } from '../classification/event-classifier';

export const GLOBAL_COUNTRY_COORDS: Record<string, [number, number]> = {
  // United States & North America
  'united states': [38.8951, -77.0364], // Centered at Washington DC
  usa: [38.8951, -77.0364],
  america: [38.8951, -77.0364],
  'white house': [38.8977, -77.0365],
  pentagon: [38.8719, -77.0563],
  washington: [38.8951, -77.0364],
  'new york': [40.7128, -74.006],
  california: [36.7783, -119.4179],
  texas: [31.9686, -99.9018],
  florida: [27.6648, -81.5158],
  canada: [45.4215, -75.6972], // Ottawa
  ottawa: [45.4215, -75.6972],
  toronto: [43.6532, -79.3832],
  mexico: [19.4326, -99.1332], // Mexico City

  // Western & Central Europe
  'united kingdom': [51.5074, -0.1278], // London
  uk: [51.5074, -0.1278],
  britain: [51.5074, -0.1278],
  england: [51.5074, -0.1278],
  london: [51.5074, -0.1278],
  france: [48.8566, 2.3522], // Paris
  paris: [48.8566, 2.3522],
  germany: [52.52, 13.405], // Berlin
  berlin: [52.52, 13.405],
  italy: [41.9028, 12.4964], // Rome
  rome: [41.9028, 12.4964],
  spain: [40.4168, -3.7038], // Madrid
  madrid: [40.4168, -3.7038],
  belgium: [50.8503, 4.3517], // Brussels
  brussels: [50.8503, 4.3517],
  nato: [50.8787, 4.4262],
  'european union': [50.8503, 4.3517],
  netherlands: [52.3676, 4.9041], // Amsterdam
  amsterdam: [52.3676, 4.9041],
  'the hague': [52.0705, 4.3007],
  switzerland: [46.2044, 6.1432], // Geneva
  geneva: [46.2044, 6.1432],
  austria: [48.2082, 16.3738], // Vienna
  vienna: [48.2082, 16.3738],
  sweden: [59.3293, 18.0686], // Stockholm
  stockholm: [59.3293, 18.0686],
  norway: [59.9139, 10.7522], // Oslo
  oslo: [59.9139, 10.7522],
  denmark: [55.6761, 12.5683], // Copenhagen
  finland: [60.1699, 24.9384], // Helsinki
  ireland: [53.3498, -6.2603], // Dublin
  portugal: [38.7223, -9.1393], // Lisbon
  greece: [37.9838, 23.7275], // Athens
  poland: [52.2297, 21.0122], // Warsaw
  warsaw: [52.2297, 21.0122],
  'czech republic': [50.0755, 14.4378], // Prague
  hungary: [47.4979, 19.0402], // Budapest
  romania: [44.4268, 26.1025], // Bucharest

  // Eastern Europe / Russia / Caucasus
  ukraine: [50.4501, 30.5234], // Kyiv
  kyiv: [50.4501, 30.5234],
  russia: [55.7558, 37.6173], // Moscow
  moscow: [55.7558, 37.6173],
  belarus: [53.9006, 27.559], // Minsk
  moldova: [47.0105, 28.8638],
  georgia: [41.7151, 44.8271],
  armenia: [40.1792, 44.4991],
  azerbaijan: [40.4093, 49.8671],
  kosovo: [42.6629, 21.1655],
  serbia: [44.7866, 20.4489],
  estonia: [59.437, 24.7536],
  latvia: [56.9496, 24.1052],
  lithuania: [54.6872, 25.2797],

  // South America
  brazil: [-15.7975, -47.8919], // Brasilia
  brasilia: [-15.7975, -47.8919],
  'sao paulo': [-23.5505, -46.6333],
  'rio de janeiro': [-22.9068, -43.1729],
  amazon: [-3.4653, -62.2159],
  argentina: [-34.6037, -58.3816], // Buenos Aires
  'buenos aires': [-34.6037, -58.3816],
  chile: [-33.4489, -70.6693], // Santiago
  colombia: [4.711, -74.0721], // Bogota
  venezuela: [10.4806, -66.9036], // Caracas
  ecuador: [-0.1807, -78.4678],
  peru: [-12.0464, -77.0428],
  haiti: [18.5944, -72.3074],
  cuba: [23.1136, -82.3666],
  panama: [8.9824, -79.5199],
  honduras: [14.0723, -87.1921],

  // Middle East
  israel: [31.7683, 35.2137], // Jerusalem
  palestine: [31.9522, 35.2332],
  gaza: [31.5, 34.4667],
  'west bank': [31.9, 35.2],
  lebanon: [33.8938, 35.5018], // Beirut
  syria: [33.5138, 36.2765], // Damascus
  yemen: [15.3694, 44.191], // Sanaa
  iraq: [33.3152, 44.3661], // Baghdad
  iran: [35.6892, 51.389], // Tehran
  jordan: [31.9454, 35.9284],
  'saudi arabia': [24.7136, 46.6753], // Riyadh
  turkey: [39.9334, 32.8597], // Ankara
  cyprus: [35.1856, 33.3823],
  qatar: [25.2854, 51.531],
  uae: [24.4539, 54.3773], // Abu Dhabi
  kuwait: [29.3759, 47.9774],

  // Africa
  sudan: [15.5007, 32.5599], // Khartoum
  'south sudan': [4.8594, 31.5713],
  ethiopia: [9.03, 38.74], // Addis Ababa
  somalia: [2.0469, 45.3182],
  nigeria: [9.0765, 7.3986], // Abuja
  mali: [12.6392, -8.0029],
  'burkina faso': [12.3714, -1.5197],
  niger: [13.5116, 2.1254],
  chad: [12.1348, 15.0557],
  'democratic republic of congo': [-4.4419, 15.2663],
  'dr congo': [-4.4419, 15.2663],
  drc: [-4.4419, 15.2663],
  congo: [-4.4419, 15.2663],
  mozambique: [-25.9692, 32.5732],
  cameroon: [3.848, 11.5021],
  libya: [32.8872, 13.1913],
  kenya: [-1.2921, 36.8219], // Nairobi
  'south africa': [-25.7479, 28.2293], // Pretoria
  egypt: [30.0444, 31.2357], // Cairo
  algeria: [36.7538, 3.0588],
  morocco: [34.0209, -6.8416],
  tunisia: [36.8065, 10.1815],
  uganda: [0.3476, 32.5825],
  rwanda: [-1.9706, 30.1044],
  burundi: [-3.3822, 29.3644],
  'central african republic': [4.3947, 18.5582],

  // Asia / Oceania
  australia: [-35.2809, 149.13], // Canberra
  sydney: [-33.8688, 151.2093],
  melbourne: [-37.8136, 144.9631],
  'new zealand': [-41.2865, 174.7762], // Wellington
  japan: [35.6762, 139.6503], // Tokyo
  tokyo: [35.6762, 139.6503],
  'south korea': [37.5665, 126.978], // Seoul
  seoul: [37.5665, 126.978],
  china: [39.9042, 116.4074], // Beijing
  beijing: [39.9042, 116.4074],
  taiwan: [25.033, 121.5654], // Taipei
  india: [28.6139, 77.209], // New Delhi
  'new delhi': [28.6139, 77.209],
  pakistan: [33.6844, 73.0479], // Islamabad
  afghanistan: [34.5553, 69.2075],
  myanmar: [19.7633, 96.0785],
  bangladesh: [23.8103, 90.4125],
  philippines: [14.5995, 120.9842],
  indonesia: [-6.2088, 106.8456], // Jakarta
  thailand: [13.7563, 100.5018], // Bangkok
  vietnam: [21.0285, 105.8542], // Hanoi
  singapore: [1.3521, 103.8198],
  kazakhstan: [51.1694, 71.4491],
  uzbekistan: [41.2995, 69.2401],
  tajikistan: [38.5598, 68.787],
  kyrgyzstan: [42.8746, 74.5698],

  // Strategic Maritime
  'red sea': [20.0, 38.5],
  'persian gulf': [26.0, 52.0],
  'strait of hormuz': [26.56, 56.25],
  'bab el-mandeb': [12.58, 43.33],
  'black sea': [44.0, 35.0],
  'south china sea': [12.0, 113.0],
};

const CONFLICT_KEYWORDS = [
  'airstrike', 'air strike', 'drone strike', 'drone attack',
  'missile', 'rocket', 'shelling', 'artillery', 'bombardment',
  'explosion', 'blast', 'bomb', 'bombing',
  'clash', 'clashes', 'battle', 'offensive', 'assault',
  'attack', 'ambush', 'raid', 'combat', 'warfare', 'frontline',
  'killed', 'dead', 'fatalities', 'casualties',
  'massacre', 'gunfire', 'sniper', 'mortar',
  'troops', 'soldiers', 'fighters', 'militant', 'insurgent', 'rebel',
  'fire exchange', 'cross-border', 'war', 'army', 'hostilities',
];

export function isConflictText(text: string): boolean {
  const lower = text.toLowerCase();
  return CONFLICT_KEYWORDS.some((kw) => lower.includes(kw));
}

const ALIAS_TO_COUNTRY: Record<string, string> = {
  usa: 'United States',
  america: 'United States',
  'white house': 'United States',
  pentagon: 'United States',
  washington: 'United States',
  'new york': 'United States',
  california: 'United States',
  texas: 'United States',
  florida: 'United States',
  canada: 'Canada',
  ottawa: 'Canada',
  toronto: 'Canada',
  mexico: 'Mexico',
  uk: 'United Kingdom',
  britain: 'United Kingdom',
  england: 'United Kingdom',
  london: 'United Kingdom',
  france: 'France',
  paris: 'France',
  germany: 'Germany',
  berlin: 'Germany',
  italy: 'Italy',
  rome: 'Italy',
  spain: 'Spain',
  madrid: 'Spain',
  belgium: 'Belgium',
  brussels: 'Belgium',
  nato: 'Belgium',
  'european union': 'Belgium',
  netherlands: 'Netherlands',
  amsterdam: 'Netherlands',
  'the hague': 'Netherlands',
  switzerland: 'Switzerland',
  geneva: 'Switzerland',
  austria: 'Austria',
  vienna: 'Austria',
  sweden: 'Sweden',
  stockholm: 'Sweden',
  norway: 'Norway',
  oslo: 'Norway',
  denmark: 'Denmark',
  finland: 'Finland',
  ireland: 'Ireland',
  portugal: 'Portugal',
  greece: 'Greece',
  poland: 'Poland',
  warsaw: 'Poland',
  'czech republic': 'Czech Republic',
  hungary: 'Hungary',
  romania: 'Romania',
  ukraine: 'Ukraine',
  kyiv: 'Ukraine',
  russia: 'Russia',
  moscow: 'Russia',
  brazil: 'Brazil',
  brasilia: 'Brazil',
  'sao paulo': 'Brazil',
  'rio de janeiro': 'Brazil',
  amazon: 'Brazil',
  argentina: 'Argentina',
  'buenos aires': 'Argentina',
  chile: 'Chile',
  colombia: 'Colombia',
  australia: 'Australia',
  sydney: 'Australia',
  melbourne: 'Australia',
  'new zealand': 'New Zealand',
  japan: 'Japan',
  tokyo: 'Japan',
  'south korea': 'South Korea',
  seoul: 'South Korea',
  china: 'China',
  beijing: 'China',
  india: 'India',
  'new delhi': 'India',
};

export function extractLocationAndCoords(text: string): { country: string; location: string; lat: number; lon: number } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const sortedKeys = Object.keys(GLOBAL_COUNTRY_COORDS).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const isMatch = key.length <= 4
      ? new RegExp(`\\b${key}\\b`, 'i').test(lower)
      : lower.includes(key);

    if (isMatch) {
      const [lat, lon] = GLOBAL_COUNTRY_COORDS[key];
      const matchedName = key
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const country = ALIAS_TO_COUNTRY[key] || matchedName;
      const location = matchedName !== country ? `${matchedName}, ${country}` : country;
      return {
        country,
        location,
        lat,
        lon,
      };
    }
  }

  return null;
}

export function inferEventType(title: string): { eventType: string; subEventType: string } {
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
  if (t.includes('ceasefire') || t.includes('truce') || t.includes('treaty')) {
    return { eventType: 'Strategic Development', subEventType: 'Ceasefire agreement' };
  }
  if (t.includes('sanction') || t.includes('diplomat') || t.includes('summit') || t.includes('bilateral') || t.includes('ambassador')) {
    return { eventType: 'Diplomatic', subEventType: 'Diplomatic development' };
  }
  if (t.includes('defense') || t.includes('military') || t.includes('navy') || t.includes('pentagon') || t.includes('nato')) {
    return { eventType: 'Defense & Security', subEventType: 'Defense readiness' };
  }
  if (t.includes('election') || t.includes('parliament') || t.includes('congress') || t.includes('government') || t.includes('president') || t.includes('minister') || t.includes('policy')) {
    return { eventType: 'Geopolitics & Policy', subEventType: 'Government & policy' };
  }
  if (t.includes('economy') || t.includes('trade') || t.includes('tariff') || t.includes('inflation') || t.includes('gdp')) {
    return { eventType: 'Economy & Trade', subEventType: 'Economic dispatch' };
  }
  return { eventType: 'News/General', subEventType: 'News report' };
}

export function estimateFatalities(title: string): number {
  const numMatch = title.match(/(\d+)\s*(?:killed|dead|fatalities|casualties|troops?|soldiers?|fighters?|civilians?)/i);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    return isNaN(n) ? 0 : Math.min(n, 500);
  }
  if (/\b(massacre|dozens?|scores?|hundreds?)\b/i.test(title)) return 15;
  if (/\bseveral\b/i.test(title)) return 4;
  if (/\bmultiple\b/i.test(title)) return 3;
  return 0;
}

export interface BuildEventParams {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  country?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  fatalities?: number;
  isConflict?: boolean;
}

/**
 * Builds a valid ConflictEvent with guaranteed numeric coordinates and severity scoring.
 * Jitters coordinates slightly (+/- 0.25 deg) so multiple news reports on the same country/theater
 * plot as distinct, interactive dots on the map.
 */
export function buildConflictEvent(params: BuildEventParams): ConflictEvent | null {
  const text = `${params.title} ${params.description || ''}`;
  const extracted = (typeof params.latitude === 'number' && typeof params.longitude === 'number' && params.country)
    ? { country: params.country, location: params.location || params.country, lat: params.latitude, lon: params.longitude }
    : extractLocationAndCoords(text);

  if (!extracted) {
    return null;
  }

  const isoDate = params.publishedAt ? new Date(params.publishedAt).toISOString() : new Date().toISOString();
  const eventDate = isoDate.slice(0, 10);

  if (!isWithinWindow(eventDate, 10)) {
    return null;
  }

  const classification = classifyEvent(params.title, params.description);
  const conflict = typeof params.isConflict === 'boolean' ? params.isConflict : classification.isConflict;
  const eventType = classification.category;
  const subEventType = classification.subEventType;
  const fatalities = typeof params.fatalities === 'number' ? params.fatalities : (conflict ? estimateFatalities(text) : 0);

  const severityDetail = calculateSeverity({
    fatalities,
    eventType,
    subEventType,
    eventDate,
    timestamp: isoDate,
  });

  // Deterministic coordinate jitter (+/- 0.22 deg) based on article title/url seed so identical articles don't jump around
  const seed = `${params.url || params.title || ''}`;
  let seedHash = 0;
  for (let i = 0; i < seed.length; i++) {
    seedHash = (seedHash << 5) - seedHash + seed.charCodeAt(i);
    seedHash |= 0;
  }
  const absHash = Math.abs(seedHash);
  const jitterLat = ((absHash % 1000) / 1000 - 0.5) * 0.44;
  const jitterLon = (((absHash >> 3) % 1000) / 1000 - 0.5) * 0.44;

  const notes = conflict
    ? `${params.title}. ${params.description ? params.description.slice(0, 250) + '.' : ''} Reported by ${params.source}. ${severityDetail.explanation}.`
    : `${params.title}. ${params.description ? params.description.slice(0, 250) + '.' : ''} Geopolitical dispatch reported by ${params.source}.`;

  // Ensure ID is stable and does not regenerate dynamic timestamps on re-fetch
  const stableId = (params.id || '').replace(/-\d{10,14}$/, '') || `${params.source.toUpperCase().replace(/[^A-Z]/g, '')}-${absHash.toString(36)}`;

  const event: ConflictEvent = {
    id: stableId,
    eventDate,
    publishedAt: isoDate,
    timestamp: isoDate,
    country: extracted.country,
    location: extracted.location || extracted.country,
    region: COUNTRY_TO_REGION[extracted.country] || 'Other',
    latitude: extracted.lat + jitterLat,
    longitude: extracted.lon + jitterLon,
    primaryCategory: classification.category,
    categoryConfidence: classification.confidence,
    eventType,
    subEventType,
    fatalities,
    severity: severityDetail.severity,
    isConflict: conflict,
    verificationStatus: conflict ? 'REPORTED' : 'UNCONFIRMED',
    source: params.source,
    sourceUrl: params.url,
    notes,
  };

  if (isHistoricalOrStaleConflict(event)) {
    return null;
  }

  return event;
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    method?: string;
    body?: any;
  } = {}
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const { headers = {}, timeoutMs = 12000, method = 'GET', body } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'User-Agent': 'WarRoom-Geopolitical-Terminal/1.0 (Conflict-Monitoring-Dashboard)',
        Accept: 'application/json, text/plain, */*',
        ...headers,
      },
      signal: controller.signal,
    };

    if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['Content-Type']) {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(url, fetchOptions);
    const text = await res.text();

    if (!res.ok) {
      return { ok: false, status: res.status, data: null, error: `HTTP ${res.status}: ${text.slice(0, 150)}` };
    }

    try {
      const data = JSON.parse(text) as T;
      return { ok: true, status: res.status, data };
    } catch {
      return { ok: false, status: res.status, data: null, error: `JSON Parse error: ${text.slice(0, 120)}` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, data: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

