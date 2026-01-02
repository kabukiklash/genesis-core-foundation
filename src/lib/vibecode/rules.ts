import { VibeRule } from '@/types/vibecode';

export const VALID_STATES = ['CANDIDATE', 'RUNNING', 'COOLING', 'DONE', 'ERROR'] as const;
export const VALID_RETENTIONS = ['EPHEMERAL', 'LONG'] as const;
export const VALID_COMMANDS = ['set', 'increase'] as const;
export const FORBIDDEN_KEYWORDS = ['execute', 'run', 'trigger', 'call', 'if', 'loop', 'while', 'for', 'await', 'async'] as const;

export const PER_RULES: VibeRule[] = [
  {
    id: 'RULE_REQUIRED_TYPE',
    name: 'Tipo Obrigatório',
    description: 'Todo workflow deve declarar um tipo com "type NOME"',
    example: 'type ORDER',
  },
  {
    id: 'RULE_REQUIRED_RETENTION',
    name: 'Retenção Obrigatória',
    description: 'Todo workflow deve declarar retenção: EPHEMERAL ou LONG',
    example: 'retention LONG',
  },
  {
    id: 'RULE_INVALID_STATE',
    name: 'Estado Válido',
    description: 'Estados permitidos: CANDIDATE, RUNNING, COOLING, DONE, ERROR',
    example: 'set state = RUNNING',
  },
  {
    id: 'RULE_INVALID_RETENTION',
    name: 'Retenção Válida',
    description: 'Apenas EPHEMERAL ou LONG são aceitos',
    example: 'retention EPHEMERAL',
  },
  {
    id: 'RULE_INVALID_COMMAND',
    name: 'Comando Válido',
    description: 'Apenas: set state, set friction, increase friction',
    example: 'increase friction by 10',
  },
  {
    id: 'RULE_SYNTAX_ERROR',
    name: 'Sintaxe Correta',
    description: 'Chaves balanceadas e estrutura correta',
    example: 'on EVENT { ... }',
  },
  {
    id: 'RULE_PASSIVE_ONLY',
    name: 'Apenas Passivo',
    description: 'Proibido: execute, run, trigger, call, if, loops',
    example: '// Sem lógica ativa',
  },
  {
    id: 'RULE_FRICTION_RANGE',
    name: 'Fricção 0-100',
    description: 'Valor de fricção deve estar entre 0 e 100',
    example: 'set friction = 50',
  },
];
