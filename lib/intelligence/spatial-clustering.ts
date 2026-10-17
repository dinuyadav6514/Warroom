/**
 * MODULE C: Spatial Frontline & Hotspot Clustering
 * Pure TypeScript grid-density DBSCAN implementation.
 * Clusters active kinetic incidents and thermal hotspots into
 * contiguous "Battlefront Corridors" with centroid, convex hull,
 * and frontline drift vector output.
 */

import { ConflictEvent, FirmsThermalPoint } from '@/types/conflict';

export interface ClusterPoint {
  lat: number;
  lng: number;
  type: 'event' | 'firms';
  id: string;
  severity?: string;
  frp?: number;
  timestamp: number;
}

export interface BattlefrontCluster {
  id: string;
  label: string;
  centroid: { lat: number; lng: number };
  convexHull: Array<{ lat: number; lng: number }>;
  points: ClusterPoint[];
  eventCount: number;
  firmsCount: number;
  maxFrp: number;
  headingDeg: number;       // Direction of frontline drift (0-360, clockwise from N)
  driftKmPerDay: number;    // Speed of centroid shift
  dominantCountry: string;
  threatLevel: 'HIGH' | 'MODERATE' | 'LOW';
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Haversine distance in km */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * DBSCAN clustering in geographic space.
 * @param points  Input points with lat/lng
 * @param epsKm   Neighbourhood radius in km
 * @param minPts  Minimum points to form a core
 */
function dbscan(points: ClusterPoint[], epsKm: number, minPts: number): number[] {
  const n = points.length;
  const labels = new Array<number>(n).fill(-1); // -1 = noise
  let clusterId = 0;

  function regionQuery(idx: number): number[] {
    const neighbours: number[] = [];
    const p = points[idx];
    for (let i = 0; i < n; i++) {
      if (distanceKm(p.lat, p.lng, points[i].lat, points[i].lng) <= epsKm) {
        neighbours.push(i);
      }
    }
    return neighbours;
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue;

    const neighbours = regionQuery(i);
    if (neighbours.length < minPts) {
      labels[i] = 0; // noise
      continue;
    }

    clusterId++;
    labels[i] = clusterId;

    const seed = [...neighbours];
    let si = 0;
    while (si < seed.length) {
      const qi = seed[si];
      si++;
      if (labels[qi] === 0) labels[qi] = clusterId; // border point
      if (labels[qi] !== -1) continue;
      labels[qi] = clusterId;
      const qNeighbours = regionQuery(qi);
      if (qNeighbours.length >= minPts) {
        for (const nb of qNeighbours) {
          if (!seed.includes(nb)) seed.push(nb);
        }
      }
    }
  }

  return labels;
}

/**
 * Compute convex hull using the Graham scan algorithm.
 * Returns hull vertices in counter-clockwise order.
 */
function convexHull(pts: Array<{ lat: number; lng: number }>): Array<{ lat: number; lng: number }> {
  if (pts.length <= 3) return pts;

  // Find bottom-most point (lowest lat, leftmost lng if tie)
  let pivot = pts[0];
  for (const p of pts) {
    if (p.lat < pivot.lat || (p.lat === pivot.lat && p.lng < pivot.lng)) pivot = p;
  }

  // Sort by polar angle from pivot
  const sorted = pts
    .filter((p) => p !== pivot)
    .sort((a, b) => {
      const angleA = Math.atan2(a.lat - pivot.lat, a.lng - pivot.lng);
      const angleB = Math.atan2(b.lat - pivot.lat, b.lng - pivot.lng);
      return angleA - angleB;
    });

  const stack: Array<{ lat: number; lng: number }> = [pivot];

  function cross(
    o: { lat: number; lng: number },
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ): number {
    return (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng);
  }

  for (const p of sorted) {
    while (stack.length >= 2 && cross(stack[stack.length - 2], stack[stack.length - 1], p) <= 0) {
      stack.pop();
    }
    stack.push(p);
  }

  return stack;
}

/**
 * Compute centroid (geographic mean) of a point set.
 */
function centroid(pts: ClusterPoint[]): { lat: number; lng: number } {
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  return { lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) };
}

/**
 * Compute bearing in degrees (0-360 clockwise from north) from point A to B.
 */
