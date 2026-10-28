---
title: "Flujos de Aprobación"
description: "Implementa flujos de aprobación estructurados con interrupciones condicionales, interrupciones antes/después de nodos y enrutamiento dinámico humano-en-el-bucle."
order: 6
duration: "35 min"
difficulty: "intermediate"
---

# Flujos de Aprobación

Los flujos de aprobación combinan interrupts con enrutamiento condicional para crear procesos estructurados con humano en el bucle. Esta lección cubre interrupts antes del nodo, interrupts después del nodo y patrones dinámicos de aprobación.

---

## Visión General del Patrón de Aprobación

```
Agent proposes action → Human reviews → Approve? → Yes → Execute
                                              ↓ No
                                         Reject → Provide feedback → Revise or Stop
```

El agente presenta una propuesta, la persona decide y la ejecución sigue en consecuencia.

---

## Interrupción Antes del Nodo

Interrumpe **antes** de que se ejecute un nodo: la persona decide si el nodo debe ejecutarse:

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command
from typing_extensions import TypedDict

class ApprovalState(TypedDict):
    query: str
    search_plan: str
    approved: bool
    feedback: str
    result: str

def plan_node(state: ApprovalState) -> dict:
    plan = f"Search for: {state['query']}"
    return {"search_plan": plan}

def approve_search(state: ApprovalState) -> dict:
    # BEFORE interrupt — human decides if search should happen
    response = interrupt({
        "type": "approval",
        "agent_plan": state["search_plan"],
        "prompt": "Approve this search operation?"
    })
    return {"approved": response.get("approved", False),
            "feedback": response.get("feedback")}

def execute_search(state: ApprovalState) -> dict:
    if not state["approved"]:
        return {"result": f"Rejected. Feedback: {state.get('feedback')}"}
    return {"result": f"Executed: {state['search_plan']}"}

def after_search_review(state: ApprovalState) -> dict:
    # AFTER interrupt — human reviews results
    response = interrupt({
        "type": "review",
        "result": state["result"],
        "prompt": "Are these results acceptable?"
    })
    return {"approved": response.get("approved", False)}

builder = StateGraph(ApprovalState)
builder.add_node("plan", plan_node)
builder.add_node("approve_search", approve_search)
builder.add_node("execute", execute_search)

builder.add_edge(START, "plan")
builder.add_edge("plan", "approve_search")
builder.add_edge("approve_search", "execute")
builder.add_edge("execute", END)

app = builder.compile(checkpointer=MemorySaver())
```

[!NOTE]
Un interrupt **antes del nodo** impide que una acción se produzca hasta que se apruebe. Es el patrón de aprobación más común: evita acciones no autorizadas o arriesgadas.

---

## Interrupción Después del Nodo

Interrumpe **después** de que se ejecute un nodo: la persona revisa el resultado:

```python
def draft_email(state: EmailState) -> dict:
    email = llm.invoke(f"Draft email about: {state['topic']}")
    return {"draft": email.content}

def review_draft(state: EmailState) -> dict:
    # AFTER interrupt — human reviews the draft
    response = interrupt({
        "type": "review",
        "draft": state["draft"],
        "prompt": "Edit or approve this email draft?"
    })
    return {
        "approved": response.get("approved", False),
        "revision": response.get("revision", "")
    }

def finalize_or_revise(state: EmailState) -> dict:
    if state["approved"]:
        return {"final": state["draft"]}
    return {"draft": state["revision"], "approved": False}
```

[!TIP]
Los interrupts después del nodo son útiles para la revisión de contenido, la validación de resultados y cualquier flujo de trabajo en que la persona deba verificar la salida antes de usarla.

---

## Enrutamiento Condicional de Aprobación

Enruta según lo que la persona haya aprobado o rechazado:

```python
def approval_router(state: ApprovalState) -> str:
    if state["approved"]:
        return "approved"
    return "rejected"

builder.add_conditional_edges(
    "human_review",
    approval_router,
    {
        "approved": "execute",
        "rejected": "revise_plan"  # Send back for revision
    }
)
```

### Patrón de Bucle de Revisión

```python
class RevisionState(TypedDict):
    draft: str
    approved: bool
    revision_count: int

def generate_draft(state: RevisionState) -> dict:
    draft = llm.invoke(f"Write content about: {state['topic']}")
    return {"draft": draft.content}

def human_review(state: RevisionState) -> dict:
    response = interrupt({
        "draft": state["draft"],
        "revision_count": state["revision_count"],
        "prompt": "Approve, or provide revision instructions."
    })
    return {
        "approved": response.get("approved", False),
        "feedback": response.get("feedback", ""),
        "revision_count": state["revision_count"] + 1
    }

def revise_draft(state: RevisionState) -> dict:
    revised = llm.invoke(
        f"Revise this draft based on feedback:\n"
        f"Draft: {state['draft']}\nFeedback: {state['feedback']}"
    )
    return {"draft": revised.content}

def revision_router(state: RevisionState) -> str:
    if state["approved"]:
        return "finalize"
    if state["revision_count"] >= 5:
        return "max_revisions"
    return "revise"

