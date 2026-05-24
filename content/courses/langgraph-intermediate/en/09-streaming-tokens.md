---
title: "Streaming Tokens"
description: "Master LangGraph streaming modes — values, updates, and custom streaming. Learn to stream LLM tokens from graph nodes in real-time."
order: 9
duration: "35 minutes"
difficulty: "intermediate"
---

# Streaming Tokens

Streaming lets you observe graph execution in real-time. LangGraph supports multiple streaming modes that give you fine-grained visibility into both state changes and LLM token output.

---

## Streaming Modes Overview

LangGraph provides three streaming modes:

| Mode | Description | Events |
| :--- | :--- | :--- |
| `"values"` | Full state after each node | `{"key": value, ...}` |
| `"updates"` | Only the changes from each node | `{"node": {"key": new_value}}` |
| Custom | Stream specific data from within nodes | Any data you yield |

---

## Values Mode

Emits the **complete state** after each node execution:

```python
config = {"configurable": {"thread_id": "stream-test"}}

for event in app.stream(
    {"messages": [HumanMessage("Hello")]},
    config,
    stream_mode="values"
):
    print(event)
    # First event: initial state
    # Second event: state after node 1
    # Third event: state after node 2
    # etc.
```

Output:
```
{'messages': [HumanMessage('Hello')], 'output': ''}
{'messages': [HumanMessage('Hello'), AIMessage('Hi!')], 'output': 'Hi!'}
```

[!NOTE]
"values" mode is the most comprehensive — you see the full state at every step. It's ideal for debugging and understanding state evolution.

---

## Updates Mode

Emits **only the changes** from each node, keyed by node name:

```python
for event in app.stream(
    {"messages": [HumanMessage("Hello")]},
    config,
    stream_mode="updates"
):
    for node_name, update in event.items():
        if node_name != "__end__":
            print(f"[{node_name}] → {update}")
```

Output:
```
[node_a] → {'output': 'Processing...'}
[node_b] → {'output': 'Done!', 'messages': [AIMessage('Done!')]}
```

[!TIP]
"updates" mode is more efficient than "values" mode. Use it in production where you only care about what changed, not the full state.

---

## Streaming LLM Tokens

For real-time token-by-token output from an LLM inside a node, use LangGraph's **callbacks** or LangChain's .astream_events():

### Using astream_events (Legacy)

```python
from langchain_core.messages import HumanMessage

# In your node function, use astream_events
async def streaming_node(state: State) -> dict:
    full = ""
    async for event in llm.astream_events(
        state["messages"],
        version="v2"
    ):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"].content
            full += chunk
            # Send to client via WebSocket, etc.
    return {"output": full}
```

### Using .astream() (Modern)

```python
async def streaming_node(state: State) -> dict:
    full = ""
    async for chunk in llm.astream(state["messages"]):
        content = chunk.content
        full += content
        # Stream to client in real-time
        print(content, end="", flush=True)
    return {"output": full}
```

[!IMPORTANT]
Token streaming requires async (`async for`). You can use `async def` nodes in LangGraph, but the graph must be invoked with `ainvoke()` or `astream()`.

---

## Custom Streaming with Callbacks

Define custom callbacks to capture streaming data:

```python
from langchain_core.callbacks import BaseCallbackHandler
from typing import Any, Dict, List

class TokenCollector(BaseCallbackHandler):
    def __init__(self):
        self.tokens: List[str] = []

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        self.tokens.append(token)

def node_with_callback(state: State) -> dict:
    collector = TokenCollector()
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        callbacks=[collector]
    )
    response = llm.invoke(state["messages"])
    return {
        "output": response.content,
        "token_count": len(collector.tokens)
    }
```

---

## Streaming from Specific Nodes

Filter streaming to focus on specific nodes:

```python
# Stream only updates from specific nodes
for event in app.stream(inputs, config, stream_mode="updates"):
    for node_name, update in event.items():
        if node_name == "chat_node":
            # Process chat node updates
            print(update)
        elif node_name == "tool_node":
            # Process tool node updates
            print(update)
```

