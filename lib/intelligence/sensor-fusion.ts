/**
 * MODULE A: Multi-Sensor Correlation & Verification Engine
 * Performs spatiotemporal cross-correlation of conflict events against
 * NASA FIRMS thermal hotspots and military ADS-B sorties.
 * Produces a confidence-weighted VerifiedIncident array.
 */

import { ConflictEvent, FirmsThermalPoint, MilitaryAircraft } from '@/types/conflict';

export interface VerifiedIncident {
  event: ConflictEvent;
  confidenceScore: number;       // 0.00 – 1.00
  confidenceLabel: string;       // e.g. 'CONFIRMED 95%'
  corroboratingFirmsIds: string[];
  corroboratingAviationIds: string[];
  firmsCount: number;
  aviationCount: number;
  maxFrp: number;               // Highest FRP value in corroborating hotspots
  activeSorties: string[];      // Callsigns of proximate aircraft
}

/** Haversine great-circle distance in kilometres */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Parses a FIRMS acqDate + acqTime string into a UTC epoch millisecond timestamp.
 * acqDate format: 'YYYY-MM-DD', acqTime format: 'HHMM' (zero-padded 4-digit 24h UTC)
 */
function firmsTimestampMs(acqDate: string, acqTime: string): number {
  const timeStr = acqTime.padStart(4, '0');
  const hh = timeStr.slice(0, 2);
  const mm = timeStr.slice(2, 4);
  return new Date(`${acqDate}T${hh}:${mm}:00Z`).getTime();
}

/**
 * Parses a ConflictEvent timestamp or eventDate to UTC epoch ms.
 */
function eventTimestampMs(event: ConflictEvent): number {
  const raw = event.timestamp || event.publishedAt || event.eventDate;
  if (!raw) return Date.now();
  const t = new Date(raw).getTime();
  return isNaN(t) ? Date.now() : t;
}

/**
 * Core sensor fusion function.
 * @param events      Array of active conflict events with lat/lng
 * @param firms       Array of NASA FIRMS thermal hotspot records
 * @param aviation    Array of live military ADS-B aircraft tracks
 * @returns           Array of VerifiedIncident with computed confidence
 */
