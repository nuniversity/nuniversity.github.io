---
title: "Basic Tools"
description: "Learn how to define tools with @tool, bind them to LLMs, and execute tools inside LangGraph nodes."
order: 7
duration: "35 minutes"
difficulty: "beginner"
---

# Basic Tools

Tools give LLMs the ability to interact with the outside world — search the web, run calculations, query databases, and more. This lesson covers defining, binding, and executing tools in LangGraph.

---

## Defining Tools with @tool

LangChain's `@tool` decorator converts a Python function into a tool that LLMs can use:

```python
from langchain_core.tools import tool

@tool
def get_weather(location: str) -> str:
    """Get the current weather for a location."""
    # In production, call a weather API
    return f"The weather in {location} is sunny, 72°F."

@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression. Use Python syntax."""
    try:
        return str(eval(expression, {"__builtins__": {}}, {}))
    except Exception as e:
        return f"Error: {e}"
```

### Tool Structure

Each tool has:

| Component | Description | Source |
| :--- | :--- | :--- |
| **Name** | The function name (e.g., `get_weather`) | Generated from function name |
| **Description** | Docstring explaining when to use it | From `"""docstring"""` |
| **Parameters** | Type-annotated function arguments | From function signature |
| **Body** | The implementation logic | The function code |

[!IMPORTANT]
The **docstring is critical**. The LLM reads it to decide when and how to call the tool. Be descriptive and include examples of when the tool is appropriate.

---

## Tool Binding

Bind tools to an LLM so it knows they exist:

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

# Bind tools to the LLM
llm_with_tools = llm.bind_tools([get_weather, calculator])
```

### How Binding Works

`bind_tools()` sends the tool schemas (name, description, parameters) to the LLM as part of the API call. The LLM can then decide to:

1. **Respond normally** with text if no tool is needed
2. **Request a tool call** by returning a structured `tool_calls` object

```python
# LLM might respond without tool
response = llm_with_tools.invoke("Hello!")
print(response.content)  # "Hi! How can I help you?"

# LLM might request a tool
response = llm_with_tools.invoke("What is 2+2?")
print(response.tool_calls)
# [{'name': 'calculator', 'args': {'expression': '2+2'}, 'id': '...'}]
```

[!NOTE]
The LLM does **not** execute the tool. It only generates a tool call request. Your node function must handle execution.

---

## Checking for Tool Calls

After invoking a tool-enabled LLM, check if it wants to use a tool:

```python
response = llm_with_tools.invoke(messages)

if response.tool_calls:
    # LLM wants to call tools
    for tool_call in response.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]
        print(f"Tool requested: {tool_name}({tool_args})")
else:
    # LLM responded with text
    print(f"Response: {response.content}")
```

### Tool Call Structure

```python
# Each tool_call is a dict with:
{
    "name": "calculator",        # Name of the tool
    "args": {"expression": "2+2"},  # Arguments dict
    "id": "call_abc123",         # Unique call ID
    "type": "tool_call"          # Always "tool_call"
}
```

---

## Tool Execution in a Node

The standard pattern: invoke LLM, check for tool calls, execute tools, return results:

```python
from langchain_core.messages import ToolMessage

class AgentState(TypedDict):
    messages: list
    tool_results: dict

def agent_node(state: AgentState) -> dict:
    # 1. Call LLM with tools
    response = llm_with_tools.invoke(state["messages"])

    # 2. Check if LLM wants to use tools
    if response.tool_calls:
        results = {}
        new_messages = state["messages"] + [response]

        for tool_call in response.tool_calls:
            # 3. Execute the tool
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]

            if tool_name == "calculator":
                result = calculator.invoke(tool_args)
            elif tool_name == "get_weather":
                result = get_weather.invoke(tool_args)
            else:
                result = f"Unknown tool: {tool_name}"

            # 4. Store result
            tool_call_id = tool_call["id"]
            results[tool_call_id] = result

            # 5. Add ToolMessage to conversation
            new_messages.append(
                ToolMessage(content=result, tool_call_id=tool_call_id)
            )

        return {"messages": new_messages, "tool_results": results}

    # 6. No tool calls — return LLM response
    return {"messages": state["messages"] + [response]}
```

[!SUCCESS]
The pattern is: LLM decides → parse tool calls → execute tools → attach results as ToolMessages → continue.

---

## Simplified Tool Execution with ToolExecutor

LangGraph provides `ToolExecutor` for cleaner tool execution:

```python
from langgraph.prebuilt import ToolExecutor

# Create executor from your tools
tools = [get_weather, calculator]
tool_executor = ToolExecutor(tools)

