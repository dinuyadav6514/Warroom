/**
 * WarRoom AI Intelligence Analyst & SitRep Engine
 *
 * Powers interactive AI telemetry queries and automated Situation Reports (SitReps).
 * Uses Gemini API grounded in active 10-day conflict dataset, with deterministic fallback.
 */

import { Conflict, ConflictEvent, GlobalOverviewStats } from '@/types/conflict';

export interface AnalystQueryResponse {
  answer: string;
  citations: string[];
  keyFindings: string[];
  source: 'GEMINI_AI' | 'TACTICAL_SYNTHESIS';
  timestamp: string;
  queryTimeMs: number;
}

export interface SitRepResponse {
  title: string;
  summary: string;
  threatLevel: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE';
  executiveSummary: string;
  flashpoints: Array<{
    theater: string;
    country: string;
    incidents: number;
    fatalities: number;
    assessment: string;
  }>;
  tacticalDevelopments: string[];
  source: 'GEMINI_AI' | 'TACTICAL_SYNTHESIS';
  timestamp: string;
}

const ANALYST_SYSTEM_PROMPT = `You are the Lead Intelligence Watch Officer at the WarRoom Geopolitical Defense Terminal.
Your mission is to provide concise, accurate, objective, and military-grade intelligence briefings based strictly on the provided real-time conflict telemetry.
Rules:
1. Ground every statement strictly in the provided incidents. Do not hallucinate fictitious events or non-existent battles.
2. Use precise military and tactical terminology (e.g. kinetic strikes, counter-battery fire, loitering munitions, deep interdiction, CAS, insurgent ambushes).
3. Always cite specific locations, dates, actors, and reported casualty metrics when answering.
4. Keep the analysis direct, objective, and actionable without conversational filler or pleasantries.`;

/**
 * Executes a tactical natural-language intelligence query against active conflict telemetry.
 */
