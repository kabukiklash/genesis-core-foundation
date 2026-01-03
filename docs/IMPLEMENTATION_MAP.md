# GenesisCore & VibeCode Framework - Mapa de Implementação

> **Versão**: 1.0.0  
> **Data**: 2026-01-02  
> **Status**: Fase 3 - Memória Passiva

---

## 📋 Sumário Executivo

Este documento mapeia todas as páginas, componentes, serviços e funcionalidades implementados no projeto GenesisCore Observatory e VibeCode Framework até a data atual.

---

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    GENESISCORE OBSERVATORY                       │
│                    (Dashboard Read-Only)                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                                                          │
│  ├── Dashboard (/)           - Visão geral do runtime           │
│  ├── GenesisCells (/cells)   - Lista de células                 │
│  ├── Cell Detail (/cells/:id) - Detalhes de célula              │
│  ├── Runtime (/runtime)      - Métricas WASM                    │
│  └── VibeCode (/vibecode)    - Framework DSL                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                              │
│  ├── genesisApi.ts          - API híbrida (mock + preparada)    │
│  └── mockData.ts            - Dados simulados                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 Páginas Implementadas

### 1. Dashboard (`/`)

**Arquivo**: `src/pages/DashboardPage.tsx`

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| Métricas de Runtime | ✅ | Cards com execuções WASM, tempo médio, memória, uptime |
| Resumo de Estados | ✅ | Contagem por estado (CANDIDATE, RUNNING, COOLING, DONE, ERROR) |
| Células Recentes | ✅ | Lista das 4 células mais recentes |
| Timeline Compacta | ✅ | Últimas 5 transições de estado |
| Auto-refresh | ✅ | Atualização a cada 30 segundos |

**Componentes utilizados**:
- `MetricCard` - Cards de métricas com ícones
- `CellCard` - Preview de GenesisCells
- `CompactTimeline` - Timeline resumida

---

### 2. GenesisCells (`/cells`)

**Arquivo**: `src/pages/CellsPage.tsx`

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| Listagem de Células | ✅ | Grid de todas as GenesisCells |
| Filtros por Estado | ✅ | Filtrar por CANDIDATE, RUNNING, etc. |
| Filtros por Retenção | ✅ | Filtrar por EPHEMERAL ou LONG |
| Busca por ID/Intent | ✅ | Campo de pesquisa textual |
| Navegação para Detalhes | ✅ | Click leva a `/cells/:id` |

---

### 3. Cell Detail (`/cells/:id`)

**Arquivo**: `src/pages/CellDetailPage.tsx`

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| Informações da Célula | ✅ | ID, intent, state, version |
| Gauge de Fricção | ✅ | Visualização 0-100 |
| Badge de Retenção | ✅ | EPHEMERAL ou LONG |
| Timestamps | ✅ | Criação e última atualização |
| Histórico de Estados | ✅ | Timeline completa de transições |

---

### 4. Runtime (`/runtime`)

**Arquivo**: `src/pages/RuntimePage.tsx`

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| Métricas WASM | ✅ | Total execuções, última hora, tempo médio |
| Uso de Memória | ✅ | MB utilizados |
| Scripts Ativos | ✅ | Contagem de scripts |
| Uptime | ✅ | Dias/horas/minutos |
| Gráfico de Tendências | ✅ | LineChart com execuções 24h (Recharts) |
| Status Indicator | ✅ | Online/Offline |

---

### 5. VibeCode Framework (`/vibecode`)

**Arquivo**: `src/pages/VibeCodePage.tsx`

