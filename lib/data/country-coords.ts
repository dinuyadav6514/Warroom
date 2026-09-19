import { COUNTRY_TO_REGION } from '@/lib/aggregation/clustering';

/**
 * Static country coordinate lookup table.
 * Maps normalised lowercase country names → { lng, lat, zoom }
 * zoom: how far to zoom in (higher = closer). Multi-country selections use a lower zoom.
 */
export interface CountryCoord {
  lng: number;
  lat: number;
  zoom: number;
  /** Common aliases (all lowercase) */
  aliases?: string[];
}

const COORDS: Record<string, CountryCoord> = {
  afghanistan:        { lng: 67.71, lat: 33.93, zoom: 5.2 },
  albania:            { lng: 20.17, lat: 41.15, zoom: 6.5 },
  algeria:            { lng: 1.66,  lat: 28.03, zoom: 4.8 },
  angola:             { lng: 17.87, lat: -11.20, zoom: 5.0 },
  argentina:          { lng: -63.62, lat: -38.42, zoom: 4.5 },
  armenia:            { lng: 45.04, lat: 40.07, zoom: 7.0 },
  australia:          { lng: 133.77, lat: -25.27, zoom: 3.8 },
  austria:            { lng: 14.55, lat: 47.52, zoom: 6.8 },
  azerbaijan:         { lng: 47.58, lat: 40.14, zoom: 6.8 },
  bahrain:            { lng: 50.56, lat: 26.07, zoom: 9.5 },
  bangladesh:         { lng: 90.36, lat: 23.68, zoom: 6.5 },
  belarus:            { lng: 27.95, lat: 53.71, zoom: 6.0 },
  belgium:            { lng: 4.47,  lat: 50.50, zoom: 7.5 },
  belize:             { lng: -88.50, lat: 17.19, zoom: 7.0 },
  benin:              { lng: 2.32,  lat: 9.31,  zoom: 6.5 },
  bhutan:             { lng: 90.43, lat: 27.51, zoom: 7.5 },
  bolivia:            { lng: -64.59, lat: -16.29, zoom: 5.5 },
  'bosnia and herzegovina': { lng: 17.68, lat: 43.92, zoom: 7.0, aliases: ['bosnia', 'bih'] },
  botswana:           { lng: 24.68, lat: -22.33, zoom: 6.0 },
  brazil:             { lng: -51.93, lat: -14.24, zoom: 3.8 },
  brunei:             { lng: 114.73, lat: 4.54, zoom: 8.5 },
  bulgaria:           { lng: 25.49, lat: 42.73, zoom: 6.8 },
  'burkina faso':     { lng: -1.56, lat: 12.36, zoom: 6.0, aliases: ['burkina'] },
  burundi:            { lng: 29.92, lat: -3.37, zoom: 7.5 },
  cambodia:           { lng: 104.99, lat: 12.57, zoom: 6.5 },
  cameroon:           { lng: 12.35, lat: 3.85,  zoom: 5.8 },
  canada:             { lng: -96.80, lat: 56.13, zoom: 3.2 },
  'central african republic': { lng: 20.94, lat: 6.61, zoom: 5.5, aliases: ['car', 'central africa'] },
  chad:               { lng: 18.73, lat: 15.45, zoom: 5.0 },
  chile:              { lng: -71.54, lat: -35.68, zoom: 4.5 },
  china:              { lng: 104.20, lat: 35.86, zoom: 3.8, aliases: ['prc', 'peoples republic of china'] },
  colombia:           { lng: -74.30, lat: 4.57,  zoom: 5.2 },
  'congo':            { lng: 15.83, lat: -0.23, zoom: 5.5, aliases: ['republic of congo', 'republic of the congo'] },
  'democratic republic of the congo': { lng: 23.65, lat: -2.88, zoom: 4.8, aliases: ['drc', 'dr congo', 'zaire'] },
  'costa rica':       { lng: -83.75, lat: 9.75,  zoom: 7.5 },
  croatia:            { lng: 15.20, lat: 45.10, zoom: 6.8 },
  cuba:               { lng: -79.52, lat: 21.52, zoom: 6.2 },
  cyprus:             { lng: 33.43, lat: 35.13, zoom: 8.5 },
  'czech republic':   { lng: 15.47, lat: 49.82, zoom: 6.8, aliases: ['czechia'] },
  denmark:            { lng: 10.00, lat: 56.26, zoom: 6.5 },
  djibouti:           { lng: 42.59, lat: 11.83, zoom: 8.0 },
  'dominican republic': { lng: -70.16, lat: 18.74, zoom: 7.5 },
  ecuador:            { lng: -78.18, lat: -1.83, zoom: 6.2 },
  egypt:              { lng: 30.80, lat: 26.82, zoom: 5.5 },
  'el salvador':      { lng: -88.90, lat: 13.79, zoom: 8.0 },
  eritrea:            { lng: 39.78, lat: 15.18, zoom: 6.5 },
  estonia:            { lng: 25.01, lat: 58.60, zoom: 7.0 },
  ethiopia:           { lng: 40.49, lat: 9.15,  zoom: 5.2 },
  fiji:               { lng: 178.07, lat: -17.71, zoom: 7.5 },
  finland:            { lng: 25.75, lat: 64.96, zoom: 5.5 },
  france:             { lng: 2.21,  lat: 46.23, zoom: 5.8 },
  gabon:              { lng: 11.61, lat: -0.80, zoom: 6.2 },
  georgia:            { lng: 43.36, lat: 42.32, zoom: 7.0, aliases: ['sakartvelo'] },
  germany:            { lng: 10.45, lat: 51.17, zoom: 5.8 },
  ghana:              { lng: -1.02, lat: 7.95,  zoom: 6.5 },
  greece:             { lng: 21.82, lat: 39.07, zoom: 6.2 },
  guatemala:          { lng: -90.23, lat: 15.78, zoom: 7.0 },
  guinea:             { lng: -11.81, lat: 11.00, zoom: 6.5 },
  'guinea-bissau':    { lng: -15.18, lat: 11.80, zoom: 7.5 },
  haiti:              { lng: -72.29, lat: 18.97, zoom: 7.5 },
  honduras:           { lng: -86.24, lat: 15.20, zoom: 7.0 },
  hungary:            { lng: 19.50, lat: 47.16, zoom: 7.0 },
  india:              { lng: 78.96, lat: 20.59, zoom: 4.5 },
  indonesia:          { lng: 113.92, lat: -0.79, zoom: 4.5 },
  iran:               { lng: 53.69, lat: 32.43, zoom: 5.0, aliases: ['islamic republic of iran'] },
  iraq:               { lng: 43.68, lat: 33.22, zoom: 5.8 },
  ireland:            { lng: -8.24, lat: 53.41, zoom: 6.8 },
  israel:             { lng: 34.85, lat: 31.05, zoom: 7.8, aliases: ['idf', 'state of israel'] },
  italy:              { lng: 12.57, lat: 41.87, zoom: 5.8 },
  'ivory coast':      { lng: -5.55, lat: 7.54,  zoom: 6.5, aliases: ["cote d'ivoire", 'cote divoire'] },
  jamaica:            { lng: -77.30, lat: 18.11, zoom: 8.5 },
  japan:              { lng: 138.25, lat: 36.20, zoom: 5.2 },
  jordan:             { lng: 36.24, lat: 30.59, zoom: 7.2 },
  kazakhstan:         { lng: 66.92, lat: 48.02, zoom: 4.5 },
  kenya:              { lng: 37.91, lat: 0.02,  zoom: 5.8 },
  'north korea':      { lng: 127.51, lat: 40.34, zoom: 6.0, aliases: ['dprk', 'democratic peoples republic of korea'] },
  'south korea':      { lng: 127.77, lat: 35.91, zoom: 6.5, aliases: ['korea', 'republic of korea', 'rok'] },
  kosovo:             { lng: 20.90, lat: 42.60, zoom: 8.0 },
  kuwait:             { lng: 47.48, lat: 29.32, zoom: 8.5 },
  kyrgyzstan:         { lng: 74.77, lat: 41.20, zoom: 6.0 },
  laos:               { lng: 103.86, lat: 19.86, zoom: 6.0 },
  latvia:             { lng: 24.60, lat: 56.88, zoom: 7.0 },
  lebanon:            { lng: 35.86, lat: 33.85, zoom: 8.5 },
  liberia:            { lng: -9.43, lat: 6.43,  zoom: 7.0 },
  libya:              { lng: 17.23, lat: 26.34, zoom: 5.0 },
  lithuania:          { lng: 23.88, lat: 55.17, zoom: 7.0 },
  madagascar:         { lng: 46.87, lat: -18.77, zoom: 5.5 },
  malawi:             { lng: 34.30, lat: -13.25, zoom: 6.5 },
  malaysia:           { lng: 109.70, lat: 4.21,  zoom: 5.5 },
  mali:               { lng: -1.99, lat: 17.57, zoom: 5.0 },
  mauritania:         { lng: -10.94, lat: 21.01, zoom: 5.5 },
  mexico:             { lng: -102.55, lat: 23.63, zoom: 4.8 },
  moldova:            { lng: 28.37, lat: 47.41, zoom: 7.5 },
  mongolia:           { lng: 103.85, lat: 46.86, zoom: 5.0 },
  montenegro:         { lng: 19.37, lat: 42.71, zoom: 8.0 },
  morocco:            { lng: -7.09, lat: 31.79, zoom: 5.8 },
  mozambique:         { lng: 35.53, lat: -18.67, zoom: 5.5 },
  myanmar:            { lng: 95.96, lat: 21.91, zoom: 5.5, aliases: ['burma'] },
  namibia:            { lng: 18.49, lat: -22.96, zoom: 5.5 },
  nepal:              { lng: 84.12, lat: 28.39, zoom: 6.8 },
  netherlands:        { lng: 5.29,  lat: 52.13, zoom: 7.0 },
  'new zealand':      { lng: 174.49, lat: -41.73, zoom: 5.5 },
  nicaragua:          { lng: -85.21, lat: 12.87, zoom: 7.0 },
  niger:              { lng: 8.08,  lat: 17.61, zoom: 5.5 },
  nigeria:            { lng: 8.68,  lat: 9.08,  zoom: 5.5 },
  'north macedonia':  { lng: 21.75, lat: 41.61, zoom: 8.0, aliases: ['macedonia'] },
  norway:             { lng: 8.47,  lat: 60.47, zoom: 5.5 },
  oman:               { lng: 55.98, lat: 21.00, zoom: 6.2 },
  pakistan:           { lng: 69.35, lat: 30.38, zoom: 5.2 },
  palestine:          { lng: 35.23, lat: 31.95, zoom: 8.5, aliases: ['gaza', 'west bank', 'palestinian territory', 'gaza strip'] },
  panama:             { lng: -80.78, lat: 8.54,  zoom: 7.5 },
  'papua new guinea': { lng: 143.96, lat: -6.31, zoom: 6.0, aliases: ['png'] },
  paraguay:           { lng: -58.44, lat: -23.44, zoom: 6.5 },
  peru:               { lng: -75.02, lat: -9.19, zoom: 5.2 },
  philippines:        { lng: 121.77, lat: 12.88, zoom: 5.5 },
  poland:             { lng: 19.15, lat: 51.92, zoom: 6.0 },
  portugal:           { lng: -8.22, lat: 39.40, zoom: 6.5 },
  qatar:              { lng: 51.18, lat: 25.35, zoom: 9.0 },
  romania:            { lng: 24.97, lat: 45.94, zoom: 6.2 },
  russia:             { lng: 105.32, lat: 61.52, zoom: 3.0, aliases: ['russian federation'] },
  rwanda:             { lng: 29.87, lat: -1.94, zoom: 8.5 },
  'saudi arabia':     { lng: 45.08, lat: 23.89, zoom: 5.0, aliases: ['ksa'] },
  senegal:            { lng: -14.45, lat: 14.50, zoom: 6.5 },
  serbia:             { lng: 21.01, lat: 44.02, zoom: 7.0 },
  'sierra leone':     { lng: -11.78, lat: 8.46,  zoom: 7.5 },
  singapore:          { lng: 103.82, lat: 1.35, zoom: 10.5 },
  maldives:           { lng: 73.22,  lat: 3.20, zoom: 7.5 },
  'hong kong':        { lng: 114.16, lat: 22.32, zoom: 10.0, aliases: ['hk'] },
  somalia:            { lng: 46.20, lat: 5.15,  zoom: 5.5 },
  'south africa':     { lng: 22.94, lat: -30.56, zoom: 5.0 },
  'south sudan':      { lng: 31.31, lat: 6.88,  zoom: 6.0, aliases: ['south sudan'] },
  spain:              { lng: -3.75, lat: 40.46, zoom: 5.8 },
  'sri lanka':        { lng: 80.77, lat: 7.87,  zoom: 7.5, aliases: ['ceylon'] },
  sudan:              { lng: 30.22, lat: 12.86, zoom: 5.2 },
  sweden:             { lng: 18.64, lat: 60.13, zoom: 5.5 },
  switzerland:        { lng: 8.23,  lat: 46.82, zoom: 7.2 },
  syria:              { lng: 38.30, lat: 34.80, zoom: 6.5, aliases: ['syrian arab republic'] },
  taiwan:             { lng: 120.96, lat: 23.70, zoom: 8.0, aliases: ['roc', 'republic of china'] },
  tajikistan:         { lng: 71.28, lat: 38.86, zoom: 6.5 },
  tanzania:           { lng: 34.89, lat: -6.37, zoom: 5.8 },
  thailand:           { lng: 100.99, lat: 15.87, zoom: 5.8 },
  'timor-leste':      { lng: 125.73, lat: -8.87, zoom: 8.5, aliases: ['east timor'] },
  togo:               { lng: 0.82,  lat: 8.62,  zoom: 7.0 },
  tunisia:            { lng: 9.54,  lat: 33.89, zoom: 6.5 },
  turkey:             { lng: 35.24, lat: 38.96, zoom: 5.5, aliases: ['türkiye', 'turkiye'] },
  turkmenistan:       { lng: 58.99, lat: 38.97, zoom: 6.0 },
  uganda:             { lng: 32.29, lat: 1.37,  zoom: 7.0 },
  ukraine:            { lng: 31.17, lat: 48.38, zoom: 5.8 },
  'united arab emirates': { lng: 53.85, lat: 23.42, zoom: 8.0, aliases: ['uae', 'emirates'] },
  'united kingdom':   { lng: -3.44, lat: 55.38, zoom: 5.5, aliases: ['uk', 'britain', 'great britain', 'england'] },
  'united states':    { lng: -95.71, lat: 37.09, zoom: 3.8, aliases: ['usa', 'us', 'america', 'united states of america'] },
  uruguay:            { lng: -55.77, lat: -32.52, zoom: 6.8 },
  uzbekistan:         { lng: 63.95, lat: 41.38, zoom: 6.0 },
  venezuela:          { lng: -66.59, lat: 6.42,  zoom: 5.5 },
  vietnam:            { lng: 108.28, lat: 14.06, zoom: 5.5 },
  yemen:              { lng: 48.52, lat: 15.55, zoom: 6.0 },
  zambia:             { lng: 27.85, lat: -13.13, zoom: 5.8 },
  zimbabwe:           { lng: 29.15, lat: -19.02, zoom: 6.2 },
  'global / strategic': { lng: -25.00, lat: 0.00, zoom: 2.5, aliases: ['global', 'transnational', 'international', 'un'] },

  // ── Continents & Major Geopolitical Regions ───────────────────────────────
  asia: {
    lng: 88.0,
    lat: 34.0,
    zoom: 3.0,
    aliases: [
      'asian',
      'south asia',
      'east asia',
      'southeast asia',
      'central asia',
      'western asia',
    ],
  },
  africa: {
    lng: 20.0,
    lat: 5.0,
    zoom: 3.2,
    aliases: ['african', 'sub-saharan africa', 'north africa', 'horn of africa'],
  },
  europe: {
    lng: 18.0,
    lat: 50.0,
    zoom: 3.8,
    aliases: ['european', 'western europe', 'eastern europe', 'central europe', 'eu'],
  },
  'north america': {
    lng: -100.0,
    lat: 45.0,
    zoom: 3.0,
    aliases: ['na', 'northern america'],
  },
  'south america': {
    lng: -60.0,
    lat: -18.0,
    zoom: 3.3,
    aliases: ['sa', 'latin america'],
  },
  americas: {
    lng: -85.0,
    lat: 15.0,
    zoom: 2.8,
    aliases: ['the americas'],
  },
  oceania: {
    lng: 140.0,
    lat: -22.0,
    zoom: 3.5,
    aliases: ['australasia', 'oceania & pacific', 'pacific'],
  },
  'middle east': {
    lng: 45.0,
    lat: 28.0,
    zoom: 4.5,
    aliases: ['mideast', 'mena', 'near east'],
  },
  antarctica: {
    lng: 0.0,
    lat: -82.0,
    zoom: 2.0,
    aliases: ['antarctic'],
  },
};

