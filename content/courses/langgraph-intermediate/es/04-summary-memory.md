---
title: "Memoria de Resumen"
description: "Implementa resumen de conversación para agentes de larga duración, nodos de memoria de resumen y estrategias de truncamiento para gestionar ventanas de contexto."
order: 4
duration: "35 min"
difficulty: "intermediate"
---

# Memoria de Resumen

Cuando las conversaciones crecen más allá de la ventana de contexto del LLM, el truncado simple descarta contexto valioso. El **resumen** preserva la información clave en una forma comprimida y mantiene la conversación manejable.

---

## El Problema con Conversaciones Largas

Los LLM tienen límites de tokens. Cuando una conversación supera el límite:

1. **Truncamiento**: Descarta los mensajes iniciales: pierde contexto
2. **Error**: Ventana de contexto superada: la solicitud falla

El resumen lo resuelve comprimiendo el historial en un resumen y conservando los detalles importantes.

---

## Arquitectura de Memoria de Resumen

```
Conversation Flow:
[Message 1] → [Message 2] → ... → [Message 10] → [Summarize]
                                                       ↓
[Summary] ← [Message 11] → [Message 12] → ... → [Message 20] → [Update Summary]
                                                                    ↓
[Updated Summary] ← ...
```

Un nodo de resumen se activa periódicamente para condensar la conversación.

---

## Nodo de Resumen Básico

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import TypedDict, Annotated
from typing import List, Any

llm = ChatOpenAI(model="gpt-4o-mini")

class State(TypedDict):
    messages: Annotated[List[Any], add_messages]
    summary: str

def summarize_conversation(state: State) -> dict:
    current_summary = state.get("summary", "No summary yet.")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a conversation summarizer. Given the current "
                   "summary and the new messages, create an updated summary. "
                   "Keep it concise but include all key information.\n\n"
                   "Current summary:\n{summary}"),
        ("human", "New messages to incorporate:\n{messages}")
    ])

    chain = prompt | llm | StrOutputParser()
    recent = state["messages"][-4:]  # Last 4 messages
    messages_text = "\n".join(f"{m.type}: {m.content}" for m in recent)

    new_summary = chain.invoke({
        "summary": current_summary,
        "messages": messages_text
    })

    return {"summary": new_summary}
```

[!NOTE]
El nodo de resumen lee el resumen actual y los mensajes recientes y produce un resumen **actualizado**. Este enfoque incremental es más eficiente que resumir toda la conversación de nuevo.

---

## Cuándo Resumir: Estrategias de Activación

### Estrategia 1: Umbral de Conteo de Mensajes

```python
def should_summarize(state: State) -> str:
    if len(state["messages"]) > 10:  # Summarize every 10 messages
        return "summarize"
    return "respond"

# In graph:
builder.add_conditional_edges(
    "check",
    should_summarize,
    {
        "summarize": "summarize_node",
        "respond": "chat_node"
    }
)
```

### Estrategia 2: Umbral de Conteo de Tokens

```python
import tiktoken

def should_summarize_by_tokens(state: State) -> str:
    enc = tiktoken.encoding_for_model("gpt-4o")
    total = sum(len(enc.encode(m.content)) for m in state["messages"])

    if total > 3000:  # Summarize if over 3000 tokens
        return "summarize"
    return "respond"
```

### Estrategia 3: Periódico (Cada N Turnos)

```python
def should_summarize_periodic(state: State) -> str:
    # Summarize every 5 turns
    if len(state["messages"]) >= 5 and len(state["messages"]) % 5 == 0:
        return "summarize"
    return "respond"
```

[!SUCCESS]
Elige tu estrategia de activación según la duración esperada de la conversación y el tamaño de los mensajes. La basada en tokens es la más precisa; la basada en recuento es la más sencilla.

---

## Agente de Resumen Completo

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing_extensions import TypedDict, Annotated
from typing import List, Any

llm = ChatOpenAI(model="gpt-4o-mini")

class AgentState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    summary: str

def chat_node(state: AgentState) -> dict:
    system_msg = "You are a helpful assistant."
    if state.get("summary"):
        system_msg += f"\n\nSummary of conversation:\n{state['summary']}"

    messages = [SystemMessage(system_msg)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}

def summarize_node(state: AgentState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Update the conversation summary. Include all important "
                   "information from the new messages.\n\n"
                   "Current summary: {summary}"),
        ("human", "New messages:\n{messages}")
    ])
    chain = prompt | llm | StrOutputParser()
    recent = state["messages"][-6:]
    msgs = "\n".join(f"{m.type}: {m.content}" for m in recent)
    return {"summary": chain.invoke({"summary": state.get("summary", ""), "messages": msgs})}

def router(state: AgentState) -> str:
    if len(state["messages"]) > 10:
        return "summarize"
    return "respond"

# Build graph
builder = StateGraph(AgentState)
builder.add_node("chat", chat_node)
builder.add_node("summarize", summarize_node)

builder.add_edge(START, "chat")
builder.add_conditional_edges("chat", router, {
    "summarize": "summarize",
    "respond": END
})
builder.add_edge("summarize", END)

app = builder.compile(checkpointer=MemorySaver())

# Usage
session = {"configurable": {"thread_id": "summary-test"}}
for i in range(15):
    app.invoke({"messages": [HumanMessage(f"Message number {i}")]}, session)

# Check the summary
state = app.get_state(session)
print(state.values.get("summary"))
```

