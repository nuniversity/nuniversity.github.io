---
title: "Agentic RAG"
description: "Build Agentic RAG (Retrieval-Augmented Generation) systems with LangGraph — retrieval nodes, document store integration, query planning, and multi-step retrieval."
order: 4
duration: "40 minutes"
difficulty: "advanced"
---

# Agentic RAG

Agentic RAG combines retrieval-augmented generation with agentic decision-making. Instead of a single retrieve-then-generate pipeline, the agent decides **when** and **what** to retrieve, plans queries, and iteratively refines results.

---

## From Simple RAG to Agentic RAG

### Simple RAG (Retrieve → Generate)

```
Query → Embed → Retrieve → LLM → Answer
```

### Agentic RAG

```
Query → Analyze → Plan queries → Retrieve → Evaluate → Need more? → Yes → Refine query → Retrieve
                                                                         ↓ No
                                                                    Generate answer
```

The agent has **tools** for retrieval and makes decisions about how to use them.

---

## Core Components

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.tools import tool
from langchain_core.documents import Document
from langgraph.graph import StateGraph, START, END, add_messages
from typing_extensions import TypedDict, Annotated
from typing import List, Any
from langgraph.prebuilt import ToolExecutor

# Vector store
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(
    collection_name="documents",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
```

---

## Defining Retrieval Tools

```python
@tool
def search_documents(query: str) -> str:
    """Search the knowledge base for relevant documents. Use for factual questions."""
    docs = retriever.invoke(query)
    return "\n\n".join(f"Source: {d.metadata.get('source', 'unknown')}\n{d.page_content}"
                       for d in docs)

@tool
def search_by_metadata(filters: str) -> str:
    """Search documents by metadata. Provide as JSON: {\"source\": \"report_2024.pdf\"}"""
    import json
    filters_dict = json.loads(filters)
    docs = vectorstore.similarity_search("", filter=filters_dict, k=5)
    return "\n\n".join(d.page_content for d in docs)

@tool
def web_search(query: str) -> str:
    """Search the web for current information not in the knowledge base."""
    return f"Web results for: {query}"
```

[!NOTE]
Different retrieval tools serve different needs. `search_documents` for semantic search, `search_by_metadata` for filtered access, and `web_search` as a fallback for current info.

---

## Agent with Retrieval Tools

```python
llm = ChatOpenAI(model="gpt-4o")
tools = [search_documents, search_by_metadata, web_search]
llm_with_tools = llm.bind_tools(tools)
tool_executor = ToolExecutor(tools)

class RAGState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    context: List[str]
    query_plan: List[str]

def agent_node(state: RAGState) -> dict:
    """Decides whether to retrieve or answer."""
    system = """You are an AI research assistant with access to a knowledge base.
    - If you need information, use search_documents or web_search
    - If the user asks for specific sources, use search_by_metadata
    - Once you have sufficient information, answer the question
    - Cite your sources"""
    messages = [SystemMessage(system)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def tool_node(state: RAGState) -> dict:
    """Execute tool calls from the agent."""
    last = state["messages"][-1]
    if not last.tool_calls:
        return {}

    new_messages = []
    for tc in last.tool_calls:
        result = tool_executor.invoke(tc)
        new_messages.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
    return {"messages": new_messages}

def router(state: RAGState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tool"
    return "end"

builder = StateGraph(RAGState)
builder.add_node("agent", agent_node)
builder.add_node("tool", tool_node)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", router, {"tool": "tool", "end": END})
builder.add_edge("tool", "agent")  # Loop back

app = builder.compile()
```

---

## Query Planning

Instead of a single retrieval, plan multiple sub-queries:

```python
def plan_queries(state: RAGState) -> dict:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Break down the user's question into 3-5 specific sub-queries "
                   "that together cover all aspects. Return as a numbered list."),
        ("human", "{question}")
    ])
    chain = prompt | llm | StrOutputParser()
    plan = chain.invoke({"question": state["messages"][-1].content})
    queries = [q.strip() for q in plan.split("\n") if q.strip() and q[0].isdigit()]
    return {"query_plan": queries}
