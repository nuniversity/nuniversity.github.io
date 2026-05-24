---
title: "Patrón Planificar y Ejecutar"
description: "Implementa el patrón planificar-y-ejecutar en LangGraph — un nodo de planificación crea un plan paso a paso, un nodo de ejecución ejecuta pasos y un bucle de replanificación se adapta a los resultados."
order: 7
duration: "40 minutes"
difficulty: "advanced"
---

# Patrón Planificar y Ejecutar

The plan-and-execute pattern separates **planning** (thinking what to do) from **execution** (doing it). The agent creates a plan, executes steps, observes results, and re-plans as needed.

---

## Architecture

```
Task Input
    ↓
Planning Node ──→ Creates step-by-step plan
    ↓
Execution Node ──→ Executes next step, observes result
    ↓
Check Node ──→ Is plan complete? ──→ Yes → Return result
    ↓ No                            ↑
Re-Plan ───────── Modify plan ──────┘
```

---

## Planificar y Ejecutar Básico

```python
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict
from typing import List, Annotated
from operator import add

llm = ChatOpenAI(model="gpt-4o")

class PlanState(TypedDict):
    task: str
    plan: List[str]             # Ordered list of steps
    completed_steps: Annotated[List[str], add]
    results: Annotated[List[str], add]
    current_step_index: int
    observations: List[str]
    final_answer: str

def planner(state: PlanState) -> dict:
    prompt = f"""Create a step-by-step plan to accomplish this task:
{state['task']}

Break it down into 3-5 clear, actionable steps.
Return as a numbered list. Each step should be specific and concrete."""

    response = llm.invoke(prompt).content
    steps = [s.strip() for s in response.split("\n")
             if s.strip() and any(s.strip().startswith(str(i)) for i in range(1, 10))]

    print(f"Plan created: {len(steps)} steps")
    return {"plan": steps, "current_step_index": 0, "observations": []}
```

[!NOTA]
The planner decomposes the task into discrete, actionable steps. Each step should be specific enough that the executor knows exactly what to do.

---

## Nodo Ejecutor

```python
def executor(state: PlanState) -> dict:
    step_index = state["current_step_index"]

    if step_index >= len(state["plan"]):
        return {}  # All steps done

    step = state["plan"][step_index]
    context = "\n".join(state.get("results", [])) if state.get("results") else "No prior results."

    prompt = f"""Task: {state['task']}
Current step: {step}
Previous results: {context}

Execute this step. Provide the result."""

    result = llm.invoke(prompt).content

    return {
        "completed_steps": [step],
        "results": [result],
        "current_step_index": step_index + 1,
        "observations": state.get("observations", []) + [f"Step {step_index + 1}: {result[:100]}..."]
    }
```

---

## Nodo de Verificación y Replanificación

```python
def checker(state: PlanState) -> dict:
    """Check if the plan is complete or needs modification."""
    steps_done = len(state.get("completed_steps", []))
    total_steps = len(state.get("plan", []))

    if steps_done >= total_steps:
        return {"observations": state.get("observations", []) + ["All steps completed"]}

    # Check if we need to re-plan based on results
    last_result = state["results"][-1] if state["results"] else ""

    prompt = f"""Task: {state['task']}
Plan: {state['plan']}
Steps completed: {steps_done}/{total_steps}
Last result: {last_result[:200]}

Do we need to re-plan? Options:
1. 'continue' — The plan is working, proceed to next step
2. 'replan' — We need to modify the remaining steps based on new information
3. 'complete' — The task is already done

Respond with one word."""

    decision = llm.invoke(prompt).content.strip().lower()

    return {"observations": state.get("observations", []) + [f"Decision: {decision}"]}

def router(state: PlanState) -> str:
    last_obs = state["observations"][-1] if state["observations"] else ""

    if "complete" in last_obs:
        return "complete"
    elif "replan" in last_obs:
        return "replan"
    else:
        step_index = state["current_step_index"]
        if step_index >= len(state["plan"]):
            return "complete"
        return "continue"
```

[!ÉXITO]
The checker evaluates progress after each step. If results indicate a better approach exists, it triggers re-planning. Otherwise, execution continues.

---

## Nodo de Replanificación

