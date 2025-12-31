import { ParsedCode, SimulatedCell } from '@/types/vibecode';
import { CellState } from '@/types/genesis';

export function simulateCell(parsed: ParsedCode): SimulatedCell | null {
  if (!parsed.type || !parsed.retention) {
    return null;
  }

  const retention = parsed.retention as 'EPHEMERAL' | 'LONG';
  let currentState: CellState = 'CANDIDATE';
  let currentFriction = 0;

  const timeline: SimulatedCell['timeline'] = [];

  // Simulate each event in order
  for (const event of parsed.events) {
    for (const cmd of event.commands) {
      if (cmd.action === 'set' && cmd.target === 'state') {
        currentState = cmd.value as CellState;
      }
      if (cmd.action === 'set' && cmd.target === 'friction') {
        currentFriction = cmd.value as number;
      }
      if (cmd.action === 'increase' && cmd.target === 'friction') {
        currentFriction = Math.min(100, currentFriction + (cmd.value as number));
      }
    }

    timeline.push({
      event: event.name,
      state: currentState,
      friction: currentFriction,
    });
  }

  return {
    cell_id: `mock-${Date.now().toString(36)}`,
    type: parsed.type,
    state: currentState,
    friction: currentFriction,
    retention,
    timeline,
  };
}

export function generateSimulatedLog(parsed: ParsedCode): Array<{ event_type: string; timestamp: string }> {
  const logs: Array<{ event_type: string; timestamp: string }> = [];
  const baseTime = Date.now();

  if (parsed.workflowName) {
    logs.push({
      event_type: `WORKFLOW_REGISTERED: ${parsed.workflowName}`,
      timestamp: new Date(baseTime).toISOString(),
    });
  }

  for (let i = 0; i < parsed.events.length; i++) {
    const event = parsed.events[i];
    logs.push({
      event_type: `EVENT_PROCESSED: ${event.name}`,
      timestamp: new Date(baseTime + (i + 1) * 1000).toISOString(),
    });
  }

  return logs;
}
