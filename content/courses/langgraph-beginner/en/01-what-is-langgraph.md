---
title: "What is LangGraph?"
description: "Understand LangGraph, graph-based agents vs traditional chains, stateful vs stateless execution, and how LangGraph differs from LangChain."
order: 1
duration: "30 minutes"
difficulty: "beginner"
---

# What is LangGraph?

LangGraph is a framework from LangChain for building **stateful, multi-actor applications** using directed graphs as the core abstraction. Each node in the graph modifies a shared state, and edges define the flow of execution.

[!WARNING]
LangGraph is not a workflow DAG tool. Nodes can be revisited, loops can form, and state is preserved across cycles. This is what makes it suitable for agentic systems that need to reason, act, and adapt.

---

## Graph-Based Agents vs Traditional Chains

### Traditional Chains

In traditional LangChain, you build **linear chains** where each step passes its output to the next:

```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

prompt = PromptTemplate.from_template("Tell me about {topic}")
chain = prompt | llm | output_parser
result = chain.invoke({"topic": "AI agents"})
```

Chains are **linear, predictable, and stateless between runs**. Once a chain completes, all intermediate data is lost. There is no concept of loops, branching, or state management.

### Graph-Based Agents

LangGraph replaces the linear chain with a **graph** where:

- **Nodes** are independent functions that can read and write to a shared state
- **Edges** define which node runs next
- **Conditions** can route execution based on the current state
- **Loops** allow agents to iterate until a condition is met

```python
from langgraph.graph import StateGraph
from typing import TypedDict, List

class AgentState(TypedDict):
    messages: List[str]
    agent_decision: str

def analyze(state: AgentState) -> dict:
    decision = decide_next_step(state["messages"])
    return {"agent_decision": decision}

def execute(state: AgentState) -> dict:
    result = perform_action(state["agent_decision"])
    return {"messages": state["messages"] + [result]}

graph = StateGraph(AgentState)
graph.add_node("analyze", analyze)
graph.add_node("execute", execute)
graph.add_edge("analyze", "execute")
graph.set_entry_point("analyze")
graph.set_finish_point("execute")
```

[!SUCCESS]
Graphs give you **loops, branching, persistence, and dynamic routing** — all essential for building autonomous agents.

---

## Stateful vs Stateless Execution

### Stateless Execution

In a stateless system, each invocation is independent. No information persists between calls:

```python
# Stateless — each call starts fresh
response = llm.invoke("What is 2+2?")
response = llm.invoke("Now add 5")  # LLM forgot the previous answer
```

### Stateful Execution

LangGraph maintains a **shared state object** that persists across all nodes in the graph. Each node can read the full state and return updates:

```python
class ConversationState(TypedDict):
    messages: List[str]
    turn_count: int

def chatbot(state: ConversationState) -> dict:
    user_msg = get_user_input()
    new_messages = state["messages"] + [user_msg]
    response = llm.invoke("\n".join(new_messages))
    return {
        "messages": new_messages + [response],
        "turn_count": state["turn_count"] + 1
    }
```

The state flows through every node and is preserved across cycles, enabling **memory, context, and multi-step reasoning**.

[!NOTE]
State in LangGraph is **not** persisted to disk by default. You add persistence via `MemorySaver` or other checkpointers (covered in the Intermediate course).

---

## LangChain vs LangGraph

| Feature | LangChain | LangGraph |
| :--- | :--- | :--- |
| Execution model | Linear chains (DAG) | Cyclic graphs |
| State management | Manual (pass between steps) | Automatic (shared state) |
| Loops | Not supported | First-class support |
| Branching | Sequential only | Conditional, parallel |
| Persistence | Not built-in | Via checkpointers |
| Human-in-the-loop | Not supported | Via `interrupt()` |
| Best for | Simple LLM pipelines | Complex agent workflows |

### When to Use LangChain Alone

- You have a straightforward prompt → LLM → output pipeline
- No looping or conditional logic is needed
- You don't need to persist intermediate state
- Example: summarization, translation, simple Q&A

### When to Use LangGraph

- You need agents that can reason, act, and observe in a loop
- The flow depends on intermediate results (conditional routing)
- You need memory, persistence, or human-in-the-loop
- Example: autonomous coding agents, research assistants, customer support bots

