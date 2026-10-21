---
title: "Optimización"
description: "Optimiza aplicaciones LangGraph — reduce llamadas de nodos, estrategias de caché, agrupación de solicitudes LLM, gestión de tokens y ajuste de rendimiento del grafo."
order: 9
duration: "35 min"
difficulty: "advanced"
---

# Optimización

A medida que las aplicaciones LangGraph crecen, la optimización de rendimiento y de coste se vuelve crítica. Esta lección cubre estrategias para reducir la latencia, minimizar el consumo de tokens, cachear resultados, agrupar operaciones y ajustar la ejecución del grafo.

---

## Dónde Importa la Optimización

| Área | Impacto | Optimización |
| :--- | :--- | :--- |
| Llamadas a LLM | Coste + latencia | Caché, agrupación y selección de modelo |
| Número de nodos | Latencia | Fusiona nodos triviales, reduce los nodos innecesarios |
| Tamaño del estado | Memoria + serialización | Reduce el estado, usa estructuras de datos eficientes |
| Checkpointing | Latencia | Reduce la frecuencia de checkpointing |
| Paralelismo | Throughput | Fan-out inteligente, evita la contención |

---

## Caché de Llamadas LLM

Cachea las respuestas de LLM para entradas idénticas:

```python
from langchain.globals import set_llm_cache
from langchain.cache import InMemoryCache
import hashlib

# Enable caching
set_llm_cache(InMemoryCache())

# Cache responses based on prompt content
@tool
def cached_search(query: str) -> str:
    """Search with caching for identical queries."""
    return perform_search(query)

# Or use a persistent cache
from langchain.cache import SQLiteCache
set_llm_cache(SQLiteCache(database_path=".llm_cache.db"))
```

[!NOTE]
La caché de LLM es más eficaz cuando los usuarios hacen preguntas similares repetidamente. La invalidación de la caché debe basarse en el tiempo o en disparadores de actualización manual.

---

## Caché Personalizado en Nodos

```python
import hashlib
import json
from functools import lru_cache

# Simple in-memory cache with TTL
class TTLCache:
    def __init__(self, ttl_seconds: int = 3600):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, key: str):
        if key in self.cache:
            value, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return value
            del self.cache[key]
        return None

    def set(self, key: str, value):
        self.cache[key] = (value, time.time())

cache = TTLCache(ttl_seconds=300)

def cached_llm_node(state: State) -> dict:
    # Generate cache key from input
    prompt = state["messages"][-1].content
    cache_key = hashlib.md5(prompt.encode()).hexdigest()

    # Check cache
    cached = cache.get(cache_key)
    if cached:
        print("Cache hit!")
        return {"output": cached}

    # Compute and cache
    result = llm.invoke(prompt).content
    cache.set(cache_key, result)
    return {"output": result}
```

---

## Gestión de Tokens

### Presupuesto de Tokens

```python
import tiktoken

class TokenBudget:
    def __init__(self, model: str, max_tokens: int = 8000):
        self.encoder = tiktoken.encoding_for_model(model)
        self.max_tokens = max_tokens
        self.used_tokens = 0

    def count_tokens(self, text: str) -> int:
        return len(self.encoder.encode(text))

    def can_add(self, text: str) -> bool:
        return self.used_tokens + self.count_tokens(text) <= self.max_tokens

    def add(self, text: str) -> bool:
        tokens = self.count_tokens(text)
        if self.used_tokens + tokens <= self.max_tokens:
            self.used_tokens += tokens
            return True
        return False

def budget_aware_node(state: State) -> dict:
    budget = TokenBudget("gpt-4o", max_tokens=4000)
    trimmed_messages = []

    for msg in reversed(state["messages"]):
        if budget.add(msg.content):
            trimmed_messages.insert(0, msg)

    response = llm.invoke(trimmed_messages)
    return {"response": response.content}
```

### Conteo de Tokens en Streaming

```python
class TokenCounter:
    def __init__(self):
        self.prompt_tokens = 0
        self.completion_tokens = 0

    def count_prompt(self, messages: list) -> int:
        enc = tiktoken.encoding_for_model("gpt-4o")
        total = 0
        for msg in messages:
            total += len(enc.encode(msg.content))
        self.prompt_tokens = total
        return total

    def count_completion(self, text: str) -> int:
        enc = tiktoken.encoding_for_model("gpt-4o")
        self.completion_tokens = len(enc.encode(text))
        return self.completion_tokens
```

[!TIP]
Lleva la cuenta del consumo de tokens por invocación de grafo. Ayuda a identificar qué nodos son más caros y dónde concentrar los esfuerzos de optimización.

---

## Agrupación de Llamadas LLM

Cuando se necesiten múltiples llamadas independientes a LLM, agrúpalas:

