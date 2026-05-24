---
title: "Memoria de Resumen"
description: "Implementa resumen de conversación para agentes de larga duración, nodos de memoria de resumen y estrategias de truncamiento para gestionar ventanas de contexto."
order: 4
duration: "35 minutes"
difficulty: "intermediate"
---

# Memoria de Resumen

When conversations grow too long for the LLM's context window, simple trimming discards valuable context. **Resumen** preserves key information in a compressed form while keeping the conversation manageable.

---

## El Problema con Conversaciones Largas

LLMs have token limits. Once a conversation exceeds the limit:

1. **Truncamiento**: Discards early messages — loses context
2. **Error**: Context window exceeded — request fails

Resumen solves this by compressing history into a summary while retaining important details.

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

A summary node is triggered periodically to condense the conversation.

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

[!NOTA]
The summary node reads the current summary and recent messages, then produces an **updated** summary. This incremental approach is more efficient than re-summarizing the entire conversation.

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

[!ÉXITO]
Choose your triggering strategy based on the expected conversation length and message size. Token-based is most accurate; count-based is simplest.

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

[!CONSEJO]
In the full agent, the summary is injected into the system prompt on every turn. This means the LLM always has access to compressed context from earlier in the conversation.

---

## Recortando Después del Resumen

After summarizing, you can **truncate** the message list to save tokens:

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

[!ADVERTENCIA]
When you replace `messages` with a truncated list, the old messages are **permanently gone** (except what the summary captured). Ensure your summary is comprehensive enough.

---

## Resumen Continuo (Incremental)

Rather than summarizing everything at once, maintain a running summary:

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

Go beyond simple summarization — extract structured entities:

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
| Qué hace | Drops old messages | Compresses history into text |
| Retención de información | Loses everything dropped | Retains key info in summary |
| Eficiencia de tokens | Excellent | Good (summary takes some tokens) |
| Conocimiento del LLM | Sees only recent history | Sees compressed full history |
| Implementación | Simple (slicing) | Modorate (LLM call needed) |
| Costo | Free | LLM call per summarization |

---

## Preguntas Prácticas

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
    "Nothing — clear the list"
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

[!ÉXITO]
### Conclusiones Clave
- Resumen preserves key context when conversations exceed token limits
- Incremental summarization updates an existing summary with new messages
- Trigger summarization by token count or message count thresholds
- Inject the summary into the system prompt for every LLM call
- Truncate messages after summarization to stay within context windows
- Entity extraction adds structured memory alongside free-text summaries
- Running summaries trade perfect recall for token efficiency
- Resumen costs LLM calls — balance frequency with the cost
