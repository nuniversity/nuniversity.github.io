---
title: "Memoria de Conversación"
description: "Implementa memoria de conversación en LangGraph usando el reductor add_messages, almacenando y gestionando el historial de conversación entre turnos."
order: 3
duration: "35 min"
difficulty: "intermediate"
---

# Memoria de Conversación

La memoria de conversación es lo que permite al chatbot recordar lo que se dijo antes en la conversa. LangGraph lo maneja de forma natural mediante el estado persistente y el reductor `add_messages`.

---

## El Reductor add_messages

LangGraph proporciona un reductor `add_messages` integrado, diseñado específicamente para listas de mensajes de conversación:

```python
from langgraph.graph import add_messages
from typing_extensions import TypedDict, Annotated
from typing import List, Any

class ConversationState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    context: str
```

A diferencia de `operator.add` (que simplemente concatena), `add_messages` es **inteligente**:

1. Añade mensajes nuevos a la lista
2. **Actualiza** los mensajes existentes si se añade un mensaje con el mismo ID
3. Conserva el orden de los mensajes

```python
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

# add_messages handles these intelligently:
updates = [
    HumanMessage(content="Hello", id="1"),
    AIMessage(content="Hi!", id="2"),
    # If we add a message with the same ID, it updates in place:
    AIMessage(content="Hello there!", id="2")  # Replaces previous AIMessage
]
```

[!NOTE]
El reductor `add_messages` se prefiere a `operator.add` para las listas de mensajes porque gestiona correctamente la deduplicación y las actualizaciones in situ.

---

## Agregando Mensajes al Estado

Hay dos patrones para actualizar mensajes en el estado:

### Patrón 1: Anexar a la lista existente

```python
def chat_node(state: ConversationState) -> dict:
    response = llm.invoke(state["messages"])
    # Returns the new message(s) — add_messages handles appending
    return {"messages": [response]}
```

### Patrón 2: Devolver todos los mensajes (también funciona)

```python
def chat_node(state: ConversationState) -> dict:
    response = llm.invoke(state["messages"])
    # The reducer concatenates these with existing messages
    return {"messages": state["messages"] + [response]}
    # Both patterns produce the same result with add_messages
```

[!TIP]
El Patrón 1 es más eficiente: solo devuelves los mensajes nuevos en lugar de la lista completa. El reductor se encarga de la concatenación.

---

## Ejemplo Completo de Memoria de Conversación

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from typing_extensions import TypedDict, Annotated
from typing import List, Any

llm = ChatOpenAI(model="gpt-4o-mini")

class ChatState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    user_name: str

def chatbot(state: ChatState) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

# Build with persistence
checkpointer = MemorySaver()
builder = StateGraph(ChatState)
builder.add_node("chat", chatbot)
builder.add_edge(START, "chat")
builder.add_edge("chat", END)
app = builder.compile(checkpointer=checkpointer)

# Multi-turn conversation
session = {"configurable": {"thread_id": "user-1"}}

app.invoke({"messages": [HumanMessage("Hi, my name is Alice")]}, session)
app.invoke({"messages": [HumanMessage("What's my name?")]}, session)
# The bot remembers: "Your name is Alice"
```

[!SUCCESS]
Con persistencia + add_messages, el historial de conversación crece entre invocaciones. El LLM recibe el historial completo y mantiene el contexto.

---

## Recortando Historial de Conversación

El historial de conversación puede crecer más allá de la ventana de contexto del LLM. Trunca los mensajes antes de enviarlos al LLM:

```python
from langchain_core.messages import trim_messages

def chat_with_trimming(state: ChatState) -> dict:
    # Keep last 10 messages or 4000 tokens
    trimmed = trim_messages(
        state["messages"],
        strategy="last",
        max_tokens=4000,
        token_counter=len,  # Use char count as proxy
        start_on="human",   # Always start with a human message
        include_system=True
    )

    response = llm.invoke(trimmed)
    return {"messages": [response]}
