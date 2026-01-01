# GenesisCore Boundary Contract v1.0

> **Status**: Draft  
> **Versão**: 1.0.0  
> **Data**: 2026-01-01  
> **Autores**: Equipe GenesisCore

---

## 1. Filosofia da Separação

### 1.1 Princípio Fundamental (Imutável)

**GenesisCore é um Runtime Passivo e Ético.**

Ele:
- ✔ Observa
- ✔ Registra
- ✔ Mede fricção
- ✔ Persiste memória

Ele **NÃO**:
- ❌ Roda aplicações
- ❌ Valida DSL
- ❌ Interpreta comandos
- ❌ Toma decisões autônomas

### 1.2 VibeCode é um Framework Humano

Ele:
- ✔ Fornece DSL
- ✔ Valida PER (Passive Execution Rules)
- ✔ Gera GPP (Genesis Payload Protocol)
- ✔ Chama a API do Core
- ✔ Cria apps que usam o Core

**Relação fundamental:**
```
VibeCode → consome → GenesisCore API
```

### 1.3 Por Que a Separação é Essencial

Se o VibeCode entrasse "dentro" do Core, aconteceria:

| Risco | Consequência |
|-------|--------------|
| Acoplamento conceitual | Impossível evoluir independentemente |
| Dependência bidirecional | Fragilidade sistêmica |
| Exclusividade | Outros frameworks não poderiam usar o Core |
| Risco ético | Framework influenciando memória |
| Perda de neutralidade | Comprometimento da visão |

---

## 2. Diagrama Arquitetural Oficial

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APLICAÇÃO                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  VibeCode   │  │  CLI Tools  │  │  Outras DSLs/SDKs   │  │
│  │  Framework  │  │             │  │  (Python, Go, etc)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  GENESISCORE API LAYER                       │
│                                                              │
│   REST API (Passiva, Auditável, Observável)                 │
│                                                              │
│   POST /gpp/ingest    │  GET /cells         │  GET /log     │
│   GET /cells/{id}     │  GET /metrics       │  WS /events   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
          │
          ▼ (Internal - Nunca exposto diretamente)
┌─────────────────────────────────────────────────────────────┐
│                 GENESISCORE RUNTIME (P3)                     │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│   │ GenesisCells│  │  State Log  │  │  Friction Registry  │ │
│   │  (Memória)  │  │ (Histórico) │  │    (Observação)     │ │
│   └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                              │
│   WASM Sandbox (Isolamento) │ PostgreSQL (Persistência)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Responsabilidades

### 3.1 GenesisCore Runtime

| Responsabilidade | Descrição |
|------------------|-----------|
| Persistência | Armazenar GenesisCells com integridade |
| Observação | Registrar transições de estado |
| Medição | Calcular e armazenar fricção (0-100) |
| Auditoria | Manter log imutável de eventos |
| Isolamento | Executar scripts em sandbox WASM |
| Neutralidade | Não favorecer nenhum cliente/framework |

**O que o Runtime NUNCA faz:**
- Validar sintaxe de DSL
- Interpretar regras de negócio
- Executar lógica condicional
- Tomar decisões baseadas em contexto
- Modificar dados autonomamente

### 3.2 VibeCode Framework

| Responsabilidade | Descrição |
|------------------|-----------|
| DSL | Fornecer linguagem expressiva para humanos |
| Validação PER | Garantir conformidade com regras passivas |
| Geração GPP | Transformar DSL em payloads válidos |
| UX | Prover editor, feedback, simulação |
| Educação | Ensinar conceitos do ecossistema |

**O que o VibeCode NUNCA faz:**
- Acessar internals do Runtime
- Modificar GenesisCells diretamente
- Bypassar a API Layer
- Influenciar métricas de fricção
- Alterar comportamento do Core

### 3.3 API Layer (Fronteira)

A API é o **único ponto de contato** entre clientes e o Runtime.

**Características obrigatórias:**
- ✔ Stateless
- ✔ Versionada (SemVer)
- ✔ Documentada (OpenAPI)
- ✔ Rate-limited
- ✔ Autenticada
- ✔ Auditável

---

## 4. Garantias Éticas

### 4.1 Princípio de Ouro

> **GenesisCore deve poder existir mesmo que o VibeCode nunca tivesse sido criado.**
> 
> E vice-versa.

### 4.2 Garantias do Runtime

