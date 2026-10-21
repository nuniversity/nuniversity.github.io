---
title: "Persistencia y Puntos de Control"
description: "Aprende a persistir el estado del grafo con MemorySaver, guardar y cargar puntos de control, y usar gestión de estado basada en hilos."
order: 2
duration: "30 min"
difficulty: "intermediate"
---

# Persistencia y Puntos de Control

Una de las funciones más potentes de LangGraph es la persistencia: la capacidad de guardar y restaurar el estado del grafo en cualquier momento de la ejecución. Esto permite agentes de larga duración, flujos de trabajo con humano en el bucle y sistemas tolerantes a fallos.

---

## Por qué Importa la Persistencia

Sin persistencia, cada invocación de grafo empieza desde cero. Con persistencia:

- **El estado sobrevive a las invocaciones**: Reanuda donde lo dejaste
- **Humano en el bucle**: Pausa la ejecución, inspecciona el estado, aporta entrada y reanuda
- **Tolerancia a fallos**: Recupérate de los fallos sin perder el progreso
- **Conversaciones con varios turnos**: Mantén el contexto entre múltiples interacciones

---

## MemorySaver: Persistencia en Memoria

`MemorySaver` guarda checkpoints en memoria. Es simple y rápido, pero el estado se pierde cuando el proceso termina.

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class State(TypedDict):
    messages: list
    turn_count: int

def node_a(state: State) -> dict:
    return {
        "messages": state["messages"] + ["Processed by A"],
        "turn_count": state["turn_count"] + 1
    }

# Add persistence
checkpointer = MemorySaver()

builder = StateGraph(State)
builder.add_node("a", node_a)
builder.add_edge(START, "a")
builder.add_edge("a", END)

# Compile with checkpointer
app = builder.compile(checkpointer=checkpointer)
```

[!NOTE]
El parámetro `checkpointer` se pasa a `.compile()`. Una vez definido, cada ejecución de nodo crea un checkpoint que puede recuperarse después.

---

## IDs de Hilo

Los checkpoints se organizan por **thread ID**. Un hilo representa una única conversa o sesión de flujo de trabajo:

```python
# First invocation — creates a new thread
config1 = {"configurable": {"thread_id": "thread-1"}}
result1 = app.invoke(
    {"messages": [], "turn_count": 0},
    config1
)

# Second invocation on the same thread — continues from where we left off
config2 = {"configurable": {"thread_id": "thread-1"}}
result2 = app.invoke(
    {"messages": ["New message"], "turn_count": 0},  # Initial state is merged
    config2
)

# Different thread — starts fresh
config3 = {"configurable": {"thread_id": "thread-2"}}
result3 = app.invoke(
    {"messages": [], "turn_count": 0},
    config3
)
```

[!IMPORTANT]
Al usar un checkpointer, el estado inicial que pasas a `invoke()` se fusiona con el estado existente del hilo. Las claves que ya existen en el hilo conservan sus valores; las claves nuevas se añaden.

---

## Recuperando Puntos de Control

```python
# Get the latest state for a thread
latest = app.get_state(config1)
print(latest.values)      # Current state dict
print(latest.next)        # Nodes to execute next (empty if finished)

# List all checkpoints for a thread
for checkpoint in app.get_state_history(config1):
    print(f"Checkpoint: {checkpoint.config}")
    print(f"  State: {checkpoint.values}")
    print(f"  Next: {checkpoint.next}")
    print(f"  Time: {checkpoint.created_at}")
```

---

## Actualizando Estado Durante la Ejecución

Puedes actualizar manualmente el estado de un hilo:

```python
config = {"configurable": {"thread_id": "thread-1"}}

# Inject new state values
app.update_state(
    config,
    {"messages": ["Injected message"], "turn_count": 99}
)

# Now when you invoke, it continues from the updated state
result = app.invoke({"messages": ["New message"]}, config)
```

[!SUCCESS]
`update_state()` te permite intervenir en el estado de un agente; es útil para comentarios humanos, corrección de errores o pruebas.

---

## Reanudando desde un Punto de Control Específico

Puedes reanudar la ejecución desde un checkpoint específico:

```python
# Get a specific checkpoint from history
history = list(app.get_state_history(config1))
if len(history) > 1:
    previous_checkpoint = history[1]  # Second-to-last checkpoint

    # Resume from that checkpoint
    result = app.invoke(
        None,  # No new input — use the checkpoint's state
        previous_checkpoint.config
    )
