// GenesisCore API Service
// Hybrid: Uses mock data now, prepared for real API integration

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
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_GENESIS_API_URL || '',
  useMock: true, // Toggle for real API
  mockDelay: 300,
};

// ===========================================
// GenesisCells API
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
  
  // Real API call (future)
  const params = new URLSearchParams();
  if (filters?.state?.length) params.set('state', filters.state.join(','));
  if (filters?.retention?.length) params.set('retention', filters.retention.join(','));
  
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/memory/cells?${params}`);
  const data: ApiResponse<GenesisCell[]> = await response.json();
  return data.data;
}

export async function fetchCell(id: string): Promise<GenesisCell | null> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return mockCells.find(c => c.id === id) || null;
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/memory/cells/${id}`);
  if (!response.ok) return null;
  const data: ApiResponse<GenesisCell> = await response.json();
  return data.data;
}

// ===========================================
// State History API
// ===========================================

export async function fetchCellHistory(cellId: string): Promise<StateTransition[]> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return mockTransitions
      .filter(t => t.cell_id === cellId)
      .sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/memory/cells/${cellId}/history`);
  const data: ApiResponse<StateTransition[]> = await response.json();
  return data.data;
}

export async function fetchRecentTransitions(limit: number = 20): Promise<StateTransition[]> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return [...mockTransitions]
      .sort((a, b) => b.timestamp_ms - a.timestamp_ms)
      .slice(0, limit);
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/memory/history?limit=${limit}`);
  const data: ApiResponse<StateTransition[]> = await response.json();
  return data.data;
}

// ===========================================
// Runtime Metrics API
// ===========================================

export async function fetchRuntimeMetrics(): Promise<RuntimeMetrics> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return { ...mockRuntimeMetrics, last_updated_ms: Date.now() };
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/runtime/metrics`);
  const data: ApiResponse<RuntimeMetrics> = await response.json();
  return data.data;
}

export async function fetchRuntimeTrends(hours: number = 24): Promise<RuntimeTrend[]> {
  if (API_CONFIG.useMock) {
    await delay(API_CONFIG.mockDelay);
    return mockRuntimeTrends.slice(-hours);
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/runtime/trends?hours=${hours}`);
  const data: ApiResponse<RuntimeTrend[]> = await response.json();
  return data.data;
}
