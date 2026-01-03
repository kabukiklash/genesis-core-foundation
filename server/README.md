# GenesisCore Runtime

> **Fase 3**: Memória Passiva  
> **Versão**: 1.0.0

Runtime passivo e ético do GenesisCore. Este servidor **observa, registra e mede** - ele **NÃO** valida DSL, interpreta comandos ou toma decisões autônomas.

## Filosofia

O GenesisCore Runtime segue o **Boundary Contract v1.0**:

- ✅ Persistir memória (GenesisCells)
- ✅ Registrar eventos (append-only audit log)
- ✅ Medir fricção
- ✅ Expor API stateless e auditável
- ❌ Validar DSL (isso é do VibeCode)
- ❌ Interpretar regras PER
- ❌ Executar lógica condicional
- ❌ Tomar decisões autônomas

## Quick Start

```bash
# Instalar dependências (na raiz do projeto)
npm install

# Iniciar o servidor
npm run server:dev

# Ou iniciar frontend + backend juntos
npm run dev:all
```

## Endpoints

Base URL: `http://localhost:3000/v1`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Healthcheck |
| `POST` | `/gpp/ingest` | Ingerir payload GPP |
| `GET` | `/cells` | Listar células |
| `GET` | `/cells/:id` | Detalhe de célula |
| `GET` | `/cells/:id/history` | Histórico de estados |
| `GET` | `/log` | Audit log |
| `GET` | `/metrics` | Métricas do runtime |
| `GET` | `/metrics/trends` | Tendências históricas |
| `GET` | `/metrics/friction/:id` | Histórico de fricção |

## Exemplos cURL

### Healthcheck

```bash
curl http://localhost:3000/v1/health
```

### Ingerir GPP

```bash
curl -X POST http://localhost:3000/v1/gpp/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user.action",
    "retention": "EPHEMERAL",
    "intent": "Registrar clique do usuário",
    "workflow": "click-tracking"
  }'
```

### Listar células

```bash
curl http://localhost:3000/v1/cells
```

### Listar células filtradas

```bash
curl "http://localhost:3000/v1/cells?state=CANDIDATE,RUNNING&retention=EPHEMERAL"
```

### Detalhe de célula

```bash
curl http://localhost:3000/v1/cells/{cell_id}
```

### Histórico de célula

```bash
curl http://localhost:3000/v1/cells/{cell_id}/history
```

### Audit log

```bash
curl "http://localhost:3000/v1/log?type=state_changed&per_page=20"
```

### Métricas

```bash
curl http://localhost:3000/v1/metrics
```

### Tendências

```bash
curl "http://localhost:3000/v1/metrics/trends?hours=24"
```

## Estrutura do Banco

SQLite com 4 tabelas:

- `cells` - GenesisCells
- `cell_history` - Histórico de estados (append-only)
- `friction_history` - Histórico de fricção (append-only)
- `audit_log` - Log de auditoria (append-only)

## Configuração

Copie `.env.example` para `.env`:

```bash
cp server/.env.example server/.env
```

Variáveis:

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | 3000 | Porta do servidor |
| `CORS_ORIGIN` | * | Origem CORS permitida |
| `GENESIS_DB_PATH` | ./genesis.db | Caminho do SQLite |
| `NODE_ENV` | development | Ambiente |

## Conectando o Frontend

No frontend, configure as variáveis de ambiente:

```bash
VITE_GENESIS_API_URL=http://localhost:3000/v1
VITE_GENESIS_USE_MOCK=false
```

## Arquitetura

```
server/
├── index.ts          # Entry point
├── db.ts             # Database layer
├── schema.sql        # SQLite schema
├── types.ts          # TypeScript types
├── tsconfig.json     # TS config
├── .env.example      # Environment template
└── routes/
    ├── health.ts     # GET /health
    ├── gpp.ts        # POST /gpp/ingest
    ├── cells.ts      # GET /cells, /cells/:id, /cells/:id/history
    ├── log.ts        # GET /log
    └── metrics.ts    # GET /metrics, /trends, /friction/:id
```

## Princípios

1. **Append-only**: Todo histórico é imutável
2. **Auditável**: Toda ação gera log
3. **Stateless**: API não mantém estado de sessão
4. **Passivo**: Sem regras ou decisões automáticas
