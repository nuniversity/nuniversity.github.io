---
title: "Capstone: Production-Grade Customer Support Agent"
description: "Build a production-grade customer support agent with multi-agent routing, RAG, human handoff, and monitoring — integrating everything from the Advanced course."
order: 10
duration: "50 minutes"
difficulty: "advanced"
---

# Capstone: Production-Grade Customer Support Agent

This capstone project integrates everything from the Advanced course: hierarchical agents, RAG, SQL agents, interrupts, streaming, LangSmith monitoring, and deployment. The result is a production-ready customer support system.

---

## System Architecture

```
Customer Query
    ↓
┌─────────────────────────────────────────────┐
│              Router Agent                    │
│  Classifies intent, routes to specialist     │
└────┬─────────┬──────────┬───────────────────┘
     ↓         ↓          ↓
┌─────────┐ ┌────────┐ ┌──────────┐
│  FAQ     │ │  RAG   │ │  SQL     │
│  Agent   │ │ Agent  │ │  Agent   │
└────┬─────┘ └───┬────┘ └────┬─────┘
     ↓          ↓           ↓
┌─────────────────────────────────────────────┐
│              Escalation Check                │
│  → Human agent if confidence < threshold     │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│           Quality Review                     │
│  → LangSmith tracing + evaluation            │
└─────────────────────────────────────────────┘
    ↓
    Response
```

---

## Step 1: State and Configuration

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.types import interrupt, Command
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, ToolMessage, HumanMessage
from langgraph.prebuilt import ToolExecutor
from typing_extensions import TypedDict, Annotated
from typing import List, Any, Optional
from operator import add
from datetime import datetime
import os

# Environment setup
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "customer-support-prod"

# Configuration
class Config:
    # Models
    ROUTER_MODEL = "gpt-4o-mini"
    SPECIALIST_MODEL = "gpt-4o"
    REVIEWER_MODEL = "gpt-4o-mini"

    # RAG
    VECTOR_STORE_PATH = "./customer_kb"
    RETRIEVAL_K = 5

    # Limits
    MAX_RETRIES = 3
    CONFIDENCE_THRESHOLD = 0.7
    MAX_TOKENS = 8000

# LLMs
router_llm = ChatOpenAI(model=Config.ROUTER_MODEL, temperature=0.0)
specialist_llm = ChatOpenAI(model=Config.SPECIALIST_MODEL, temperature=0.3)
reviewer_llm = ChatOpenAI(model=Config.REVIEWER_MODEL, temperature=0.0)
```

---

## Step 2: State Definition

```python
class CustomerState(TypedDict):
    # Core
    messages: Annotated[List[Any], add_messages]
    customer_id: str
    query: str

    # Routing
    intent: str                      # "faq", "knowledge_base", "data_query", "escalate"
    confidence: float

    # Specialists
    faq_answer: str
    rag_results: List[str]
    sql_result: str

    # Escalation
    needs_human: bool
    human_resolved: bool
    human_notes: str

    # Quality
    review_score: float
    reviewed: bool

    # Operations
    status: str
    retries: int
    errors: Annotated[List[str], add]
    token_usage: Annotated[List[int], add]
    start_time: str
```

---

## Step 3: Router Agent

```python
def router_agent(state: CustomerState) -> dict:
    prompt = f"""Classify this customer support query:

Query: {state['query']}

Categories:
- 'faq': Simple questions about policies, hours, shipping
- 'knowledge_base': Questions needing detailed product/service info
- 'data_query': Questions requiring looking up customer data
- 'escalate': Angry, complex, or queries the agent cannot handle

Respond with JSON: {{"intent": "category", "confidence": 0.0-1.0}}"""

    response = router_llm.invoke(prompt)
    import json
    try:
        result = json.loads(response.content)
        return {
            "intent": result.get("intent", "faq"),
            "confidence": result.get("confidence", 0.5),
            "status": "routed"
        }
    except (json.JSONDecodeError, KeyError):
        return {"intent": "faq", "confidence": 0.5, "status": "routed"}
```

---

## Step 4: Specialist Agents

### FAQ Agent

```python
def faq_agent(state: CustomerState) -> dict:
    prompt = f"""You are a customer support FAQ agent. Answer concisely.

Common FAQs:
- Shipping: Free shipping on orders over $50, 5-7 business days
- Returns: 30-day return policy, items must be unused
- Hours: Monday-Friday 9AM-6PM EST

Query: {state['query']}

Provide a helpful, concise answer based on these policies."""

    answer = specialist_llm.invoke(prompt).content
    return {"faq_answer": answer, "status": "faq_answered"}
