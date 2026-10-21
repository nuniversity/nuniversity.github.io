---
title: "Streaming de Tokens"
description: "Domina los modos de streaming de LangGraph — values, updates y streaming personalizado. Aprende a transmitir tokens LLM desde nodos del grafo en tiempo real."
order: 9
duration: "35 min"
difficulty: "intermediate"
---

# Streaming de Tokens

La transmisión te permite observar la ejecución del grafo en tiempo real. LangGraph admite múltiples modos de transmisión que ofrecen una visión detallada tanto de los cambios de estado como de la salida de tokens del LLM.

---

## Visión General de Modos de Streaming

LangGraph proporciona tres modos de transmisión:

| Modo | Descripción | Eventos |
| :--- | :--- | :--- |
| `"values"` | Estado completo después de cada nodo | `{"key": value, ...}` |
| `"updates"` | Solo los cambios de cada nodo | `{"node": {"key": new_value}}` |
| Personalizado | Transmite datos específicos desde dentro de los nodos | Cualquier dato que entregues |

---

## Modo Values

Emite el **estado completo** después de cada ejecución de nodo:

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
El modo "values" es el más integral: ves el estado completo en cada paso. Es ideal para depurar y comprender la evolución del estado.

---

## Modo Updates

Emite **solo los cambios** de cada nodo, indexados por el nombre del nodo:

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
El modo "updates" es más eficiente que el modo "values". Úsalo en producción cuando solo te interese qué cambió, no el estado completo.

---

## Streaming de Tokens LLM

Para una salida en tiempo real token a token de un LLM dentro de un nodo, usa los **callbacks** de LangGraph o el .astream_events() de LangChain:

### Uso de astream_events (legado)

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

### Uso de .astream() (moderno)

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
La transmisión de tokens requiere async (`async for`). Puedes usar nodos `async def` en LangGraph, pero el grafo debe invocarse con `ainvoke()` o `astream()`.

---

## Streaming Personalizado con Callbacks

Define callbacks personalizados para capturar los datos de la transmisión:

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

## Streaming de Nodos Específicos

Filtra la transmisión para centrarte en nodos concretos:

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

## Ejecución Asíncrona del Grafo con Streaming

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

## Streaming con el Sistema de Eventos de LangGraph

LangGraph proporciona su propio sistema de eventos para la transmisión personalizada:

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

## Comparación de Modos de Streaming

| Modo | Nivel de token | Nivel de estado | Latencia | Caso de uso |
| :--- | :--- | :--- | :--- | :--- |
| `"values"` | No | Estado completo | Después de cada nodo | Depuración, visión completa |
| `"updates"` | No | Cambios parciales | Después de cada nodo | Producción, datos mínimos |
| Callback | Sí | No | Tiempo real | Visualización token a token |
| astream | Sí | No | Tiempo real | Transmisión asíncrona de tokens |

---

## Ejemplo Completo de Streaming

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

## Streaming Asíncrono a Nivel de Token

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
La transmisión asíncrona proporciona salida de tokens en tiempo real, lo que hace que tu agente se sienta responsivo e interactivo para los usuarios finales.

---

## Preguntas de Práctica (Practice Questions)

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
### Conclusiones Clave
- Modo "values": estado completo después de cada nodo (depuración)
- Modo "updates": solo los cambios, indexados por el nombre del nodo (producción)
- Transmisión de tokens mediante llm.stream() o llm.astream() con streaming=True
- El on_llm_new_token de BaseCallbackHandler captura tokens individuales
- Ejecución asíncrona con astream() para una transmisión sin bloqueo
- El yield en los nodos permite múltiples emisiones por nodo
- La transmisión de tokens hace que los agentes se sientan responsivos para los usuarios finales
- Elige el modo de transmisión según tus necesidades de visión frente a eficiencia
