---
title: "Comunicación y Supervisión entre Agentes"
description: "Implementa mensajes estructurados agente-a-agente, nodos supervisores, coordinación de estado compartido y patrones de orquestación multi-agente."
order: 8
duration: "40 min"
difficulty: "intermediate"
---

# Comunicación y Supervisión entre Agentes

En sistemas multiagente de producción, los agentes necesitan comunicación estructurada y un **supervisor** que coordine su trabajo. Esta lección cubre protocolos de mensajes, patrones de supervisor y coordinación por estado compartido.

---

## Mensajes Estructurados de Agente

Usa diccionarios tipados para los mensajes entre agentes:

```python
from typing_extensions import TypedDict, Annotated
from typing import List, Optional
from datetime import datetime
from operator import add

class AgentMessage(TypedDict):
    sender: str
    recipient: str
    content: str
    message_type: str  # task, result, question, error
    timestamp: str
    metadata: dict

class SupervisorState(TypedDict):
    task: str
    conversation: Annotated[List[AgentMessage], add]
    current_agent: str
    completed_agents: List[str]
    final_output: str
```

[!NOTE]
Los mensajes estructurados con campos de emisor, destinatario y tipo permiten un enrutamiento sofisticado. Los agentes pueden dirigir mensajes a destinatarios concretos o emitirlos en difusión a todos.

---

## El Patrón Supervisor

Un supervisor es un agente coordinador que decide qué agente debe trabajar a continuación:

```python
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

class SupervisorState(TypedDict):
    task: str
    conversation: Annotated[List[AgentMessage], add]
    next_agent: str
    completed: bool

def supervisor_node(state: SupervisorState) -> dict:
    """Decides which agent should work next based on progress."""

    recent = state["conversation"][-3:] if state["conversation"] else []
    context = "\n".join(f"{m['sender']} → {m['recipient']}: {m['content']}"
                        for m in recent)

    prompt = f"""Task: {state['task']}
Recent activity:
{context}

Available agents: researcher, writer, reviewer, finalizer
Which agent should work next? Or respond with 'complete' if done.
Reply with one word: researcher, writer, reviewer, finalizer, or complete."""

    response = llm.invoke(prompt)
    next_agent = response.content.strip().lower()

    return {"next_agent": next_agent,
            "completed": next_agent == "complete"}
```

---

## Nodos de Agente con Manejo de Mensajes

```python
def researcher_agent(state: SupervisorState) -> dict:
    result = llm.invoke(f"Research this topic: {state['task']}")

    return {"conversation": [{
        "sender": "researcher",
        "recipient": "supervisor",
        "content": result.content,
        "message_type": "result",
        "timestamp": datetime.now().isoformat(),
        "metadata": {"sources": 3}
    }]}

def writer_agent(state: SupervisorState) -> dict:
    # Find the latest research result
    research = [m for m in reversed(state["conversation"])
                if m["sender"] == "researcher"][0]

    content = llm.invoke(f"Write based on: {research['content']}")
    return {"conversation": [{
        "sender": "writer",
        "recipient": "supervisor",
        "content": content.content,
        "message_type": "result",
        "timestamp": datetime.now().isoformat(),
        "metadata": {"word_count": len(content.content.split())}
    }]}
```

[!SUCCESS]
El supervisor actúa como un **enrutador**: lee la conversación, decide el siguiente paso y el grafo enruta la ejecución en consecuencia.

---

## Enrutamiento del Supervisor

```python
def route_from_supervisor(state: SupervisorState) -> str:
    if state["completed"]:
        return "finalize"
    return state["next_agent"]

builder = StateGraph(SupervisorState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("researcher", researcher_agent)
builder.add_node("writer", writer_agent)
builder.add_node("finalizer", finalizer_agent)

builder.add_edge(START, "supervisor")
builder.add_conditional_edges(
    "supervisor",
    route_from_supervisor,
    {
        "researcher": "researcher",
        "writer": "writer",
        "finalize": "finalizer"
    }
)
# After any agent works, go back to supervisor
builder.add_edge("researcher", "supervisor")
builder.add_edge("writer", "supervisor")
builder.add_edge("finalizer", END)
```

```
START → Supervisor → (researcher → Supervisor → writer → Supervisor → finalizer → END)
         ↑              ↑
         └──── loop ────┘
```

---

## Mensajes de Difusión y Dirigidos

### Broadcast (para todos los agentes)

```python
def supervisor_broadcast(state: SupervisorState) -> dict:
    return {"conversation": [{
        "sender": "supervisor",
        "recipient": "*",  # Broadcast
        "content": f"New task: {state['task']}",
        "message_type": "announcement",
        "timestamp": datetime.now().isoformat(),
        "metadata": {}
    }]}
```

### Dirigido (a agente específico)

