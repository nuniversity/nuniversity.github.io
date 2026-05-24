---
title: "Reflection Agent Pattern"
description: "Implement the reflection pattern in LangGraph — generate, critique, and refine loops for self-improving agents that iteratively improve their output."
order: 6
duration: "35 minutes"
difficulty: "advanced"
---

# Reflection Agent Pattern

The reflection pattern enables agents to **self-improve** by generating output, critiquing it, and refining it based on the critique. This creates a quality loop that produces better results than single-pass generation.

---

## The Reflection Loop

```
Generate → Critique → Refine → Critique → Refine → ... → Accept
```

Each iteration:
1. **Generate**: Produce initial output (or refine from previous)
2. **Critique**: Analyze the output for issues, gaps, or improvements
3. **Refine**: Improve based on critique
4. **Repeat**: Until quality threshold is met or max iterations reached

---

## Basic Reflection Graph

```python
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict
from typing import Annotated, List
from operator import add

llm = ChatOpenAI(model="gpt-4o")

class ReflectionState(TypedDict):
    topic: str
    drafts: Annotated[List[str], add]  # Accumulate all drafts
    critiques: Annotated[List[str], add]  # Accumulate all critiques
    final: str
    iteration: int
    max_iterations: int

def generate(state: ReflectionState) -> dict:
    context = ""
    if state["critiques"]:
        # Incorporate last critique
        last_critique = state["critiques"][-1]
        context = f"\nPrevious critique to address:\n{last_critique}"

    prompt = f"Write about: {state['topic']}. Be thorough and clear.{context}"
    draft = llm.invoke(prompt).content

    return {
        "drafts": [draft],
        "iteration": state["iteration"] + 1
    }

def critique(state: ReflectionState) -> dict:
    last_draft = state["drafts"][-1]

    prompt = f"""Critique the following text. Identify:
1. Strengths
2. Weaknesses or gaps
3. Specific improvements needed
4. Clarity and structure issues

Text to critique:
{last_draft}

Be constructive and specific."""

    critique_text = llm.invoke(prompt).content
    return {"critiques": [critique_text]}

def should_continue(state: ReflectionState) -> str:
    if state["iteration"] >= state["max_iterations"]:
        return "finalize"
    return "refine"

def finalize(state: ReflectionState) -> dict:
    return {"final": state["drafts"][-1]}

# Build graph
builder = StateGraph(ReflectionState)
builder.add_node("generate", generate)
builder.add_node("critique", critique)
builder.add_node("finalize", finalize)

builder.add_edge(START, "generate")
builder.add_edge("generate", "critique")
builder.add_conditional_edges("critique", should_continue, {
    "refine": "generate",  # Loop back for another iteration
    "finalize": "finalize"
})
builder.add_edge("finalize", END)

app = builder.compile()

# Run
result = app.invoke({
    "topic": "Benefits of functional programming",
    "drafts": [],
    "critiques": [],
    "final": "",
    "iteration": 0,
    "max_iterations": 3
})
print(result["final"])
```

[!NOTE]
The critique is fed back into the next generate call as context. The generator addresses the critique points, creating an improving cycle.

---

## Structured Critique with Scoring

```python
from pydantic import BaseModel, Field

class CritiqueScore(BaseModel):
    clarity: float = Field(ge=0, le=10)
    accuracy: float = Field(ge=0, le=10)
    completeness: float = Field(ge=0, le=10)
    conciseness: float = Field(ge=0, le=10)
    overall: float = Field(ge=0, le=10)
    issues: list[str]
    suggestions: list[str]

def structured_critique(state: ReflectionState) -> dict:
    from langchain_core.output_parsers import PydanticOutputParser
    parser = PydanticOutputParser(pydantic_object=CritiqueScore)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Critique the text and provide structured scores. {format_instructions}"),
        ("human", "{text}")
    ])

    chain = prompt | llm | parser
    score = chain.invoke({
        "text": state["drafts"][-1],
        "format_instructions": parser.get_format_instructions()
    })

    return {
        "critiques": [f"Score: {score.overall}/10\nIssues: {', '.join(score.issues)}\nSuggestions: {', '.join(score.suggestions)}"]
    }
```

[!SUCCESS]
Structured critiques with scores let you track improvement over iterations and set quality thresholds for early termination.

---

## Quality Threshold Termination

