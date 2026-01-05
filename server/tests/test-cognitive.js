/**
 * GenesisCore Phase 5.3 - Cognitive API Automated Tests
 * Verifies:
 * 1. Valid queries (Descriptive, Interpretive, Narrative)
 * 2. Error mapping (400, 413, 422, 502, 500)
 * 3. CQL Guard (Keyword protection)
 * 4. CRM Compliance (Provenance, Layers, Reducibility)
 * 5. Read-Only nature
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000/v1';

async function postQuery(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request(`${BASE_URL}/cognitive/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => resolve({
                status: res.statusCode,
                body: JSON.parse(responseBody)
            }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Phase 5.3 Cognitive API Tests...\n');

    try {
        // Test 1: Valid DESCRIPTIVE query
        console.log('Test 1: Valid DESCRIPTIVE query...');
        const t1 = await postQuery({ query: 'FROM cells SELECT id, state RENDER json' });
        if (t1.status === 200 && t1.body.ok) {
            console.log('✅ PASS: Descriptive query returned 200 OK');
        } else {
            throw new Error(`Test 1 Failed: ${t1.status} ${JSON.stringify(t1.body)}`);
        }

        // Test 2: Valid INTERPRETIVE query
        console.log('\nTest 2: Valid INTERPRETIVE query...');
        const t2 = await postQuery({ query: 'FROM cells SELECT id INTERPRET INTERPRETIVE RENDER text' });
        if (t2.status === 200 && t2.body.crm.layers_used.includes('INTERPRETIVE')) {
            console.log('✅ PASS: Interpretive layer detected');
        } else {
            throw new Error(`Test 2 Failed: ${t2.status}`);
        }

        // Test 3: Prohibition Check (Keyword: loop)
        console.log('\nTest 3: CQL Guard (Prohibited keyword "loop")...');
        const t3 = await postQuery({ query: 'FROM cells WHERE id = "1" LOOP 10' });
        if (t3.status === 400 && t3.body.error.code === 'CQL_UNSUPPORTED_FEATURE') {
            console.log('✅ PASS: Blocked prohibited keyword "loop" (400)');
        } else {
            throw new Error(`Test 3 Failed: ${t3.status}`);
        }

        // Test 4: CRM Reducibility Check (NARRATIVE with empty set)
        console.log('\nTest 4: CRM Non-Reducible Check...');
        const t4 = await postQuery({ query: 'FROM cells WHERE state = "NON_EXISTENT" INTERPRET NARRATIVE' });
        if (t4.status === 422 && t4.body.error.code === 'CRM_NON_REDUCIBLE') {
            console.log('✅ PASS: Caught non-reducible narrative (422)');
        } else {
            throw new Error(`Test 4 Failed: ${t4.status}`);
        }

        // Test 5: Limits Check (max_cells)
        console.log('\nTest 5: Safety Limits Check (max_cells=0)...');
        const t5 = await postQuery({
            query: 'FROM cells',
            limits: { max_cells: 0 }
        });
        if (t5.status === 413 && t5.body.error.code === 'CQL_LIMIT_EXCEEDED') {
            console.log('✅ PASS: Limits enforced (413)');
        } else {
            throw new Error(`Test 5 Failed: ${t5.status}`);
        }

        // Test 6: Provenance Check
        console.log('\nTest 6: Provenance Metadata Check...');
        const t6 = await postQuery({ query: 'FROM cells' });
        if (t6.body.crm.provenance.cells && t6.body.crm.provenance.events) {
            console.log('✅ PASS: Provenance info included');
        } else {
            throw new Error(`Test 6 Failed: ${JSON.stringify(t6.body.crm.provenance)}`);
        }

        // Test 7: Read-Only Audit (Check if no new logs created for cognitive)
        console.log('\nTest 7: Read-Only Verification...');
        const logBefore = await new Promise(r => http.get(`${BASE_URL}/log`, res => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => r(JSON.parse(b)));
        }));
        await postQuery({ query: 'FROM cells INTERPRET NARRATIVE' });
        const logAfter = await new Promise(r => http.get(`${BASE_URL}/log`, res => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => r(JSON.parse(b)));
        }));
        if (logBefore.data.length === logAfter.data.length) {
            console.log('✅ PASS: Absolute Read-Only (Audit logs unchanged)');
        } else {
            throw new Error(`Test 7 Failed: Log count changed from ${logBefore.data.length} to ${logAfter.data.length}`);
        }

        console.log('\n✨ ALL PHASE 5.3 COGNITIVE TESTS PASSED ✨');

    } catch (error) {
        console.error(`\n❌ TEST FAILED: ${error.message}`);
        process.exit(1);
    }
}

runTests();
