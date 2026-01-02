/**
 * AI Module for VibeCode Framework
 * 
 * Implements the flow: .intent → VibeCode → PER validation → GPP
 * 
 * This module is part of the Framework layer (not Core).
 * It handles AI-powered code generation while maintaining
 * the separation of concerns defined in BOUNDARY_CONTRACT.md
 */

import { parseVibeCode } from './parser';
import { validateParsedCode } from './validator';
import { simulateCell } from './simulator';
import { ValidationResult, ValidationIssue, SimulatedCell } from '@/types/vibecode';

export interface GPPPayload {
  workflow: string;
  type: string;
  retention: 'EPHEMERAL' | 'LONG';
  payload?: Record<string, unknown>;
  events: Array<{
    name: string;
    commands: Array<{
      action: 'set' | 'increase';
      target: 'state' | 'friction';
      value: string | number;
    }>;
  }>;
}

export interface AIGenerationResult {
  success: boolean;
  code: string;
  validation: ValidationResult;
  gpp: GPPPayload | null;
  error?: string;
}

/**
 * Mock AI generation for development.
 * In production, this would call the Lovable AI Gateway.
 */
export async function generateVibeCodeFromIntent(intent: string): Promise<AIGenerationResult> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate VibeCode based on intent keywords
  const code = generateMockVibeCode(intent);
  
  // Validate generated code
  const validation = validateVibeCode(code);
  
  // Convert to GPP if valid
  const gpp = validation.status !== 'ERROR' ? convertToGPP(code) : null;

  return {
    success: validation.status !== 'ERROR',
    code,
    validation,
    gpp,
    error: validation.status === 'ERROR' 
      ? `Validation failed with ${validation.issues.filter(i => i.level === 'error').length} errors` 
      : undefined,
  };
}

/**
 * Validate VibeCode and return comprehensive result
 */
export function validateVibeCode(code: string): ValidationResult {
  const parsed = parseVibeCode(code);
  const issues = validateParsedCode(parsed, code);
  const simulatedCell = simulateCell(parsed);
  
  // Generate simulated log
  const simulatedLog = parsed.events.map((event, i) => ({
    event_type: event.name,
    timestamp: new Date(Date.now() + i * 1000).toISOString(),
  }));

  const status = issues.some(i => i.level === 'error') 
    ? 'ERROR' 
    : issues.some(i => i.level === 'warning') 
      ? 'WARNING' 
      : 'VALID';

  return {
    status,
    issues,
    simulatedCell,
    simulatedLog,
  };
}

/**
 * Convert validated VibeCode to GPP payload for GenesisCore
 */
export function convertToGPP(code: string): GPPPayload | null {
  const parsed = parseVibeCode(code);
  
  if (!parsed.workflowName || !parsed.type || !parsed.retention) {
    return null;
  }

  return {
    workflow: parsed.workflowName,
    type: parsed.type,
    retention: parsed.retention as 'EPHEMERAL' | 'LONG',
    events: parsed.events.map(event => ({
      name: event.name,
      commands: event.commands
        .filter(cmd => cmd.action !== 'unknown')
        .map(cmd => ({
          action: cmd.action as 'set' | 'increase',
          target: cmd.target as 'state' | 'friction',
          value: cmd.value as string | number,
        })),
    })),
  };
}

/**
 * Send GPP payload to GenesisCore API
 * This is the only point of communication between Framework and Core
 */
