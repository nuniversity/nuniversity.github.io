---
title: "Implantação"
description: "Implante aplicações LangGraph com LangGraph Cloud/Platform, configure APIs do grafo, gerencie opções de implantação e escale para produção."
order: 1
duration: "40 minutes"
difficulty: "advanced"
---

# Implantação

Deploying LangGraph applications to production requires understanding LangGraph Cloud (Platform), API configuration, authentication, scaling, and operational considerations.

---

## Visão Geral do LangGraph Cloud/Platform

LangGraph Platform provides a managed deployment infrastructure for LangGraph applications:

| Funcionalidade | Descrição |
| :--- | :--- |
| **Managed API** | Automatic REST API generation from your graph |
| **Scaling** | Auto-scaling based on demand |
| **Persistence** | Managed PostgreSQL for checkpointing |
| **Autenticação** | API key and OAuth support |
| **Monitoring** | Built-in LangSmith integration |
| **Streaming** | Server-Sent Eventos (SSE) for real-time output |

---

## Arquitetura de Implantação

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ LangGraph    │────▶│   LLM       │
│  (App/Web)  │     │  Platform    │     │   APIs      │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  PostgreSQL  │     │  LangSmith   │
                    │ (State/Pers.)│     │ (Observ.)    │
                    └──────────────┘     └─────────────┘
```

---

## Configuração da API do Grafo

Create a `langgraph.json` configuration file at your project root:

```json
{
  "name": "my-agent",
  "version": "1.0.0",
  "graphs": {
    "agent": "./src/agent.py:graph"
  },
  "dependencies": {
    "pip": ["langchain-openai", "tavily-python"],
    "python": "3.11"
  },
  "env": {
    "OPENAI_API_KEY": "sk-...",
    "TAVILY_API_KEY": "tvly-..."
  },
  "checkpointer": {
    "type": "postgres",
    "url": "postgresql://user:pass@host:5432/langgraph"
  }
}
```

[!IMPORTANTE]
The `graphs` field maps endpoint names to Python import paths. The value `"./src/agent.py:graph"` means "import `graph` from `src/agent.py`".

---

## Implantação com Dockerfile

For custom deployments, use the official LangGraph Docker image:

```dockerfile
FROM langchain/langgraph:latest

WORKDIR /app
COPY pyproject.toml .
RUN pip install -e .

COPY . .

# The graph is auto-detected from langgraph.json
EXPOSE 8080
CMD ["langgraph", "serve"]
```

---

## Opções de Implantação

### Option 1: LangGraph Cloud (Managed)

```bash
# Install CLI
pip install langgraph-cli

# Deploy to LangGraph Cloud
langgraph deploy --project my-agent

# Set environment variables
langgraph secrets set OPENAI_API_KEY sk-...
```

### Option 2: Self-Hosted Docker

```bash
# Build the Docker image
docker build -t my-agent .

# Run with environment variables
docker run -p 8080:8080 \
  -e OPENAI_API_KEY=sk-... \
  -e DATABASE_URL=postgresql://... \
  my-agent
```

### Option 3: Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: langgraph-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: langgraph-agent
  template:
    metadata:
      labels:
        app: langgraph-agent
    spec:
      containers:
      - name: agent
        image: my-agent:latest
        ports:
        - containerPort: 8080
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai-key
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
```

[!NOTA]
For production, use Kubernetes secrets or a vault service for API keys. Never hardcode secrets in your code or config files.

---

## Endpoints da API

LangGraph Platform generates these REST endpoints:

| Endpoint | Method | Descrição |
| :--- | :--- | :--- |
| `/threads` | POST | Create a new conversation thread |
| `/threads/{id}/runs` | POST | Invoke the graph on a thread |
| `/threads/{id}/state` | GET | Get thread state |
| `/threads/{id}/state` | PATCH | Update thread state |
| `/threads/{id}/runs/{run_id}/stream` | GET | Stream execution events |

### Client Example

```python
import requests

API_URL = "https://my-agent.langgraph.app"

# Create a thread
resp = requests.post(f"{API_URL}/threads", json={})
thread_id = resp.json()["thread_id"]

# Invoke the graph
resp = requests.post(
    f"{API_URL}/threads/{thread_id}/runs",
    json={"input": {"query": "What is LangGraph?"}}
)
print(resp.json())

# Get state
state = requests.get(f"{API_URL}/threads/{thread_id}/state")
print(state.json())
```

---

## Streaming da API Implantada

```python
# Stream events via SSE
import json
import requests

with requests.post(
    f"{API_URL}/threads/{thread_id}/runs/stream",
    json={"input": {"query": "Write a poem"}},
    stream=True
) as resp:
    for line in resp.iter_lines():
        if line:
            event = json.loads(line.decode("utf-8").removeprefix("data: "))
            print(event)
```

---

## Autenticação

```python
# API Key authentication
headers = {
    "X-Api-Key": "lgv2_...",
    "Content-Type": "application/json"
}

resp = requests.post(
    f"{API_URL}/threads",
    headers=headers,
    json={}
)
```

[!AVISO]
Rotate API keys regularly. Use short-lived keys for production and revoke compromised keys immediately.

---

## Considerações de Escala

| Dimension | Estratégia |
| :--- | :--- |
| **Concurrent users** | Horizontal scaling (more replicas) |
| **Long-running graphs** | Async execution with webhook callbacks |
| **Database** | PostgreSQL connection pooling (PgBouncer) |
| **LLM rate limits** | Queue requests, implement retry with backoff |
| **Memory** | Monitor checkpoint size, trim old checkpoints |
| **Cold starts** | Keep minimum replicas warm |

