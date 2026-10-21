---
title: "Observabilidad con LangSmith"
description: "Domina la observabilidad para aplicaciones LangGraph usando trazado LangSmith, registro, depuración, evaluación de ejecuciones y monitoreo de rendimiento."
order: 2
duration: "35 min"
difficulty: "advanced"
---

# Observabilidad con LangSmith

LangSmith es la plataforma de observabilidad de LangChain para aplicaciones con LLM. Ofrece trazas, depuración, evaluación y monitoreo para aplicaciones LangGraph en producción.

---

## Por qué Importa la Observabilidad

Los agentes LangGraph son sistemas complejos con múltiples llamadas a LLM, ejecuciones de herramientas y enrutamiento condicional. Sin observabilidad adecuada:

- No puedes depurar por qué un agente tomó una decisión incorrecta
- No puedes medir el consumo de tokens ni la latencia
- No puedes identificar patrones que fallan
- No puedes mejorar el rendimiento de forma sistemática

---

## Configurando el Trazado de LangSmith

```python
import os

# Set environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls_..."
os.environ["LANGCHAIN_PROJECT"] = "my-agent-production"
```

O a través del archivo `.env`:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...
LANGCHAIN_PROJECT=my-agent-production
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

[!NOTE]
Una vez activado el rastreo, todas las llamadas de LangChain y LangGraph se rastrean automáticamente. Cada invocación de grafo crea un **árbol de ejecución (run tree)** que muestra cada nodo, cada llamada a LLM y cada ejecución de herramienta.

---

## Estructura del Árbol de Ejecución

Una invocación de LangGraph crea una traza jerárquica:

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

Cada nodo y cada llamada interna son una **ejecución (run)** separada, con su propio:
- Valores de entrada/salida
- Marcas de tiempo de inicio/fin
- Token counts
- Error information
- Metadata

---

## Agregando Metadatos Personalizados

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

Los metadatos personalizados hacen que filtrar y buscar en las trazas sea mucho más potente.

---

## Etiquetado y Enmascaramiento

Añade etiquetas a las ejecuciones para filtrar:

```python
from langchain_core.tracers.context import tracing_v2_enabled

with tracing_v2_enabled(
    project="my-agent",
    tags=["production", "user-facing"],
    metadata={"deployment": "us-east-1"}
):
    result = app.invoke(input_data)
```

Enmascara datos sensibles:

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
Ten cuidado con los datos sensibles. Usa `hide_inputs=True` en aplicaciones con muchos PII, o implementa una función de enmascaramiento personalizada.

---

## Depuración con LangSmith

### Visualizando trazas

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

### Encontrando ejecuciones problemáticas

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

## Feedback y Anotación

Recopila comentarios de los usuarios o anota ejecuciones para evaluar:

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

## Evaluación

Define evaluadores para puntuar ejecuciones automáticamente:

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
La evaluación automatizada te permite seguir el rendimiento a lo largo del tiempo, detectar regresiones y comparar distintas versiones del agente.

---

## Monitoreo de Rendimiento

### Métricas clave

| Métrica | Qué mide | Objetivo |
| :--- | :--- | :--- |
| **Latencia P50** | Tiempo medio de respuesta | < 5s |
| **Latencia P95** | 5% más lentas de las respuestas | < 15s |
| **Consumo de tokens** | Tokens consumidos por ejecución | Varía |
| **Tasa de error** | Porcentaje de ejecuciones fallidas | < 1% |
| **Coste por ejecución** | Coste de la API por invocación | Dependiente del presupuesto |
| **Calificación del usuario** | Puntuación media de comentarios | > 4.0 / 5.0 |

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

## Comparando Ejecuciones

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

## Registro Personalizado en Nodos

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

## Preguntas de Práctica (Practice Questions)

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
### Conclusiones Clave
- LangSmith ofrece trazado automático de todas las ejecuciones de LangGraph
- Los árboles de ejecución muestran la ejecución jerárquica: grafo → nodos → llamadas a LLM/herramientas
- Los metadatos y etiquetas personalizados permiten filtrado y búsqueda potentes
- Los comentarios y la anotación recogen valoraciones de los usuarios para evaluar
- La evaluación automatizada puntuó las salidas frente a conjuntos de datos de prueba
- Los monitores alertan sobre la tasa de error, la latencia y otras métricas
- Compara experimentos A/B para validar mejoras
- Enmascara datos sensibles con hide_inputs o callbacks personalizados
