---
title: "Gerenciamento Avançado de Estado"
description: "Domine schemas de estado com TypedDict, reducers de estado (add, replace, merge) e funções reducer personalizadas para lógica de estado sofisticada."
order: 1
duration: "35 minutes"
difficulty: "intermediate"
---

# Gerenciamento Avançado de Estado

State management is the heart of LangGraph. This lesson covers advanced state schemas, built-in reducers, and custom reducer functions that give you fine-grained control over how state updates are applied.

---

## Abordagens de Schema de Estado

LangGraph supports three schema definition approaches. Choose based on your needs:

```python
from typing_extensions import TypedDict
from dataclasses import dataclass, field
from pydantic import BaseModel, Field
from typing import List, Optional

# 1. TypedDict — lightweight, no validation
class AgentState(TypedDict):
    messages: List[str]
    turn_count: int

# 2. dataclass — mutable, default values
@dataclass
class AgentState:
    messages: List[str] = field(default_factory=list)
    turn_count: int = 0

# 3. BaseModel — validation, serialization
class AgentState(BaseModel):
    messages: List[str] = Field(default_factory=list)
    turn_count: int = Field(default=0)
```

| Funcionalidade | TypedDict | dataclass | BaseModel |
| :--- | :--- | :--- | :--- |
| Type hints only | Yes | Yes | Yes |
| Default values | No | Yes | Yes |
| Runtime validation | No | No | Yes |
| Serialization | Manual | Manual | Built-in |
| Performance | Fastest | Fast | Slightly slower |
| IDE support | Good | Excellent | Excellent |

[!DICA]
Use `TypedDict` for simple agents, `dataclass` for agents needing defaults, and `BaseModel` for production systems requiring validation and serialization.

---

## Redutores de Estado

Reducers control how multiple writes to the same state key are combined. Without a reducer, the **last write wins**.

### O Padrão: Replace

```python
class DefaultState(TypedDict):
    items: List[str]

def node_a(state: DefaultState) -> dict:
    return {"items": ["a"]}  # Replaces items

def node_b(state: DefaultState) -> dict:
    return {"items": ["b"]}  # Replaces items again — "a" is lost

# Result: items = ["b"]
```

### O Redutor Add

`Annotated[type, add]` uses `operator.add` to combine values:

```python
from typing import Annotated
from operator import add

class AppendState(TypedDict):
    items: Annotated[List[str], add]

def node_a(state: AppendState) -> dict:
    return {"items": ["a"]}  # Appended

def node_b(state: AppendState) -> dict:
    return {"items": ["b"]}  # Appended

# Result: items = ["a", "b"]
```

[!NOTA]
The `add` reducer requires **both values to be of the same type** that supports `+`. For lists, both must be lists; for ints, both must be ints.

---

## Redutores Integrados

### operator.add

Works on lists (concatenation), numbers (addition), and strings:

```python
from operator import add

class CounterState(TypedDict):
    count: Annotated[int, add]
    logs: Annotated[List[str], add]
    text: Annotated[str, add]

def increment(state: CounterState) -> dict:
    return {"count": 1}  # Adds 1 to current count

def add_log(state: CounterState) -> dict:
    return {"logs": ["Processing step"]}  # Appends to list

def add_text(state: CounterState) -> dict:
    return {"text": " more"}  # Concatenates strings
```

### replace (padrão)

The default behavior — no annotation needed:

```python
class NoReducerState(TypedDict):
    value: str  # Last write wins by default

def first(state: NoReducerState) -> dict:
    return {"value": "first"}

def second(state: NoReducerState) -> dict:
    return {"value": "second"}  # Overwrites

# Result: value = "second"
```

---

## Redutores Personalizados

For complex merge logic, define a custom function:

```python
from typing import Annotated

def merge_counts(old: dict, new: dict) -> dict:
    """Deep merge two count dictionaries."""
    result = old.copy()
    for key, value in new.items():
        if key in result:
            result[key] = result[key] + value
        else:
            result[key] = value
    return result

class CustomState(TypedDict):
    counts: Annotated[dict, merge_counts]

def node_a(state: CustomState) -> dict:
    return {"counts": {"apples": 5, "oranges": 3}}

def node_b(state: CustomState) -> dict:
    return {"counts": {"apples": 2, "bananas": 4}}

# Result: counts = {"apples": 7, "oranges": 3, "bananas": 4}
```

