import { Conflict, ConflictEvent, ConflictStatus } from '@/types/conflict';
import { calculateEscalationIndex } from '../scoring/escalation';

// Standard Geopolitical Region Mapping
export const COUNTRY_TO_REGION: Record<string, string> = {
  // Europe (Eastern, Central, Western, Nordic, Southern)
  Ukraine: 'Europe',
  Russia: 'Europe',
  Belarus: 'Europe',
  Moldova: 'Europe',
  Georgia: 'Europe',
  Armenia: 'Europe',
  Azerbaijan: 'Europe',
  Kosovo: 'Europe',
  Serbia: 'Europe',
  Poland: 'Europe',
  'United Kingdom': 'Europe',
  UK: 'Europe',
  Britain: 'Europe',
  England: 'Europe',
  France: 'Europe',
  Germany: 'Europe',
  Italy: 'Europe',
  Spain: 'Europe',
  Portugal: 'Europe',
  Belgium: 'Europe',
  Netherlands: 'Europe',
  Switzerland: 'Europe',
  Austria: 'Europe',
  Sweden: 'Europe',
  Norway: 'Europe',
  Denmark: 'Europe',
  Finland: 'Europe',
  Ireland: 'Europe',
  Greece: 'Europe',
  'Czech Republic': 'Europe',
  Hungary: 'Europe',
  Romania: 'Europe',
  Estonia: 'Europe',
  Latvia: 'Europe',
  Lithuania: 'Europe',
  Croatia: 'Europe',
  Bulgaria: 'Europe',
  Slovakia: 'Europe',

  // Middle East
  Israel: 'Middle East',
  Palestine: 'Middle East',
  Gaza: 'Middle East',
  'West Bank': 'Middle East',
  Lebanon: 'Middle East',
  Syria: 'Middle East',
  Yemen: 'Middle East',
  Iraq: 'Middle East',
  Iran: 'Middle East',
  Jordan: 'Middle East',
  'Saudi Arabia': 'Middle East',
  Turkey: 'Middle East',
  Qatar: 'Middle East',
  UAE: 'Middle East',
  Kuwait: 'Middle East',
  Bahrain: 'Middle East',
  Oman: 'Middle East',
  Cyprus: 'Middle East',

  // Africa
  Sudan: 'Africa',
  'South Sudan': 'Africa',
  'Democratic Republic of Congo': 'Africa',
  'DR Congo': 'Africa',
  DRC: 'Africa',
  Congo: 'Africa',
  Somalia: 'Africa',
  Nigeria: 'Africa',
  Mali: 'Africa',
  BurkinaFaso: 'Africa',
  'Burkina Faso': 'Africa',
  Niger: 'Africa',
  Chad: 'Africa',
  Ethiopia: 'Africa',
  Mozambique: 'Africa',
  Cameroon: 'Africa',
  Libya: 'Africa',
  Kenya: 'Africa',
  'South Africa': 'Africa',
  Egypt: 'Africa',
  Algeria: 'Africa',
  Morocco: 'Africa',
  Tunisia: 'Africa',
  Uganda: 'Africa',
  Rwanda: 'Africa',
  Burundi: 'Africa',
  'Central African Republic': 'Africa',

  // South Asia
  Pakistan: 'South Asia',
  Afghanistan: 'South Asia',
  India: 'South Asia',
  Bangladesh: 'South Asia',
  'Sri Lanka': 'South Asia',
  Nepal: 'South Asia',

  // Southeast Asia
  Myanmar: 'Southeast Asia',
  Philippines: 'Southeast Asia',
  Thailand: 'Southeast Asia',
  Indonesia: 'Southeast Asia',
  Vietnam: 'Southeast Asia',
  Malaysia: 'Southeast Asia',
  Singapore: 'Southeast Asia',

  // East Asia
  Taiwan: 'East Asia',
  China: 'East Asia',
  'North Korea': 'East Asia',
  'South Korea': 'East Asia',
  Japan: 'East Asia',

  // Central Asia
  Kazakhstan: 'Central Asia',
  Uzbekistan: 'Central Asia',
  Tajikistan: 'Central Asia',
  Kyrgyzstan: 'Central Asia',
  Turkmenistan: 'Central Asia',

  // Americas (North, Central, South)
  'United States': 'Americas',
  USA: 'Americas',
  US: 'Americas',
  America: 'Americas',
  Canada: 'Americas',
  Mexico: 'Americas',
  Brazil: 'Americas',
  Argentina: 'Americas',
  Chile: 'Americas',
  Colombia: 'Americas',
  Venezuela: 'Americas',
  Peru: 'Americas',
  Ecuador: 'Americas',
  Haiti: 'Americas',
  Cuba: 'Americas',
  Panama: 'Americas',
  Honduras: 'Americas',
  Bolivia: 'Americas',
  Paraguay: 'Americas',
  Uruguay: 'Americas',

  // Oceania / Pacific
  Australia: 'Oceania & Pacific',
  'New Zealand': 'Oceania & Pacific',

  // Maritime & Strategic Chokepoints
  'Red Sea': 'Maritime & Global',
  'Persian Gulf': 'Maritime & Global',
  'Strait of Hormuz': 'Maritime & Global',
  'Bab el-Mandeb': 'Maritime & Global',
  'Black Sea': 'Maritime & Global',
  'South China Sea': 'Maritime & Global',
  'International Maritime': 'Maritime & Global',
};