```python
def researcher_requests_clarification(state: SupervisorState) -> dict:
    return {"conversation": [{
        "sender": "researcher",
        "recipient": "supervisor",
        "content": "Need clarification on the scope",
        "message_type": "question",
        "timestamp": datetime.now().isoformat(),
        "metadata": {}
    }]}
```

---

## Selección Dinámica de Agentes

Deja que el supervisor elija el agente adecuado según la tarea:

```python
def dynamic_supervisor(state: SupervisorState) -> dict:
    available_agents = [{
        "name": "researcher",
        "skills": "web research, fact-finding, data gathering",
        "status": "ready"
    }, {
        "name": "analyst",
        "skills": "data analysis, pattern recognition, statistics",
        "status": "ready"
    }, {
        "name": "writer",
        "skills": "content creation, summarization, formatting",
        "status": "ready"
    }]

    prompt = f"""Task: {state['task']}
Available agents: {available_agents}
Recent messages: {state['conversation'][-2:]}

Which agent should work next, or has the task been completed?
Respond with: agent_name or 'complete'."""

    response = llm.invoke(prompt)
    return {"next_agent": response.content.strip().lower()}
```

---

## Multi-Agente Secuencial con Transferencia

Los agentes pueden pasarse el trabajo explícitamente:

```python
def analyst_agent(state: SupervisorState) -> dict:
    analysis = llm.invoke(f"Analyze: {state['task']}")

    return {
        "conversation": [{
            "sender": "analyst",
            "recipient": "writer",
            "content": analysis.content,
            "message_type": "handoff",
            "timestamp": datetime.now().isoformat(),
            "metadata": {}
        }],
        "current_agent": "writer"  # Explicit handoff
    }
```

---

## Ejemplo Completo de Supervisor

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict, Annotated
from typing import List, Any
from operator import add
from datetime import datetime

llm = ChatOpenAI(model="gpt-4o-mini")

class Message(TypedDict):
    sender: str
    content: str
    type: str

class AgentState(TypedDict):
    task: str
    messages: Annotated[List[Message], add]
    next_agent: str
    done: bool

def supervisor(state: AgentState) -> dict:
    context = "\n".join(f"{m['sender']}: {m['content']}" for m in state["messages"][-4:])
    prompt = f"Task: {state['task']}\nRecent:\n{context}\n\nNext agent (researcher/writer/complete):"
    resp = llm.invoke(prompt).content.strip().lower()
    return {"next_agent": resp, "done": resp == "complete"}

def researcher(state: AgentState) -> dict:
    resp = llm.invoke(f"Research: {state['task']}")
    return {"messages": [{"sender": "researcher", "content": resp.content, "type": "research"}]}

def writer(state: AgentState) -> dict:
    research = [m for m in reversed(state["messages"]) if m["sender"] == "researcher"]
    content = research[0]["content"] if research else state["task"]
    resp = llm.invoke(f"Write based on: {content}")
    return {"messages": [{"sender": "writer", "content": resp.content, "type": "draft"}]}

def router(state: AgentState) -> str:
    if state["done"]:
        return "done"
    return state["next_agent"]

builder = StateGraph(AgentState)
builder.add_node("supervisor", supervisor)
builder.add_node("researcher", researcher)
builder.add_node("writer", writer)
builder.add_edge(START, "supervisor")
builder.add_conditional_edges("supervisor", router, {
    "researcher": "researcher",
    "writer": "writer",
    "done": END
})
builder.add_edge("researcher", "supervisor")
builder.add_edge("writer", "supervisor")

