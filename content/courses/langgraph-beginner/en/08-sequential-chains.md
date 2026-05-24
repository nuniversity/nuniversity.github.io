---
title: "Sequential Chains"
description: "Learn sequential execution patterns in LangGraph, passing state between nodes, and using state reducers for advanced state management."
order: 8
duration: "35 minutes"
difficulty: "beginner"
---

# Sequential Chains

While LangGraph supports complex graph topologies, many applications are built on simple **sequential chains** — a linear sequence of nodes where each step builds on the previous one.

---

## Sequential Execution in LangGraph

A sequential chain is a linear pipeline: each node runs after the previous one completes, passing state along the way.

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class PipelineState(TypedDict):
    input_text: str
    cleaned: str
    analyzed: str
    result: str

def clean(state: PipelineState) -> dict:
    return {"cleaned": state["input_text"].strip().lower()}

def analyze(state: PipelineState) -> dict:
    analysis = f"Analysis of '{state['cleaned']}': {len(state['cleaned'])} chars"
    return {"analyzed": analysis}

def format(state: PipelineState) -> dict:
    return {"result": f"=== RESULT ===\n{state['analyzed']}\n=== END ==="}

builder = StateGraph(PipelineState)
builder.add_node("clean", clean)
builder.add_node("analyze", analyze)
builder.add_node("format", format)
builder.add_edge(START, "clean")
builder.add_edge("clean", "analyze")
builder.add_edge("analyze", "format")
builder.add_edge("format", END)
app = builder.compile()
```

[!NOTE]
Each node only reads the fields it needs from state and writes the fields it produces. The pipeline topology ensures they run in the correct order.

---

## Passing State Between Nodes

State flows automatically. When node A writes `{"cleaned": value}`, node B can read `state["cleaned"]`. This is the core mechanism for inter-node communication.

```python
def node_a(state: State) -> dict:
    # Writes to state
    return {"intermediate": "Processed by A"}

def node_b(state: State) -> dict:
    # Reads from state (written by node_a)
    intermediate = state["intermediate"]  # "Processed by A"
    return {"result": f"B received: {intermediate}"}
```

### State Flow Rules

| Scenario | Behavior |
| :--- | :--- |
| A writes key X, B reads X | B sees A's value |
| B writes key X after A | A's value is overwritten |
| C writes key Y, D doesn't touch Y | D sees C's value for Y |
| No node writes key Y | Y keeps its initial value |

---

## Sequential Pipeline Example: Document Processor

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict
from typing import List

llm = ChatOpenAI(model="gpt-4o-mini")

class DocState(TypedDict):
    raw_text: str
    cleaned_text: str
    summary: str
    bullet_points: List[str]
    final_doc: str

def clean_text(state: DocState) -> dict:
    cleaned = state["raw_text"].strip()
    # Remove extra whitespace
    import re
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return {"cleaned_text": cleaned}

def summarize(state: DocState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Summarize the following text in 2-3 sentences."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    summary = chain.invoke({"text": state["cleaned_text"]})
    return {"summary": summary}

def extract_bullets(state: DocState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract 5 key points from the text as a numbered list."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    bullets_text = chain.invoke({"text": state["cleaned_text"]})
    bullets = [b.strip() for b in bullets_text.split("\n") if b.strip()]
    return {"bullet_points": bullets}

def format_document(state: DocState) -> dict:
    doc = f"""# Summary
{state['summary']}

# Key Points
{chr(10).join(f'- {b}' for b in state['bullet_points'])}
"""
    return {"final_doc": doc}

builder = StateGraph(DocState)
builder.add_node("clean", clean_text)
builder.add_node("summarize", summarize)
builder.add_node("bullets", extract_bullets)
builder.add_node("format", format_document)

builder.add_edge(START, "clean")
builder.add_edge("clean", "summarize")
builder.add_edge("summarize", "bullets")
builder.add_edge("bullets", "format")
builder.add_edge("format", END)

app = builder.compile()
```

[!SUCCESS]
This is a real-world pipeline: clean → summarize → extract bullets → format. Each step is a separate, testable node.

---

## State Reducers

By default, when a node writes to a state key, it **replaces** the value. State reducers change this behavior.

### The Default Reducer: Replace

```python
def node_a(state: State) -> dict:
    return {"messages": ["Hello"]}    # Replaces messages

def node_b(state: State) -> dict:
    return {"messages": ["World"]}    # Replaces messages (loses "Hello")
```

