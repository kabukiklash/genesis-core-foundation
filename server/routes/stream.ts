import { Router } from 'express';
import { eventBus } from '../eventBus.js';

const router = Router();

// GET /v1/stream/events
// PASSIVE BEHAVIOR:
// - Only broadcasts events, does not accept input
// - Subscription based, no state change on runtime
router.get('/stream/events', (req, res) => {
    // Kill Switch check
    if (process.env.ENABLE_SSE === 'false') {
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'SSE Stream is currently disabled by administrator'
        });
    }

    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx)

    console.log(`[SSE] Client connected. Total clients: ${eventBus.subscriberCount + 1}`);

    // Send initial connected heartbeat
    res.write(': heartbeat\n\n');

    // Subscriber function
    const sendEvent = (event: any): boolean => {
        try {
            // Envelope format from Contract v1.0
            const sseData = JSON.stringify({
                type: event.type,
                timestamp_ms: event.timestamp_ms || Date.now(),
                cell_id: event.cell_id || null,
                details: event.details || {},
                meta: {
                    version: '1.0.0'
                }
            });

            // res.write returns false if the kernel buffer is full (backpressure)
            const canWriteEvent = res.write(`event: ${event.type.toUpperCase()}\n`);
            const canWriteData = res.write(`data: ${sseData}\n\n`);

            return canWriteEvent && canWriteData;
        } catch (e) {
            return false;
        }
    };

    // Subscribe to the bus
    const unsubscribe = eventBus.subscribe(sendEvent);

    if (!unsubscribe) {
        res.write('event: ERROR\ndata: {"message": "Server at capacity"}\n\n');
        return res.end();
    }

    // Heartbeat interval to keep connection alive
    const heartbeatInterval = setInterval(() => {
        try {
            const ok = res.write(': heartbeat\n\n');
            if (!ok) {
                console.warn('[SSE] Heartbeat failed (backpressure), connection might be stuck.');
            }
        } catch (e) {
            clearInterval(heartbeatInterval);
        }
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
        unsubscribe();
        clearInterval(heartbeatInterval);
        console.log(`[SSE] Client disconnected. Total clients: ${eventBus.subscriberCount}`);
        res.end();
    });
});

export const streamRouter = router;