### Assinatura de Redutor Personalizado

A reducer function receives `(current_value, new_update)` and returns the merged value:

```python
def my_reducer(current: ValueType, update: ValueType) -> ValueType:
    # Combine current and update
    return merged_value
```

[!IMPORTANTE]
The reducer receives the **existing state value** and the **new update** from the node. It must return the new value for that key. Reducers run every time a node writes to that key.

---

## Padrões Avançados de Redutores

### Redutor Max

```python
def max_reducer(current: int, update: int) -> int:
    return max(current, update)

class MaxState(TypedDict):
    highest_score: Annotated[int, max_reducer]

def player_1(state: MaxState) -> dict:
    return {"highest_score": 85}

def player_2(state: MaxState) -> dict:
    return {"highest_score": 92}

# Result: highest_score = 92 (max of all writes)
```

### Redutor de Deduplicação de Lista

```python
def dedup_append(current: List[str], update: List[str]) -> List[str]:
    seen = set(current)
    result = current[:]
    for item in update:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result

class DedupState(TypedDict):
    unique_items: Annotated[List[str], dedup_append]

def add_items(state: DedupState) -> dict:
    return {"unique_items": ["a", "b", "a"]}

# Result: unique_items = ["a", "b"] (duplicate "a" removed)
```

### Fusão por Timestamp

```python
def latest_wins(current: dict, update: dict) -> dict:
    current.update(update)
    return current

class MetadataState(TypedDict):
    metadata: Annotated[dict, latest_wins]

def node_a(state: MetadataState) -> dict:
    return {"metadata": {"status": "processing", "started_at": "2024-01-01"}}

def node_b(state: MetadataState) -> dict:
    return {"metadata": {"status": "completed", "completed_at": "2024-01-02"}}

# Result: metadata = {status: "completed", started_at: "2024-01-01", completed_at: "2024-01-02"}
```

---

## Composição de Redutores

Combine multiple reducers across different fields:

```python
from typing import Annotated
from operator import add

def merge_dicts(a: dict, b: dict) -> dict:
    result = a.copy()
    result.update(b)
    return result

class CompositeState(TypedDict):
    messages: Annotated[List[str], add]          # Append
    score: Annotated[int, add]                   # Sum
    config: Annotated[dict, merge_dicts]         # Shallow merge
    status: str                                   # Replace (default)
    max_val: Annotated[float, max_reducer]        # Custom: max
```

---

## Validação de Estado com Pydantic

Add runtime validation to state fields:

```python
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class ValidatedState(BaseModel):
    messages: List[str] = Field(default_factory=list)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1024, gt=0, le=8192)

    @field_validator("messages")
    @classmethod
    def check_message_limit(cls, v: List[str]) -> List[str]:
        if len(v) > 100:
            raise ValueError("Too many messages (max 100)")
        return v
```

[!AVISO]
Pydantic validation runs on every state update. For high-throughput graphs, this adds overhead. Use it judiciously in production.

---

## Persistência de Estado entre Execuções

Without persistence, state is ephemeral. To persist state:

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
app = builder.compile(checkpointer=checkpointer)

# State is saved after each node execution
config = {"configurable": {"thread_id": "user-session-1"}}
result = app.invoke(initial_state, config)