```

### RAG Agent (Knowledge Base)

```python
# Initialize vector store
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(
    collection_name="support_kb",
    embedding_function=embeddings,
    persist_directory=Config.VECTOR_STORE_PATH
)
retriever = vectorstore.as_retriever(search_kwargs={"k": Config.RETRIEVAL_K})

@tool
def search_knowledge_base(query: str) -> str:
    """Search the customer support knowledge base."""
    docs = retriever.invoke(query)
    return "\n\n".join(f"[{d.metadata.get('source', 'KB')}]: {d.page_content}" for d in docs)

rag_tools = [search_knowledge_base]
rag_llm = specialist_llm.bind_tools(rag_tools)
rag_executor = ToolExecutor(rag_tools)

def rag_agent(state: CustomerState) -> dict:
    system = """You are a support specialist with access to the knowledge base.
    Search for relevant information, then provide a detailed answer with citations."""
    messages = [SystemMessage(system), HumanMessage(state["query"])]
    response = rag_llm.invoke(messages)

    if response.tool_calls:
        results = []
        for tc in response.tool_calls:
            result = rag_executor.invoke(tc)
            results.append(str(result))

        # Generate final answer with context
        context = "\n".join(results)
        final = specialist_llm.invoke(
            f"Context:\n{context}\n\nAnswer the query: {state['query']}"
        )
        return {"rag_results": results, "messages": [HumanMessage(state["query"]), response, final],
                "status": "rag_answered"}

    return {"rag_results": [response.content], "status": "rag_answered"}
```

### SQL Agent (Customer Data)

```python
from sqlalchemy import create_engine, text

# Read-only database connection
DB_URL = os.getenv("CUSTOMER_DB_URL", "postgresql://readonly:pass@localhost:5432/support")
db_engine = create_engine(DB_URL)

@tool
def query_customer_data(sql: str) -> str:
    """Execute a read-only SQL query for customer data."""
    try:
        with db_engine.connect() as conn:
            result = conn.execute(text(sql))
            rows = result.fetchmany(10)
            return "\n".join(str(row) for row in rows)
    except Exception as e:
        return f"Query error: {e}"

sql_tools = [query_customer_data]
sql_llm = specialist_llm.bind_tools(sql_tools)
sql_executor = ToolExecutor(sql_tools)

def sql_agent(state: CustomerState) -> dict:
    schema_prompt = specialist_llm.invoke(
        "Get the database table names and columns"
    )
    schema = schema_prompt.content

    messages = [
        SystemMessage(f"Database schema:\n{schema}\n\n"
                      "Convert the customer's question to a SQL query. "
                      "Use only SELECT statements. Show results clearly."),
        HumanMessage(state["query"])
    ]
    response = sql_llm.invoke(messages)

    if response.tool_calls:
        for tc in response.tool_calls:
            result = sql_executor.invoke(tc)
            return {"sql_result": str(result), "status": "sql_answered"}

    return {"sql_result": response.content, "status": "sql_answered"}
```

---

## Step 5: Escalation and Human Handoff

```python
def escalation_check(state: CustomerState) -> dict:
    needs_human = (
        state["confidence"] < Config.CONFIDENCE_THRESHOLD
        or state.get("intent") == "escalate"
        or state.get("retries", 0) >= Config.MAX_RETRIES
    )
    return {"needs_human": needs_human, "status": "checked"}

def human_handoff(state: CustomerState) -> dict:
    # Get context for the human agent
    context = f"""
Customer ID: {state['customer_id']}
Query: {state['query']}
Intent: {state.get('intent', 'unknown')}
Agent Confidence: {state.get('confidence', 0)}
Attempts: {state.get('retries', 0)}
Errors: {state.get('errors', [])}
"""
    response = interrupt({
        "type": "human_handoff",
        "context": context,
        "prompt": "Please handle this escalated ticket."
    })

    return {
        "human_resolved": response.get("resolved", True),
        "human_notes": response.get("notes", ""),
        "status": "human_handled"
    }
```

[!NOTE]
The human handoff uses interrupt() to pause and wait for a human agent to take over. The human's response (resolved + notes) is captured in state.

---

## Step 6: Quality Review

```python
def quality_review(state: CustomerState) -> dict:
    answer = (state.get("faq_answer") or state.get("sql_result") or
              (state.get("rag_results") or [""])[-1])
    if not answer:
        answer = state["messages"][-1].content if state["messages"] else ""

    prompt = f"""Review this customer support interaction:

Query: {state['query']}
Answer: {answer[:500]}
Confidence: {state.get('confidence', 0)}

Rate 0-10 on:
1. Did the answer address the query?
2. Was it accurate based on available info?
3. Was the tone appropriate?

Return JSON: {{"score": 0-10, "issues": ["issue1"], "suggestions": ["suggestion1"]}}"""

    review = reviewer_llm.invoke(prompt)
    import json
    try:
        result = json.loads(review.content)
        return {"review_score": result.get("score", 5), "reviewed": True, "status": "reviewed"}
    except json.JSONDecodeError:
        return {"review_score": 5, "reviewed": True, "status": "reviewed"}
