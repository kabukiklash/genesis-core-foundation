// GenesisCore Runtime - Main Entry Point
// Phase 3: Passive Memory
//
// This runtime is PASSIVE:
// - It observes, records, and measures friction
// - It does NOT validate DSL or interpret commands
// - It does NOT make autonomous decisions
// - All history is append-only (immutable)

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { getDb, closeDb } from './db.js';
import { healthRouter } from './routes/health.js';
import { gppRouter } from './routes/gpp.js';
import { cellsRouter } from './routes/cells.js';
import { logRouter } from './routes/log.js';
import { metricsRouter } from './routes/metrics.js';
import { streamRouter } from './routes/stream.js';
import { cognitiveRouter } from './routes/cognitive.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logging (audit trail)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mount routes under /v1
app.use('/v1', healthRouter);
app.use('/v1', gppRouter);
app.use('/v1', cellsRouter);
app.use('/v1', logRouter);
app.use('/v1', metricsRouter);
app.use('/v1', streamRouter);
app.use('/v1', cognitiveRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize database and start server
function start() {
  try {
    // Initialize database
    getDb();
    console.log('[GenesisCore] Database connected');

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   GenesisCore Runtime v1.0.0 - Phase 3 (Passive Memory)  ║
║                                                           ║
║   Server:    http://localhost:${PORT}                       ║
║   API Base:  http://localhost:${PORT}/v1                    ║
║   Health:    http://localhost:${PORT}/v1/health             ║
║                                                           ║
║   Mode: PASSIVE (observe, record, measure)                ║
║   Storage: SQLite (${process.env.GENESIS_DB_PATH || 'genesis.db'})              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('[GenesisCore] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[GenesisCore] Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[GenesisCore] Received SIGTERM, shutting down...');
  closeDb();
  process.exit(0);
});

start();
