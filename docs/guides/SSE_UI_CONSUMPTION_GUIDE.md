# 🧭 UI Consumption Guide — GenesisCore Event Stream

Este guia descreve o padrão oficial para integrar o frontend com o stream de eventos em tempo real do GenesisCore (Fase 4).

## 1. Fluxo de Inicialização (Boot)

Para evitar inconsistências (drift), a UI deve seguir obrigatoriamente esta ordem:

1. **Snapshot:** Faz um fetch inicial dos dados necessários (ex: `GET /v1/cells`).
2. **Subscription:** Abre a conexão SSE (`GET /v1/stream/events`).
3. **Event Applier:** Aplica os novos eventos sobre o estado carregado no snapshot.

> [!NOTE]
> Se a conexão cair, a UI deve recomeçar do passo 1 para garantir que não perdeu eventos durante o downtime.

## 2. Implementação Sugerida (Pattern)

### Reducer Determinístico
Trate os eventos SSE como atualizações incrementais. O "Event Applier" não deve ter lógica de negócio, apenas atualizar o estado visual.

```typescript
// Exemplo de Reducer (Conceitual)
function sseReducer(state, event) {
  switch (event.type) {
    case 'CELL_CREATED':
      return { ...state, cells: [event.details, ...state.cells] };
    case 'STATE_CHANGED':
      return {
        ...state,
        cells: state.cells.map(c => 
          c.id === event.cell_id ? { ...c, state: event.details.to_state } : c
        )
      };
    default:
      return state;
  }
}
```

## 3. Regras de Ouro (Invioláveis)

- **Passividade:** A UI nunca deve disparar uma ação automática (POST) como reação direta a um evento SSE. Toda ação deve ser mediada por um humano (Fase 5).
- **Tratamento de ID:** Use `cell_id` para correlacionar eventos com os dados locais.
- **Heartbeat:** Ignore eventos de comentário/heartbeat (`: heartbeat`). O navegador faz isso automaticamente, mas se usar bibliotecas customizadas, filtre-os.
- **Deduplicação:** Use o `timestamp_ms` ou IDs se disponíveis para evitar aplicar o mesmo estado duas vezes (caso o polling e o stream se sobreponham no boot).

## 4. Endpoints Úteis
- **Stream:** `/v1/stream/events`
- **Replay (Fase 6):** Ainda não disponível. Para obter histórico, use `/v1/cells/:id/history`.

---
**Status:** Protocolo Homologado para Fase 4.1.
