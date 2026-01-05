import { Router } from 'express';
import { CQLParser, CognitiveEngine, CogError } from '../cognitiveService.js';
import { getDb, prepareStatements } from '../db.js';
import { EventTypes, GenesisCell, LogEntry, RuntimeMetrics } from '../types.js';
import { CognitiveStreamAdapter } from '../cognitiveStreamAdapter.js';

const router = Router();

// GET /v1/cognitive/stream
router.get('/cognitive/stream', (req, res) => {
    const { mode, window_s, scope, sample_ms } = req.query;

    // 1. Validations
    if (!mode || !['DESCRIPTIVE', 'INTERPRETIVE', 'NARRATIVE'].includes(mode as string)) {
        return res.status(422).json({ error: { code: 'INVALID_MODE', message: 'Mode must be DESCRIPTIVE, INTERPRETIVE or NARRATIVE' } });
    }

    const win = Number(window_s);
    if (![30, 60, 120, 300].includes(win)) {
        return res.status(422).json({ error: { code: 'INVALID_WINDOW', message: 'Window must be 30, 60, 120 or 300 seconds' } });
    }

    const sc = (scope as string) || 'global';
    const validScopes = ['global', 'cells', 'events', 'metrics'];
    if (!validScopes.includes(sc) && !sc.startsWith('workflow:')) {
        return res.status(422).json({ error: { code: 'INVALID_SCOPE', message: 'Invalid scope provided' } });
    }

    const sample = Number(sample_ms) || 5000;

    // 2. SSE Setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.write(': cognitive stream connected\n\n');

    const adapter = new CognitiveStreamAdapter(
        mode as any,
        win,
        sc,
        sample,
        (msg) => {
            res.write(`event: COGNITIVE_UPDATE\n`);
            res.write(`data: ${JSON.stringify(msg)}\n\n`);
        }
    );

    adapter.start();

    req.on('close', () => {
        adapter.stop();
        res.end();
    });
});

// POST /v1/cognitive/query
router.post('/cognitive/query', (req, res) => {
    try {
        const { query, context, limits } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                ok: false,
                error: { code: 'CQL_PARSE_ERROR', message: 'Query must be a non-empty string' }
            });
        }

        // 1. Parse CQL to AST
        const ast = CQLParser.parse(query);

        // 2. Fetch required data from Core (Read-Only)
        const db = getDb();
        const stmts = prepareStatements(db);

        // Fetch cells
        const cells = db.prepare('SELECT * FROM cells').all() as GenesisCell[];

        // Fetch logs (filtered by time_range_days if provided)
        let logSql = 'SELECT id, type, cell_id, timestamp_ms, details_json FROM audit_log';
        if (limits?.time_range_days) {
            const ms = limits.time_range_days * 24 * 60 * 60 * 1000;
            logSql += ` WHERE timestamp_ms > ${Date.now() - ms}`;
        }
        const auditEntries = db.prepare(logSql).all() as any[];
        const events: LogEntry[] = auditEntries.map(e => ({
            id: e.id,
            type: e.type,
            cell_id: e.cell_id,
            timestamp_ms: e.timestamp_ms,
            details: e.details_json ? JSON.parse(e.details_json) : {}
        }));

        // Fetch metrics (basic)
        const metrics: RuntimeMetrics = {
            total_cells: cells.length,
            counts_by_state: {} as any,
            avg_friction: 0,
            uptime_ms: 0,
            wasm_executions_total: 0,
            wasm_executions_last_hour: 0,
            avg_execution_time_ms: 0,
            memory_usage_mb: 0,
            active_scripts: 0,
            status: 'online',
            last_updated_ms: Date.now()
        };

        // 3. Execute Engine
        const result = CognitiveEngine.execute(ast, { cells, events, metrics }, {
            max_cells: limits?.max_cells ?? 1000,
            max_events: limits?.max_events ?? 5000,
            time_range_days: limits?.time_range_days ?? 30,
            max_tokens: limits?.max_tokens ?? 1000
        });

        // 4. Return success response
        res.json({
            ok: true,
            cql: {
                version: '1.0',
                ast
            },
            crm: {
                layers_used: result.layersUsed,
                provenance: result.provenance
            },
            result: {
                format: ast.render || 'json',
                data: result.data,
                text: result.text
            }
        });

    } catch (error) {
        if (error instanceof CogError) {
            return res.status(error.statusCode).json({
                ok: false,
                error: {
                    code: error.code,
                    message: error.message
                }
            });
        }

        console.error('[Cognitive Query Error]', error);
        res.status(500).json({
            ok: false,
            error: {
                code: 'INTERNAL_COG_ERROR',
                message: 'An unexpected error occurred in cognitive layer'
            }
        });
    }
});

export const cognitiveRouter = router;
