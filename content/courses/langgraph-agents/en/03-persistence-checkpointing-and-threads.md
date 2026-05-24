---
title: "Persistence, Checkpointing and Threads"
description: "Explore MemorySaver, per-thread checkpointing, replaying from checkpoints, branching from past states, and PostgresSaver for production."
order: 3
duration: "45 min"
difficulty: "intermediate"
---

# Persistence, Checkpointing and Threads

One of LangGraph's most powerful features is **persistence**. Every step of a graph execution can be saved as a checkpoint, enabling replay, rollback, and branching from any prior state.

---

## Mermaid: Checkpoint Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Graph
    participant S as CheckpointSaver
    participant DB as Storage

    C->>G: invoke(state, thread_id="t1")
    G->>S: save_checkpoint(step_1_state)
    S->>DB: INSERT checkpoint_1
    G->>C: return partial result
    C->>G: invoke(new_input, thread_id="t1")
    G->>S: save_checkpoint(step_2_state)
    S->>DB: INSERT checkpoint_2
    C->>G: invoke(None, thread_id="t1", checkpoint_id="ckpt_1")
    G->>S: load_checkpoint("ckpt_1")
    S->>DB: SELECT checkpoint_1
    G->>C: resume from checkpoint_1
```

Every `invoke()` call with a `thread_id` triggers a checkpoint save after each node. Checkpoints are stored sequentially within a thread, forming an append-only timeline.

---

## MemorySaver

`MemorySaver` is the simplest checkpointing backend. It stores checkpoints in memory and is ideal for prototyping.

```python
from langgraph.checkpoint import MemorySaver
from langgraph.graph import StateGraph, START, END

# Create a checkpoint saver
memory = MemorySaver()

# Pass it when compiling
app = builder.compile(checkpointer=memory)

# Each invocation needs a thread config
config = {"configurable": {"thread_id": "session-1"}}
result = app.invoke({"messages": ["Hello"]}, config)
```

[!WARNING]
MemorySaver is ephemeral — all checkpoints are lost when the Python process ends. Use PostgresSaver or a custom saver for production workloads.

### Comparison: Checkpoint Backends

| Feature | MemorySaver | PostgresSaver | Custom Saver |
| :--- | :--- | :--- | :--- |
| Persistence | In-memory | PostgreSQL | User-defined |
| Production-ready | No | Yes | Depends on impl. |
| Thread isolation | Yes | Yes | Yes |
| Replay support | Yes | Yes | Must implement |
| Branching support | Yes | Yes | Must implement |
| Setup complexity | None | Requires DB schema | High |
| Cross-process survival | No | Yes | Depends on impl. |
| Scalability | Single process | Multi-process | User-defined |
| Cost | Free | Storage costs | Variable |

---

## Mermaid: Thread State Diagram

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: first invoke()
    ACTIVE --> CHECKPOINTED: after node executes
    CHECKPOINTED --> ACTIVE: next invoke()
    CHECKPOINTED --> BRANCHED: fork with new thread_id
    BRANCHED --> ACTIVE: independent execution
    ACTIVE --> COMPLETED: all paths reach END
    COMPLETED --> [*]

    state CHECKPOINTED {
        [*] --> CKPT_1
        CKPT_1 --> CKPT_2
        CKPT_2 --> CKPT_3
    }
```

Each thread transitions through active running states and checkpointed pause points. Branches create entirely new thread lineages from a parent checkpoint.

---

## Checkpointing States Per Thread

A **thread** is a conversation or execution session identified by a `thread_id`. LangGraph stores a new checkpoint after every node execution within a thread.

```python
# Same graph, same thread — state accumulates
app.invoke({"messages": ["Turn 1"]}, {"configurable": {"thread_id": "t1"}})
app.invoke({"messages": ["Turn 2"]}, {"configurable": {"thread_id": "t1"}})

# Different thread — isolated state
app.invoke({"messages": ["Thread 2 start"]}, {"configurable": {"thread_id": "t2"}})
```

State is namespaced per thread. Checkpoints form a timeline within each thread.

[!IMPORTANT]
Thread isolation is critical in production. Each user session gets its own `thread_id` — never share a `thread_id` across users. Use a unique identifier like `user_id:conversation_id` as the thread ID to guarantee isolation.

---

## Replaying from Checkpoints

You can **replay** execution from a specific checkpoint by providing a `checkpoint_id`.

