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
import { EventTypes } from '../types.js';
import { eventBus } from '../eventBus.js';

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
      EventTypes.GPP_INGESTED,
      tenantId,
      cellId,
      now,
      JSON.stringify(payload)
    );

    // Record audit: cell_created (append-only)
    stmts.insertAuditLog.run(
      uuidv4(),
      EventTypes.CELL_CREATED,
      tenantId,
      cellId,
      now + 1,
      JSON.stringify({
        cell_id: cellId,
        type: payload.type,
        retention: payload.retention,
        intent: payload.intent,
        version: 1,
      })
    );

    // Emit for SSE
    eventBus.emit({
      type: EventTypes.CELL_CREATED,
      timestamp_ms: now + 1,
      cell_id: cellId,
      details: {
        type: payload.type,
        retention: payload.retention,
        intent: payload.intent,
      }
    });

    // Record cell history: initial state (append-only)
    stmts.insertCellHistory.run(
      uuidv4(),
      cellId,
      tenantId,
      initialState, // from_state = CANDIDATE (observable)
      initialState, // to_state = CANDIDATE
      'ingest',
      now + 2
    );

    // Record audit: state_changed (append-only)
    stmts.insertAuditLog.run(
      uuidv4(),
      EventTypes.STATE_CHANGED,
      tenantId,
      cellId,
      now + 2,
      JSON.stringify({
        from_state: initialState,
        to_state: initialState,
        reason: 'ingest',
      })
    );

    // Emit for SSE
    eventBus.emit({
      type: EventTypes.STATE_CHANGED,
      timestamp_ms: now + 2,
      cell_id: cellId,
      details: {
        from_state: initialState,
        to_state: initialState,
        reason: 'ingest',
      }
    });

    // Record initial friction
    stmts.insertFrictionHistory.run(
      uuidv4(),
      cellId,
      tenantId,
      0,
      now + 3,
      'ingest'
    );

    // Record audit: friction_recorded
    stmts.insertAuditLog.run(
      uuidv4(),
      EventTypes.FRICTION_RECORDED,
      tenantId,
      cellId,
      now + 3,
      JSON.stringify({
        friction: 0,
        reason: 'ingest',
      })
    );

    // Emit for SSE
    eventBus.emit({
      type: EventTypes.FRICTION_RECORDED,
      timestamp_ms: now + 3,
      cell_id: cellId,
      details: {
        friction: 0,
        reason: 'ingest',
      }
    });

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
