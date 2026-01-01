# ADR-002: Passive Execution Rules (PER)

> **Status**: Aceito  
> **Data**: 2026-01-01  
> **Decisores**: Equipe GenesisCore  
> **Categorias**: Validação, Segurança

---

## Contexto

O GenesisCore é um runtime **passivo**. Ele não deve executar lógica ativa, tomar decisões autônomas ou reagir automaticamente a eventos.

Para garantir essa passividade, precisamos de um conjunto de regras que validem qualquer código/payload antes de ser aceito pelo sistema.

---

## Decisão

Definimos as **Passive Execution Rules (PER)** - um conjunto de 8 regras fundamentais que garantem a natureza passiva do sistema.

---

## As 8 Regras PER

### PER-001: Type Declaration Required

```
Todo workflow DEVE declarar um `type`.
```

**Válido:**
```
type ORDER
```

**Inválido:**
```
workflow OrderProcessing
on CREATED { ... }  // Sem type!
```

### PER-002: Retention Policy Required

```
Todo workflow DEVE declarar `retention` (EPHEMERAL ou LONG).
```

**Válido:**
```
retention LONG
retention EPHEMERAL
```

**Inválido:**
```
workflow X
type Y
on CREATED { ... }  // Sem retention!
```

### PER-003: Valid States Only

```
Estados permitidos: CANDIDATE, RUNNING, COOLING, DONE, ERROR
```

**Válido:**
```
set state = RUNNING
set state = DONE
```

**Inválido:**
```
set state = ACTIVE      // Estado não existe
set state = PROCESSING  // Estado não existe
```

### PER-004: Passive Commands Only

```
Comandos permitidos são estritamente passivos:
- set state = X
- set friction = N
- increase friction by N
```

**Válido:**
```
set state = RUNNING
set friction = 50
increase friction by 10
```

**Inválido:**
```
execute cleanup()      // Ativo!
call external_api()    // Ativo!
trigger notification   // Ativo!
```

### PER-005: Friction Range

```
Fricção DEVE estar entre 0 e 100.
```

**Válido:**
```
set friction = 0
set friction = 100
set friction = 50
```

**Inválido:**
```
set friction = -10   // Negativo
set friction = 150   // Acima de 100
```

### PER-006: Valid Retention Values

```
Retention DEVE ser EPHEMERAL ou LONG.
```

**Válido:**
```
retention EPHEMERAL
retention LONG
```

**Inválido:**
```
retention SHORT      // Não existe
retention PERMANENT  // Não existe
```

### PER-007: Basic Syntax

```
Sintaxe básica deve ser respeitada:
- Blocos delimitados por { }
- Comandos válidos dentro de eventos
- Keywords reconhecidas
```

### PER-008: No Active Logic

```
Lógica ativa é PROIBIDA:
- if/else
- loops (for, while)
- execute, run, call
- triggers automáticos
```

**Inválido:**
```
on CREATED {
  if (friction > 50) {     // PROIBIDO
    set state = ERROR
  }
}

on TIMEOUT {
  execute cleanup()        // PROIBIDO
}
```

---

## Justificativa

### Preservação da Passividade

O GenesisCore é um **substrato de memória**, não um executor. As PER garantem que:

1. Nenhum código ativo entre no sistema
2. Transições são registradas, não executadas automaticamente
3. Fricção é medida, não reagida
4. O sistema permanece auditável e previsível

### Segurança

Sem lógica ativa:
- Não há riscos de loops infinitos
- Não há execução de código malicioso
- Não há side effects imprevisíveis
- Auditoria é trivial

### Evolução Gradual

Na Fase 3 (atual), o sistema é estritamente passivo.  
Na Fase 4+, podemos adicionar **observadores** que analisam padrões.  
Na Fase 5+, podemos adicionar **cognição** controlada.

As PER garantem que a base permanece sólida.

---

## Consequências

### Positivas

1. Sistema 100% previsível
2. Auditoria trivial
3. Sem surpresas de runtime
4. Base sólida para evolução

### Negativas

1. Menos flexibilidade (intencional)
2. Curva de aprendizado para usuários acostumados com lógica ativa
3. Algumas funcionalidades precisam ser implementadas na camada de aplicação

---

## Implementação

### Validador VibeCode

O VibeCode Framework implementa um validador que verifica todas as 8 regras PER antes de permitir envio ao Core.

```typescript
// Exemplo simplificado
function validatePER(code: string): ValidationResult {
  const issues = [];
  
  // PER-001
  if (!hasTypeDeclaration(code)) {
    issues.push({ rule: 'PER-001', message: 'Type required' });
  }
  
  // PER-002
  if (!hasRetentionDeclaration(code)) {
    issues.push({ rule: 'PER-002', message: 'Retention required' });
  }
  
  // ... outras regras
  
  return { valid: issues.length === 0, issues };
}
```

### API Layer

A API do GenesisCore também valida PER como segunda linha de defesa:

```http
POST /gpp/ingest

400 Bad Request
{
  "error": "PER_VIOLATION",
  "violations": [
    { "rule": "PER-008", "message": "Active logic detected" }
  ]
}
```

---

## Referências

- [ADR-001: Separation of Concerns](./ADR-001-separation-of-concerns.md)
- [Boundary Contract](../BOUNDARY_CONTRACT.md)
- Documentação do validador VibeCode

---

## Notas

As PER são **imutáveis** para a Fase 3.  
Extensões futuras devem ser aditivas, nunca subtrativas.