```python
def replanner(state: PlanState) -> dict:
    completed = "\n".join(state.get("completed_steps", []))
    results = "\n".join(state.get("results", []))

    prompt = f"""Task: {state['task']}

Original plan: {state['plan']}
Completed steps: {completed}
Results so far: {results[:500]}

Based on the results, create an updated plan for the remaining work.
Return as a numbered list. Focus on what still needs to be done."""

    response = llm.invoke(prompt).content
    new_steps = [s.strip() for s in response.split("\n")
                 if s.strip() and any(s.strip().startswith(str(i)) for i in range(1, 10))]

    return {"plan": new_steps, "current_step_index": 0}
```

---

## Grafo Completo

```python
def finalizer(state: PlanState) -> dict:
    results = "\n".join(state.get("results", []))
    prompt = f"""Task: {state['task']}
Results: {results}

Provide the final answer synthesizing all results."""
    return {"final_answer": llm.invoke(prompt).content}

# Build the graph
builder = StateGraph(PlanState)
builder.add_node("planner", planner)
builder.add_node("executor", executor)
builder.add_node("checker", checker)
builder.add_node("replanner", replanner)
builder.add_node("finalizer", finalizer)

# Flow
builder.add_edge(START, "planner")
builder.add_edge("planner", "executor")
builder.add_edge("executor", "checker")

# Conditional routing based on check
builder.add_conditional_edges("checker", router, {
    "continue": "executor",
    "replan": "replanner",
    "complete": "finalizer"
})
builder.add_edge("replanner", "executor")
builder.add_edge("finalizer", END)

app = builder.compile()
```

[!ADVERTENCIA]
Without a maximum number of re-plans, the agent could re-plan indefinitely. Track re-plan count and force completion after N re-plans.

---

## Seguimiento de Conteo de Replanificaciones

```python
class PlanState(TypedDict):
    task: str
    plan: List[str]
    completed_steps: Annotated[List[str], add]
    results: Annotated[List[str], add]
    current_step_index: int
    observations: List[str]
    replan_count: int          # Track re-plans
    max_replans: int           # Maximum allowed re-plans
    final_answer: str

def replanner(state: PlanState) -> dict:
    if state["replan_count"] >= state["max_replans"]:
        return {"observations": ["Max re-plans reached, completing"]}
    # ... rest of replanning logic
    return {"plan": new_steps, "current_step_index": 0, "replan_count": state["replan_count"] + 1}
```

---

## Ejemplo: Tarea de Investigación con Planificar-y-Ejecutar

```python
# Run the agent
result = app.invoke({
    "task": "Research the environmental impact of electric vehicles "
            "compared to gasoline cars. Provide a balanced analysis.",
    "plan": [],
    "completed_steps": [],
    "results": [],
    "current_step_index": 0,
    "observations": [],
    "replan_count": 0,
    "max_replans": 2,
    "final_answer": ""
})

print(result["final_answer"])
# Output: A comprehensive, multi-step research report that was
# planned, executed, checked, and potentially re-planned
```

---

## Planificar-y-Ejecutar vs ReAct

| Aspecto | Plan-and-Execute | ReAct |
| :--- | :--- | :--- |
| **Planning** | Explicit upfront plan | No explicit plan |
| **Execution** | Follows plan step by step | Reacts to each observation |
| **Adaptability** | Re-plans when needed | Naturally adaptive |
| **Best for** | Complex multi-step tasks | Interactive, tool-heavy tasks |
| **Predictability** | High (plan is visible) | Low (emergent behavior) |
| **Token usage** | Higher (plan + execution) | Lower |

---

## Preguntas Prácticas

```question
{
  "id": "lg-advanced-07-q1",
  "type": "multiple-choice",
  "question": "What is the first node executed in the plan-and-execute pattern?",
  "options": ["executor", "checker", "planner", "finalizer"],
  "correct": 2,
  "explanation": "The planner runs first to create a step-by-step plan before any execution begins."
}
```

```question
{
  "id": "lg-advanced-07-q2",
  "type": "multiple-choice",
  "question": "What triggers a re-plan in the plan-and-execute pattern?",
  "options": [
    "Every step automatically triggers re-planning",
    "The checker node decides based on results that the plan needs modification",
    "Re-planning happens at fixed intervals",
    "Only when an error occurs"
  ],
  "correct": 1,
  "explanation": "After each step, the checker evaluates results and decides whether to continue, re-plan, or complete."
}
```

