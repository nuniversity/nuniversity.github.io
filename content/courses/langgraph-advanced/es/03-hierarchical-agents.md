---
title: "Agentes Jerárquicos"
description: "Implementa arquitecturas multi-agente jerárquicas con agentes gerentes, sub-agentes, subgrafos y paso de estado entre niveles jerárquicos."
order: 3
duration: "40 min"
difficulty: "advanced"
---

# Agentes Jerárquicos

Los agentes jerárquicos organizan el trabajo en niveles: un **agente gestor** delega tareas a **subagentes**, que pueden ser a su vez grafos con nodos internos. Esto permite sistemas de agentes escalables, mantenibles y encapsulados.

---

## ¿Por qué Jerárquico?

Los sistemas multiagente planos tienen limitaciones:

1. **Complejidad del estado**: Todos los agentes comparten un único diccionario de estado, que crece de forma ingobernable
2. **Costo de coordinación**: Cada agente ve todos los mensajes, incluso los irrelevantes
3. **Encapsulamiento**: Los detalles internos de los agentes se filtran en el estado compartido
4. **Escalabilidad**: Añadir agentes aumenta la complejidad linealmente

Las arquitecturas jerárquicas lo resuelven con **encapsulamiento y delegación**:

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

Los subgrafos son grafos usados como nodos dentro de un grafo padre. Tienen su propio estado, nodos y aristas, completamente encapsulados.

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

[!NOTE]
El subgrafo de investigación tiene su propio estado (`ResearchState`). No conoce el estado del grafo padre, y el padre no conoce los detalles internos de la investigación.

---

## Grafo Padre Usando Subgrafo

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

[!SUCCESS]
Un subgrafo se añade como un nodo igual que una función normal. LangGraph gestiona el mapeo de estado entre el padre y el subgrafo automáticamente.

---

## Mapeo de Estado entre Padre y Subgrafo

El padre pasa un subconjunto de su estado al subgrafo. El subgrafo devuelve su estado, que se vuelve a fusionar.

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

## Jerarquía de Múltiples Niveles

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

[!IMPORTANT]
Los subgrafos en cualquier nivel pueden contener sus propios subgrafos. Este anidamiento permite jerarquías de agentes arbitrariamente complejas, manteniendo el encapsulamiento en cada nivel.

---

## Contexto Compartido entre Niveles

Usa un **objeto de contexto** que recorra todos los niveles de la jerarquía:

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

[!WARNING]
El mapeo de estado entre el padre y el subgrafo debe ser explícito. El padre decide qué campos pasar al subgrafo y qué salidas del subgrafo leer.

---

## Ejecución Paralela de Subgrafos

Ejecuta varios subgrafos en paralelo:

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

Para un paralelismo real, usa fan-out:

```python
builder.add_edge(START, "research_topic_1")
builder.add_edge(START, "research_topic_2")
builder.add_edge("research_topic_1", "merge")
builder.add_edge("research_topic_2", "merge")
```

---

## Ejemplo Completo de Agente Jerárquico

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

## Beneficios del Diseño Jerárquico

| Beneficio | Descripción |
| :--- | :--- |
| **Encapsulamiento** | Los detalles internos del subgrafo no se filtran al nivel padre |
| **Reutilización** | Los subgrafos pueden usarse en múltiples grafos padre |
| **Testabilidad** | Cada subgrafo se prueba de forma independiente |
| **Gestión de la complejidad** | Cada nivel solo se ocupa de sus propias preocupaciones |
| **Paralelismo** | Múltiples subgrafos pueden ejecutarse en paralelo |
| **Interfaces claras** | Contratos explícitos de entrada/salida entre niveles |

---

## Preguntas de Práctica (Practice Questions)

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

[!SUCCESS]
### Conclusiones Clave
- Los subgrafos son grafos compilados usados como nodos en grafos padre
- Cada subgrafo tiene su propio estado encapsulado
- El mapeo de estado entre niveles es explícito (manual)
- Los subgrafos pueden anidarse a cualquier profundidad
- Reutilización: el mismo subgrafo puede usarse en múltiples padres
- Testabilidad: cada subgrafo puede probarse de forma independiente
- Ejecución paralela de subgrafos mediante aristas de fan-out
- El diseño jerárquico gestiona la complejidad en grandes sistemas de agentes
