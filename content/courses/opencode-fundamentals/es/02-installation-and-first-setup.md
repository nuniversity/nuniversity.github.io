---
title: "Instalación y Primera Configuración"
description: "Instala OpenCode en tu sistema y configúralo con tu primer proveedor LLM. Configura claves API, verifica la instalación y ejecuta tu primer comando."
order: 2
duration: "30 min"
difficulty: "beginner"
---

# Instalación y Primera Configuración

## Prerrequisitos

Antes de instalar OpenCode, asegúrese de tener:

| Requisito | Versión Mínima | Cómo Verificar |
|------------|-----------------|--------------|
| Node.js | 18.0+ | `node --version` |
| npm | 8.0+ | `npm --version` |
| Git | 2.0+ | `git --version` |

> [!NOTE]
> OpenCode es una aplicación Node.js distribuida a través de npm. Funciona en macOS, Linux y Windows.

---

## Instalación

### Usando npm (Recomendado)

```bash
npm install -g opencode
```

### Usando yarn

```bash
yarn global add opencode
```

### Usando pnpm

```bash
pnpm add -g opencode
```

### Verificar Instalación

```bash
opencode --version
```

Salida esperada:
```
opencode v1.x.x
```

> [!TIP]
> Si ve "command not found", asegúrese de que el directorio bin global de npm esté en su PATH.

---

## Configuración Inicial

### Paso 1: Crear Directorio de Configuración

```bash
mkdir -p .opencode
```

### Paso 2: Crear opencode.json

Cree `opencode.json` en la raíz de su proyecto:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Asistente de codificación de propósito general"
    }
  }
}
```

### Paso 3: Configurar Claves API

Cree un archivo `.env` en la raíz de su proyecto:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Google (opcional)
GOOGLE_API_KEY=your-google-api-key-here
```

> [!WARNING]
> Nunca envíe claves API a control de versiones. Agregue `.env` a su archivo `.gitignore`.

---

## Configuración de Proveedor

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

### Google

```json
{
  "providers": {
    "google": {
      "apiKey": "${GOOGLE_API_KEY}",
      "model": "gemini-pro"
    }
  }
}
```

---

## Primera Ejecución

### Iniciar OpenCode

```bash
opencode
```

Debería ver:

```
OpenCode v1.x.x
Type your message or /help for commands
>
```

### Probar la Conexión

Escriba un mensaje simple:

```
> Hola, ¿puedes ayudarme con mi código?
```

Si es exitoso, la IA responderá con un saludo y preguntará cómo puede ayudar.

---

## Ubicaciones del Archivo de Configuración

OpenCode busca la configuración en este orden:

| Prioridad | Ubicación | Propósito |
|----------|----------|---------|
| 1 | `.opencode/config.json` | Específico del proyecto (preferido) |
| 2 | `opencode.json` | Específico del proyecto (heredado) |
| 3 | `~/.config/opencode/config.json` | Valores predeterminados del usuario |

> [!TIP]
> Use `.opencode/config.json` para proyectos de equipo. Puede controlar selectivamente la versión mientras mantiene los datos sensibles en `.env`.

---

## Comandos Básicos

| Comando | Descripción |
|---------|-------------|
| `opencode` | Iniciar sesión interactiva |
| `opencode --version` | Mostrar versión |
| `opencode --help` | Mostrar ayuda |
| `opencode config` | Abrir configuración |
| `opencode providers` | Listar proveedores disponibles |

---

## Solución de Problemas

### Problemas Comunes

| Problema | Causa | Solución |
|-------|-------|----------|
| "Command not found" | npm PATH no configurado | Ejecute `npm config get prefix` y agregue al PATH |
| "Invalid API key" | Formato de clave incorrecto | Verifique que la clave comience con `sk-` (OpenAI) o `sk-ant-` (Anthropic) |
| "Rate limit exceeded" | Demasiadas solicitudes | Espere o mejore su plan de API |
| "Model not found" | Nombre de modelo incorrecto | Consulte la documentación del proveedor para nombres de modelo válidos |

---

## Practice Questions

```question
{
  "id": "oc-install-q1",
  "type": "multiple-choice",
  "question": "¿Cuál es la versión mínima de Node.js requerida para OpenCode?",
  "options": [
    "14.0+",
    "16.0+",
    "18.0+",
    "20.0+"
  ],
  "correct": 2,
  "explanation": "OpenCode requiere Node.js versión 18.0 o superior para un rendimiento y compatibilidad óptimos."
}
```

```question
{
  "id": "oc-install-q2",
  "type": "multiple-choice",
  "question": "¿Dónde debe almacenar las claves API para OpenCode?",
  "options": [
    "En el archivo opencode.json",
    "En variables de entorno o archivo .env",
    "En un archivo config.json",
    "Directamente en su código"
  ],
  "correct": 1,
  "explanation": "Las claves API deben almacenarse en variables de entorno o un archivo .env, nunca en código o archivos de configuración que puedan ser enviados a control de versiones."
}
```

```question
{
  "id": "oc-install-q3",
  "type": "multiple-choice",
  "question": "¿Qué ubicación de archivo de configuración se recomienda para proyectos de equipo?",
  "options": [
    "opencode.json en la raíz del proyecto",
    ".opencode/config.json",
    "~/.config/opencode/config.json",
    "~/.opencode/config.json"
  ],
  "correct": 1,
  "explanation": ".opencode/config.json es preferido para proyectos de equipo porque puede ser controlado selectivamente mientras mantiene los datos sensibles separados."
}
```

```question
{
  "id": "oc-install-q4",
  "type": "multiple-choice",
  "question": "¿Qué comando inicia una sesión interactiva de OpenCode?",
  "options": [
    "opencode start",
    "opencode run",
    "opencode",
    "opencode init"
  ],
  "correct": 2,
  "explanation": "Ejecutar 'opencode' sin argumentos inicia una sesión interactiva donde puede escribir mensajes y recibir respuestas de IA."
}
```

```question
{
  "id": "oc-install-q5",
  "type": "multiple-choice",
  "question": "¿Qué gestores de paquetes se pueden usar para instalar OpenCode?",
  "options": [
    "Solo npm",
    "Solo npm y yarn",
    "npm, yarn y pnpm",
    "pip y npm"
  ],
  "correct": 2,
  "explanation": "OpenCode se puede instalar usando npm, yarn o pnpm — los tres son gestores de paquetes soportados."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- OpenCode requiere Node.js 18+ y se puede instalar a través de npm, yarn o pnpm
- La configuración se almacena en `opencode.json` o `.opencode/config.json`
- Las claves API deben almacenarse en variables de entorno o archivos `.env`
- La ubicación `.opencode/config.json` es preferida para proyectos de equipo
- Ejecute `opencode` para iniciar una sesión interactiva
- Se soportan múltiples proveedores LLM (OpenAI, Anthropic, Google)