---

## Async Graph Execution with Streaming

```python
import asyncio
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class StreamState(TypedDict):
    messages: list
    output: str

async def async_node(state: StreamState) -> dict:
    full = ""
    async for chunk in llm.astream(state["messages"]):
        full += chunk.content
    return {"output": full}

builder = StateGraph(StreamState)
builder.add_node("chat", async_node)
builder.add_edge(START, "chat")
builder.add_edge("chat", END)
app = builder.compile()

async def main():
    async for event in app.astream(
        {"messages": [HumanMessage("Tell me a story")], "output": ""},
        stream_mode="updates"
    ):
        print(event)

asyncio.run(main())
```

---

## Streaming with LangGraph's Event System

LangGraph provides its own event system for custom streaming:

```python
from langgraph.graph import StateGraph
from typing import Any, Dict, Iterator

def node_with_yield(state: State) -> Iterator[Dict[str, Any]]:
    """Use yield to stream intermediate results."""
    yield {"status": "started"}

    # Simulate work
    import time
    for i in range(3):
        time.sleep(0.5)
        yield {"progress": i * 33}

    yield {"status": "complete", "result": "Done!"}

# This node can return or yield updates
builder.add_node("streaming_node", node_with_yield)
```

---

## Streaming Mode Comparison

| Mode | Token Level | State Level | Latency | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `"values"` | No | Full state | After each node | Debugging, full visibility |
| `"updates"` | No | Partial changes | After each node | Production, minimal data |
| Callback | Yes | No | Real-time | Token-by-token display |
| astream | Yes | No | Real-time | Async token streaming |

---

## Complete Streaming Example

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from typing_extensions import TypedDict, Annotated
from typing import List, Any

llm = ChatOpenAI(model="gpt-4o-mini", streaming=True)

class ChatState(TypedDict):
    messages: Annotated[List[Any], add_messages]

def chat_node(state: ChatState) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

builder = StateGraph(ChatState)
builder.add_node("chat", chat_node)
builder.add_edge(START, "chat")
builder.add_edge("chat", END)

app = builder.compile(checkpointer=MemorySaver())

# Stream values (full state after each node)
for event in app.stream(
    {"messages": [HumanMessage("Tell me a story")]},
    {"configurable": {"thread_id": "stream-demo"}},
    stream_mode="values"
):
    if "messages" in event and event["messages"]:
        print(event["messages"][-1].content if hasattr(event["messages"][-1], "content") else event["messages"][-1])
```

---

## Async Token-Level Streaming

```python
import asyncio

async def main():
    builder = StateGraph(ChatState)
    builder.add_node("chat", chat_node)
    builder.add_edge(START, "chat")
    builder.add_edge("chat", END)
    app = builder.compile()

    async for event in app.astream(
        {"messages": [HumanMessage("Write a poem")]},
        stream_mode="updates"
    ):
        for node, update in event.items():
            if node == "chat" and "messages" in update:
                msg = update["messages"][-1]
                if hasattr(msg, "content"):
                    print(msg.content, end="", flush=True)