```python
from langchain_core.runnables import RunnableParallel

# Define multiple chains
chain_a = prompt_a | llm | StrOutputParser()
chain_b = prompt_b | llm | StrOutputParser()
chain_c = prompt_c | llm | StrOutputParser()

# Run them in parallel (batched)
combined = RunnableParallel(
    result_a=chain_a,
    result_b=chain_b,
    result_c=chain_c
)

def batched_node(state: State) -> dict:
    results = combined.invoke({
        "topic": state["topic"],
        "question": state["question"]
    })
    return {
        "analysis_a": results["result_a"],
        "analysis_b": results["result_b"],
        "analysis_c": results["result_c"]
    }
```

---

## Reduciendo Nodos Innecesarios

### Fusionar Nodos de Transformación Triviales

```python
# Instead of three nodes for simple transformations:
def clean(state): return {"text": state["text"].strip()}
def lower(state): return {"text": state["text"].lower()}
def truncate(state): return {"text": state["text"][:100]}

# Merge into one:
def process_text(state: State) -> dict:
    return {"text": state["text"].strip().lower()[:100]}
```

### Saltar Nodos Sin Operación

```python
def conditional_node(state: State) -> dict:
    if state.get("skip_processing"):
        return {}  # Return empty — no state changes, minimal overhead
    return {"result": expensive_operation(state)}
```

---

## Optimización de Puntos de Control

```python
# Reduce checkpoint frequency
# Instead of checkpointing after every node, batch updates

# Option: Use a single node for sequential operations
def batched_operations(state: State) -> dict:
    # Multiple operations in one node = one checkpoint
    cleaned = state["input"].strip()
    processed = clean(cleaned)
    validated = validate(processed)
    return {"output": validated}

# Option: Disable checkpointing for intermediate nodes
app = builder.compile(
    checkpointer=checkpointer,
    interrupt_before_nodes=[],  # Only checkpoint at specific points
    interrupt_after_nodes=[]
)
```

---

## Estrategia de Selección de Modelo

Usa el modelo adecuado para cada nodo:

```python
# Expensive model for complex reasoning
reasoning_llm = ChatOpenAI(model="gpt-4o", temperature=0.3)

# Cheap model for simple tasks
fast_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)

# Fastest model for classification/routing
router_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)

def classify_node(state: State) -> dict:
    # Router nodes can use the cheapest model
    category = router_llm.invoke(f"Classify: {state['query']}")
    return {"category": category.content.strip()}

def analyze_node(state: State) -> dict:
    # Complex nodes use the expensive model
    analysis = reasoning_llm.invoke(f"Deep analysis: {state['query']}")
    return {"analysis": analysis.content}

def format_node(state: State) -> dict:
    # Simple formatting uses cheap model
    formatted = fast_llm.invoke(f"Format: {state['analysis']}")
    return {"formatted": formatted.content}
```

[!SUCCESS]
Usar modelos distintos para nodos distintos puede reducir los costes en un 5-10x manteniendo la calidad: usa modelos baratos para enrutamiento/tareas simples y modelos carosos solo para razonamiento complejo.

---

## Lista de Verificación de Optimización

| Estrategia | Esfuerzo | Impacto |
| :--- | :--- | :--- |
| Caché de respuestas de LLM | Bajo | Alto (consultas repetidas) |
| Selección de modelo por nodo | Bajo | Alto (coste) |
| Truncado de tokens | Medio | Alto (gestión de contexto) |
| Fusionar nodos triviales | Bajo | Medio (latencia) |
| Reducir la frecuencia de checkpointing | Bajo | Medio (latencia) |
| Trabajo independiente en paralelo | Medio | Alto (latencia) |
| Agrupar múltiples llamadas a LLM | Medio | Medio (throughput) |
| Transmisión en vez de espera | Alto | Alto (experiencia de usuario) |

---

## Preguntas de Práctica (Practice Questions)

```question
{
  "id": "lg-advanced-09-q1",
  "type": "multiple-choice",
  "question": "What is the most impactful optimization for LLM costs?",
  "options": [
    "Using a faster computer",
    "Caching repeated LLM calls and using appropriate model per task",
    "Adding more nodes",
    "Increasing temperature"
  ],
  "correct": 1,
  "explanation": "Caching avoids repeated costs for identical queries, and using cheap models for simple tasks significantly reduces overall LLM spend."
}
```

```question
{
  "id": "lg-advanced-09-q2",
  "type": "multiple-choice",
  "question": "Which model strategy optimizes cost in a multi-node graph?",
  "options": [
    "Use the same model for all nodes",
    "Use gpt-4o-mini for routing/simple tasks and gpt-4o for complex reasoning",
    "Always use the cheapest model",
    "Always use the most expensive model"
  ],
  "correct": 1,
  "explanation": "Match model capability to task complexity. Cheap models for routing/formatting, expensive models for complex reasoning."
}
```

