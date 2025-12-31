import { ParsedCode, ParsedCommand, ValidationIssue } from '@/types/vibecode';

export function parseVibeCode(code: string): ParsedCode {
  const lines = code.split('\n');
  const result: ParsedCode = {
    workflowName: null,
    type: null,
    retention: null,
    events: [],
    errors: [],
  };

  let currentEvent: { name: string; line: number; commands: ParsedCommand[] } | null = null;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNum = i + 1;

    if (!line || line.startsWith('//')) continue;

    // Parse workflow declaration
    const workflowMatch = line.match(/^workflow\s+(\w+)/);
    if (workflowMatch) {
      result.workflowName = workflowMatch[1];
      continue;
    }

    // Parse type declaration
    const typeMatch = line.match(/^type\s+(\w+)/);
    if (typeMatch) {
      result.type = typeMatch[1];
      continue;
    }

    // Parse retention declaration
    const retentionMatch = line.match(/^retention\s+(\w+)/);
    if (retentionMatch) {
      result.retention = retentionMatch[1];
      continue;
    }

    // Parse event block start
    const eventMatch = line.match(/^on\s+(\w+)\s*\{?/);
    if (eventMatch) {
      currentEvent = { name: eventMatch[1], line: lineNum, commands: [] };
      if (line.includes('{')) braceDepth++;
      continue;
    }

    // Track braces
    if (line === '{') {
      braceDepth++;
      continue;
    }

    if (line === '}' || line.endsWith('}')) {
      braceDepth--;
      if (currentEvent && braceDepth === 0) {
        result.events.push(currentEvent);
        currentEvent = null;
      }
      continue;
    }

    // Parse commands inside event blocks
    if (currentEvent) {
      const command = parseCommand(line, lineNum);
      if (command) {
        currentEvent.commands.push(command);
      }
    }
  }

  // Check for unclosed braces
  if (braceDepth !== 0) {
    result.errors.push({
      level: 'error',
      ruleId: 'RULE_SYNTAX_ERROR',
      message: 'Chaves não balanceadas - verifique { e }',
      line: lines.length,
    });
  }

  return result;
}

function parseCommand(line: string, lineNum: number): ParsedCommand | null {
  // Parse: set state = VALUE
  const setStateMatch = line.match(/^set\s+state\s*=\s*(\w+)/);
  if (setStateMatch) {
    return { action: 'set', target: 'state', value: setStateMatch[1], line: lineNum };
  }

  // Parse: set friction = NUMBER
  const setFrictionMatch = line.match(/^set\s+friction\s*=\s*(\d+)/);
  if (setFrictionMatch) {
    return { action: 'set', target: 'friction', value: parseInt(setFrictionMatch[1]), line: lineNum };
  }

  // Parse: increase friction by NUMBER
  const increaseFrictionMatch = line.match(/^increase\s+friction\s+by\s+(\d+)/);
  if (increaseFrictionMatch) {
    return { action: 'increase', target: 'friction', value: parseInt(increaseFrictionMatch[1]), line: lineNum };
  }

  // Unknown command
  if (line.length > 0 && !line.startsWith('//')) {
    return { action: 'unknown', value: line, line: lineNum };
  }

  return null;
}