```python
def quality_router(state: ReflectionState) -> str:
    last_critique = state["critiques"][-1] if state["critiques"] else ""

    # Check if quality is acceptable (simplified — look for score)
    if "Score:" in last_critique:
        try:
            score_line = [l for l in last_critique.split("\n") if "Score:" in l][0]
            score = float(score_line.split("/")[0].split(":")[1].strip())
            if score >= 8.0:  # Quality threshold met
                return "finalize"
        except (IndexError, ValueError):
            pass

    if state["iteration"] >= state["max_iterations"]:
        return "finalize"

    return "refine"
```

---

## Multi-Perspective Critique

Use multiple critique angles for thorough feedback:

```python
def critic_expert(state: ReflectionState) -> dict:
    """Critique from an expert perspective."""
    prompt = f"As a domain expert, critique this: {state['drafts'][-1]}"
    return {"critiques": [f"[Expert] {llm.invoke(prompt).content}"]}

def critic_stylist(state: ReflectionState) -> dict:
    """Critique from a writing style perspective."""
    prompt = f"As a writing stylist, critique the clarity and flow: {state['drafts'][-1]}"
    return {"critiques": [f"[Style] {llm.invoke(prompt).content}"]}

def critic_fact_checker(state: ReflectionState) -> dict:
    """Critique from a factual accuracy perspective."""
    prompt = f"Fact-check this text. Identify any unsupported claims: {state['drafts'][-1]}"
    return {"critiques": [f"[Facts] {llm.invoke(prompt).content}"]}
```

[!TIP]
Multiple critics provide different perspectives. The generator receives all critiques and must address all of them in the next iteration.

---

## Code Improvement with Reflection

The reflection pattern works for code generation too:

```python
def generate_code(state: ReflectionState) -> dict:
    context = ""
    if state["critiques"]:
        context = f"\nAddress these issues:\n{state['critiques'][-1]}"

    prompt = f"Write Python code for: {state['topic']}. Include tests.{context}"
    code = llm.invoke(prompt).content
    return {"drafts": [code], "iteration": state["iteration"] + 1}

def critique_code(state: ReflectionState) -> dict:
    code = state["drafts"][-1]
    prompt = f"""Review this Python code for:
1. Correctness — will it work?
2. Edge cases — what could break it?
3. Performance — can it be optimized?
4. Style — does it follow PEP 8?
5. Security — are there vulnerabilities?

Code:
{code}

Be specific about each issue."""
    critique_text = llm.invoke(prompt).content
    return {"critiques": [critique_text]}
```

---

## Complete Reflection Agent

```python
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict, Annotated
from typing import List
from operator import add

class AgentState(TypedDict):
    task: str
    outputs: Annotated[List[str], add]
    feedback: Annotated[List[str], add]
    iteration: int
    max_iterations: int

def generate(state: AgentState) -> dict:
    context = ""
    if state["feedback"]:
        context = f"\nPrevious feedback: {state['feedback'][-1]}"
    prompt = f"Task: {state['task']}. Produce your best work.{context}"
    return {"outputs": [llm.invoke(prompt).content], "iteration": state["iteration"] + 1}

def reflect(state: AgentState) -> dict:
    prompt = f"Critique this output constructively:\n{state['outputs'][-1]}"
    return {"feedback": [llm.invoke(prompt).content]}

def router(state: AgentState) -> str:
    return "refine" if state["iteration"] < state["max_iterations"] else "done"

builder = StateGraph(AgentState)
builder.add_node("generate", generate)
builder.add_node("reflect", reflect)
builder.add_edge(START, "generate")
builder.add_edge("generate", "reflect")
builder.add_conditional_edges("reflect", router, {"refine": "generate", "done": END})
app = builder.compile()
```

---

## Practice Questions

```question
{
  "id": "lg-advanced-06-q1",
  "type": "multiple-choice",
  "question": "What is the reflection pattern in LangGraph?",
  "options": [
    "A pattern that mirrors graph execution",
    "A generate → critique → refine loop for self-improvement",
    "A debugging technique",
    "A deployment strategy"
  ],
  "correct": 1,
  "explanation": "The reflection pattern iteratively generates, critiques, and refines output, enabling self-improvement without human feedback."
}
```

```question
{
  "id": "lg-advanced-06-q2",
  "type": "multiple-choice",
  "question": "How does the generate node use feedback from the critique node?",
  "options": [
    "It ignores the feedback",
    "The feedback is passed as context in the next generation prompt",
    "Feedback is stored but not used",
    "The generate node runs independently"
  ],
  "correct": 1,
  "explanation": "The critique output is incorporated into the next generate call's prompt so the generator addresses the identified issues."
}
```

