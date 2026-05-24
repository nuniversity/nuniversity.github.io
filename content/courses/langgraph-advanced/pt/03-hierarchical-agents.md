---
title: "Agentes Hierárquicos"
description: "Implemente arquiteturas multi-agente hierárquicas com agentes gerentes, sub-agentes, subgrafos e passagem de estado entre níveis hierárquicos."
order: 3
duration: "40 minutes"
difficulty: "advanced"
---

# Agentes Hierárquicos

Hierarchical agents organize work into levels — a **manager agent** delegates tasks to **sub-agents**, which can themselves be graphs with internal nodes. This enables scalable, maintainable, and encapsulated agent systems.

---

## Por que Hierárquico?

Flat multi-agent systems have limitations:

1. **State complexity**: All agents share one state dict, which grows unmanageable
2. **Coordination cost**: Every agent sees all messages, even irrelevant ones
3. **Encapsulamento**: Agent internals leak into the shared state
4. **Scalability**: Adding agents increases complexity linearly

Hierarchical architectures solve these with **encapsulation and delegation**:

```
Manager Agent
├── Research Sub-Agent (internal graph)
│   ├── plan_research
│   ├── execute_search
│   └── summarize
├── Write Sub-Agent (internal graph)
│   ├── draft
│   ├── review
│   └── finalize
└── Quality Sub-Agent (internal graph)
    ├── check_facts
    └── validate_output
```

---

## Subgrafos

Subgrafos are graphs used as nodes within a parent graph. They have their own state, nodes, and edges — fully encapsulated.

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

# === Subgraph: Research ===
class ResearchState(TypedDict):
    topic: str
    findings: str
    status: str

def plan_research(state: ResearchState) -> dict:
    plan = f"Research plan for: {state['topic']}"
    return {"status": "planned"}

def execute_research(state: ResearchState) -> dict:
    findings = f"Findings about {state['topic']}: ..."
    return {"findings": findings, "status": "completed"}

research_builder = StateGraph(ResearchState)
research_builder.add_node("plan", plan_research)
research_builder.add_node("execute", execute_research)
research_builder.add_edge(START, "plan")
research_builder.add_edge("plan", "execute")
research_builder.add_edge("execute", END)
research_subgraph = research_builder.compile()
```

[!NOTA]
The research subgraph has its own state (`ResearchState`). It doesn't know about the parent graph's state, and the parent doesn't know about internal research details.

---

## Grafo Pai Usando Subgrafo

```python
class ManagerState(TypedDict):
    query: str
    research_findings: str
    final_report: str
    status: str

def manager_router(state: ManagerState) -> str:
    if not state.get("research_findings"):
        return "research_subgraph"
    return "finalize"

def finalize_report(state: ManagerState) -> dict:
    report = f"Report based on: {state['research_findings']}"
    return {"final_report": report, "status": "completed"}

# Parent graph
builder = StateGraph(ManagerState)
builder.add_node("research_subgraph", research_subgraph)  # Subgraph as a node
builder.add_node("finalize", finalize_report)

builder.add_edge(START, "research_subgraph")
builder.add_edge("research_subgraph", "finalize")
builder.add_edge("finalize", END)

app = builder.compile()
```

[!SUCESSO]
A subgraph is added as a node just like a regular function. LangGraph handles state mapping between parent and subgraph automatically.

---

## Mapeamento de Estado entre Pai e Subgrafo

The parent passes a subset of its state to the subgraph. The subgraph returns its state, which is merged back.

```python
class ParentState(TypedDict):
    query: str
    research: str
    output: str

class ResearchState(TypedDict):
    query: str          # Mapped from parent
    findings: str       # Mapped back to parent
    depth: str

# When invoke is called on the subgraph from the parent node:
def research_node(parent_state: ParentState) -> dict:
    # Map parent state to subgraph state
    sub_input = {
        "query": parent_state["query"],
        "findings": "",
        "depth": "deep"
    }

    # Invoke the subgraph
    sub_result = research_subgraph.invoke(sub_input)

    # Map subgraph result back to parent state
    return {"research": sub_result["findings"]}
```

---

## Hierarquia de Múltiplos Níveis

```python
# Level 3: Sub-subgraph
class FactCheckState(TypedDict):
    claim: str
    verified: bool

def verify_claim(state: FactCheckState) -> dict:
    verified = "verified" in state["claim"].lower()
    return {"verified": verified}

fact_builder = StateGraph(FactCheckState)
fact_builder.add_node("verify", verify_claim)
fact_builder.add_edge(START, "verify")
fact_builder.add_edge("verify", END)
fact_subgraph = fact_builder.compile()

# Level 2: Subgraph uses fact_subgraph
class ResearchState(TypedDict):
    topic: str
    claims: list
    verified_claims: list
    summary: str

def check_claims(state: ResearchState) -> dict:
    verified = []
    for claim in state["claims"]:
        result = fact_subgraph.invoke({"claim": claim, "verified": False})
        verified.append({"claim": claim, "verified": result["verified"]})
    return {"verified_claims": verified}

