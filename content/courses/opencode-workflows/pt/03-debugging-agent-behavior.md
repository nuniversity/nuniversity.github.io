---
title: "Depuração do Comportamento de Agentes"
description: "Diagnostique e corrija problemas com agentes do OpenCode. Aprenda técnicas de depuração, análise de logs e como rastrear o ciclo de vida de requisições para identificar problemas."
order: 3
duration: "45 min"
difficulty: "intermediate"
---

# Depuração do Comportamento de Agentes

## Modo de Depuração

Ative o modo de depuração para ver informações detalhadas:

```bash
opencode --debug
```

Ou defina a variável de ambiente:

```bash
export OPENCODE_DEBUG=1
opencode
```

---

## O que o Modo de Depuração Mostra

### Ciclo de Vida da Requisição

```
[DEBUG] Request received: "Fix the bug in main.py"
[DEBUG] Agent routing: Matched 'default' agent (description: "General-purpose coding assistant")
[DEBUG] Tool selection: Using 'read' tool for src/main.py
[DEBUG] Permission check: read tool allowed for src/**
[DEBUG] Tool execution: read src/main.py (234 bytes)
[DEBUG] Tool selection: Using 'edit' tool for src/main.py
[DEBUG] Permission check: edit tool allowed for src/**
[DEBUG] Tool execution: edit src/main.py (success)
[DEBUG] Response generated: "Fixed the bug by adding null check"
```

### Invocações de Ferramentas

```
[DEBUG] Tool: read
[DEBUG] Arguments: {"path": "src/main.py"}
[DEBUG] Result: Success (234 bytes)

[DEBUG] Tool: edit
[DEBUG] Arguments: {"path": "src/main.py", "old": "...", "new": "..."}
[DEBUG] Result: Success
```

### Verificações de Permissão

```
[DEBUG] Permission check: bash tool
[DEBUG] Command: "npm test"
[DEBUG] Pattern: "npm *" → ALLOWED
[DEBUG] Permission granted
```

---

## Problemas Comuns e Soluções

### Problema: Agente Não Responde

**Sintomas:**
- Sem resposta após enviar uma mensagem
- Longos atrasos sem saída

**Passos de Depuração:**

1. Verifique a validade da chave de API:
```bash
echo $OPENAI_API_KEY | head -c 10
```

2. Verifique a conectividade de rede:
```bash
curl -I https://api.openai.com
```

3. Verifique os logs de depuração para erros de timeout

**Solução:**
```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "timeout": 60000
    }
  }
}
```

### Problema: Agente Errado Selecionado

**Sintomas:**
- Requisição vai para o agente errado
- Agente não entende a tarefa

**Passos de Depuração:**

1. Verifique as descrições dos agentes na saída de depuração
2. Revise as regras de roteamento
3. Teste a correspondência de padrões

**Solução:**
```json
{
  "agentRouting": {
    "rules": [
      {
        "pattern": "specific-pattern",
        "agent": "target-agent"
      }
    ]
  }
}
```

### Problema: Permissão Negada

**Sintomas:**
- Erros "Permission denied"
- Ferramentas não executando

**Passos de Depuração:**

1. Verifique as regras de permissão na saída de depuração
2. Verifique a correspondência de padrões
3. Revise a ordem de negação vs permissão

**Solução:**
```json
{
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *"],
      "deny": ["sudo *"]
    }
  ]
}
```

---

## Análise de Logs

### Níveis de Log

| Nível | Saída | Caso de Uso |
|-------|--------|----------|
| Padrão | Informações básicas | Operação normal |
| Depuração | Rastreamentos detalhados | Solução de problemas |
| Detalhado | Conteúdo completo | Depuração profunda |

### Ativando o Modo Detalhado

```bash
opencode --verbose
```

Ou na sessão interativa:

```
> /verbose
```

---

## Rastreamento de Requisições

### Rastreamento Manual

Siga esta lista de verificação para depuração manual:

1. **Verifique a configuração**:
```bash
cat opencode.json | jq .
```

2. **Verifique a chave de API**:
```bash
echo "Key starts with: ${OPENAI_API_KEY:0:8}..."
```

3. **Teste a API diretamente**:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "test"}]}'
```

4. **Verifique a saída de depuração**:
```bash
opencode --debug 2>&1 | grep -i error
```

---

## Depuração de Performance

### Respostas Lentas

**Causas:**
- Janela de contexto grande
- Prompts complexos
- Latência de rede
- Limite de taxa

**Soluções:**

| Causa | Solução |
|-------|----------|
| Contexto grande | Limpe a conversa com `/clear` |
| Prompts complexos | Simplifique as instruções |
| Latência de rede | Verifique a conexão, use uma região mais próxima |
| Limite de taxa | Adicione atrasos, atualize o plano da API |

### Uso de Tokens

Monitore o uso de tokens na saída de depuração:

```
[DEBUG] Token usage: prompt=1234, completion=567, total=1801
[DEBUG] Estimated cost: $0.03
```

---

## Practice Questions

```question
{
  "id": "oc-debug-q1",
  "type": "multiple-choice",
  "question": "How do you enable debug mode in OpenCode?",
  "options": [
    "Set OPENCODE_DEBUG=1 or use --debug flag",
    "Add debug: true to opencode.json",
    "Use /debug command",
    "All of the above"
  ],
  "correct": 3,
  "explanation": "Debug mode can be enabled via environment variable, command-line flag, or interactive command."
}
```

```question
{
  "id": "oc-debug-q2",
  "type": "multiple-choice",
  "question": "What does the request lifecycle trace show?",
  "options": [
    "Only the final response",
    "Agent routing, tool selection, permissions, and execution",
    "Only API calls",
    "Only errors"
  ],
  "correct": 1,
  "explanation": "The request lifecycle trace shows the complete flow from agent routing through tool execution."
}
```

```question
{
  "id": "oc-debug-q3",
  "type": "multiple-choice",
  "question": "What should you check first when an agent doesn't respond?",
  "options": [
    "Reinstall OpenCode",
    "API key validity and network connectivity",
    "Your code for bugs",
    "The agent's temperature setting"
  ],
  "correct": 1,
  "explanation": "Always check API key validity and network connectivity first, as these are the most common causes of no response."
}
```

```question
{
  "id": "oc-debug-q4",
  "type": "multiple-choice",
  "question": "How do you clear the conversation to reduce context size?",
  "options": [
    "Restart OpenCode",
    "Use /clear command",
    "Delete the config file",
    "Use /reset command"
  ],
  "correct": 1,
  "explanation": "The /clear command clears the conversation history while maintaining the session, reducing context size."
}
```

```question
{
  "id": "oc-debug-q5",
  "type": "multiple-choice",
  "question": "What does the token usage line in debug output show?",
  "options": [
    "Only response length",
    "Prompt tokens, completion tokens, and total cost",
    "Only errors",
    "Only network latency"
  ],
  "correct": 1,
  "explanation": "Token usage shows prompt tokens, completion tokens, total tokens, and estimated cost for the request."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Ative o modo de depuração com a flag `--debug` ou `OPENCODE_DEBUG=1`
- A saída de depuração mostra roteamento de agentes, seleção de ferramentas, permissões e execução
- Sempre verifique a validade da chave de API e a conectividade de rede primeiro
- Use `/clear` para reduzir o tamanho do contexto quando as respostas estiverem lentas
- O uso de tokens e estimativas de custo aparecem na saída de depuração
- Os níveis de log podem ser ajustados para mais ou menos detalhes
- O rastreamento manual segue uma abordagem de lista de verificação sistemática