```

---

## Checkpointers SQLite y PostgreSQL

Para producción, usa checkpointers basados en base de datos que persistan entre reinicios:

### SQLite (desarrollo local)

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# File-based SQLite
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

# Or in-memory SQLite
checkpointer = SqliteSaver.from_conn_string(":memory:")
```

### PostgreSQL (producción)

```python
from langgraph.checkpoint.postgres import PostgresSaver

# Requires a PostgreSQL connection string
checkpointer = PostgresSaver.from_conn_string(
    "postgresql://user:pass@localhost:5432/langgraph"
)

# Initialize tables (run once)
checkpointer.setup()
```

[!WARNING]
Llama siempre a `checkpointer.setup()` en los checkpointers SQLite/PostgreSQL para asegurar que las tablas de la base de datos existan. Es una inicialización única.

---

## Contenido del Punto de Control

Cada checkpoint guarda:

```python
checkpoint = app.get_state(config)

# The full state dict
state_values = checkpoint.values

# Which nodes are pending execution
next_nodes = checkpoint.next

# Checkpoint metadata
metadata = checkpoint.config
# Includes: thread_id, checkpoint_id, checkpoint_ns

# Parent checkpoint (for branching)
parent = checkpoint.parent_config
```

---

## Ramificación desde Puntos de Control

Crea rutas de ejecución alternativas desde cualquier checkpoint:

```python
# Get the state at a specific checkpoint
checkpoint = list(app.get_state_history(config))[2]

# Create a new thread that continues from this checkpoint
branch_config = {"configurable": {"thread_id": "branch-thread"}}

# Copy the checkpoint's state to the new thread
app.update_state(branch_config, checkpoint.values)

# Now branch-thread continues from where the checkpoint was made
result = app.invoke({"messages": ["Alternative path"]}, branch_config)
```

---

## Configurando Frecuencia de Puntos de Control

De forma predeterminada, se guarda un checkpoint después de **cada ejecución de nodo**. Puedes controlar esto:

```python
from langgraph.checkpoint.memory import MemorySaver

# Configure checkpoint interval
checkpointer = MemorySaver()

# Option 1: Always checkpoint (default)
app = builder.compile(checkpointer=checkpointer)

# Option 2: Pass checkpoint config at invocation
config = {
    "configurable": {
        "thread_id": "my-thread",
        "checkpoint_ns": "custom"
    }
}
```

[!TIP]
Para grafos de alto rendimiento, hacer checkpoint después de cada nodo puede ser costoso. Considera agrupar o reducir la frecuencia de checkpointing en producción.

---

## Ejemplo Completo: Chatbot Persistente

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict
from typing import Annotated, List, Any
from operator import add

llm = ChatOpenAI(model="gpt-4o-mini")

class ChatState(TypedDict):
    messages: Annotated[List[Any], add]

def chat_node(state: ChatState) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

checkpointer = MemorySaver()

builder = StateGraph(ChatState)
builder.add_node("chat", chat_node)
builder.add_edge(START, "chat")
builder.add_edge("chat", END)

app = builder.compile(checkpointer=checkpointer)

# Multi-turn conversation
session = {"configurable": {"thread_id": "alice-session"}}

app.invoke({"messages": [("human", "Hi!")]}, session)
app.invoke({"messages": [("human", "What's my name?")]}, session)
# The bot remembers the context because state persists