research_builder = StateGraph(ResearchState)
research_builder.add_node("check", check_claims)
research_builder.add_edge(START, "check")
research_builder.add_edge("check", END)
research_graph = research_builder.compile()

# Level 1: Parent uses research_graph
builder = StateGraph(ParentState)
builder.add_node("research", research_graph)
builder.add_edge(START, "research")
builder.add_edge("research", END)
app = builder.compile()
```

[!IMPORTANTE]
Subgrafos at any level can contain their own subgraphs. This nesting enables arbitrarily complex agent hierarchies while maintaining encapsulation at each level.

---

## Contexto Compartilhado entre Níveis

Use a **context object** that flows through all hierarchy levels:

```python
class GlobalContext(TypedDict):
    user_id: str
    session_id: str
    constraints: List[str]
    preferences: dict

class TaskState(TypedDict):
    context: GlobalContext  # Passed through all levels
    task: str
    result: str

# Each subgraph receives and passes the context
def research_subgraph_node(state: TaskState) -> dict:
    ctx = state["context"]
    result = perform_research(state["task"], ctx["constraints"])
    return {"result": result}  # Context flows through automatically?
```

[!AVISO]
State mapping between parent and subgraph must be explicit. The parent decides which fields to pass to the subgraph and which subgraph outputs to read.

---

## Execução Paralela de Subgrafos

Run multiple subgraphs in parallel:

```python
def run_parallel_research(state: ManagerState) -> dict:
    topics = [state["query"], f"{state['query']} advanced"]

    results = []
    for topic in topics:
        result = research_subgraph.invoke({
            "topic": topic,
            "findings": "",
            "status": ""
        })
        results.append(result["findings"])

    return {"research_findings": "\n\n".join(results)}
```

For true parallelism, use fan-out:

```python
builder.add_edge(START, "research_topic_1")
builder.add_edge(START, "research_topic_2")
builder.add_edge("research_topic_1", "merge")
builder.add_edge("research_topic_2", "merge")
```

---

## Exemplo Completo de Agente Hierárquico

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict
from typing import List, Annotated
from operator import add

# === Level 2: Search Subgraph ===
class SearchState(TypedDict):
    query: str
    results: List[str]

def search_web(state: SearchState) -> dict:
    return {"results": [f"Result for: {state['query']}"]}

search_builder = StateGraph(SearchState)
search_builder.add_node("search", search_web)
search_builder.add_edge(START, "search")
search_builder.add_edge("search", END)
search_graph = search_builder.compile()

# === Level 2: Analyze Subgraph ===
class AnalyzeState(TypedDict):
    data: List[str]
    analysis: str

def analyze_data(state: AnalyzeState) -> dict:
    return {"analysis": f"Analysis of {len(state['data'])} sources"}

analyze_builder = StateGraph(AnalyzeState)
analyze_builder.add_node("analyze", analyze_data)
analyze_builder.add_edge(START, "analyze")
analyze_builder.add_edge("analyze", END)
analyze_graph = analyze_builder.compile()

# === Level 1: Manager ===
class ManagerState(TypedDict):
    query: str
    results: List[str]
    analysis: str
    final: str
    logs: Annotated[List[str], add]

def search_manager(state: ManagerState) -> dict:
    sub_result = search_graph.invoke({"query": state["query"], "results": []})
    return {"results": sub_result["results"], "logs": ["Search completed"]}

def analyze_manager(state: ManagerState) -> dict:
    sub_result = analyze_graph.invoke({"data": state["results"], "analysis": ""})
    return {"analysis": sub_result["analysis"], "logs": ["Analysis completed"]}

def finalize(state: ManagerState) -> dict:
    return {"final": f"Query: {state['query']}\nAnalysis: {state['analysis']}"}

builder = StateGraph(ManagerState)
builder.add_node("search", search_manager)
builder.add_node("analyze", analyze_manager)
builder.add_node("finalize", finalize)
builder.add_edge(START, "search")
builder.add_edge("search", "analyze")
builder.add_edge("analyze", "finalize")
builder.add_edge("finalize", END)

app = builder.compile()

result = app.invoke({
    "query": "LangGraph hierarchy",
    "results": [],
    "analysis": "",
    "final": "",
    "logs": []
})
print(result["final"])
```

---

## Benefícios do Design Hierárquico

| Benefício | Descrição |
| :--- | :--- |
| **Encapsulamento** | Subgraph internals don't leak to parent level |
| **Reusabilidade** | Subgrafos can be used in multiple parent graphs |
| **Testabilidade** | Each subgraph is tested independently |
| **Gerenciamento de complexidade** | Each level only deals with its own concerns |
| **Paralelismo** | Multiple subgraphs can run in parallel |
| **Interfaces claras** | Explicit input/output contracts between levels |

---

## Perguntas Práticas

```question
{
  "id": "lg-advanced-03-q1",
  "type": "multiple-choice",
  "question": "What is a subgraph in LangGraph?",
  "options": [
    "A smaller version of the same graph",
    "A compiled StateGraph used as a node within another graph",
    "A debugging tool",
    "A graph with fewer nodes"
  ],
  "correct": 1,
  "explanation": "A subgraph is a fully independent compiled graph that is added as a single node to a parent graph."
}
```

