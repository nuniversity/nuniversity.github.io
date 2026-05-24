---
title: "Persistence and Checkpointing"
description: "Learn how to persist graph state with MemorySaver, save and load checkpoints, and use thread-based state management."
order: 2
duration: "30 minutes"
difficulty: "intermediate"
---

# Persistence and Checkpointing

One of LangGraph's most powerful features is persistence — the ability to save and restore graph state at any point during execution. This enables long-running agents, human-in-the-loop workflows, and fault-tolerant systems.

---

## Why Persistence Matters

Without persistence, every graph invocation starts from scratch. With persistence:

- **State survives across invocations**: Resume where you left off
- **Human-in-the-loop**: Pause execution, inspect state, provide input, resume
- **Fault tolerance**: Recover from crashes without losing progress
- **Multi-turn conversations**: Maintain context across multiple interactions

---

## MemorySaver: In-Memory Persistence

`MemorySaver` stores checkpoints in memory. It's simple and fast, but state is lost when the process exits.

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
The `checkpointer` parameter is passed to `.compile()`. Once set, every node execution creates a checkpoint that can be retrieved later.

---

## Thread IDs

Checkpoints are organized by **thread ID**. A thread represents a single conversation or workflow session:

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
When using a checkpointer, the initial state you pass to `invoke()` is merged with the existing thread state. Keys that already exist in the thread keep their values; new keys are added.

---

## Retrieving Checkpoints

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

## Updating State Mid-Execution

You can manually update state for a thread:

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
`update_state()` lets you intervene in an agent's state — useful for human feedback, error correction, or testing.

---

## Resuming from a Specific Checkpoint

You can resume execution from a specific checkpoint:

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

## SQLite and PostgreSQL Checkpointers

For production, use database-backed checkpointers that persist across restarts:

### SQLite (Local Development)

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# File-based SQLite
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

# Or in-memory SQLite
checkpointer = SqliteSaver.from_conn_string(":memory:")
```

### PostgreSQL (Production)

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
Always call `checkpointer.setup()` for SQLite/PostgreSQL checkpointers to ensure database tables exist. This is a one-time initialization.

---

## Checkpoint Contents

Each checkpoint stores:

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

## Branching from Checkpoints

Create alternative execution paths from any checkpoint:

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

## Configuring Checkpoint Frequency

By default, a checkpoint is saved after **every node execution**. You can control this:

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
For high-throughput graphs, checkpointing after every node can be expensive. Consider batching or reducing checkpoint frequency in production.

---

## Complete Example: Persistent Chatbot

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

## Practice Questions

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
### Key Takeaways
- MemorySaver provides in-memory persistence; SqliteSaver and PostgresSaver for production
- Thread IDs organize checkpoints into sessions
- Checkpoints are saved after every node execution by default
- get_state() retrieves current state; get_state_history() lists all checkpoints
- update_state() manually injects state into a thread
- Different threads have isolated state — they don't share context
- Database-backed checkpointers require checkpointer.setup() before first use
- Checkpointing enables multi-turn conversations, human-in-the-loop, and fault tolerance
