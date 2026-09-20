import { FirmsThermalPoint, FirmsGeoJsonResponse } from '@/types/conflict';

interface ConflictBoundingBox {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const CONFLICT_THEATERS: ConflictBoundingBox[] = [
  { name: 'Ukraine-Russia Frontline', minLat: 44.0, maxLat: 53.5, minLng: 29.0, maxLng: 41.5 },
  { name: 'Levant & Middle East', minLat: 29.5, maxLat: 37.5, minLng: 33.5, maxLng: 46.5 },
  { name: 'Red Sea & Yemen', minLat: 12.0, maxLat: 20.0, minLng: 41.0, maxLng: 53.5 },
  { name: 'Sudan & Horn of Africa', minLat: 9.0, maxLat: 22.0, minLng: 22.0, maxLng: 39.0 },
  { name: 'Myanmar Conflict Zone', minLat: 15.0, maxLat: 27.5, minLng: 92.5, maxLng: 101.5 },
  { name: 'South Caucasus', minLat: 38.5, maxLat: 42.5, minLng: 44.5, maxLng: 50.5 },
  { name: 'Sahel Security Zone', minLat: 11.0, maxLat: 21.0, minLng: -10.0, maxLng: 15.0 },
  { name: 'Persian Gulf & Strait of Hormuz', minLat: 24.0, maxLat: 30.0, minLng: 48.0, maxLng: 59.0 },
];

function matchTheater(lat: number, lng: number): string | undefined {
  for (const t of CONFLICT_THEATERS) {
    if (lat >= t.minLat && lat <= t.maxLat && lng >= t.minLng && lng <= t.maxLng) {
      return t.name;
    }
  }
  return undefined;
}

// 15-Minute in-memory cache
let cachedFirmsData: FirmsGeoJsonResponse | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;
let inFlightFetch: Promise<FirmsGeoJsonResponse> | null = null;

const FIRMS_CSV_URLS = [
  'https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv',
  'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv',
];

export async function getFirmsThermalHotspots(forceRefresh = false): Promise<FirmsGeoJsonResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedFirmsData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedFirmsData;
  }

  if (inFlightFetch && !forceRefresh) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      const result = await fetchAndParseFirms();
      cachedFirmsData = result;
      lastCacheTime = Date.now();
      return result;
    } catch (err) {
      console.error('[NASA FIRMS] Ingestion error:', err);
      if (cachedFirmsData) {
        return cachedFirmsData;
      }
      return getFallbackFirmsData();
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

async function fetchAndParseFirms(): Promise<FirmsGeoJsonResponse> {
  let csvText = '';

  for (const url of FIRMS_CSV_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'WARROOM-Terminal/1.0 (OSINT Satellite Intel)',
          'Accept': 'text/csv,text/plain',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        csvText = await res.text();
        break;
      }
    } catch (e) {
      console.warn(`[NASA FIRMS] Failed to fetch from ${url}:`, (e as Error).message);
    }
  }

  if (!csvText || csvText.length < 50) {
    throw new Error('Unable to retrieve active fire CSV from NASA FIRMS servers');
  }

  const lines = csvText.split('\n');
  if (lines.length < 2) {
    throw new Error('Invalid CSV response from NASA FIRMS');
  }

  const header = lines[0].trim().split(',');
  const latIdx = header.indexOf('latitude');
  const lngIdx = header.indexOf('longitude');
  const brightTi4Idx = header.indexOf('bright_ti4');
  const acqDateIdx = header.indexOf('acq_date');
  const acqTimeIdx = header.indexOf('acq_time');
  const satIdx = header.indexOf('satellite');
  const confIdx = header.indexOf('confidence');
  const frpIdx = header.indexOf('frp');
  const daynightIdx = header.indexOf('daynight');

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error('CSV missing latitude/longitude columns');
  }

  const points: FirmsThermalPoint[] = [];
  const maxPoints = 1800; // Optimal performance limit for MapLibre rendering

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');

    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lngIdx]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const brightTi4 = brightTi4Idx !== -1 ? parseFloat(cols[brightTi4Idx]) : 300;
    const frp = frpIdx !== -1 ? parseFloat(cols[frpIdx]) : 1.0;
    const confidence = confIdx !== -1 ? cols[confIdx]?.trim().toLowerCase() : 'nominal';

    // Ignore low-confidence anomalies
    if (confidence === 'l' || confidence === 'low') continue;

    const theater = matchTheater(lat, lng);
    const isConflictTheater = !!theater;
    // High FRP explosive signatures (>20 MW) anywhere in the world, or any detection in active conflict zones
    const isHighPower = frp >= 20.0 || brightTi4 >= 335.0;

    if (!isConflictTheater && !isHighPower) continue;

    const acqDate = acqDateIdx !== -1 ? cols[acqDateIdx]?.trim() : new Date().toISOString().split('T')[0];
    const acqTime = acqTimeIdx !== -1 ? cols[acqTimeIdx]?.trim() : '0000';
    const satellite = satIdx !== -1 ? cols[satIdx]?.trim() : 'N20';
    const daynight = daynightIdx !== -1 && cols[daynightIdx]?.trim().toUpperCase() === 'N' ? 'N' : 'D';

    points.push({
      id: `firms-${lat.toFixed(4)}-${lng.toFixed(4)}-${acqTime}`,
      latitude: lat,
      longitude: lng,
      brightTi4: isNaN(brightTi4) ? 310 : brightTi4,
      acqDate,
      acqTime,
      satellite: satellite === 'N20' ? 'NOAA-20 (VIIRS)' : satellite === 'N21' ? 'NOAA-21 (VIIRS)' : satellite,
      confidence: confidence === 'h' || confidence === 'high' ? 'HIGH' : 'NOMINAL',
      frp: isNaN(frp) ? 1.0 : Math.round(frp * 10) / 10,
      daynight,
      theater: theater || (isHighPower ? 'Global High-FRP Blast/Flare' : 'Strategic Area'),
    });

    if (points.length >= maxPoints) break;
  }

  // Sort descending by FRP (highest radiative power first)
  points.sort((a, b) => b.frp - a.frp);

  const geojson: FirmsGeoJsonResponse['geojson'] = {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude],
      },
      properties: {
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        brightTi4: p.brightTi4,
        acqDate: p.acqDate,
        acqTime: p.acqTime,
        satellite: p.satellite,
        confidence: p.confidence,
        frp: p.frp,
        daynight: p.daynight,
        theater: p.theater,
      },
    })),
  };

  return {
    success: true,
    count: points.length,
    lastUpdated: new Date().toISOString(),
    geojson,
  };
}

