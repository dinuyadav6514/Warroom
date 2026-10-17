/**
 * MODULE B: Time-Series Escalation & Anomaly Predictor
 * Implements EWMA smoothing and Z-Score anomaly detection on rolling
 * incident frequency and casualty data per country/theater.
 */

import { ConflictEvent, Conflict } from '@/types/conflict';

export interface EscalationForecast {
  country: string;
  theater: string;
  threatIndex: number;            // 0 – 100 normalised multi-variate score
  escalationVelocity: number;     // dE/dt: rate of change per 24h
  forecast48hProbability: number; // 0.0 – 1.0 probability of renewed kinetic exchange
  isAnomaly: boolean;             // Z-score > 2.0 trigger
  zScore: number;                 // Standardised score vs 10-day baseline
  ewmaRate: number;               // Smoothed daily event rate
  baselineMean: number;
  baselineSigma: number;
  recentCount24h: number;
  recentFatalities24h: number;
  trend: 'ESCALATING' | 'STABLE' | 'DEESCALATING';
}

export interface GlobalEscalationReport {
  topFlashpoints: EscalationForecast[];  // Top 5 sorted by threatIndex
  globalThreatIndex: number;             // Weighted global aggregate
  totalAnomalies: number;
  forecasts: EscalationForecast[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** EWMA smoothing alpha (decay factor) */
const EWMA_ALPHA = 0.3;

/**
 * Exponentially Weighted Moving Average over a sorted array of daily counts.
 */
function computeEWMA(dailyCounts: number[]): number {
  if (dailyCounts.length === 0) return 0;
  let ewma = dailyCounts[0];
  for (let i = 1; i < dailyCounts.length; i++) {
    ewma = EWMA_ALPHA * dailyCounts[i] + (1 - EWMA_ALPHA) * ewma;
  }
  return ewma;
}

/**
 * Compute mean and population standard deviation of a number array.
 */
function meanAndSigma(values: number[]): { mean: number; sigma: number } {
  if (values.length === 0) return { mean: 0, sigma: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, sigma: Math.sqrt(variance) };
}

/**
 * Bucket events into daily counts over a rolling `windowDays` window.
 * Returns an array of length `windowDays` (oldest to newest).
 */
function buildDailyBuckets(events: ConflictEvent[], windowDays = 10): number[] {
  const now = Date.now();
  const buckets: number[] = new Array(windowDays).fill(0);

  for (const ev of events) {
    const t = new Date(ev.timestamp || ev.publishedAt || ev.eventDate).getTime();
    if (isNaN(t)) continue;
    const daysAgo = (now - t) / MS_PER_DAY;
    if (daysAgo < 0 || daysAgo >= windowDays) continue;
    const dayIndex = windowDays - 1 - Math.floor(daysAgo); // 0 = oldest, last = today
    buckets[dayIndex]++;
  }

  return buckets;
}

/**
 * Build daily FATALITY buckets over a rolling window.
 */
function buildFatalityBuckets(events: ConflictEvent[], windowDays = 10): number[] {
  const now = Date.now();
  const buckets: number[] = new Array(windowDays).fill(0);

  for (const ev of events) {
    const t = new Date(ev.timestamp || ev.publishedAt || ev.eventDate).getTime();
    if (isNaN(t)) continue;
    const daysAgo = (now - t) / MS_PER_DAY;
    if (daysAgo < 0 || daysAgo >= windowDays) continue;
    const dayIndex = windowDays - 1 - Math.floor(daysAgo);
    buckets[dayIndex] += ev.fatalities ?? 0;
  }

  return buckets;
}

/**
 * Compute escalation forecast for a single country/theater.
 */
export function computeEscalationForecast(
  country: string,
  theater: string,
  events: ConflictEvent[],
  windowDays = 10
): EscalationForecast {
  const dailyCounts    = buildDailyBuckets(events, windowDays);
  const dailyFatalities = buildFatalityBuckets(events, windowDays);

  // Baseline: all days except today (last bucket)
  const baselineDays = dailyCounts.slice(0, windowDays - 1);
  const { mean: baselineMean, sigma: baselineSigma } = meanAndSigma(baselineDays);

  const todayCount       = dailyCounts[windowDays - 1];
  const yesterdayCount   = dailyCounts[windowDays - 2] ?? 0;
  const todayFatalities  = dailyFatalities[windowDays - 1];

  // EWMA over all days (gives smoothed daily rate)
  const ewmaRate = computeEWMA(dailyCounts);

  // Z-Score
  const sigma = baselineSigma > 0 ? baselineSigma : 1;
  const zScore = (todayCount - baselineMean) / sigma;
  const isAnomaly = zScore > 2.0;

  // Escalation velocity: change from yesterday to today
  const escalationVelocity = todayCount - yesterdayCount;

  // Severity weight: CRITICAL=4, HIGH=3, MODERATE=2, LOW=1
  const severityScore = events
    .filter((e) => {
      const t = new Date(e.timestamp || e.publishedAt || e.eventDate).getTime();
      return !isNaN(t) && (Date.now() - t) < MS_PER_DAY;
    })
    .reduce((s, e) => {
      const w = e.severity === 'CRITICAL' ? 4 : e.severity === 'HIGH' ? 3 : e.severity === 'MODERATE' ? 2 : 1;
      return s + w;
    }, 0);

  // Threat Index: 0-100 composite
  // Components:
  //  - Event acceleration (40%): z-score contribution
  //  - Severity weighted events (30%)
  //  - Fatalities (20%)
  //  - EWMA rate normalisation (10%)
  const zComponent         = Math.min(40, Math.max(0, (zScore / 4) * 40));
  const severityComponent  = Math.min(30, (severityScore / 20) * 30);
  const fatalityComponent  = Math.min(20, todayFatalities * 0.5);
  const ewmaComponent      = Math.min(10, (ewmaRate / 10) * 10);

  const threatIndex = Math.round(
    Math.min(100, Math.max(0,
      zComponent + severityComponent + fatalityComponent + ewmaComponent
    ))
  );

  // Forecast 48h probability (logistic function of z-score + velocity)
  const logitInput = 0.4 * zScore + 0.3 * escalationVelocity + 0.3 * (todayFatalities / 10);
  const forecast48hProbability = parseFloat(
    (1 / (1 + Math.exp(-logitInput))).toFixed(3)
  );

  // Trend
  let trend: 'ESCALATING' | 'STABLE' | 'DEESCALATING';
  if (escalationVelocity > 1 || zScore > 1.5) trend = 'ESCALATING';
  else if (escalationVelocity < -1 && zScore < -0.5) trend = 'DEESCALATING';
  else trend = 'STABLE';

  return {
    country,
    theater,
    threatIndex,
    escalationVelocity: parseFloat(escalationVelocity.toFixed(2)),
    forecast48hProbability,
    isAnomaly,
    zScore: parseFloat(zScore.toFixed(3)),
    ewmaRate: parseFloat(ewmaRate.toFixed(2)),
    baselineMean: parseFloat(baselineMean.toFixed(2)),
    baselineSigma: parseFloat(baselineSigma.toFixed(2)),
    recentCount24h: todayCount,
    recentFatalities24h: todayFatalities,
    trend,
  };
}

/**
 * Run escalation forecasting across all countries found in the dataset.
 */
export function runGlobalEscalationForecast(
  events: ConflictEvent[],
  conflicts: Conflict[],
  windowDays = 10
): GlobalEscalationReport {
  // Group events by country
  const countryMap = new Map<string, ConflictEvent[]>();

  for (const ev of events) {
    const c = ev.country || 'Unknown';
    if (!countryMap.has(c)) countryMap.set(c, []);
    countryMap.get(c)!.push(ev);
  }

  // Build theater name from conflicts lookup
  const theaterMap = new Map<string, string>();
  for (const c of conflicts) {
    if (c.country) theaterMap.set(c.country, c.name || c.country);
  }

  const forecasts: EscalationForecast[] = [];

  for (const [country, countryEvents] of countryMap) {
    if (countryEvents.length < 2) continue; // Skip low-data countries
    const theater = theaterMap.get(country) || country;
    const forecast = computeEscalationForecast(country, theater, countryEvents, windowDays);
    forecasts.push(forecast);
  }

  // Sort by threatIndex descending
  forecasts.sort((a, b) => b.threatIndex - a.threatIndex);

  // Global aggregate threat index: weighted mean of top 10
  const top10 = forecasts.slice(0, 10);
  const globalThreatIndex = top10.length > 0
    ? Math.round(top10.reduce((s, f) => s + f.threatIndex, 0) / top10.length)
    : 0;

  return {
    topFlashpoints: forecasts.slice(0, 5),
    globalThreatIndex,
    totalAnomalies: forecasts.filter((f) => f.isAnomaly).length,
    forecasts,
  };
}
