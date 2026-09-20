export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type VerificationStatus = 'VERIFIED' | 'REPORTED' | 'UNCONFIRMED';

export type ConflictStatus = 'ACTIVE' | 'ESCALATING' | 'DEESCALATING' | 'CEASEFIRE' | 'UNKNOWN';

export type IntelCategory =
  | 'Warfare & Combat'
  | 'Defense & Strategy'
  | 'Geopolitics & Policy'
  | 'Economy & Global'
  | 'News/General';

export type IntelMode =
  | 'ALL'
  | 'WAR_COMBAT'
  | 'DEFENSE_STRATEGY'
  | 'GEOPOLITICS'
  | 'ECONOMY';

export interface ConflictEvent {
  id: string;
  eventDate: string; // ISO Date YYYY-MM-DD
  publishedAt?: string;
  country: string;
  region?: string;
  admin1?: string;
  location: string;
  latitude?: number;
  longitude?: number;

  eventType: string;
  subEventType?: string;

  actor1?: string;
  actor2?: string;

  fatalities?: number;

  severity: Severity;
  verificationStatus: VerificationStatus;

  /** True = kinetic/armed-conflict event (red dot). False = general news (dark blue dot). Defaults to true. */
  isConflict?: boolean;

  source?: string;
  sourceUrl?: string;
  notes?: string;

  timestamp?: string; // Formatted UTC or ISO
  
  /** High-level intelligence category determined via probabilistic multi-word scoring */
  primaryCategory?: IntelCategory;
  categoryConfidence?: number;

  /** Corroborating / merged news dispatches covering the same event */
  mergedEvents?: ConflictEvent[];
  mergedCount?: number;
  mergedSources?: string[];
}

export interface Conflict {
  id: string;
  name: string;

  country?: string;
  region?: string;

  status: ConflictStatus;

  intensity: number; // 0 to 100

  eventCount7d: number;
  fatalities7d: number;

  lastEventAt?: string;

  actors: string[];

  latitude?: number;
  longitude?: number;

  recentEvents: ConflictEvent[];

  escalationIndex: number; // 0 to 100
  escalationTrend: 'UP' | 'DOWN' | 'STABLE';
  escalationReason: string;
}

export interface GlobalOverviewStats {
  activeConflictAreas: number;
  highActivityRegions: number;
  recentIncidents: number;
  fatalitiesReported: number;
  escalatingAreas: number;
}

export interface DataFreshness {
  dataWindowDays: number;
  windowStartDate: string;
  windowEndDate: string;
  lastSyncAt: string;
  lastEventAt?: string;
  provider: string;
  status: 'LIVE' | 'NEAR-REALTIME' | 'CACHED' | 'NOT_CONFIGURED';
}

export type MapMode = 'CONFLICTS' | 'EVENTS' | 'ESCALATION' | 'HEATMAP';

export interface FilterState {
  days: 3 | 7 | 10;
  severity: 'ALL' | Severity;
  eventType: string;
  region: string;
  country?: string;
  /** Multi-country filter set from terminal. When non-empty, takes precedence over `country`. */
  countries?: string[];
  searchQuery?: string;
  intelMode?: IntelMode;
  storyMerging?: boolean;
  sources?: string[];
  firmsOverlay?: boolean;
}

export interface FirmsThermalPoint {
  id: string;
  latitude: number;
  longitude: number;
  brightTi4: number; // Brightness Temperature (Kelvin)
  scan?: number;
  track?: number;
  acqDate: string; // YYYY-MM-DD
  acqTime: string; // HHMM UTC
  satellite: string;
  confidence: string;
  brightTi5?: number;
  frp: number; // Fire Radiative Power in MW
  daynight: 'D' | 'N';
  theater?: string;
}

export interface FirmsFeatureProperties {
  id: string;
  latitude: number;
  longitude: number;
  brightTi4: number;
  acqDate: string;
  acqTime: string;
  satellite: string;
  confidence: string;
  frp: number;
  daynight: 'D' | 'N';
  theater?: string;
}

export interface FirmsGeoJsonResponse {
  success: boolean;
  count: number;
  lastUpdated: string;
  geojson: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: {
        type: 'Point';
        coordinates: [number, number];
      };
      properties: FirmsFeatureProperties;
    }>;
  };
}


export interface ApiExchange {
  id: string;
  timestamp: string;
  request: {
    endpoint: string;
    method: string;
    model: string;
    tools: string[];
    dateWindow: { start: string; end: string; days: number };
    promptSnippet: string;
    fullPrompt?: string;
    sourcesQueried: string[];
  };
  response: {
    status: number | string;
    statusText: string;
    latencyMs: number;
    eventsCount: number;
    conflictsCount?: number;
    groundingCitationsCount: number;
    sampleRecords: any[];
    rawSnippet: string;
    error?: string;
  };
}

