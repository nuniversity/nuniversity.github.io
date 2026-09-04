---
title: "Configuración Básica con opencode.json"
description: "Configura OpenCode usando opencode.json. Aprende el esquema de configuración, agentes, proveedores, permisos y cómo personalizar el comportamiento para tus proyectos."
order: 5
duration: "45 min"
difficulty: "beginner"
---

# Configuración Básica con opencode.json

## Ubicaciones del Archivo de Configuración

OpenCode busca la configuración en este orden:

| Prioridad | Ubicación | Propósito |
|----------|----------|---------|
| 1 | `.opencode/config.json` | Específico del proyecto (preferido) |
| 2 | `opencode.json` | Específico del proyecto (heredado) |
| 3 | `~/.config/opencode/config.json` | Valores predeterminados del usuario |

> [!TIP]
> Para nuevos proyectos, use `.opencode/config.json`. El `opencode.json` raíz se mantiene por compatibilidad.

---

## Estructura Básica de Configuración

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {},
  "providers": {},
  "permissions": [],
  "skills": {}
}
```

---

## Configurando Agentes

Los agentes son asistentes de IA con modelos y comportamientos específicos.

### Agente Simple

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Asistente de codificación de propósito general"
    }
  }
}
```

### Múltiples Agentes

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Asistente de codificación de propósito general"
    },
    "reviewer": {
      "model": "claude-sonnet-4-20250514",
      "description": "Especialista en revisión de código"
    },
    "fast": {
      "model": "gpt-4o-mini",
      "description": "Tareas rápidas y preguntas simples"
    }
  }
}
```

### Agente con Indicación Personalizada

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Ingeniero de software senior",
      "prompt": "You are a senior software engineer with 10+ years of experience. Focus on clean, maintainable code. Always consider edge cases and error handling."
    }
  }
}
```

---

## Configurando Proveedores

Los proveedores definen cómo OpenCode se conecta a servicios LLM.

### OpenAI

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o"
    }
  }
}
```

### Anthropic

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "model": "claude-sonnet-4-20250514"
    }
  }
}
```

### Múltiples Proveedores

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    },
    "google": {
      "apiKey": "${GOOGLE_API_KEY}"
    }
  }
}
```

---

## Configurando Permisos

Los permisos controlan qué acciones pueden realizar los agentes.

### Permisos Básicos

```json
{
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *", "pip *"],
      "deny": ["rm -rf /", "sudo *"]
    },
    {
      "tool": "write",
      "allow": ["src/**", "docs/**"],
      "deny": [".env", "secrets/**"]
    }
  ]
}
```

### Reglas de Permisos

| Regla | Descripción |
|------|-------------|
| `tool` | La herramienta a controlar |
| `allow` | Patrones que están permitidos |
| `deny` | Patrones que están bloqueados |
| Orden | Las reglas de denegación se verifican primero |

---

## Configurando Habilidades

Las habilidades son paquetes de instrucciones reutilizables.

```json
{
  "skills": {
    "react-component": {
      "manifest": "skills/react-component/skill.yaml",
      "autoLoad": true,
      "matchPattern": "react component|jsx"
    },
    "python-helper": {
      "manifest": "skills/python-helper/skill.yaml",
      "autoLoad": false
    }
  }
}
```

| Opción | Descripción |
|--------|-------------|
| `manifest` | Ruta al archivo de manifiesto de la habilidad |
| `autoLoad` | Cargar automáticamente cuando el patrón coincida |
| `matchPattern` | Patrón regex para activar la carga automática |

---

## Configurando Servidores MCP

Los servidores MCP conectan OpenCode con herramientas y servicios externos.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["mcp-server-fs.js"],
      "env": {
        "ALLOWED_PATHS": "/home/user/projects"
      }
    },
    "database": {
      "command": "python",
      "args": ["mcp-server-db.py"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

---

## Ejemplo Completo

Aquí hay un `opencode.json` completo para un proyecto típico:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Asistente principal de codificación",
      "prompt": "You are a senior developer. Focus on clean, testable code."
    },
    "reviewer": {
      "model": "claude-sonnet-4-20250514",
      "description": "Especialista en revisión de código"
    }
  },
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  },
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *", "pytest *"],
      "deny": ["rm -rf *", "sudo *"]
    },
    {
      "tool": "write",
      "allow": ["src/**", "tests/**", "docs/**"],
      "deny": [".env", "secrets/**", "*.key"]
    }
  ],
  "skills": {
    "customize-opencode": {
      "manifest": ".opencode/skills/customize-opencode/skill.yaml"
    }
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## Validación

OpenCode valida su configuración al iniciar. Errores comunes:

| Error | Causa | Solución |
|-------|-------|----------|
| "Invalid JSON" | Error de sintaxis | Verifique el formato JSON |
| "Unknown provider" | Proveedor no soportado | Consulte la documentación del proveedor |
| "Invalid model" | Nombre de modelo incorrecto | Verifique que el modelo exista |
| "Permission conflict" | Reglas superpuestas | Revise el orden de permisos |

---

## Sustitución de Variables de Entorno

Use `${VARIABLE_NAME}` para referenciar variables de entorno:

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    }
  }
}
```

