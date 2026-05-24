---
title: "SQL Agents"
description: "Build SQL query agents with LangGraph — database tool binding, text-to-SQL generation, query validation and execution, and result interpretation."
order: 5
duration: "40 minutes"
difficulty: "advanced"
---

# SQL Agents

SQL agents let users query databases using natural language. The agent converts the question to SQL, validates it, executes it, and interprets the results. This lesson covers safe and reliable text-to-SQL patterns.

---

## Architecture

```
Natural Language Query
    ↓
SQL Agent
    ├── 1. Understand schema → Describe tables and columns
    ├── 2. Generate SQL → LLM converts question to SQL
    ├── 3. Validate SQL → Syntax check, safety checks
    ├── 4. Execute SQL → Run against database
    └── 5. Interpret results → LLM explains the results
    ↓
Natural Language Answer
```

---

## Database Connection

```python
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
from langchain_core.tools import tool

# Database connection
DATABASE_URL = "postgresql://user:pass@localhost:5432/mydb"
engine = create_engine(DATABASE_URL)
```

[!WARNING]
Never expose your database directly to users. Use a read-only database user and whitelist allowed queries. Always validate SQL before execution.

---

## Schema Discovery Tool

```python
@tool
def get_schema() -> str:
    """Get the database schema (tables, columns, types, and relationships)."""
    inspector = inspect(engine)
    schema = []

    for table_name in inspector.get_table_names():
        columns = inspector.get_columns(table_name)
        cols = [f"  - {c['name']}: {c['type']}" for c in columns]
        schema.append(f"Table: {table_name}\n" + "\n".join(cols))

        # Foreign keys
        fks = inspector.get_foreign_keys(table_name)
        for fk in fks:
            schema.append(f"  FK: {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")

    return "\n\n".join(schema)
```

---

## Text-to-SQL Generation

```python
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4o")

sql_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a SQL expert. Convert natural language questions to SQL queries.\n"
               "Database schema:\n{schema}\n\n"
               "Rules:\n"
               "1. Use only SELECT statements (no INSERT/UPDATE/DELETE)\n"
               "2. Use LIMIT to restrict results (max 100 rows)\n"
               "3. Use proper JOIN syntax\n"
               "4. Return ONLY the SQL query, no explanations"),
    ("human", "{question}")
])

def generate_sql(question: str, schema: str) -> str:
    chain = sql_prompt | llm | StrOutputParser()
    sql = chain.invoke({"question": question, "schema": schema})
    # Clean the SQL (remove markdown fences if present)
    sql = sql.replace("```sql", "").replace("```", "").strip()
    return sql
```

---

## SQL Validation

```python
import re
from typing import Tuple

FORBIDDEN_PATTERNS = [
    r'\bINSERT\b', r'\bUPDATE\b', r'\bDELETE\b',
    r'\bDROP\b', r'\bALTER\b', r'\bCREATE\b',
    r'\bTRUNCATE\b', r'\bGRANT\b', r'\bREVOKE\b',
    r'\bEXEC\b', r'\bEXECUTE\b', r';.*;'  # Multiple statements
]

def validate_sql(sql: str) -> Tuple[bool, str]:
    """Validate SQL for safety and syntax."""

    # Check for forbidden operations
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, sql, re.IGNORECASE):
            return False, f"Forbidden SQL operation detected: {pattern.strip('\\\\b')}"

    # Must be a SELECT statement
    if not sql.strip().upper().startswith("SELECT"):
        return False, "Only SELECT queries are allowed"

    # Syntax check (try to explain the query)
    try:
        with engine.connect() as conn:
            conn.execute(text(f"EXPLAIN {sql}"))
    except Exception as e:
        return False, f"SQL syntax error: {str(e)}"

    return True, "Valid"
```

[!NOTE]
The `EXPLAIN` command tests syntax without executing the query, making it a safe validation step before running the actual query.

---

## SQL Execution Tool