# Retrieve state for a thread
saved_state = app.get_state(config)
print(saved_state.values)
```

Persistence is covered in depth in Lesson 2. It's mentioned here because it interacts with state reducers — persisted state is restored and reducers continue from where they left off.

---

## Perguntas Práticas

```question
{
  "id": "lg-intermediate-01-q1",
  "type": "multiple-choice",
  "question": "Which state definition approach provides runtime validation?",
  "options": ["TypedDict", "dataclass", "pydantic.BaseModel", "All of the above"],
  "correct": 2,
  "explanation": "Only pydantic.BaseModel provides runtime field validation. TypedDict and dataclass are type-hint only."
}
```

```question
{
  "id": "lg-intermediate-01-q2",
  "type": "multiple-choice",
  "question": "What is the default state update behavior without a reducer?",
  "options": ["Append", "Merge", "Last write wins (replace)", "Average"],
  "correct": 2,
  "explanation": "Without a reducer, the last node to write a key determines its final value — it replaces previous writes."
}
```

```question
{
  "id": "lg-intermediate-01-q3",
  "type": "multiple-choice",
  "question": "What typing construct applies a reducer to a state field?",
  "options": ["Optional[type, reducer]", "Annotated[type, reducer]", "Field[type, reducer]", "Reducer[type]"],
  "correct": 1,
  "explanation": "Annotated[type, reducer] is the standard way to associate a reducer with a state field in LangGraph."
}
```

```question
{
  "id": "lg-intermediate-01-q4",
  "type": "multiple-choice",
  "question": "What is the signature of a custom reducer function?",
  "options": [
    "def reducer(update) -> new_value",
    "def reducer(current, update) -> new_value",
    "def reducer(state) -> dict",
    "def reducer() -> value"
  ],
  "correct": 1,
  "explanation": "A reducer receives (current_value, new_update) and returns the combined result."
}
```

```question
{
  "id": "lg-intermediate-01-q5",
  "type": "multiple-choice",
  "question": "Which operator does the 'add' reducer use?",
  "options": ["operator.or_", "operator.add (+)","operator.and_", "operator.concat"],
  "correct": 1,
  "explanation": "The 'add' reducer uses operator.add, which is the + operator. For lists this is concatenation."
}
```

```question
{
  "id": "lg-intermediate-01-q6",
  "type": "multiple-choice",
  "question": "What does a custom reducer returning max(current, update) accomplish?",
  "options": [
    "It takes the minimum of all writes",
    "It keeps the maximum value written to that field",
    "It sums all writes",
    "It replaces the value with each write"
  ],
  "correct": 1,
  "explanation": "A max reducer keeps the highest value seen across all node writes to that field."
}
```

```question
{
  "id": "lg-intermediate-01-q7",
  "type": "multiple-choice",
  "question": "When using add reducer on a list, what type must node returns be?",
  "options": [
    "A single element",
    "A list (to concatenate with the existing list)",
    "A tuple",
    "Any iterable"
  ],
  "correct": 1,
  "explanation": "Both the current value and the update must be lists for the add reducer to work (list + list = concatenation)."
}
```

```question
{
  "id": "lg-intermediate-01-q8",
  "type": "multiple-choice",
  "question": "How do you apply different reducers to different fields in the same state?",
  "options": [
    "Only one reducer per state is allowed",
    "Use Annotated on each field with its own reducer",
    "Reducers are applied globally",
    "Define separate states for each field"
  ],
  "correct": 1,
  "explanation": "Each field can have its own Annotated[type, reducer] with a different reducer function."
}
```

```question
{
  "id": "lg-intermediate-01-q9",
  "type": "multiple-choice",
  "question": "Which state approach is recommended for production systems needing serialization?",
  "options": ["TypedDict", "dataclass", "pydantic.BaseModel", "Plain dict"],
  "correct": 2,
  "explanation": "BaseModel provides built-in .dict() and .json() serialization, validation, and schema generation — essential for production."
}
```

```question
{
  "id": "lg-intermediate-01-q10",
  "type": "multiple-choice",
  "question": "What happens when Pydantic validation fails on a state update?",
  "options": [
    "The invalid update is silently ignored",
    "A ValueError is raised",
    "The state is reverted to the previous value",
    "A warning is logged and the update proceeds"
  ],
  "correct": 1,
  "explanation": "Pydantic validation raises an error if constraints are violated. Wrap node logic in try/except if validation is strict."
}
```

---

[!SUCESSO]
### Principais Conclusões
- Three state approaches: TypedDict (lightweight), dataclass (defaults), BaseModel (validation)
- Default reducer is "last write wins" (replace)
- `Annotated[type, add]` appends with operator.add
- Custom reducers: `def reducer(current, update) -> new_value`
- Different fields can have different reducers via Annotated
- Pydantic BaseModel adds runtime validation at the cost of performance
- Custom reducers enable patterns like max, dedup, and deep merge