```python
# Get the parent checkpoint ID from the last run
parent_id = result["__run"]["checkpoint_id"]

# Replay from that checkpoint
replayed = app.invoke(
    {"messages": ["New message"]},
    {"configurable": {"thread_id": "t1", "checkpoint_id": parent_id}}
)
```

Replay does **not** re-execute nodes before the checkpoint — it resumes from that exact state.

[!TIP]
Replay is invaluable for testing and debugging. You can replay a specific checkpoint with modified input to see how the graph would behave with different data at that exact state.

### Checkpoint Replay with thread_id

```python
import uuid

def replay_thread(app, thread_id: str, checkpoint_id: str, new_input: dict):
    """Utility function to replay a checkpoint."""
    config = {
        "configurable": {
            "thread_id": thread_id,
            "checkpoint_id": checkpoint_id,
        }
    }
    return app.invoke(new_input, config)

# Usage
result = replay_thread(
    app,
    thread_id="user-123",
    checkpoint_id="1ef345ab...",
    new_input={"messages": ["Corrected query"]}
)
```

---

## Branching from Past States

You can fork a thread at any checkpoint, creating a **branch** that diverges from the original timeline.

```python
# Fork from an earlier checkpoint
fork_config = {
    "configurable": {
        "thread_id": "t1-branch-1",
        "checkpoint_id": parent_id
    }
}
fork_result = app.invoke({"messages": ["Branch message"]}, fork_config)
```

The branch starts with the state of the parent checkpoint and proceeds independently. This is useful for "what-if" analysis or human corrections.

### Branch Creation Example

```python
def create_branch(app, original_thread: str, checkpoint_id: str, branch_suffix: str, new_input: dict):
    """Create a branch from a checkpoint and execute it."""
    branch_thread = f"{original_thread}-{branch_suffix}"
    config = {
        "configurable": {
            "thread_id": branch_thread,
            "checkpoint_id": checkpoint_id,
        }
    }
    return app.invoke(new_input, config)

# Compare two branches from the same checkpoint
branch_a = create_branch(app, "session-1", ckpt_id, "rollback", {"messages": ["Try A"]})
branch_b = create_branch(app, "session-1", ckpt_id, "experiment", {"messages": ["Try B"]})

# Analyze which branch produced better results
```

[!TIP]
Branching enables **A/B testing of agent decisions**. Run multiple branches from the same checkpoint with different prompts, parameters, or routes, then compare outcomes to optimize your agent.

---

## Checkpoint Storage Costs

[!WARNING]
Every node execution creates a full state checkpoint. If your state is large (e.g., embedding vectors, full conversation histories), checkpoint storage can grow quickly. Consider:
- Using PostgresSaver with table partitioning by thread_id
- Implementing a retention policy that prunes old checkpoints
- Keeping state schemas lean — only store what downstream nodes need
- Using custom savers with S3/GCS lifecycle policies

---

## PostgresSaver for Production

`PostgresSaver` persists checkpoints to a PostgreSQL database, surviving restarts.

```python
from langgraph.checkpoint import PostgresSaver
import asyncpg

# Connect to PostgreSQL
conn = await asyncpg.connect("postgresql://user:pass@localhost/langgraph")
saver = PostgresSaver(conn)

# Compile with the production saver
app = builder.compile(checkpointer=saver)

# State survives process restarts
result = await app.ainvoke({"messages": ["Hello"]}, {"configurable": {"thread_id": "prod-1"}})
```

```bash
# Schema setup (run once)
pip install langgraph-checkpoint-postgres
python -c "from langgraph.checkpoint import PostgresSaver; PostgresSaver.create_tables('postgresql://user:pass@localhost/langgraph')"
```

### Production PostgresSaver Setup

```python
import asyncpg
from langgraph.checkpoint import PostgresSaver
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_graph_app():
    """Production-ready graph with Postgres persistence."""
    conn = await asyncpg.connect(
        user="app_user",
        password="app_password",
        host="postgres.example.com",
        port=5432,
        database="langgraph_prod",
        # Connection pooling is recommended for production
        min_size=5,
        max_size=20,
    )
    try:
        saver = PostgresSaver(conn)
        app = builder.compile(checkpointer=saver)
        yield app
    finally:
        await conn.close()

# Usage
async with get_graph_app() as app:
    result = await app.ainvoke(
        {"messages": ["Process order 12345"]},
        {"configurable": {"thread_id": "order:12345:user:678"}}
    )
```

---

## Mermaid: Checkpoint Timeline