[!TIP]
En el agente completo, el resumen se inyecta en el prompt de sistema en cada turno. Esto significa que el LLM siempre tiene acceso al contexto comprimido de las partes iniciales de la conversación.

---

## Recortando Después del Resumen

Después de resumir, puedes **truncar** la lista de mensajes para ahorrar tokens:

```python
def summarize_and_truncate(state: AgentState) -> dict:
    # 1. Generate updated summary
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Summarize:\nCurrent: {summary}\nNew: {messages}"),
        ("human", "Create updated summary.")
    ])
    chain = prompt | llm | StrOutputParser()
    recent = state["messages"][-6:]
    msgs = "\n".join(f"{m.type}: {m.content}" for m in recent)
    new_summary = chain.invoke({"summary": state.get("summary", ""), "messages": msgs})

    # 2. Truncate — keep only last 4 messages
    truncated = state["messages"][-4:]

    return {
        "summary": new_summary,
        "messages": truncated  # Replace messages with short history
    }
```

[!WARNING]
Cuando sustituyes `messages` por una lista truncada, los mensajes antiguos **desaparecen para siempre** (salvo lo que el resumen haya capturado). Asegúrate de que tu resumen sea suficientemente completo.

---

## Resumen Continuo (Incremental)

En lugar de resumir todo de una vez, mantén un resumen continuo:

```python
def update_running_summary(state: AgentState) -> dict:
    existing = state.get("summary", "")
    last_exchange = state["messages"][-2:]  # Last user + assistant turn

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Incorporate this exchange into the running summary. "
                   "Keep the summary under 200 words.\n\n"
                   "Current summary: {existing}"),
        ("human", "Exchange:\n{exchange}")
    ])

    chain = prompt | llm | StrOutputParser()
    exchange_text = "\n".join(f"{m.type}: {m.content}" for m in last_exchange)
    new_summary = chain.invoke({"existing": existing, "exchange": exchange_text})

    return {"summary": new_summary}
```

---

## Resumen con Extracción de Entidades

Va más allá del resumen simple: extrae entidades estructuradas:

```python
from pydantic import BaseModel, Field

class ConversationMemory(BaseModel):
    summary: str = Field(description="Conversation summary")
    user_name: str = Field(default="")
    preferences: List[str] = Field(default_factory=list)
    facts: List[str] = Field(default_factory=list)

def extract_memory(state: AgentState) -> dict:
    parser = PydanticOutputParser(pydantic_object=ConversationMemory)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract conversation memory. {format_instructions}"),
        ("human", "History:\n{messages}")
    ])

    chain = prompt | llm | parser
    msgs_text = "\n".join(f"{m.type}: {m.content}" for m in state["messages"])
    memory = chain.invoke({"messages": msgs_text, "format_instructions": parser.get_format_instructions()})

    return {"summary": memory.summary}
```

---

## Comparación: Resumen vs Truncamiento

| Aspecto | Truncamiento | Resumen |
| :--- | :--- | :--- |
| Qué hace | Descarta mensajes antiguos | Comprime el historial en texto |
| Retención de información | Pierde todo lo descartado | Conserva la información clave en el resumen |
| Eficiencia de tokens | Excelente | Buena (el resumen consume algunos tokens) |
| Conocimiento del LLM | Ve solo el historial reciente | Ve el historial completo comprimido |
| Implementación | Sencilla (slicing) | Moderada (se necesita llamada al LLM) |
| Coste | Gratuita | Llamada al LLM por resumen |

---

## Preguntas de Práctica (Practice Questions)

```question
{
  "id": "lg-intermediate-04-q1",
  "type": "multiple-choice",
  "question": "What is the main advantage of summarization over simple truncation?",
  "options": [
    "Summarization is faster",
    "Summarization preserves key information from early conversation",
    "Summarization uses fewer tokens",
    "Summarization doesn't require an LLM"
  ],
  "correct": 1,
  "explanation": "Summarization compresses the conversation while retaining important context, unlike truncation which loses information entirely."
}
```