```

### Estrategia de Recorte Personalizada

```python
def trim_to_token_limit(messages: list, max_tokens: int = 4000) -> list:
    """Keep messages within token budget, preserving the most recent."""
    import tiktoken
    enc = tiktoken.encoding_for_model("gpt-4o")

    total_tokens = 0
    keep = []

    for msg in reversed(messages):
        msg_tokens = len(enc.encode(msg.content))
        if total_tokens + msg_tokens > max_tokens:
            break
        total_tokens += msg_tokens
        keep.insert(0, msg)

    # Always include the system message if present
    if messages and messages[0].type == "system":
        keep.insert(0, messages[0])

    return keep
```

[!WARNING]
El truncado elimina el contexto antiguo. El LLM olvidará las partes iniciales de la conversa. Para conversaciones muy largas, usa la memoria basada en resúmenes (Lección 4).

---

## Persistencia de Mensaje del Sistema

Mantén un mensaje de sistema al inicio de la conversación:

```python
class ChatState(TypedDict):
    messages: Annotated[List[Any], add_messages]

def ensure_system_message(state: ChatState) -> dict:
    """Ensure the system message is always first."""
    messages = state["messages"]
    system_msg = SystemMessage(
        "You are a helpful assistant. The current date is 2024."
    )

    if not messages or messages[0].type != "system":
        return {"messages": [system_msg] + messages}

    return {}  # System message already present
```

---

## Extracción Estructurada de Memoria

Extrae y guarda información estructurada de las conversaciones:

```python
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    name: str = Field(default="")
    preferences: list = Field(default_factory=list)
    pain_points: list = Field(default_factory=list)

class MemoryState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    profile: UserProfile

def extract_profile(state: MemoryState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract user info from the conversation. Update the profile:\n"
                   "{current_profile}"),
        ("human", "{last_message}")
    ])

    parser = PydanticOutputParser(pydantic_object=UserProfile)
    chain = prompt | llm | parser

    last_msg = state["messages"][-1].content
    profile = chain.invoke({
        "current_profile": state["profile"].dict(),
        "last_message": last_msg
    })

    return {"profile": profile}
```

---

## Ejemplo Completo: Chatbot con Memoria Mejorada

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from typing_extensions import TypedDict, Annotated
from typing import List, Any

llm = ChatOpenAI(model="gpt-4o-mini")

class State(TypedDict):
    messages: Annotated[List[Any], add_messages]
    summary: str  # For long-term memory

def call_model(state: State) -> dict:
    system_prompt = "You are a helpful assistant."
    if state.get("summary"):
        system_prompt += f"\nConversation summary: {state['summary']}"

    messages = [SystemMessage(system_prompt)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}

checkpointer = MemorySaver()
builder = StateGraph(State)
builder.add_node("model", call_model)
builder.add_edge(START, "model")
builder.add_edge("model", END)
app = builder.compile(checkpointer=checkpointer)

session = {"configurable": {"thread_id": "memory-demo"}}
app.invoke({"messages": [HumanMessage("I love Python!")]}, session)
app.invoke({"messages": [HumanMessage("What do I love?")]}, session)
# → "You said you love Python!"
```

---

## Preguntas de Práctica (Practice Questions)

```question
{
  "id": "lg-intermediate-03-q1",
  "type": "multiple-choice",
  "question": "What reducer is specifically designed for conversation message lists?",
  "options": ["operator.add", "add_messages", "concat_messages", "merge_messages"],
  "correct": 1,
  "explanation": "add_messages is the LangGraph reducer for message lists. It handles appending, deduplication, and in-place updates."
}
```

```question
{
  "id": "lg-intermediate-03-q2",
  "type": "multiple-choice",
  "question": "What advantage does add_messages have over operator.add for message lists?",
  "options": [
    "It's faster",
    "It handles message IDs for deduplication and updates",
    "It compresses messages",
    "It encrypts messages"
  ],
  "correct": 1,
  "explanation": "add_messages uses message IDs to detect duplicates and update existing messages in place, unlike operator.add which blindly concatenates."
}
```

