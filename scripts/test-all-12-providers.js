const http = require('http');

// Start a local server test or run via ts-node / Next test
async function runDirectTest() {
  console.log('Testing all 12 pipelines via next build API test or live execution...\n');
  
  // We can test via Next dev server
  const url = 'http://localhost:3001/api/test-provider?provider=all';
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log('=== TEST RESULTS: ALL 12 PIPELINES ===\n');
    console.log(`Total Providers Tested: ${data.totalProviders}`);
    console.log(`Timestamp: ${data.timestamp}\n`);
    
    let allWorking = true;
    for (const [key, result] of Object.entries(data.results)) {
      const statusIcon = result.success && result.count > 0 ? '✓ LIVE & WORKING' : '✗ FAILED';
      if (!result.success || result.count === 0) allWorking = false;
      console.log(`[${result.name}]`);
      console.log(`  Status: ${statusIcon}`);
      console.log(`  Events Ingested: ${result.count}`);
      console.log(`  Latency: ${result.timeMs}ms`);
      console.log(`  All Geocoded with Lat/Lon: ${result.hasCoordinates}`);
      if (result.sampleEvent) {
        const headline = result.sampleEvent.notes ? result.sampleEvent.notes.slice(0, 80) + '...' : result.sampleEvent.eventType;
        console.log(`  Sample Headline: "${headline}"`);
        console.log(`  Location: ${result.sampleEvent.location}, ${result.sampleEvent.country} [${result.sampleEvent.latitude?.toFixed(2)}, ${result.sampleEvent.longitude?.toFixed(2)}]`);
        console.log(`  Category: ${result.sampleEvent.primaryCategory || result.sampleEvent.eventType} | Severity: ${result.sampleEvent.severity}`);
      }
      console.log('----------------------------------------------------');
    }
    
    console.log(`\nOverall Result: ${allWorking ? 'ALL 12 PIPELINES WORKING 100%' : 'SOME PIPELINES HAD ISSUES'}`);
  } catch (err) {
    console.error('Test execution failed:', err.message);
  }
}

runDirectTest();