builder.add_conditional_edges(
    "human_review",
    revision_router,
    {
        "finalize": "finalize",
        "revise": "revise_draft",
        "max_revisions": "error_handler"
    }
)
builder.add_edge("revise_draft", "human_review")  # Loop back for another review
```

[!WARNING]
Limita siempre los bucles de revisión. Sin un máximo, un revisor insatisfecho podría quedar en bucle para siempre.

---

## Flujo de Escalada

Enruta a un revisor sénior si el junior rechaza o si la solicitud es de alto riesgo:

```python
class EscalationState(TypedDict):
    request: str
    risk_level: str
    junior_approved: bool
    senior_approved: bool

def junior_review(state: EscalationState) -> dict:
    response = interrupt({"request": state["request"], "risk": state["risk_level"]})
    return {"junior_approved": response.get("approved", False)}

def escalate(state: EscalationState) -> dict:
    response = interrupt({"request": state["request"],
                          "risk": state["risk_level"],
                          "note": "Escalated from junior review"})
    return {"senior_approved": response.get("approved", False)}

def escalation_router(state: EscalationState) -> str:
    if state["junior_approved"]:
        return "approved"
    if state["risk_level"] == "high":
        return "escalate"
    return "rejected"

builder.add_conditional_edges(
    "junior_review",
    escalation_router,
    {
        "approved": "execute",
        "escalate": "senior_review",
        "rejected": "reject_node"
    }
)
```

---

## Aprobación con Datos Dinámicos

Incluye los datos relevantes en la solicitud de aprobación:

```python
def approval_with_context(state: State) -> dict:
    # Gather context for the human reviewer
    context = {
        "request_id": state["request_id"],
        "requester": state["user_name"],
        "action": state["proposed_action"],
        "cost_estimate": state.get("estimated_cost", "Unknown"),
        "similar_approved_count": state.get("similar_count", 0),
        "policy_reference": "Policy #42: External API calls require approval",
        "timestamp": datetime.now().isoformat()
    }
    response = interrupt(context)
    return {"approval_response": response}
```

---

## Timeout para Aprobaciones

Maneja el caso en que la persona nunca responde:

```python
def approval_with_timeout(state: State) -> dict:
    # Set a timeout via configuration
    config = state.get("config", {})
    timeout = config.get("approval_timeout_minutes", 60)

    response = interrupt({
        "prompt": "Approve within {timeout} minutes or it will be auto-rejected.",
        "request": state["request"]
    })

    # If human doesn't respond within timeout,
    # calling invoke again with a timeout command handles it
    return {"human_response": response}
```

[!NOTE]
LangGraph no tiene un timeout integrado para los interrupts. Implementa la lógica de timeout en la capa de la aplicación comprobando cuánto tiempo lleva pausado un hilo.

---

## Ejemplo Completo de Flujo de Aprobación

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command
from typing_extensions import TypedDict
from datetime import datetime

class WorkflowState(TypedDict):
    request: str
    risk_score: float
    draft_response: str
    approved: bool
    feedback: str
    result: str
    step: str

def analyze_request(state: WorkflowState) -> dict:
    risk = len(state["request"]) * 0.01  # Simplified risk calc
    return {"risk_score": min(risk, 1.0), "step": "analyzed"}

def generate_draft(state: WorkflowState) -> dict:
    draft = f"Response to: {state['request']}"
    return {"draft_response": draft, "step": "drafted"}

def human_approval(state: WorkflowState) -> dict:
    response = interrupt({
        "request": state["request"],
        "draft": state["draft_response"],
        "risk": state["risk_score"],
        "timestamp": datetime.now().isoformat()
    })
    return {"approved": response.get("approved", False),
            "feedback": response.get("feedback", ""),
            "step": "reviewed"}

def execute(state: WorkflowState) -> dict:
    if state["approved"]:
        return {"result": state["draft_response"], "step": "completed"}
    return {"result": f"Rejected: {state.get('feedback')}", "step": "rejected"}

builder = StateGraph(WorkflowState)
builder.add_node("analyze", analyze_request)
builder.add_node("draft", generate_draft)
builder.add_node("approve", human_approval)
builder.add_node("execute", execute)
builder.add_edge(START, "analyze")
builder.add_edge("analyze", "draft")
builder.add_edge("draft", "approve")
builder.add_edge("approve", "execute")
builder.add_edge("execute", END)

app = builder.compile(checkpointer=MemorySaver())
```

---

## Preguntas de Práctica (Practice Questions)

```question
{
  "id": "lg-intermediate-06-q1",
  "type": "multiple-choice",
  "question": "What is a before-node interrupt?",
  "options": [
    "An interrupt that occurs before a node executes, preventing it until approved",
    "An interrupt that runs before the graph starts",
    "An interrupt that cancels the previous node",
    "An interrupt that occurs at the end of the graph"
  ],
  "correct": 0,
  "explanation": "A before-node interrupt pauses execution right before a node runs. The node only executes after the human approves."
}
```

