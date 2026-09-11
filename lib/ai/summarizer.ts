import { Conflict, ConflictEvent } from '@/types/conflict';
import { STRICT_AI_SYSTEM_PROMPT, buildConflictSummaryPrompt } from './prompts';

export interface AiBriefResponse {
  retrievedSummary: string[];
  aiAnalysis: string;
  source: 'GEMINI' | 'ANTHROPIC' | 'RULE_BASED_SYNTHESIS';
  timestamp: string;
}

/**
 * Generates an analytical intelligence brief for a conflict based strictly on retrieved data.
 */
export async function generateConflictBrief(
  conflict: Conflict,
  windowDays = 7,
  apiKey?: string
): Promise<AiBriefResponse> {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Format events into compact structured digest
  const eventsDigest = conflict.recentEvents
    .slice(0, 15)
    .map((e, idx) => {
      return `[${idx + 1}] Date: ${e.eventDate} | Loc: ${e.location} | Type: ${e.eventType} (${e.subEventType || 'N/A'}) | Fatalities: ${e.fatalities || 0} | Actors: ${e.actor1 || 'N/A'} vs ${e.actor2 || 'N/A'} | Notes: ${e.notes || 'No notes provided'}`;
    })
    .join('\n');

  const prompt = buildConflictSummaryPrompt({
    conflictName: conflict.name,
    country: conflict.country || 'Unknown',
    windowDays,
    eventCount: conflict.eventCount7d,
    fatalities: conflict.fatalities7d,
    escalationIndex: conflict.escalationIndex,
    escalationTrend: conflict.escalationTrend,
    actors: conflict.actors,
    eventsSummary: eventsDigest,
  });

  // Attempt Gemini API if key available
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${STRICT_AI_SYSTEM_PROMPT}\n\n${prompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2, // Low temperature to prevent hallucination
              maxOutputTokens: 800,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return parseAiOutput(text, 'GEMINI', conflict);
        }
      }
    } catch (e) {
      console.warn('Gemini API request failed, falling back to rule-based synthesis', e);
    }
  }

  // Attempt Anthropic API if key available
  if (anthropicKey && anthropicKey.trim() !== '') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 800,
          system: STRICT_AI_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.content?.[0]?.text;
        if (text) {
          return parseAiOutput(text, 'ANTHROPIC', conflict);
        }
      }
    } catch (e) {
      console.warn('Anthropic API request failed, falling back to rule-based synthesis', e);
    }
  }

  // High quality deterministic rule-based synthesis fallback (strictly follows evidence rules)
  return generateDeterministicBrief(conflict, windowDays);
}

function parseAiOutput(text: string, source: 'GEMINI' | 'ANTHROPIC', conflict: Conflict): AiBriefResponse {
  // Extract sections if present
  let retrievedSummary: string[] = [];
  let aiAnalysis = text;

  if (text.includes('[1]') && text.includes('[2]')) {
    const parts = text.split('[2]');
    const p1 = parts[0].replace(/\[1\].*?\n/, '').trim();
    retrievedSummary = p1
      .split('\n')
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter((s) => s.length > 0);
    aiAnalysis = (parts[1] || '').replace(/AI ANALYSIS.*?\n/i, '').trim();
  } else {
    // Default bullet points from recent events
    retrievedSummary = conflict.recentEvents.slice(0, 5).map((e) =>
      `[${e.eventDate}] ${e.eventType} in ${e.location} (${e.fatalities || 0} fatalities reported)`
    );
  }

  return {
    retrievedSummary,
    aiAnalysis,
    source,
    timestamp: new Date().toISOString(),
  };
}

function generateDeterministicBrief(conflict: Conflict, windowDays: number): AiBriefResponse {
  const events = conflict.recentEvents;
  const highSeverityCount = events.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const primaryTypes = Array.from(new Set(events.map((e) => e.eventType)));

  const retrievedSummary = events.slice(0, 6).map((e) => {
    return `[${e.eventDate}] ${e.eventType}${e.subEventType ? ` (${e.subEventType})` : ''} at ${e.location} — ${e.fatalities || 0} reported fatalities. Source: ${e.source || 'GEMINI GROUNDED'}`;
  });

  const aiAnalysis = `Observed activity in ${conflict.name} comprises ${conflict.eventCount7d} reported incidents over the last ${windowDays} days resulting in ${conflict.fatalities7d} recorded fatalities. Primary operational modalities include ${primaryTypes.join(', ')}. Of these incidents, ${highSeverityCount} meet high/critical severity thresholds. Current Escalation Index is rated at ${conflict.escalationIndex}/100 with a ${conflict.escalationTrend} trend. Data demonstrates sustained engagement among identified actors: ${conflict.actors.slice(0, 5).join(', ')}.`;

  return {
    retrievedSummary,
    aiAnalysis,
    source: 'RULE_BASED_SYNTHESIS',
    timestamp: new Date().toISOString(),
  };
}
