---
title: "Fluxos de Aprovação"
description: "Implemente fluxos de aprovação estruturados com interrupções condicionais, interrupções antes/depois de nós e roteamento dinâmico humano-no-circuito."
order: 6
duration: "35 min"
difficulty: "intermediate"
---

# Fluxos de Aprovação

Fluxos de aprovação combinam interrupts com roteamento condicional para criar processos estruturados com humano no loop. Esta lição cobre interrupts antes do nó, interrupts após o nó e padrões dinâmicos de aprovação.

---

## Visão Geral do Padrão de Aprovação

```
Agent proposes action → Human reviews → Approve? → Yes → Execute
                                              ↓ No
                                         Reject → Provide feedback → Revise or Stop
```

O agente apresenta uma proposta, o humano decide e a execução segue de acordo.

---

## Interrupção Antes do Nó

Interrompa **antes** de um nó executar, o humano decide se o nó deve rodar:

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
Um interrupt **antes do nó** impede que uma ação aconteça até ser aprovada. Este é o padrão de aprovação mais comum: ele evita ações não autorizadas ou arriscadas.

---

## Interrupção Após o Nó

Interrompa **depois** de um nó executar, o humano revisa o resultado:

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
Interrupts após o nó são úteis para revisão de conteúdo, validação de resultados e qualquer fluxo de trabalho em que o humano deva verificar a saída antes de ela ser usada.

---

## Roteamento Condicional de Aprovação

Roteie com base no que o humano aprovou ou rejeitou:

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

### Padrão de Loop de Revisão

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
Sempre limite os laços de revisão. Sem um máximo, um revisor insatisfeito poderia ficar em laço para sempre.

---

## Fluxo de Escalonamento

Roteie para um revisor sênior se o júnior rejeitar ou se a solicitação for de alto risco:

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

## Aprovação com Dados Dinâmicos

Inclua os dados relevantes na solicitação de aprovação:

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

## Timeout para Aprovações

Trate o caso em que o humano nunca responde:

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
O LangGraph não tem timeout integrado para interrupts. Implemente a lógica de timeout na camada da aplicação verificando há quanto tempo um thread está pausado.

---

## Exemplo Completo de Fluxo de Aprovação

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

## Perguntas de Prática (Practice Questions)

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
### Principais Conclusões
- Interrupts antes do nó impedem ações até a aprovação humana
- Interrupts após o nó permitem que os humanos revisem os resultados antes de prosseguir
- Arestas condicionais roteiam com base nas decisões de aprovação/rejeição
- Laços de revisão se repetem até a aprovação ou até atingir o máximo de revisões
- Fluxos de escalação roteiam para revisores sêniores quando necessário
- Passe um contexto rico em interrupt() para ajudar os humanos a tomar decisões informadas
- Sempre limite os laços de revisão e escalação com contagens máximas
- Múltiplas aprovações sequenciais podem ser encadeadas em um único grafo