```question
{
  "id": "lg-advanced-06-q3",
  "type": "multiple-choice",
  "question": "What determines when the reflection loop stops?",
  "options": [
    "A fixed number of iterations",
    "A quality threshold (or max iterations as fallback)",
    "Only when the output is perfect",
    "The user decides manually"
  ],
  "correct": 1,
  "explanation": "The loop stops when quality criteria are met (e.g., score >= 8/10) or when max iterations is reached, whichever comes first."
}
```

```question
{
  "id": "lg-advanced-06-q4",
  "type": "multiple-choice",
  "question": "What is the advantage of structured critique with scores?",
  "options": [
    "It's faster",
    "It enables quantitative tracking of improvement and threshold-based termination",
    "It doesn't require an LLM",
    "It's more concise"
  ],
  "correct": 1,
  "explanation": "Numeric scores allow tracking improvement across iterations and cleanly implementing early termination when quality is sufficient."
}
```

```question
{
  "id": "lg-advanced-06-q5",
  "type": "multiple-choice",
  "question": "What is the benefit of multi-perspective critique?",
  "options": [
    "It uses fewer tokens",
    "Different angles (expertise, style, facts) find different types of issues",
    "It's simpler to implement",
    "It requires only one LLM call"
  ],
  "correct": 1,
  "explanation": "Multiple critics with different focuses catch issues that a single general critique might miss."
}
```

```question
{
  "id": "lg-advanced-06-q6",
  "type": "multiple-choice",
  "question": "How does the reflection pattern improve code generation?",
  "options": [
    "By running the code",
    "By reviewing for correctness, edge cases, performance, style, and security",
    "By translating to a different language",
    "By minifying the code"
  ],
  "correct": 1,
  "explanation": "The code critique reviews for multiple quality dimensions, and the next generation addresses the identified issues."
}
```

```question
{
  "id": "lg-advanced-06-q7",
  "type": "multiple-choice",
  "question": "What risk should you mitigate in the reflection loop?",
  "options": [
    "Token overuse — each iteration adds LLM calls",
    "The loop might converge too fast",
    "Output quality decreases with iterations",
    "The critique is always positive"
  ],
  "correct": 0,
  "explanation": "Each reflection iteration costs LLM tokens. Balance quality improvement against cost. Set reasonable max iterations."
}
```

```question
{
  "id": "lg-advanced-06-q8",
  "type": "multiple-choice",
  "question": "What happens in the critique node of the basic reflection graph?",
  "options": [
    "It generates new content",
    "It analyzes the latest draft and identifies strengths, weaknesses, and improvements",
    "It executes code",
    "It terminates the graph"
  ],
  "correct": 1,
  "explanation": "The critique node analyzes the latest output and provides constructive feedback for improvement."
}
```

```question
{
  "id": "lg-advanced-06-q9",
  "type": "multiple-choice",
  "question": "What does the 'add' reducer do for the drafts field in reflection state?",
  "options": [
    "Keeps only the latest draft",
    "Accumulates all draft versions so the history is preserved",
    "Replaces old drafts",
    "Compresses drafts"
  ],
  "correct": 1,
  "explanation": "Annotated[List[str], add] accumulates all draft versions, preserving the improvement history across iterations."
}
```

```question
{
  "id": "lg-advanced-06-q10",
  "type": "multiple-choice",
  "question": "Can the reflection pattern be applied to agent decisions, not just text?",
  "options": [
    "No, it only works for text generation",
    "Yes — the agent can critique its own decisions and choose alternative strategies",
    "Only for code",
    "Only for writing"
  ],
  "correct": 1,
  "explanation": "Agents can reflect on their own decisions: what went wrong, what alternative actions could be taken, and adjust their strategy accordingly."
}
```

---

[!SUCCESS]
### Key Takeaways
- Reflection pattern: generate → critique → refine — iteratively improving output
- Critique feedback is passed as context to the next generation prompt
- Structured scoring enables quantitative quality tracking and early termination
- Multi-perspective critiques catch different types of issues
- The pattern works for text, code, and agent decisions
- Balance iteration count against token costs
- The 'add' reducer preserves improvement history
- Quality thresholds prevent unnecessary iterations when output is already good
