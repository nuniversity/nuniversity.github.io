---
title: "Observability with LangSmith"
description: "Master observability for LangGraph applications using LangSmith tracing, logging, debugging, run evaluation, and performance monitoring."
order: 2
duration: "35 minutes"
difficulty: "advanced"
---

# Observability with LangSmith

LangSmith is LangChain's observability platform for LLM applications. It provides tracing, debugging, evaluation, and monitoring for LangGraph applications in production.

---

## Why Observability Matters

LangGraph agents are complex systems with multiple LLM calls, tool executions, and conditional routing. Without proper observability:

- You can't debug why an agent made a wrong decision
- You can't measure token usage or latency
- You can't identify failing patterns
- You can't improve performance systematically

---

## Setting Up LangSmith Tracing

```python
import os

# Set environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls_..."
os.environ["LANGCHAIN_PROJECT"] = "my-agent-production"
```

Or via `.env` file:

```bash
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls_...
LANGCHAIN_PROJECT=my-agent-production
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

[!NOTE]
Once tracing is enabled, all LangChain and LangGraph calls are automatically traced. Each graph invocation creates a **run tree** showing every node, LLM call, and tool execution.

---

## Run Tree Structure

A LangGraph invocation creates a hierarchical trace:

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

Each node and internal call is a separate **run** with its own:
- Input/output values
- Start/end timestamps
- Token counts
- Error information
- Metadata

---

## Adding Custom Metadata

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

Custom metadata makes filtering and searching traces much more powerful.

---

## Tagging and Masking

Add tags to runs for filtering:

```python
from langchain_core.tracers.context import tracing_v2_enabled

with tracing_v2_enabled(
    project="my-agent",
    tags=["production", "user-facing"],
    metadata={"deployment": "us-east-1"}
):
    result = app.invoke(input_data)
```

Mask sensitive data:

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
Be careful with sensitive data. Use `hide_inputs=True` for PII-heavy applications, or implement a custom masking function.

---

## Debugging with LangSmith

### Viewing Traces

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

### Finding Problematic Runs

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

## Feedback and Annotation

Collect feedback from users or annotate runs for evaluation:

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

## Evaluation

Define evaluators to automatically score runs:

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
Automated evaluation lets you track performance over time, catch regressions, and compare different agent versions.

---

## Performance Monitoring

### Key Metrics

| Metric | What It Measures | Target |
| :--- | :--- | :--- |
| **Latency P50** | Median response time | < 5s |
| **Latency P95** | Slowest 5% of responses | < 15s |
| **Token Usage** | Tokens consumed per run | Varies |
| **Error Rate** | Percentage of failed runs | < 1% |
| **Cost Per Run** | API cost per invocation | Budget-dependent |
| **User Rating** | Average feedback score | > 4.0 / 5.0 |

### Setting Up Monitors

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

## Comparing Runs

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

## Custom Logging in Nodes

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

## Practice Questions

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
### Key Takeaways
- LangSmith provides automatic tracing of all LangGraph executions
- Run trees show hierarchical execution: graph → nodes → LLM/tool calls
- Custom metadata and tags enable powerful filtering and search
- Feedback and annotation collect user ratings for evaluation
- Automated evaluation scores outputs against test datasets
- Monitors alert on error rate, latency, and other metrics
- A/B compare experiments to validate improvements
- Mask sensitive data with hide_inputs or custom callbacks
