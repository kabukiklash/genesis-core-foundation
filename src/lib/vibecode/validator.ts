import { ParsedCode, ValidationIssue } from '@/types/vibecode';
import { VALID_STATES, VALID_RETENTIONS, FORBIDDEN_KEYWORDS } from './rules';

export function validateParsedCode(parsed: ParsedCode, rawCode: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [...parsed.errors];

  // RULE_REQUIRED_TYPE
  if (!parsed.type) {
    issues.push({
      level: 'error',
      ruleId: 'RULE_REQUIRED_TYPE',
      message: 'Declaração "type" é obrigatória (ex: type ORDER)',
      line: 1,
    });
  }

  // RULE_REQUIRED_RETENTION
  if (!parsed.retention) {
    issues.push({
      level: 'error',
      ruleId: 'RULE_REQUIRED_RETENTION',
      message: 'Declaração "retention" é obrigatória (EPHEMERAL ou LONG)',
      line: 1,
    });
  }

  // RULE_INVALID_RETENTION
  if (parsed.retention && !VALID_RETENTIONS.includes(parsed.retention as any)) {
    const lines = rawCode.split('\n');
    const retentionLine = lines.findIndex(l => l.trim().startsWith('retention')) + 1;
    issues.push({
      level: 'error',
      ruleId: 'RULE_INVALID_RETENTION',
      message: `Retenção inválida: "${parsed.retention}". Use EPHEMERAL ou LONG`,
      line: retentionLine || 1,
    });
  }

  // Validate commands in events
  for (const event of parsed.events) {
    for (const cmd of event.commands) {
      // RULE_INVALID_STATE
      if (cmd.action === 'set' && cmd.target === 'state') {
        if (!VALID_STATES.includes(cmd.value as any)) {
          issues.push({
            level: 'error',
            ruleId: 'RULE_INVALID_STATE',
            message: `Estado inválido: "${cmd.value}". Use: ${VALID_STATES.join(', ')}`,
            line: cmd.line,
          });
        }
      }

      // RULE_FRICTION_RANGE
      if (cmd.target === 'friction' && typeof cmd.value === 'number') {
        if (cmd.value < 0 || cmd.value > 100) {
          issues.push({
            level: 'error',
            ruleId: 'RULE_FRICTION_RANGE',
            message: `Fricção fora do intervalo: ${cmd.value}. Deve ser 0-100`,
            line: cmd.line,
          });
        }
      }

      // RULE_INVALID_COMMAND
      if (cmd.action === 'unknown') {
        issues.push({
          level: 'error',
          ruleId: 'RULE_INVALID_COMMAND',
          message: `Comando não reconhecido: "${cmd.value}"`,
          line: cmd.line,
        });
      }
    }
  }

  // RULE_PASSIVE_ONLY - check for forbidden keywords
  const lines = rawCode.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    for (const keyword of FORBIDDEN_KEYWORDS) {
      if (line.includes(keyword)) {
        issues.push({
          level: 'error',
          ruleId: 'RULE_PASSIVE_ONLY',
          message: `Palavra-chave proibida: "${keyword}". Fase 3 é passiva.`,
          line: i + 1,
        });
      }
    }
  }

  return issues;
}

export function getViolatedRules(issues: ValidationIssue[]): Set<string> {
  return new Set(issues.map(i => i.ruleId));
}
