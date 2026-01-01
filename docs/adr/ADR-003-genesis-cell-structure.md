# ADR-003: Estrutura da GenesisCell

> **Status**: Aceito  
> **Data**: 2026-01-01  
> **Decisores**: Equipe GenesisCore  
> **Categorias**: Data Model, Core

---

## Contexto

O GenesisCore precisa de uma unidade básica de memória que:
- Armazene dados de forma estruturada
- Registre estado e histórico
- Meça "dificuldade" (fricção)
- Suporte diferentes políticas de retenção
- Seja auditável e versionada

---

## Decisão

Definimos a **GenesisCell** como a unidade fundamental de memória do GenesisCore.

---

## Estrutura da GenesisCell

```typescript
interface GenesisCell {
  // Identificação
  id: string;              // UUID único
  
  // Dados
  payload: unknown;        // Conteúdo arbitrário (JSON)
  
  // Estado
  state: CellState;        // CANDIDATE | RUNNING | COOLING | DONE | ERROR
  
  // Métricas
  friction: number;        // 0-100 (dificuldade/instabilidade)
  
  // Política
  retention: RetentionType; // EPHEMERAL | LONG
  
  // Metadados
  created_at_ms: number;   // Timestamp de criação
  updated_at_ms: number;   // Timestamp de última atualização
  version: number;         // Versão para optimistic locking
  
  // Opcional
  intent?: string;         // Descrição semântica do propósito
}
```

---

## Estados (CellState)

```
┌─────────────┐
│  CANDIDATE  │  Estado inicial - aguardando processamento
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   RUNNING   │  Em processamento ativo
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   COOLING   │  Processamento concluído, aguardando consolidação
└──────┬──────┘
       │
       ├───────────────────┐
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│    DONE     │     │    ERROR    │
└─────────────┘     └─────────────┘
  Sucesso final      Falha registrada
```

### Semântica dos Estados

| Estado | Significado | Fricção Típica |
|--------|-------------|----------------|
| CANDIDATE | Novo, aguardando | 0-20 |
| RUNNING | Em processamento | 10-50 |
| COOLING | Finalizando | 20-60 |
| DONE | Concluído com sucesso | Qualquer |
| ERROR | Falha registrada | 50-100 |

---

## Fricção

### Definição

> Fricção é o registro de dificuldade recorrente: instabilidade, lentidão, inconsistência.

### Características

- **Range**: 0 a 100
- **Passiva**: Apenas registrada, não dispara ações
- **Qualitativa**: Representa "esforço" ou "resistência"
- **Acumulável**: Pode aumentar ao longo do tempo

### Exemplos

| Cenário | Fricção |
|---------|---------|
| Processamento normal | 5-15 |
| Retry necessário | +20 |
| Timeout parcial | +30 |
| Falha recuperável | +40 |
| Múltiplas falhas | 80-100 |

---

## Retention

### EPHEMERAL

- Dados temporários
- Podem ser limpos após período
- Ideal para: cache, sessões, dados transitórios

### LONG

- Dados persistentes
- Mantidos indefinidamente
- Ideal para: registros, histórico, auditoria

---

## Justificativa

### 1. Simplicidade

A estrutura é mínima mas completa:
- Identificação única
- Payload flexível
- Estado discreto
- Métrica contínua (fricção)
- Política clara

### 2. Auditabilidade

- `version` permite optimistic locking
- Timestamps permitem ordenação temporal
- Estados são discretos e rastreáveis

### 3. Extensibilidade

- `payload` aceita qualquer JSON
- `intent` é opcional para contexto semântico
- Novos campos podem ser adicionados sem breaking changes

### 4. Passividade

A GenesisCell é **memória passiva**:
- Não reage a mudanças
- Não dispara eventos automaticamente
- Apenas armazena e disponibiliza dados

---

## Transições de Estado

As transições são registradas em tabela separada:

```typescript
interface StateTransition {
  id: string;
  cell_id: string;
  from_state: CellState | null;  // null para criação
  to_state: CellState;
  friction_at_transition: number;
  timestamp_ms: number;
}
```

Isso permite:
- Histórico completo
- Auditoria temporal
- Análise de padrões (Fase 4+)

---

## Consequências

### Positivas

1. Modelo simples e compreensível
2. Fácil de persistir (PostgreSQL, JSON)
3. Suporta evolução gradual
4. Auditoria nativa

### Negativas

1. Payload sem schema (flexibilidade vs. validação)
2. Fricção é numérica simples (pode precisar de dimensões no futuro)

### Mitigações

| Risco | Mitigação |
|-------|-----------|
| Payload sem validação | Validação na camada de aplicação |
| Fricção simplista | Extensível para múltiplas dimensões |

---

## Implementação

### TypeScript

```typescript
// src/types/genesis.ts
export type CellState = 'CANDIDATE' | 'RUNNING' | 'COOLING' | 'DONE' | 'ERROR';
export type RetentionType = 'EPHEMERAL' | 'LONG';

export interface GenesisCell {
  id: string;
  payload: unknown;
  state: CellState;
  friction: number;
  retention: RetentionType;
  created_at_ms: number;
  updated_at_ms: number;
  version: number;
  intent?: string;
}
```

### PostgreSQL

```sql
CREATE TYPE cell_state AS ENUM (
  'CANDIDATE', 'RUNNING', 'COOLING', 'DONE', 'ERROR'
);

CREATE TYPE retention_type AS ENUM (
  'EPHEMERAL', 'LONG'
);

CREATE TABLE genesis_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payload JSONB NOT NULL DEFAULT '{}',
  state cell_state NOT NULL DEFAULT 'CANDIDATE',
  friction INTEGER NOT NULL DEFAULT 0 CHECK (friction >= 0 AND friction <= 100),
  retention retention_type NOT NULL,
  created_at_ms BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at_ms BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  version INTEGER NOT NULL DEFAULT 1,
  intent TEXT
);
```

---

## Referências

- [ADR-001: Separation of Concerns](./ADR-001-separation-of-concerns.md)
- [ADR-002: Passive Execution Rules](./ADR-002-passive-execution-rules.md)
- [Boundary Contract](../BOUNDARY_CONTRACT.md)
