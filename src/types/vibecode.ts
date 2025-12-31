import { CellState } from './genesis';

export type ValidationStatus = 'VALID' | 'WARNING' | 'ERROR';
export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  ruleId: string;
  message: string;
  line: number;
  column?: number;
}

export interface SimulatedCell {
  cell_id: string;
  type: string;
  state: CellState;
  friction: number;
  retention: 'EPHEMERAL' | 'LONG';
  timeline: Array<{
    event: string;
    state: CellState;
    friction?: number;
  }>;
}

export interface ValidationResult {
  status: ValidationStatus;
  issues: ValidationIssue[];
  simulatedCell: SimulatedCell | null;
  simulatedLog: Array<{
    event_type: string;
    timestamp: string;
  }>;
}

export interface VibeRule {
  id: string;
  name: string;
  description: string;
  example: string;
}

export interface ParsedBlock {
  type: 'workflow' | 'type' | 'retention' | 'event';
  name?: string;
  value?: string;
  line: number;
  commands?: ParsedCommand[];
}

export interface ParsedCommand {
  action: string;
  target?: string;
  value?: string | number;
  line: number;
}

export interface ParsedCode {
  workflowName: string | null;
  type: string | null;
  retention: string | null;
  events: Array<{
    name: string;
    line: number;
    commands: ParsedCommand[];
  }>;
  errors: ValidationIssue[];
}
