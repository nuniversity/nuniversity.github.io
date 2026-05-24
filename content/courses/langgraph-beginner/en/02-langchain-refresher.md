---
title: "LangChain Refresher"
description: "Quick refresher on LangChain fundamentals: LLMs, prompts, chains, output parsers, and how they integrate with LangGraph."
order: 2
duration: "30 minutes"
difficulty: "beginner"
---

# LangChain Refresher

LangGraph is built on top of LangChain. Before diving deeper into graphs, let's review the core LangChain components you'll use in every LangGraph application.

---

## LLMs (Language Models)

LangChain provides a unified interface for hundreds of LLMs from OpenAI, Anthropic, Google, Cohere, Hugging Face, and more.

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
response = llm.invoke("What is the capital of France?")
print(response.content)  # The capital of France is Paris.
```

### Key LLM Parameters

| Parameter | Description | Typical Range |
| :--- | :--- | :--- |
| `model` | Model identifier | `"gpt-4o"`, `"claude-3-opus"` |
| `temperature` | Randomness of output | 0.0 (deterministic) to 2.0 (creative) |
| `max_tokens` | Maximum output length | 128 to 4096+ |
| `top_p` | Nucleus sampling threshold | 0.0 to 1.0 |
| `timeout` | Request timeout | 10 to 60 seconds |

[!NOTE]
Chat models use `invoke()` with messages, not strings. The base LLM class uses strings directly. For LangGraph agents, you'll almost always use `ChatOpenAI` or similar chat models.

```python
from langchain_core.messages import HumanMessage, SystemMessage

messages = [
    SystemMessage("You are a helpful assistant."),
    HumanMessage("What is LangGraph?")
]
response = llm.invoke(messages)
```

---

## Prompts

Prompts are templates that structure the input to an LLM. LangChain's `ChatPromptTemplate` is the standard approach.

```python
from langchain.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert in {topic}."),
    ("human", "Answer this question: {question}")
])

formatted = prompt.format(topic="Python", question="What is a decorator?")
```

### Prompt with Few-Shot Examples

```python
examples = [
    ("human", "What is 2+2?"),
    ("assistant", "4"),
    ("human", "What is 5+3?"),
    ("assistant", "8"),
]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a math tutor. Answer concisely."),
    *examples,
    ("human", "{question}")
])
```

[!TIP]
In LangGraph, you typically put prompt construction **inside a node function** rather than chaining it externally. This keeps the prompt logic close to where it's used.

---

## Chains

Chains connect components together. The modern approach uses the **pipe operator (`|`)**:

```python
from langchain_core.output_parsers import StrOutputParser

# Chain: prompt → LLM → string output
chain = prompt | llm | StrOutputParser()
result = chain.invoke({
    "topic": "AI",
    "question": "What is an agent?"
})
```

### RunnablePassthrough for Intermediate Values

```python
from langchain_core.runnables import RunnablePassthrough

chain = {
    "response": prompt | llm | StrOutputParser(),
    "original_question": RunnablePassthrough()
} | RunnablePassthrough()

result = chain.invoke({"topic": "AI", "question": "What is RAG?"})
print(result["response"])
print(result["original_question"])
```

[!WARNING]
In LangGraph, you should not use the pipe operator to build large chains. Instead, put chain logic inside node functions. This gives you better control over state updates and error handling.

---

## Output Parsers

Output parsers transform LLM text output into structured formats.

### StrOutputParser

The simplest parser — converts LLM output to a plain string:

```python
from langchain_core.output_parsers import StrOutputParser

parser = StrOutputParser()
chain = prompt | llm | StrOutputParser()
result = chain.invoke({"topic": "AI", "question": "Hi"})
# result is a plain string
```

### PydanticOutputParser

Parses JSON output into a Pydantic model:

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class Recipe(BaseModel):
    name: str = Field(description="Recipe name")
    ingredients: list[str] = Field(description="List of ingredients")
    steps: list[str] = Field(description="Cooking steps")
    cook_time_minutes: int = Field(description="Total cooking time")

parser = PydanticOutputParser(pydantic_object=Recipe)

prompt = ChatPromptTemplate.from_messages([
    ("system", "Extract recipe info. {format_instructions}"),
    ("human", "{input_text}")
]).partial(format_instructions=parser.get_format_instructions())

chain = prompt | llm | parser
recipe = chain.invoke({"input_text": "To make pasta, boil water..."})
print(recipe.name, recipe.cook_time_minutes)
```

