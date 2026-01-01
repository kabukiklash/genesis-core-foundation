# ADR-001: Separação entre GenesisCore e VibeCode

> **Status**: Aceito  
> **Data**: 2026-01-01  
> **Decisores**: Equipe GenesisCore  
> **Categorias**: Arquitetura, Filosofia

---

## Contexto

O projeto GenesisCore está sendo desenvolvido como um runtime de execução orquestrada e adaptativa. Paralelamente, o VibeCode Framework está sendo criado como uma DSL (Domain Specific Language) para interagir com o GenesisCore.

Durante o desenvolvimento do MVP, surgiu a questão: **o VibeCode deve ser parte integrante do GenesisCore ou deve ser um sistema separado?**

---

## Decisão

**O VibeCode Framework NÃO é parte do GenesisCore. Ele CONSOME o GenesisCore via API.**

A separação é:
- **Conceitual**: São sistemas com propósitos diferentes
- **Arquitetural**: Comunicam-se apenas via API REST
- **Filosófica**: Mantém a neutralidade do Core

---

## Justificativa

### 1. Preservação da Neutralidade

O GenesisCore é um runtime **passivo e ético**. Ele:
- Observa, registra, mede
- NÃO executa lógica de negócio
- NÃO interpreta DSLs

Se o VibeCode fosse interno ao Core:
- O Core perderia neutralidade
- Outros frameworks não poderiam usar o Core igualmente
- Haveria risco de "favoritismo" arquitetural

### 2. Escalabilidade do Ecossistema

Com a separação:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  VibeCode   │  │  Python SDK │  │   Go SDK    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────┐
              │  GenesisCore    │
              │     API         │
              └─────────────────┘
```

Qualquer linguagem/framework pode consumir o Core.

### 3. Independência de Evolução

| Aspecto | GenesisCore | VibeCode |
|---------|-------------|----------|
| Ciclo de Release | Conservador | Ágil |
| Breaking Changes | Raros | Frequentes |
| Experimentação | Baixa | Alta |
| Público | Infraestrutura | Desenvolvedores |

### 4. Segurança e Auditoria

- API como único ponto de entrada
- Logs claros de quem acessou o quê
- Isolamento de falhas
- Responsabilidades bem definidas

---

## Consequências

### Positivas

1. **Ecossistema aberto**: Novos clientes podem surgir
2. **Manutenibilidade**: Sistemas evoluem independentemente
3. **Testabilidade**: API contracts claros
4. **Segurança**: Superfície de ataque reduzida
5. **Filosofia preservada**: Core permanece neutro

### Negativas

1. **Complexidade inicial**: Mais repositórios/deploys
2. **Latência**: Chamadas de rede vs. in-process
3. **Coordenação**: Releases precisam ser coordenados

### Mitigações

| Risco | Mitigação |
|-------|-----------|
| Complexidade | MVP integrado, separação gradual |
| Latência | Caching, batch operations |
| Coordenação | Versionamento SemVer, contracts |

---

## Alternativas Consideradas

### 1. VibeCode como Módulo Interno

**Rejeitado** porque:
- Viola neutralidade do Core
- Cria acoplamento forte
- Dificulta outros clientes

### 2. Monorepo com Builds Separados

**Considerado para MVP** porque:
- Facilita desenvolvimento inicial
- Permite separação futura
- Mantém fronteira conceitual

### 3. Microserviços desde o Início

**Adiado** porque:
- Overhead prematuro
- Complexidade desnecessária no MVP
- Pode ser feito depois sem trauma

---

## Implementação

### Fase 1: MVP (Atual)
- Código no mesmo repositório
- Fronteira conceitual clara
- API contract definido

### Fase 2: Formalização
- OpenAPI specification
- Testes de contrato
- Documentação de boundary

### Fase 3: Separação Física
- Repositórios separados
- Deploys independentes
- Versionamento SemVer

---

## Referências

- [Boundary Contract v1.0](../BOUNDARY_CONTRACT.md)
- [OpenAPI Specification](../api/openapi.yaml)
- Discussão sobre modularidade em sistemas complexos

---

## Notas

Esta decisão é **filosófica e arquiteturalmente fundamental**. Revisões futuras devem manter o princípio core:

> **GenesisCore deve poder existir mesmo que o VibeCode nunca tivesse sido criado.**
