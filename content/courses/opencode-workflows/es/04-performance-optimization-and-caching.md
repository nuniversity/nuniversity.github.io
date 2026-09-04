---
title: "Optimización de Rendimiento y Caché"
description: "Optimiza OpenCode para velocidad y eficiencia de costos. Aprende estrategias de caché, optimización de tokens, selección de modelos y cómo reducir llamadas a la API manteniendo la calidad."
order: 4
duration: "45 min"
difficulty: "intermediate"
---

# Optimización de Rendimiento y Caché

## ¿Por Qué Optimizar?

| Métrica | Impacto |
|--------|--------|
| **Tiempo de Respuesta** | Flujo de trabajo de desarrollo más rápido |
| **Uso de Tokens** | Costos de API más bajos |
| **Calidad** | Mejores resultados con menos sobrecarga |
| **Escalabilidad** | Manejar proyectos más grandes |

---

## Optimización de Tokens

### Entendiendo los Tokens

Los tokens son las unidades básicas que procesan los LLMs:

| Contenido | Tokens Aproximados |
|---------|-------------------|
| 1 palabra | 1-2 tokens |
| 1 línea de código | 5-15 tokens |
| 1 archivo (100 líneas) | 500-1500 tokens |

### Reducir Uso de Tokens

1. **Limpiar conversación regularmente**:
```
> /clear
```

2. **Ser específico en los prompts**:
```
❌ "Fix the bug"
✅ "Fix the ZeroDivisionError in calculate_average() when list is empty"
```

3. **Leer solo archivos relevantes**:
```
❌ "Read all files in src/"
✅ "Read src/utils.py"
```

4. **Usar grep antes de leer**:
```
> Search for "TODO" in src/ before reading entire files
```

---

## Estrategia de Selección de Modelos

| Tarea | Modelo | Razón |
|------|-------|--------|
| Preguntas simples | gpt-4o-mini | Rápido, económico |
| Generación de código | gpt-4o | Equilibrado |
| Razonamiento complejo | claude-sonnet-4-20250514 | Alta calidad |
| Revisión de código | claude-sonnet-4-20250514 | Análisis exhaustivo |
| Ediciones rápidas | gpt-4o-mini | Velocidad |

### Configuración

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

## Estrategias de Caché

### Caché de Contenido de Archivos

Almacena en caché archivos frecuentemente accedidos:

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

### Caché de Prompts

Reutiliza plantillas de prompts:

```json
{
  "skills": {
    "code-review": {
      "prompt_template": "Review this code for security issues: {code}"
    }
  }
}
```

### Caché de Resultados

Almacena en caché respuestas de IA para consultas repetidas:

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

## Procesamiento por Lotes

### Procesar Múltiples Archivos

En lugar de:
```
> Read file1.py
> Read file2.py
> Read file3.py
```

Usa:
```
> Read all Python files in src/ and summarize their purposes
```

### Solicitudes Paralelas

```json
{
  "performance": {
    "parallelRequests": true,
    "maxConcurrent": 3
  }
}
```

---

## Gestión de la Ventana de Contexto

### Monitorear Tamaño del Contexto

```
> /verbose
Context: 4523 tokens (15% of 32k limit)
```

### Optimizar Contexto

1. **Limpiar historial** al cambiar de tema
2. **Leer solo archivos necesarios**
3. **Resumir conversaciones largas**
4. **Usar subagentes** para tareas aisladas

---

## Optimización de Red

### Agrupación de Conexiones

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

### Agrupación de Solicitudes

```json
{
  "performance": {
    "batchRequests": true,
    "batchSize": 10
  }
}
```

---

## Monitoreo de Rendimiento

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

### Analizar Registros

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

- Limpia la conversación regularmente para reducir el tamaño del contexto
- Sé específico en los prompts para minimizar el uso de tokens
- Usa gpt-4o-mini para tareas simples, gpt-4o para las complejas
- Almacena en caché archivos accedidos frecuentemente y plantillas de prompts
- Monitorea el uso de tokens, tiempo de respuesta y costos
- Procesa múltiples archivos por lotes en lugar de leer uno por uno
- La optimización de red reduce la latencia para llamadas a la API