```question
{
  "id": "lg-advanced-03-q2",
  "type": "multiple-choice",
  "question": "What is the main advantage of hierarchical agent architecture?",
  "options": [
    "Faster execution",
    "Encapsulation — each level has its own state and concerns",
    "Lower LLM costs",
    "Simpler code"
  ],
  "correct": 1,
  "explanation": "Hierarchical design encapsulates state and logic at each level, preventing complexity from leaking across the system."
}
```

```question
{
  "id": "lg-advanced-03-q3",
  "type": "multiple-choice",
  "question": "How does a parent graph pass data to a subgraph?",
  "options": [
    "Automatically — all state is shared",
    "Explicit mapping in the parent node function that invokes the subgraph",
    "Through a global variable",
    "Subgraphs can't receive data from parents"
  ],
  "correct": 1,
  "explanation": "The parent node function manually maps parent state fields to subgraph input and maps subgraph output back to parent state fields."
}
```

```question
{
  "id": "lg-advanced-03-q4",
  "type": "multiple-choice",
  "question": "Can a subgraph contain its own subgraphs?",
  "options": [
    "No, only two levels are supported",
    "Yes, subgraphs can be nested to any depth",
    "Only up to 3 levels",
    "Nested subgraphs are not recommended"
  ],
  "correct": 1,
  "explanation": "Subgraphs can contain subgraphs to any depth, enabling arbitrarily complex hierarchies."
}
```

```question
{
  "id": "lg-advanced-03-q5",
  "type": "multiple-choice",
  "question": "What is a benefit of subgraph encapsulation?",
  "options": [
    "Increased performance",
    "Subgraphs can be tested and reused independently of the parent",
    "Automatic state synchronization",
    "Reduced code complexity"
  ],
  "correct": 1,
  "explanation": "Each subgraph is independently testable and reusable across different parent graphs, improving modularity."
}
```

```question
{
  "id": "lg-advanced-03-q6",
  "type": "multiple-choice",
  "question": "How do you add a subgraph as a node to a parent graph?",
  "options": [
    "builder.add_subgraph('name', subgraph)",
    "builder.add_node('name', subgraph) — same as adding a regular node",
    "builder.attach_subgraph('name', subgraph)",
    "Subgraphs cannot be added as nodes"
  ],
  "correct": 1,
  "explanation": "A compiled subgraph is added with add_node() just like a regular function. LangGraph handles the subgraph execution internally."
}
```

```question
{
  "id": "lg-advanced-03-q7",
  "type": "multiple-choice",
  "question": "What happens to the parent state after a subgraph completes?",
  "options": [
    "It is replaced by the subgraph state",
    "The subgraph's output dict is merged into the parent state",
    "The parent state is reset",
    "Nothing — subgraph state is isolated"
  ],
  "correct": 1,
  "explanation": "The subgraph returns a dict (its final state). The parent node receives this and returns it as updates to the parent state."
}
```

```question
{
  "id": "lg-advanced-03-q8",
  "type": "multiple-choice",
  "question": "What problem does hierarchical architecture solve in multi-agent systems?",
  "options": [
    "Slow execution speed",
    "Growing state complexity and lack of encapsulation",
    "High LLM costs",
    "Limited tool access"
  ],
  "correct": 1,
  "explanation": "As multi-agent systems grow, shared state becomes complex. Hierarchical design encapsulates state at each level."
}
```

```question
{
  "id": "lg-advanced-03-q9",
  "type": "multiple-choice",
  "question": "How can you run multiple subgraphs in parallel from a parent?",
  "options": [
    "Use add_edge(SHARED, 'subgraph1') and add_edge(SHARED, 'subgraph2')",
    "Run them sequentially in a single node",
    "Parallel subgraph execution is not supported",
    "Use Python threading inside a node"
  ],
  "correct": 0,
  "explanation": "Fan-out edges from START or a common node cause both subgraphs (as nodes) to execute in parallel."
}
```

```question
{
  "id": "lg-advanced-03-q10",
  "type": "multiple-choice",
  "question": "What is the role of a manager agent in a hierarchical system?",
  "options": [
    "To execute all tasks itself",
    "To delegate work to sub-agents/subgraphs and coordinate results",
    "To monitor system performance",
    "To authenticate users"
  ],
  "correct": 1,
  "explanation": "The manager decomposes tasks, delegates to specialized sub-agents/subgraphs, and synthesizes their results."
}
```

---

[!SUCESSO]
### Principais Conclusões
- Subgrafos are compiled graphs used as nodes in parent graphs
- Each subgraph has its own encapsulated state
- State mapping between levels is explicit (manual)
- Subgrafos can be nested to any depth
- Reusabilidade: same subgraph can be used in multiple parents
- Testabilidade: each subgraph is independently testable
- Parallel subgraph execution via fan-out edges
- Hierarchical design manages complexity in large agent systems