Esto mantiene los datos sensibles fuera de sus archivos de configuración.

---

## Practice Questions

```question
{
  "id": "oc-config-q1",
  "type": "multiple-choice",
  "question": "¿Qué ubicación de configuración se recomienda para nuevos proyectos?",
  "options": [
    "opencode.json en la raíz del proyecto",
    ".opencode/config.json",
    "~/.config/opencode/config.json",
    "~/.opencode/config.json"
  ],
  "correct": 1,
  "explanation": ".opencode/config.json es la ubicación recomendada para nuevos proyectos ya que mantiene la configuración organizada y puede ser controlada selectivamente."
}
```

```question
{
  "id": "oc-config-q2",
  "type": "multiple-choice",
  "question": "¿Cómo se referencian las variables de entorno en opencode.json?",
  "options": [
    "{{VARIABLE}}",
    "$VARIABLE",
    "${VARIABLE}",
    "%VARIABLE%"
  ],
  "correct": 2,
  "explanation": "Use la sintaxis ${VARIABLE_NAME} para referenciar variables de entorno en opencode.json, lo cual mantiene los datos sensibles fuera de los archivos de configuración."
}
```

```question
{
  "id": "oc-config-q3",
  "type": "multiple-choice",
  "question": "¿Qué sucede cuando un comando de permiso coincide con reglas de permitir y denegar?",
  "options": [
    "Permitir tiene precedencia",
    "Denegar tiene precedencia",
    "La primera regla gana",
    "Se lanza un error"
  ],
  "correct": 1,
  "explanation": "Las reglas de denegación se verifican primero. Si un comando coincide con patrones de permitir y denegar, la regla de denegar tiene precedencia por seguridad."
}
```

```question
{
  "id": "oc-config-q4",
  "type": "multiple-choice",
  "question": "¿Qué hace la opción autoLoad para las habilidades?",
  "options": [
    "Carga la habilidad al iniciar",
    "Carga la habilidad cuando el patrón coincide",
    "Carga la habilidad manualmente",
    "Deshabilita la habilidad"
  ],
  "correct": 1,
  "explanation": "Cuando autoLoad es true, la habilidad se carga automáticamente cuando la entrada del usuario coincide con la expresión regular matchPattern."
}
```

```question
{
  "id": "oc-config-q5",
  "type": "multiple-choice",
  "question": "¿Qué campo es requerido para definir un agente?",
  "options": [
    "model y prompt",
    "model y description",
    "name y version",
    "model y constraints"
  ],
  "correct": 1,
  "explanation": "Un agente requiere al menos un model (qué LLM usar) y un description (usado para enrutamiento). Todos los demás campos son opcionales."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Use `.opencode/config.json` para nuevos proyectos (preferido sobre `opencode.json` raíz)
- Los agentes requieren al menos los campos `model` y `description`
- Las variables de entorno se referencian usando la sintaxis `${VARIABLE_NAME}`
- Las reglas de denegar siempre tienen precedencia sobre las reglas de permitir en permisos
- Las habilidades pueden cargarse automáticamente cuando la entrada del usuario coincide con un patrón
- Los servidores MCP se ejecutan como procesos separados y comunican a través de JSON-RPC
- OpenCode valida su configuración al iniciar y reporta errores