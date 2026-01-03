// GenesisCore Runtime - GPP Ingest
// POST /v1/gpp/ingest
// 
// PASSIVE BEHAVIOR:
// - Creates a new cell with state=CANDIDATE
// - Records audit logs (append-only)
// - Records cell history (append-only)
// - NO validation of DSL, NO interpretation of commands

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, prepareStatements } from '../db.js';
import type { GPPPayload, CellState } from '../types.js';

const router = Router();

router.post('/gpp/ingest', (req, res) => {
  try {
    const payload: GPPPayload = req.body;
    
    // Validate minimal required fields
    if (!payload.type) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required field: type',
      });
    }
    
    if (!payload.retention || !['EPHEMERAL', 'LONG'].includes(payload.retention)) {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid field: retention (must be EPHEMERAL or LONG)',
      });
    }

    const db = getDb();
    const stmts = prepareStatements(db);
    const now = Date.now();
    
    // Generate new cell ID
    const cellId = uuidv4();
    const initialState: CellState = 'CANDIDATE';
    const tenantId = payload.tenant_id || null;
    
    // Create the cell (PASSIVE: just store, no interpretation)
    stmts.insertCell.run(
      cellId,
      tenantId,
      payload.intent || null,
      payload.type,
      payload.retention,
      initialState,
      1, // version
      0, // initial friction
      now,
      now
    );
    
    // Record audit: gpp_ingested (append-only)
    stmts.insertAuditLog.run(
      uuidv4(),
      'gpp_ingested',
      tenantId,
      cellId,
      now,
      JSON.stringify(payload)
    );
    
    // Record audit: cell_created (append-only)
    stmts.insertAuditLog.run(
      uuidv4(),
      'cell_created',
      tenantId,
      cellId,
      now,
      JSON.stringify({
        cell_id: cellId,
        type: payload.type,
        retention: payload.retention,
        intent: payload.intent,
      })
    );
    
    // Record cell history: initial state (append-only)
    stmts.insertCellHistory.run(
      uuidv4(),
      cellId,
      tenantId,
      null, // from_state (null for creation)
      initialState,
      'ingest',
      now
    );
    
    // Record initial friction (append-only)
    stmts.insertFrictionHistory.run(
      uuidv4(),
      cellId,
      tenantId,
      0,
      now,
      'initial'
    );
    
    res.status(201).json({
      ok: true,
      cell_ids: [cellId],
      meta: {
        timestamp_ms: now,
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('[GPP Ingest Error]', error);
    res.status(500).json({
      ok: false,
      error: 'Internal server error',
    });
  }
});

export const gppRouter = router;
