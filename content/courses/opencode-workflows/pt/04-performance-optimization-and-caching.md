---
title: "Otimização de Performance e Cache"
description: "Otimize o OpenCode para velocidade e eficiência de custos. Aprenda estratégias de cache, otimização de tokens, seleção de modelos e como reduzir chamadas de API mantendo a qualidade."
order: 4
duration: "45 min"
difficulty: "intermediate"
---

# Otimização de Performance e Cache

## Por que Otimizar?

| Métrica | Impacto |
|--------|--------|
| **Tempo de Resposta** | Fluxo de trabalho de desenvolvimento mais rápido |
| **Uso de Tokens** | Custos de API mais baixos |
| **Qualidade** | Melhores resultados com menos sobrecarga |
| **Escalabilidade** | Lidar com projetos maiores |

---

## Otimização de Tokens

### Entendendo Tokens

Tokens são as unidades básicas que os LLMs processam:

| Conteúdo | Tokens Aproximados |
|---------|-------------------|
| 1 palavra | 1-2 tokens |
| 1 linha de código | 5-15 tokens |
| 1 arquivo (100 linhas) | 500-1500 tokens |

### Reduzir Uso de Tokens

1. **Limpe a conversa regularmente**:
```
> /clear
```

2. **Seja específico nos prompts**:
```
❌ "Fix the bug"
✅ "Fix the ZeroDivisionError in calculate_average() when list is empty"
```

3. **Leia apenas arquivos relevantes**:
```
❌ "Read all files in src/"
✅ "Read src/utils.py"
```

4. **Use grep antes de ler**:
```
> Search for "TODO" in src/ before reading entire files
```

---

## Estratégia de Seleção de Modelo

| Tarefa | Modelo | Motivo |
|------|-------|--------|
| Perguntas simples | gpt-4o-mini | Rápido, barato |
| Geração de código | gpt-4o | Equilibrado |
| Raciocínio complexo | claude-sonnet-4-20250514 | Alta qualidade |
| Revisão de código | claude-sonnet-4-20250514 | Análise minuciosa |
| Edições rápidas | gpt-4o-mini | Velocidade |

### Configuração

```json
{
  "agents": {
    "quick": {
      "model": "gpt-4o-mini",
      "description": "Simple tasks, fast responses"
    },
    "complex": {
      "model": "gpt-4o",
      "description": "Complex tasks, high quality"
    }
  }
}
```

---

## Estratégias de Cache

### Cache de Conteúdo de Arquivo

Armazene em cache arquivos acessados frequentemente:

```python
# Pseudo-code for caching
file_cache = {}

def read_file(path):
    if path in file_cache:
        return file_cache[path]
    
    content = read_from_disk(path)
    file_cache[path] = content
    return content
```

### Cache de Prompts

Reutilize templates de prompts:

```json
{
  "skills": {
    "code-review": {
      "prompt_template": "Review this code for security issues: {code}"
    }
  }
}
```

### Cache de Resultados

Armazene em cache respostas de IA para consultas repetidas:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 1000
  }
}
```

---

## Processamento em Lote

### Processar Múltiplos Arquivos

Em vez de:
```
> Read file1.py
> Read file2.py
> Read file3.py
```

Use:
```
> Read all Python files in src/ and summarize their purposes
```

### Requisições Paralelas

```json
{
  "performance": {
    "parallelRequests": true,
    "maxConcurrent": 3
  }
}
```

---

## Gerenciamento da Janela de Contexto

### Monitore o Tamanho do Contexto

```
> /verbose
Context: 4523 tokens (15% of 32k limit)
```

### Otimize o Contexto

1. **Limpe o histórico** ao mudar de tópico
2. **Leia apenas arquivos necessários**
3. **Resuma conversas longas**
4. **Use subagentes** para tarefas isoladas

---

## Otimização de Rede

### Pool de Conexões

```json
{
  "providers": {
    "openai": {
      "keepAlive": true,
      "maxConnections": 5
    }
  }
}
```

### Agrupamento de Requisições

```json
{
  "performance": {
    "batchRequests": true,
    "batchSize": 10
  }
}
```

---

## Monitoramento de Performance

### Rastrear Métricas

```json
{
  "logging": {
    "performance": true,
    "tokenUsage": true,
    "responseTime": true
  }
}
```

### Analisar Logs

```bash
# Find slow requests
grep "response_time" opencode.log | awk '{print $NF}' | sort -n

# Calculate average tokens
grep "total_tokens" opencode.log | awk '{sum+=$NF} END {print sum/NR}'
```

---

## Practice Questions

```question
{
  "id": "oc-perf-q1",
  "type": "multiple-choice",
  "question": "What is the most effective way to reduce token usage?",
  "options": [
    "Use a smaller model",
    "Clear conversation regularly and be specific in prompts",
    "Disable caching",
    "Use only one provider"
  ],
  "correct": 1,
  "explanation": "Clearing conversation regularly and being specific in prompts reduces context size and token consumption."
}
```

```question
{
  "id": "oc-perf-q2",
  "type": "multiple-choice",
  "question": "Which model is best for quick, simple tasks?",
  "options": [
    "claude-opus-4-20250514",
    "gpt-4o",
    "gpt-4o-mini",
    "gemini-pro"
  ],
  "correct": 2,
  "explanation": "gpt-4o-mini is optimized for speed and cost, making it ideal for simple tasks where high quality isn't critical."
}
```

```question
{
  "id": "oc-perf-q3",
  "type": "multiple-choice",
  "question": "How does caching improve performance?",
  "options": [
    "It makes AI responses more accurate",
    "It reduces API calls by storing previous results",
    "It increases token limits",
    "It speeds up network connections"
  ],
  "correct": 1,
  "explanation": "Caching stores previous results so repeated queries don't require new API calls, reducing cost and latency."
}
```

```question
{
  "id": "oc-perf-q4",
  "type": "multiple-choice",
  "question": "What should you monitor to track performance?",
  "options": [
    "Only response time",
    "Token usage, response time, and cost",
    "Only errors",
    "Only network traffic"
  ],
  "correct": 1,
  "explanation": "Monitor token usage, response time, and cost to get a complete picture of performance."
}
```

```question
{
  "id": "oc-perf-q5",
  "type": "multiple-choice",
  "question": "How do you reduce context window usage?",
  "options": [
    "Use a larger model",
    "Clear conversation and read only necessary files",
    "Disable debug mode",
    "Use more agents"
  ],
  "correct": 1,
  "explanation": "Clearing conversation and reading only necessary files keeps context size manageable."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Limpe a conversa regularmente para reduzir o tamanho do contexto
- Seja específico nos prompts para minimizar o uso de tokens
- Use gpt-4o-mini para tarefas simples, gpt-4o para complexas
- Armazene em cache arquivos acessados frequentemente e templates de prompts
- Monitore uso de tokens, tempo de resposta e custo
- Processe múltiplos arquivos em lote em vez de ler um de cada vez
- A otimização de rede reduz a latência para chamadas de API