```question
{
  "id": "lg-intermediate-06-q2",
  "type": "multiple-choice",
  "question": "What is an after-node interrupt useful for?",
  "options": [
    "Preventing node execution",
    "Reviewing a node's output before proceeding",
    "Cancelling the graph",
    "Skipping validation"
  ],
  "correct": 1,
  "explanation": "After-node interrupts let a human review the output of a node (e.g., a draft, result) before deciding whether to proceed."
}
```

```question
{
  "id": "lg-intermediate-06-q3",
  "type": "multiple-choice",
  "question": "How do you create a revision loop in an approval workflow?",
  "options": [
    "Use add_edge('review', 'draft') to loop back",
    "Use a conditional edge that routes 'rejected' back to the draft node",
    "Use a while loop inside the node",
    "Revision loops are not supported"
  ],
  "correct": 1,
  "explanation": "Use add_conditional_edges with a router that sends 'rejected' back to the generation node while 'approved' goes to finalize."
}
```

```question
{
  "id": "lg-intermediate-06-q4",
  "type": "multiple-choice",
  "question": "Why should revision loops have a maximum count?",
  "options": [
    "To save disk space",
    "To prevent infinite review cycles",
    "To improve performance",
    "It's not necessary"
  ],
  "correct": 1,
  "explanation": "Without a maximum revision count, an unsatisfied reviewer could keep rejecting forever, causing an infinite loop."
}
```

```question
{
  "id": "lg-intermediate-06-q5",
  "type": "multiple-choice",
  "question": "What is an escalation workflow?",
  "options": [
    "A workflow that runs faster",
    "A workflow that routes rejected or high-risk items to a senior reviewer",
    "A workflow that skips approval",
    "A workflow that automatically approves everything"
  ],
  "correct": 1,
  "explanation": "Escalation routes items to a higher authority (senior reviewer) when junior review rejects or risk is high."
}
```

```question
{
  "id": "lg-intermediate-06-q6",
  "type": "multiple-choice",
  "question": "How do you include context for the human reviewer in an interrupt?",
  "options": [
    "Context is automatically included",
    "Pass a dict with all relevant information to interrupt()",
    "Store context in a separate database",
    "Context cannot be passed to the human"
  ],
  "correct": 1,
  "explanation": "Pass a dict with any relevant context (risk scores, draft text, timestamps) to interrupt(). It is presented to the human."
}
```

```question
{
  "id": "lg-intermediate-06-q7",
  "type": "multiple-choice",
  "question": "What determines which path the graph takes after an approval interrupt?",
  "options": [
    "The router function reading state['approved']",
    "The content of the interrupt response",
    "Both: the node writes the decision to state, then a router reads it",
    "The graph topology is fixed"
  ],
  "correct": 2,
  "explanation": "The approval node writes the human's decision (approved/rejected) to state, and a conditional edge router reads that decision."
}
```

```question
{
  "id": "lg-intermediate-06-q8",
  "type": "multiple-choice",
  "question": "What happens when a human rejects a proposal in an approval workflow?",
  "options": [
    "The graph terminates immediately",
    "The rejection is written to state, and the router sends execution to a rejection handler or revision node",
    "The graph retries automatically",
    "The rejection is ignored"
  ],
  "correct": 1,
  "explanation": "On rejection, the node writes the decision to state, and the conditional edge routes to the appropriate handler (rejection message, revision, or escalation)."
}
```

```question
{
  "id": "lg-intermediate-06-q9",
  "type": "multiple-choice",
  "question": "Can an approval workflow have multiple sequential approval steps?",
  "options": [
    "No, only one approval per graph",
    "Yes, with multiple interrupt nodes in sequence",
    "Only with special configuration",
    "Multiple approvals require separate graphs"
  ],
  "correct": 1,
  "explanation": "Multiple approval steps are implemented as sequential nodes, each with their own interrupt. For example: plan_approval → execution → result_review."
}
```

```question
{
  "id": "lg-intermediate-06-q10",
  "type": "multiple-choice",
  "question": "How does the approval workflow pattern enhance LangGraph agents?",
  "options": [
    "It makes them run faster",
    "It adds human oversight for safety-critical or high-risk actions",
    "It reduces the need for LLMs",
    "It simplifies the graph topology"
  ],
  "correct": 1,
  "explanation": "Approval workflows give humans control over agent actions, enabling safe deployment of autonomous agents in production environments."
}
```

---

[!SUCCESS]
### Conclusiones Clave
- Los interrupts antes del nodo impiden acciones hasta la aprobación humana
- Los interrupts después del nodo permiten que las personas revisen los resultados antes de continuar
- Las aristas condicionales enrutan según las decisiones de aprobación/rechazo
- Los bucles de revisión se repiten hasta la aprobación o hasta alcanzar el máximo de revisiones
- Los flujos de escalamiento enrutan a revisores sénior cuando es necesario
- Pasa un contexto rico en interrupt() para ayudar a las personas a tomar decisiones informadas
- Limita siempre los bucles de revisión y escalamiento con recuentos máximos
- Se pueden encadenar múltiples aprobaciones secuenciales en un solo grafo
