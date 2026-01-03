// GenesisCore Runtime - Cells API
// GET /v1/cells, GET /v1/cells/:cellId, GET /v1/cells/:cellId/history
//
// PASSIVE: Read-only access to cell data

import { Router } from 'express';
import { getDb, prepareStatements } from '../db.js';
import type { GenesisCell, CellHistoryEntry, ApiResponse, PaginatedResponse } from '../types.js';

const router = Router();

// GET /v1/cells - List cells with optional filters
router.get('/cells', (req, res) => {
  try {
    const db = getDb();
    const { state, retention, q, limit = '50', page = '1' } = req.query;
    
    let sql = 'SELECT * FROM cells WHERE 1=1';
    const params: unknown[] = [];
    
    // Filter by state (comma-separated)
    if (state && typeof state === 'string') {
      const states = state.split(',').map(s => s.trim());
      sql += ` AND state IN (${states.map(() => '?').join(',')})`;
      params.push(...states);
    }
    
    // Filter by retention (comma-separated)
    if (retention && typeof retention === 'string') {
      const retentions = retention.split(',').map(r => r.trim());
      sql += ` AND retention IN (${retentions.map(() => '?').join(',')})`;
      params.push(...retentions);
    }
    
    // Search by id or intent
    if (q && typeof q === 'string') {
      sql += ` AND (id LIKE ? OR intent LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }
    
    // Count total for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalResult = db.prepare(countSql).get(...params) as { count: number };
    const total = totalResult.count;
    
    // Add ordering and pagination
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    
    sql += ' ORDER BY created_at_ms DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
    
    const cells = db.prepare(sql).all(...params) as GenesisCell[];
    
    const response: PaginatedResponse<GenesisCell> = {
      data: cells,
      meta: {
        timestamp_ms: Date.now(),
        version: '1.0.0',
      },
      pagination: {
        total,
        page: pageNum,
        per_page: limitNum,
        total_pages: Math.ceil(total / limitNum),
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Cells List Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/cells/:cellId - Get single cell
router.get('/cells/:cellId', (req, res) => {
  try {
    const db = getDb();
    const stmts = prepareStatements(db);
    const { cellId } = req.params;
    
    const cell = stmts.getCell.get(cellId) as GenesisCell | undefined;
    
    if (!cell) {
      return res.status(404).json({
        error: 'Cell not found',
        cell_id: cellId,
      });
    }
    
    const response: ApiResponse<GenesisCell> = {
      data: cell,
      meta: {
        timestamp_ms: Date.now(),
        version: '1.0.0',
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Cell Get Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /v1/cells/:cellId/history - Get cell state history
router.get('/cells/:cellId/history', (req, res) => {
  try {
    const db = getDb();
    const stmts = prepareStatements(db);
    const { cellId } = req.params;
    
    // Check if cell exists
    const cell = stmts.getCell.get(cellId) as GenesisCell | undefined;
    if (!cell) {
      return res.status(404).json({
        error: 'Cell not found',
        cell_id: cellId,
      });
    }
    
    const history = stmts.getCellHistory.all(cellId) as CellHistoryEntry[];
    
    const response: ApiResponse<CellHistoryEntry[]> = {
      data: history,
      meta: {
        timestamp_ms: Date.now(),
        version: '1.0.0',
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Cell History Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const cellsRouter = router;
