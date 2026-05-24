---
title: "Fundamentos de Multi-Agentes"
description: "Aprenda arquitetura multi-agente em LangGraph — múltiplos nós de agente comunicando através de estado compartilhado, papéis especializados e padrões de coordenação."
order: 7
duration: "40 minutes"
difficulty: "intermediate"
---

# Fundamentos de Multi-Agentes

Multi-agent systems use multiple specialized agents that collaborate to solve complex tasks. LangGraph's graph structure is ideal for orchestrating multi-agent workflows.

---

## Por que Multi-Agente?

Single agents have limitations:

1. **Context overload**: One agent handling everything exceeds context windows
2. **Role confusion**: A single agent can't be expert at everything
3. **Modularity**: Hard to swap or upgrade parts of a monolithic agent

Multi-agent architecture solves this by **dividing and conquering** — each agent has a focused role and communicates with others through shared state.

---

## Padrão Básico Multi-Agente

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict
from typing import List, Annotated
from operator import add

class TeamState(TypedDict):
    input: str
    research_results: str
    code_output: str
    review_comments: str
    final_output: str
    logs: Annotated[List[str], add]

def researcher(state: TeamState) -> dict:
    """Specialist: researches the topic."""
    research = f"Research findings for: {state['input']}"
    return {"research_results": research,
            "logs": ["Researcher completed"]}

def coder(state: TeamState) -> dict:
    """Specialist: writes code based on research."""
    code = f"# Code implementing: {state['research_results']}"
    return {"code_output": code,
            "logs": ["Coder completed"]}

def reviewer(state: TeamState) -> dict:
    """Specialist: reviews code."""
    review = f"Review of code: looks good"
    return {"review_comments": review,
            "logs": ["Reviewer completed"]}

def assembler(state: TeamState) -> dict:
    """Combines all outputs into final result."""
    final = f"## Result\n\nResearch: {state['research_results']}\n\nCode: {state['code_output']}\n\nReview: {state['review_comments']}"
    return {"final_output": final}

# Build sequential multi-agent graph
builder = StateGraph(TeamState)
builder.add_node("researcher", researcher)
builder.add_node("coder", coder)
builder.add_node("reviewer", reviewer)
builder.add_node("assembler", assembler)
builder.add_edge(START, "researcher")
builder.add_edge("researcher", "coder")
builder.add_edge("coder", "reviewer")
builder.add_edge("reviewer", "assembler")
builder.add_edge("assembler", END)
```

[!NOTA]
Each agent is a separate node with a specialized function. They communicate by reading and writing to the shared state. This keeps each agent simple and focused.

---

## Execução Multi-Agente Paralela

When agents can work independently, run them in parallel:

```python
def agent_a(state: State) -> dict:
    return {"result_a": "Agent A output"}

def agent_b(state: State) -> dict:
    return {"result_b": "Agent B output"}

def agent_c(state: State) -> dict:
    return {"result_c": "Agent C output"}

def merger(state: State) -> dict:
    combined = f"{state['result_a']}\n{state['result_b']}\n{state['result_c']}"
    return {"merged": combined}

builder = StateGraph(State)
builder.add_node("agent_a", agent_a)
builder.add_node("agent_b", agent_b)
builder.add_node("agent_c", agent_c)
builder.add_node("merger", merger)

# Fan-out: all three agents run in parallel
builder.add_edge(START, "agent_a")
builder.add_edge(START, "agent_b")
builder.add_edge(START, "agent_c")

# Fan-in: merger waits for all three
builder.add_edge("agent_a", "merger")
builder.add_edge("agent_b", "merger")
builder.add_edge("agent_c", "merger")
builder.add_edge("merger", END)
```

[!SUCESSO]
Parallel execution is a key advantage of multi-agent systems. Independent specialists work simultaneously, and a merger node combines their results.

---

## Agentes Especializados com LLM

Each agent can have its own LLM with a specialized system prompt:

```python
from langchain_openai import ChatOpenAI

# Each agent has its own model
research_llm = ChatOpenAI(model="gpt-4o", temperature=0.3)
code_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)
review_llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

def research_agent(state: TeamState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a research specialist. Find and summarize "
                   "key information about the given topic. Be thorough and cite sources."),
        ("human", "{input}")
    ])
    chain = prompt | research_llm | StrOutputParser()
    return {"research_results": chain.invoke({"input": state["input"]})}

def code_agent(state: TeamState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a code specialist. Write clean, well-documented "
                   "Python code based on the research provided."),
        ("human", "Research: {research}\n\nWrite code to implement this.")
    ])
    chain = prompt | code_llm | StrOutputParser()
    return {"code_output": chain.invoke({"research": state["research_results"]})}

def review_agent(state: TeamState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a code reviewer. Check for bugs, security issues, "
                   "and best practices. Provide actionable feedback."),
        ("human", "Code to review:\n{code}")
    ])
    chain = prompt | review_llm | StrOutputParser()
    return {"review_comments": chain.invoke({"code": state["code_output"]})}