```python
# LangChain: Simple and linear
chain = prompt | llm | parser
result = chain.invoke(input)

# LangGraph: Flexible and stateful
graph = StateGraph(State)
graph.add_node("think", think_node)
graph.add_node("act", act_node)
graph.add_node("observe", observe_node)
graph.add_conditional_edges("think", should_continue, {True: "act", False: END})
graph.add_edge("act", "observe")
graph.add_edge("observe", "think")
app = graph.compile()
result = app.invoke(initial_state)
```

---

## Why Graphs for Agents?

Agents need to perform multi-step reasoning, use tools, interpret results, and decide on the next action. This naturally maps to a **graph structure**:

1. **Think**: The agent analyzes the current state and decides what to do
2. **Act**: The agent executes a tool call or generates a response
3. **Observe**: The agent processes the tool output
4. **Loop**: The agent repeats until the task is complete

```
Input → [Think] → decide → [Act] → [Observe] → decide → [Think] → ...
                         ↑                      |
                         └── continue ──────────┘
                             [Stop] → Output
```

This loop is the foundation of every ReAct agent. LangGraph makes it trivial to implement.

[!IMPORTANT]
The ReAct pattern (Reason + Act) is the most common agent architecture. LangGraph's graph structure is the ideal way to implement it — each turn of the loop is a node execution.

---

## Core Primitives

LangGraph has five core primitives:

| Primitive | Description | Example |
| :--- | :--- | :--- |
| `StateGraph` | The graph builder class | `StateGraph(AgentState)` |
| `State` | A typed dictionary shared across nodes | `class AgentState(TypedDict)` |
| `Node` | A Python function that mutates state | `def my_node(state) -> dict` |
| `Edge` | A connection between nodes | `graph.add_edge("a", "b")` |
| `Condition` | A routing function for conditional edges | `lambda s: "b" if s["done"] else "c"` |

---

## Installation

```bash
pip install langgraph langchain-openai
```

[!NOTE]
LangGraph requires Python 3.9+. It is compatible with all LangChain integrations (LLMs, vector stores, tools, etc.).

Minimal setup for a first graph:

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

class MyState(TypedDict):
    value: str

def echo(state: MyState) -> dict:
    return {"value": f"Echo: {state['value']}"}

builder = StateGraph(MyState)
builder.add_node("echo", echo)
builder.add_edge(START, "echo")
builder.add_edge("echo", END)
app = builder.compile()

