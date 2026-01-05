// Phase 3 Acceptance Test - Backend Contract Compliance
const BASE_URL = 'http://localhost:3000/v1';

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, status = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${prefix} [${status}] ${message}`);
}

function addResult(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    log(`${name}: ${details}`, 'PASS');
  } else {
    results.failed++;
    log(`${name}: ${details}`, 'FAIL');
  }
}

async function test(name, callback) {
  try {
    await callback();
  } catch (err) {
    addResult(name, false, err.message);
  }
}

let createdCellIds = [];

// Test 1: GET /health
await test('GET /v1/health', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  const data = await res.json();
  
  if (res.status !== 200) throw new Error(`Status ${res.status}, expected 200`);
  if (!data.status) throw new Error('Missing status field');
  if (typeof data.uptime_ms !== 'number') throw new Error('uptime_ms is not a number');
  if (data.uptime_ms < 0) throw new Error('uptime_ms is negative');
  
  addResult('GET /v1/health', true, JSON.stringify(data));
});

// Test 2: POST /v1/gpp/ingest (3 times)
const ingests = [
  { type: 'ORDER', retention: 'LONG', intent: 'Acceptance Test 1 - ORDER type' },
  { type: 'PIPELINE', retention: 'EPHEMERAL', intent: 'Acceptance Test 2 - PIPELINE type' },
  { type: 'TASK', retention: 'LONG', intent: 'Acceptance Test 3 - TASK type' }
];

for (let i = 0; i < ingests.length; i++) {
  await test(`POST /v1/gpp/ingest #${i + 1}`, async () => {
    const res = await fetch(`${BASE_URL}/gpp/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ingests[i])
    });
    const data = await res.json();
    
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Status ${res.status}, expected 200/201`);
    }
    if (!data.ok) throw new Error('ok field is not true');
    if (!data.cell_ids || !Array.isArray(data.cell_ids)) {
      throw new Error('cell_ids is not an array');
    }
    if (data.cell_ids.length === 0) throw new Error('cell_ids is empty');
    
    const cellId = data.cell_ids[0];
    if (typeof cellId !== 'string' || cellId.length < 10) {
      throw new Error('Invalid cell_id format');
    }
    
    createdCellIds.push(cellId);
    addResult(`POST /v1/gpp/ingest #${i + 1}`, true, 
      `Created cell: ${cellId.slice(0, 8)}... (type: ${ingests[i].type})`);
  });
}

// Test 3: GET /v1/cells
await test('GET /v1/cells', async () => {
  const res = await fetch(`${BASE_URL}/cells`);
  const data = await res.json();
  
  if (res.status !== 200) throw new Error(`Status ${res.status}, expected 200`);
  
  const cells = data.data || data;
  if (!Array.isArray(cells)) throw new Error('Response is not an array');
  
  // Verify all created cells are present
  for (const cellId of createdCellIds) {
    const found = cells.find(c => c.id === cellId);
    if (!found) throw new Error(`Created cell ${cellId} not found in list`);
  }
  
  // Verify required fields
  const firstCell = cells[0];
  const requiredFields = ['id', 'type', 'retention', 'state', 'version', 'friction', 
                          'created_at_ms', 'updated_at_ms'];
  for (const field of requiredFields) {
    if (!(field in firstCell)) throw new Error(`Missing required field: ${field}`);
  }
  
  addResult('GET /v1/cells', true, 
    `Found ${cells.length} cells, all ${createdCellIds.length} created cells present`);
});

// Test 4: GET /v1/cells/{id}
if (createdCellIds.length > 0) {
  await test('GET /v1/cells/{id}', async () => {
    const cellId = createdCellIds[0];
    const res = await fetch(`${BASE_URL}/cells/${cellId}`);
    const data = await res.json();
    
    if (res.status !== 200) throw new Error(`Status ${res.status}, expected 200`);
    
    const cell = data.data || data;
    if (cell.id !== cellId) throw new Error('Returned cell ID does not match');
    
    addResult('GET /v1/cells/{id}', true, `Retrieved cell ${cellId.slice(0, 8)}...`);
  });
}

