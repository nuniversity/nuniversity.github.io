---
title: "Integração de Provider Personalizado"
description: "Integre providers de LLM personalizados com o OpenCode. Aprenda a API de providers, padrões de autenticação, respostas em streaming e como adicionar suporte para novos serviços de IA."
order: 5
duration: "60 min"
difficulty: "advanced"
---

# Integração de Provider Personalizado

## Arquitetura do Provider

```mermaid
flowchart TD
    A[OpenCode Core] --> B[Provider Interface]
    B --> C[OpenAI Adapter]
    B --> D[Anthropic Adapter]
    B --> E[Custom Adapter]
    E --> F[Your API]
```

---

## Interface do Provider

### Métodos Obrigatórios

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

### Estrutura da Requisição

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

### Estrutura da Resposta

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

## Criando um Provider Personalizado

### Passo 1: Criar Diretório do Provider

```bash
mkdir -p .opencode/providers/my-provider
cd .opencode/providers/my-provider
npm init -y
```

### Passo 2: Implementar o Provider

Crie `src/index.ts`:

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

### Passo 3: Registrar o Provider

Adicione ao `opencode.json`:

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

## Padrões de Autenticação

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

## Respostas em Streaming

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

## Testando Providers Personalizados

### Testes Unitários

```typescript
import MyProvider from "../src/index";

describe("MyProvider", () => {
  let provider: MyProvider;

  beforeEach(() => {
    provider = new MyProvider();
    provider.initialize({ apiKey: "test-key" });
  });

  it("should return response", async () => {
    const response = await provider.chat({
      model: "my-model-1",
      messages: [{ role: "user", content: "Hello" }]
    });

    expect(response.content).toBeDefined();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });
});
```

### Testes de Integração

```bash
npm test
```

---

## Melhores Práticas

| Prática | Motivo |
|----------|--------|
| **Tratamento de erros** | Degradation graciosa |
| **Lógica de retry** | Lidar com falhas transitórias |
| **Tratamento de timeout** | Prevenir travamento |
| **Suporte a streaming** | Melhor experiência do usuário |
| **Rastreamento de custos** | Gerenciamento de orçamento |

---

## Practice Questions

```question
{
  "id": "oc-provider-q1",
  "type": "multiple-choice",
  "question": "Quais métodos um provider personalizado deve implementar?",
  "options": [
    "Apenas chat()",
    "chat(), stream() e validate()",
    "Apenas initialize()",
    "Apenas chat() e stream()"
  ],
  "correct": 1,
  "explanation": "Um provider completo implementa chat(), stream() e validate() para funcionalidade completa."
}
```

```question
{
  "id": "oc-provider-q2",
  "type": "multiple-choice",
  "question": "Qual é o benefício das respostas em streaming?",
  "options": [
    "Custo mais baixo",
    "Melhor experiência do usuário com saída progressiva",
    "Conclusão mais rápida",
    "Implementação mais simples"
  ],
  "correct": 1,
  "explanation": "Streaming fornece saída progressiva, melhorando a performance percebida e a experiência do usuário."
}
```

```question
{
  "id": "oc-provider-q3",
  "type": "multiple-choice",
  "question": "Como você registra um provider personalizado?",
  "options": [
    "No skill.yaml",
    "No opencode.json sob a chave providers",
    "No package.json",
    "Em um arquivo de configuração separado"
  ],
  "correct": 1,
  "explanation": "Providers personalizados são registrados no opencode.json sob a chave providers com caminho e configuração."
}
```

```question
{
  "id": "oc-provider-q4",
  "type": "multiple-choice",
  "question": "O que o método validate() deve fazer?",
  "options": [
    "Testar a funcionalidade de chat",
    "Verificar se a chave de API é válida",
    "Verificar a conectividade de rede",
    "Todas as alternativas acima"
  ],
  "correct": 1,
  "explanation": "O método validate() deve verificar se a chave de API é válida e se o provider está acessível."
}
```

```question
{
  "id": "oc-provider-q5",
  "type": "multiple-choice",
  "question": "Para que serve o campo usage na ChatResponse?",
  "options": [
    "Debugging",
    "Rastreamento de custos e gerenciamento de orçamento",
    "Logging",
    "Monitoramento de performance"
  ],
  "correct": 1,
  "explanation": "O campo usage rastreia o consumo de tokens para rastreamento de custos e gerenciamento de orçamento."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Providers personalizados implementam os métodos chat(), stream() e validate()
- Respostas em streaming melhoram a experiência do usuário com saída progressiva
- Registre providers no opencode.json sob a chave providers
- Suporte a múltiplos padrões de autenticação: API key, OAuth2, headers personalizados
- Lidere com erros de forma graciosa com lógica de retry e timeouts
- Rastreie o consumo de tokens para gerenciamento de custos
- Teste providers com testes unitários e de integração
