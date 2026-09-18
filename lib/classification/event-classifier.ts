import { IntelCategory } from '@/types/conflict';

export interface CategoryDefinition {
  name: IntelCategory;
  phrases: string[]; // High-weight multi-word compound phrases (weight 2.5)
  keywords: string[]; // Single domain keywords (weight 1.0)
  subTypeRules: Array<{ subType: string; triggers: string[] }>;
}

/**
 * Large dictionaries of triggering phrases and keywords for each intelligence category.
 * Multi-word compound phrases carry higher weight (2.5) than single keywords (1.0).
 */
export const CATEGORY_DEFINITIONS: Record<IntelCategory, CategoryDefinition> = {
  'Warfare & Combat': {
    name: 'Warfare & Combat',
    phrases: [
      'air strike', 'airstrike', 'drone strike', 'drone attack', 'missile strike',
      'rocket barrage', 'rocket volley', 'artillery fire', 'heavy shelling',
      'mortar attack', 'howitzer fire', 'ground offensive', 'counter-offensive',
      'infantry assault', 'armed clash', 'armed clashes', 'fire exchange',
      'exchange of fire', 'cross-border raid', 'cross-border attack', 'trench warfare',
      'urban combat', 'close-quarters combat', 'sniper fire', 'car bomb',
      'suicide bombing', 'ied blast', 'frontline engagement', 'territorial breakthrough',
      'air defense interception', 'kamikaze drone', 'loitering munition',
      'ballistic missile launch', 'cruise missile attack', 'naval bombardment',
      'anti-tank guided missile', 'atgm strike', 'manpads launch', 'hostage rescue raid',
      'partisan sabotage', 'guerrilla ambush', 'special forces operation',
      'military casualties', 'soldiers killed', 'troops fallen', 'civilians killed',
      'killed in action', 'fatalities reported', 'mass casualty incident',
      'ammunition depot detonation', 'airbase hit', 'command post destroyed',
    ],
    keywords: [
      'airstrike', 'airstrikes', 'artillery', 'bombardment', 'shelling', 'clashes',
      'missile', 'missiles', 'rocket', 'rockets', 'drone', 'drones', 'mortar',
      'howitzer', 'assault', 'offensive', 'ambush', 'raid', 'firefight', 'gunfire',
      'sniper', 'fatalities', 'casualties', 'killed', 'dead', 'kia', 'bombing',
      'bombed', 'blast', 'explosion', 'detonation', 'warfare', 'combat', 'frontline',
      'trenches', 'insurgency', 'militants', 'insurgents', 'massacre', 'salvo',
      'interception', 'shrapnel', 'combatants', 'guerilla', 'sabotage', 'encirclement',
      'siege', 'breach', 'skirmish', 'skirmishes', 'strikes', 'struck',
    ],
    subTypeRules: [
      { subType: 'Air/Drone Strike', triggers: ['airstrike', 'air strike', 'drone strike', 'drone attack', 'kamikaze drone', 'loitering munition'] },
      { subType: 'Missile/Artillery Bombardment', triggers: ['missile', 'rocket', 'artillery', 'shelling', 'mortar', 'howitzer', 'bombardment', 'salvo'] },
      { subType: 'Armed Clashes & Battles', triggers: ['clash', 'battle', 'assault', 'offensive', 'firefight', 'ambush', 'gunfire', 'skirmish', 'combat'] },
      { subType: 'Explosion / Remote Violence', triggers: ['blast', 'car bomb', 'suicide bombing', 'ied', 'explosion', 'detonation'] },
      { subType: 'Violence Against Civilians', triggers: ['civilian', 'massacre', 'hostage', 'atrocity'] },
    ],
  },

  'Defense & Strategy': {
    name: 'Defense & Strategy',
    phrases: [
      'defense ministry', 'ministry of defense', 'department of defense',
      'pentagon official', 'nato summit', 'nato alliance', 'north atlantic council',
      'royal navy', 'bundeswehr command', 'armed forces command', 'military readiness',
      'defense procurement', 'military aid package', 'arms shipment', 'weapons delivery',
      'air defense battery', 'patriot missile system', 'hypersonic missile test',
      'carrier strike group', 'naval flotilla', 'submarine patrol', 'joint military exercises',
      'war games', 'strategic deterrence', 'nuclear triad', 'space command',
      'cyber command', 'cisa alert', 'cyber defense advisory', 'critical infrastructure protection',
      'defense budget bill', 'military modernization', 'conscription bill',
      'troop deployment', 'forward operating base', 'airspace sovereignty',
      'maritime surveillance', 'over-the-horizon radar', 'satellite reconnaissance',
      'defense treaty', 'interoperability drills', 'arms export approval',
      'defense industrial base', 'ammunition production line',
    ],
    keywords: [
      'pentagon', 'nato', 'readiness', 'procurement', 'modernization', 'patriot',
      'hypersonic', 'submarine', 'carrier', 'flotilla', 'exercises', 'deterrence',
      'triad', 'reconnaissance', 'sovereignty', 'interoperability', 'ammunition',
      'deployment', 'deploys', 'stationed', 'garrison', 'radar', 'surveillance',
      'airspace', 'cyberdefense', 'cybersecurity', 'cisa', 'defense', 'military',
      'navy', 'naval', 'airforce', 'army', 'warship', 'destroyer', 'frigate',
      'corvette', 'arsenal', 'drills', 'maneuvers', 'conscription',
    ],
    subTypeRules: [
      { subType: 'Air & Missile Defense', triggers: ['air defense', 'patriot', 'radar', 'interceptor', 'hypersonic', 'over-the-horizon'] },
      { subType: 'Naval & Maritime Readiness', triggers: ['navy', 'naval', 'carrier', 'submarine', 'flotilla', 'warship', 'destroyer', 'frigate', 'corvette'] },
      { subType: 'Strategic Procurement & Modernization', triggers: ['procurement', 'modernization', 'budget', 'aid package', 'arsenal', 'shipment', 'production'] },
      { subType: 'Cyber & Electronic Defense', triggers: ['cyber', 'cisa', 'critical infrastructure', 'electronic warfare', 'surveillance', 'satellite'] },
      { subType: 'Allied Drills & Force Posture', triggers: ['nato', 'drills', 'maneuvers', 'exercise', 'deployment', 'readiness', 'posture'] },
    ],
  },

  'Geopolitics & Policy': {
    name: 'Geopolitics & Policy',
    phrases: [
      'diplomatic summit', 'bilateral talks', 'peace negotiations', 'truce talks',
      'ceasefire negotiations', 'un security council', 'united nations assembly',
      'presidential election', 'parliamentary election', 'national assembly vote',
      'prime minister address', 'head of state', 'foreign ministry statement',
      'state department briefing', 'ambassador summoned', 'diplomatic envoy',
      'peace treaty', 'normalization agreement', 'diplomatic standoff',
      'presidential decree', 'constitutional reform', 'veto override',
      'referendum vote', 'official state visit', 'bilateral communique',
      'high-level delegation', 'sovereignty claim', 'territorial dispute',
      'foreign policy directive', 'cabinet reshuffle', 'coalition government',
      'human rights council', 'treaty ratification', 'embassy reopening',
    ],
    keywords: [
      'geopolitics', 'diplomacy', 'diplomatic', 'ambassador', 'envoy', 'summit',
      'treaty', 'accord', 'bilateral', 'multilateral', 'parliament', 'parliamentary',
      'congress', 'senate', 'legislation', 'legislators', 'election', 'elections',
      'electoral', 'presidential', 'referendum', 'constitution', 'constitutional',
      'decree', 'sovereignty', 'territorial', 'foreign-policy', 'communique',
      'delegation', 'coalition', 'cabinet', 'negotiations', 'mediator', 'mediation',
      'accord', 'envoys', 'embassy', 'consulate', 'resolution',
    ],
    subTypeRules: [
      { subType: 'Diplomatic Summits & Bilateral Accords', triggers: ['summit', 'bilateral', 'treaty', 'accord', 'communique', 'delegation', 'normalization'] },
      { subType: 'Government, Parliament & Elections', triggers: ['election', 'parliament', 'congress', 'senate', 'cabinet', 'coalition', 'decree', 'vote'] },
      { subType: 'Peace Negotiations & Truce Dialogues', triggers: ['peace talks', 'truce', 'ceasefire negotiations', 'mediation', 'mediator'] },
      { subType: 'International Multilateral Assemblies', triggers: ['un security council', 'united nations', 'human rights', 'resolution', 'ambassador'] },
    ],
  },

  'Economy & Global': {
    name: 'Economy & Global',
    phrases: [
      'economic sanctions', 'asset freeze', 'central bank policy', 'swift payment ban',
      'import tariff', 'import tariffs', 'trade tariff', 'trade tariffs', 'customs duty', 'trade embargo',
      'export controls', 'semiconductor restrictions', 'technology export ban',
      'bilateral trade agreement', 'free trade pact', 'free trade agreement', 'mercosur agreement',
      'wto dispute', 'strategic petroleum reserve', 'crude oil exports',
      'lng tanker shipments', 'gas pipeline transit', 'opec production quota',
      'energy security protocol', 'grain export corridor', 'food security pact',
      'inflation rate surge', 'currency devaluation', 'foreign exchange reserves',
      'imf financial bailout', 'world bank loan package', 'critical minerals supply',
      'critical minerals', 'critical mineral', 'rare earth mining', 'rare earths',
      'lithium supply corridor', 'supply chain disruption', 'supply chains', 'supply chain',
      'maritime freight rates', 'trade transit corridor', 'sovereign debt restructuring',
      'trade war', 'trade dispute', 'reciprocal tariffs', 'electric vehicles',
      'interest rates', 'interest rate cut', 'interest rate hike', 'foreign direct investment',
    ],
    keywords: [
      'tariffs', 'tariff', 'sanctions', 'sanction', 'embargo', 'customs', 'mercosur',
      'petroleum', 'crude', 'oil', 'lng', 'pipeline', 'opec', 'energy', 'grain',
      'inflation', 'currency', 'reserves', 'bailout', 'imf', 'minerals', 'mineral',
      'lithium', 'commodities', 'commodity', 'supply-chain', 'freight', 'debt',
      'economy', 'economic', 'economics', 'trade', 'exports', 'export', 'imports',
      'import', 'commerce', 'monetary', 'financial', 'finance', 'markets', 'market',
      'treasury', 'yields', 'stocks', 'subsidies', 'subsidy', 'investments', 'investment',
      'central-bank', 'fed', 'wto', 'deficit', 'surplus', 'gdp',
    ],
    subTypeRules: [
      { subType: 'Sanctions & Export Controls', triggers: ['sanctions', 'embargo', 'asset freeze', 'export controls', 'restrictions'] },
      { subType: 'Trade Treaties & Tariffs', triggers: ['tariff', 'tariffs', 'trade agreement', 'customs', 'mercosur', 'free trade', 'trade war'] },
      { subType: 'Energy & Strategic Resources', triggers: ['crude', 'oil', 'petroleum', 'lng', 'pipeline', 'opec', 'energy security', 'minerals', 'mineral', 'lithium'] },
      { subType: 'Macroeconomic & Financial Stability', triggers: ['inflation', 'currency', 'reserves', 'bailout', 'debt', 'monetary', 'imf', 'gdp', 'central bank'] },
      { subType: 'Supply Chains & Maritime Transit', triggers: ['supply chain', 'grain corridor', 'freight', 'shipping rates', 'trade corridor', 'transit'] },
    ],
  },

  'News/General': {
    name: 'News/General',
    phrases: [],
    keywords: [],
    subTypeRules: [
      { subType: 'General Wire Dispatch', triggers: [] },
    ],
  },
};