### Conexão com Banco de Dados Pooling

```python
from langgraph.checkpoint.postgres import PostgresSaver

# Use connection pooling for production
checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:pass@host:5432/langgraph",
    pool_size=10,
    max_overflow=20
)
```

---

## Verificações de Saúde

```python
from fastapi import FastAPI
from langgraph.graph import StateGraph

app = FastAPI()
graph_app = builder.compile(checkpointer=checkpointer)

@app.get("/health")
def health():
    return {"status": "ok", "graph": "ready"}

@app.post("/invoke")
def invoke(input: dict):
    result = graph_app.invoke(input)
    return result
```

---

## Perguntas Práticas

```question
{
  "id": "lg-advanced-01-q1",
  "type": "multiple-choice",
  "question": "What file configures LangGraph Platform deployment?",
  "options": ["deploy.json", "langgraph.json", "config.yaml", "graph.toml"],
  "correct": 1,
  "explanation": "langgraph.json defines the graph name, version, graph entry points, dependencies, environment variables, and checkpointer configuration."
}
```

```question
{
  "id": "lg-advanced-01-q2",
  "type": "multiple-choice",
  "question": "What does the 'graphs' field in langgraph.json specify?",
  "options": [
    "The number of graph instances to deploy",
    "The mapping of endpoint names to Python import paths for graphs",
    "The graph visualization settings",
    "The maximum graph size"
  ],
  "correct": 1,
  "explanation": "The 'graphs' field maps endpoint names (like 'agent') to Python module paths (like './src/agent.py:graph')."
}
```

```question
{
  "id": "lg-advanced-01-q3",
  "type": "multiple-choice",
  "question": "What database is recommended for production checkpointing?",
  "options": ["SQLite", "PostgreSQL", "MongoDB", "Redis"],
  "correct": 1,
  "explanation": "PostgreSQL is recommended for production checkpointing. It supports connection pooling, replication, and is production-hardened."
}
```

```question
{
  "id": "lg-advanced-01-q4",
  "type": "multiple-choice",
  "question": "Which HTTP method creates a new conversation thread?",
  "options": ["GET /threads", "POST /threads", "PUT /threads", "DELETE /threads"],
  "correct": 1,
  "explanation": "POST /threads creates a new thread. The response contains the thread_id for subsequent requests."
}
```

```question
{
  "id": "lg-advanced-01-q5",
  "type": "multiple-choice",
  "question": "How do you invoke a graph on an existing thread via the API?",
  "options": [
    "GET /threads/{id}/invoke",
    "POST /threads/{id}/runs",
    "PUT /threads/{id}/start",
    "PATCH /threads/{id}/run"
  ],
  "correct": 1,
  "explanation": "POST /threads/{id}/runs starts a new run on the given thread with the provided input."
}
```

```question
{
  "id": "lg-advanced-01-q6",
  "type": "multiple-choice",
  "question": "How should secrets be handled in production LangGraph deployments?",
  "options": [
    "Hardcoded in source code",
    "Stored in environment variables or a secrets manager",
    "Included in Docker images",
    "Committed to version control"
  ],
  "correct": 1,
  "explanation": "Secrets should be stored in environment variables, a secrets manager (like AWS Secrets Manager), or Kubernetes secrets — never in code."
}
```

```question
{
  "id": "lg-advanced-01-q7",
  "type": "multiple-choice",
  "question": "What is a recommended strategy for LLM rate limits in production?",
  "options": [
    "Ignore rate limits",
    "Implement retry with exponential backoff and request queuing",
    "Switch to a different LLM",
    "Reduce the number of users"
  ],
  "correct": 1,
  "explanation": "Implement a queue system with exponential backoff retry to handle LLM rate limits gracefully."
}
```

```question
{
  "id": "lg-advanced-01-q8",
  "type": "multiple-choice",
  "question": "How does LangGraph Platform handle concurrent users?",
  "options": [
    "Only one user at a time",
    "Horizontal scaling — more replicas handle more concurrent requests",
    "Concurrent users are queued",
    "Each user gets a dedicated server"
  ],
  "correct": 1,
  "explanation": "Horizontal scaling by adding more replicas (containers/instances) handles increased concurrent user load."
}
```

```question
{
  "id": "lg-advanced-01-q9",
  "type": "multiple-choice",
  "question": "What protocol does LangGraph Platform use for real-time streaming?",
  "options": ["WebSocket", "Server-Sent Events (SSE)", "gRPC streaming", "Long polling"],
  "correct": 1,
  "explanation": "LangGraph Platform uses Server-Sent Events (SSE) for streaming execution events and LLM tokens to clients."
}
```

```question
{
  "id": "lg-advanced-01-q10",
  "type": "multiple-choice",
  "question": "What information does a health check endpoint typically return?",
  "options": [
    "The full graph state",
    "Service status, readiness, and version information",
    "User authentication tokens",
    "Database schema"
  ],
  "correct": 1,
  "explanation": "Health checks return service status (ok/degraded/down), readiness indicators, and version info for monitoring and orchestration."
}
```

---

[!SUCESSO]
### Principais Conclusões
- langgraph.json configures LangGraph Platform deployment
- Three deployment options: LangGraph Cloud, self-hosted Docker, Kubernetes
- REST API: POST /threads → POST /threads/{id}/runs → GET /threads/{id}/state
- PostgreSQL for production checkpointing; connection pooling for scale
- API key authentication with regular rotation
- Horizontal scaling for concurrent users; retry with backoff for rate limits
- SSE for real-time streaming of execution events and tokens
- Health checks for monitoring and orchestration