```question
{
  "id": "lg-intermediate-03-q3",
  "type": "multiple-choice",
  "question": "What happens to conversation state across invocations with persistence enabled?",
  "options": [
    "State is reset each time",
    "State accumulates across invocations on the same thread",
    "Only the last message is kept",
    "State is stored in a separate database"
  ],
  "correct": 1,
  "explanation": "With persistence, state (including messages) accumulates across invocations within the same thread ID."
}
```

```question
{
  "id": "lg-intermediate-03-q4",
  "type": "multiple-choice",
  "question": "Why is message trimming necessary for long conversations?",
  "options": [
    "To save disk space",
    "To stay within the LLM's context window limit",
    "To improve response quality",
    "To reduce latency"
  ],
  "correct": 1,
  "explanation": "LLMs have a maximum context window. Trimming keeps the conversation within this limit, though it may lose early context."
}
```

```question
{
  "id": "lg-intermediate-03-q5",
  "type": "multiple-choice",
  "question": "What strategy does trim_messages(strategy='last') use?",
  "options": [
    "Keeps the first messages",
    "Keeps the most recent messages",
    "Keeps random messages",
    "Keeps only system messages"
  ],
  "correct": 1,
  "explanation": "Strategy 'last' keeps the most recent messages, discarding older ones to stay within the token budget."
}
```

```question
{
  "id": "lg-intermediate-03-q6",
  "type": "multiple-choice",
  "question": "When returning messages from a node with add_messages reducer, what is the most efficient pattern?",
  "options": [
    "Return the full message list",
    "Return only the new messages (the reducer appends them)",
    "Return a single string",
    "Return an empty list"
  ],
  "correct": 1,
  "explanation": "Returning only the new messages is more efficient. The add_messages reducer handles concatenation with existing messages."
}
```

```question
{
  "id": "lg-intermediate-03-q7",
  "type": "multiple-choice",
  "question": "What field in a message does add_messages use for deduplication?",
  "options": [".content", ".type", ".id", ".name"],
  "correct": 2,
  "explanation": "add_messages uses the message's .id field. If a message with the same ID already exists, it updates in place instead of appending."
}
```

```question
{
  "id": "lg-intermediate-03-q8",
  "type": "multiple-choice",
  "question": "What is the limitation of simple message trimming?",
  "options": [
    "It's too slow",
    "It permanently loses early conversation context",
    "It requires a database",
    "It doesn't work with add_messages"
  ],
  "correct": 1,
  "explanation": "Trimming discards old messages entirely. The LLM forgets early parts of the conversation, unlike summarization which preserves key information."
}
```

```question
{
  "id": "lg-intermediate-03-q9",
  "type": "multiple-choice",
  "question": "How do you ensure a system message stays at the beginning of the message list?",
  "options": [
    "System messages are automatically preserved",
    "Add a node that checks and re-inserts the system message if missing",
    "System messages cannot be trimmed",
    "Use a separate state field for system messages"
  ],
  "correct": 1,
  "explanation": "Add an ensure_system_message node that checks if the first message is a system message and re-inserts it if needed."
}
```

```question
{
  "id": "lg-intermediate-03-q10",
  "type": "multiple-choice",
  "question": "What is the 'start_on' parameter in trim_messages used for?",
  "options": [
    "To start trimming from a specific index",
    "To ensure the first kept message is of the specified type (e.g., 'human')",
    "To start the conversation on a specific date",
    "To set the starting token count"
  ],
  "correct": 1,
  "explanation": "start_on='human' ensures the trimmed list starts with a HumanMessage, which is important for models trained to respond after user input."
}
```

---

[!SUCCESS]
### Conclusiones Clave
- `add_messages` es el reductor inteligente para el historial de conversación: añadir, deduplicar, actualizar
- Persistencia + add_messages permite la memoria de conversación con varios turnos
- Trunca los mensajes para mantenerte dentro de las ventanas de contexto del LLM
- Usa `trim_messages()` con la estrategia "last" para un truncado sencillo
- Patrón eficiente: devuelve solo los mensajes nuevos y deja que el reductor los añada
- Los IDs de mensaje permiten actualizaciones in situ mediante add_messages
- La conservación del mensaje de sistema requiere lógica explícita
- Para conversaciones muy largas, considera la memoria basada en resúmenes (Lección 4)
