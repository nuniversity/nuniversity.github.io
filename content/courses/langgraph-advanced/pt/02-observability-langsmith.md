---
title: "Observabilidade com LangSmith"
description: "Domine observabilidade para aplicações LangGraph usando rastreamento LangSmith, registro em log, depuração, avaliação de execuções e monitoramento de desempenho."
order: 2
duration: "35 min"
difficulty: "advanced"
---

# Observabilidade com LangSmith

LangSmith é a plataforma de observabilidade da LangChain para aplicações com LLM. Ela oferece tracing, depuração, avaliação e monitoramento para aplicações LangGraph em produção.

---

## Por que a Observabilidade é Importante

Agentes LangGraph são sistemas complexos com múltiplas chamadas de LLM, execuções de ferramentas e roteamento condicional. Sem observabilidade adequada:

- Você não consegue depurar por que um agente tomou uma decisão errada
- Você não consegue medir o consumo de tokens nem a latência
- Você não consegue identificar padrões que falham
- Você não consegue melhorar o desempenho de forma sistemática

---

## Configurando o Rastreamento LangSmith

```python
import os

# Set environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls_..."
os.environ["LANGCHAIN_PROJECT"] = "my-agent-production"
```

Ou através do arquivo `.env`:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...
LANGCHAIN_PROJECT=my-agent-production
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

[!NOTE]
Com o tracing ativado, todas as chamadas de LangChain e LangGraph são rastreadas automaticamente. Cada invocação de grafo cria uma **árvore de execução (run tree)** mostrando cada nó, chamada de LLM e execução de ferramenta.

---

## Estrutura da Árvore de Execução

Uma invocação LangGraph cria um trace hierárquico:

```
Root Run (graph invocation)
├── Node: classify
│   └── LLM Call (classify_question)
├── Node: web_search
│   └── Tool Call (web_search)
├── Node: agent
│   └── LLM Call (generate_response)
└── [END]
```

Cada nó e cada chamada interna são uma **execução (run)** separada, com seu próprio:
- Valores de entrada/saída
- Marcações de tempo de início/fim
- Token counts
- Error information
- Metadata

---

## Adicionando Metadados Personalizados

```python
def node_with_metadata(state: State) -> dict:
    # Add metadata to the LLM call
    response = llm.invoke(
        state["messages"],
        metadata={
            "user_id": state.get("user_id"),
            "session_type": "premium",
            "node_name": "classify",
            "version": "2.1.0"
        }
    )
    return {"response": response.content}
```

Metadados personalizados tornam a filtragem e a busca em traces muito mais poderosas.

---

## Marcação e Mascaramento

Adicione tags às execuções para filtragem:

```python
from langchain_core.tracers.context import tracing_v2_enabled

with tracing_v2_enabled(
    project="my-agent",
    tags=["production", "user-facing"],
    metadata={"deployment": "us-east-1"}
):
    result = app.invoke(input_data)
```

Mascare dados sensíveis:

```python
from langchain_core.tracers import LangChainTracer

tracer = LangChainTracer(
    project="my-agent",
    # Tags to redact from traces
    hide_inputs=True,   # Don't log raw inputs
    hide_outputs=False  # Log outputs for debugging
)
```

[!WARNING]
Tenha cuidado com dados sensíveis. Use `hide_inputs=True` para aplicações com muitos PII, ou implemente uma função de mascaramento personalizada.

---

## Depuração com LangSmith

### Visualizando traces

```
LangSmith Dashboard
├── Projects
│   └── my-agent
│       ├── Runs (individual invocations)
│       │   ├── Latency distribution
│       │   ├── Token usage
│       │   ├── Error rate
│       │   └── Cost tracking
│       └── Feedback / Annotations
```

### Encontrando execuções problemáticas

```python
from langsmith import Client

client = Client()

# Find runs with errors
runs = client.list_runs(
    project_name="my-agent",
    error=True,
    start_time="2024-01-01"
)

for run in runs:
    print(f"Run {run.id}: {run.name} failed with {run.error}")
```

---

## Feedback e Anotação

Colete feedback dos usuários ou anote execuções para avaliação:

```python
from langsmith import Client

client = Client()

# Add user feedback
client.create_feedback(
    run_id=run_id,
    key="user_rating",
    score=4,  # 1-5 scale
    comment="The agent understood my question correctly"
)

# Add evaluator annotation
client.create_feedback(
    run_id=run_id,
    key="correctness",
    score=1.0,  # 0.0 - 1.0
    comment="Correctly answered the query"
)
```

---

## Avaliação

Defina avaliadores para pontuar execuções automaticamente:

```python
from langsmith.evaluation import evaluate, StringEvaluator

def correctness_evaluator(example: dict, prediction: dict) -> dict:
    """Evaluate if the agent's answer matches the expected answer."""
    expected = example["output"]["answer"]
    actual = prediction["answer"]

    score = 1.0 if expected in actual else 0.0
    return {"key": "correctness", "score": score}

# Run evaluation
results = evaluate(
    app.invoke,
    data="test-dataset",  # Dataset in LangSmith
    evaluators=[correctness_evaluator],
    experiment_prefix="my-agent-v2"
)
```

[!SUCCESS]
A avaliação automatizada permite acompanhar o desempenho ao longo do tempo, detectar regressões e comparar diferentes versões do agente.

---

## Monitoramento de Desempenho

### Métricas-chave

| Métrica | O que mede | Alvo |
| :--- | :--- | :--- |
| **Latência P50** | Tempo mediano de resposta | < 5s |
| **Latência P95** | 5% mais lentas das respostas | < 15s |
| **Consumo de tokens** | Tokens consumidos por execução | Varia |
| **Taxa de erro** | Porcentagem de execuções com falha | < 1% |
| **Custo por execução** | Custo da API por invocação | Dependente do orçamento |
| **Avaliação do usuário** | Pontuação média de feedback | > 4.0 / 5.0 |

### Configurando Monitores

```python
from langsmith import Client

client = Client()

# Create a monitor for error rate
client.create_monitor(
    project_name="my-agent",
    metric="error_rate",
    threshold=0.05,  # Alert if > 5%
    interval_minutes=60
)

# Create a monitor for latency
client.create_monitor(
    project_name="my-agent",
    metric="latency_p95",
    threshold=15.0,  # Alert if > 15 seconds
    interval_minutes=60
)
```

---

## Comparando Execuções

```python
# Compare two experiments
results = client.compare_experiments(
    experiment_ids=["exp_1", "exp_2"],
    metrics=["correctness", "latency", "cost"]
)

for result in results:
    print(f"Experiment {result.experiment_id}:")
    print(f"  Correctness: {result.metrics['correctness']}")
    print(f"  Avg Latency: {result.metrics['latency']}s")
```

---

## Registro Personalizado em Nós

```python
import logging

logger = logging.getLogger("langgraph.agent")

def monitored_node(state: State, config: dict) -> dict:
    thread_id = config["configurable"]["thread_id"]
    logger.info(f"[{thread_id}] Starting node execution")
    start = time.time()

    try:
        result = process(state)
        elapsed = time.time() - start
        logger.info(f"[{thread_id}] Node completed in {elapsed:.2f}s")
        return result
    except Exception as e:
        logger.error(f"[{thread_id}] Node failed: {e}", exc_info=True)
        return {"error": str(e)}
```

---

## Perguntas de Prática (Practice Questions)

```question
{
  "id": "lg-advanced-02-q1",
  "type": "multiple-choice",
  "question": "What environment variable enables LangSmith tracing?",
  "options": ["LANGCHAIN_TRACING=true", "LANGCHAIN_TRACING_V2=true", "LANGCHAIN_DEBUG=true", "LANGSMITH_ENABLE=true"],
  "correct": 1,
  "explanation": "LANGCHAIN_TRACING_V2=true enables automatic tracing of all LangChain and LangGraph calls."
}
```

```question
{
  "id": "lg-advanced-02-q2",
  "type": "multiple-choice",
  "question": "What is the hierarchical structure of a LangGraph trace?",
  "options": [
    "Flat list of all calls",
    "Run tree: graph → nodes → LLM/tool calls with timing and I/O",
    "A single log entry per invocation",
    "Separate traces per LLM provider"
  ],
  "correct": 1,
  "explanation": "LangGraph creates a run tree: root (graph) → child runs (nodes) → grandchild runs (LLM calls, tool calls) with full timing, I/O, and metadata."
}
```