```question
{
  "id": "lg-advanced-09-q3",
  "type": "multiple-choice",
  "question": "What is a good cache TTL for LLM responses?",
  "options": [
    "Cache forever",
    "It depends — shorter for dynamic queries, longer for static knowledge",
    "Never cache LLM responses",
    "1 second"
  ],
  "correct": 1,
  "explanation": "TTL depends on use case. Static information can be cached longer; queries requiring current data need shorter TTLs."
}
```

```question
{
  "id": "lg-advanced-09-q4",
  "type": "multiple-choice",
  "question": "When should you merge multiple nodes into one?",
  "options": [
    "Always — fewer nodes is always better",
    "When nodes perform trivial transformations that don't benefit from separate checkpointing",
    "Never merge nodes",
    "Only when the graph doesn't compile"
  ],
  "correct": 1,
  "explanation": "Merge trivial nodes that perform simple sequential operations. Keep nodes separate when they benefit from independent checkpointing or conditional routing."
}
```

```question
{
  "id": "lg-advanced-09-q5",
  "type": "multiple-choice",
  "question": "What is the benefit of streaming LLM tokens?",
  "options": [
    "Reduces total token usage",
    "Improves user experience by showing output incrementally rather than all at once",
    "Increases LLM accuracy",
    "Reduces cost"
  ],
  "correct": 1,
  "explanation": "Streaming shows tokens as they're generated, significantly improving perceived responsiveness even if total latency is the same."
}
```

```question
{
  "id": "lg-advanced-09-q6",
  "type": "multiple-choice",
  "question": "How does token budgeting help with LLM optimization?",
  "references": [
    {
      "name": "Token Budgeting",
      "file": "/home/mimir/nuniversity/nuniversity.github.io/content/courses/langgraph-advanced/en/09-optimization.md",
      "line": 140
    }
  ],
  "options": [
    "It tracks and limits token usage to stay within context windows and manage costs",
    "It increases token limits",
    "It compresses tokens",
    "It encrypts tokens"
  ],
  "correct": 0,
  "explanation": "Token budgeting tracks how many tokens you're using, helping you stay within context limits and manage API costs."
}
```

```question
{
  "id": "lg-advanced-09-q7",
  "type": "multiple-choice",
  "question": "What is a disadvantage of excessive checkpointing?",
  "options": [
    "It reduces reliability",
    "It adds latency and storage overhead for saving state after every node",
    "It prevents debugging",
    "It increases LLM accuracy"
  ],
  "correct": 1,
  "explanation": "Checkpointing after every node adds I/O latency and storage costs. For high-throughput graphs, consider less frequent checkpoints."
}
```

```question
{
  "id": "lg-advanced-09-q8",
  "type": "multiple-choice",
  "question": "What does RunnableParallel enable?",
  "options": [
    "Parallel execution of multiple independent chains in a single node",
    "Sequential chain execution",
    "Graph visualization",
    "State serialization"
  ],
  "correct": 0,
  "explanation": "RunnableParallel runs multiple independent LangChain chains in parallel within a single node, batching their execution."
}
```

```question
{
  "id": "lg-advanced-09-q9",
  "type": "multiple-choice",
  "question": "What tool can count tokens for OpenAI models?",
  "options": ["tokenizer", "tiktoken", "count_token", "openai_token_counter"],
  "correct": 1,
  "explanation": "tiktoken is OpenAI's token counting library. It provides encoding_for_model() to count tokens accurately for different models."
}
```

```question
{
  "id": "lg-advanced-09-q10",
  "type": "multiple-choice",
  "question": "Which optimizer strategy reduces latency the most?",
  "options": [
    "Caching",
    "Parallelizing independent work with fan-out",
    "Using cheaper models",
    "Merging nodes"
  ],
  "correct": 1,
  "explanation": "Parallelizing independent work (fan-out) can reduce wall-clock time dramatically by running multiple operations simultaneously."
}
```

---

[!SUCCESS]
### Conclusiones Clave
- Cachea las respuestas de LLM para consultas repetidas y reduce coste y latencia
- Usa el modelo adecuado por nodo: barato para lo simple, caro para lo complejo
- Lleva la cuenta del consumo de tokens con tiktoken para gestionar ventanas de contexto y presupuestos
- Fusiona nodos triviales para reducir la sobrecarga, pero mantén separados los nodos significativos
- Reduce la frecuencia de checkpointing para grafos de alto rendimiento
- Paraleliza el trabajo independiente con fan-out para mejorar la latencia
- Agrupa múltiples llamadas independientes a LLM con RunnableParallel
- La transmisión mejora el rendimiento percibido aunque la latencia total sea la misma
