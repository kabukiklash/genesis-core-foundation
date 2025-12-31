// GenesisCore Data Contracts - Aligned with ADR-003
// Read-only types for Dashboard de Observabilidade

export type CellState = 'CANDIDATE' | 'RUNNING' | 'COOLING' | 'DONE' | 'ERROR';

export type RetentionType = 'EPHEMERAL' | 'LONG';

export interface GenesisCell {
  id: string;
  payload: unknown;
  state: CellState;
  friction: number; // 0-100
  retention: RetentionType;
  created_at_ms: number;
  updated_at_ms: number;
  version: number;
  intent?: string;
}

export interface StateTransition {
  id: string;
  cell_id: string;
  from_state: CellState | null;
  to_state: CellState;
  friction_at_transition: number;
  timestamp_ms: number;
}

export interface RuntimeMetrics {
  wasm_executions_total: number;
  wasm_executions_last_hour: number;
  avg_execution_time_ms: number;
  memory_usage_mb: number;
  active_scripts: number;
  uptime_seconds: number;
  status: 'online' | 'offline';
  last_updated_ms: number;
}

export interface RuntimeTrend {
  timestamp_ms: number;
  executions: number;
  avg_time_ms: number;
  memory_mb: number;
}

export interface CellHistory {
  cell_id: string;
  transitions: StateTransition[];
}

// API Response types (prepared for future REST integration)
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp_ms: number;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Filter types
export interface CellFilters {
  state?: CellState[];
  retention?: RetentionType[];
  friction_min?: number;
  friction_max?: number;
  search?: string;
}
