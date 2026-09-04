---
title: "Gestión de Memoria y Contexto"
description: "Gestiona la memoria y el contexto en sesiones de OpenCode. Aprende cómo mantener estado entre conversaciones, usar archivos de memoria y optimizar el contexto para mejores resultados."
order: 5
duration: "45 min"
difficulty: "intermediate"
---

# Gestión de Memoria y Contexto

## Entendiendo el Contexto

El contexto es la información que la IA recuerda durante una sesión:

| Tipo de Contexto | Descripción | Persistencia |
|-------------|-------------|-------------|
| **Conversación** | Historial de chat | Solo sesión |
| **Contenido de Archivo** | Archivos leídos | Hasta que se limpie |
| **Proyecto** | Estructura del proyecto | Solo sesión |
| **Archivos de Memoria** | Almacenamiento persistente | Entre sesiones |

---

## Memoria de Conversación

### Ver Historial

```
> /history
```

### Guardar Sesión

```
> /save project-setup
```

### Cargar Sesión

```
> /load project-setup
```

### Limpiar Contexto

```
> /clear
```

---

## Archivos de Memoria

Los archivos de memoria persisten información entre sesiones.

### Memoria del Proyecto

Crea `.opencode/memory/project.md`:

```markdown
# Project Memory

## Architecture
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL

## Conventions
- Use camelCase for variables
- Use PascalCase for components
- All API endpoints prefixed with /api/

## Decisions
- 2024-01-15: Chose PostgreSQL over MongoDB for ACID compliance
```

### Memoria Personal

Crea `~/.config/opencode/memory/personal.md`:

```markdown
# Personal Memory

## Preferences
- Preferred model: gpt-4o
- Coding style: Functional programming
- Testing: Jest with 80% coverage minimum

## Shortcuts
- Use /clear between topics
- Always review AI suggestions before applying
```

---

## Cargando Memoria

### Carga Automática

Configura la carga automática en `opencode.json`:

```json
{
  "memory": {
    "autoLoad": [
      ".opencode/memory/project.md",
      ".opencode/memory/conventions.md"
    ]
  }
}
```

### Carga Manual

```
> Load the project memory file at .opencode/memory/project.md
```

---

## Optimización del Contexto

### Cuando el Contexto Se Vuelve Demasiado Grande

**Síntomas:**
- Respuestas lentas
- La IA olvida instrucciones tempranas
- Advertencias de límite de tokens

**Soluciones:**

1. **Limpiar y recargar elementos esenciales**:
```
> /clear
> Load .opencode/memory/project.md
> We're working on the authentication module
```

2. **Usar subagentes para tareas aisladas**:
```
> Have the test-agent write tests for the login function
```

3. **Resumir conversaciones largas**:
```
> Summarize what we've discussed so far into a memory file
```

### Gestión de la Ventana de Contexto

```
> /verbose
Context: 15234 tokens (47% of 32k limit)
```

**Mejores Prácticas:**

| Situación | Acción |
|-----------|--------|
| Contexto > 70% | Limpiar y recargar esenciales |
| Cambiar de tema | Limpiar conversación |
| Proyecto complejo | Usar archivos de memoria |
| Múltiples tareas | Usar subagentes |

---

## Estructura de Archivos de Memoria

### Formato Recomendado

```markdown
# [Memory Type] Memory

## [Section]
- Key point
- Key point

## [Section]
- Key point
```

### Convenciones de Nomenclatura

| Archivo | Propósito |
|------|---------|
| `project.md` | Arquitectura y decisiones del proyecto |
| `conventions.md` | Estándares y patrones de codificación |
| `decisions.md` | Registros de decisiones arquitectónicas |
| `todo.md` | Tareas actuales y prioridades |
| `learned.md` | Cosas aprendidas durante sesiones |

---

## Usando Memoria en Prompts

### Referenciar Memoria

```
> According to our project memory, what database are we using?
```

### Actualizar Memoria

```
> Update the project memory to note we've switched from MongoDB to PostgreSQL
```

### Crear desde Sesión

```
> Save our conversation about the API design to .opencode/memory/api-design.md
```

---

## Mejores Prácticas

### Higiene de Memoria

| Práctica | Beneficio |
|----------|---------|
| Actualizaciones regulares | Mantiene la memoria precisa |
| Secciones claras | Fácil de encontrar información |
| Fechas en decisiones | Rastrear evolución |
| Eliminar obsoleto | Previene confusión |

### Gestión del Contexto

| Práctica | Beneficio |
|----------|---------|
| Limpiar entre temas | Previene contaminación cruzada |
| Cargar solo esenciales | Reduce uso de tokens |
| Usar subagentes | Aísla tareas complejas |
| Monitorear tamaño del contexto | Evita límites |

---

## Practice Questions

```question
{
  "id": "oc-memory-q1",
  "type": "multiple-choice",
  "question": "Where should you store project-specific memory files?",
  "options": [
    "~/.config/opencode/memory/",
    ".opencode/memory/",
    "src/memory/",
    "tmp/memory/"
  ],
  "correct": 1,
  "explanation": "Project-specific memory files belong in .opencode/memory/ within the project directory."
}
```

```question
{
  "id": "oc-memory-q2",
  "type": "multiple-choice",
  "question": "What is the benefit of memory files over conversation history?",
  "options": [
    "They're faster to load",
    "They persist across sessions",
    "They use fewer tokens",
    "They're automatically updated"
  ],
  "correct": 1,
  "explanation": "Memory files persist across sessions, while conversation history is lost when the session ends."
}
```

```question
{
  "id": "oc-memory-q3",
  "type": "multiple-choice",
  "question": "When should you clear the conversation context?",
  "options": [
    "Never",
    "Only when switching topics",
    "Every 10 messages",
    "When responses are slow"
  ],
  "correct": 1,
  "explanation": "Clear conversation when switching topics to prevent cross-contamination between unrelated discussions."
}
```

```question
{
  "id": "oc-memory-q4",
  "type": "multiple-choice",
  "question": "What should you do when context exceeds 70% of the limit?",
  "options": [
    "Use a larger model",
    "Clear and reload only essentials",
    "Add more memory files",
    "Restart OpenCode"
  ],
  "correct": 1,
  "explanation": "When context gets too large, clear it and reload only the essential memory files needed for the current task."
}
```

```question
{
  "id": "oc-memory-q5",
  "type": "multiple-choice",
  "question": "How do you update memory files during a session?",
  "options": [
    "Edit them manually outside OpenCode",
    "Ask OpenCode to update them",
    "Memory files cannot be updated",
    "Use the /memory-update command"
  ],
  "correct": 1,
  "explanation": "You can ask OpenCode to update memory files, and it will use the edit tool to make changes."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Los archivos de memoria persisten información entre sesiones, a diferencia del historial de conversación
- Almacena la memoria del proyecto en `.opencode/memory/` dentro del proyecto
- Limpia la conversación al cambiar de tema para prevenir contaminación cruzada
- Monitorea el tamaño del contexto y recarga esenciales cuando excede el 70%
- Usa secciones descriptivas en los archivos de memoria para fácil recuperación
- Los archivos de memoria deben tener fechas y actualizarse regularmente
- Los subagentes ayudan a aislar tareas complejas del contexto principal