```question
{
  "id": "lg-advanced-02-q3",
  "type": "multiple-choice",
  "question": "How can you filter runs by user or session in LangSmith?",
  "options": [
    "Use the search bar",
    "Add custom metadata or tags to runs and filter by them",
    "Filtering is not supported",
    "Use separate projects per user"
  ],
  "correct": 1,
  "explanation": "Add metadata (user_id, session_id) or tags to runs, then filter by these in the LangSmith dashboard or API."
}
```

```question
{
  "id": "lg-advanced-02-q4",
  "type": "multiple-choice",
  "question": "What is a common use of LangSmith feedback?",
  "options": [
    "To send emails to users",
    "To collect user ratings and annotate runs for evaluation",
    "To modify graph behavior in real-time",
    "To deploy new versions"
  ],
  "correct": 1,
  "explanation": "Feedback captures user ratings and evaluator annotations, which are used for performance tracking and model improvement."
}
```

```question
{
  "id": "lg-advanced-02-q5",
  "type": "multiple-choice",
  "question": "Which metric would you monitor to detect slow agent responses?",
  "options": ["Error rate", "Latency P95", "Token usage", "Cost per run"],
  "correct": 1,
  "explanation": "Latency P95 (the 95th percentile response time) reveals the slowest responses and helps identify performance issues."
}
```

```question
{
  "id": "lg-advanced-02-q6",
  "type": "multiple-choice",
  "question": "How do you prevent sensitive data from appearing in LangSmith traces?",
  "options": [
    "Don't use LangSmith with sensitive data",
    "Use hide_inputs=True or custom masking on the tracer",
    "Sensitive data is automatically redacted",
    "Use a separate project for sensitive data"
  ],
  "correct": 1,
  "explanation": "hide_inputs=True masks all inputs. For selective masking, implement a custom callback that redacts specific fields."
}
```

```question
{
  "id": "lg-advanced-02-q7",
  "type": "multiple-choice",
  "question": "What does the LangSmith evaluate() function do?",
  "options": [
    "It evaluates Python code syntax",
    "It runs a graph against a test dataset and scores outputs with evaluators",
    "It validates langgraph.json configuration",
    "It checks API key validity"
  ],
  "correct": 1,
  "explanation": "evaluate() runs the graph against a LangSmith dataset and applies evaluator functions to score each output."
}
```

```question
{
  "id": "lg-advanced-02-q8",
  "type": "multiple-choice",
  "question": "Can you compare two different versions of your agent in LangSmith?",
  "options": [
    "No, only one version at a time",
    "Yes, compare experiments by their experiment IDs and metrics",
    "Only if they are in different projects",
    "Comparison is manual only"
  ],
  "correct": 1,
  "explanation": "compare_experiments() takes multiple experiment IDs and compares their metrics side-by-side for A/B testing."
}
```

```question
{
  "id": "lg-advanced-02-q9",
  "type": "multiple-choice",
  "question": "What does a LangSmith monitor do?",
  "options": [
    "Monitors server CPU usage",
    "Alerts when a metric (like error rate or latency) exceeds a threshold",
    "Monitors user activity",
    "Tracks API key usage"
  ],
  "correct": 1,
  "explanation": "Monitors track metrics (error rate, latency, etc.) and send alerts when thresholds are exceeded, enabling proactive incident response."
}
```

```question
{
  "id": "lg-advanced-02-q10",
  "type": "multiple-choice",
  "question": "Which field in a run contains token usage information?",
  "options": [".error", ".outputs", ".metadata", ".usage_metadata"],
  "correct": 3,
  "explanation": ".usage_metadata contains token counts (prompt_tokens, completion_tokens, total_tokens) for LLM calls."
}
```

---

[!SUCCESS]
### Principais Conclusões
- LangSmith oferece tracing automático de todas as execuções LangGraph
- Árvores de execução mostram a execução hierárquica: grafo → nós → chamadas de LLM/ferramenta
- Metadados e tags personalizados permitem filtragem e busca poderosas
- Feedback e anotação coletam avaliações dos usuários para avaliação
- A avaliação automatizada pontua as saídas em relação a conjuntos de dados de teste
- Monitores geram alertas de taxa de erro, latência e outras métricas
- Compare experimentos A/B para validar melhorias
- Mascare dados sensíveis com hide_inputs ou callbacks personalizados