# Different session — starts fresh
session2 = {"configurable": {"thread_id": "bob-session"}}
app.invoke({"messages": [("human", "What's my name?")]}, session2)
# Bob's session doesn't know about Alice's conversation
```

---

## Preguntas de Práctica (Practice Questions)

```question
{
  "id": "lg-intermediate-02-q1",
  "type": "multiple-choice",
  "question": "What parameter is passed to compile() to enable persistence?",
  "options": ["persister", "checkpointer", "saver", "storage"],
  "correct": 1,
  "explanation": "The checkpointer parameter (e.g., MemorySaver()) enables persistence when passed to compile()."
}
```

```question
{
  "id": "lg-intermediate-02-q2",
  "type": "multiple-choice",
  "question": "What organizes checkpoints in LangGraph?",
  "options": ["Session IDs", "Thread IDs", "User IDs", "Checkpoint names"],
  "correct": 1,
  "explanation": "Checkpoints are organized by thread IDs. Each thread represents one conversation or workflow session."
}
```

```question
{
  "id": "lg-intermediate-02-q3",
  "type": "multiple-choice",
  "question": "Which checkpointer is suitable for production deployment?",
  "options": ["MemorySaver", "SqliteSaver", "PostgresSaver", "Both SqliteSaver and PostgresSaver"],
  "correct": 3,
  "explanation": "SqliteSaver (file-based, single process) and PostgresSaver (multi-process production) are both suitable for production. MemorySaver is for development."
}
```

```question
{
  "id": "lg-intermediate-02-q4",
  "type": "multiple-choice",
  "question": "How often does LangGraph save checkpoints by default?",
  "options": ["Never", "After every node execution", "After the graph completes", "Every 5 seconds"],
  "correct": 1,
  "explanation": "By default, a checkpoint is created after every node execution, giving fine-grained save points."
}
```

```question
{
  "id": "lg-intermediate-02-q5",
  "type": "multiple-choice",
  "question": "What does app.get_state(config) return?",
  "options": [
    "The initial state",
    "The current state, pending nodes, and checkpoint metadata",
    "Only the final state",
    "A list of all errors"
  ],
  "correct": 1,
  "explanation": "get_state() returns a StateSnapshot with current values, next nodes to execute, and checkpoint config."
}
```

```question
{
  "id": "lg-intermediate-02-q6",
  "type": "multiple-choice",
  "question": "How do you manually inject state into an existing thread?",
  "options": ["app.inject_state()", "app.update_state()", "app.set_state()", "app.modify_state()"],
  "correct": 1,
  "explanation": "app.update_state(config, values) injects new values into an existing thread's state."
}
```

```question
{
  "id": "lg-intermediate-02-q7",
  "type": "multiple-choice",
  "question": "When resuming a thread with invoke(), how is the new input combined with existing state?",
  "options": [
    "Existing state is replaced",
    "New input is merged with existing state",
    "Existing state is ignored",
    "An error is thrown if state exists"
  ],
  "correct": 1,
  "explanation": "New input is merged with the existing persisted state. Existing keys keep their values; new keys are added."
}
```

```question
{
  "id": "lg-intermediate-02-q8",
  "type": "multiple-choice",
  "question": "What method lists all checkpoints for a thread?",
  "options": ["app.get_state()", "app.get_state_history()", "app.list_checkpoints()", "app.history()"],
  "correct": 1,
  "explanation": "app.get_state_history(config) returns an iterable of all checkpoints for the given thread config."
}
```

```question
{
  "id": "lg-intermediate-02-q9",
  "type": "multiple-choice",
  "question": "What is the purpose of checkpointing in LangGraph?",
  "options": [
    "To improve execution speed",
    "To save and restore graph state at any point during execution",
    "To automatically deploy graphs",
    "To generate documentation"
  ],
  "correct": 1,
  "explanation": "Checkpointing saves the full graph state after each node, enabling pause/resume, human-in-the-loop, and fault recovery."
}
```

```question
{
  "id": "lg-intermediate-02-q10",
  "type": "multiple-choice",
  "question": "How do you initialize database tables for SqliteSaver or PostgresSaver?",
  "options": [
    "They auto-initialize",
    "Call checkpointer.setup() once",
    "Run a migration script",
    "Tables are managed externally"
  ],
  "correct": 1,
  "explanation": "checkpointer.setup() creates the necessary database tables. This should be called once during application initialization."
}
```

---

[!SUCCESS]
### Conclusiones Clave
- MemorySaver ofrece persistencia en memoria; SqliteSaver y PostgresSaver para producción
- Los IDs de hilo organizan los checkpoints en sesiones
- Los checkpoints se guardan después de cada ejecución de nodo de forma predeterminada
- get_state() recupera el estado actual; get_state_history() enumera todos los checkpoints
- update_state() inyecta estado manualmente en un hilo
- Los hilos distintos tienen estados aislados: no comparten contexto
- Los checkpointers basados en base de datos requieren checkpointer.setup() antes del primer uso
- El checkpointing permite conversaciones con varios turnos, humano en el bucle y tolerancia a fallos
