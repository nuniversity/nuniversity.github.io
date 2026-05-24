---
title: "Human-in-the-Loop with Interrupts"
description: "Implement human-in-the-loop workflows using interrupts, pause execution for user input, and resume graph execution."
order: 5
duration: "35 minutes"
difficulty: "intermediate"
---

# Human-in-the-Loop with Interrupts

LangGraph's `interrupt()` function pauses graph execution and waits for human input. This enables approval workflows, clarification requests, and any scenario where a human needs to review or contribute before the agent continues.

---

## What is an Interrupt?

An interrupt **pauses** graph execution at a specific node, surfaces state information to the user, and waits for the user to provide input before resuming.

```mermaid
flowchart LR
    START --> analyze
    analyze -->|interrupt| WAIT["⏸ Wait for Human"]
    WAIT -->|resume| execute
    execute --> END
```

---

## The interrupt() Function

```python
from langgraph.types import interrupt

def approval_node(state: State) -> dict:
    # Pause execution and ask for human input
    human_response = interrupt(
        # This value is presented to the human
        {
            "question": "Approve this action?",
            "action": state["proposed_action"],
            "risk_level": state["risk"]
        }
    )

    # human_response contains what the human provided
    if human_response.get("approved"):
        return {"approved": True}
    else:
        return {"approved": False, "feedback": human_response.get("feedback")}
```

[!IMPORTANT]
`interrupt()` raises a special exception that pauses the graph. The function does **not** continue executing until the graph is resumed with `invoke()` or `update_state()`.

---

## Setting Up Interrupts

Interrupts require a **checkpointer** (persistence):

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from typing_extensions import TypedDict

class ApprovalState(TypedDict):
    query: str
    proposed_action: str
    approved: bool
    feedback: str

def analyze_node(state: ApprovalState) -> dict:
    # Agent proposes an action
    action = f"Search for: {state['query']}"
    return {"proposed_action": action}

def human_review(state: ApprovalState) -> dict:
    # INTERRUPT — pause and ask human
    response = interrupt({
        "query": state["query"],
        "proposed_action": state["proposed_action"],
        "prompt": "Approve this search?"
    })
    return {
        "approved": response.get("approved", False),
        "feedback": response.get("feedback", "")
    }

def execute_node(state: ApprovalState) -> dict:
    if state["approved"]:
        # Execute the approved action
        return {"result": f"Executed: {state['proposed_action']}"}
    return {"result": f"Skipped: {state.get('feedback', 'No reason given')}"}

# Build graph
builder = StateGraph(ApprovalState)
builder.add_node("analyze", analyze_node)
builder.add_node("human_review", human_review)
builder.add_node("execute", execute_node)
builder.add_edge(START, "analyze")
builder.add_edge("analyze", "human_review")
builder.add_edge("human_review", "execute")
builder.add_edge("execute", END)

# Compile with checkpointer
app = builder.compile(checkpointer=MemorySaver())
```

---

## Running the Graph with Interrupts

```python
# 1. Start the graph
config = {"configurable": {"thread_id": "approval-1"}}

# This will pause at the interrupt
try:
    result = app.invoke(
        {"query": "latest AI news", "proposed_action": "", "approved": False, "feedback": "", "result": ""},
        config
    )
except:  # interrupt() raises an exception
    pass

# 2. Check the paused state
state = app.get_state(config)
print(state.next)  # ('human_review',) — this node is pending
print(state.values)  # Current state at interruption point

# 3. Resume by providing human input
result = app.invoke(
    None,  # No new state — we're resuming
    {"configurable": {"thread_id": "approval-1"}},
    {"approved": True, "feedback": "Looks good!"}
)

print(result["result"])  # "Executed: Search for: latest AI news"
```

[!NOTE]
When resuming, pass `None` as the input (not a new state) and provide the interrupt response through the config or via `Command`. The graph continues from where it paused.

---

## Using Command for Resume

The `Command` class provides a cleaner way to resume:

```python
from langgraph.types import Command

