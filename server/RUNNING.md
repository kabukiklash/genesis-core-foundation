# GenesisCore Runtime - Instruções de Execução

## Pré-requisitos

As dependências já estão instaladas no projeto. Verifique se você tem:
- Node.js 18+
- npm ou bun

## Executando o Backend

### Opção 1: Usando tsx diretamente

```bash
# Na raiz do projeto
npx tsx server/index.ts
```

### Opção 2: Adicionar scripts ao package.json

Adicione estes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "server:dev": "tsx server/index.ts",
    "dev:all": "concurrently \"npm run dev\" \"npm run server:dev\""
  }
}
```

Depois execute:

```bash
npm run server:dev
# ou
npm run dev:all
```

## Configurando o Frontend

Para usar o backend real ao invés dos mocks:

1. Crie um arquivo `.env.local` na raiz do projeto:

```
VITE_GENESIS_API_URL=http://localhost:3000/v1
VITE_GENESIS_USE_MOCK=false
```

2. Reinicie o frontend (`npm run dev`)

## Testando

### Healthcheck
```bash
curl http://localhost:3000/v1/health
```

### Criar uma célula
```bash
curl -X POST http://localhost:3000/v1/gpp/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test.event",
    "retention": "EPHEMERAL",
    "intent": "Teste de criação de célula"
  }'
```

### Verificar célula criada
```bash
curl http://localhost:3000/v1/cells
```

## Observações

- O banco SQLite (`genesis.db`) é criado automaticamente na pasta `server/`
- O banco é persistente entre reinicializações
- Para resetar, delete o arquivo `server/genesis.db`