export function runSensorFusion(
  events: ConflictEvent[],
  firms: FirmsThermalPoint[],
  aviation: MilitaryAircraft[]
): VerifiedIncident[] {
  const FIRMS_RADIUS_KM   = 25;
  const AVIATION_RADIUS_KM = 150;
  const FIRMS_TIME_WINDOW_MS   = 6 * 60 * 60 * 1000;  // ±6 hours
  const AVIATION_TIME_WINDOW_MS = 3 * 60 * 60 * 1000; // ±3 hours
  const HIGH_FRP_THRESHOLD = 15; // MW

  const verified: VerifiedIncident[] = [];

  for (const event of events) {
    if (
      typeof event.latitude !== 'number' ||
      typeof event.longitude !== 'number' ||
      isNaN(event.latitude) ||
      isNaN(event.longitude)
    ) continue;

    const evTime = eventTimestampMs(event);
    const evLat  = event.latitude;
    const evLon  = event.longitude;

    // ── FIRMS Correlation ────────────────────────────────────────────────
    const matchedFirms: FirmsThermalPoint[] = [];
    let maxFrp = 0;

    for (const hotspot of firms) {
      const dist = haversineKm(evLat, evLon, hotspot.latitude, hotspot.longitude);
      if (dist > FIRMS_RADIUS_KM) continue;

      const hTime = firmsTimestampMs(hotspot.acqDate, hotspot.acqTime);
      const timeDelta = Math.abs(hTime - evTime);
      if (timeDelta > FIRMS_TIME_WINDOW_MS) continue;

      matchedFirms.push(hotspot);
      if (hotspot.frp > maxFrp) maxFrp = hotspot.frp;
    }

    const hasHighFrpCluster = matchedFirms.some((h) => h.frp >= HIGH_FRP_THRESHOLD);

    // ── Aviation Correlation ─────────────────────────────────────────────
    const matchedAviation: MilitaryAircraft[] = [];
    const COMBAT_CATEGORIES = new Set([
      'RECON_ISR',
      'AIRBORNE_EARLY_WARNING',
      'TANKER_REFUEL',
      'FIGHTER_STRIKE',
    ]);

    for (const aircraft of aviation) {
      const dist = haversineKm(evLat, evLon, aircraft.latitude, aircraft.longitude);
      if (dist > AVIATION_RADIUS_KM) continue;

      // Time check: use seenSeconds field as a recency proxy (within 3h = 10800s)
      const seenSec = aircraft.seenSeconds ?? 0;
      if (seenSec > AVIATION_TIME_WINDOW_MS / 1000) continue;

      // Only count tactically relevant sorties
      if (COMBAT_CATEGORIES.has(aircraft.category)) {
        matchedAviation.push(aircraft);
      }
    }

    // ── Confidence Score Calculation ─────────────────────────────────────
    let confidence = 0.40; // Base: single unverified report

    if (hasHighFrpCluster) {
      confidence += 0.35; // Corroborated by thermal fire cluster
    } else if (matchedFirms.length > 0) {
      // Partial credit for low-FRP hits (conflict-zone industrial/gas flares still corroborate)
      confidence += 0.15;
    }

    if (matchedAviation.length > 0) {
      confidence += 0.25; // Military reconnaissance/fighter sortie in proximity
    }

    // Cap to [0.40, 1.00]
    confidence = Math.min(1.0, Math.max(0.40, confidence));

    // ── Verification Status Override ──────────────────────────────────────
    // If already server-verified and no sensor data, nudge score up
    if (event.verificationStatus === 'VERIFIED' && confidence < 0.60) {
      confidence = 0.60;
    }

    const pct = Math.round(confidence * 100);
    const confidenceLabel =
      pct >= 90 ? `CONFIRMED ${pct}%` :
      pct >= 70 ? `CORROBORATED ${pct}%` :
      pct >= 55 ? `PROBABLE ${pct}%` :
                  `UNVERIFIED ${pct}%`;

    verified.push({
      event,
      confidenceScore: parseFloat(confidence.toFixed(2)),
      confidenceLabel,
      corroboratingFirmsIds: matchedFirms.map((h) => h.id),
      corroboratingAviationIds: matchedAviation.map((a) => a.id),
      firmsCount: matchedFirms.length,
      aviationCount: matchedAviation.length,
      maxFrp: parseFloat(maxFrp.toFixed(1)),
      activeSorties: matchedAviation.map((a) => a.callsign),
    });
  }

  // Sort descending by confidence
  verified.sort((a, b) => b.confidenceScore - a.confidenceScore);
  return verified;
}

/**
 * Lightweight summary stats from a verified incident array.
 */
export interface SensorFusionSummary {
  totalVerified: number;
  avgConfidence: number;
  highConfidenceCount: number;  // >= 0.75
  corroborationRate: number;    // fraction with at least 1 sensor hit
}

export function getSensorFusionSummary(verified: VerifiedIncident[]): SensorFusionSummary {
  if (verified.length === 0) {
    return { totalVerified: 0, avgConfidence: 0, highConfidenceCount: 0, corroborationRate: 0 };
  }

  const total = verified.length;
  const sumConf = verified.reduce((s, v) => s + v.confidenceScore, 0);
  const highCount = verified.filter((v) => v.confidenceScore >= 0.75).length;
  const corrobCount = verified.filter(
    (v) => v.firmsCount > 0 || v.aviationCount > 0
  ).length;

  return {
    totalVerified: total,
    avgConfidence: parseFloat((sumConf / total).toFixed(3)),
    highConfidenceCount: highCount,
    corroborationRate: parseFloat((corrobCount / total).toFixed(3)),
  };
}