# Resume with human input using Command
result = app.invoke(
    Command(
        resume={"approved": True, "feedback": "Proceed"},
        update={"status": "human_reviewed"}  # Optional: update state too
    ),
    {"configurable": {"thread_id": "approval-1"}}
)
```

[!TIP]
`Command` lets you both provide the interrupt response and update state simultaneously. Use `update` to add metadata about the human review.

---

## Multiple Interrupt Points

A graph can have multiple interrupt points:

```python
def first_approval(state: State) -> dict:
    response = interrupt({"stage": "plan", "plan": state["plan"]})
    return {"plan_approved": response.get("approved")}

def second_approval(state: State) -> dict:
    response = interrupt({"stage": "execute", "result": state["result"]})
    return {"execution_approved": response.get("approved")}

# Graph: START → plan → first_approval → execute → second_approval → END
```

Each interrupt is resumed independently. The graph knows which interrupt it's paused at.

---

## Dynamic Interrupt Messages

The value passed to `interrupt()` can be any JSON-serializable data:

```python
def review_node(state: State) -> dict:
    context = {
        "type": "approval_request",
        "timestamp": datetime.now().isoformat(),
        "agent_note": state["analysis"],
        "options": [
            {"value": "approve", "label": "Approve and continue"},
            {"value": "modify", "label": "Modify and continue"},
            {"value": "reject", "label": "Reject and stop"}
        ],
        "current_state": {k: v for k, v in state.items() if k != "secrets"}
    }
    response = interrupt(context)
    return {"human_decision": response}
```

---

## Interrupt with Validation

Validate human input before proceeding:

```python
def validated_review(state: State) -> dict:
    while True:
        response = interrupt({"question": "Enter a number between 1 and 10:"})

        try:
            value = int(response.get("value", -1))
            if 1 <= value <= 10:
                return {"user_number": value}
        except (ValueError, TypeError):
            pass

        # Invalid — loop back to interrupt
        # The human will be prompted again
```

[!WARNING]
Be careful with validation loops. Each invalid attempt creates a new checkpoint. Consider limiting retry attempts to prevent frustration.

---

## Complete Example: Content Moderation

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict, Annotated
from typing import List, Any

llm = ChatOpenAI(model="gpt-4o-mini")

class ModerationState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    content: str
    toxicity_score: float
    needs_review: bool
    approved: bool
    moderator_note: str

def analyze_content(state: ModerationState) -> dict:
    response = llm.invoke(f"Rate toxicity (0-1) of: {state['content']}")
    score = float(response.content.strip())
    return {"toxicity_score": score, "needs_review": score > 0.5}

def human_moderation(state: ModerationState) -> dict:
    response = interrupt({
        "content": state["content"],
        "toxicity_score": state["toxicity_score"],
        "prompt": "Approve this content?"
    })
    return {
        "approved": response.get("approved", False),
        "moderator_note": response.get("note", "")
    }

def auto_approve(state: ModerationState) -> dict:
    return {"approved": True, "moderator_note": "Auto-approved (low toxicity)"}

def router(state: ModerationState) -> str:
    if state["needs_review"]:
        return "human"
    return "auto"

builder = StateGraph(ModerationState)
builder.add_node("analyze", analyze_content)
builder.add_node("human_moderation", human_moderation)
builder.add_node("auto_approve", auto_approve)
builder.add_edge(START, "analyze")
builder.add_conditional_edges("analyze", router, {
    "human": "human_moderation",
    "auto": "auto_approve"
})
builder.add_edge("human_moderation", END)
builder.add_edge("auto_approve", END)

app = builder.compile(checkpointer=MemorySaver())
```

---

## Checking for Paused Graphs

```python
# List all threads with their status
# (You need to track thread IDs externally)

# Check if a specific thread is paused
state = app.get_state(config)
is_paused = len(state.next) > 0  # Has pending nodes

if is_paused:
    print(f"Graph is paused at: {state.next}")
    print(f"Interrupt values: {state.tasks}")

    # Resume
    result = app.invoke(
        Command(resume={"approved": True}),
        config
    )
```

---

## Practice Questions

```question
{
  "id": "lg-intermediate-05-q1",
  "type": "multiple-choice",
  "question": "What function pauses graph execution for human input?",
  "options": ["pause()", "interrupt()", "wait()", "human_input()"],
  "correct": 1,
  "explanation": "interrupt() is the LangGraph function that pauses execution and waits for human input."
}
```

