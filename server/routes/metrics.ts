// GenesisCore Runtime - Metrics API
// GET /v1/metrics, GET /v1/metrics/trends, GET /v1/metrics/friction/:cellId
//
// PASSIVE: Read-only metrics and statistics

import { Router } from 'express';
import { getDb, prepareStatements } from '../db.js';
import { startTime } from './health.js';
import type { CellState, RuntimeMetrics, TrendPoint, FrictionHistoryEntry, ApiResponse } from '../types.js';

const router = Router();

// GET /v1/metrics - Current runtime metrics
router.get('/metrics', (_req, res) => {
  try {
    const db = getDb();
    const stmts = prepareStatements(db);
    
    // Total cells
    const totalResult = stmts.countCells.get() as { count: number };
    
    // Counts by state
    const stateResults = stmts.countByState.all() as { state: CellState; count: number }[];
    const countsByState: Record<CellState, number> = {
      CANDIDATE: 0,
      RUNNING: 0,
      COOLING: 0,
      DONE: 0,
      ERROR: 0,
    };
    stateResults.forEach(row => {
      countsByState[row.state] = row.count;
    });
    
    // Average friction
    const avgResult = stmts.avgFriction.get() as { avg: number | null };
    
    const metrics: RuntimeMetrics = {
      total_cells: totalResult.count,
      counts_by_state: countsByState,
      avg_friction: Math.round(avgResult.avg ?? 0),
      uptime_ms: Date.now() - startTime,
      wasm_executions_total: 0, // Phase 3: not implemented yet
      wasm_executions_last_hour: 0,
      avg_execution_time_ms: 0,
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      active_scripts: 0,
      status: 'online',
      last_updated_ms: Date.now(),
    };
    
    const response: ApiResponse<RuntimeMetrics> = {
      data: metrics,
      meta: {
        timestamp_ms: Date.now(),
        version: '1.0.0',
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Metrics Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/metrics/trends - Historical trends
router.get('/metrics/trends', (req, res) => {
  try {
    const db = getDb();
    const { hours = '24' } = req.query;
    const hoursNum = Math.min(parseInt(hours as string) || 24, 168); // Max 1 week
    
    const now = Date.now();
    const startMs = now - (hoursNum * 60 * 60 * 1000);
    
    // Get hourly aggregates of cell creations and friction
    const sql = `
      SELECT 
        (timestamp_ms / 3600000) * 3600000 as hour_bucket,
        COUNT(*) as cells_created,
        AVG(friction) as avg_friction
      FROM cells 
      WHERE created_at_ms >= ?
      GROUP BY hour_bucket
      ORDER BY hour_bucket ASC
    `;
    
    const results = db.prepare(sql).all(startMs) as { 
      hour_bucket: number; 
      cells_created: number; 
      avg_friction: number | null;
    }[];
    
    // Generate trend points for each hour
    const trends: TrendPoint[] = [];
    for (let h = 0; h < hoursNum; h++) {
      const hourMs = startMs + (h * 60 * 60 * 1000);
      const bucket = Math.floor(hourMs / 3600000) * 3600000;
      const match = results.find(r => r.hour_bucket === bucket);
      
      trends.push({
        timestamp_ms: bucket,
        executions: 0, // Phase 3: not tracking WASM yet
        cells_created: match?.cells_created || 0,
        avg_friction: Math.round(match?.avg_friction ?? 0),
        avg_time_ms: 0,
        memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      });
    }
    
    const response: ApiResponse<TrendPoint[]> = {
      data: trends,
      meta: {
        timestamp_ms: Date.now(),
        version: '1.0.0',
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Trends Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/metrics/friction/:cellId - Friction history for a cell
router.get('/metrics/friction/:cellId', (req, res) => {
  try {
    const db = getDb();
    const stmts = prepareStatements(db);
    const { cellId } = req.params;
    
    // Check if cell exists
    const cell = stmts.getCell.get(cellId);
    if (!cell) {
      return res.status(404).json({
        error: 'Cell not found',
        cell_id: cellId,
      });
    }
    
    const history = stmts.getFrictionHistory.all(cellId) as FrictionHistoryEntry[];
    
    const response: ApiResponse<FrictionHistoryEntry[]> = {
      data: history,
      meta: {
        timestamp_ms: Date.now(),
        version: '1.0.0',
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Friction History Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const metricsRouter = router;
