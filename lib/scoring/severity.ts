import { Severity } from '@/types/conflict';

export interface SeverityScoreDetail {
  severity: Severity;
  score: number; // 0 - 100
  factors: {
    fatalitiesFactor: number;
    eventTypeFactor: number;
    recencyFactor: number;
    actorFactor: number;
  };
  explanation: string;
}

/**
 * Transparent severity scoring model for geopolitical conflict events.
 *
 * Scoring methodology:
 * 1. Fatality Factor (0-40 pts):
 *    - 0 fatalities: 0 pts
 *    - 1-2 fatalities: 15 pts
 *    - 3-9 fatalities: 25 pts
 *    - 10-24 fatalities: 35 pts
 *    - 25+ fatalities: 40 pts
 *
 * 2. Event Type Lethality / Strategic Impact (0-35 pts):
 *    - Explosions / Remote violence / Air / Drone strike: 30-35 pts
 *    - Armed clashes / Battles / State forces engagements: 25-30 pts
 *    - Violence against civilians: 25-30 pts
 *    - Mob violence / Riots with property damage: 15-20 pts
 *    - Peaceful protests / Strategic developments / Non-violent arrests: 5-10 pts
 *
 * 3. Recency Factor (0-15 pts):
 *    - Within last 24h: 15 pts
 *    - Within last 48h: 10 pts
 *    - Within last 72h+: 5 pts
 *
 * 4. Actor Multiplier / State/Organized Force (0-10 pts):
 *    - Multiple identified organized armed forces or state militaries: 10 pts
 *    - Single organized force: 5 pts
 *    - Unidentified / civilian groups: 2 pts
 *
 * Classification thresholds:
 * - 70+ => CRITICAL
 * - 45-69 => HIGH
 * - 25-44 => MODERATE
 * - 0-24 => LOW
 */
export function calculateSeverity(event: {
  fatalities?: number;
  eventType?: string;
  subEventType?: string;
  eventDate?: string;
  timestamp?: string;
  actor1?: string;
  actor2?: string;
}): SeverityScoreDetail {
  const fatalities = event.fatalities ?? 0;
  const eventType = (event.eventType || '').toLowerCase();
  const subType = (event.subEventType || '').toLowerCase();

  // 1. Fatalities Factor (0-40)
  let fatalitiesFactor = 0;
  if (fatalities >= 25) fatalitiesFactor = 40;
  else if (fatalities >= 10) fatalitiesFactor = 35;
  else if (fatalities >= 3) fatalitiesFactor = 25;
  else if (fatalities >= 1) fatalitiesFactor = 15;
  else fatalitiesFactor = 0;

  // 2. Event Type Factor (0-35)
  // Non-kinetic / diplomatic / political events explicitly score 0 and are capped at MODERATE max.
  const NON_KINETIC_TYPES = [
    'strategic development', 'diplomatic', 'speech', 'statement', 'sanctions',
    'summit', 'ceasefire', 'truce', 'peace', 'agreement', 'protest', 'demonstration',
  ];
  const isNonKinetic = NON_KINETIC_TYPES.some(
    (nk) => eventType.includes(nk) || subType.includes(nk)
  );

  let eventTypeFactor = 10;
  if (isNonKinetic) {
    eventTypeFactor = 3; // Hard cap: non-kinetic events cannot contribute much to severity
  } else if (
    eventType.includes('air') ||
    eventType.includes('drone') ||
    eventType.includes('explosion') ||
    eventType.includes('remote violence') ||
    subType.includes('air') ||
    subType.includes('missile') ||
    subType.includes('drone') ||
    subType.includes('shelling')
  ) {
    eventTypeFactor = 35;
  } else if (
    eventType.includes('battle') ||
    eventType.includes('clash') ||
    eventType.includes('armed') ||
    subType.includes('armed clash')
  ) {
    eventTypeFactor = 30;
  } else if (
    eventType.includes('civilian') ||
    eventType.includes('violence against civilians') ||
    subType.includes('attack')
  ) {
    eventTypeFactor = 28;
  } else if (eventType.includes('riot') || eventType.includes('mob')) {
    eventTypeFactor = 18;
  } else if (eventType.includes('protest')) {
    eventTypeFactor = 8;
  }

  // 3. Recency Factor (0-15)
  let recencyFactor = 5;
  const dateStr = event.timestamp || event.eventDate;
  if (dateStr) {
    const eventTime = new Date(dateStr).getTime();
    if (!isNaN(eventTime)) {
      const hoursAgo = (Date.now() - eventTime) / (1000 * 60 * 60);
      if (hoursAgo <= 24) recencyFactor = 15;
      else if (hoursAgo <= 48) recencyFactor = 10;
      else recencyFactor = 5;
    }
  }

  // 4. Actor Factor (0-10)
  let actorFactor = 3;
  if (event.actor1 && event.actor2 && event.actor1.trim() !== '' && event.actor2.trim() !== '') {
    actorFactor = 10; // Bilateral military/group clash
  } else if (event.actor1 && event.actor1.trim() !== '') {
    actorFactor = 6;
  }

  const totalScore = Math.min(100, fatalitiesFactor + eventTypeFactor + recencyFactor + actorFactor);

  let severity: Severity = 'LOW';
  if (isNonKinetic) {
    // Non-kinetic events (speeches, diplomatic events, summits, etc.) are always LOW
    severity = 'LOW';
  } else if (totalScore >= 70 || fatalities >= 15) {
    severity = 'CRITICAL';
  } else if (totalScore >= 45 || fatalities >= 3) {
    severity = 'HIGH';
  } else if (totalScore >= 25 || fatalities >= 1) {
    severity = 'MODERATE';
  } else {
    severity = 'LOW';
  }

  const explanation = `${severity} (Score: ${totalScore}/100) — Fatalities: ${fatalities} (${fatalitiesFactor}pts), Type: "${event.eventType || 'Unknown'}" (${eventTypeFactor}pts), Recency: (${recencyFactor}pts), Actors: (${actorFactor}pts)`;

  return {
    severity,
    score: totalScore,
    factors: {
      fatalitiesFactor,
      eventTypeFactor,
      recencyFactor,
      actorFactor,
    },
    explanation,
  };
}
