---
title: "Comprendiendo la Interfaz CLI"
description: "Domina la interfaz de línea de comandos de OpenCode. Aprende todos los comandos disponibles, indicadores, opciones y cómo navegar la sesión interactivamente de manera efectiva."
order: 4
duration: "30 min"
difficulty: "beginner"
---

# Comprendiendo la Interfaz CLI

## Estructura de Comandos

OpenCode sigue una estructura CLI estándar:

```bash
opencode [command] [options] [arguments]
```

---

## Comandos Principales

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `opencode` | Iniciar sesión interactiva | `opencode` |
| `opencode chat` | Iniciar sesión de chat | `opencode chat` |
| `opencode run` | Ejecutar una sola indicación | `opencode run "fix the bug"` |
| `opencode config` | Gestionar configuración | `opencode config list` |
| `opencode providers` | Listar proveedores LLM | `opencode providers` |
| `opencode skills` | Listar habilidades disponibles | `opencode skills` |
| `opencode version` | Mostrar versión | `opencode --version` |

---

## Comandos de Sesión Interactiva

Una vez en una sesión interactiva, use estos comandos:

### Navegación

| Comando | Descripción |
|---------|-------------|
| `/help` | Mostrar todos los comandos disponibles |
| `/quit` o `/exit` | Salir de OpenCode |
| `/clear` | Limpiar conversación actual |
| `/history` | Ver historial de conversación |
| `/save [name]` | Guardar sesión en archivo |
| `/load [name]` | Cargar sesión guardada |

### Gestión de Sesión

| Comando | Descripción |
|---------|-------------|
| `/model [name]` | Cambiar modelo LLM |
| `/agent [name]` | Cambiar agente |
| `/skill [name]` | Cargar una habilidad específica |
| `/debug` | Alternar modo de depuración |
| `/verbose` | Alternar salida detallada |

---

## Opciones de Línea de Comandos

### Opciones Globales

| Opción | Descripción |
|--------|-------------|
| `-h, --help` | Mostrar ayuda |
| `-v, --version` | Mostrar versión |
| `-c, --config [path]` | Especificar archivo de configuración |
| `-p, --provider [name]` | Establecer proveedor LLM |
| `-m, --model [name]` | Establecer modelo |
| `--debug` | Habilitar modo de depuración |
| `--verbose` | Habilitar salida detallada |

### Opciones del Comando Run

| Opción | Descripción |
|--------|-------------|
| `-f, --file [path]` | Leer entrada desde archivo |
| `-o, --output [path]` | Escribir salida a archivo |
| `--no-color` | Deshabilitar salida coloreada |
| `--timeout [ms]` | Establecer tiempo de espera en milisegundos |

---

## Patrones de Uso de Ejemplo

### Ejecución de Una Sola Indicación

```bash
opencode run "Explain what this function does"
```

### Leer desde Archivo

```bash
opencode run -f question.txt
```

### Escribir a Archivo

```bash
opencode run -o answer.md "Write a README for this project"
```

### Modo de Depuración

```bash
opencode --debug
```

La salida de depuración muestra:
- Solicitudes y respuestas de API
- Invocaciones de herramientas
- Verificaciones de permisos
- Decisiones de enrutamiento de agentes

---

## Completado con Tabulador

OpenCode soporta completado con tabulador para:

- Comandos (`/he` → `/help`)
- Rutas de archivos (`/read src/ma` → `/read src/main.py`)
- Nombres de modelos (`/model gpt` → `/model gpt-4o`)

---

## Atajos de Teclado

| Atajo | Acción |
|----------|--------|
| `Enter` | Enviar mensaje |
| `Ctrl+C` | Cancelar operación actual |
| `Ctrl+D` | Salir de sesión |
| `Ctrl+L` | Limpiar pantalla |
| `Flecha Arriba` | Comando anterior |
| `Flecha Abajo` | Siguiente comando |
| `Tab` | Autocompletado |

---

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `OPENCODE_CONFIG` | Ruta al archivo de configuración |
| `OPENCODE_PROVIDER` | Proveedor LLM predeterminado |
| `OPENCODE_MODEL` | Modelo predeterminado |
| `OPENCODE_DEBUG` | Habilitar modo de depuración |
| `OPENAI_API_KEY` | Clave API de OpenAI |
| `ANTHROPIC_API_KEY` | Clave API de Anthropic |
| `GOOGLE_API_KEY` | Clave API de Google |

---

## Practice Questions

```question
{
  "id": "oc-cli-q1",
  "type": "multiple-choice",
  "question": "¿Qué comando ejecuta OpenCode con una sola indicación sin entrar en modo interactivo?",
  "options": [
    "opencode start",
    "opencode exec",
    "opencode run",
    "opencode once"
  ],
  "correct": 2,
  "explanation": "El comando 'opencode run' ejecuta una sola indicación y devuelve el resultado sin iniciar una sesión interactiva."
}
```

```question
{
  "id": "oc-cli-q2",
  "type": "multiple-choice",
  "question": "¿Qué opción habilita el modo de depuración desde la línea de comandos?",
  "options": [
    "--verbose",
    "--debug",
    "--trace",
    "--log"
  ],
  "correct": 1,
  "explanation": "El indicador --debug habilita el modo de depuración, que muestra información detallada sobre solicitudes de API, invocaciones de herramientas y decisiones de enrutamiento."
}
```

```question
{
  "id": "oc-cli-q3",
  "type": "multiple-choice",
  "question": "¿Cómo cambia de modelos durante una sesión interactiva?",
  "options": [
    "/use model-name",
    "/switch model-name",
    "/model model-name",
    "/set model model-name"
  ],
  "correct": 2,
  "explanation": "El comando /model cambia el modelo activo durante una sesión interactiva."
}
```

```question
{
  "id": "oc-cli-q4",
  "type": "multiple-choice",
  "question": "¿Qué atajo de teclado cancela la operación actual?",
  "options": [
    "Ctrl+Z",
    "Ctrl+C",
    "Ctrl+X",
    "Esc"
  ],
  "correct": 1,
  "explanation": "Ctrl+C cancela la operación actual, lo cual es útil cuando una respuesta de IA está tomando demasiado tiempo."
}
```

```question
{
  "id": "oc-cli-q5",
  "type": "multiple-choice",
  "question": "¿Qué hace el indicador -f en el comando run?",
  "options": [
    "Establece el formato de salida",
    "Lee la entrada desde un archivo",
    "Filtra la salida",
    "Fuerza la sobrescritura"
  ],
  "correct": 1,
  "explanation": "El indicador -f lee la entrada desde un archivo en lugar de requerir que escriba la indicación directamente."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- OpenCode soporta modos de ejecución tanto interactivos como de una sola indicación
- Use `/help` en modo interactivo para ver todos los comandos disponibles
- El indicador `--debug` muestra información detallada sobre las operaciones de IA
- El completado con tabulador funciona para comandos, rutas de archivos y nombres de modelos
- Las variables de entorno pueden configurar valores predeterminados para proveedor y modelo
- Los atajos de teclado proporcionan acceso rápido a acciones comunes
- El indicador `-f` permite leer indicaciones desde archivos para procesamiento por lotes