/**
 * MODULE E: High-Speed Fuzzy Command Intent Engine
 * Deterministic fuzzy tokenizer and Levenshtein distance matcher.
 * Resolves intelligence terminal commands in <2ms without LLM overhead.
 */

export type CommandIntent =
  | 'HOT_SPOTS'
  | 'FORECAST'
  | 'CHOKEPOINTS'
  | 'SORTIES_NEAR'
  | 'THREAT_INDEX'
  | 'CLUSTER_MAP'
  | 'CASCADE_RISK'
  | 'SENSOR_STATUS'
  | 'FLASHPOINTS'
  | 'THEME'
  | 'UNKNOWN';

export interface ParsedCommand {
  intent: CommandIntent;
  country?: string;
  timeWindowH?: number;   // Time window in hours if specified
  rawTokens: string[];
  confidence: number;     // 0.0 – 1.0 parse confidence
  resolvedAt: number;     // Performance: Date.now() at resolution
}

/** Fast Levenshtein edit distance between two strings using 1D Int32Array */
function levenshtein(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let v0 = new Int32Array(lb + 1);
  let v1 = new Int32Array(lb + 1);

  for (let i = 0; i <= lb; i++) v0[i] = i;

  for (let i = 0; i < la; i++) {
    v1[0] = i + 1;
    const aChar = a.charCodeAt(i);
    for (let j = 0; j < lb; j++) {
      const cost = aChar === b.charCodeAt(j) ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    const tmp = v0;
    v0 = v1;
    v1 = tmp;
  }
  return v0[lb];
}

/** Normalised similarity: 1.0 = identical, 0.0 = completely different */
function similarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  if (Math.abs(a.length - b.length) > 3) return 0.0;
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

/**
 * Intent keyword clusters with aliases (typo-tolerant)
 */
const INTENT_CLUSTERS: Array<{ intent: CommandIntent; keywords: string[] }> = [
  {
    intent: 'HOT_SPOTS',
    keywords: ['hot', 'hotspot', 'hotspots', 'fire', 'fires', 'thermal', 'firms', 'heatmap', 'burning', 'burn'],
  },
  {
    intent: 'FORECAST',
    keywords: ['forecast', 'predict', 'prediction', 'forcast', 'future', '48h', '48hr', 'next48', 'probability', 'prob'],
  },
  {
    intent: 'CHOKEPOINTS',
    keywords: ['chokepoint', 'chokepoints', 'choke', 'chockepoint', 'bottleneck', 'hub', 'hubs', 'strategic', 'conduit'],
  },
  {
    intent: 'SORTIES_NEAR',
    keywords: ['sorties', 'sortie', 'aviation', 'aircraft', 'airforce', 'airpower', 'flights', 'flight', 'adsb', 'near', 'patrol'],
  },
  {
    intent: 'THREAT_INDEX',
    keywords: ['threat', 'threatindex', 'index', 'danger', 'risk', 'score', 'rating', 'status'],
  },
  {
    intent: 'CLUSTER_MAP',
    keywords: ['cluster', 'clusters', 'cluser', 'frontline', 'front', 'battlefront', 'corridor', 'zone', 'zones'],
  },
  {
    intent: 'CASCADE_RISK',
    keywords: ['cascade', 'cascades', 'spill', 'spillover', 'contagion', 'spread', 'propagation', 'escalate'],
  },
  {
    intent: 'SENSOR_STATUS',
    keywords: ['sensor', 'sensors', 'corroboration', 'corroborate', 'verify', 'verification', 'confidence', 'confirmed'],
  },
  {
    intent: 'FLASHPOINTS',
    keywords: ['flashpoint', 'flashpoints', 'flash', 'top', 'worst', 'critical', 'highest', 'urgent'],
  },
  {
    intent: 'THEME',
    keywords: ['theme', 'themes', 'dark', 'light', 'mode', 'day', 'night', 'toggle', 'darkmode', 'lightmode'],
  },
];

/** Fast O(1) keyword-to-intent map for instant sub-millisecond dispatch */
const EXACT_INTENT_MAP = new Map<string, CommandIntent>();
for (const cluster of INTENT_CLUSTERS) {
  for (const kw of cluster.keywords) {
    EXACT_INTENT_MAP.set(kw, cluster.intent);
  }
}

/** Known country aliases for entity resolution */
const COUNTRY_ALIASES: Record<string, string> = {
  uk: 'United Kingdom', britain: 'United Kingdom', england: 'United Kingdom',
  usa: 'United States', america: 'United States', 'united states': 'United States', us: 'United States',
  uae: 'United Arab Emirates',
  rus: 'Russia', russ: 'Russia',
  ukr: 'Ukraine',
  isr: 'Israel', il: 'Israel',
  pal: 'Palestine', gaza: 'Palestine',
  leb: 'Lebanon',
  irn: 'Iran',
  syr: 'Syria',
  yem: 'Yemen',
  chi: 'China', prc: 'China',
  twn: 'Taiwan',
  pak: 'Pakistan',
  ind: 'India', bharat: 'India',
  afg: 'Afghanistan', afghan: 'Afghanistan',
  sud: 'Sudan',
  som: 'Somalia',
  irq: 'Iraq',
  tur: 'Turkey', tky: 'Turkey',
  sau: 'Saudi Arabia', ksa: 'Saudi Arabia',
  jor: 'Jordan',
  mya: 'Myanmar', burma: 'Myanmar',
  phi: 'Philippines',
};

/**
 * Resolve a raw token to a canonical country name using alias lookup
 * and fuzzy matching against a known country list.
 */
function resolveCountry(token: string, knownCountries: string[] = []): string | undefined {
  const lower = token.toLowerCase().trim();

  // Direct alias lookup
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];

  // Exact match in known countries
  const exact = knownCountries.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;

  // Fuzzy match: accept similarity >= 0.75
  let bestMatch: string | undefined;
  let bestScore = 0.74;

  for (const c of knownCountries) {
    const s = similarity(lower, c.toLowerCase());
    if (s > bestScore) {
      bestScore = s;
      bestMatch = c;
    }
  }

  return bestMatch;
}

