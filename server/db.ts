// GenesisCore Runtime - Database Layer
// SQLite with better-sqlite3 for synchronous, fast operations

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.GENESIS_DB_PATH || join(__dirname, 'genesis.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db!.exec(schema);
  console.log('[GenesisCore] Database schema initialized');
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Prepared statements for performance
export function prepareStatements(db: Database.Database) {
  return {
    // Cells
    insertCell: db.prepare(`
      INSERT INTO cells (id, tenant_id, intent, type, retention, state, version, friction, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    getCell: db.prepare(`SELECT * FROM cells WHERE id = ?`),
    listCells: db.prepare(`SELECT * FROM cells ORDER BY created_at_ms DESC`),
    updateCell: db.prepare(`
      UPDATE cells SET state = ?, friction = ?, version = version + 1, updated_at_ms = ?
      WHERE id = ?
    `),

    // Cell History (append-only)
    insertCellHistory: db.prepare(`
      INSERT INTO cell_history (id, cell_id, tenant_id, from_state, to_state, reason, timestamp_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    getCellHistory: db.prepare(`
      SELECT * FROM cell_history WHERE cell_id = ? ORDER BY timestamp_ms ASC
    `),

    // Friction History (append-only)
    insertFrictionHistory: db.prepare(`
      INSERT INTO friction_history (id, cell_id, tenant_id, friction, timestamp_ms, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
    getFrictionHistory: db.prepare(`
      SELECT * FROM friction_history WHERE cell_id = ? ORDER BY timestamp_ms ASC
    `),

    // Audit Log (append-only)
    insertAuditLog: db.prepare(`
      INSERT INTO audit_log (id, type, tenant_id, cell_id, timestamp_ms, details_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `),
    getAuditLogs: db.prepare(`
      SELECT * FROM audit_log ORDER BY timestamp_ms DESC
    `),

    // Metrics
    countCells: db.prepare(`SELECT COUNT(*) as count FROM cells`),
    countByState: db.prepare(`
      SELECT state, COUNT(*) as count FROM cells GROUP BY state
    `),
    avgFriction: db.prepare(`SELECT AVG(friction) as avg FROM cells`),
  };
}
