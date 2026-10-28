---
title: "Gestión Avanzada de Estado"
description: "Domina esquemas de estado con TypedDict, reductores de estado (add, replace, merge) y funciones reductoras personalizadas para lógica de estado sofisticada."
order: 1
duration: "35 min"
difficulty: "intermediate"
---

# Gestión Avanzada de Estado

La gestión del estado es el corazón de LangGraph. Esta lección cubre esquemas de estado avanzados, reductores integrados y funciones reductoras personalizadas que te dan control detallado sobre cómo se aplican las actualizaciones de estado.

---

## Enfoques de Esquema de Estado

LangGraph admite tres enfoques de definición de esquema. Elige según tus necesidades:

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

| Característica | TypedDict | dataclass | BaseModel |
| :--- | :--- | :--- | :--- |
| Solo type hints | Sí | Sí | Sí |
| Valores predeterminados | No | Sí | Sí |
| Validación en tiempo de ejecución | No | No | Sí |
| Serialización | Manual | Manual | Integrada |
| Rendimiento | Más rápido | Rápido | Un poco más lento |
| Compatibilidad con IDE | Buena | Excelente | Excelente |

[!TIP]
Usa `TypedDict` para agentes simples, `dataclass` para agentes que necesitan valores predeterminados y `BaseModel` para sistemas de producción que requieren validación y serialización.

---

## Reductores de Estado

Los reductores controlan cómo se combinan múltiples escrituras en la misma clave de estado. Sin un reductor, **gana la última escritura**.

### El Predeterminado: Replace

```python
class DefaultState(TypedDict):
    items: List[str]

def node_a(state: DefaultState) -> dict:
    return {"items": ["a"]}  # Replaces items

def node_b(state: DefaultState) -> dict:
    return {"items": ["b"]}  # Replaces items again — "a" is lost

# Result: items = ["b"]
```

### El Reductor Add

`Annotated[type, add]` usa `operator.add` para combinar valores:

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

[!NOTE]
El reductor `add` exige que **ambos valores sean del mismo tipo** y que admitan `+`. Para listas, ambos deben ser listas; para enteros, ambos deben ser enteros.

---

## Reductores Integrados

### operator.add

Funciona con listas (concatenación), números (suma) y cadenas:

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

### replace (predeterminado)

El comportamiento predeterminado: no hace falta anotación:

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

## Reductores Personalizados

Para una lógica de fusión compleja, define una función personalizada:

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

### Firma de Reductor Personalizado

Una función reductora recibe `(current_value, new_update)` y devuelve el valor fusionado:

```python
def my_reducer(current: ValueType, update: ValueType) -> ValueType:
    # Combine current and update
    return merged_value
```

[!IMPORTANT]
El reductor recibe el **valor existente del estado** y la **nueva actualización** que llega del nodo. Debe devolver el nuevo valor de esa clave. Los reductores se ejecutan cada vez que un nodo escribe en esa clave.

---

## Patrones Avanzados de Reductores

### Reductor Max

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

### Reductor de Deduplicación de Lista

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

### Fusión por Marca de Tiempo

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

## Composición de Reductores

Combina varios reductores en campos distintos:

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

## Validación de Estado con Pydantic

Añade validación en tiempo de ejecución a los campos de estado:

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

[!WARNING]
La validación de Pydantic se ejecuta en cada actualización de estado. Para grafos de alto rendimiento, esto añade sobrecarga. Úsala con moderación en producción.

---

## Persistencia de Estado entre Ejecuciones

Sin persistencia, el estado es efímero. Para persistir el estado:

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

La persistencia se trata en profundidad en la Lección 2. Se menciona aquí porque interactúa con los reductores de estado: el estado persistido se restaura y los reductores continúan donde lo dejaron.

---

## Preguntas de Práctica (Practice Questions)

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
  "explanation": "Without a reducer, the last node to write a key determines its final value; it replaces previous writes."
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
  "explanation": "BaseModel provides built-in.dict() and.json() serialization, validation, and schema generation: essential for production."
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

[!SUCCESS]
### Conclusiones Clave
- Tres enfoques de estado: TypedDict (ligero), dataclass (valores predeterminados), BaseModel (validación)
- El reductor predeterminado es "gana la última escritura" (reemplazo)
- `Annotated[type, add]` añade con operator.add
- Reductores personalizados: `def reducer(current, update) -> new_value`
- Campos distintos pueden tener reductores distintos mediante Annotated
- El BaseModel de Pydantic añade validación en tiempo de ejecución a costa del rendimiento
- Los reductores personalizados permiten patrones como max, dedup y fusión profunda