```

[!DICA]
Each agent can use a different model. Use cheaper models (gpt-4o-mini) for simpler tasks and reserve powerful models (gpt-4o) for complex reasoning.

---

## Comunicação entre Agentes via Estado Estruturado

Define structured fields for inter-agent communication:

```python
class AgentMessage(TypedDict):
    from_agent: str
    to_agent: str
    content: str
    message_type: str  # "request", "response", "feedback"

class MultiAgentState(TypedDict):
    task: str
    agent_messages: Annotated[List[AgentMessage], add]
    status: str

def researcher_v2(state: MultiAgentState) -> dict:
    research = llm.invoke(f"Research: {state['task']}")
    return {
        "agent_messages": [{
            "from_agent": "researcher",
            "to_agent": "writer",
            "content": research.content,
            "message_type": "research_results"
        }],
        "status": "research_done"
    }

def writer_v2(state: MultiAgentState) -> dict:
    # Find the latest research message addressed to writer
    research_msg = [m for m in reversed(state["agent_messages"])
                    if m["to_agent"] == "writer"][0]

    content = llm.invoke(f"Write based on: {research_msg['content']}")
    return {
        "agent_messages": [{
            "from_agent": "writer",
            "to_agent": "reviewer",
            "content": content.content,
            "message_type": "draft"
        }],
        "status": "writing_done"
    }
```

---

## Agente com Acesso a Ferramentas

Each agent can have its own set of tools:

```python
from langchain_core.tools import tool
from langgraph.prebuilt import ToolExecutor

@tool
def search_web(q: str) -> str:
    """Search the web."""
    return f"Search results for: {q}"

@tool
def query_database(sql: str) -> str:
    """Execute SQL queries."""
    return f"DB results for: {sql}"

@tool
def send_email(to: str, body: str) -> str:
    """Send an email."""
    return f"Email sent to {to}"

# Researcher agent only gets search tools
researcher_tools = [search_web]
researcher_llm = ChatOpenAI(model="gpt-4o").bind_tools(researcher_tools)

# Data agent only gets database tools
data_tools = [query_database]
data_llm = ChatOpenAI(model="gpt-4o").bind_tools(data_tools)

# Email agent only gets communication tools
email_tools = [send_email]
email_llm = ChatOpenAI(model="gpt-4o").bind_tools(email_tools)
```

---

## Tratamento de Erros em Sistemas Multi-Agente

One agent's failure shouldn't crash the team:

```python
def safe_agent(state: MultiAgentState, agent_name: str, agent_func) -> dict:
    try:
        return agent_func(state)
    except Exception as e:
        return {
            "agent_messages": [{
                "from_agent": agent_name,
                "to_agent": "supervisor",
                "content": f"Failed: {str(e)}",
                "message_type": "error"
            }],
            "status": f"{agent_name}_failed"
        }

# Wrap each agent
def researcher_safe(state: MultiAgentState) -> dict:
    return safe_agent(state, "researcher", research_agent)

def writer_safe(state: MultiAgentState) -> dict:
    return safe_agent(state, "writer", write_agent)
```

---

## Exemplo Completo Multi-Agente

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict, Annotated
from typing import List
from operator import add

llm = ChatOpenAI(model="gpt-4o-mini")

class ProjectState(TypedDict):
    topic: str
    research: str
    outline: str
    draft: str
    reviewed: str
    final: str
    logs: Annotated[List[str], add]

def researcher_node(state: ProjectState) -> dict:
    r = llm.invoke(f"Research: {state['topic']}")
    return {"research": r.content, "logs": ["Research done"]}

def planner_node(state: ProjectState) -> dict:
    p = llm.invoke(f"Outline based on: {state['research']}")
    return {"outline": p.content, "logs": ["Planning done"]}

def writer_node(state: ProjectState) -> dict:
    w = llm.invoke(f"Write based on outline: {state['outline']}")
    return {"draft": w.content, "logs": ["Writing done"]}

def reviewer_node(state: ProjectState) -> dict:
    r = llm.invoke(f"Review this draft: {state['draft']}")
    return {"reviewed": r.content, "logs": ["Review done"]}

def finalizer_node(state: ProjectState) -> dict:
    f = llm.invoke(f"Finalize: Draft={state['draft']}, Review={state['reviewed']}")
    return {"final": f.content, "logs": ["Finalized"]}

builder = StateGraph(ProjectState)
builder.add_node("researcher", researcher_node)
builder.add_node("planner", planner_node)
builder.add_node("writer", writer_node)
builder.add_node("reviewer", reviewer_node)
builder.add_node("finalizer", finalizer_node)

builder.add_edge(START, "researcher")
builder.add_edge("researcher", "planner")
builder.add_edge("planner", "writer")
builder.add_edge("writer", "reviewer")
builder.add_edge("reviewer", "finalizer")
builder.add_edge("finalizer", END)

app = builder.compile(checkpointer=MemorySaver())

result = app.invoke({
    "topic": "Benefits of vector databases for AI",
    "research": "", "outline": "", "draft": "",
    "reviewed": "", "final": "", "logs": []
})
print(result["final"])
```

---

## Perguntas Práticas