/** Build the alias reverse-map once at module load time */
const ALIAS_MAP: Record<string, string> = {};
for (const [canonical, data] of Object.entries(COORDS)) {
  if (data.aliases) {
    for (const alias of data.aliases) {
      ALIAS_MAP[alias] = canonical;
    }
  }
}

/**
 * Checks if a name matches a known country (canonical or alias).
 */
export function isKnownCountry(name: string, knownList?: string[]): boolean {
  const key = name.trim().toLowerCase();
  if (!key) return false;
  if (key in COORDS || key in ALIAS_MAP) return true;
  if (knownList && knownList.some((k) => k.toLowerCase() === key || k.toLowerCase().includes(key))) {
    return true;
  }
  return false;
}

/**
 * Looks up coordinates for a country name (case-insensitive, alias-aware).
 * Returns undefined if the country is not found.
 */
export function getCountryCoord(name: string): CountryCoord | undefined {
  const key = name.trim().toLowerCase();
  const canonical = ALIAS_MAP[key] ?? key;
  return COORDS[canonical];
}

/**
 * Given an array of country names, compute a centre point and zoom level
 * that roughly fits all of them in view.
 */
export function getMultiCountryView(
  names: string[],
  fallbackEvents?: Array<{ country?: string; latitude?: number; longitude?: number }>
): { lng: number; lat: number; zoom: number } | undefined {
  const found: CountryCoord[] = [];

  for (const name of names) {
    const direct = getCountryCoord(name);
    if (direct) {
      found.push(direct);
    } else if (fallbackEvents && fallbackEvents.length > 0) {
      const lower = name.trim().toLowerCase();
      const matchingEvents = fallbackEvents.filter(
        (e) =>
          typeof e.longitude === 'number' &&
          typeof e.latitude === 'number' &&
          e.country &&
          (e.country.toLowerCase() === lower || e.country.toLowerCase().includes(lower))
      );
      if (matchingEvents.length > 0) {
        const avgLng = matchingEvents.reduce((s, e) => s + e.longitude!, 0) / matchingEvents.length;
        const avgLat = matchingEvents.reduce((s, e) => s + e.latitude!, 0) / matchingEvents.length;
        found.push({ lng: avgLng, lat: avgLat, zoom: 6.0 });
      }
    }
  }

  if (found.length === 0) return undefined;
  if (found.length === 1) return found[0];

  const avgLng = found.reduce((s, c) => s + c.lng, 0) / found.length;
  const avgLat = found.reduce((s, c) => s + c.lat, 0) / found.length;

  const lngSpread = Math.max(...found.map((c) => c.lng)) - Math.min(...found.map((c) => c.lng));
  const latSpread = Math.max(...found.map((c) => c.lat)) - Math.min(...found.map((c) => c.lat));
  const spread = Math.max(lngSpread, latSpread);

  // Rough zoom based on geographic spread
  const zoom =
    spread > 120 ? 2.5 :
    spread > 60  ? 3.2 :
    spread > 30  ? 4.0 :
    spread > 15  ? 4.8 :
    spread > 8   ? 5.5 :
    spread > 4   ? 6.2 : 7.0;

  return { lng: avgLng, lat: avgLat, zoom };
}