export async function askIntelligenceAnalyst(
  query: string,
  events: ConflictEvent[],
  conflicts: Conflict[],
  apiKey?: string
): Promise<AnalystQueryResponse> {
  const startTime = Date.now();
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;

  // Select top 30 most relevant events by keyword match or recency
  const qLower = query.toLowerCase();
  const matchedEvents = events
    .map((e) => {
      let score = 0;
      const text = `${e.country} ${e.location} ${e.eventType} ${e.subEventType || ''} ${e.actor1 || ''} ${e.actor2 || ''} ${e.notes || ''}`.toLowerCase();
      const words = qLower.split(/\s+/).filter((w) => w.length > 2);
      for (const w of words) {
        if (text.includes(w)) score += 5;
      }
      if (e.severity === 'CRITICAL') score += 3;
      if (e.severity === 'HIGH') score += 1;
      return { event: e, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map((item) => item.event);

  const contextEvents = matchedEvents.length > 0 ? matchedEvents : events.slice(0, 25);

  const eventsDigest = contextEvents
    .map((e, idx) => `[ID:${e.id}] ${e.eventDate} | ${e.country} (${e.location}) | ${e.eventType}: ${e.notes || 'No telemetry notes'} | Fatalities: ${e.fatalities || 0} | Source: ${e.source || 'Wire'}`)
    .join('\n');

  const topTheatersDigest = conflicts
    .slice(0, 10)
    .map((c) => `- ${c.name} (${c.country}): ${c.eventCount7d} events, ${c.fatalities7d} fatalities, Escalation Index: ${c.escalationIndex}/100 [${c.escalationTrend}]`)
    .join('\n');

  const promptText = `USER INTEL QUERY: "${query}"

ACTIVE CONFLICT TELEMETRY (TOP RECENT INCIDENTS):
${eventsDigest}

CURRENT THEATER ESCALATION METRICS:
${topTheatersDigest}

Provide an intelligence assessment structured as follows:
KEY FINDINGS:
- [Finding 1 with specific metrics/actors]
- [Finding 2]
- [Finding 3]

TACTICAL ASSESSMENT:
[2-3 dense analytical paragraphs addressing the query]

PRIMARY CITATIONS:
- [List 2-4 primary sources and locations referenced]`;

  if (geminiKey && geminiKey.trim() !== '') {
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${ANALYST_SYSTEM_PROMPT}\n\n${promptText}` }] }],
              generationConfig: { temperature: 0.15, maxOutputTokens: 1000 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return parseAnalystResponse(text, 'GEMINI_AI', startTime, contextEvents);
          }
        }
      } catch (err) {
        console.warn(`[AI Analyst] Model ${model} failed, trying fallback:`, err);
      }
    }
  }

  // Deterministic tactical synthesis fallback
  return generateDeterministicAnalystResponse(query, contextEvents, conflicts, startTime);
}

/**
 * Generates an executive Situation Report (SitRep) across all active theaters.
 */
export async function generateGlobalSitRep(
  events: ConflictEvent[],
  conflicts: Conflict[],
  stats: GlobalOverviewStats,
  apiKey?: string
): Promise<SitRepResponse> {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  const nowStr = new Date().toUTCString();

  const topTheaters = conflicts.slice(0, 8);
  const criticalEvents = events.filter((e) => e.severity === 'CRITICAL').slice(0, 10);
  const totalFatalities = events.reduce((sum, e) => sum + (e.fatalities || 0), 0);

  let threatLevel: SitRepResponse['threatLevel'] = 'HIGH';
  if (stats.escalatingAreas >= 5 || criticalEvents.length >= 10) {
    threatLevel = 'CRITICAL';
  } else if (stats.escalatingAreas <= 1 && totalFatalities < 50) {
    threatLevel = 'ELEVATED';
  }

  const promptText = `GENERATE GLOBAL EXECUTIVE SITUATION REPORT (SITREP) - ${nowStr}

ACTIVE OPERATIONAL SCOPE:
- Total Monitored Incidents: ${events.length}
- Identified Conflict Zones: ${conflicts.length}
- Reported Fatalities: ${totalFatalities}
- Escalating Flashpoints: ${stats.escalatingAreas}
- High-Activity Regions: ${stats.highActivityRegions}

KEY CRITICAL THEATERS:
${topTheaters.map((t) => `* ${t.name} (${t.country}): ${t.recentEvents.length} events, ${t.fatalities7d} KIA/fatalities, Escalation: ${t.escalationIndex}/100`).join('\n')}

RECENT KINETIC PEAKS:
${criticalEvents.map((e) => `* [${e.country}] ${e.eventType}: ${e.notes?.slice(0, 120)}... (${e.fatalities} KIA)`).join('\n')}

Format as an official defense intelligence brief:
1. EXECUTIVE SUMMARY (Strategic overview of global kinetic posture)
2. PRIORITY FLASHPOINTS (Bullet point per active theater)
3. TACTICAL ESCALATION INDICATORS (Key emerging patterns)`;

  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${ANALYST_SYSTEM_PROMPT}\n\n${promptText}` }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1200 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            title: `GLOBAL STRATEGIC INTELLIGENCE SITREP // ${new Date().toISOString().slice(0, 10)}`,
            summary: `Global Kinetic Threat Level: ${threatLevel} | ${events.length} Live Incidents | ${conflicts.length} Active Zones`,
            threatLevel,
            executiveSummary: text,
            flashpoints: topTheaters.map((t) => ({
              theater: t.name,
              country: t.country || 'Global',
              incidents: t.recentEvents.length,
              fatalities: t.fatalities7d,
              assessment: `Escalation index ${t.escalationIndex}/100 (${t.escalationTrend}). ${t.escalationReason || 'Active engagements logged.'}`,
            })),
            tacticalDevelopments: criticalEvents.slice(0, 5).map((e) => `[${e.country}] ${e.eventType}: ${e.notes?.slice(0, 140)}`),
            source: 'GEMINI_AI',
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('[SitRep] Gemini call failed, using tactical synthesis fallback:', e);
    }
  }

  // Deterministic SitRep
  return {
    title: `GLOBAL STRATEGIC INTELLIGENCE SITREP // ${new Date().toISOString().slice(0, 10)}`,
    summary: `Global Kinetic Threat Level: ${threatLevel} | ${events.length} Live Incidents | ${conflicts.length} Active Zones`,
    threatLevel,
    executiveSummary: `Global tactical reconnaissance monitors ${events.length} verified kinetic incidents across ${conflicts.length} combat theaters over the active operational window. Total recorded fatalities stand at ${totalFatalities}. Critical engagements are concentrated in Eastern Europe (Ukraine-Russia theater), the Middle East (Israel-Lebanon-Gaza axis), and the Horn of Africa (Sudan civil conflict). ${stats.escalatingAreas} theaters exhibit upward escalation trajectories driven by heavy artillery exchanges and expanded drone interdiction strikes.`,
    flashpoints: topTheaters.map((t) => ({
      theater: t.name,
      country: t.country || 'Global',
      incidents: t.recentEvents.length,
      fatalities: t.fatalities7d,
      assessment: `Escalation index ${t.escalationIndex}/100 (${t.escalationTrend}). Monitored actors: ${t.actors.slice(0, 3).join(', ')}. ${t.escalationReason || 'Sustained kinetic friction.'}`,
    })),
    tacticalDevelopments: criticalEvents.slice(0, 6).map((e) => `[${e.country}] ${e.eventType}: ${e.notes?.slice(0, 140)} (${e.source || 'Wire'})`),
    source: 'TACTICAL_SYNTHESIS',
    timestamp: new Date().toISOString(),
  };
}

function parseAnalystResponse(
  rawText: string,
  source: AnalystQueryResponse['source'],
  startTime: number,
  events: ConflictEvent[]
): AnalystQueryResponse {
  const keyFindings: string[] = [];
  const citations: string[] = [];

  const findingsMatch = rawText.match(/KEY FINDINGS:?([\s\S]*?)(?:TACTICAL ASSESSMENT|$)/i);
  if (findingsMatch) {
    findingsMatch[1]
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.]\s*/, '').trim())
      .filter((l) => l.length > 10)
      .forEach((f) => keyFindings.push(f));
  }

  const citationsMatch = rawText.match(/PRIMARY CITATIONS:?([\s\S]*?)$/i);
  if (citationsMatch) {
    citationsMatch[1]
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.]\s*/, '').trim())
      .filter((l) => l.length > 5)
      .forEach((c) => citations.push(c));
  }

  if (citations.length === 0) {
    const uniqueSources = Array.from(new Set(events.map((e) => e.source || 'Intelligence Wire'))).slice(0, 4);
    uniqueSources.forEach((s) => citations.push(s));
  }

  return {
    answer: rawText,
    keyFindings: keyFindings.length > 0 ? keyFindings : ['Tactical intelligence report generated from active event telemetry.'],
    citations,
    source,
    timestamp: new Date().toISOString(),
    queryTimeMs: Date.now() - startTime,
  };
}