```

[!SUCCESS]
Query planning ensures comprehensive coverage by breaking a broad question into focused sub-queries, each targeting different aspects of the topic.

---

## Multi-Query Retrieval

```python
@tool
def multi_query_search(main_question: str) -> str:
    """Break down a question and search multiple aspects."""
    # Generate sub-queries
    prompt = f"Break this into 3 sub-queries: {main_question}"
    response = llm.invoke(prompt)
    queries = [q.strip() for q in response.content.split("\n")
               if q.strip() and not q.strip().startswith(("-", "1", "2", "3", "4", "5"))]

    # Search each
    all_results = []
    for q in queries[:5]:  # Limit to 5 queries
        docs = retriever.invoke(q)
        for d in docs:
            all_results.append(d)

    # Deduplicate and format
    seen = set()
    unique = []
    for d in all_results:
        if d.page_content[:100] not in seen:
            seen.add(d.page_content[:100])
            unique.append(d)

    return "\n\n---\n\n".join(
        f"[Relevance: {d.metadata.get('score', 'N/A')}]\n{d.page_content}"
        for d in unique[:10]
    )
```

---

## Relevance Scoring

Evaluate if retrieved documents are actually relevant:

```python
def score_relevance(query: str, doc: str) -> float:
    prompt = f"""On a scale of 0.0 to 1.0, how relevant is this document to the query?
Query: {query}
Document: {doc[:500]}

Relevance score (respond with only the number):"""
    response = llm.invoke(prompt)
    try:
        return float(response.content.strip())
    except ValueError:
        return 0.0

def filter_relevant_docs(state: RAGState) -> dict:
    query = state["messages"][-1].content if state["messages"] else ""
    relevant = []
    for doc in state.get("context", []):
        score = score_relevance(query, doc)
        if score > 0.5:
            relevant.append(doc)
    return {"context": relevant}
```

[!WARNING]
Relevance scoring adds an LLM call per document. For large result sets, consider embedding similarity scores as a cheaper proxy.

---

## Complete Agentic RAG System

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.prebuilt import ToolExecutor
from typing_extensions import TypedDict, Annotated
from typing import List, Any

llm = ChatOpenAI(model="gpt-4o")
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

@tool
def retrieve(query: str) -> str:
    """Search the knowledge base."""
    docs = retriever.invoke(query)
    return "\n".join(d.page_content[:500] for d in docs)

tools = [retrieve]
llm_with_tools = llm.bind_tools(tools)
tool_executor = ToolExecutor(tools)

class AgentState(TypedDict):
    messages: Annotated[List[Any], add_messages]

def agent(state: AgentState) -> dict:
    messages = [SystemMessage("Answer using the knowledge base. "
               "Use the retrieve tool if you need information.")] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def tools_node(state: AgentState) -> dict:
    last = state["messages"][-1]
    if not last.tool_calls:
        return {}
    return {"messages": [ToolMessage(
        content=str(tool_executor.invoke(tc)),
        tool_call_id=tc["id"]
    ) for tc in last.tool_calls]}

def router(state: AgentState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "end"

builder = StateGraph(AgentState)
builder.add_node("agent", agent)
builder.add_node("tools", tools_node)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", router, {"tools": "tools", "end": END})
builder.add_edge("tools", "agent")
app = builder.compile(checkpointer=MemorySaver())
```

---

## Practice Questions

```question
{
  "id": "lg-advanced-04-q1",
  "type": "multiple-choice",
  "question": "What distinguishes Agentic RAG from simple RAG?",
  "options": [
    "Agentic RAG uses a larger LLM",
    "The agent decides when and what to retrieve, potentially iterating",
    "Agentic RAG doesn't use vector stores",
    "There is no difference"
  ],
  "correct": 1,
  "explanation": "In Agentic RAG, the agent makes decisions about retrieval — whether to retrieve, what to search for, and whether retrieved results are sufficient."
}
```

```question
{
  "id": "lg-advanced-04-q2",
  "type": "multiple-choice",
  "question": "What pattern does the agentic retrieval loop follow?",
  "options": [
    "Retrieve once, then answer",
    "Agent → Tool → Agent (loop until no tool calls, then answer)",
    "Tool → Tool → Agent",
    "Static pipeline"
  ],
  "correct": 1,
  "explanation": "The agent loops: invoke LLM → if tool calls, execute tools → feed results back to LLM → repeat until LLM responds without tool calls."
}
```