```question
{
  "id": "lg-intermediate-05-q2",
  "type": "multiple-choice",
  "question": "What is required for interrupts to work in LangGraph?",
  "options": [
    "A web server",
    "A checkpointer (persistence)",
    "A database connection",
    "Multiple threads"
  ],
  "correct": 1,
  "explanation": "Interrupts require a checkpointer so the graph state can be saved when paused and restored when resumed."
}
```

```question
{
  "id": "lg-intermediate-05-q3",
  "type": "multiple-choice",
  "question": "How do you resume a paused graph?",
  "options": [
    "Call invoke() with the same thread ID and human input",
    "Restart the graph from scratch",
    "Call resume() on the graph",
    "Recompile the graph with new parameters"
  ],
  "correct": 0,
  "explanation": "Resume by calling invoke() with the same thread ID, passing None as input (or Command with resume data)."
}
```

```question
{
  "id": "lg-intermediate-05-q4",
  "type": "multiple-choice",
  "question": "What does the interrupt() function return?",
  "options": [
    "The graph state",
    "The value provided by the human when resuming",
    "The next node to execute",
    "The current checkpoint ID"
  ],
  "correct": 1,
  "explanation": "interrupt() returns the data that was passed as the resume parameter when the graph was resumed."
}
```

```question
{
  "id": "lg-intermediate-05-q5",
  "type": "multiple-choice",
  "question": "What class provides a clean way to resume with both input and state updates?",
  "options": ["Resume", "Command", "Action", "Continue"],
  "correct": 1,
  "explanation": "Command(resume=..., update=...) lets you provide human input and optionally update state simultaneously."
}
```

```question
{
  "id": "lg-intermediate-05-q6",
  "type": "multiple-choice",
  "question": "How do you check if a graph is paused at an interrupt?",
  "options": [
    "Check if state.next is non-empty",
    "Call app.is_paused()",
    "Check the return value of invoke()",
    "Look for a special exception"
  ],
  "correct": 0,
  "explanation": "After an interrupt, state.next contains the nodes waiting to execute. An empty next means the graph completed."
}
```

```question
{
  "id": "lg-intermediate-05-q7",
  "type": "multiple-choice",
  "question": "Can a graph have multiple interrupt points?",
  "options": [
    "No, only one interrupt per graph",
    "Yes, at different nodes in the same graph",
    "Only if they are sequential",
    "No, interrupts must be in separate graphs"
  ],
  "correct": 1,
  "explanation": "A graph can have multiple interrupt points at different nodes. Each is resumed independently."
}
```

```question
{
  "id": "lg-intermediate-05-q8",
  "type": "multiple-choice",
  "question": "What type of data can you pass to interrupt()?",
  "options": [
    "Only strings",
    "Only integers",
    "Any JSON-serializable data",
    "Only dictionaries"
  ],
  "correct": 2,
  "explanation": "interrupt() accepts any JSON-serializable value (dicts, lists, strings, numbers) which is presented to the human."
}
```

```question
{
  "id": "lg-intermediate-05-q9",
  "type": "multiple-choice",
  "question": "What happens if you call invoke() with a new state on a paused thread?",
  "options": [
    "The new state replaces the paused state",
    "The new state is merged with the paused state",
    "An error is thrown — paused threads expect None or Command",
    "The graph restarts from the beginning"
  ],
  "correct": 2,
  "explanation": "When resuming a paused thread, pass None (not state) or Command. Passing new state to a paused thread causes an error."
}
```

```question
{
  "id": "lg-intermediate-05-q10",
  "type": "multiple-choice",
  "question": "What is a common use case for interrupts in LangGraph?",
  "options": [
    "Parallel execution",
    "Approval workflows where a human must review an agent's action",
    "Token counting",
    "Graph visualization"
  ],
  "correct": 1,
  "explanation": "Approval workflows are the most common use case — the agent proposes an action, the human reviews and approves or rejects it."
}
```

---

[!SUCCESS]
### Key Takeaways
- `interrupt()` pauses graph execution and returns human input when resumed
- Interrupts require a checkpointer for saving/restoring state
- Resume with `invoke(None, config)` or `Command(resume=..., update=...)`
- Multiple interrupt points are supported in a single graph
- Pass any JSON-serializable data to interrupt() for the human to review
- Check `state.next` to determine if a graph is paused
- Interrupts enable approval workflows, clarification loops, and human oversight