### The Add Reducer: Append

Use `Annotated` with `add` to append to lists instead of replacing:

```python
from typing import Annotated
from typing_extensions import TypedDict
from operator import add

class AccumState(TypedDict):
    messages: Annotated[list, add]  # Appends instead of replaces
    total: int

def step_1(state: AccumState) -> dict:
    return {"messages": ["Step 1 complete"], "total": 10}

def step_2(state: AccumState) -> dict:
    return {"messages": ["Step 2 complete"], "total": state["total"] + 20}

# Result: messages = ["Step 1 complete", "Step 2 complete"]
# Result: total = 30 (no reducer — last write wins)
```

[!WARNING]
The `add` reducer only works with lists. It uses Python's `+` operator, so both sides must be lists. If you need custom merge logic, define a custom reducer (covered in Intermediate course).

---

## Parallel Sequential: Fan-Out

Sometimes you want sequential processing with parallel branches:

```python
def validate(state: State) -> dict:
    return {"validated": True}

def search_web(state: State) -> dict:
    return {"web_results": "..."}

def search_db(state: State) -> dict:
    return {"db_results": "..."}

def merge(state: State) -> dict:
    combined = f"Web: {state['web_results']}\nDB: {state['db_results']}"
    return {"merged": combined}

builder.add_edge(START, "validate")
builder.add_edge("validate", "search_web")
builder.add_edge("validate", "search_db")  # Runs parallel to search_web
builder.add_edge("search_web", "merge")
builder.add_edge("search_db", "merge")     # Merge waits for both
builder.add_edge("merge", END)
```

[!SUCCESS]
Fan-out with parallel branches, then fan-in to merge results. This pattern combines the power of sequential chains with parallel processing.

---

## Sequential Chain with Conditionals

Inject decision points into your sequential chain:

```python
def check_quality(state: State) -> str:
    if len(state.get("errors", [])) > 0:
        return "fix_errors"
    return "continue"

builder.add_edge(START, "process")
builder.add_edge("process", "validate")
builder.add_conditional_edges("validate", check_quality, {
    "fix_errors": "error_handler",
    "continue": "finalize"
})
builder.add_edge("error_handler", "process")  # Loop back for retry
builder.add_edge("finalize", END)
```

---

## Comparing Sequential Chains: LangChain vs LangGraph

| Aspect | LangChain Chain | LangGraph Sequential |
| :--- | :--- | :--- |
| Definition | `chain = A \| B \| C` | `add_edge(A, B); add_edge(B, C)` |
| State passing | Each output is next input | Shared state object |
| Intermediate access | Lost after chain runs | Available in state |
| Debugging | Hard (pipeline internals) | Easy (per-node streaming) |
| Adding steps | Requires chain rebuild | Just add edge |
| Error recovery | Chain fails entirely | Per-node handling |

---

## State Reducer: Merge for Dicts

```python
from typing import Annotated
from typing_extensions import TypedDict

def merge_dicts(a: dict, b: dict) -> dict:
    """Custom reducer that deep-merges dictionaries."""
    result = a.copy()
    for k, v in b.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = merge_dicts(result[k], v)
        else:
            result[k] = v
    return result

class NestedState(TypedDict):
    metadata: Annotated[dict, merge_dicts]
    logs: Annotated[list, add]

def node_a(state: NestedState) -> dict:
    return {"metadata": {"step": "a", "timestamp": "2024-01-01"}}

def node_b(state: NestedState) -> dict:
    return {"metadata": {"status": "done"}, "logs": ["Step B executed"]}
# Final metadata: {"step": "a", "timestamp": "2024-01-01", "status": "done"}
```

---

## Practice Questions

```question
{
  "id": "lg-beginner-08-q1",
  "type": "multiple-choice",
  "question": "How does state flow in a sequential LangGraph chain?",
  "options": [
    "Each node has its own isolated state",
    "State is shared — each node reads previous writes and adds its own",
    "State is reset between each node",
    "State flows backward from last node to first"
  ],
  "correct": 1,
  "explanation": "All nodes share a single state object. Each node reads values written by previous nodes and writes new values."
}
```