```python
@tool
def execute_sql(sql: str) -> str:
    """Execute a SQL SELECT query and return results as formatted text."""
    # Validate first
    valid, msg = validate_sql(sql)
    if not valid:
        return f"Validation error: {msg}"

    # Execute
    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            rows = result.fetchmany(100)
            columns = result.keys()

            # Format as text table
            output = []
            output.append(" | ".join(columns))
            output.append("-" * len(output[0]))

            for row in rows:
                output.append(" | ".join(str(val)[:50] for val in row))

            return "\n".join(output) if len(output) > 2 else "No results found."
    except Exception as e:
        return f"Execution error: {str(e)}"
```

---

## Complete SQL Agent

```python
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolExecutor
from langchain_core.messages import SystemMessage, ToolMessage
from typing_extensions import TypedDict, Annotated
from typing import List, Any

tools = [get_schema, execute_sql]
llm_with_tools = llm.bind_tools(tools)
tool_executor = ToolExecutor(tools)

class SQLState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    schema: str

def agent_node(state: SQLState) -> dict:
    system = """You are a SQL assistant. Follow these steps:
1. Use get_schema to understand the database structure
2. Generate a SQL query for the user's question
3. Use execute_sql to run it
4. Interpret the results for the user in plain English

Rules:
- Only use SELECT queries
- Explain results in natural language
- If a query returns an error, fix it and retry"""

    messages = [SystemMessage(system)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def tools_node(state: SQLState) -> dict:
    last = state["messages"][-1]
    if not last.tool_calls:
        return {}
    return {"messages": [
        ToolMessage(content=str(tool_executor.invoke(tc)), tool_call_id=tc["id"])
        for tc in last.tool_calls
    ]}

def router(state: SQLState) -> str:
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return "end"

builder = StateGraph(SQLState)
builder.add_node("agent", agent_node)
builder.add_node("tools", tools_node)
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", router, {"tools": "tools", "end": END})
builder.add_edge("tools", "agent")
app = builder.compile(checkpointer=MemorySaver())

# Example usage
result = app.invoke({
    "messages": [("human", "Show me the top 5 customers by total orders")],
    "schema": ""
})
print(result["messages"][-1].content)
```

[!SUCCESS]
The agent autonomously discovers the schema, generates SQL, validates and executes it, then explains the results — all in a loop until the user's question is answered.

---

## Multi-Turn SQL Conversations

```python
# Follow-up questions maintain context
session = {"configurable": {"thread_id": "sql-session-1"}}

app.invoke({"messages": [("human", "What tables exist in the database?")]}, session)
# Agent: Uses get_schema, describes the tables

app.invoke({"messages": [("human", "How many customers are from New York?")]}, session)
# Agent: Already knows the schema, generates and executes the query

app.invoke({"messages": [("human", "Show me the details")]}, session)
# Agent: Understands context from conversation history
```

---

## Error Recovery

```python
def resilient_agent(state: SQLState) -> dict:
    """Agent with error recovery — retries with fixed SQL on error."""
    last = state["messages"][-1]
    error_attempts = sum(1 for m in state["messages"]
                        if hasattr(m, 'content') and "Execution error:" in m.content)

    if error_attempts > 3:
        return {"messages": [AIMessage(
            "I'm having trouble with this query. Let me try a different approach."
        )]}

    # Continue with normal agent logic
    return agent_node(state)
```

[!TIP]
Track error attempts in state. After N failures, try a different approach (simpler query, ask clarifying question) instead of retrying indefinitely.

---

## Practice Questions

```question
{
  "id": "lg-advanced-05-q1",
  "type": "multiple-choice",
  "question": "What is the first step a SQL agent should take when processing a query?",
  "options": [
    "Execute a sample query",
    "Discover the database schema to understand available tables and columns",
    "Ask the user for clarification",
    "Generate SQL directly"
  ],
  "correct": 1,
  "explanation": "The agent first calls get_schema to understand the database structure before attempting to generate queries."
}
```

```question
{
  "id": "lg-advanced-05-q2",
  "type": "multiple-choice",
  "question": "What SQL operations should be forbidden in a SQL agent?",
  "options": [
    "SELECT with JOIN",
    "INSERT, UPDATE, DELETE, DROP, ALTER",
    "SELECT with LIMIT",
    "SELECT with WHERE"
  ],
  "correct": 1,
  "explanation": "INSERT, UPDATE, DELETE, DROP, ALTER, and other write/modify operations should be forbidden for safety."
}
```

