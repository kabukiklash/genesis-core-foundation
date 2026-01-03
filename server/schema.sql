-- GenesisCore Runtime - Phase 3 (Passive Memory)
-- Schema v1.0 - Append-only audit trail

-- Audit log: all system events (append-only, immutable)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  tenant_id TEXT,
  cell_id TEXT,
  timestamp_ms INTEGER NOT NULL,
  details_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_type ON audit_log(type);
CREATE INDEX IF NOT EXISTS idx_audit_log_cell_id ON audit_log(cell_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp_ms DESC);

-- GenesisCells: primary memory units
CREATE TABLE IF NOT EXISTS cells (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  intent TEXT,
  type TEXT NOT NULL,
  retention TEXT NOT NULL CHECK (retention IN ('EPHEMERAL', 'LONG')),
  state TEXT NOT NULL CHECK (state IN ('CANDIDATE', 'RUNNING', 'COOLING', 'DONE', 'ERROR')),
  version INTEGER NOT NULL DEFAULT 1,
  friction INTEGER NOT NULL DEFAULT 0 CHECK (friction >= 0 AND friction <= 100),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cells_state ON cells(state);
CREATE INDEX IF NOT EXISTS idx_cells_retention ON cells(retention);
CREATE INDEX IF NOT EXISTS idx_cells_tenant ON cells(tenant_id);

-- Cell state history (append-only, immutable)
CREATE TABLE IF NOT EXISTS cell_history (
  id TEXT PRIMARY KEY,
  cell_id TEXT NOT NULL,
  tenant_id TEXT,
  from_state TEXT,
  to_state TEXT NOT NULL,
  reason TEXT,
  timestamp_ms INTEGER NOT NULL,
  FOREIGN KEY (cell_id) REFERENCES cells(id)
);

CREATE INDEX IF NOT EXISTS idx_cell_history_cell ON cell_history(cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_history_timestamp ON cell_history(timestamp_ms ASC);

-- Friction history (append-only, immutable)
CREATE TABLE IF NOT EXISTS friction_history (
  id TEXT PRIMARY KEY,
  cell_id TEXT NOT NULL,
  tenant_id TEXT,
  friction INTEGER NOT NULL CHECK (friction >= 0 AND friction <= 100),
  timestamp_ms INTEGER NOT NULL,
  reason TEXT,
  FOREIGN KEY (cell_id) REFERENCES cells(id)
);

CREATE INDEX IF NOT EXISTS idx_friction_history_cell ON friction_history(cell_id);
CREATE INDEX IF NOT EXISTS idx_friction_history_timestamp ON friction_history(timestamp_ms ASC);
