// GenesisCore Runtime - Health Check
// GET /v1/health

import { Router } from 'express';

const router = Router();

const startTime = Date.now();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp_ms: Date.now(),
    uptime_ms: Date.now() - startTime,
    version: '1.0.0',
  });
});

export const healthRouter = router;
export { startTime };