def agent_node(state: AgentState) -> dict:
    response = llm_with_tools.invoke(state["messages"])

    if response.tool_calls:
        new_messages = [response]

        for tool_call in response.tool_calls:
            # ToolExecutor handles routing and invocation
            result = tool_executor.invoke(tool_call)
            new_messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_call["id"])
            )

        return {"messages": state["messages"] + new_messages}

    return {"messages": state["messages"] + [response]}
```

[!TIP]
`ToolExecutor` automatically routes tool calls to the correct function based on the tool name. It handles the mapping dictionary internally.

---

## Complete ReAct Agent with Tools

```python
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolExecutor
from typing_extensions import TypedDict, List, Dict, Any

# 1. Define tools
@tool
def search(query: str) -> str:
    """Search the web. Use for general knowledge questions."""
    return f"Search results for '{query}': LangGraph is a framework..."

@tool
def calculator(expression: str) -> str:
    """Evaluate math expressions. Use for calculations."""
    return str(eval(expression, {"__builtins__": {}}, {}))

# 2. Setup
tools = [search, calculator]
llm = ChatOpenAI(model="gpt-4o")
llm_with_tools = llm.bind_tools(tools)
tool_executor = ToolExecutor(tools)

# 3. State
class AgentState(TypedDict):
    messages: List[Any]

# 4. Node
def agent(state: AgentState) -> dict:
    response = llm_with_tools.invoke(state["messages"])

    if response.tool_calls:
        new_messages = [response]
        for tc in response.tool_calls:
            result = tool_executor.invoke(tc)
            new_messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
        return {"messages": state["messages"] + new_messages}

    return {"messages": state["messages"] + [response]}

# 5. Router
def should_continue(state: AgentState) -> str:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "continue"
    return "end"

# 6. Graph
builder = StateGraph(AgentState)
builder.add_node("agent", agent)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue, {
    "continue": "agent",  # Loop back — tool results feed back to LLM
    "end": END
})

app = builder.compile()

# 7. Run
result = app.invoke({
    "messages": [HumanMessage("What is 15 * 7 and search for LangGraph?")]
})
print(result["messages"][-1].content)
```

[!WARNING]
When the router returns `"continue"`, the graph loops back to the agent node. The agent receives the ToolMessages (tool results) and can decide whether to call more tools or respond. Always set a `recursion_limit` to prevent infinite loops.

---

## Multiple Tool Calls

The LLM can request multiple tool calls in a single response:

```python
# Example: LLM response with two tool calls
response = llm_with_tools.invoke(
    "What's the weather in Paris and calculate 2^10?"
)
print(len(response.tool_calls))  # 2

# Execute all tool calls
for tc in response.tool_calls:
    result = tool_executor.invoke(tc)
    print(f"{tc['name']} → {result}")
```

All tool calls from one LLM response are executed and their results are returned as ToolMessages to the LLM for final processing.

---

## Tool Error Handling

```python
def safe_agent_node(state: AgentState) -> dict:
    try:
        response = llm_with_tools.invoke(state["messages"])
    except Exception as e:
        print(f"LLM call failed: {e}")
        return {"messages": state["messages"] + [
            AIMessage(content=f"I encountered an error: {str(e)}")
        ]}

    if response.tool_calls:
        new_messages = [response]
        for tc in response.tool_calls:
            try:
                result = tool_executor.invoke(tc)
            except Exception as e:
                result = f"Tool execution error: {e}"
            new_messages.append(
                ToolMessage(content=str(result), tool_call_id=tc["id"])
            )
        return {"messages": state["messages"] + new_messages}

    return {"messages": state["messages"] + [response]}