result = app.invoke({"value": "hello"})
print(result["value"])  # Echo: hello
```

---

## Real-World Use Cases

### Customer Support Agent
A graph routes customer queries through intent classification, knowledge base search, ticket creation, and escalation to humans.

### Code Generation Agent
An agent that writes code, runs tests, reads error output, and iteratively fixes bugs — all within a single graph with a loop.

### Research Assistant
A multi-step agent that searches the web, summarizes findings, generates reports, and asks clarifying questions when needed.

### Data Pipeline Orchestrator
A graph that ingests data, validates it, transforms it, loads it into a database, and sends notifications — with error handling at every step.

[!SUCCESS]
LangGraph transforms complex agent logic from spaghetti code into a clean, visual, and debuggable graph structure.

---

## Practice Questions

```question
{
  "id": "lg-beginner-01-q1",
  "type": "multiple-choice",
  "question": "What is the main difference between LangChain chains and LangGraph graphs?",
  "options": [
    "LangGraph supports loops and conditional branching, LangChain chains are linear",
    "LangChain is faster than LangGraph",
    "LangGraph only works with OpenAI, LangChain works with any LLM",
    "There is no difference, they are the same thing"
  ],
  "correct": 0,
  "explanation": "LangGraph uses cyclic directed graphs with shared state, enabling loops, branching, and persistence. LangChain chains are linear and stateless between steps."
}
```

```question
{
  "id": "lg-beginner-01-q2",
  "type": "multiple-choice",
  "question": "What does a LangGraph node function receive and return?",
  "options": [
    "Receives the full state dict, returns a partial update dict",
    "Receives a string, returns a string",
    "Receives only the new input, returns nothing",
    "Receives nothing, mutates a global variable"
  ],
  "correct": 0,
  "explanation": "Each node receives the complete shared state dictionary and returns a partial dictionary of updates that get merged into the state."
}
```

```question
{
  "id": "lg-beginner-01-q3",
  "type": "multiple-choice",
  "question": "Which LangGraph class should you use for building stateful agents?",
  "options": ["Graph", "StateGraph", "AgentGraph", "WorkflowGraph"],
  "correct": 1,
  "explanation": "StateGraph is the recommended class for stateful graphs with typed state, checkpointing, and production features."
}
```

```question
{
  "id": "lg-beginner-01-q4",
  "type": "multiple-choice",
  "question": "What is the ReAct pattern?",
  "options": [
    "A React.js component for building UIs",
    "Reason + Act: an agent loop where the agent thinks, acts, and observes",
    "A database query optimization technique",
    "A deployment strategy for LangGraph"
  ],
  "correct": 1,
  "explanation": "ReAct (Reason + Act) is the standard agent architecture where the agent iteratively reasons about the task, takes actions, and observes results."
}
```

```question
{
  "id": "lg-beginner-01-q5",
  "type": "multiple-choice",
  "question": "LangGraph is best suited for which type of application?",
  "options": [
    "Simple prompt → LLM → output pipelines",
    "Complex agent workflows with loops, state, and conditional routing",
    "Static website generation",
    "Real-time video processing"
  ],
  "correct": 1,
  "explanation": "LangGraph excels at complex agent workflows that require state management, loops, conditional branching, and human-in-the-loop interaction."
}
```

```question
{
  "id": "lg-beginner-01-q6",
  "type": "multiple-choice",
  "question": "What command installs LangGraph?",
  "options": [
    "pip install langchain",
    "pip install langgraph",
    "npm install langgraph",
    "pip install langgraph-agent"
  ],
  "correct": 1,
  "explanation": "LangGraph is installed via `pip install langgraph`. It integrates with LangChain but is a separate package."
}
```

```question
{
  "id": "lg-beginner-01-q7",
  "type": "multiple-choice",
  "question": "Which of the following is NOT a feature of LangGraph?",
  "options": [
    "Conditional edge routing",
    "Shared state across nodes",
    "Built-in web server for deployment",
    "Support for cyclic graphs"
  ],
  "correct": 2,
  "explanation": "LangGraph does not include a built-in web server. Deployment is handled separately via LangGraph Platform or custom serving infrastructure."
}
```

```question
{
  "id": "lg-beginner-01-q8",
  "type": "multiple-choice",
  "question": "How does state flow in a LangGraph application?",
  "options": [
    "Each node has its own private state",
    "State is shared across all nodes and updated as nodes return dicts",
    "State is passed via a global variable",
    "State is stored in a database and fetched every time"
  ],
  "correct": 1,
  "explanation": "All nodes in the graph share a single state object. Each node receives the full state and returns partial updates that get merged."
}
```

```question
{
  "id": "lg-beginner-01-q9",
  "type": "multiple-choice",
  "question": "What makes LangGraph suitable for building autonomous agents?",
  "options": [
    "It has a built-in neural network",
    "It supports loops, state management, and conditional routing",
    "It automatically deploys to production",
    "It replaces the need for an LLM"
  ],
  "correct": 1,
  "explanation": "Autonomous agents need to loop (think-act-observe), maintain state across iterations, and make decisions — all of which LangGraph supports natively."
}
```

```question
{
  "id": "lg-beginner-01-q10",
  "type": "multiple-choice",
  "question": "What does the compile() method do in LangGraph?",
  "options": [
    "Deploys the graph to a server",
    "Freezes the graph definition into a runnable object",
    "Compiles Python code into machine code",
    "Converts the graph into a LangChain chain"
  ],
  "correct": 1,
  "explanation": "compile() transforms the StateGraph builder into a CompiledGraph that can be invoked, streamed, and checkpointed."
}
```

---

[!SUCCESS]
### Key Takeaways
- LangGraph uses directed graphs with shared state for building agents
- Graphs support loops, conditional branching, and persistence — unlike linear chains
- State flows through all nodes; each node receives full state and returns partial updates
- StateGraph is the primary class for building LangGraph applications
- The ReAct pattern (reason → act → observe → loop) is a natural fit for graphs
- LangGraph is installed via `pip install langgraph` and integrates with all LangChain components