app = builder.compile(checkpointer=MemorySaver())
```

---

## Estado Compartido vs Estado con Ámbito de Agente

| Pattern | Descripción | Use Case |
| :--- | :--- | :--- |
| **Estado compartido** | Todos los agentes leen/escriben en el mismo diccionario de estado | Coordinación simple, pocos agentes |
| **Mensajes estructurados** | Los agentes escriben en una lista de mensajes compartida | Multiagente complejo, seguimiento del historial |
| **Estado de subgrafo** | Cada agente tiene su propio estado interno y se comunica mediante mensajes (próxima lección) | Agentes jerárquicos, encapsulamiento |

---

## Preguntas de Práctica (Practice Questions)

```question
{
  "id": "lg-intermediate-08-q1",
  "type": "multiple-choice",
  "question": "What is the role of a supervisor node in a multi-agent system?",
  "options": [
    "To execute all tasks directly",
    "To coordinate which agent works next based on progress",
    "To replace all other agents",
    "To handle error logging"
  ],
  "correct": 1,
  "explanation": "The supervisor reads the current state and decides which specialized agent should execute next, enabling dynamic orchestration."
}
```

```question
{
  "id": "lg-intermediate-08-q2",
  "type": "multiple-choice",
  "question": "How does the supervisor communicate its decision to the graph?",
  "options": [
    "By calling a function directly",
    "By writing a field to state (e.g., next_agent) that a conditional edge reads",
    "By returning a special exception",
    "By logging to a file"
  ],
  "correct": 1,
  "explanation": "The supervisor writes the next agent name to a state field. A conditional edge router reads this field and routes execution accordingly."
}
```

```question
{
  "id": "lg-intermediate-08-q3",
  "type": "multiple-choice",
  "question": "What is the loop pattern in a supervisor-based graph?",
  "options": [
    "Supervisor → agent → END",
    "Supervisor → agent → Supervisor → agent → ... → END",
    "Agent → Supervisor → Agent → Supervisor",
    "There is no loop"
  ],
  "correct": 1,
  "explanation": "After an agent completes, execution returns to the supervisor. The supervisor decides the next step, creating a loop until the task is complete."
}
```

```question
{
  "id": "lg-intermediate-08-q4",
  "type": "multiple-choice",
  "question": "What field structure enables targeted agent-to-agent messaging?",
  "options": [
    "A single string field",
    "Structured messages with sender, recipient, and type fields",
    "A global variable",
    "Agent messages are not targeted"
  ],
  "correct": 1,
  "explanation": "Messages with sender, recipient, and type fields allow agents to target specific recipients or broadcast to all."
}
```

```question
{
  "id": "lg-intermediate-08-q5",
  "type": "multiple-choice",
  "question": "How does the graph terminate in a supervisor pattern?",
  "options": [
    "When all agents have run once",
    "When the supervisor returns 'complete' or routes to a finalizer/END",
    "After a fixed number of iterations",
    "When an agent raises an exception"
  ],
  "correct": 1,
  "explanation": "The supervisor decides when the task is complete and either routes to END or to a finalizer node."
}
```

```question
{
  "id": "lg-intermediate-08-q6",
  "type": "multiple-choice",
  "question": "What is a broadcast message in a multi-agent system?",
  "options": [
    "A message sent to all agents",
    "A message sent to the supervisor only",
    "A message that is ignored",
    "A message that terminates the graph"
  ],
  "correct": 0,
  "explanation": "A broadcast message has recipient='*' or similar indicator, meaning all agents should process it."
}
```

```question
{
  "id": "lg-intermediate-08-q7",
  "type": "multiple-choice",
  "question": "What happens after an agent completes its work in the supervisor loop?",
  "options": [
    "The graph ends",
    "Execution returns to the supervisor for the next decision",
    "The next agent in sequence runs automatically",
    "The supervisor is skipped"
  ],
  "correct": 1,
  "explanation": "After an agent finishes, the edge goes back to the supervisor. The supervisor evaluates progress and decides what to do next."
}
```

```question
{
  "id": "lg-intermediate-08-q8",
  "type": "multiple-choice",
  "question": "What is the benefit of structured messages over plain text in agent communication?",
  "options": [
    "They use fewer tokens",
    "They enable routing, filtering, and metadata tracking",
    "They are faster to process",
    "They don't require an LLM"
  ],
  "correct": 1,
  "explanation": "Structured messages with sender, recipient, type, and metadata fields enable sophisticated filtering, routing, and history analysis."
}
```

```question
{
  "id": "lg-intermediate-08-q9",
  "type": "multiple-choice",
  "question": "What routing mechanism executes the supervisor's decision?",
  "options": [
    "add_edge() with a fixed target",
    "add_conditional_edges() with a router function that reads state['next_agent']",
    "A Python if/elif chain",
    "Direct function calls"
  ],
  "correct": 1,
  "explanation": "add_conditional_edges() uses a router function that reads the supervisor's decision from state and maps it to the correct target node."
}
```

```question
{
  "id": "lg-intermediate-08-q10",
  "type": "multiple-choice",
  "question": "What happens if an agent writes a message but the supervisor decides to route to a different agent?",
  "options": [
    "The message is lost",
    "The message stays in state for future reference",
    "An error is thrown",
    "The supervisor's decision is overridden"
  ],
  "correct": 1,
  "explanation": "Messages accumulate in state via the add reducer. Even if the supervisor routes to a different agent, all messages remain available for context."
}
```

---

[!SUCCESS]
### Conclusiones Clave
- Los nodos de supervisor coordinan el trabajo multiagente decidiendo el siguiente paso
- Los mensajes estructurados (emisor, destinatario, contenido, tipo) permiten una comunicación sofisticada
- El patrón de bucle del supervisor: Supervisor → Agente → Supervisor → Agente → ... → END
- Las aristas condicionales enrutan según la decisión del supervisor
- Los mensajes en difusión van a todos los agentes; los mensajes dirigidos van a destinatarios concretos
- Los mensajes se acumulan en el estado para el historial completo de la conversación
- La selección dinámica de agentes permite al supervisor elegir el agente adecuado en cada paso