| Funcionalidade | Status | Descrição |
|---------------|--------|-----------|
| Editor de Código DSL | ✅ | Syntax highlighting, números de linha |
| Validação PER em Tempo Real | ✅ | 8 regras validadas ao digitar |
| Painel de Regras | ✅ | Lista das 8 regras PER |
| Painel de Feedback | ✅ | Issues, preview de célula, log simulado |
| Layout Redimensionável | ✅ | 3 painéis com splitters (react-resizable-panels) |
| Painéis Ocultáveis | ✅ | Toggle para Rules e Feedback |
| Persistência de Layout | ✅ | LocalStorage |
| Geração por IA | ✅ | Intent → VibeCode (módulo simulado) |
| Painel de Aprovação | ✅ | Revisão humana antes de enviar ao Core |
| Envio para GenesisCore | ✅ | Conversão GPP e submit (simulado) |

---

## 🧩 Componentes Implementados

### Layout e Navegação

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `DashboardLayout` | `src/components/genesis/DashboardLayout.tsx` | Layout principal com header, nav, footer |
| `NavLink` | `src/components/NavLink.tsx` | Links de navegação estilizados |

### GenesisCore (Observabilidade)

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `MetricCard` | `src/components/genesis/MetricCard.tsx` | Card genérico para métricas |
| `StatusIndicator` | `src/components/genesis/MetricCard.tsx` | Indicador online/offline |
| `CellCard` | `src/components/genesis/CellCard.tsx` | Card de GenesisCell detalhado |
| `CellListItem` | `src/components/genesis/CellCard.tsx` | Item de lista compacto |
| `FrictionGauge` | `src/components/genesis/FrictionGauge.tsx` | Gauge visual de fricção |
| `RetentionBadge` | `src/components/genesis/RetentionBadge.tsx` | Badge EPHEMERAL/LONG |
| `StateIndicator` | `src/components/genesis/StateIndicator.tsx` | Indicador de estado |
| `Timeline` | `src/components/genesis/Timeline.tsx` | Timeline de transições |
| `CompactTimeline` | `src/components/genesis/Timeline.tsx` | Timeline resumida |

### VibeCode Framework

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `VibeCodeEditor` | `src/components/vibecode/VibeCodeEditor.tsx` | Editor com syntax highlighting |
| `RulesPanel` | `src/components/vibecode/RulesPanel.tsx` | Painel lateral de regras PER |
| `RuleCard` | `src/components/vibecode/RuleCard.tsx` | Card individual de regra |
| `GenesisFeedbackPanel` | `src/components/vibecode/GenesisFeedbackPanel.tsx` | Painel de feedback completo |
| `StatusBadge` | `src/components/vibecode/StatusBadge.tsx` | Badge VALID/WARNING/ERROR |
| `IssuesList` | `src/components/vibecode/IssuesList.tsx` | Lista de issues clicáveis |
| `CellPreview` | `src/components/vibecode/CellPreview.tsx` | Preview da célula simulada |
| `SimulatedLogTabs` | `src/components/vibecode/SimulatedLogTabs.tsx` | Tabs com logs simulados |
| `IntentInput` | `src/components/vibecode/IntentInput.tsx` | Input para descrição em linguagem natural |
| `ApprovalPanel` | `src/components/vibecode/ApprovalPanel.tsx` | Modal de aprovação humana |

---

## 🔧 Serviços e APIs

### Mock Data Service

**Arquivo**: `src/services/mockData.ts`

| Função | Descrição |
|--------|-----------|
| `mockCells` | 8 GenesisCells de exemplo |
| `mockTransitions` | Transições de estado simuladas |
| `mockRuntimeMetrics` | Métricas de runtime |
| `mockRuntimeTrends` | Tendências 24h |
| `getStateStats()` | Contagem por estado |
| `getFrictionDistribution()` | Distribuição de fricção |

### GenesisCore API Service

**Arquivo**: `src/services/genesisApi.ts`

**Configuração**: `VITE_GENESIS_API_URL` deve incluir `/v1` (ex: `http://localhost:3000/v1`)

**Feature Flag**: `VITE_GENESIS_USE_MOCK=false` para usar API real (default: mock ativo)