```question
{
  "id": "lg-advanced-04-q3",
  "type": "multiple-choice",
  "question": "What is query planning in Agentic RAG?",
  "options": [
    "Planning the database schema",
    "Breaking a broad question into multiple specific sub-queries for comprehensive retrieval",
    "Planning the response format",
    "Scheduling when to run retrieval"
  ],
  "correct": 1,
  "explanation": "Query planning decomposes a complex question into focused sub-queries, each targeting a different aspect of the topic."
}
```

```question
{
  "id": "lg-advanced-04-q4",
  "type": "multiple-choice",
  "question": "Why might you include a web_search tool alongside a document retriever?",
  "options": [
    "For redundancy",
    "To handle queries about current events not in the knowledge base",
    "Web search is faster",
    "Web search is cheaper"
  ],
  "correct": 1,
  "explanation": "Knowledge bases may not have up-to-date information. A web search tool provides a fallback for current events and real-time data."
}
```

```question
{
  "id": "lg-advanced-04-q5",
  "type": "multiple-choice",
  "question": "What is the purpose of relevance scoring in Agentic RAG?",
  "options": [
    "To rank documents by length",
    "To filter out retrieved documents that don't actually answer the query",
    "To estimate document age",
    "To score grammar quality"
  ],
  "correct": 1,
  "explanation": "Relevance scoring evaluates whether each retrieved document actually addresses the query, filtering out irrelevant results."
}
```

```question
{
  "id": "lg-advanced-04-q6",
  "type": "multiple-choice",
  "question": "What type of search does search_by_metadata enable?",
  "options": [
    "Full-text search",
    "Filtered search based on metadata fields (source, date, author)",
    "Fuzzy search",
    "Phonetic search"
  ],
  "correct": 1,
  "explanation": "search_by_metadata allows filtering by metadata fields like source document, date range, or author category."
}
```

```question
{
  "id": "lg-advanced-04-q7",
  "type": "multiple-choice",
  "question": "What is the trade-off of relevance scoring with LLM?",
  "options": [
    "It's very fast but inaccurate",
    "It's accurate but adds LLM calls (cost and latency) per document",
    "It requires a separate model",
    "It doesn't work with vector stores"
  ],
  "correct": 1,
  "explanation": "LLM-based relevance scoring is high quality but adds significant cost and latency. Embedding similarity scores are cheaper but less accurate."
}
```

```question
{
  "id": "lg-advanced-04-q8",
  "type": "multiple-choice",
  "question": "In the agentic RAG loop, what triggers the agent to answer instead of retrieve?",
  "options": [
    "A fixed number of retrieval steps",
    "The LLM responds without requesting any tool calls",
    "The user explicitly asks for an answer",
    "The retriever returns no results"
  ],
  "correct": 1,
  "explanation": "When the LLM's response has no tool_calls, it means it has enough information to answer. The router then routes to END."
}
```

```question
{
  "id": "lg-advanced-04-q9",
  "type": "multiple-choice",
  "question": "What does the multi_query_search tool do?",
  "options": [
    "Searches multiple vector stores simultaneously",
    "Decomposes a question into sub-queries, searches each, and deduplicates results",
    "Searches the same query multiple times",
    "Translates the query into multiple languages"
  ],
  "correct": 1,
  "explanation": "multi_query_search generates sub-queries, runs retrieval for each, and deduplicates the combined results for comprehensive coverage."
}
```

```question
{
  "id": "lg-advanced-04-q10",
  "type": "multiple-choice",
  "question": "What reducer is used for the messages field in the RAG agent state?",
  "options": ["operator.add", "add_messages", "concat", "merge_chat_messages"],
  "correct": 1,
  "explanation": "add_messages handles message appending and deduplication, which is essential for the ReAct-style agent loop."
}
```

---

[!SUCCESS]
### Key Takeaways
- Agentic RAG gives the agent control over retrieval decisions
- ReAct loop: agent → tool (retrieve) → agent → ... → final answer
- Multiple retrieval tools serve different needs (semantic, metadata, web)
- Query planning decomposes questions into comprehensive sub-queries
- Relevance scoring filters irrelevant retrieved documents
- Tool-based retrieval enables the agent to decide when to search vs. answer
- Multi-query search ensures broad coverage of complex topics
