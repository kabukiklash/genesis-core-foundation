# Architecture Decision Records (ADRs)

Este diretório contém os registros de decisões arquiteturais do projeto GenesisCore.

## O que são ADRs?

ADRs são documentos curtos que capturam decisões arquiteturais importantes, incluindo:
- **Contexto**: Por que a decisão foi necessária
- **Decisão**: O que foi decidido
- **Consequências**: Impactos positivos e negativos

## Índice de ADRs

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [ADR-001](./ADR-001-separation-of-concerns.md) | Separação entre GenesisCore e VibeCode | ✅ Aceito | 2026-01-01 |
| [ADR-002](./ADR-002-passive-execution-rules.md) | Passive Execution Rules (PER) | ✅ Aceito | 2026-01-01 |
| [ADR-003](./ADR-003-genesis-cell-structure.md) | Estrutura da GenesisCell | ✅ Aceito | 2026-01-01 |

## Status Possíveis

- **Proposto**: Em discussão
- **Aceito**: Decisão final tomada
- **Deprecado**: Substituído por outro ADR
- **Rejeitado**: Decisão considerada mas não adotada

## Criando um Novo ADR

Use o template:

```markdown
# ADR-XXX: [Título]

> **Status**: Proposto  
> **Data**: YYYY-MM-DD  
> **Decisores**: [Nomes]  
> **Categorias**: [Tags]

## Contexto

[Por que essa decisão é necessária?]

## Decisão

[O que foi decidido?]

## Justificativa

[Por que essa foi a melhor opção?]

## Consequências

### Positivas
- ...

### Negativas
- ...

## Alternativas Consideradas

### Alternativa 1
**Rejeitado** porque: ...

## Referências

- [Links relevantes]
```

## Princípios

1. **ADRs são imutáveis**: Uma vez aceito, não edite. Crie um novo ADR se precisar mudar.
2. **Documente o contexto**: O "porquê" é tão importante quanto o "quê".
3. **Seja conciso**: ADRs devem ser curtos e focados.
4. **Link entre ADRs**: Referencie decisões relacionadas.