| Função | Endpoint (OpenAPI) | Descrição |
|--------|-------------------|-----------|
| `fetchCells(filters)` | `GET /cells` | Lista células com filtros |
| `fetchCell(id)` | `GET /cells/:id` | Detalhe de célula |
| `fetchCellHistory(cellId)` | `GET /cells/:id/history` | Histórico de transições |
| `fetchRecentTransitions(limit)` | `GET /log?type=state_changed` | Transições recentes (mapeado de LogEntry) |
| `fetchRuntimeMetrics()` | `GET /metrics` | Métricas atuais |
| `fetchRuntimeTrends(hours)` | `GET /metrics/trends?hours=N` | Tendências históricas |

> **Nota**: Paths são relativos ao baseUrl que já inclui `/v1`.

---

## 📐 VibeCode - Sistema de Validação

### Parser

**Arquivo**: `src/lib/vibecode/parser.ts`

| Função | Descrição |
|--------|-----------|
| `parseVibeCode(code)` | Analisa código DSL e extrai estrutura |
| `parseCommand(line)` | Extrai comandos de uma linha |

### Validator

**Arquivo**: `src/lib/vibecode/validator.ts`

| Função | Descrição |
|--------|-----------|
| `validateParsedCode(parsed, rawCode)` | Valida contra regras PER |
| `getViolatedRules(issues)` | Retorna Set de regras violadas |

### Simulator

**Arquivo**: `src/lib/vibecode/simulator.ts`

| Função | Descrição |
|--------|-----------|
| `simulateCell(parsed)` | Simula GenesisCell resultante |
| `generateSimulatedLog(parsed)` | Gera log de eventos simulado |

### Regras PER Implementadas

**Arquivo**: `src/lib/vibecode/rules.ts`

| ID | Nome | Descrição |
|----|------|-----------|
| `RULE_REQUIRED_TYPE` | Tipo Obrigatório | Todo workflow deve declarar `type` |
| `RULE_REQUIRED_RETENTION` | Retenção Obrigatória | Deve declarar `retention` |
| `RULE_INVALID_STATE` | Estado Válido | Apenas estados permitidos |
| `RULE_INVALID_RETENTION` | Retenção Válida | Apenas EPHEMERAL ou LONG |
| `RULE_INVALID_COMMAND` | Comando Válido | Apenas set/increase |
| `RULE_SYNTAX_ERROR` | Sintaxe Correta | Chaves balanceadas |
| `RULE_PASSIVE_ONLY` | Apenas Passivo | Sem lógica ativa (word-boundary) |
| `RULE_FRICTION_RANGE` | Fricção 0-100 | Valor dentro do range |

### Palavras-Chave Proibidas (PER-008)

```
execute, run, trigger, call, if, loop, while, for, await, async
```

**Validação**: Word-boundary matching com `\b` para evitar falsos positivos.

---

## 🤖 Módulo de IA

**Arquivo**: `src/lib/vibecode/aiModule.ts`

| Função | Status | Descrição |
|--------|--------|-----------|
| `generateVibeCodeFromIntent(intent)` | 🔶 Mock | Gera código a partir de descrição |
| `validateVibeCode(code)` | ✅ | Valida código gerado |
| `convertToGPP(code)` | ✅ | Converte para Genesis Payload Protocol |
| `sendToGenesisCore(gpp)` | 🔶 Mock | Envia para o Core (simulado) |

**Legenda**: ✅ Implementado | 🔶 Mock/Simulado

---

## 📡 OpenAPI Specification

**Arquivo**: `docs/api/openapi.yaml`

### Endpoints Documentados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/v1/health` | Healthcheck do runtime |
| `POST` | `/v1/workflows/preview` | Preview e validação de VibeCode |
| `POST` | `/v1/gpp/ingest` | Ingestão de dados via GPP |
| `GET` | `/v1/cells` | Lista GenesisCells |
| `GET` | `/v1/cells/{cellId}` | Detalhe de célula |
| `GET` | `/v1/cells/{cellId}/history` | Histórico de transições |
| `GET` | `/v1/log` | Log de eventos do sistema |
| `GET` | `/v1/metrics` | Métricas do runtime |
| `GET` | `/v1/metrics/friction/{cellId}` | Histórico de fricção |
| `GET` | `/v1/metrics/trends` | Tendências históricas |