export async function sendToGenesisCore(gpp: GPPPayload): Promise<{ success: boolean; cellId?: string; error?: string }> {
  // In production, this would POST to /v1/gpp/ingest
  // For now, we simulate the API response
  
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate successful ingestion
  const mockCellId = `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[GenesisCore API] GPP ingested:', gpp);
  console.log('[GenesisCore API] Cell created:', mockCellId);
  
  return {
    success: true,
    cellId: mockCellId,
  };
}

/**
 * Preview workflow without persisting (calls /v1/workflows/preview)
 */
export async function previewWorkflow(code: string): Promise<ValidationResult> {
  // In production, this would POST to /v1/workflows/preview
  // For now, we validate locally
  return validateVibeCode(code);
}

// ============================================
// Mock Code Generation (Development Only)
// ============================================

function generateMockVibeCode(intent: string): string {
  const lowerIntent = intent.toLowerCase();
  
  // Determine workflow name from intent
  let workflowName = 'GeneratedWorkflow';
  let type = 'ENTITY';
  let retention: 'EPHEMERAL' | 'LONG' = 'LONG';
  
  // Extract context from intent
  if (lowerIntent.includes('pedido') || lowerIntent.includes('order')) {
    workflowName = 'OrderProcessing';
    type = 'ORDER';
    retention = 'LONG';
  } else if (lowerIntent.includes('ticket') || lowerIntent.includes('suporte')) {
    workflowName = 'SupportTicket';
    type = 'TICKET';
    retention = 'LONG';
  } else if (lowerIntent.includes('usuário') || lowerIntent.includes('user') || lowerIntent.includes('onboarding')) {
    workflowName = 'UserOnboarding';
    type = 'USER';
    retention = 'LONG';
  } else if (lowerIntent.includes('transação') || lowerIntent.includes('transaction') || lowerIntent.includes('financ')) {
    workflowName = 'FinancialTransaction';
    type = 'TRANSACTION';
    retention = 'LONG';
  } else if (lowerIntent.includes('sessão') || lowerIntent.includes('session') || lowerIntent.includes('temporár')) {
    workflowName = 'SessionTracking';
    type = 'SESSION';
    retention = 'EPHEMERAL';
  }

  // Generate events based on type
  const events = generateEventsForType(type, retention);
  
  return `workflow ${workflowName}

type ${type}
retention ${retention}

${events}`;
}

function generateEventsForType(type: string, retention: 'EPHEMERAL' | 'LONG'): string {
  const eventTemplates: Record<string, string> = {
    ORDER: `on CREATED {
  set state = CANDIDATE
  set friction = 5
}

on PROCESSING_STARTED {
  set state = RUNNING
  increase friction by 15
}

on SHIPPED {
  set state = COOLING
  set friction = 30
}

on DELIVERED {
  set state = DONE
}

on CANCELLED {
  set state = ERROR
  set friction = 80
}`,

    TICKET: `on OPENED {
  set state = CANDIDATE
  set friction = 10
}

on ASSIGNED {
  set state = RUNNING
  increase friction by 5
}

on IN_PROGRESS {
  increase friction by 10
}

on RESOLVED {
  set state = COOLING
}

on CLOSED {
  set state = DONE
}`,

    USER: `on SIGNUP_STARTED {
  set state = CANDIDATE
  set friction = 0
}

on EMAIL_VERIFIED {
  set state = RUNNING
  increase friction by 10
}

on PROFILE_COMPLETED {
  increase friction by 15
}

on ONBOARDING_FINISHED {
  set state = DONE
  set friction = 25
}`,

    TRANSACTION: `on INITIATED {
  set state = CANDIDATE
  set friction = 5
}

on PROCESSING {
  set state = RUNNING
  increase friction by 20
}

on PENDING_APPROVAL {
  set state = COOLING
  increase friction by 10
}

on COMPLETED {
  set state = DONE
}

on FAILED {
  set state = ERROR
  set friction = 100
}`,

    SESSION: `on STARTED {
  set state = RUNNING
  set friction = 0
}

on ACTIVITY_DETECTED {
  increase friction by 5
}

on IDLE {
  set state = COOLING
}

on ENDED {
  set state = DONE
}`,

    ENTITY: `on CREATED {
  set state = CANDIDATE
  set friction = 0
}

on ACTIVATED {
  set state = RUNNING
  increase friction by 10
}

on COMPLETED {
  set state = DONE
}`,
  };

  return eventTemplates[type] || eventTemplates.ENTITY;
}