```question
{
  "id": "lg-intermediate-04-q2",
  "type": "multiple-choice",
  "question": "How does incremental summarization work?",
  "options": [
    "It re-summarizes the entire conversation each time",
    "It updates the existing summary with new messages",
    "It creates a new summary from scratch every N turns",
    "It only summarizes the last message"
  ],
  "correct": 1,
  "explanation": "Incremental summarization takes the existing summary + new messages and produces an updated summary, which is more efficient."
}
```

```question
{
  "id": "lg-intermediate-04-q3",
  "type": "multiple-choice",
  "question": "What is a good trigger condition for running a summary node?",
  "options": [
    "After every message",
    "When the message count or token count exceeds a threshold",
    "Once at the end of the conversation",
    "Random intervals"
  ],
  "correct": 1,
  "explanation": "Trigger summarization when token/message count exceeds a threshold. Too frequent is wasteful; too rare risks context overflow."
}
```

```question
{
  "id": "lg-intermediate-04-q4",
  "type": "multiple-choice",
  "question": "Where in the system prompt should the summary be injected?",
  "options": [
    "At the end of the conversation history",
    "As part of the system message, before the conversation",
    "As a separate user message",
    "Summaries are not injected into prompts"
  ],
  "correct": 1,
  "explanation": "The summary goes in the system message so the LLM always has the compressed context available when processing the conversation."
}
```

```question
{
  "id": "lg-intermediate-04-q5",
  "type": "multiple-choice",
  "question": "What happens to truncated messages after summarization?",
  "options": [
    "They are archived and can be restored",
    "They are permanently removed from the state",
    "They are moved to a separate field",
    "They are encrypted for later use"
  ],
  "correct": 1,
  "explanation": "Once you replace the messages list with a truncated version, old messages are gone. Only the summary preserves that context."
}
```

```question
{
  "id": "lg-intermediate-04-q6",
  "type": "multiple-choice",
  "question": "What is the most accurate trigger for summarization?",
  "options": [
    "Message count",
    "Token count",
    "Time elapsed",
    "Number of tools used"
  ],
  "correct": 1,
  "explanation": "Token count is most accurate because message sizes vary. A few long messages can exceed context even if the count is low."
}
```

```question
{
  "id": "lg-intermediate-04-q7",
  "type": "multiple-choice",
  "question": "What additional capability does entity extraction add to summarization?",
  "options": [
    "It makes summaries longer",
    "It extracts structured facts (names, preferences) alongside the summary",
    "It removes entities from the summary",
    "It encrypts sensitive information"
  ],
  "correct": 1,
  "explanation": "Entity extraction captures structured information like user name, preferences, and facts, making the memory more actionable."
}
```

```question
{
  "id": "lg-intermediate-04-q8",
  "type": "multiple-choice",
  "question": "What does the running summary approach trade off?",
  "options": [
    "It uses more tokens than keeping full history",
    "It loses detail compared to keeping full history",
    "It is slower than direct LLM calls",
    "It requires more memory"
  ],
  "correct": 1,
  "explanation": "A running summary compresses information, so some detail is inevitably lost. But it's far better than truncation which loses all context."
}
```

```question
{
  "id": "lg-intermediate-04-q9",
  "type": "multiple-choice",
  "question": "After summarizing and truncating, what should you keep in the messages list?",
  "options": [
    "The entire conversation history",
    "Only the summary",
    "The most recent messages (enough for immediate context)",
    "Nothing: clear the list"
  ],
  "correct": 2,
  "explanation": "Keep the most recent messages (e.g., last 2-4 turns) so the LLM has immediate context. The summary provides the longer-term context."
}
```

```question
{
  "id": "lg-intermediate-04-q10",
  "type": "multiple-choice",
  "question": "What is a limitation of summarization-based memory?",
  "options": [
    "It requires LLM calls which add cost and latency",
    "It is less accurate than full history",
    "It can miss subtle details",
    "All of the above"
  ],
  "correct": 3,
  "explanation": "Summarization requires LLM calls (cost/latency), compresses information (losing detail), and may miss subtle or nuanced context from early conversation."
}
```

---

[!SUCCESS]
### Conclusiones Clave
- El resumen conserva el contexto clave cuando las conversaciones superan los límites de tokens
- El resumen incremental actualiza un resumen existente con mensajes nuevos
- Activa el resumen por umbrales de recuento de tokens o de mensajes
- Inyecta el resumen en el prompt de sistema en cada llamada al LLM
- Trunca los mensajes después de resumir para mantenerte dentro de las ventanas de contexto
- La extracción de entidades añade memoria estructurada junto a los resúmenes de texto libre
- Los resúmenes continuos cambian la memoria perfecta por la eficiencia de tokens
- El resumen cuesta llamadas al LLM: equilibra la frecuencia con el coste
