---
title: "Connecting LLMs to Nodes"
description: "Learn how to integrate LLMs into LangGraph nodes, pass messages between nodes, and build LLM-powered graph applications."
order: 6
duration: "35 minutes"
difficulty: "beginner"
---

# Connecting LLMs to Nodes

LLMs are the brains of your LangGraph agents. This lesson covers how to integrate LLMs into nodes and manage message flow between them.

---

## Basic LLM in a Node

The simplest way to use an LLM in a node:

```python
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

llm = ChatOpenAI(model="gpt-4o")

class State(TypedDict):
    question: str
    answer: str

def answer_node(state: State) -> dict:
    response = llm.invoke(state["question"])
    return {"answer": response.content}

builder = StateGraph(State)
builder.add_node("answer", answer_node)
builder.add_edge(START, "answer")
builder.add_edge("answer", END)
app = builder.compile()

result = app.invoke({"question": "What is LangGraph?", "answer": ""})
print(result["answer"])
```

[!NOTE]
The LLM is instantiated **outside** the node function so it's created once. Instantiating inside the node would create a new LLM client on every invocation, which is wasteful.

---

## Multi-Step LLM Chain Across Nodes

Multiple nodes can each use the LLM, building on previous results:

```python
class ResearchState(TypedDict):
    topic: str
    outline: str
    article: str

def outline_node(state: ResearchState) -> dict:
    response = llm.invoke(
        f"Create a detailed outline for an article about: {state['topic']}"
    )
    return {"outline": response.content}

def write_node(state: ResearchState) -> dict:
    response = llm.invoke(
        f"Write a full article based on this outline:\n{state['outline']}"
    )
    return {"article": response.content}

builder = StateGraph(ResearchState)
builder.add_node("outline", outline_node)
builder.add_node("write", write_node)
builder.add_edge(START, "outline")
builder.add_edge("outline", "write")
builder.add_edge("write", END)
app = builder.compile()
```

[!SUCCESS]
Each LLM call builds on the previous node's output through the shared state. The outline node writes to `state["outline"]`, which the write node reads.

---

## Passing Messages Between Nodes

For conversational agents, use LangChain's message types to pass structured messages between nodes:

```python
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

class ChatState(TypedDict):
    messages: list  # List of BaseMessage objects
    context: str

def system_node(state: ChatState) -> dict:
    """Add system message to the conversation."""
    return {
        "messages": [
            SystemMessage("You are a helpful AI assistant.")
        ] + state["messages"]
    }

def chat_node(state: ChatState) -> dict:
    """Generate AI response to the conversation."""
    response = llm.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}

builder = StateGraph(ChatState)
builder.add_node("system", system_node)
builder.add_node("chat", chat_node)
builder.add_edge(START, "system")
builder.add_edge("system", "chat")
builder.add_edge("chat", END)
app = builder.compile()

result = app.invoke({
    "messages": [HumanMessage("What is LangGraph?")],
    "context": ""
})
```

[!IMPORTANT]
When passing messages between nodes, use `BaseMessage` subclasses (`HumanMessage`, `AIMessage`, `SystemMessage`, `ToolMessage`). They carry metadata that LangChain and LangGraph rely on.

---

## Structured Output from LLM Nodes

Use output parsers to get structured data from LLM responses:

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class Analysis(BaseModel):
    summary: str = Field(description="One-sentence summary")
    sentiment: str = Field(description="positive, negative, or neutral")
    confidence: float = Field(description="Confidence score 0-1")

parser = PydanticOutputParser(pydantic_object=Analysis)

class AnalysisState(TypedDict):
    text: str
    analysis: dict

def analyze_node(state: AnalysisState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Analyze the text. {format_instructions}"),
        ("human", "{text}")
    ]).partial(format_instructions=parser.get_format_instructions())

    chain = prompt | llm | parser
    result = chain.invoke({"text": state["text"]})

    return {"analysis": result.dict()}

app = builder.compile()
result = app.invoke({
    "text": "LangGraph is an amazing framework!",
    "analysis": {}
})
print(result["analysis"])
# {'summary': '...', 'sentiment': 'positive', 'confidence': 0.95}
```

---

## Tool-Calling LLMs

LLMs can call tools. The response includes tool call requests:

```python
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """Search the web for information."""
    return f"Results for: {query}"