```

---

## Step 7: Router Logic

```python
def route_intent(state: CustomerState) -> str:
    if state["intent"] == "faq":
        return "faq"
    elif state["intent"] == "knowledge_base":
        return "rag"
    elif state["intent"] == "data_query":
        return "sql"
    else:
        return "escalate"

def after_specialist(state: CustomerState) -> str:
    if state.get("needs_human"):
        return "human"
    return "review"

def after_human(state: CustomerState) -> str:
    return "review" if state.get("human_resolved") else "retry"
```

---

## Step 8: Build the Graph

```python
builder = StateGraph(CustomerState)

# Nodes
builder.add_node("router", router_agent)
builder.add_node("faq_agent", faq_agent)
builder.add_node("rag_agent", rag_agent)
builder.add_node("sql_agent", sql_agent)
builder.add_node("escalation", escalation_check)
builder.add_node("human_handoff", human_handoff)
builder.add_node("quality_review", quality_review)

# Edges
builder.add_edge(START, "router")
builder.add_conditional_edges("router", route_intent, {
    "faq": "faq_agent",
    "rag": "rag_agent",
    "sql": "sql_agent",
    "escalate": "human_handoff"
})

# After specialists, check if escalation needed
builder.add_edge("faq_agent", "escalation")
builder.add_edge("rag_agent", "escalation")
builder.add_edge("sql_agent", "escalation")

# Escalation or review
builder.add_conditional_edges("escalation", after_specialist, {
    "human": "human_handoff",
    "review": "quality_review"
})

# After human
builder.add_conditional_edges("human_handoff", after_human, {
    "review": "quality_review",
    "retry": "router"  # Retry with different approach
})

# Final edge
builder.add_edge("quality_review", END)

# Compile with persistence
checkpointer = PostgresSaver.from_conn_string(
    os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/langgraph")
)
checkpointer.setup()  # One-time initialization

app = builder.compile(checkpointer=checkpointer)
```

---

## Step 9: Deployment Configuration

```json
{
  "name": "customer-support-agent",
  "version": "2.0.0",
  "graphs": {
    "support": "./src/support_agent.py:app"
  },
  "dependencies": {
    "pip": [
      "langchain-openai",
      "langchain-community",
      "chromadb",
      "sqlalchemy",
      "psycopg2-binary",
      "tiktoken"
    ],
    "python": "3.11"
  },
  "env": {
    "OPENAI_API_KEY": "${OPENAI_API_KEY}",
    "DATABASE_URL": "${DATABASE_URL}",
    "CUSTOMER_DB_URL": "${CUSTOMER_DB_URL}"
  },
  "checkpointer": {
    "type": "postgres",
    "url": "${DATABASE_URL}"
  }
}
```

---

## Step 10: Monitoring Setup

```python
# In your application entry point:
import langsmith

client = langsmith.Client()

# Create monitors
client.create_monitor(
    project_name="customer-support-prod",
    metric="error_rate",
    threshold=0.02,  # Alert if > 2% errors
    interval_minutes=15
)

client.create_monitor(
    project_name="customer-support-prod",
    metric="latency_p95",
    threshold=30.0,  # Alert if > 30 seconds
    interval_minutes=15
)
```

---

## Complete System Summary

```python
# Usage
support = CustomerSupportAgent()

# Customer asks a question
result = support.handle_query(
    customer_id="cust_12345",
    query="What's your return policy for electronics?"
)

# System automatically:
# 1. Routes to FAQ agent
# 2. Answers based on policy knowledge
# 3. Checks confidence (high enough, no escalation)
# 4. Reviews quality
# 5. Returns answer with tracing

print(result["messages"][-1].content)

