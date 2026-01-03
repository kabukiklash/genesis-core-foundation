// GenesisCore Runtime - Audit Log API
// GET /v1/log
//
// PASSIVE: Read-only access to audit trail

import { Router } from 'express';
import { getDb } from '../db.js';
import type { AuditLogEntry, LogEntry, PaginatedResponse } from '../types.js';

const router = Router();

// GET /v1/log - Query audit logs
router.get('/log', (req, res) => {
  try {
    const db = getDb();
    const { type, cell_id, per_page = '20', page = '1' } = req.query;
    
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params: unknown[] = [];
    
    // Filter by type
    if (type && typeof type === 'string') {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    // Filter by cell_id
    if (cell_id && typeof cell_id === 'string') {
      sql += ' AND cell_id = ?';
      params.push(cell_id);
    }
    
    // Count total for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalResult = db.prepare(countSql).get(...params) as { count: number };
    const total = totalResult.count;
    
    // Add ordering and pagination
    const limitNum = Math.min(parseInt(per_page as string) || 20, 100);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    
    sql += ' ORDER BY timestamp_ms DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
    
    const logs = db.prepare(sql).all(...params) as AuditLogEntry[];
    
    // Transform to LogEntry format for frontend compatibility
    const logEntries: LogEntry[] = logs.map(log => {
      let details: LogEntry['details'] = undefined;
      
      try {
        const parsed = JSON.parse(log.details_json);
        details = {
          from_state: parsed.from_state,
          to_state: parsed.to_state,
          reason: parsed.reason,
          message: parsed.message,
          friction_at_transition: parsed.friction_at_transition,
        };
      } catch {
        // Keep details undefined if parse fails
      }
      
      return {
        id: log.id,
        type: log.type,
        cell_id: log.cell_id,
        timestamp_ms: log.timestamp_ms,
        details,
      };
    });
    
    // PR-04: Response envelope with data and meta (simplified format)
    const response = {
      data: logEntries,
      meta: {
        page: pageNum,
        per_page: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
        timestamp_ms: Date.now(),
        version: '1.0.0',
      },
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Log Query Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const logRouter = router;
