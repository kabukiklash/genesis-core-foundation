// GenesisCore Runtime - Type Definitions
// Aligned with OpenAPI specification and ADR-003

export type CellState = 'CANDIDATE' | 'RUNNING' | 'COOLING' | 'DONE' | 'ERROR';
export type RetentionType = 'EPHEMERAL' | 'LONG';

// Event Types (PR-04: Standardized Event Model)
export const EventTypes = {
  GPP_INGESTED: 'gpp_ingested',
  CELL_CREATED: 'cell_created',
  STATE_CHANGED: 'state_changed',
  FRICTION_RECORDED: 'friction_recorded',
  RUNTIME_SNAPSHOT: 'runtime_snapshot',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

export interface GenesisCell {
  id: string;
  tenant_id: string | null;
  intent: string | null;
  type: string;
  retention: RetentionType;
  state: CellState;
  version: number;
  friction: number;
  created_at_ms: number;
  updated_at_ms: number;
}

export interface CellHistoryEntry {
  id: string;
  cell_id: string;
  tenant_id: string | null;
  from_state: CellState | null;
  to_state: CellState;
  reason: string | null;
  timestamp_ms: number;
}

export interface FrictionHistoryEntry {
  id: string;
  cell_id: string;
  tenant_id: string | null;
  friction: number;
  timestamp_ms: number;
  reason: string | null;
}

export interface AuditLogEntry {
  id: string;
  type: string;
  tenant_id: string | null;
  cell_id: string | null;
  timestamp_ms: number;
  details_json: string;
}

// GPP Payload (Genesis Payload Protocol)
export interface GPPPayload {
  workflow?: string;
  type: string;
  retention: RetentionType;
  intent?: string;
  events?: GPPEvent[];
  tenant_id?: string;
}

export interface GPPEvent {
  action: string;
  target?: string;
  value?: unknown;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp_ms: number;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    timestamp_ms: number;
    version: string;
  };
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Metrics
export interface RuntimeMetrics {
  total_cells: number;
  counts_by_state: Record<CellState, number>;
  avg_friction: number;
  uptime_ms: number;
  wasm_executions_total: number;
  wasm_executions_last_hour: number;
  avg_execution_time_ms: number;
  memory_usage_mb: number;
  active_scripts: number;
  status: 'online' | 'offline';
  last_updated_ms: number;
}

export interface TrendPoint {
  timestamp_ms: number;
  executions: number;
  cells_created: number;
  avg_friction: number;
  avg_time_ms: number;
  memory_mb: number;
}

// Log entry format (for /log endpoint)
export interface LogEntry {
  id: string;
  type: string;
  cell_id: string | null;
  timestamp_ms: number;
  details?: {
    from_state?: string;
    to_state?: string;
    reason?: string;
    message?: string;
    friction_at_transition?: number;
  };
}