// Test 5: GET /v1/cells/{id}/history
if (createdCellIds.length > 0) {
  await test('GET /v1/cells/{id}/history', async () => {
    const cellId = createdCellIds[0];
    const res = await fetch(`${BASE_URL}/cells/${cellId}/history`);
    const data = await res.json();
    
    if (res.status !== 200) throw new Error(`Status ${res.status}, expected 200`);
    
    const history = data.data || data;
    if (!Array.isArray(history)) throw new Error('History is not an array');
    if (history.length === 0) throw new Error('History is empty, expected at least 1 transition');
    
    addResult('GET /v1/cells/{id}/history', true, 
      `Found ${history.length} transition(s) for cell ${cellId.slice(0, 8)}...`);
  });
}

// Test 6: GET /v1/log
await test('GET /v1/log', async () => {
  const res = await fetch(`${BASE_URL}/log?per_page=10&page=1`);
  const data = await res.json();
  
  if (res.status !== 200) throw new Error(`Status ${res.status}, expected 200`);
  
  const events = data.data || data;
  if (!Array.isArray(events)) throw new Error('Log is not an array');
  
  if (events.length > 0) {
    const firstEvent = events[0];
    if (!firstEvent.id) throw new Error('Event missing id');
    if (!firstEvent.type) throw new Error('Event missing type');
    if (!firstEvent.timestamp_ms) throw new Error('Event missing timestamp_ms');
  }
  
  addResult('GET /v1/log', true, `Found ${events.length} log entries`);
});

// Test 7: GET /v1/log?type=state_changed
await test('GET /v1/log?type=state_changed', async () => {
  const res = await fetch(`${BASE_URL}/log?type=state_changed&per_page=10&page=1`);
  const data = await res.json();
  
  if (res.status !== 200) throw new Error(`Status ${res.status}, expected 200`);
  
  const events = data.data || data;
  if (!Array.isArray(events)) throw new Error('Log is not an array');
  
  if (events.length > 0) {
    const firstEvent = events[0];
    if (!firstEvent.details) throw new Error('Event missing details');
    // Details should have from_state, to_state, reason
    if (!('to_state' in firstEvent.details)) {
      throw new Error('Event details missing to_state');
    }
  }
  
  addResult('GET /v1/log?type=state_changed', true, 
    `Found ${events.length} state_changed events`);
});

// Test 8: GET /v1/metrics
await test('GET /v1/metrics', async () => {
  const res = await fetch(`${BASE_URL}/metrics`);
  const data = await res.json();
  
  if (res.status !== 200) throw new Error(`Status ${res.status}, expected 200`);
  
  const metrics = data.data || data;
  if (typeof metrics.total_cells !== 'number') {
    throw new Error('total_cells is not a number');
  }
  if (isNaN(metrics.total_cells)) throw new Error('total_cells is NaN');
  
  if (!metrics.counts_by_state) throw new Error('Missing counts_by_state');
  
  // Verify no NaN in metrics
  const checkForNaN = (obj, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'number' && isNaN(value)) {
        throw new Error(`Found NaN in metrics at ${path}${key}`);
      }
      if (typeof value === 'object' && value !== null) {
        checkForNaN(value, `${path}${key}.`);
      }
    }
  };
  checkForNaN(metrics);
  
  addResult('GET /v1/metrics', true, 
    `Total cells: ${metrics.total_cells}, no NaN values found`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('BACKEND CONTRACT COMPLIANCE TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📊 Total:  ${results.tests.length}`);
console.log('='.repeat(60));

if (results.failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.tests.filter(t => !t.passed).forEach(t => {
    console.log(`  - ${t.name}: ${t.details}`);
  });
  process.exit(1);
} else {
  console.log('\n✅ ALL BACKEND TESTS PASSED!');
  console.log(`\nCreated cell IDs for frontend testing:`);
  createdCellIds.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));
  process.exit(0);
}
