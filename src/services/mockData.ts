// Mock Data Service for GenesisCore Dashboard
// Hybrid strategy: realistic mock data + prepared for real API

import type {
  GenesisCell,
  StateTransition,
  RuntimeMetrics,
  RuntimeTrend,
  CellState,
  RetentionType,
} from '@/types/genesis';

// Helper to generate realistic IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Generate timestamps relative to now
const now = Date.now();
const hour = 3600000;
const minute = 60000;

// Sample intents for realistic data
const sampleIntents = [
  'process_user_input',
  'validate_schema',
  'transform_data',
  'cache_invalidation',
  'sync_state',
  'compute_metrics',
  'aggregate_logs',
  'health_check',
  'cleanup_expired',
  'reindex_memory',
];

// Generate mock GenesisCells
export const mockCells: GenesisCell[] = [
  {
    id: 'cell_001',
    payload: { type: 'user_session', user_id: 'usr_abc123' },
    state: 'RUNNING',
    friction: 23,
    retention: 'EPHEMERAL',
    created_at_ms: now - 2 * hour,
    updated_at_ms: now - 5 * minute,
    version: 3,
    intent: 'process_user_input',
  },
  {
    id: 'cell_002',
    payload: { type: 'schema_validation', schema: 'v2.1' },
    state: 'DONE',
    friction: 78,
    retention: 'LONG',
    created_at_ms: now - 24 * hour,
    updated_at_ms: now - hour,
    version: 7,
    intent: 'validate_schema',
  },
  {
    id: 'cell_003',
    payload: { type: 'data_transform', records: 1542 },
    state: 'COOLING',
    friction: 45,
    retention: 'EPHEMERAL',
    created_at_ms: now - 30 * minute,
    updated_at_ms: now - 10 * minute,
    version: 2,
    intent: 'transform_data',
  },
  {
    id: 'cell_004',
    payload: { type: 'cache_op', keys: ['config', 'routes'] },
    state: 'CANDIDATE',
    friction: 12,
    retention: 'EPHEMERAL',
    created_at_ms: now - 5 * minute,
    updated_at_ms: now - 5 * minute,
    version: 1,
    intent: 'cache_invalidation',
  },
  {
    id: 'cell_005',
    payload: { type: 'error_recovery', error_code: 'E_TIMEOUT' },
    state: 'ERROR',
    friction: 92,
    retention: 'LONG',
    created_at_ms: now - 4 * hour,
    updated_at_ms: now - 2 * hour,
    version: 5,
    intent: 'sync_state',
  },
  {
    id: 'cell_006',
    payload: { type: 'metrics', source: 'runtime' },
    state: 'RUNNING',
    friction: 34,
    retention: 'LONG',
    created_at_ms: now - 12 * hour,
    updated_at_ms: now - minute,
    version: 42,
    intent: 'compute_metrics',
  },
  {
    id: 'cell_007',
    payload: { type: 'log_aggregation', window: '5m' },
    state: 'DONE',
    friction: 56,
    retention: 'EPHEMERAL',
    created_at_ms: now - 45 * minute,
    updated_at_ms: now - 20 * minute,
    version: 4,
    intent: 'aggregate_logs',
  },
  {
    id: 'cell_008',
    payload: { type: 'health', services: ['redis', 'wasm'] },
    state: 'RUNNING',
    friction: 8,
    retention: 'EPHEMERAL',
    created_at_ms: now - 10 * minute,
    updated_at_ms: now - minute,
    version: 15,
    intent: 'health_check',
  },
];

// Generate mock state transitions for timeline
export const mockTransitions: StateTransition[] = [
  {
    id: 'tr_001',
    cell_id: 'cell_001',
    from_state: null,
    to_state: 'CANDIDATE',
    friction_at_transition: 0,
    timestamp_ms: now - 2 * hour,
  },
  {
    id: 'tr_002',
    cell_id: 'cell_001',
    from_state: 'CANDIDATE',
    to_state: 'RUNNING',
    friction_at_transition: 15,
    timestamp_ms: now - 2 * hour + 5 * minute,
  },
  {
    id: 'tr_003',
    cell_id: 'cell_002',
    from_state: null,
    to_state: 'CANDIDATE',
    friction_at_transition: 0,
    timestamp_ms: now - 24 * hour,
  },
  {
    id: 'tr_004',
    cell_id: 'cell_002',
    from_state: 'CANDIDATE',
    to_state: 'RUNNING',
    friction_at_transition: 22,
    timestamp_ms: now - 23 * hour,
  },
  {
    id: 'tr_005',
    cell_id: 'cell_002',
    from_state: 'RUNNING',
    to_state: 'COOLING',
    friction_at_transition: 55,
    timestamp_ms: now - 3 * hour,
  },
  {
    id: 'tr_006',
    cell_id: 'cell_002',
    from_state: 'COOLING',
    to_state: 'DONE',
    friction_at_transition: 78,
    timestamp_ms: now - hour,
  },
  {
    id: 'tr_007',
    cell_id: 'cell_005',
    from_state: 'RUNNING',
    to_state: 'ERROR',
    friction_at_transition: 92,
    timestamp_ms: now - 2 * hour,
  },
  {
    id: 'tr_008',
    cell_id: 'cell_003',
    from_state: 'RUNNING',
    to_state: 'COOLING',
    friction_at_transition: 45,
    timestamp_ms: now - 10 * minute,
  },
];

// Mock runtime metrics
export const mockRuntimeMetrics: RuntimeMetrics = {
  wasm_executions_total: 12847,
  wasm_executions_last_hour: 342,
  avg_execution_time_ms: 23.5,
  memory_usage_mb: 128.4,
  active_scripts: 5,
  uptime_seconds: 86400 * 3 + 7200, // 3 days 2 hours
  status: 'online',
  last_updated_ms: now,
};

// Mock runtime trends (last 24 hours, hourly)
export const mockRuntimeTrends: RuntimeTrend[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp_ms: now - (23 - i) * hour,
  executions: Math.floor(250 + Math.random() * 200),
  avg_time_ms: 18 + Math.random() * 15,
  memory_mb: 100 + Math.random() * 50,
}));

// State statistics helper
export const getStateStats = () => {
  const stats: Record<CellState, number> = {
    CANDIDATE: 0,
    RUNNING: 0,
    COOLING: 0,
    DONE: 0,
    ERROR: 0,
  };
  
  mockCells.forEach(cell => {
    stats[cell.state]++;
  });
  
  return stats;
};

// Friction distribution helper
export const getFrictionDistribution = () => {
  const distribution = { low: 0, medium: 0, high: 0 };
  
  mockCells.forEach(cell => {
    if (cell.friction <= 33) distribution.low++;
    else if (cell.friction <= 66) distribution.medium++;
    else distribution.high++;
  });
  
  return distribution;
};