```question
{
  "id": "lg-beginner-08-q2",
  "type": "multiple-choice",
  "question": "What is the default behavior when two nodes write to the same state key?",
  "options": [
    "Values are appended",
    "Values are merged",
    "The last write wins (replaces previous)",
    "An error is thrown"
  ],
  "correct": 2,
  "explanation": "Default state update is replace — the last node to write a key determines its final value."
}
```

```question
{
  "id": "lg-beginner-08-q3",
  "type": "multiple-choice",
  "question": "How do you make a list field append instead of replace?",
  "options": [
    "Use Annotated[list, add] in the state definition",
    "Call list.append() in the node",
    "Set reducer='append' on the field",
    "Lists always append by default"
  ],
  "correct": 0,
  "explanation": "Annotated[list, add] uses the operator.add reducer to append list entries instead of replacing."
}
```

```question
{
  "id": "lg-beginner-08-q4",
  "type": "multiple-choice",
  "question": "What happens when two edges point to the same node (fan-in)?",
  "options": [
    "The node runs twice",
    "The node runs once after both incoming nodes complete",
    "Only the first arriving input is used",
    "An error is thrown"
  ],
  "correct": 1,
  "explanation": "Fan-in: the target node waits for all incoming nodes to complete, then receives the merged state."
}
```

```question
{
  "id": "lg-beginner-08-q5",
  "type": "multiple-choice",
  "question": "In a sequential chain, when does the next node start?",
  "options": [
    "Immediately after the previous node starts",
    "After the previous node completes and returns its updates",
    "After a fixed time delay",
    "When manually triggered"
  ],
  "correct": 1,
  "explanation": "Each node waits for the previous node to complete. Execution is strictly ordered by edges."
}
```

```question
{
  "id": "lg-beginner-08-q6",
  "type": "multiple-choice",
  "question": "What advantage does a LangGraph sequential chain have over a LangChain pipe chain?",
  "options": [
    "LangGraph is faster",
    "Intermediate state is accessible and debuggable between nodes",
    "LangGraph supports more LLMs",
    "There is no advantage"
  ],
  "correct": 1,
  "explanation": "LangGraph keeps all intermediate state between nodes, making it debuggable, inspectable, and recoverable."
}
```

```question
{
  "id": "lg-beginner-08-q7",
  "type": "multiple-choice",
  "question": "If node A writes 'key1' and node B writes 'key2', can node C read both?",
  "options": [
    "Yes, state contains all keys from all nodes",
    "No, each node only sees its own writes",
    "Only if C explicitly requests them",
    "No, state is scoped per-node"
  ],
  "correct": 0,
  "explanation": "State accumulates all keys from all nodes. Node C can read both key1 and key2."
}
```

```question
{
  "id": "lg-beginner-08-q8",
  "type": "multiple-choice",
  "question": "What operator does the 'add' reducer use for lists?",
  "options": ["+ (concatenation)", "append()", "extend()", "merge()"],
  "correct": 0,
  "explanation": "The 'add' reducer uses Python's + operator, so both operands must be lists that get concatenated."
}
```

```question
{
  "id": "lg-beginner-08-q9",
  "type": "multiple-choice",
  "question": "When building a fan-out pattern that fans back in, what node ordering is guaranteed?",
  "options": [
    "All branches run sequentially",
    "All branches run in parallel, merge waits for all to complete",
    "Only the fastest branch is used",
    "Branches run in alphabetical order"
  ],
  "correct": 1,
  "explanation": "Fan-out runs branches in parallel (in separate threads). The fan-in node waits for all branches to complete before executing."
}
```

```question
{
  "id": "lg-beginner-08-q10",
  "type": "multiple-choice",
  "question": "What is the best use case for a sequential chain in LangGraph?",
  "options": [
    "Parallel data processing",
    "Linear pipelines where each step depends on the previous",
    "Complex routing with conditional logic",
    "Multi-agent communication"
  ],
  "correct": 1,
  "explanation": "Sequential chains excel at linear pipelines where step B depends on step A's output, like clean → analyze → format."
}
```

---

[!SUCCESS]
### Key Takeaways
- Sequential chains are linear pipelines: each node runs after the previous one
- State passes automatically between nodes through the shared state object
- Default state update is replace; use Annotated[list, add] for appending
- Fan-out lets you parallelize; fan-in synchronizes parallel branches
- Sequential chains in LangGraph offer better debuggability than LangChain pipe chains
- State reducers control how multiple writes to the same key are combined
- Add conditional routing points to inject decision logic into sequential chains