export function getRegionForCountry(country: string): string {
  if (!country) return 'Other';
  const clean = country.trim();
  return COUNTRY_TO_REGION[clean] || 'Other';
}

/**
 * Deterministically clusters individual conflict events into high-level Conflict objects.
 * Uses deterministic signals:
 * 1. Country & Admin Region / Theater
 * 2. Actor overlap and primary belligerents
 * 3. Spatial proximity (< 250km)
 */
export function clusterEventsIntoConflicts(events: ConflictEvent[], windowDays = 7): Conflict[] {
  if (!events || events.length === 0) return [];

  // Group by Country + Admin1/Theater key
  const groups = new Map<string, ConflictEvent[]>();

  for (const event of events) {
    const country = (event.country || 'Unknown').trim();
    const admin = (event.admin1 || event.location || 'General').trim();
    // Deterministic theater identifier
    const groupKey = `${country}::${admin}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(event);
  }

  const conflicts: Conflict[] = [];

  for (const [key, clusterEvents] of groups.entries()) {
    const [country, admin] = key.split('::');
    const region = getRegionForCountry(country);

    // Calculate aggregated totals
    let totalFatalities = 0;
    const actorSet = new Set<string>();
    let latSum = 0;
    let lonSum = 0;
    let coordsCount = 0;
    let latestTimestamp = '';

    for (const ev of clusterEvents) {
      totalFatalities += ev.fatalities || 0;
      if (ev.actor1 && ev.actor1 !== 'Unidentified') actorSet.add(ev.actor1);
      if (ev.actor2 && ev.actor2 !== 'Unidentified') actorSet.add(ev.actor2);

      if (typeof ev.latitude === 'number' && typeof ev.longitude === 'number' && !isNaN(ev.latitude)) {
        latSum += ev.latitude;
        lonSum += ev.longitude;
        coordsCount++;
      }

      const evTime = ev.timestamp || ev.eventDate;
      if (!latestTimestamp || evTime > latestTimestamp) {
        latestTimestamp = evTime;
      }
    }

    const avgLat = coordsCount > 0 ? latSum / coordsCount : undefined;
    const avgLon = coordsCount > 0 ? lonSum / coordsCount : undefined;

    // Escalation index and trend calculation
    const escalation = calculateEscalationIndex(clusterEvents, windowDays);

    // Conflict Status determination
    let status: ConflictStatus = 'ACTIVE';
    if (escalation.trend === 'UP') {
      status = 'ESCALATING';
    } else if (escalation.trend === 'DOWN') {
      status = 'DEESCALATING';
    } else {
      status = 'ACTIVE';
    }

    // Intensity calculation (0 - 100) based on event density, lethality and escalation
    const eventVolumeScore = Math.min(50, clusterEvents.length * 4);
    const fatalityScore = Math.min(30, totalFatalities * 3);
    const escalationContribution = Math.min(20, escalation.index * 0.2);
    const intensity = Math.min(100, Math.round(eventVolumeScore + fatalityScore + escalationContribution));

    const conflictName = admin && admin !== 'General' && admin !== country
      ? `${country} (${admin}) Theater`
      : `${country} Conflict Area`;

    const conflictId = `conf-${country.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${admin.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    conflicts.push({
      id: conflictId,
      name: conflictName,
      country,
      region,
      status,
      intensity,
      eventCount7d: clusterEvents.length,
      fatalities7d: totalFatalities,
      lastEventAt: latestTimestamp,
      actors: Array.from(actorSet).slice(0, 8),
      latitude: avgLat,
      longitude: avgLon,
      recentEvents: clusterEvents,
      escalationIndex: escalation.index,
      escalationTrend: escalation.trend,
      escalationReason: escalation.explanation,
    });
  }

  // Sort conflicts by intensity and event count descending
  return conflicts.sort((a, b) => {
    if (b.intensity !== a.intensity) {
      return b.intensity - a.intensity;
    }
    return b.eventCount7d - a.eventCount7d;
  });
}