```mermaid
flowchart LR
    S1["Step 1"] --> CK1["[CKPT 1]"]
    S2["Step 2"] --> CK2["[CKPT 2]"]
    S3["Step 3"] --> CK3["[CKPT 3]"]
    S4["Step 4"] --> CK4["[CKPT 4]"]
    CK3 --> BCK3["[Branch CKPT 3']"]
    BCK3 --> S3P["Step 3'"]

    S1 --> S2 --> S3 --> S4
    CK1 -.-> CK2 -.-> CK3 -.-> CK4
```

Each checkpoint is a snapshot of the full state. Branches fork from a parent checkpoint and create their own timeline.

---

## Mermaid: Thread Isolation Visualization

```mermaid
sequenceDiagram
    participant U1 as User 1 Thread
    participant U2 as User 2 Thread
    participant G as Graph (shared)
    participant DB as Checkpoint Store

    U1->>G: invoke("Hello", thread_id="u1")
    G->>DB: save_checkpoint(u1, ckpt_1)
    U2->>G: invoke("Hi", thread_id="u2")
    G->>DB: save_checkpoint(u2, ckpt_1)
    U1->>G: invoke("How are you?", thread_id="u1")
    G->>DB: save_checkpoint(u1, ckpt_2)
    Note over DB: u1 and u2 states are completely isolated
```

Thread isolation ensures that User 1's conversation never leaks into User 2's state. Each thread has its own independent checkpoint chain.

---

```question
{
  "id": "lg-03-q1",
  "type": "multiple-choice",
  "question": "Which saver is appropriate for production use?",
  "options": ["MemorySaver", "PostgresSaver", "FileSaver", "RedisSaver"],
  "correct": 1,
  "explanation": "PostgresSaver persists checkpoints to PostgreSQL and survives process restarts, making it suitable for production."
}
```

```question
{
  "id": "lg-03-q2",
  "type": "multiple-choice",
  "question": "What identifies a unique execution session in LangGraph?",
  "options": ["node_id", "thread_id", "run_id", "graph_id"],
  "correct": 1,
  "explanation": "A thread_id uniquely identifies a conversation or execution session, with checkpoints stored per thread."
}
```

```question
{
  "id": "lg-03-q3",
  "type": "multiple-choice",
  "question": "What happens when you replay from a checkpoint?",
  "options": ["All nodes re-execute from the beginning", "Execution resumes from the checkpoint state without re-running prior nodes", "The checkpoint is deleted", "The graph is recompiled"],
  "correct": 1,
  "explanation": "Replaying from a checkpoint resumes execution from that exact state without re-executing prior nodes."
}
```

```question
{
  "id": "lg-03-q4",
  "type": "multiple-choice",
  "question": "What is a branch in LangGraph checkpointing?",
  "options": ["A parallel edge in the graph", "A fork from a past checkpoint that creates a divergent timeline", "A conditional route", "A new thread with empty state"],
  "correct": 1,
  "explanation": "A branch forks from a parent checkpoint and creates its own independent timeline for what-if analysis."
}
```

```question
{
  "id": "lg-03-q5",
  "type": "multiple-choice",
  "question": "Which of the following is NOT a feature of MemorySaver?",
  "options": ["Thread isolation", "Checkpoint replay", "Cross-process persistence", "Branching"],
  "correct": 2,
  "explanation": "MemorySaver is ephemeral and stores checkpoints in-memory only, so it does not support cross-process persistence."
}
```

```question
{
  "id": "lg-03-q6",
  "type": "multiple-choice",
  "question": "Scenario: You need to debug why an agent gave a wrong answer two turns ago. You have the checkpoint IDs. What should you do?",
  "options": ["Restart the entire conversation", "Replay from the checkpoint before the mistake with corrected input", "Delete all checkpoints and rebuild", "Use a different thread_id"],
  "correct": 1,
  "explanation": "Replaying from the checkpoint just before the erroneous node lets you inspect the exact state and test corrected inputs."
}
```

---

[!SUCCESS]
### Key Takeaways
- MemorySaver stores checkpoints in-process memory for prototyping.
- Each thread (`thread_id`) has an independent state and checkpoint timeline.
- Replaying from a checkpoint resumes execution without re-running prior steps.
- Branching forks a timeline from any past checkpoint for experimentation.
- PostgresSaver provides production-grade persistence with full replay and branching.
- Checkpoints are stored after every node execution by default.
- Custom savers can implement any backend (Redis, S3, etc.).
- Thread isolation is essential for multi-tenant production systems.
- Use unique thread IDs per user session to prevent state leakage.
- Monitor checkpoint storage costs with large state schemas.
