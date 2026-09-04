---
title: "Integración de Proveedor Personalizado"
description: "Integra proveedores LLM personalizados con OpenCode. Aprende la API del proveedor, patrones de autenticación, respuestas en streaming y cómo agregar soporte para nuevos servicios de IA."
order: 5
duration: "60 min"
difficulty: "advanced"
---

# Integración de Proveedor Personalizado

## Arquitectura del Proveedor

```mermaid
flowchart TD
    A[Núcleo OpenCode] --> B[Interfaz del Proveedor]
    B --> C[Adaptador OpenAI]
    B --> D[Adaptador Anthropic]
    B --> E[Adaptador Personalizado]
    E --> F[Tu API]
```

---

## Interfaz del Proveedor

### Métodos Requeridos

```typescript
interface LLMProvider {
  name: string;
  models: string[];
  
  initialize(config: ProviderConfig): Promise<void>;
  
  chat(request: ChatRequest): Promise<ChatResponse>;
  
  stream(request: ChatRequest): AsyncGenerator<ChatChunk>;
  
  validate(apiKey: string): Promise<boolean>;
}
```

### Estructura de Solicitud

```typescript
interface ChatRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}
```

### Estructura de Respuesta

```typescript
interface ChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}
```

---

## Creando un Proveedor Personalizado

### Paso 1: Crear Directorio del Proveedor

```bash
mkdir -p .opencode/providers/my-provider
cd .opencode/providers/my-provider
npm init -y
```

### Paso 2: Implementar el Proveedor

Crear `src/index.ts`:

```typescript
import { LLMProvider, ChatRequest, ChatResponse, ChatChunk } from "opencode";

export default class MyProvider implements LLMProvider {
  name = "my-provider";
  models = ["my-model-1", "my-model-2"];
  
  private apiKey: string;
  private baseUrl: string;

  async initialize(config: any) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.my-provider.com";
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens
      })
    });

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      },
      model: request.model
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: true
      })
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n").filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          
          try {
            const parsed = JSON.parse(data);
            yield {
              content: parsed.choices[0]?.delta?.content || "",
              done: false
            };
          } catch {}
        }
      }
    }
  }

  async validate(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### Paso 3: Registrar el Proveedor

Agregar a `opencode.json`:

```json
{
  "providers": {
    "my-provider": {
      "path": ".opencode/providers/my-provider",
      "apiKey": "${MY_PROVIDER_API_KEY}",
      "baseUrl": "https://api.my-provider.com"
    }
  }
}
```

---

## Patrones de Autenticación

### API Key

```json
{
  "providers": {
    "my-provider": {
      "apiKey": "${MY_PROVIDER_API_KEY}"
    }
  }
}
```

### OAuth2

```json
{
  "providers": {
    "my-provider": {
      "oauth": {
        "clientId": "${CLIENT_ID}",
        "clientSecret": "${CLIENT_SECRET}",
        "tokenUrl": "https://auth.my-provider.com/token"
      }
    }
  }
}
```

### Headers Personalizados

```typescript
async chat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(this.baseUrl, {
    headers: {
      "X-API-Key": this.apiKey,
      "X-Custom-Header": "value"
    }
  });
}
```

---

## Respuestas en Streaming

### Server-Sent Events (SSE)

```typescript
async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
  const response = await fetch(this.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true })
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        yield { content: data.content, done: false };
      }
    }
  }
}
```

### WebSocket

```typescript
async *stream(request: ChatRequest): AsyncGenerator<ChatChunk> {
  const ws = new WebSocket("wss://api.my-provider.com/stream");
  
  ws.onopen = () => {
    ws.send(JSON.stringify(request));
  };

  while (true) {
    const message = await new Promise<any>((resolve) => {
      ws.onmessage = (event) => resolve(JSON.parse(event.data));
    });

    if (message.done) {
      ws.close();
      return;
    }

    yield { content: message.content, done: false };
  }
}
```

---

## Probando Proveedores Personalizados

### Pruebas Unitarias

```typescript
import MyProvider from "../src/index";

describe("MyProvider", () => {
  let provider: MyProvider;

  beforeEach(() => {
    provider = new MyProvider();
    provider.initialize({ apiKey: "test-key" });
  });

  it("debería retornar respuesta", async () => {
    const response = await provider.chat({
      model: "my-model-1",
      messages: [{ role: "user", content: "Hello" }]
    });

    expect(response.content).toBeDefined();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });
});
```

### Pruebas de Integración

```bash
npm test
```

---

## Mejores Prácticas

| Práctica | Razón |
|----------|-------|
| **Manejo de errores** | Degradación elegante |
| **Lógica de reintento** | Manejar fallos transitorios |
| **Manejo de timeouts** | Prevenir bloqueos |
| **Soporte de streaming** | Mejor experiencia de usuario |
| **Seguimiento de costos** | Gestión de presupuesto |

---

## Practice Questions

```question
{
  "id": "oc-provider-q1",
  "type": "multiple-choice",
  "question": "¿Qué métodos debe implementar un proveedor personalizado?",
  "options": [
    "Solo chat()",
    "chat(), stream() y validate()",
    "Solo initialize()",
    "Solo chat() y stream()"
  ],
  "correct": 1,
  "explanation": "Un proveedor completo implementa chat(), stream() y validate() para funcionalidad completa."
}
```

```question
{
  "id": "oc-provider-q2",
  "type": "multiple-choice",
  "question": "¿Cuál es el beneficio de las respuestas en streaming?",
  "options": [
    "Costo más bajo",
    "Mejor experiencia de usuario con salida progresiva",
    "Completado más rápido",
    "Implementación más simple"
  ],
  "correct": 1,
  "explanation": "El streaming proporciona salida progresiva, mejorando el rendimiento percibido y la experiencia del usuario."
}
```

```question
{
  "id": "oc-provider-q3",
  "type": "multiple-choice",
  "question": "¿Cómo registras un proveedor personalizado?",
  "options": [
    "En skill.yaml",
    "En opencode.json bajo la clave providers",
    "En package.json",
    "En un archivo de configuración separado"
  ],
  "correct": 1,
  "explanation": "Los proveedores personalizados se registran en opencode.json bajo la clave providers con ruta y configuración."
}
```

```question
{
  "id": "oc-provider-q4",
  "type": "multiple-choice",
  "question": "¿Qué debe hacer el método validate()?",
  "options": [
    "Probar la funcionalidad de chat",
    "Verificar que la API key es válida",
    "Verificar la conectividad de red",
    "Todo lo anterior"
  ],
  "correct": 1,
  "explanation": "El método validate() debe verificar que la API key es válida y que el proveedor es accesible."
}
```

```question
{
  "id": "oc-provider-q5",
  "type": "multiple-choice",
  "question": "¿Para qué se usa el campo usage de ChatResponse?",
  "options": [
    "Depuración",
    "Seguimiento de costos y gestión de presupuesto",
    "Registro",
    "Monitoreo de rendimiento"
  ],
  "correct": 1,
  "explanation": "El campo usage rastrea el consumo de tokens para seguimiento de costos y gestión de presupuesto."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Los proveedores personalizados implementan métodos chat(), stream() y validate()
- Las respuestas en streaming mejoran la experiencia del usuario con salida progresiva
- Registra proveedores en opencode.json bajo la clave providers
- Soporta múltiples patrones de autenticación: API key, OAuth2, headers personalizados
- Maneja errores elegantemente con lógica de reintento y timeouts
- Rastrea uso de tokens para gestión de costos
- Prueba proveedores con pruebas unitarias y de integración