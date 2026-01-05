import http from 'http';

const BASE_URL = 'http://localhost:3000/v1';

async function testValidation(params) {
    return new Promise((resolve) => {
        const query = new URLSearchParams(params).toString();
        http.get(`${BASE_URL}/cognitive/stream?${query}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    if (res.statusCode !== 422 && res.statusCode !== 200) {
                        console.error(`Unexpected status ${res.statusCode}:`, body);
                    }
                    resolve({
                        status: res.statusCode,
                        body: parsed
                    });
                } catch (e) {
                    console.error(`Failed to parse body (Status ${res.statusCode}):`, body);
                    resolve({ status: res.statusCode, body: {} });
                }
            });
        });
    });
}

async function runTests() {
    console.log('🚀 Starting Phase 5.4 Cognitive Streaming Tests...\n');

    try {
        // Test 1: Invalid Window
        console.log('Test 1: Invalid Window (window_s=45)...');
        const t1 = await testValidation({ mode: 'DESCRIPTIVE', window_s: 45 });
        if (t1.status === 422 && t1.body.error?.code === 'INVALID_WINDOW') {
            console.log('✅ PASS: Caught invalid window');
        } else {
            throw new Error(`Test 1 Failed: Status ${t1.status} Code ${t1.body.error?.code}`);
        }

        // Test 2: Invalid Mode
        console.log('\nTest 2: Invalid Mode (mode=AI)...');
        const t2 = await testValidation({ mode: 'AI', window_s: 60 });
        if (t2.status === 422 && t2.body.error?.code === 'INVALID_MODE') {
            console.log('✅ PASS: Caught invalid mode');
        } else {
            throw new Error(`Test 2 Failed: Status ${t2.status} Code ${t2.body.error?.code}`);
        }

        // Test 3: Successful Connection (DESCRIPTIVE)
        console.log('\nTest 3: Successful Connection (mode=DESCRIPTIVE)...');
        await new Promise((resolve, reject) => {
            const req = http.get(`${BASE_URL}/cognitive/stream?mode=DESCRIPTIVE&window_s=60`, (res) => {
                if (res.statusCode === 200 && res.headers['content-type'] === 'text/event-stream') {
                    console.log('✅ PASS: SSE Stream connected');
                    res.destroy();
                    resolve();
                } else {
                    reject(new Error(`Test 3 Failed: StatusCode ${res.statusCode} ContentType ${res.headers['content-type']}`));
                }
            });
            req.on('error', reject);
        });

        // Test 4: Read-Only Verification
        console.log('\nTest 4: Read-Only Verification...');
        const getLogs = () => new Promise(r => http.get(`${BASE_URL}/log`, res => {
            let b = ''; res.on('data', c => b += c); res.on('end', () => r(JSON.parse(b)));
        }));

        const logBefore = await getLogs();

        // Connect to stream for a moment to trigger activity
        await new Promise(resolve => {
            const testReq = http.get(`${BASE_URL}/cognitive/stream?mode=NARRATIVE&window_s=60`, () => {
                setTimeout(() => {
                    testReq.destroy();
                    resolve();
                }, 500);
            });
        });

        const logAfter = await getLogs();

        if (logBefore.data.length === logAfter.data.length) {
            console.log('✅ PASS: Absolute Read-Only (Audit logs unchanged)');
        } else {
            throw new Error(`Test 4 Failed: Log count changed from ${logBefore.data.length} to ${logAfter.data.length}`);
        }

        console.log('\n✨ ALL PHASE 5.4 COGNITIVE STREAMING TESTS PASSED ✨');
        process.exit(0);

    } catch (error) {
        console.error(`\n❌ TEST FAILED: ${error.message}`);
        process.exit(1);
    }
}

runTests();