### JsonOutputParser

For simpler cases where you don't need full Pydantic validation:

```python
from langchain_core.output_parsers import JsonOutputParser

chain = prompt | llm | JsonOutputParser()
result = chain.invoke({"input_text": "Extract name and age from: John is 30"})
# result is a dict: {"name": "John", "age": 30}
```

[!SUCCESS]
Output parsers are essential in LangGraph for converting LLM responses into structured state updates that downstream nodes can process reliably.

---

## How LangChain Components Fit into LangGraph

In LangGraph, LangChain components become **building blocks inside nodes**:

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict, List
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage

llm = ChatOpenAI(model="gpt-4o")

class AgentState(TypedDict):
    messages: List[dict]
    response: str

def generate_response(state: AgentState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant."),
        ("human", "{input}")
    ])

    chain = prompt | llm | StrOutputParser()
    response = chain.invoke({"input": state["messages"][-1]["content"]})

    return {"response": response}

# Graph construction
builder = StateGraph(AgentState)
builder.add_node("generate", generate_response)
builder.add_edge(START, "generate")
builder.add_edge("generate", END)
app = builder.compile()
```

[!IMPORTANT]
LangChain components work **inside** LangGraph nodes, not as replacements for nodes. Each node is a function that uses LangChain tools internally to process state and return updates.

---

## Key Differences When Using LangChain in LangGraph

| Aspect | Pure LangChain | LangGraph with LangChain |
| :--- | :--- | :--- |
| Flow control | Pipe operators (`\|`) | Graph edges and conditions |
| State management | Passed through chain | Shared State object |
| Looping | Not possible | Add edge back to earlier node |
| Tool use | Via ToolChain | Inside node functions |
| Error handling | Chain breaks on error | Per-node try/except |

---

## RunnableConfig in LangGraph

You can pass configuration through LangChain's `RunnableConfig` when invoking nodes:

```python
from langchain_core.runnables import RunnableConfig

def configurable_node(state: AgentState, config: RunnableConfig) -> dict:
    # Access configurable parameters
    model_name = config.get("configurable", {}).get("model", "gpt-4o")
    temperature = config.get("configurable", {}).get("temperature", 0.7)

    llm = ChatOpenAI(model=model_name, temperature=temperature)
    response = llm.invoke(state["messages"])
    return {"response": response.content}

# Pass config during invocation
app.invoke(
    {"messages": [HumanMessage("Hello")]},
    config={"configurable": {"model": "gpt-3.5-turbo", "temperature": 0.0}}
)
```

[!NOTE]
The `config` parameter in node functions is optional. Only add it when you need runtime configuration like model selection or user-specific settings.

---

## Common Patterns for LangGraph Nodes

### Direct LLM Call
```python
def node(state: State) -> dict:
    response = llm.invoke(state["input"])
    return {"output": response.content}
```

### Prompt + LLM + Parser
```python
def node(state: State) -> dict:
    chain = prompt | llm | parser
    result = chain.invoke({"input": state["input"]})
    return {"structured_output": result}