# For complex queries:
result = support.handle_query(
    customer_id="cust_12345",
    query="How many orders have I placed this year?"
)
# Routes to SQL agent → queries database → returns data
```

[!SUCCESS]
This production-grade system combines routing, RAG, SQL queries, human handoff, quality review, and comprehensive monitoring — all the patterns from the Advanced course working together.

---

## Practice Questions

```question
{
  "id": "lg-advanced-10-q1",
  "type": "multiple-choice",
  "question": "What is the first node executed in the customer support graph?",
  "options": ["faq_agent", "router", "escalation_check", "quality_review"],
  "correct": 1,
  "explanation": "The router agent executes first to classify the customer's intent before routing to the appropriate specialist."
}
```

```question
{
  "id": "lg-advanced-10-q2",
  "type": "multiple-choice",
  "question": "What triggers a human handoff?",
  "options": [
    "Every query goes to a human",
    "Low confidence, 'escalate' intent, or exceeding max retries",
    "Only when the SQL agent fails",
    "Human handoff is not implemented"
  ],
  "correct": 1,
  "explanation": "The escalation check triggers human handoff when confidence is low, the intent is 'escalate', or retry limits are exceeded."
}
```

```question
{
  "id": "lg-advanced-10-q3",
  "type": "multiple-choice",
  "question": "What mechanism allows human agents to handle escalated tickets?",
  "options": [
    "Email notification",
    "The interrupt() function — pauses graph, waits for human input, resumes",
    "A separate chat system",
    "Humans are not supported"
  ],
  "correct": 1,
  "explanation": "The human_handoff node uses interrupt() to pause execution and wait for human input. The human reviews the context and provides a resolution."
}
```

```question
{
  "id": "lg-advanced-10-q4",
  "type": "multiple-choice",
  "question": "What does the quality_review node evaluate?",
  "options": [
    "Database performance",
    "Whether the answer addressed the query, accuracy, and tone",
    "Customer satisfaction score",
    "Response time"
  ],
  "correct": 1,
  "explanation": "The reviewer LLM evaluates whether the answer addressed the query, was accurate, and had appropriate tone."
}
```

```question
{
  "id": "lg-advanced-10-q5",
  "type": "multiple-choice",
  "question": "What database is recommended for production state persistence?",
  "options": ["SQLite", "PostgreSQL", "MongoDB", "Redis"],
  "correct": 1,
  "explanation": "PostgreSQL is recommended for production checkpointing with proper connection pooling and replication support."
}
```

```question
{
  "id": "lg-advanced-10-q6",
  "type": "multiple-choice",
  "question": "What routing happens after a specialist agent completes?",
  "options": [
    "Always go to quality_review",
    "Go to escalation_check first, which determines whether to escalate or review",
    "Always end the graph",
    "Go back to the router"
  ],
  "correct": 1,
  "explanation": "After a specialist, the escalation_check determines if human handoff is needed or the result can proceed to quality review."
}
```

```question
{
  "id": "lg-advanced-10-q7",
  "type": "multiple-choice",
  "question": "What system monitors error rates and latency in production?",
  "options": [
    "A cron job",
    "LangSmith monitors that alert when metrics exceed thresholds",
    "Manual checking",
    "The router agent"
  ],
  "correct": 1,
  "explanation": "LangSmith monitors track key metrics (error rate, latency) and send alerts when thresholds are exceeded."
}
```

```question
{
  "id": "lg-advanced-10-q8",
  "type": "multiple-choice",
  "question": "What does the RAG agent use to find relevant information?",
  "options": [
    "A web search API",
    "A Chroma vector store with embeddings for similarity search",
    "A SQL database",
    "Hardcoded answers"
  ],
  "correct": 1,
  "explanation": "The RAG agent uses Chroma vector store with OpenAIEmbeddings to perform semantic search on the knowledge base."
}
```

```question
{
  "id": "lg-advanced-10-q9",
  "type": "multiple-choice",
  "question": "What happens after a human resolves an escalated ticket?",
  "options": [
    "The graph ends immediately",
    "The result goes to quality_review for tracking",
    "The specialist agent re-processes the query",
    "The human's response is returned directly"
  ],
  "correct": 1,
  "explanation": "After human resolution, the result goes through quality_review to log the interaction and track metrics."
}
```

```question
{
  "id": "lg-advanced-10-q10",
  "type": "multiple-choice",
  "question": "What environment variable enables LangSmith tracing for this system?",
  "options": [
    "LANGSMITH_ENABLED=true",
    "LANGCHAIN_TRACING_V2=true",
    "TRACING_ENABLE=true",
    "LANGSMITH_TRACE=true"
  ],
  "correct": 1,
  "explanation": "LANGCHAIN_TRACING_V2=true enables automatic tracing of all LangChain operations to LangSmith for monitoring and debugging."
}
```

---

[!SUCCESS]
### Key Takeaways
- Production support system integrates: routing, RAG, SQL, human handoff, quality review
- Router classifies intent and dispatches to specialist agents
- Escalation check triggers human handoff for low-confidence or complex queries
- Human handoff uses interrupt() for pause/resume workflow
- Quality review evaluates each interaction before returning to customer
- LangSmith monitors error rates, latency, and other production metrics
- PostgreSQL for production state persistence
- All Advanced course patterns combined into a single cohesive system