asyncio.run(main())
```

[!SUCCESS]
Async streaming provides real-time token output, making your agent feel responsive and interactive to end users.

---

## Practice Questions

```question
{
  "id": "lg-intermediate-09-q1",
  "type": "multiple-choice",
  "question": "Which streaming mode emits the full state after each node?",
  "options": ["values", "updates", "full", "detailed"],
  "correct": 0,
  "explanation": "'values' mode emits the complete state after every node execution."
}
```

```question
{
  "id": "lg-intermediate-09-q2",
  "type": "multiple-choice",
  "question": "Which streaming mode emits only the changes keyed by node name?",
  "options": ["values", "updates", "deltas", "changes"],
  "correct": 1,
  "explanation": "'updates' mode emits only the state changes from each node, keyed by node name."
}
```

```question
{
  "id": "lg-intermediate-09-q3",
  "type": "multiple-choice",
  "question": "How do you stream tokens from an LLM inside a node?",
  "options": [
    "Use llm.stream() or llm.astream() with streaming=True on the LLM",
    "Set stream_mode='tokens' on invoke",
    "Token streaming is not supported in LangGraph",
    "Use a print statement"
  ],
  "correct": 0,
  "explanation": "Enable streaming=True on the LLM and use .stream() or .astream() to get token-level output."
}
```

```question
{
  "id": "lg-intermediate-09-q4",
  "type": "multiple-choice",
  "question": "What LangChain component captures LLM tokens during generation?",
  "options": ["TokenParser", "BaseCallbackHandler (on_llm_new_token)", "StreamHandler", "TokenCollector"],
  "correct": 1,
  "explanation": "BaseCallbackHandler with the on_llm_new_token method captures each token as the LLM generates it."
}
```

```question
{
  "id": "lg-intermediate-09-q5",
  "type": "multiple-choice",
  "question": "What method do you use for async graph execution with streaming?",
  "options": ["invoke()", "astream()", "stream_sync()", "arun()"],
  "correct": 1,
  "explanation": "app.astream() is the async version of stream(). Use it with async for to get streaming events."
}
```

```question
{
  "id": "lg-intermediate-09-q6",
  "type": "multiple-choice",
  "question": "Which streaming mode is most efficient for production use?",
  "options": ["values", "updates", "Both are equally efficient", "Neither"],
  "correct": 1,
  "explanation": "'updates' is more efficient because it only sends changes, not the full state, reducing data transfer."
}
```

```question
{
  "id": "lg-intermediate-09-q7",
  "type": "multiple-choice",
  "question": "What is the event type for LLM token chunks in astream_events?",
  "options": ["on_llm_start", "on_chat_model_stream", "on_llm_end", "on_token"],
  "correct": 1,
  "explanation": "'on_chat_model_stream' events are emitted for each token chunk when using astream_events with version 'v2'."
}
```

```question
{
  "id": "lg-intermediate-09-q8",
  "type": "multiple-choice",
  "question": "How do you enable streaming on a ChatOpenAI model?",
  "options": [
    "Set streaming=True in the constructor",
    "Call model.enable_streaming()",
    "Streaming is always enabled",
    "Set stream_mode='tokens' in the config"
  ],
  "correct": 0,
  "explanation": "Pass streaming=True to ChatOpenAI(model='gpt-4o-mini', streaming=True) to enable token-level streaming."
}
```

```question
{
  "id": "lg-intermediate-09-q9",
  "type": "multiple-choice",
  "question": "What keyword allows a node function to emit multiple events?",
  "options": ["return", "yield", "emit", "send"],
  "correct": 1,
  "explanation": "Using yield in a node function (making it a generator) lets it emit multiple events during execution."
}
```

```question
{
  "id": "lg-intermediate-09-q10",
  "type": "multiple-choice",
  "question": "What is the benefit of token-level streaming for end users?",
  "options": [
    "It uses fewer API credits",
    "It provides a responsive, real-time experience as tokens appear",
    "It improves answer quality",
    "It reduces latency"
  ],
  "correct": 1,
  "explanation": "Token-level streaming shows text as it's generated, making the agent feel responsive and interactive rather than forcing users to wait for the full response."
}
```

---

[!SUCCESS]
### Key Takeaways
- "values" mode: full state after each node (debugging)
- "updates" mode: only changes, keyed by node name (production)
- Token streaming via llm.stream() or llm.astream() with streaming=True
- BaseCallbackHandler on_llm_new_token captures individual tokens
- Async execution with astream() for non-blocking streaming
- yield in nodes allows multiple emissions per node
- Token streaming makes agents feel responsive to end users
- Choose the streaming mode based on your visibility vs efficiency needs