/**
 * Resolve a token to an intent via O(1) keyword matching and fast Levenshtein fallback.
 */
function resolveIntent(token: string): { intent: CommandIntent; score: number } {
  const lower = token.toLowerCase();

  // 1. O(1) Instant exact keyword match (<0.001ms)
  if (EXACT_INTENT_MAP.has(lower)) {
    return { intent: EXACT_INTENT_MAP.get(lower)!, score: 1.0 };
  }

  // 2. Fuzzy match with fast distance filtering
  let bestIntent: CommandIntent = 'UNKNOWN';
  let bestScore = 0;

  for (const cluster of INTENT_CLUSTERS) {
    for (const kw of cluster.keywords) {
      if (Math.abs(lower.length - kw.length) > 3) continue;
      const s = similarity(lower, kw);
      if (s > bestScore) {
        bestScore = s;
        bestIntent = cluster.intent;
        if (bestScore >= 0.95) break;
      }
    }
    if (bestScore >= 0.95) break;
  }

  return { intent: bestScore >= 0.6 ? bestIntent : 'UNKNOWN', score: bestScore };
}

/**
 * Parse a raw terminal command string into a structured ParsedCommand.
 * Target: < 2ms resolution for all inputs.
 *
 * Supported patterns:
 *  - "hot" / "hotspots" → HOT_SPOTS
 *  - "forecast" → FORECAST
 *  - "chokepoints" → CHOKEPOINTS
 *  - "sorties near <country>" → SORTIES_NEAR with country
 *  - "threat" / "threatindex" → THREAT_INDEX
 *  - "cluster" / "frontline" → CLUSTER_MAP
 *  - "cascade" / "spillover" → CASCADE_RISK
 *  - "sensor" / "confidence" → SENSOR_STATUS
 *  - "flashpoints" / "top" → FLASHPOINTS
 */
export function parseIntelCommand(
  raw: string,
  knownCountries: string[] = []
): ParsedCommand {
  const resolvedAt = Date.now();
  if (!raw || !raw.trim()) {
    return { intent: 'UNKNOWN', rawTokens: [], confidence: 0, resolvedAt };
  }

  // Tokenize: lowercase, split on whitespace & punctuation, filter empty
  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return { intent: 'UNKNOWN', rawTokens: [], confidence: 0, resolvedAt };
  }

  // Detect time window tokens (e.g., "48h", "24hr", "72hours")
  let timeWindowH: number | undefined;
  for (const tok of tokens) {
    const m = tok.match(/^(\d+)h/);
    if (m) { timeWindowH = parseInt(m[1], 10); break; }
  }

  // Detect "near <country>" pattern for SORTIES_NEAR
  let nearCountry: string | undefined;
  const nearIdx = tokens.indexOf('near');
  if (nearIdx !== -1 && nearIdx < tokens.length - 1) {
    const candidateTokens = tokens.slice(nearIdx + 1).join(' ');
    nearCountry = resolveCountry(candidateTokens, knownCountries);
  }

  // Score each token against intent clusters
  const intentScores = new Map<CommandIntent, number>();
  for (const tok of tokens) {
    const { intent, score } = resolveIntent(tok);
    if (intent !== 'UNKNOWN') {
      const prev = intentScores.get(intent) ?? 0;
      intentScores.set(intent, Math.max(prev, score));
    }
  }

  // Special override: if "near" is present alongside sortie keywords, force SORTIES_NEAR
  if (nearIdx !== -1) {
    intentScores.set('SORTIES_NEAR', 0.95);
  }

  // Pick highest scoring intent
  let finalIntent: CommandIntent = 'UNKNOWN';
  let maxScore = 0.59; // Minimum acceptance threshold
  for (const [intent, score] of intentScores) {
    if (score > maxScore) { maxScore = score; finalIntent = intent; }
  }

  // Resolve any mentioned country entity (for non-near queries too)
  let country = nearCountry;
  if (!country) {
    for (const tok of tokens) {
      const resolved = resolveCountry(tok, knownCountries);
      if (resolved) { country = resolved; break; }
    }
  }

  return {
    intent: finalIntent,
    country,
    timeWindowH,
    rawTokens: tokens,
    confidence: parseFloat(maxScore.toFixed(3)),
    resolvedAt,
  };
}

/**
 * Determine whether a raw command string is an intelligence AI command
 * (as opposed to a country filter command or AI question).
 * Returns true if the command maps to a known intent.
 */
export function isIntelCommand(raw: string): boolean {
  const lower = raw.toLowerCase().trim();
  // Quick prefix check before invoking full parser
  const quickPrefixes = [
    'hot', 'forecast', 'choke', 'sortie', 'threat', 'cluster', 'frontline',
    'cascade', 'sensor', 'flashpoint', 'corrobor', 'verify', 'risk', 'predict',
    'theme', 'light', 'dark', 'mode',
  ];
  return quickPrefixes.some((p) => lower.startsWith(p) || lower.includes(p));
}