```question
{
  "id": "lg-intermediate-07-q1",
  "type": "multiple-choice",
  "question": "What is the main benefit of multi-agent architecture?",
  "options": [
    "Faster execution always",
    "Specialization — each agent focuses on one task",
    "Eliminates the need for LLMs",
    "Simpler code overall"
  ],
  "correct": 1,
  "explanation": "Multi-agent systems let each agent specialize in one task (research, coding, review), improving quality and modularity."
}
```

```question
{
  "id": "lg-intermediate-07-q2",
  "type": "multiple-choice",
  "question": "How do agents communicate in a LangGraph multi-agent system?",
  "options": [
    "Through direct function calls",
    "Through the shared state — one agent writes, another reads",
    "Via a message queue",
    "Through a REST API"
  ],
  "correct": 1,
  "explanation": "Agents communicate through the shared LangGraph state. One agent writes to a field (e.g., 'research'), another reads it."
}
```

```question
{
  "id": "lg-intermediate-07-q3",
  "type": "multiple-choice",
  "question": "How do you run multiple agents in parallel?",
  "options": [
    "Use a parallel loop in one node",
    "Use fan-out: add edges from one node or START to multiple agents",
    "Agents cannot run in parallel",
    "Use Python's multiprocessing"
  ],
  "correct": 1,
  "explanation": "Fan-out edges cause all target nodes to execute in parallel. Fan-in (merger) waits for all to complete."
}
```

```question
{
  "id": "lg-intermediate-07-q4",
  "type": "multiple-choice",
  "question": "Can different agents use different LLM models?",
  "options": [
    "No, all agents must use the same model",
    "Yes, each agent can have its own LLM instantiation",
    "Only if they're in separate graphs",
    "Only if using the same provider"
  ],
  "correct": 1,
  "explanation": "Each agent node can instantiate its own LLM. This lets you use cheap models for simple tasks and powerful models for complex ones."
}
```

```question
{
  "id": "lg-intermediate-07-q5",
  "type": "multiple-choice",
  "question": "What happens when one agent in a parallel group fails?",
  "options": [
    "The entire graph fails",
    "The other agents continue, but the failing agent's outputs are absent",
    "The graph retries the failed agent automatically",
    "Execution pauses until all agents succeed"
  ],
  "correct": 1,
  "explanation": "By default, an unhandled exception in any node fails the graph. Use try/except in each agent to handle failures gracefully."
}
```

```question
{
  "id": "lg-intermediate-07-q6",
  "type": "multiple-choice",
  "question": "What is a merger node in a multi-agent system?",
  "options": [
    "A node that combines outputs from multiple parallel agents",
    "A node that splits work among agents",
    "A node that removes duplicate data",
    "A node that terminates the graph"
  ],
  "correct": 0,
  "explanation": "A merger (or aggregator) node receives outputs from all parallel agents via fan-in and combines them into a unified result."
}
```

```question
{
  "id": "lg-intermediate-07-q7",
  "type": "multiple-choice",
  "question": "Why might you give different agents different tool sets?",
  "options": [
    "To save money on API calls",
    "To enforce separation of concerns — each agent can only use relevant tools",
    "Tools are shared globally",
    "There's no benefit to separate tool sets"
  ],
  "correct": 1,
  "explanation": "Different agents need different tools. A researcher needs search; a coder needs code execution. Separation prevents misuse."
}
```

```question
{
  "id": "lg-intermediate-07-q8",
  "type": "multiple-choice",
  "question": "What is a limitation of sequential multi-agent execution?",
  "options": [
    "It's always slower than parallel",
    "Each agent must wait for the previous to complete",
    "It doesn't support tools",
    "It requires more memory"
  ],
  "correct": 1,
  "explanation": "In sequential execution, agent B waits for agent A to finish. Parallel execution is faster when agents don't depend on each other."
}
```

```question
{
  "id": "lg-intermediate-07-q9",
  "type": "multiple-choice",
  "question": "How can an agent signal an error to other agents?",
  "options": [
    "By raising an exception",
    "By writing an error status to the shared state",
    "By logging to a file",
    "Errors cannot be communicated between agents"
  ],
  "correct": 1,
  "explanation": "An agent writes error information to a state field (e.g., status='failed'). Other agents can read this and adjust behavior."
}
```

```question
{
  "id": "lg-intermediate-07-q10",
  "type": "multiple-choice",
  "question": "What advantage does modular multi-agent design provide?",
  "options": [
    "Agents can be developed, tested, and upgraded independently",
    "The graph compiles faster",
    "Fewer lines of code are needed",
    "No LLM calls are required"
  ],
  "correct": 0,
  "explanation": "Modular design means each agent is an independent component. You can swap, upgrade, or test agents without affecting others."
}
```

---

[!SUCESSO]
### Principais Conclusões
- Multi-agent systems use specialized agents communicating through shared state
- Fan-out enables parallel agent execution; fan-in merges results
- Each agent can have its own LLM, tools, and system prompt
- Structured state fields enable clear agent-to-agent communication
- Error handling per agent prevents cascade failures
- Sequential execution for dependent tasks; parallel for independent ones
- Modular design allows independent development and testing of agents
- Multi-agent architecture solves context overload and role confusion
