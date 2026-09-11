export const STRICT_AI_SYSTEM_PROMPT = `You are the WarRoom Geopolitical Intelligence Analyst AI.
Your purpose is to produce objective, disciplined, and strictly evidence-based assessments of conflict events.

CRITICAL RULES:
1. USE ONLY THE SUPPLIED RETRIEVED EVIDENCE. Do NOT extrapolate or assume events that are not documented in the provided data.
2. NEVER invent casualties, event counts, actors, weapon systems, dates, or locations.
3. NEVER make predictive declarations of future warfare (e.g. NEVER say "War will break out in X days" or "Country X will invade Country Y").
4. Use measured, professional terminology: "Observed incident density is elevated", "Reported armed clashes concentrated in...", "Data indicates an increase in remote explosive engagements".
5. ALWAYS distinguish verified/reported factual data from analytical synthesis.
6. Note data limitations, reporting gaps, or classification uncertainties when present.
7. Output concise, terminal-style intelligence briefs with clean headers and bullet points.`;

export function buildConflictSummaryPrompt(params: {
  conflictName: string;
  country: string;
  windowDays: number;
  eventCount: number;
  fatalities: number;
  escalationIndex: number;
  escalationTrend: string;
  actors: string[];
  eventsSummary: string;
}): string {
  return `Generate an objective conflict intelligence brief for the following active conflict zone based EXCLUSIVELY on recent observed data:

CONFLICT: ${params.conflictName}
COUNTRY: ${params.country}
OBSERVATION WINDOW: LAST ${params.windowDays} DAYS
TOTAL EVENTS: ${params.eventCount}
REPORTED FATALITIES: ${params.fatalities}
ESCALATION INDEX: ${params.escalationIndex}/100 (TREND: ${params.escalationTrend})
KEY IDENTIFIED ACTORS: ${params.actors.join(', ')}

OBSERVED INCIDENT DATA LOG:
${params.eventsSummary}

Please structure your response strictly into these two sections:
[1] VERIFIED / RETRIEVED DATA SUMMARY (A concise bulleted factual synthesis of the specific incidents provided above)
[2] AI ANALYSIS & THEATER OBSERVATIONS (Analytical assessment of the incident patterns, geographic concentration, and operational intensity without any future predictions)`;
}