@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression."""
    return str(eval(expression))

llm_with_tools = llm.bind_tools([search, calculator])

class ToolState(TypedDict):
    messages: list
    tool_outputs: list

def agent_node(state: ToolState) -> dict:
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}
```

[!WARNING]
When an LLM returns tool calls, you need to execute them in a separate node. The LLM only generates the request — it does not execute the tool. This is covered in detail in Lesson 7.

---

## Streaming LLM Tokens from Nodes

Stream LLM token-by-token from inside a node:

```python
def streaming_node(state: State, config: dict) -> dict:
    full_response = ""
    for chunk in llm.stream(state["question"]):
        full_response += chunk.content
        # Optional: yield intermediate progress
        # (requires custom streaming handler)
    return {"answer": full_response}
```

For real-time token streaming through the graph, use LangGraph's streaming modes (covered in the Intermediate course).

---

## Managing Context Windows

LLMs have context limits. Manage what you send:

```python
def trim_messages(messages: list, max_tokens: int = 4000) -> list:
    """Keep only the most recent messages within token budget."""
    from tiktoken import encoding_for_model

    enc = encoding_for_model("gpt-4o")
    total = 0
    trimmed = []

    for msg in reversed(messages):
        tokens = len(enc.encode(msg.content))
        if total + tokens > max_tokens:
            break
        total += tokens
        trimmed.insert(0, msg)

    return trimmed

def context_aware_node(state: ChatState) -> dict:
    recent = trim_messages(state["messages"])
    response = llm.invoke(recent)
    return {"messages": state["messages"] + [response]}
```

[!TIP]
Always trim messages before sending to the LLM to avoid context window exceeded errors. In production, use token counters from `tiktoken` or similar libraries.

---

## Conditional LLM Routing

Use LLM output to decide which node runs next:

```python
def classifier_node(state: State) -> dict:
    response = llm.invoke(
        f"Classify this query as 'technical', 'billing', or 'general': {state['query']}"
    )
    category = response.content.strip().lower()
    return {"category": category}

def route_by_category(state: State) -> str:
    return state["category"]

builder.add_conditional_edges(
    "classifier",
    route_by_category,
    {
        "technical": "tech_support",
        "billing": "billing_support",
        "general": "general_support"
    }
)
```

---

## Complete Example: LLM-Powered Summarizer

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)

class SummaryState(TypedDict):
    text: str
    summary: str
    keywords: list
    length: int

def summarize_node(state: SummaryState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Summarize the following text in 2-3 sentences."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    summary = chain.invoke({"text": state["text"]})
    return {"summary": summary, "length": len(summary.split())}

def keywords_node(state: SummaryState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract 5 key keywords from this text as a comma-separated list."),
        ("human", "{text}")
    ])
    chain = prompt | llm | StrOutputParser()
    keywords_text = chain.invoke({"text": state["text"]})
    keywords = [k.strip() for k in keywords_text.split(",")]
    return {"keywords": keywords}

# Build graph
builder = StateGraph(SummaryState)
builder.add_node("summarize", summarize_node)
builder.add_node("extract_keywords", keywords_node)
builder.add_edge(START, "summarize")
builder.add_edge("summarize", "extract_keywords")
builder.add_edge("extract_keywords", END)
app = builder.compile()

# Run
result = app.invoke({
    "text": "LangGraph is a framework for building stateful agents...",
    "summary": "",
    "keywords": [],
    "length": 0
})
print(f"Summary ({result['length']} words): {result['summary']}")
print(f"Keywords: {', '.join(result['keywords'])}")
```

---

## Practice Questions

```question
{
  "id": "lg-beginner-06-q1",
  "type": "multiple-choice",
  "question": "Where should you instantiate the LLM for use in LangGraph nodes?",
  "options": [
    "Inside every node function that needs it",
    "Outside the node functions so it's created once",
    "Inside the graph compile() method",
    "LLMs cannot be used with LangGraph"
  ],
  "correct": 1,
  "explanation": "Instantiate the LLM outside node functions for reuse across invocations. Creating it inside a node creates a new client on every call."
}
```

```question
{
  "id": "lg-beginner-06-q2",
  "type": "multiple-choice",
  "question": "What message types should you use when passing conversation history between nodes?",
  "options": [
    "Plain strings",
    "BaseMessage subclasses (HumanMessage, AIMessage, etc.)",
    "JSON dictionaries",
    "Lists of tuples"
  ],
  "correct": 1,
  "explanation": "Use BaseMessage subclasses for proper metadata handling and compatibility with LangChain and LangGraph."
}
```

```question
{
  "id": "lg-beginner-06-q3",
  "type": "multiple-choice",
  "question": "When an LLM returns tool calls, what happens next?",
  "options": [
    "The tool is automatically executed",
    "The node function must execute the tool in a separate step",
    "The LLM handles tool execution internally",
    "Tool calls are ignored by default"
  ],
  "correct": 1,
  "explanation": "The LLM only generates tool call requests. A separate node or logic must execute the actual tool."
}
```

```question
{
  "id": "lg-beginner-06-q4",
  "type": "multiple-choice",
  "question": "What is the purpose of trim_messages() before calling an LLM?",
  "options": [
    "To remove duplicate messages",
    "To stay within the LLM's context window limit",
    "To sort messages by timestamp",
    "To encrypt the messages"
  ],
  "correct": 1,
  "explanation": "trim_messages() keeps the conversation within the LLM's token limit to avoid context window exceeded errors."
}
```

```question
{
  "id": "lg-beginner-06-q5",
  "type": "multiple-choice",
  "question": "How do you get structured output from an LLM node?",
  "options": [
    "Parse the raw string manually",
    "Use an output parser like PydanticOutputParser",
    "Set structured=True on the LLM",
    "LLMs cannot produce structured output"
  ],
  "correct": 1,
  "explanation": "Use output parsers (PydanticOutputParser, JsonOutputParser) to convert LLM text into structured data."
}
```

```question
{
  "id": "lg-beginner-06-q6",
  "type": "multiple-choice",
  "question": "What method do you use to make an LLM aware of available tools?",
  "options": [
    "llm.add_tools([...])",
    "llm.bind_tools([...])",
    "llm.configure_tools([...])",
    "Tools are loaded automatically"
  ],
  "correct": 1,
  "explanation": "llm.bind_tools([tool1, tool2]) registers tool schemas with the LLM so it can request tool calls."
}
```

```question
{
  "id": "lg-beginner-06-q7",
  "type": "multiple-choice",
  "question": "In a multi-step LLM chain, how does one node's output become available to the next?",
  "options": [
    "Through shared state — one node writes to state, another reads it",
    "Via direct function calls between nodes",
    "Through a message queue",
    "It doesn't; each node starts fresh"
  ],
  "correct": 0,
  "explanation": "Nodes share state. One node updates state (e.g., state['outline']), and the next node reads that field."
}
```

```question
{
  "id": "lg-beginner-06-q8",
  "type": "multiple-choice",
  "question": "What is the recommended model for cost-effective LLM calls in LangGraph?",
  "options": [
    "gpt-4o for everything",
    "gpt-4o-mini for simpler tasks, gpt-4o for complex ones",
    "Only open-source models",
    "The most expensive model for best quality"
  ],
  "correct": 1,
  "explanation": "Use gpt-4o-mini for simple/cheap tasks and reserve gpt-4o for complex reasoning. This optimizes cost and performance."
}
```

```question
{
  "id": "lg-beginner-06-q9",
  "type": "multiple-choice",
  "question": "What determines which node runs next after an LLM classifies input?",
  "options": [
    "The LLM's response text mapped through a conditional edge",
    "Random selection",
    "Alphabetical order of node names",
    "The order nodes were added to the graph"
  ],
  "correct": 0,
  "explanation": "The LLM's classification output is read by a routing function, which returns a node name. This is then mapped via add_conditional_edges."
}
```

```question
{
  "id": "lg-beginner-06-q10",
  "type": "multiple-choice",
  "question": "What does llm.invoke() return when called with a list of messages?",
  "options": [
    "A plain string",
    "An AIMessage object",
    "A dictionary of tool calls",
    "A list of tokens"
  ],
  "correct": 1,
  "explanation": "llm.invoke(messages) returns an AIMessage object. Access the text via .content and tool calls via .tool_calls."
}
```

---

[!SUCCESS]
### Key Takeaways
- Instantiate LLMs outside node functions for efficiency
- Use BaseMessage subclasses for passing messages between nodes
- Output parsers give you structured data from LLM responses
- LLMs generate tool call requests; nodes execute the actual tools
- Trim messages to stay within context windows
- Use conditional edges with LLM classification for routing
- Different LLM models can be used in different nodes for cost optimization
- The shared state carries LLM outputs from one node to the next