function generateDeterministicAnalystResponse(
  query: string,
  events: ConflictEvent[],
  conflicts: Conflict[],
  startTime: number
): AnalystQueryResponse {
  const topEvents = events.slice(0, 5);
  const totalFatalities = topEvents.reduce((s, e) => s + (e.fatalities || 0), 0);
  const countries = Array.from(new Set(topEvents.map((e) => e.country)));

  const keyFindings = [
    `Identified ${topEvents.length} relevant kinetic incidents directly related to query "${query}".`,
    `Geographic footprint spans: ${countries.join(', ') || 'Global theaters'}.`,
    `Reported casualties among top matching incidents: ${totalFatalities} fatalities recorded.`,
  ];

  const answer = `TACTICAL ASSESSMENT FOR INTEL QUERY: "${query}"

Based on active reconnaissance across the 10-day operational dataset:
1. Operational Footprint: Tactical telemetry identifies activity across ${countries.join(', ')}. Incident modalities predominantly feature ${Array.from(new Set(topEvents.map((e) => e.eventType))).join(', ')}.
2. Key Engagements: Recent verified reports highlight engagements involving ${topEvents.map((e) => `${e.location} (${e.country})`).join('; ')}.
3. Escalation Context: Across matching sectors, telemetry indicates sustained friction with recorded casualties totaling ${totalFatalities}. Monitored conflict zones include ${conflicts.slice(0, 3).map((c) => `${c.name} [Index: ${c.escalationIndex}/100]`).join(', ')}.`;

  const citations = Array.from(new Set(topEvents.map((e) => e.source || 'Wire Service'))).slice(0, 4);

  return {
    answer,
    keyFindings,
    citations,
    source: 'TACTICAL_SYNTHESIS',
    timestamp: new Date().toISOString(),
    queryTimeMs: Date.now() - startTime,
  };
}