function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const dλ = toRad(lon2 - lon1);
  const y = Math.sin(dλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Main spatial clustering pipeline.
 * @param events   Kinetic incident events with coordinates
 * @param firms    NASA FIRMS thermal hotspots
 * @param epsKm    DBSCAN epsilon radius (default 35km for frontline granularity)
 * @param minPts   DBSCAN minimum cluster density (default 3)
 */
export function runSpatialClustering(
  events: ConflictEvent[],
  firms: FirmsThermalPoint[],
  epsKm = 35,
  minPts = 3
): BattlefrontCluster[] {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Build combined point list
  const points: ClusterPoint[] = [];

  for (const ev of events) {
    if (typeof ev.latitude !== 'number' || typeof ev.longitude !== 'number') continue;
    if (isNaN(ev.latitude) || isNaN(ev.longitude)) continue;
    if (ev.isConflict === false) continue; // Skip news/intel events

    const t = new Date(ev.timestamp || ev.publishedAt || ev.eventDate).getTime();
    points.push({
      lat: ev.latitude,
      lng: ev.longitude,
      type: 'event',
      id: ev.id,
      severity: ev.severity,
      timestamp: isNaN(t) ? now : t,
    });
  }

  for (const h of firms) {
    if (h.frp < 15) continue; // Only high-power thermal signatures
    const acqMs = new Date(`${h.acqDate}T${h.acqTime.padStart(4, '0').slice(0, 2)}:${h.acqTime.padStart(4, '0').slice(2, 4)}:00Z`).getTime();
    points.push({
      lat: h.latitude,
      lng: h.longitude,
      type: 'firms',
      id: h.id,
      frp: h.frp,
      timestamp: isNaN(acqMs) ? now : acqMs,
    });
  }

  if (points.length === 0) return [];

  const labels = dbscan(points, epsKm, minPts);

  // Group by cluster id (excluding noise = 0)
  const clusterMap = new Map<number, ClusterPoint[]>();
  for (let i = 0; i < labels.length; i++) {
    const cid = labels[i];
    if (cid <= 0) continue;
    if (!clusterMap.has(cid)) clusterMap.set(cid, []);
    clusterMap.get(cid)!.push(points[i]);
  }

  const clusters: BattlefrontCluster[] = [];
  let clusterIdx = 0;

  for (const [_cid, cPts] of clusterMap) {
    clusterIdx++;

    const eventPts = cPts.filter((p) => p.type === 'event');
    const firmsPts  = cPts.filter((p) => p.type === 'firms');
    const maxFrp = firmsPts.reduce((m, p) => Math.max(m, p.frp ?? 0), 0);

    // Full centroid
    const fullCentroid = centroid(cPts);

    // Frontline drift: centroid of first-48h points vs last-24h points
    const twoDaysAgo = now - 2 * MS_PER_DAY;
    const earlyPts = cPts.filter((p) => p.timestamp < twoDaysAgo);
    const recentPts = cPts.filter((p) => p.timestamp >= now - MS_PER_DAY);

    let headingDeg = 0;
    let driftKmPerDay = 0;

    if (earlyPts.length > 0 && recentPts.length > 0) {
      const earlyCentroid = centroid(earlyPts);
      const recentCentroid = centroid(recentPts);

      const driftKm = distanceKm(earlyCentroid.lat, earlyCentroid.lng, recentCentroid.lat, recentCentroid.lng);
      headingDeg = Math.round(bearingDeg(earlyCentroid.lat, earlyCentroid.lng, recentCentroid.lat, recentCentroid.lng));
      // Approximate drift speed: assume the time span is ~1 day
      driftKmPerDay = parseFloat(driftKm.toFixed(2));
    }

    // Convex hull
    const hullInput = cPts.map((p) => ({ lat: p.lat, lng: p.lng }));
    const hull = convexHull(hullInput);

    // Dominant country from events
    const countryCounts = new Map<string, number>();
    for (const pt of eventPts) {
      const evObj = events.find((e) => e.id === pt.id);
      if (evObj?.country) {
        countryCounts.set(evObj.country, (countryCounts.get(evObj.country) ?? 0) + 1);
      }
    }
    let dominantCountry = 'Unknown';
    let maxCount = 0;
    for (const [c, cnt] of countryCounts) {
      if (cnt > maxCount) { maxCount = cnt; dominantCountry = c; }
    }

    // Threat level
    const hasCritical = eventPts.some((pt) => {
      const ev = events.find((e) => e.id === pt.id);
      return ev?.severity === 'CRITICAL';
    });
    const threatLevel = hasCritical || maxFrp > 50 ? 'HIGH' : maxFrp > 20 || eventPts.length > 10 ? 'MODERATE' : 'LOW';

    clusters.push({
      id: `cluster-${clusterIdx}`,
      label: `Battlefront ${clusterIdx} (${dominantCountry})`,
      centroid: fullCentroid,
      convexHull: hull,
      points: cPts,
      eventCount: eventPts.length,
      firmsCount: firmsPts.length,
      maxFrp: parseFloat(maxFrp.toFixed(1)),
      headingDeg,
      driftKmPerDay,
      dominantCountry,
      threatLevel,
    });
  }

  // Sort by event count descending
  clusters.sort((a, b) => b.eventCount - a.eventCount);
  return clusters;
}
