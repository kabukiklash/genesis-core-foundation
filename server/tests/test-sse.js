import http from 'http';

const BASE_URL = 'http://localhost:3000/v1';

async function testSSE() {
    console.log('🚀 Starting SSE Automated Tests (Resilient Chunking)...');

    const checkHeaders = () => new Promise((resolve, reject) => {
        http.get(`${BASE_URL}/stream/events`, (res) => {
            const contentType = res.headers['content-type'];
            console.log(`[PASS] Content-Type: ${contentType}`);
            if (contentType !== 'text/event-stream') {
                reject(new Error(`Wrong Content-Type: ${contentType}`));
            }
            res.destroy();
            resolve(true);
        }).on('error', reject);
    });

    const checkBroadcast = () => new Promise((resolve, reject) => {
        let accumulator = '';
        const req = http.get(`${BASE_URL}/stream/events`, (res) => {
            res.on('data', (chunk) => {
                accumulator += chunk.toString();

                // Check for complete event block (ended by \n\n)
                if (accumulator.includes('\n\n')) {
                    const blocks = accumulator.split('\n\n');
                    // Last block might be partial, keep it in accumulator
                    accumulator = blocks.pop() || '';

                    for (const block of blocks) {
                        if (block.includes('event: CELL_CREATED')) {
                            console.log('[PASS] Event broadcast received via SSE');

                            const lines = block.split('\n');
                            const dataLine = lines.find(l => l.startsWith('data: '));
                            if (dataLine) {
                                const jsonPart = dataLine.replace('data: ', '');
                                try {
                                    const data = JSON.parse(jsonPart);
                                    if (data.type === 'cell_created' && data.meta?.version === '1.0.0') {
                                        console.log('[PASS] Payload compliant with Contract v1.0');
                                        req.destroy();
                                        resolve(true);
                                        return;
                                    }
                                } catch (e) {
                                    // Might be a partial block if it contains multiple events
                                }
                            }
                        }
                    }
                }
            });
        });

        setTimeout(() => {
            const postData = JSON.stringify({
                type: 'ORDER',
                retention: 'LONG',
                intent: 'SSE Hardening Test'
            });

            const triggerReq = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/v1/gpp/ingest',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                if (res.statusCode !== 201) reject(new Error(`Trigger failed: ${res.statusCode}`));
            });
            triggerReq.write(postData);
            triggerReq.end();
        }, 1000);

        setTimeout(() => {
            reject(new Error('Timeout: No valid CELL_CREATED event block received'));
        }, 7000);
    });

    try {
        await checkHeaders();
        await checkBroadcast();
        console.log('\n✅ ALL SSE TESTS PASSED (Phase 4.1 Verified)');
    } catch (error) {
        console.error(`\n❌ SSE TEST FAILED: ${error.message}`);
        process.exit(1);
    }
}

testSSE();