```question
{
  "id": "lg-advanced-05-q3",
  "type": "multiple-choice",
  "question": "How can you validate SQL syntax without executing the query?",
  "options": [
    "Read the SQL string manually",
    "Use EXPLAIN which tests syntax without running the query",
    "Use a regex pattern match",
    "Syntax validation is not possible"
  ],
  "correct": 1,
  "explanation": "EXPLAIN {sql} parses and plans the query without executing it, making it a safe syntax validation step."
}
```

```question
{
  "id": "lg-advanced-05-q4",
  "type": "multiple-choice",
  "question": "Why should the SQL agent use a read-only database user?",
  "options": [
    "Faster query execution",
    "To prevent any possibility of data modification even if a write query slips through",
    "Read-only users are free",
    "It's not necessary"
  ],
  "correct": 1,
  "explanation": "A read-only database user provides a defense-in-depth layer against accidental or malicious data modification."
}
```

```question
{
  "id": "lg-advanced-05-q5",
  "type": "multiple-choice",
  "question": "What does the get_schema tool return?",
  "options": [
    "The full database contents",
    "Table names, column names, types, and foreign key relationships",
    "Sample data from each table",
    "The database connection string"
  ],
  "correct": 1,
  "explanation": "get_schema describes the database structure: tables, columns, data types, and foreign key relationships."
}
```

```question
{
  "id": "lg-advanced-05-q6",
  "type": "multiple-choice",
  "question": "How should a SQL agent handle a query that returns an error?",
  "options": [
    "Crash and report the error to the user",
    "Analyze the error, fix the SQL, and retry with corrected syntax",
    "Ignore the error",
    "Switch to a different database"
  ],
  "correct": 1,
  "explanation": "The agent should analyze the error message, fix the SQL (e.g., correct column names, join conditions), and retry."
}
```

```question
{
  "id": "lg-advanced-05-q7",
  "type": "multiple-choice",
  "question": "What is a good maximum number of retry attempts for a SQL agent?",
  "options": ["1", "3-5", "Unlimited", "10"],
  "correct": 1,
  "explanation": "3-5 retry attempts balances giving the agent a chance to fix errors versus preventing infinite failure loops."
}
```

```question
{
  "id": "lg-advanced-05-q8",
  "type": "multiple-choice",
  "question": "How does the agent in the SQL example decide when to stop executing tools?",
  "options": [
    "After exactly 2 tool calls",
    "When the LLM responds without requesting any tool calls",
    "When a timer expires",
    "After 5 tool calls maximum"
  ],
  "correct": 1,
  "explanation": "The router checks if the last message has tool_calls. If not, the agent has enough information to answer and the graph routes to END."
}
```

```question
{
  "id": "lg-advanced-05-q9",
  "type": "multiple-choice",
  "question": "What formatting does the execute_sql tool use for results?",
  "options": [
    "JSON",
    "Text table with columns and rows",
    "HTML",
    "CSV"
  ],
  "correct": 1,
  "explanation": "execute_sql formats results as a text table (pipe-separated columns) for readability and LLM comprehension."
}
```

```question
{
  "id": "lg-advanced-05-q10",
  "type": "multiple-choice",
  "question": "Why is the schema discovery important for text-to-SQL generation?",
  "options": [
    "It's optional",
    "The LLM needs to know table names, column names, and types to generate correct SQL",
    "It validates the database connection",
    "It caches query results"
  ],
  "correct": 1,
  "explanation": "The LLM cannot generate valid SQL without knowing the database schema — what tables exist, what columns they have, and their data types."
}
```

---

[!SUCCESS]
### Key Takeaways
- SQL agents follow: schema discovery → SQL generation → validation → execution → interpretation
- Use a read-only database user and validate SQL before execution
- EXPLAIN provides safe syntax validation without running the query
- Error recovery: analyze the error, fix the SQL, and retry (up to a limit)
- Multi-turn conversations maintain context about the database and prior queries
- Format results as text tables for LLM interpretation
- Proper schema discovery is essential for accurate text-to-SQL