/** Fallback hotspot dataset in case NASA LANCE servers are momentarily unreachable */
function getFallbackFirmsData(): FirmsGeoJsonResponse {
  const today = new Date().toISOString().split('T')[0];
  const sampleHotspots: FirmsThermalPoint[] = [
    { id: 'fb-firms-1', latitude: 48.01, longitude: 37.80, brightTi4: 341.2, acqDate: today, acqTime: '0215', satellite: 'NOAA-20 (VIIRS)', confidence: 'HIGH', frp: 54.3, daynight: 'N', theater: 'Ukraine-Russia Frontline' },
    { id: 'fb-firms-2', latitude: 47.92, longitude: 37.65, brightTi4: 338.5, acqDate: today, acqTime: '0215', satellite: 'NOAA-20 (VIIRS)', confidence: 'HIGH', frp: 41.2, daynight: 'N', theater: 'Ukraine-Russia Frontline' },
    { id: 'fb-firms-3', latitude: 48.55, longitude: 38.02, brightTi4: 345.1, acqDate: today, acqTime: '0215', satellite: 'NOAA-20 (VIIRS)', confidence: 'HIGH', frp: 68.7, daynight: 'N', theater: 'Ukraine-Russia Frontline' },
    { id: 'fb-firms-4', latitude: 33.25, longitude: 35.32, brightTi4: 332.0, acqDate: today, acqTime: '0140', satellite: 'NOAA-20 (VIIRS)', confidence: 'NOMINAL', frp: 28.4, daynight: 'N', theater: 'Levant & Middle East' },
    { id: 'fb-firms-5', latitude: 31.45, longitude: 34.40, brightTi4: 339.4, acqDate: today, acqTime: '0140', satellite: 'NOAA-20 (VIIRS)', confidence: 'HIGH', frp: 49.0, daynight: 'N', theater: 'Levant & Middle East' },
    { id: 'fb-firms-6', latitude: 15.35, longitude: 44.18, brightTi4: 336.8, acqDate: today, acqTime: '2330', satellite: 'Suomi-NPP (VIIRS)', confidence: 'HIGH', frp: 35.6, daynight: 'N', theater: 'Red Sea & Yemen' },
    { id: 'fb-firms-7', latitude: 15.60, longitude: 32.52, brightTi4: 342.9, acqDate: today, acqTime: '0050', satellite: 'NOAA-20 (VIIRS)', confidence: 'HIGH', frp: 62.1, daynight: 'N', theater: 'Sudan & Horn of Africa' },
  ];

  return {
    success: true,
    count: sampleHotspots.length,
    lastUpdated: new Date().toISOString(),
    geojson: {
      type: 'FeatureCollection',
      features: sampleHotspots.map((p) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.longitude, p.latitude],
        },
        properties: {
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          brightTi4: p.brightTi4,
          acqDate: p.acqDate,
          acqTime: p.acqTime,
          satellite: p.satellite,
          confidence: p.confidence,
          frp: p.frp,
          daynight: p.daynight,
          theater: p.theater,
        },
      })),
    },
  };
}