```question
{
  "id": "lg-advanced-07-q3",
  "type": "multiple-choice",
  "question": "What risk should you guard against in the re-planning loop?",
  "options": [
    "The plan being too short",
    "Infinite re-planning without progress",
    "The executor being too fast",
    "The planner creating too many steps"
  ],
  "correct": 1,
  "explanation": "Without a maximum re-plan count, the agent could re-plan indefinitely. Track and limit re-plans."
}
```

```question
{
  "id": "lg-advanced-07-q4",
  "type": "multiple-choice",
  "question": "What does the executor node do?",
  "options": [
    "Creates the plan",
    "Executes the current step from the plan and records results",
    "Checks if the plan is complete",
    "Re-plans remaining steps"
  ],
  "correct": 1,
  "explanation": "The executor takes the current step from the plan, executes it, and stores the result and observation."
}
```

```question
{
  "id": "lg-advanced-07-q5",
  "type": "multiple-choice",
  "question": "How does the checker node determine if re-planning is needed?",
  "options": [
    "Random decision",
    "It asks the LLM to evaluate whether the plan remains appropriate given results",
    "It always triggers re-planning",
    "It checks a fixed schedule"
  ],
  "correct": 1,
  "explanation": "The checker presents the plan, progress, and latest results to the LLM, asking if the plan is still valid or needs modification."
}
```

```question
{
  "id": "lg-advanced-07-q6",
  "type": "multiple-choice",
  "question": "What is the main advantage of plan-and-execute over ReAct?",
  "options": [
    "Plan-and-execute is always faster",
    "Explicit planning provides predictability and visibility into the agent's strategy",
    "Plan-and-execute uses fewer tokens",
    "There is no advantage"
  ],
  "correct": 1,
  "explanation": "The explicit plan makes the agent's strategy visible and predictable. You can inspect, validate, or adjust the plan before execution."
}
```

```question
{
  "id": "lg-advanced-07-q7",
  "type": "multiple-choice",
  "question": "How does the planner receive context from previous results?",
  "options": [
    "It doesn't — each plan is from scratch",
    "The results from executed steps are included in the re-plan prompt",
    "Via a separate context field",
    "Results are ignored during planning"
  ],
  "correct": 1,
  "explanation": "When re-planning, the replanner receives completed steps and results so it can create an informed updated plan."
}
```

```question
{
  "id": "lg-advanced-07-q8",
  "type": "multiple-choice",
  "question": "What happens when all plan steps are executed?",
  "options": [
    "The graph ends automatically",
    "The checker identifies completion and routes to finalizer",
    "The executor runs one more time",
    "The planner is called again"
  ],
  "correct": 1,
  "explanation": "When current_step_index >= len(plan), the checker sees all steps done and routes to the finalizer."
}
```

```question
{
  "id": "lg-advanced-07-q9",
  "type": "multiple-choice",
  "question": "What does the finalizer node do?",
  "options": [
    "Creates a new plan",
    "Synthesizes all results into a final answer",
    "Executes the last step",
    "Checks for errors"
  ],
  "correct": 1,
  "explanation": "The finalizer receives all accumulated results and synthesizes them into a coherent final answer."
}
```

```question
{
  "id": "lg-advanced-07-q10",
  "type": "multiple-choice",
  "question": "In what scenarios is plan-and-execute preferred over simpler patterns?",
  "options": [
    "Simple single-step tasks",
    "Complex, multi-step tasks that require strategic planning",
    "Real-time chat",
    "Static content generation"
  ],
  "correct": 1,
  "explanation": "Plan-and-execute excels at complex tasks that benefit from explicit strategizing, like research projects, data analysis pipelines, or multi-stage workflows."
}
```

---

[!ÉXITO]
### Conclusiones Clave
- Plan-and-execute separates strategic planning from tactical execution
- Planner creates an explicit step-by-step plan before execution begins
- Executor runs one step at a time and records results
- Checker evaluates progress and decides to continue, re-plan, or complete
- Re-planner creates updated plans based on intermediate results
- Track re-plan count to prevent infinite re-planning loops
- The explicit plan provides predictability and visibility
- Best for complex multi-step tasks that benefit from upfront strategy