1. **Neutralidade**: Nenhum framework recebe tratamento preferencial
2. **Transparência**: Todo acesso é logado e auditável
3. **Imutabilidade**: Histórico nunca é alterado retroativamente
4. **Privacidade**: Dados são isolados por tenant/contexto
5. **Passividade**: Nenhuma ação autônoma sem trigger externo

### 4.3 Garantias do VibeCode

1. **Honestidade**: DSL reflete exatamente o que será enviado ao Core
2. **Validação**: Código inválido nunca alcança a API
3. **Simulação Fiel**: Preview representa comportamento real
4. **Sem Side Effects**: Edição não afeta dados reais

---

## 5. Versionamento

### 5.1 Estratégia SemVer

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes na API
MINOR: Novos endpoints/features (retrocompatível)
PATCH: Bug fixes
```

### 5.2 Compatibilidade

| API Version | Suporte Mínimo |
|-------------|----------------|
| v1.x | 24 meses após v2.0 |
| v2.x | 24 meses após v3.0 |

### 5.3 Headers de Versão

```http
Accept: application/vnd.genesiscore.v1+json
X-API-Version: 1.0.0
```

---

## 6. Exemplo de Integração

### 6.1 VibeCode → GenesisCore (Fluxo Típico)

```
1. Usuário escreve código VibeCode
   │
   ▼
2. VibeCode Framework valida (PER Rules)
   │
   ▼
3. Se válido: Gera GPP (Genesis Payload Protocol)
   │
   ▼
4. POST /gpp/ingest
   {
     "workflow": "OrderProcessing",
     "type": "ORDER",
     "retention": "LONG",
     "events": [...]
   }
   │
   ▼
5. GenesisCore cria GenesisCells
   │
   ▼
6. Retorna confirmação + cell_ids
   │
   ▼
7. Dashboard observa via GET /cells, GET /log
```

### 6.2 Outro Cliente (Python SDK)

```python
from genesiscore import Client

client = Client(api_key="...")

# Enviar GPP diretamente (sem VibeCode)
cell = client.ingest({
    "type": "SENSOR_DATA",
    "retention": "EPHEMERAL",
    "payload": {"temperature": 23.5}
})

# Observar
history = client.get_cell_history(cell.id)
friction = client.get_friction(cell.id)
```

---

## 7. Roadmap de Separação

### Fase Atual: MVP Integrado ✅

- Código junto por conveniência
- Fronteira conceitual estabelecida
- API Contract definido

### Fase 2: API Contract Formal

- [ ] OpenAPI.yaml completo
- [ ] Versionamento de endpoints
- [ ] Semântica estável
- [ ] Testes de contrato

### Fase 3: Separação Física

- [ ] Repositórios separados
- [ ] Deploy independente
- [ ] Docker isolado
- [ ] CI/CD separado

### Visão Final

```
github.com/genesiscore/runtime
github.com/vibecode/framework
```

---

## 8. Checklist de Conformidade

### Para Novos Endpoints

- [ ] É passivo? (não executa lógica de negócio)
- [ ] É auditável? (gera log)
- [ ] É versionado?
- [ ] Está documentado no OpenAPI?
- [ ] Respeita rate limits?

### Para Novos Features no VibeCode

- [ ] Usa apenas a API pública?
- [ ] Não acessa internals do Core?
- [ ] Valida antes de enviar?
- [ ] Simula fielmente?

---

## 9. Glossário

| Termo | Definição |
|-------|-----------|
| **GenesisCell** | Unidade básica de memória do Runtime |
| **PER** | Passive Execution Rules - regras que garantem passividade |
| **GPP** | Genesis Payload Protocol - formato de dados para API |
| **Fricção** | Métrica de dificuldade/instabilidade (0-100) |
| **Retention** | Política de persistência (EPHEMERAL/LONG) |
| **WASM Sandbox** | Ambiente isolado para execução segura |

---

## 10. Referências

- [ADR-001: Separation of Concerns](./adr/ADR-001-separation-of-concerns.md)
- [ADR-003: GenesisCell Structure](./adr/ADR-003-genesis-cell-structure.md)
- [OpenAPI Specification](./api/openapi.yaml)

---

**Documento mantido por**: Equipe GenesisCore  
**Última revisão**: 2026-01-01  
**Próxima revisão**: 2026-04-01