```

### Tool-Enabled LLM
```python
def node(state: State) -> dict:
    llm_with_tools = llm.bind_tools([search_tool, calculator_tool])
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}
```

---

## Practice Questions

```question
{
  "id": "lg-beginner-02-q1",
  "type": "multiple-choice",
  "question": "Which LangChain component is used to convert LLM text output into a Pydantic model?",
  "options": ["StrOutputParser", "PydanticOutputParser", "JsonOutputParser", "ListOutputParser"],
  "correct": 1,
  "explanation": "PydanticOutputParser parses LLM output into a Pydantic BaseModel with full validation."
}
```

```question
{
  "id": "lg-beginner-02-q2",
  "type": "multiple-choice",
  "question": "How do LangChain components integrate with LangGraph?",
  "options": [
    "They replace LangGraph nodes entirely",
    "They are used inside node functions to process state",
    "They cannot be used together",
    "LangGraph rewrites LangChain internally"
  ],
  "correct": 1,
  "explanation": "LangChain components like prompts, LLMs, and parsers are used inside node functions. Each node can use any LangChain tool internally."
}
```

```question
{
  "id": "lg-beginner-02-q3",
  "type": "multiple-choice",
  "question": "What does the pipe operator (|) do in LangChain?",
  "options": [
    "Creates a parallel execution branch",
    "Chains components together (output of one becomes input of next)",
    "Defines a conditional route",
    "Merges two chains into one"
  ],
  "correct": 1,
  "explanation": "The pipe operator chains LangChain components. The output of the left component becomes the input of the right component."
}
```

```question
{
  "id": "lg-beginner-02-q4",
  "type": "multiple-choice",
  "question": "What is the purpose of the SystemMessage in LangChain?",
  "options": [
    "To send error logs to the console",
    "To set the behavior and context for the LLM",
    "To store user credentials",
    "To format the output as JSON"
  ],
  "correct": 1,
  "explanation": "SystemMessage sets the system prompt that defines the LLM's behavior, role, and constraints."
}
```

```question
{
  "id": "lg-beginner-02-q5",
  "type": "multiple-choice",
  "question": "Which parameter controls the randomness of LLM output?",
  "options": ["max_tokens", "temperature", "top_p", "frequency_penalty"],
  "correct": 1,
  "explanation": "Temperature controls randomness. Lower values (0.0-0.3) produce deterministic output; higher values (0.7-2.0) produce more creative output."
}
```

```question
{
  "id": "lg-beginner-02-q6",
  "type": "multiple-choice",
  "question": "How do you pass runtime configuration like model selection to a LangGraph node?",
  "options": [
    "Via environment variables",
    "Via the config parameter in node functions",
    "By recompiling the graph",
    "Configuration cannot be changed at runtime"
  ],
  "correct": 1,
  "explanation": "Nodes can accept a config parameter (RunnableConfig) that allows passing runtime settings like model name and temperature."
}
```

```question
{
  "id": "lg-beginner-02-q7",
  "type": "multiple-choice",
  "question": "What is the output type of ChatOpenAI.invoke()?",
  "options": ["A string", "An AIMessage object", "A dictionary", "A list of tokens"],
  "correct": 1,
  "explanation": "ChatOpenAI.invoke() returns an AIMessage object. Access the text via .content property."
}
```

```question
{
  "id": "lg-beginner-02-q8",
  "type": "multiple-choice",
  "question": "What does StrOutputParser do?",
  "options": [
    "Converts LLM output to uppercase",
    "Extracts the string content from an LLM response",
    "Parses JSON into a string",
    "Splits output into a list of strings"
  ],
  "correct": 1,
  "explanation": "StrOutputParser extracts the .content from AIMessage and returns it as a plain string."
}
```

```question
{
  "id": "lg-beginner-02-q9",
  "type": "multiple-choice",
  "question": "Which of the following is NOT a LangChain component commonly used inside LangGraph nodes?",
  "options": ["ChatPromptTemplate", "ChatOpenAI", "Flask web server", "StrOutputParser"],
  "correct": 2,
  "explanation": "Flask is a web framework, not a LangChain component. Prompts, LLMs, and parsers are the components used inside nodes."
}
```

```question
{
  "id": "lg-beginner-02-q10",
  "type": "multiple-choice",
  "question": "How should you build prompt chains in LangGraph?",
  "options": [
    "Use the pipe operator to chain everything outside the graph",
    "Build prompt chains inside node functions for better state control",
    "Prompts are not needed in LangGraph",
    "Use LangChain Expression Language only"
  ],
  "correct": 1,
  "explanation": "In LangGraph, you build prompt chains inside node functions. This gives you direct access to state and allows per-node error handling."
}
```

---

[!SUCCESS]
### Key Takeaways
- LangChain provides LLMs, prompts, chains, and parsers used inside LangGraph nodes
- ChatOpenAI is the standard LLM class; use .invoke() with message lists
- Output parsers (StrOutputParser, PydanticOutputParser) convert LLM text to structured data
- In LangGraph, LangChain components go inside node functions, not outside the graph
- The config parameter allows runtime configuration of LLM parameters
- Avoid the pipe operator for large chains inside LangGraph — prefer explicit function calls