/**
 * Normalises a raw country name string for consistent comparison.
 */
export function normaliseCountry(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Parse a terminal input like "India & Pakistan & Nepal", "Asia", "Europe & Africa" into target names.
 * Supports delimiters: '&', ',', and word 'and'.
 * Also strips optional prefixes like "country", "countries", "continent", "continents", "region", "regions".
 */
export function parseCountryInput(raw: string): string[] {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^(?:filter\s+)?(?:countries|country|continents|continent|regions|region)\s+/i, '');
  return cleaned
    .split(/\s*(?:&|,|\band\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Determines whether raw command text is meant to be a country or continent filter command.
 */
export function isCountryFilterCommand(raw: string, knownList?: string[]): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // Natural language questions go to AI
  if (trimmed.endsWith('?')) return false;

  const lower = trimmed.toLowerCase();

  // Explicit prefix
  if (
    lower.startsWith('country ') ||
    lower.startsWith('countries ') ||
    lower.startsWith('continent ') ||
    lower.startsWith('continents ') ||
    lower.startsWith('region ') ||
    lower.startsWith('regions ')
  ) {
    return true;
  }

  // Clear/Reset filter keywords
  if (
    [
      'all',
      'world',
      'reset',
      'global',
      'clear country',
      'clear countries',
      'clear continent',
      'clear continents',
      'reset country',
      'reset countries',
      'reset continent',
      'reset continents',
      'reset filter',
      'clear filter',
    ].includes(lower)
  ) {
    return true;
  }

  // Check parsed parts
  const parts = parseCountryInput(trimmed);
  if (parts.length === 0) return false;

  // Single word or multi-word: check if all parts are known countries/continents
  const allKnown = parts.every((p) => isKnownCountry(p, knownList));
  if (allKnown) return true;

  // If delimited by '&' or ',' and at least one part is a recognized country/continent
  if (parts.length > 1 && parts.some((p) => isKnownCountry(p, knownList))) {
    return true;
  }

  return false;
}

/**
 * Checks whether an event or conflict matches any item in the target list
 * (which may contain country names, continents, or regions).
 */
export function matchCountryOrContinent(
  item: { country?: string; region?: string },
  targets: string[]
): boolean {
  if (!targets || targets.length === 0) return true;

  const itemCountry = item.country?.trim().toLowerCase() ?? '';
  const itemRegion = item.region?.trim().toLowerCase() ?? '';
  const mappedRegion = item.country ? (COUNTRY_TO_REGION[item.country] || '').toLowerCase() : '';

  return targets.some((t) => {
    const target = t.trim().toLowerCase();
    if (!target) return false;

    // 1. Direct country name match
    if (itemCountry) {
      if (itemCountry === target || itemCountry.includes(target) || target.includes(itemCountry)) {
        return true;
      }
    }

    // 2. Direct region match
    if (itemRegion && (itemRegion === target || itemRegion.includes(target))) {
      return true;
    }
    if (mappedRegion && (mappedRegion === target || mappedRegion.includes(target))) {
      return true;
    }

    // 3. Continent broad match: "asia" matches "south asia", "east asia", "central asia", etc.
    if (target === 'asia' || target === 'asian') {
      if (itemRegion.includes('asia') || mappedRegion.includes('asia')) {
        return true;
      }
    }

    // 4. "americas" matches "north america", "south america", "americas"
    if (target === 'americas' || target === 'north america' || target === 'south america') {
      if (
        itemRegion.includes('america') ||
        mappedRegion.includes('america') ||
        itemRegion === 'americas' ||
        mappedRegion === 'americas'
      ) {
        return true;
      }
    }

    // 5. "oceania" matches "oceania & pacific" or "australia"
    if (target === 'oceania' || target === 'australasia' || target === 'pacific') {
      if (
        itemRegion.includes('oceania') ||
        mappedRegion.includes('oceania') ||
        itemRegion.includes('pacific') ||
        mappedRegion.includes('pacific')
      ) {
        return true;
      }
    }

    // 6. "middle east" matches "middle east", "mena"
    if (target === 'middle east' || target === 'mena' || target === 'mideast') {
      if (itemRegion.includes('middle east') || mappedRegion.includes('middle east')) {
        return true;
      }
    }

    // 7. "africa" matches "africa", "sub-saharan africa", "north africa"
    if (target === 'africa') {
      if (itemRegion.includes('africa') || mappedRegion.includes('africa')) {
        return true;
      }
    }

    // 8. "europe" matches "europe", "eastern europe", "western europe"
    if (target === 'europe' || target === 'eu') {
      if (itemRegion.includes('europe') || mappedRegion.includes('europe')) {
        return true;
      }
    }

    return false;
  });
}

