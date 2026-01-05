# 📜 GenesisCore Event Contract — v1.0 (FREEZE)

**Status:** Frozen ✅  
**Versão:** 1.0.0  
**Fase:** Pré-Fase 4 (SSE)  
**Escopo:** Runtime GenesisCore  
**Data:** 2026-01-03

---

## 1. Propósito

Este documento define o Contrato Oficial de Eventos Observacionais do GenesisCore.

Ele especifica o que pode ser emitido, como é emitido e o que NUNCA pode acontecer quando eventos são transmitidos via Event Stream (SSE ou equivalentes).

> [!CAUTION]
> Este contrato não autoriza comportamento ativo, decisões automáticas ou mutações de estado.

---

## 2. Princípios Fundamentais (Imutáveis)

### Passividade Absoluta
- Eventos não causam ações.
- Eventos não disparam lógica.
- Eventos não alteram estado.

### Observação Pós-Fato
- Todo evento reflete algo que já aconteceu.
- Nunca antecipa, decide ou reage.

### Best-Effort
- Eventos não são garantidos.
- Perda de evento não compromete integridade.
- Fonte da verdade = API REST (`/cells`, `/log`, `/metrics`).

### Auditabilidade
- Todo evento corresponde a um registro no audit log.
- Eventos não substituem logs.

---

## 3. Tipos de Evento (v1.0)

### 3.1 Eventos Permitidos

| Event Type | Descrição |
| :--- | :--- |
| `cell_created` | Uma GenesisCell foi criada |
| `state_changed` | Uma mudança de estado foi registrada |
| `gpp_ingested` | Um GPP foi ingerido com sucesso |
| `health` | Heartbeat do runtime (opcional) |
| `metrics_updated` | Snapshot observacional de métricas (opcional) |

> [!WARNING]
> Nenhum outro tipo é permitido na v1.0.

---

## 4. Envelope Canônico do Evento

Todos os eventos DEVEM seguir este formato:

```json
{
  "type": "state_changed",
  "timestamp_ms": 1767472000000,
  "cell_id": "uuid-opcional",
  "details": {
    "from_state": "CANDIDATE",
    "to_state": "CANDIDATE",
    "reason": "ingest"
  },
  "meta": {
    "version": "1.0.0"
  }
}
```

### Regras do Envelope
- **type**: obrigatório.
- **timestamp_ms**: obrigatório (epoch ms).
- **cell_id**: opcional (somente se aplicável).
- **details**: opcional, sem semântica ativa.
- **meta.version**: obrigatório.

---

## 5. Regras de Emissão
- Eventos só podem ser emitidos após persistência bem-sucedida.
- Eventos nunca iniciam fluxos.
- Eventos não são encadeados.
- Eventos não garantem entrega.
- Eventos não carregam lógica.

---

## 6. Relação com SSE (Fase 4)
- SSE é apenas um transporte.
- Este contrato independe de SSE.
- Outros transportes futuros devem respeitar este contrato.

---

## 7. Proibições Explícitas

> [!CAUTION]
> **Eventos não podem:**
> - Disparar jobs
> - Alterar métricas
> - Modificar GenesisCells
> - Tomar decisões
> - Substituir polling
> - Ser tratados como “fonte da verdade”

---

## 8. Compatibilidade e Evolução
- Mudanças neste contrato seguem SemVer.
- Novos eventos = **MINOR**.
- Quebra de formato = **MAJOR**.
- v1.x será mantido por no mínimo 24 meses.

---

## 9. Status de Congelamento
Ao ser aceito, este documento torna-se contrato congelado e qualquer mudança exige revisão arquitetural explícita.
