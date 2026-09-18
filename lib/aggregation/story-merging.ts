import { ConflictEvent } from '@/types/conflict';

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'did', 'do',
  'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'just',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
  'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  // News wire boilerplate
  'says', 'said', 'reported', 'reports', 'news', 'breaking', 'dispatch', 'via',
  'update', 'latest', 'live', 'amid', 'over', 'across', 'new', 'official', 'officials',
]);

/**
 * Extracts normalized, non-stopword tokens from an event's title and description.
 */
function extractSignificantTokens(text: string): Set<string> {
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return new Set(cleaned);
}

/**
 * Approximate geographical distance in kilometers between two lat/lon pairs.
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * 111.32;
  const avgLatRad = ((lat1 + lat2) / 2 * Math.PI) / 180;
  const dLon = (lon2 - lon1) * 111.32 * Math.cos(avgLatRad);
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Determines whether two events represent the same real-world incident / news story.
 */
export function areEventsSimilar(a: ConflictEvent, b: ConflictEvent): boolean {
  if (a.id === b.id) return true;

  // 1. Geographic Check: Must be in the same country
  if (a.country.toLowerCase() !== b.country.toLowerCase()) {
    return false;
  }

  // If both have coordinates, verify spatial proximity (within 180 km)
  if (
    typeof a.latitude === 'number' &&
    typeof a.longitude === 'number' &&
    typeof b.latitude === 'number' &&
    typeof b.longitude === 'number'
  ) {
    const dist = calculateDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);
    if (dist > 180) {
      return false;
    }
  }

  // 2. Temporal Check: Must be within 36 hours of each other
  const timeA = new Date(a.publishedAt || a.timestamp || a.eventDate).getTime();
  const timeB = new Date(b.publishedAt || b.timestamp || b.eventDate).getTime();
  if (!isNaN(timeA) && !isNaN(timeB)) {
    const hoursDiff = Math.abs(timeA - timeB) / (1000 * 3600);
    if (hoursDiff > 36) {
      return false;
    }
  }

  // 3. Semantic Content Overlap
  const textA = `${a.notes?.split('.')[0] || ''} ${a.notes || ''}`;
  const textB = `${b.notes?.split('.')[0] || ''} ${b.notes || ''}`;

  const tokensA = extractSignificantTokens(textA);
  const tokensB = extractSignificantTokens(textB);

  if (tokensA.size === 0 || tokensB.size === 0) {
    return false;
  }

  // Calculate Jaccard similarity & shared token count
  let sharedCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      sharedCount++;
    }
  }

  const unionCount = new Set([...tokensA, ...tokensB]).size;
  const jaccard = unionCount > 0 ? sharedCount / unionCount : 0;

  // Matching criteria:
  // - High Jaccard similarity (>= 0.32) OR
  // - >= 4 shared significant domain tokens in the same city/country on the same day
  return jaccard >= 0.32 || sharedCount >= 4;
}

export interface MergedStoriesResult {
  mergedEvents: ConflictEvent[];
  totalOriginal: number;
  totalUnique: number;
  totalMerged: number;
}

/**
 * Smart Story Merging Engine.
 *
 * Groups cross-source duplicate reporting of the same event into a single primary record.
 * Attaches all corroborating dispatches into `primary.mergedEvents`.
 */
export function mergeSimilarStories(events: ConflictEvent[]): MergedStoriesResult {
  if (!events || events.length === 0) {
    return { mergedEvents: [], totalOriginal: 0, totalUnique: 0, totalMerged: 0 };
  }

  const clusters: ConflictEvent[][] = [];

  for (const event of events) {
    let matchedCluster: ConflictEvent[] | null = null;

    for (const cluster of clusters) {
      // Compare with the primary (first) event of the cluster
      if (areEventsSimilar(cluster[0], event)) {
        matchedCluster = cluster;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.push(event);
    } else {
      clusters.push([event]);
    }
  }

  const resultEvents: ConflictEvent[] = [];
  let totalMergedCount = 0;

  for (const cluster of clusters) {
    if (cluster.length === 1) {
      const single = cluster[0];
      resultEvents.push({
        ...single,
        mergedEvents: [single],
        mergedCount: 1,
        mergedSources: [single.source || 'Wire'],
      });
      continue;
    }

    // Multiple sources reporting the same event:
    // Select primary event by highest data completeness (has fatalities, longest notes, or verified status)
    cluster.sort((a, b) => {
      const scoreA = (a.fatalities ? a.fatalities * 2 : 0) +
        (a.notes ? a.notes.length : 0) +
        (a.verificationStatus === 'VERIFIED' ? 50 : 0);
      const scoreB = (b.fatalities ? b.fatalities * 2 : 0) +
        (b.notes ? b.notes.length : 0) +
        (b.verificationStatus === 'VERIFIED' ? 50 : 0);
      return scoreB - scoreA;
    });

    const primary = { ...cluster[0] };
    const uniqueSources = Array.from(new Set(cluster.map((e) => e.source || 'Wire')));

    primary.mergedEvents = cluster;
    primary.mergedCount = cluster.length;
    primary.mergedSources = uniqueSources;

    totalMergedCount += cluster.length - 1;
    resultEvents.push(primary);
  }

  // Sort descending by timestamp/date
  resultEvents.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.eventDate).getTime();
    const timeB = new Date(b.timestamp || b.eventDate).getTime();
    return timeB - timeA;
  });

  return {
    mergedEvents: resultEvents,
    totalOriginal: events.length,
    totalUnique: resultEvents.length,
    totalMerged: totalMergedCount,
  };
}
