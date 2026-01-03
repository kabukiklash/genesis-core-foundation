// GenesisCore API Service
// Hybrid: Uses mock data now, prepared for real API integration
//
// IMPORTANT: VITE_GENESIS_API_URL should include "/v1" suffix
// Example: http://localhost:3000/v1
// Client paths are relative (without /v1 prefix)

import type {
  GenesisCell,
  StateTransition,
  RuntimeMetrics,
  RuntimeTrend,
  CellFilters,
  ApiResponse,
} from '@/types/genesis';

import {
  mockCells,
  mockTransitions,
  mockRuntimeMetrics,
  mockRuntimeTrends,
} from './mockData';

// Simulate network delay for realistic behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Configuration - ready for real endpoints
// VITE_GENESIS_API_URL must include /v1 (e.g., http://localhost:3000/v1)
// Set VITE_GENESIS_USE_MOCK=false to use real API
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_GENESIS_API_URL || '',
  useMock: import.meta.env.VITE_GENESIS_USE_MOCK !== 'false', // Default: mock enabled
  mockDelay: 300,
};

// ===========================================
// GenesisCells API
// Endpoints: GET /cells, GET /cells/:id
// ===========================================

export async function fetchCells(filters?: CellFilters): Promise<GenesisCell[]> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    
    let cells = [...mockCells];
    
    if (filters?.state?.length) {
      cells = cells.filter(c => filters.state!.includes(c.state));
    }
    if (filters?.retention?.length) {
      cells = cells.filter(c => filters.retention!.includes(c.retention));
    }
    if (filters?.friction_min !== undefined) {
      cells = cells.filter(c => c.friction >= filters.friction_min!);
    }
    if (filters?.friction_max !== undefined) {
      cells = cells.filter(c => c.friction <= filters.friction_max!);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      cells = cells.filter(c => 
        c.id.toLowerCase().includes(search) ||
        c.intent?.toLowerCase().includes(search)
      );
    }
    
    return cells;
  }
  
  // Real API: GET /cells (baseUrl already includes /v1)
  const params = new URLSearchParams();
  if (filters?.state?.length) params.set('state', filters.state.join(','));
  if (filters?.retention?.length) params.set('retention', filters.retention.join(','));
  
  const response = await fetch(`${API_CONFIG.baseUrl}/cells?${params}`);
  const data: ApiResponse<GenesisCell[]> = await response.json();
  return data.data;
}

export async function fetchCell(id: string): Promise<GenesisCell | null> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return mockCells.find(c => c.id === id) || null;
  }
  
  // Real API: GET /cells/:id
  const response = await fetch(`${API_CONFIG.baseUrl}/cells/${id}`);
  if (!response.ok) return null;
  const data: ApiResponse<GenesisCell> = await response.json();
  return data.data;
}

// ===========================================
// State History API
// Endpoints: GET /cells/:id/history, GET /log
// ===========================================

export async function fetchCellHistory(cellId: string): Promise<StateTransition[]> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return mockTransitions
      .filter(t => t.cell_id === cellId)
      .sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  }
  
  // Real API: GET /cells/:id/history
  const response = await fetch(`${API_CONFIG.baseUrl}/cells/${cellId}/history`);
  const data: ApiResponse<StateTransition[]> = await response.json();
  return data.data;
}

// LogEntry interface for /log endpoint response
interface LogEntry {
  id: string;
  type: string;
  cell_id: string;
  timestamp_ms: number;
  details?: {
    from_state?: string;
    to_state?: string;
    reason?: string;
    message?: string;
    friction_at_transition?: number;
  };
}

export async function fetchRecentTransitions(limit: number = 20): Promise<StateTransition[]> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return [...mockTransitions]
      .sort((a, b) => b.timestamp_ms - a.timestamp_ms)
      .slice(0, limit);
  }
  
  // Real API: GET /log?type=state_changed&per_page={limit}&page=1
  // Maps LogEntry to StateTransition for UI compatibility
  const response = await fetch(
    `${API_CONFIG.baseUrl}/log?type=state_changed&per_page=${limit}&page=1`
  );
  const data: ApiResponse<LogEntry[]> = await response.json();
  
  // Map LogEntry to StateTransition (best-effort mapping)
  return data.data.map((entry): StateTransition => ({
    id: entry.id || `${entry.cell_id}-${entry.timestamp_ms}`,
    cell_id: entry.cell_id,
    from_state: (entry.details?.from_state as StateTransition['from_state']) || null,
    to_state: (entry.details?.to_state as StateTransition['to_state']) || 'RUNNING',
    friction_at_transition: entry.details?.friction_at_transition ?? 0,
    timestamp_ms: entry.timestamp_ms,
  }));
}

// ===========================================
// Runtime Metrics API
// Endpoints: GET /metrics, GET /metrics/trends
// ===========================================

export async function fetchRuntimeMetrics(): Promise<RuntimeMetrics> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return { ...mockRuntimeMetrics, last_updated_ms: Date.now() };
  }
  
  // Real API: GET /metrics
  const response = await fetch(`${API_CONFIG.baseUrl}/metrics`);
  const data: ApiResponse<RuntimeMetrics> = await response.json();
  return data.data;
}

export async function fetchRuntimeTrends(hours: number = 24): Promise<RuntimeTrend[]> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return mockRuntimeTrends.slice(-hours);
  }
  
  // Real API: GET /metrics/trends?hours={hours}
  const response = await fetch(`${API_CONFIG.baseUrl}/metrics/trends?hours=${hours}`);
  const data: ApiResponse<RuntimeTrend[]> = await response.json();
  return data.data;
}