```

[!NOTE]
Always wrap tool execution in try/except. A failing tool should not crash the entire graph. Return an error message as the tool result so the LLM can handle it gracefully.

---

## Tools vs Built-in Functions

| Aspect | @tool Decorator | Plain Function |
| :--- | :--- | :--- |
| Schema generation | Automatic from signature | Manual |
| LLM discoverability | Via bind_tools() | Not visible to LLM |
| Error handling | Can be configured | Manual |
| Use case | LLM needs to call it | Internal node logic |

---

## Practice Questions

```question
{
  "id": "lg-beginner-07-q1",
  "type": "multiple-choice",
  "question": "What does the @tool decorator do?",
  "options": [
    "Converts a function into a LangChain tool with schema metadata",
    "Adds error handling to a function",
    "Makes a function async",
    "Registers a function with LangSmith"
  ],
  "correct": 0,
  "explanation": "@tool converts a Python function into a LangChain Tool with name, description, and parameter schema automatically generated."
}
```

```question
{
  "id": "lg-beginner-07-q2",
  "type": "multiple-choice",
  "question": "What method makes an LLM aware of available tools?",
  "options": ["llm.add_tools()", "llm.bind_tools()", "llm.register_tools()", "llm.attach_tools()"],
  "correct": 1,
  "explanation": "llm.bind_tools([...]) sends tool schemas to the LLM so it can request tool calls in its response."
}
```

```question
{
  "id": "lg-beginner-07-q3",
  "type": "multiple-choice",
  "question": "Does the LLM execute tools directly?",
  "options": [
    "Yes, automatically",
    "No, it only requests tool calls; your code executes them",
    "Only if configured with auto_execute=True",
    "Only for built-in tools"
  ],
  "correct": 1,
  "explanation": "The LLM generates tool call requests. Your node function is responsible for executing the actual tools."
}
```

```question
{
  "id": "lg-beginner-07-q4",
  "type": "multiple-choice",
  "question": "What message type wraps tool execution results for the LLM?",
  "options": ["AIMessage", "HumanMessage", "ToolMessage", "SystemMessage"],
  "correct": 2,
  "explanation": "ToolMessage wraps tool execution results. Its tool_call_id links it to the original tool call request."
}
```

```question
{
  "id": "lg-beginner-07-q5",
  "type": "multiple-choice",
  "question": "What does ToolExecutor do?",
  "options": [
    "Executes Python functions in a sandbox",
    "Routes tool calls to the correct tool function by name",
    "Generates tool schemas for the LLM",
    "Validates tool arguments"
  ],
  "correct": 1,
  "explanation": "ToolExecutor takes a tool_call dict and automatically routes it to the matching tool function based on the name field."
}
```

```question
{
  "id": "lg-beginner-07-q6",
  "type": "multiple-choice",
  "question": "What part of a @tool function is most important for LLM comprehension?",
  "options": [
    "The function name",
    "The docstring",
    "The return type annotation",
    "The import statements"
  ],
  "correct": 1,
  "explanation": "The docstring tells the LLM when and how to use the tool. A clear, descriptive docstring is critical for correct tool selection."
}
```

```question
{
  "id": "lg-beginner-07-q7",
  "type": "multiple-choice",
  "question": "What happens in a ReAct agent loop?",
  "options": [
    "The agent calls one tool and stops",
    "Tool results feed back to the LLM, which can call more tools or respond",
    "The agent ignores tool results",
    "The graph restarts from the beginning"
  ],
  "correct": 1,
  "explanation": "In ReAct, tool results are returned to the LLM as ToolMessages, and the LLM decides whether to call more tools or generate a final response."
}
```

```question
{
  "id": "lg-beginner-07-q8",
  "type": "multiple-choice",
  "question": "How should you handle tool execution errors?",
  "options": [
    "Let them crash the graph",
    "Wrap in try/except and return error message as tool result",
    "Ignore all errors",
    "Retry automatically 10 times"
  ],
  "correct": 1,
  "explanation": "Catch tool errors and return a descriptive error message as the tool result. The LLM can then report or handle the error gracefully."
}
```

```question
{
  "id": "lg-beginner-07-q9",
  "type": "multiple-choice",
  "question": "Can an LLM request multiple tool calls in one response?",
  "options": [
    "No, only one tool per response",
    "Yes, tool_calls can contain multiple requests",
    "Only for certain models",
    "Only if the tools are independent"
  ],
  "correct": 1,
  "explanation": "LLMs can request multiple tool calls in a single response. Each has a unique ID and is executed independently."
}
```

```question
{
  "id": "lg-beginner-07-q10",
  "type": "multiple-choice",
  "question": "What property on the LLM response contains tool call requests?",
  "options": [".content", ".tool_calls", ".response_metadata", ".usage_metadata"],
  "correct": 1,
  "explanation": "response.tool_calls contains a list of tool call dicts with name, args, and id."
}
```

---

[!SUCCESS]
### Key Takeaways
- `@tool` decorates a function with metadata the LLM uses to decide when to call it
- `llm.bind_tools([...])` makes the LLM aware of available tools
- LLMs only request tool calls — your node code executes them
- Tool results go into ToolMessages linked by tool_call_id
- ToolExecutor simplifies routing and execution of multiple tools
- The ReAct pattern loops: LLM → tool calls → execute → ToolMessages → LLM again
- Always handle tool errors with try/except
- A clear docstring is the most important part of a tool definition
