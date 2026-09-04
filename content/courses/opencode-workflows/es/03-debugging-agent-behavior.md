---
title: "Depuración del Comportamiento de Agentes"
description: "Diagnostica y corrige problemas con los agentes de OpenCode. Aprende técnicas de depuración, análisis de registros y cómo rastrear el ciclo de vida de las solicitudes para identificar problemas."
order: 3
duration: "45 min"
difficulty: "intermediate"
---

# Depuración del Comportamiento de Agentes

## Modo de Depuración

Habilita el modo de depuración para ver información detallada:

```bash
opencode --debug
```

O configura la variable de entorno:

```bash
export OPENCODE_DEBUG=1
opencode
```

---

## Qué Muestra el Modo de Depuración

### Ciclo de Vida de la Solicitud

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

### Invocaciones de Herramientas

```
[DEBUG] Tool: read
[DEBUG] Arguments: {"path": "src/main.py"}
[DEBUG] Result: Success (234 bytes)

[DEBUG] Tool: edit
[DEBUG] Arguments: {"path": "src/main.py", "old": "...", "new": "..."}
[DEBUG] Result: Success
```

### Verificaciones de Permisos

```
[DEBUG] Permission check: bash tool
[DEBUG] Command: "npm test"
[DEBUG] Pattern: "npm *" → ALLOWED
[DEBUG] Permission granted
```

---

## Problemas Comunes y Soluciones

### Problema: Agente No Responde

**Síntomas:**
- Sin respuesta después de enviar un mensaje
- Largos retardos sin salida

**Pasos de Depuración:**

1. Verificar la validez de la clave API:
```bash
echo $OPENAI_API_KEY | head -c 10
```

2. Verificar la conectividad de red:
```bash
curl -I https://api.openai.com
```

3. Revisar registros de depuración para errores de timeout

**Solución:**
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

### Problema: Agente Equivocado Seleccionado

**Síntomas:**
- La solicitud va al agente equivocado
- El agente no entiende la tarea

**Pasos de Depuración:**

1. Revisar descripciones de agentes en la salida de depuración
2. Revisar reglas de enrutamiento
3. Probar coincidencia de patrones

**Solución:**
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

### Problema: Permiso Denegado

**Síntomas:**
- Errores de "Permiso denegado"
- Herramientas no se ejecutan

**Pasos de Depuración:**

1. Verificar reglas de permisos en la salida de depuración
2. Verificar coincidencia de patrones
3. Revisar el orden de deny vs allow

**Solución:**
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

## Análisis de Registros

### Niveles de Registro

| Nivel | Salida | Caso de Uso |
|-------|--------|----------|
| Predeterminado | Información básica | Operación normal |
| Depuración | Trazas detalladas | Solución de problemas |
| Detallado | Contenido completo | Depuración profunda |

### Habilitar Modo Detallado

```bash
opencode --verbose
```

O en sesión interactiva:

```
> /verbose
```

---

## Rastreando Solicitudes

### Rastreo Manual

Sigue esta lista de verificación para depuración manual:

1. **Verificar configuración**:
```bash
cat opencode.json | jq .
```

2. **Verificar clave API**:
```bash
echo "Key starts with: ${OPENAI_API_KEY:0:8}..."
```

3. **Probar API directamente**:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "test"}]}'
```

4. **Verificar salida de depuración**:
```bash
opencode --debug 2>&1 | grep -i error
```

---

## Depuración de Rendimiento

### Respuestas Lentas

**Causas:**
- Ventana de contexto grande
- Prompts complejos
- Latencia de red
- Limitación de tasa

**Soluciones:**

| Causa | Solución |
|-------|----------|
| Contexto grande | Limpiar conversación con `/clear` |
| Prompts complejos | Simplificar instrucciones |
| Latencia de red | Verificar conexión, usar región más cercana |
| Limitación de tasa | Agregar demoras, actualizar plan de API |

### Uso de Tokens

Monitorea el uso de tokens en la salida de depuración:

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

- Habilita el modo de depuración con el flag `--debug` o `OPENCODE_DEBUG=1`
- La salida de depuración muestra enrutamiento de agentes, selección de herramientas, permisos y ejecución
- Siempre verifica primero la validez de la clave API y la conectividad de red
- Usa `/clear` para reducir el tamaño del contexto cuando las respuestas son lentas
- El uso de tokens y estimaciones de costos aparecen en la salida de depuración
- Los niveles de registro se pueden ajustar para más o menos detalle
- El rastreo manual sigue un enfoque sistemático de lista de verificación