export interface ClassificationResult {
  category: IntelCategory;
  subEventType: string;
  isConflict: boolean;
  confidence: number;
  matchedWordsCount: number;
  matchedTerms: string[];
  probabilities: Record<IntelCategory, number>;
}

/**
 * Probabilistic Multi-Word Category Classifier.
 *
 * Rules:
 * 1. Matches text against multi-word phrases and single domain keywords.
 * 2. Strict Multi-Word Rule: A SINGLE isolated keyword match is NOT sufficient to classify
 *    an article into that category (prevents spurious false positives).
 *    Requires >= 2 distinct matching terms, OR an unambiguous heavy multi-word compound phrase.
 * 3. Calculates normalized probability across all 4 categories and picks the maximum.
 * 4. Fallback to 'News/General' if below confidence threshold.
 * 5. Sets isConflict = true if and only if 'Warfare & Combat' wins.
 */
export function classifyEvent(title: string, description?: string): ClassificationResult {
  const fullText = `${title || ''} ${description || ''}`.toLowerCase();
  // Normalize punctuation for token matching
  const cleanText = fullText.replace(/[^\w\s-]/g, ' ');

  const activeCategories: IntelCategory[] = [
    'Warfare & Combat',
    'Defense & Strategy',
    'Geopolitics & Policy',
    'Economy & Global',
  ];

  const scores: Record<IntelCategory, number> = {
    'Warfare & Combat': 0,
    'Defense & Strategy': 0,
    'Geopolitics & Policy': 0,
    'Economy & Global': 0,
    'News/General': 0,
  };

  const matchedTermsMap: Record<IntelCategory, string[]> = {
    'Warfare & Combat': [],
    'Defense & Strategy': [],
    'Geopolitics & Policy': [],
    'Economy & Global': [],
    'News/General': [],
  };

  const hasHeavyPhraseMap: Record<IntelCategory, boolean> = {
    'Warfare & Combat': false,
    'Defense & Strategy': false,
    'Geopolitics & Policy': false,
    'Economy & Global': false,
    'News/General': false,
  };

  for (const cat of activeCategories) {
    const def = CATEGORY_DEFINITIONS[cat];
    const seenMatches = new Set<string>();

    // 1. Check multi-word compound phrases (high weight: 2.5 each)
    for (const phrase of def.phrases) {
      if (cleanText.includes(phrase)) {
        seenMatches.add(phrase);
        scores[cat] += 2.5;
        hasHeavyPhraseMap[cat] = true;
      }
    }

    // 2. Check single domain keywords with word boundaries (standard weight: 1.0 each)
    for (const kw of def.keywords) {
      // Avoid re-counting a keyword if it's already part of a matched phrase
      const inPhrase = Array.from(seenMatches).some((p) => p.includes(kw));
      if (!inPhrase) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(cleanText)) {
          seenMatches.add(kw);
          scores[cat] += 1.0;
        }
      }
    }

    matchedTermsMap[cat] = Array.from(seenMatches);

    // Multi-Word Rule Enforcement:
    // If only 1 term matched and it was NOT an unambiguous heavy compound phrase,
    // penalize this score heavily so a random stray word doesn't classify the article.
    if (seenMatches.size < 2 && !hasHeavyPhraseMap[cat]) {
      scores[cat] = scores[cat] * 0.15; // 85% penalty for single uncorroborated word
    }
  }

  // Calculate sum of scores for probability normalization
  const totalScore = activeCategories.reduce((acc, cat) => acc + scores[cat], 0);

  const probabilities: Record<IntelCategory, number> = {
    'Warfare & Combat': 0,
    'Defense & Strategy': 0,
    'Geopolitics & Policy': 0,
    'Economy & Global': 0,
    'News/General': 0,
  };

  if (totalScore > 0) {
    for (const cat of activeCategories) {
      probabilities[cat] = parseFloat((scores[cat] / totalScore).toFixed(3));
    }
  }

  // Determine top category
  let topCategory: IntelCategory = 'News/General';
  let maxScore = 0;

  for (const cat of activeCategories) {
    // Requires total weighted score >= 1.8 and at least 2 distinct words (or 1 heavy phrase)
    const matches = matchedTermsMap[cat];
    const isQualifying = matches.length >= 2 || hasHeavyPhraseMap[cat];

    if (isQualifying && scores[cat] > maxScore) {
      maxScore = scores[cat];
      topCategory = cat;
    }
  }

  // If no category qualifies or maxScore is too weak, fallback to News/General
  if (maxScore < 1.8) {
    topCategory = 'News/General';
    probabilities['News/General'] = 1.0;
  }

  // Determine subEventType within winning category
  let subEventType = 'News report';
  if (topCategory !== 'News/General') {
    const def = CATEGORY_DEFINITIONS[topCategory];
    let matchedSub = false;

    for (const rule of def.subTypeRules) {
      for (const trigger of rule.triggers) {
        if (cleanText.includes(trigger)) {
          subEventType = rule.subType;
          matchedSub = true;
          break;
        }
      }
      if (matchedSub) break;
    }

    if (!matchedSub) {
      subEventType = def.subTypeRules[0]?.subType || 'General dispatch';
    }
  }

  // Kinetic conflict flag: only true for Warfare & Combat
  const isConflict = topCategory === 'Warfare & Combat';

  const confidence = totalScore > 0 && topCategory !== 'News/General'
    ? probabilities[topCategory]
    : 0;

  return {
    category: topCategory,
    subEventType,
    isConflict,
    confidence,
    matchedWordsCount: matchedTermsMap[topCategory].length,
    matchedTerms: matchedTermsMap[topCategory],
    probabilities,
  };
}