---

## 📚 Documentação

### ADRs (Architecture Decision Records)

| ADR | Título | Status |
|-----|--------|--------|
| ADR-001 | Separação GenesisCore e VibeCode | ✅ Aceito |
| ADR-002 | Passive Execution Rules (PER) | ✅ Aceito |
| ADR-003 | Estrutura da GenesisCell | ✅ Aceito |

### Contratos

| Documento | Descrição |
|-----------|-----------|
| `BOUNDARY_CONTRACT.md` | Contrato de separação Core/Framework v1.0 |
| `docs/api/openapi.yaml` | Especificação OpenAPI 3.1 |

---

## 🎨 Design System

### Tokens de Estado

```css
--state-candidate: oklch(...)
--state-running: oklch(...)
--state-cooling: oklch(...)
--state-done: oklch(...)
--state-error: oklch(...)
```

### Componentes UI Base (shadcn/ui)

- Button, Card, Badge, Tabs
- Dialog, Tooltip, Popover
- ScrollArea, ResizablePanel
- Input, Textarea, Select
- E mais 50+ componentes

---

## 📊 Tipos TypeScript

### GenesisCore Types

**Arquivo**: `src/types/genesis.ts`

```typescript
type CellState = 'CANDIDATE' | 'RUNNING' | 'COOLING' | 'DONE' | 'ERROR';
type RetentionType = 'EPHEMERAL' | 'LONG';

interface GenesisCell { ... }
interface StateTransition { ... }
interface RuntimeMetrics { ... }
interface RuntimeTrend { ... }
```

### VibeCode Types

**Arquivo**: `src/types/vibecode.ts`

```typescript
type ValidationStatus = 'VALID' | 'WARNING' | 'ERROR';

interface ValidationIssue { ... }
interface ValidationResult { ... }
interface SimulatedCell { ... }
interface ParsedCode { ... }
interface VibeRule { ... }
```

---

## 🔄 Hooks Customizados

| Hook | Arquivo | Descrição |
|------|---------|-----------|
| `useVibeValidation` | `src/hooks/useVibeValidation.ts` | Validação em tempo real |
| `useMobile` | `src/hooks/use-mobile.tsx` | Detecção de dispositivo |
| `useToast` | `src/hooks/use-toast.ts` | Sistema de notificações |

---

## 📦 Dependências Principais

| Pacote | Uso |
|--------|-----|
| `@tanstack/react-query` | Data fetching e cache |
| `react-router-dom` | Roteamento |
| `recharts` | Gráficos |
| `react-resizable-panels` | Layout redimensionável |
| `date-fns` | Formatação de datas |
| `lucide-react` | Ícones |
| `sonner` | Toasts |
| `tailwindcss` | Estilos |
| `shadcn/ui` | Componentes base |

---

## 🚧 Pendências e Próximos Passos

### Em Desenvolvimento

- [ ] Conectar módulo de IA ao Lovable AI Gateway
- [ ] Implementar backend real (Lovable Cloud)
- [ ] Testes unitários para parser/validator

### Planejado (Fase 4+)

- [ ] WebSockets para atualizações em tempo real
- [ ] Observer patterns
- [ ] Análise de padrões de fricção

---

## ✅ Checklist de Conformidade

| Requisito | Status |
|-----------|--------|
| Dashboard Read-Only | ✅ |
| Separação Core/Framework | ✅ |
| Validação PER completa | ✅ |
| Word-boundary matching | ✅ |
| Aprovação humana para IA | ✅ |
| OpenAPI v3.1 documentada | ✅ |
| Layout IDE profissional | ✅ |
| Temas claro/escuro | ✅ |
| Responsividade | ✅ |
| Acessibilidade (ARIA) | ✅ |

---

> **Nota**: Este documento reflete o estado atual da implementação. Atualizar conforme novas funcionalidades forem adicionadas.
