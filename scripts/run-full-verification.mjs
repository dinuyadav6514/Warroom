/**
 * COMPREHENSIVE WARROOM INTELLIGENCE & INFRASTRUCTURE TEST SUITE
 * 
 * Verifies:
 * 1. All 8 Inbuilt AI & Intelligence Engines
 * 2. News Ingestion, Classification, & Deduplication Pipelines
 * 3. Frontend & Map Rendering Optimizations (Memoization, Pixel Ratio Cap, CSS Hardware Acceleration)
 * 4. TypeScript Type Safety & API Route Integrity
 */

import fs from 'fs';
import path from 'path';

// Import in-built AI engines
import { resolveAiEventLocation, GLOBAL_COUNTRY_CENTROIDS } from '../lib/intelligence/geo-locator.ts';
import { cleanHtmlAndMarkup, summarizeEventWithInbuiltAi, generateInbuiltAiSitrep, extractCleanHeadline } from '../lib/intelligence/event-summarizer.ts';
import { runSensorFusion, getSensorFusionSummary } from '../lib/intelligence/sensor-fusion.ts';
import { parseIntelCommand, isIntelCommand } from '../lib/intelligence/command-parser.ts';
import { computeEscalationForecast, runGlobalEscalationForecast } from '../lib/intelligence/escalation-forecaster.ts';
import { runSpatialClustering } from '../lib/intelligence/spatial-clustering.ts';
import { runNetworkCentrality } from '../lib/intelligence/network-centrality.ts';
import { deduplicateEvents } from '../lib/data/deduplication.ts';
import { classifyEvent } from '../lib/classification/event-classifier.ts';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, name, details = '') {
  if (condition) {
    results.passed++;
    results.tests.push({ status: 'PASS', name, details });
    console.log(`  [PASS] ${name}${details ? ` -> ${details}` : ''}`);
  } else {
    results.failed++;
    results.tests.push({ status: 'FAIL', name, details });
    console.error(`  [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('      WARROOM COMPREHENSIVE INTELLIGENCE & SYSTEM TEST AUDIT    ');
  console.log('================================================================\n');

  // ==========================================================================
  // SECTION 1: INBUILT AI MODELS & ENGINES VERIFICATION
  // ==========================================================================
  console.log('--- SECTION 1: INBUILT AI MODELS & ENGINES ---');

  // 1.1 Geo-Locator Engine
  console.log('\n[Engine 1] Geo-Locator Engine (geo-locator.ts):');
  const locSomalia = resolveAiEventLocation('Heavy fighting erupted near Kismayo port as forces clashed', 'Somalia');
  assert(locSomalia.matchedEntity.includes('Kismayo'), 'Somalia: Matched Kismayo correctly', `Lat: ${locSomalia.latitude}, Lng: ${locSomalia.longitude}`);
  assert(locSomalia.confidenceScore >= 0.90 && locSomalia.confidenceScore <= 0.97, 'Somalia: Dynamic confidence between 90% and 97% (no static 98%)', `Label: ${locSomalia.accuracyLabel}`);
  assert(locSomalia.latitude < 0 && locSomalia.latitude > -1.0, 'Somalia: Coordinate precision inside Kismayo sector', `Lat: ${locSomalia.latitude}`);

  const locUkraine = resolveAiEventLocation('Russian forces launched offensive maneuvers outside Pokrovsk', 'Ukraine');
  assert(locUkraine.matchedEntity.includes('Pokrovsk'), 'Ukraine: Matched Pokrovsk frontline sector', `Lat: ${locUkraine.latitude}, Lng: ${locUkraine.longitude}`);
  assert(locUkraine.confidenceScore >= 0.93 && locUkraine.confidenceScore <= 0.97, 'Ukraine: Tactical city confidence between 93% and 97% (not locked to 98%)', `Label: ${locUkraine.accuracyLabel}`);

  const locMideast = resolveAiEventLocation('Drone intercepted in the Bab el-Mandeb strait', 'Yemen');
  assert(locMideast.matchedEntity.includes('Bab el-Mandeb') && locMideast.entityType === 'CHOKEPOINT_STRAIT', 'Middle East: Chokepoint Bab el-Mandeb identified', `Entity: ${locMideast.matchedEntity}`);

  const locSudan = resolveAiEventLocation('Artillery fire reported across El Fasher, North Darfur', 'Sudan');
  assert(locSudan.matchedEntity.includes('Fashir'), 'Sudan: Matched El Fasher tactical hub', `Lat: ${locSudan.latitude}, Lng: ${locSudan.longitude}`);

  const locUnknown = resolveAiEventLocation('Unspecified skirmish in an unknown remote area', 'Unknown');
  assert(locUnknown.confidenceScore <= 0.75, 'Fallback: Dynamic lower confidence for unknown entity (never static 98%)', `Confidence: ${(locUnknown.confidenceScore * 100).toFixed(0)}%`);

  // 1.2 Event Summarizer Engine
  console.log('\n[Engine 2] Inbuilt AI Event Summarizer (event-summarizer.ts):');
  const dirtyHtml = `
    <![CDATA[<ol><li><a href="https://news.google.com/rss/articles/CBMi..." target="_blank">Air defense systems engaged multiple aerial targets</a></li></ol><font color="#6f6f6f">Reuters&nbsp;&amp;&nbsp;AP</font>]]>
  `;
  const cleanedText = cleanHtmlAndMarkup(dirtyHtml);
  assert(!cleanedText.includes('<') && !cleanedText.includes('>'), 'HTML & CDATA Stripping: 0 HTML/XML tags remaining', cleanedText);
  assert(!cleanedText.includes('http') && !cleanedText.includes('&amp;'), 'URL & Entity Decoding: 0 URLs and clean entity decoding', cleanedText);

  const mockCombatEvent = {
    id: 'test-ev-1',
    eventType: 'Shelling/Artillery/Missile attack',
    subEventType: 'Air strike',
    location: 'Pokrovsk Frontline',
    country: 'Ukraine',
    latitude: 48.282,
    longitude: 37.182,
    eventDate: '2026-10-18',
    fatalities: 4,
    notes: 'Heavy tactical missile strike struck an ammunition depot and logistics transit hub.',
    actor1: 'Armed Forces of the Russian Federation',
    actor2: 'Armed Forces of Ukraine',
    severity: 'CRITICAL',
    isConflict: true
  };

  const sitrep = summarizeEventWithInbuiltAi(mockCombatEvent);
  const wordCount = sitrep.fullStructuredText.split(/\s+/).filter(Boolean).length;
  assert(wordCount >= 150, `150+ Words Inbuilt AI SITREP Guarantee: Produced ${wordCount} words (Requirement: >= 150 words)`, `Word Count: ${wordCount}`);
  assert(!sitrep.fullStructuredText.includes('<') && !sitrep.fullStructuredText.includes('>'), 'Inbuilt AI SITREP: 0 HTML tags in full structured text output');
  assert(sitrep.situationBrief.length > 50, 'Inbuilt AI SITREP: Detailed Situation Brief synthesized');
  assert(sitrep.impactAssessment.length > 50, 'Inbuilt AI SITREP: Tactical Impact Assessment synthesized');

  // 1.3 Sensor Fusion Engine
  console.log('\n[Engine 3] Sensor Fusion & Cross-Correlation Engine (sensor-fusion.ts):');
  const mockFirmsHotspots = [
    {
      id: 'firms-1',
      latitude: 48.29,
      longitude: 37.19,
      brightness: 340.5,
      scan: 1.0,
      track: 1.0,
      acqDate: '2026-10-18',
      acqTime: '0330',
      satellite: 'VIIRS-NOAA20',
      confidence: 'nominal',
      version: '2.0',
      brightT31: 295.2,
      frp: 28.5,
      daynight: 'N'
    }
  ];

  const mockSorties = [
    {
      id: 'adsb-1',
      callsign: 'VIPER11',
      icao24: 'A1B2C3',
      latitude: 48.35,
      longitude: 37.25,
      altitudeBaro: 25000,
      groundSpeed: 450,
      track: 180,
      category: 'FIGHTER_STRIKE',
      country: 'Ukraine',
      seenSeconds: 120,
      isMilitary: true
    }
  ];

  const fusedIncidents = runSensorFusion([mockCombatEvent], mockFirmsHotspots, mockSorties);
  assert(fusedIncidents.length === 1, 'Sensor Fusion: Successfully correlated combat incident');
  const incident = fusedIncidents[0];
  assert(incident.firmsCount === 1, 'Sensor Fusion: NASA FIRMS thermal hotspot correlated within 25km', `Matched Hotspot ID: ${incident.corroboratingFirmsIds[0]}`);
  assert(incident.aviationCount === 1, 'Sensor Fusion: Military combat sortie correlated within 150km', `Callsign: ${incident.activeSorties[0]}`);
  assert(incident.confidenceScore > 0.60, 'Sensor Fusion: Dynamic confidence elevated above base score (No static 40%)', `Calculated Confidence: ${(incident.confidenceScore * 100).toFixed(0)}%`);
  assert(incident.confidenceLabel.includes('%') && !incident.confidenceLabel.includes('UNVERIFIED 40%'), 'Sensor Fusion: Dynamic label generated', incident.confidenceLabel);

  const fusionSummary = getSensorFusionSummary(fusedIncidents);
  assert(fusionSummary.totalVerified === 1 && fusionSummary.corroborationRate === 1.0, 'Sensor Fusion Summary: Correctly aggregated statistics');

  // 1.4 Command Intent Engine
  console.log('\n[Engine 4] High-Speed Command Parser (command-parser.ts):');
  const cmdStart = performance.now();
  const testCommands = [
    { cmd: 'hotspots near pokrovsk', expected: 'HOT_SPOTS' },
    { cmd: 'predict 48h escalation', expected: 'FORECAST' },
    { cmd: 'chokepoints', expected: 'CHOKEPOINTS' },
    { cmd: 'sorties near ukraine', expected: 'SORTIES_NEAR' },
    { cmd: 'threat score somalia', expected: 'THREAT_INDEX' },
    { cmd: 'frontline cluster', expected: 'CLUSTER_MAP' },
    { cmd: 'cascade spillover', expected: 'CASCADE_RISK' },
    { cmd: 'sensors verification', expected: 'SENSOR_STATUS' },
    { cmd: 'top flashpoints', expected: 'FLASHPOINTS' }
  ];

  let allParsed = true;
  for (const tc of testCommands) {
    const res = parseIntelCommand(tc.cmd, ['Ukraine', 'Somalia']);
    if (res.intent !== tc.expected) {
      allParsed = false;
      console.error(`Mismatch for '${tc.cmd}': expected ${tc.expected}, got ${res.intent}`);
    }
  }
  const cmdDuration = (performance.now() - cmdStart) / testCommands.length;
  assert(allParsed, 'Command Parser: All 9 command intent clusters correctly identified');
  assert(cmdDuration < 2.0, `Sub-2ms Execution Target: Average latency per command ${cmdDuration.toFixed(3)}ms (Target: < 2.0ms)`);

  const fuzzyRes = parseIntelCommand('forcast 48hr ukr');
  assert(fuzzyRes.intent === 'FORECAST' && fuzzyRes.country === 'Ukraine', 'Fuzzy Matcher: Handled typos ("forcast" -> FORECAST, "ukr" -> Ukraine)');

  // 1.5 Escalation Forecaster Engine
  console.log('\n[Engine 5] Time-Series Escalation Forecaster (escalation-forecaster.ts):');
  const historicalEvents = [
    { ...mockCombatEvent, eventDate: '2026-10-10', timestamp: new Date(Date.now() - 8 * 86400000).toISOString() },
    { ...mockCombatEvent, eventDate: '2026-10-12', timestamp: new Date(Date.now() - 6 * 86400000).toISOString() },
    { ...mockCombatEvent, eventDate: '2026-10-15', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
    { ...mockCombatEvent, eventDate: '2026-10-17', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
    { ...mockCombatEvent, eventDate: '2026-10-18', timestamp: new Date().toISOString(), fatalities: 12, severity: 'CRITICAL' },
    { ...mockCombatEvent, eventDate: '2026-10-18', timestamp: new Date().toISOString(), fatalities: 8, severity: 'CRITICAL' }
  ];

  const forecast = computeEscalationForecast('Ukraine', 'Eastern Front', historicalEvents);
  assert(typeof forecast.threatIndex === 'number' && forecast.threatIndex >= 0 && forecast.threatIndex <= 100, 'Escalation Forecaster: Threat index generated in [0, 100]', `Threat Index: ${forecast.threatIndex}`);
  assert(typeof forecast.forecast48hProbability === 'number' && forecast.forecast48hProbability >= 0 && forecast.forecast48hProbability <= 1, 'Escalation Forecaster: 48h Probability computed', `P(48h): ${forecast.forecast48hProbability}`);
  assert(forecast.trend === 'ESCALATING' || forecast.trend === 'STABLE', 'Escalation Forecaster: Trend correctly categorized', `Trend: ${forecast.trend}`);

  // 1.6 Spatial DBSCAN Clustering Engine
  console.log('\n[Engine 6] Spatial Clustering & Battlefront Corridors (spatial-clustering.ts):');
  const clusterPoints = [
    { ...mockCombatEvent, id: 'pt-1', latitude: 48.0, longitude: 37.0 },
    { ...mockCombatEvent, id: 'pt-2', latitude: 48.05, longitude: 37.08 },
    { ...mockCombatEvent, id: 'pt-3', latitude: 48.1, longitude: 37.15 },
    { ...mockCombatEvent, id: 'pt-4', latitude: 48.15, longitude: 37.2 }
  ];
  const clusters = runSpatialClustering(clusterPoints, mockFirmsHotspots, 35, 2);
  assert(clusters.length >= 1, 'Spatial DBSCAN: Formed battlefront clusters from proximate points', `Total Clusters: ${clusters.length}`);
  if (clusters.length > 0) {
    assert(clusters[0].convexHull.length >= 3, 'Spatial Clustering: Convex hull generated via Graham Scan', `Vertices: ${clusters[0].convexHull.length}`);
    assert(typeof clusters[0].headingDeg === 'number', 'Spatial Clustering: Frontline drift vector bearing computed', `Heading: ${clusters[0].headingDeg}°`);
  }

  // 1.7 Bilateral Vector Network Centrality Engine
  console.log('\n[Engine 7] Bilateral Network Centrality Engine (network-centrality.ts):');
  const mockRelations = [
    { id: 'rel-1', fromCountry: 'Russia', toCountry: 'Ukraine', direction: 'OUTGOING', eventCount: 25, fatalities: 50, sampleHeadlines: [], relatedEvents: [] },
    { id: 'rel-2', fromCountry: 'Iran', toCountry: 'Israel', direction: 'OUTGOING', eventCount: 15, fatalities: 10, sampleHeadlines: [], relatedEvents: [] },
    { id: 'rel-3', fromCountry: 'Yemen', toCountry: 'Israel', direction: 'OUTGOING', eventCount: 10, fatalities: 2, sampleHeadlines: [], relatedEvents: [] },
    { id: 'rel-4', fromCountry: 'United States', toCountry: 'Yemen', direction: 'OUTGOING', eventCount: 8, fatalities: 5, sampleHeadlines: [], relatedEvents: [] }
  ];
  const netAnalysis = runNetworkCentrality(mockRelations);
  assert(netAnalysis.nodes.length >= 4, 'Network Centrality: Graph constructed with nodes', `Node Count: ${netAnalysis.nodes.length}`);
  assert(netAnalysis.highestCascadeRisk.length > 0, 'Network Centrality: Identified highest cascade risk entities', `Top Risk: ${netAnalysis.highestCascadeRisk[0].country}`);

  // ==========================================================================
  // SECTION 2: NEWS INGESTION, CLASSIFICATION & DEDUPLICATION PIPELINE
  // ==========================================================================
  console.log('\n--- SECTION 2: NEWS INGESTION & PIPELINE INTEGRITY ---');

  // 2.1 Deduplication & Deterministic ID Validation
  console.log('\n[Pipeline 1] Deterministic Deduplication (deduplication.ts):');
  const duplicateBatch = [
    {
      id: 'SCRAPER_UKR_POKROVSK_A',
      location: 'Pokrovsk',
      country: 'Ukraine',
      eventDate: '2026-10-18',
      eventType: 'Air strike',
      notes: 'Heavy artillery strikes reported on defensive positions near Pokrovsk suburb',
      source: 'Google News Multi-Theater Scraper'
    },
    {
      id: 'SCRAPER_UKR_POKROVSK_B',
      location: 'Pokrovsk',
      country: 'Ukraine',
      eventDate: '2026-10-18',
      eventType: 'Air strike',
      notes: 'Heavy artillery strikes reported on defensive positions near Pokrovsk suburb',
      source: 'FreeNewsApi'
    },
    {
      id: 'SCRAPER_UKR_POKROVSK_C',
      location: 'Pokrovsk',
      country: 'Ukraine',
      eventDate: '2026-10-18',
      eventType: 'Air strike',
      notes: 'Heavy artillery strikes reported on defensive positions near Pokrovsk suburb',
      source: 'GDELT'
    }
  ];

  const deduped = deduplicateEvents(duplicateBatch);
  assert(deduped.length === 1, `Deterministic Deduplication: Collapsed 3 duplicate scraper reports into 1 canonical incident`, `Result count: ${deduped.length}`);
  assert(deduped[0].source.includes('Google News') && deduped[0].source.includes('FreeNewsApi') && deduped[0].source.includes('GDELT'), 'Deterministic Deduplication: Successfully merged multi-source citations', `Merged Sources: ${deduped[0].source}`);

  // 2.2 Domain Taxonomy Classification
  console.log('\n[Pipeline 2] Tactical Classification (event-classifier.ts):');
  const c1 = classifyEvent('Heavy drone strikes and hypersonic missile attacks hit military barracks');
  assert(c1.category === 'Warfare & Combat' && c1.confidence >= 0.60, 'Classifier: Warfare & Combat identified', `Category: ${c1.category}, Conf: ${c1.confidence.toFixed(2)}`);

  const c2 = classifyEvent('Department of Defense signs $1.8B contract for naval interceptors and radar systems');
  assert(c2.category === 'Defense & Strategy', 'Classifier: Defense & Strategy identified', `Category: ${c2.category}`);

  const c3 = classifyEvent('UN Security Council holds emergency bilateral diplomatic summit to draft ceasefire resolution');
  assert(c3.category === 'Geopolitics & Policy', 'Classifier: Geopolitics & Policy identified', `Category: ${c3.category}`);

  // 2.3 Provider Timestamp & ID Determinism Check across Codebase
  console.log('\n[Pipeline 3] Source Provider Determinism Audit:');
  const providerDir = path.resolve('lib/providers');
  const providerFiles = fs.readdirSync(providerDir).filter(f => f.endsWith('.ts'));
  
  let foundTimestampIdBug = false;
  for (const pf of providerFiles) {
    const content = fs.readFileSync(path.join(providerDir, pf), 'utf-8');
    // Check if provider constructs IDs using Date.now()
    if (/id:\s*`[^`]*\$\{Date\.now\(\)\}/i.test(content) || /id:\s*['"][^'"]*\+Date\.now\(\)/i.test(content)) {
      foundTimestampIdBug = true;
      console.error(`Detected non-deterministic Date.now() ID generator in: ${pf}`);
    }
  }
  assert(!foundTimestampIdBug, `All 12+ News Ingestion Providers are Deterministic (0 instances of Date.now() in IDs)`);

  // ==========================================================================
  // SECTION 3: FRONTEND, 3D GLOBE & UI OPTIMIZATION AUDIT
  // ==========================================================================
  console.log('\n--- SECTION 3: FRONTEND, 3D GLOBE & UI OPTIMIZATIONS ---');

  const globePath = path.resolve('components/map/GlobeConflictMap.tsx');
  const globeContent = fs.readFileSync(globePath, 'utf-8');

  // 3.1 Memoization Verification
  assert(globeContent.includes('const polygonCapColorFn = useCallback('), '3D Globe: polygonCapColor memoized with useCallback');
  assert(globeContent.includes('const polygonSideColorFn = useCallback('), '3D Globe: polygonSideColor memoized with useCallback');
  assert(globeContent.includes('const polygonStrokeColorFn = useCallback('), '3D Globe: polygonStrokeColor memoized with useCallback');
  assert(globeContent.includes('const polygonLabelFn = useCallback('), '3D Globe: polygonLabel memoized with useCallback');
  assert(globeContent.includes('const customLayerLabelFn = useCallback('), '3D Globe: customLayerLabel memoized with useCallback');
  assert(globeContent.includes('const arcLabelFn = useCallback('), '3D Globe: arcLabel memoized with useCallback');

  // 3.2 Pixel Ratio Cap (Eliminating 4K/Retina GPU Overdraw)
  assert(globeContent.includes('Math.min(window.devicePixelRatio || 1, 2)'), '3D Globe: devicePixelRatio capped at 2.0 max to prevent high-DPI frame drops');

  // 3.3 Debounced ResizeObserver
  assert(globeContent.includes('Math.abs(prev.width - w) < 3'), '3D Globe: ResizeObserver debounced with 3px threshold against subpixel oscillation');

  // 3.4 Hardware Accelerated CSS
  const cssPath = path.resolve('app/globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  assert(cssContent.includes('.glass-panel') && cssContent.includes('transform: translateZ(0)'), 'CSS Optimization: transform: translateZ(0) hardware acceleration active on .glass-panel');
  assert(cssContent.includes('.glass-panel-subtle') && cssContent.includes('transform: translateZ(0)'), 'CSS Optimization: transform: translateZ(0) hardware acceleration active on .glass-panel-subtle');

  // ==========================================================================
  // FINAL SCORECARD
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`                     AUDIT REPORT SUMMARY                      `);
  console.log('================================================================');
  console.log(`Total Checks Executed : ${results.passed + results.failed}`);
  console.log(`Passed Checks         : ${results.passed}`);
  console.log(`Failed Checks         : ${results.failed}`);
  console.log(`Pass Rate             : ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test Suite encountered unhandled fatal exception:', err);
  process.exit(1);
});
