---
title: "Multi-Agent Orchestration Patterns"
description: "Design and implement multi-agent workflows in OpenCode. Learn routing strategies, delegation patterns, and how to coordinate multiple agents for complex tasks."
order: 1
duration: "45 min"
difficulty: "intermediate"
---

# Multi-Agent Orchestration Patterns

## Why Multi-Agent?

Single agents work well for simple tasks, but complex projects benefit from specialized agents working together.

| Pattern | Use Case | Benefit |
|---------|----------|---------|
| **Router** | Direct tasks to specialists | Better accuracy |
| **Pipeline** | Sequential processing | Clear workflow |
| **Parallel** | Independent tasks | Faster execution |
| **Hierarchical** | Complex delegation | Scalability |

---

## Router Pattern

The router pattern directs tasks to the most appropriate agent based on content.

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Routes tasks to specialists"
    },
    "frontend": {
      "model": "gpt-4o",
      "description": "React, CSS, TypeScript, UI/UX"
    },
    "backend": {
      "model": "claude-sonnet-4-20250514",
      "description": "APIs, databases, server logic"
    },
    "devops": {
      "model": "gpt-4o",
      "description": "Docker, CI/CD, deployment, infrastructure"
    }
  },
  "agentRouting": {
    "mode": "auto",
    "defaultAgent": "default",
    "rules": [
      {
        "pattern": "react|css|component|ui|frontend",
        "agent": "frontend"
      },
      {
        "pattern": "api|database|sql|endpoint|backend",
        "agent": "backend"
      },
      {
        "pattern": "docker|deploy|ci/cd|pipeline|kubernetes",
        "agent": "devops"
      }
    ]
  }
}
```

---

## Pipeline Pattern

Chain agents for sequential processing:

```mermaid
flowchart LR
    A[Requirements Agent] --> B[Design Agent]
    B --> C[Implementation Agent]
    B --> D[Testing Agent]
    D --> E[Review Agent]
```

### Implementation

```json
{
  "agents": {
    "requirements": {
      "model": "gpt-4o",
      "description": "Analyzes requirements and creates specifications"
    },
    "design": {
      "model": "claude-sonnet-4-20250514",
      "description": "Creates technical design from specifications"
    },
    "implement": {
      "model": "gpt-4o",
      "description": "Writes code based on design documents"
    },
    "test": {
      "model": "gpt-4o-mini",
      "description": "Generates and runs tests"
    },
    "review": {
      "model": "claude-sonnet-4-20250514",
      "description": "Reviews code quality and security"
    }
  }
}
```

---

## Parallel Pattern

Execute independent tasks simultaneously:

```mermaid
flowchart TD
    A[Task Splitter] --> B[Agent 1: Frontend]
    A --> C[Agent 2: Backend]
    A --> D[Agent 3: Tests]
    B --> E[Merger]
    C --> E
    D --> E
```

### When to Use Parallel

| Task Type | Parallel? | Reason |
|-----------|:---------:|--------|
| Independent modules | ✅ | No dependencies |
| Cross-cutting concerns | ❌ | Need coordination |
| Sequential logic | ❌ | Order matters |
| Multiple test suites | ✅ | Independent execution |

---

## Hierarchical Pattern

Use subagents for complex delegation:

```json
{
  "agents": {
    "lead": {
      "model": "gpt-4o",
      "description": "Project lead that coordinates work",
      "subagents": {
        "frontend-lead": {
          "model": "gpt-4o",
          "description": "Manages frontend team"
        },
        "backend-lead": {
          "model": "gpt-4o",
          "description": "Manages backend team"
        }
      }
    }
  }
}
```

---

## Agent Communication

### Via Files

Agents can communicate through shared files:

```python
# Agent 1 writes
with open("tmp/design.json", "w") as f:
    json.dump(design_spec, f)

# Agent 2 reads
with open("tmp/design.json") as f:
    design_spec = json.load(f)
```

### Via Context

The primary agent passes context to subagents:

```
> Have the backend agent implement the API, then have the test agent write tests for it
```

---

## Best Practices

### Agent Specialization

| Agent Type | Model | Temperature | Use Case |
|------------|-------|:-----------:|----------|
| Architect | Claude | 0.3 | Design decisions |
| Coder | GPT-4o | 0.7 | Implementation |
| Reviewer | Claude | 0.2 | Code review |
| Tester | GPT-4o-mini | 0.5 | Test generation |

### Permission Isolation

```json
{
  "permissions": [
    {
      "tool": "write",
      "allow": ["src/frontend/**"],
      "agent": "frontend"
    },
    {
      "tool": "write",
      "allow": ["src/backend/**"],
      "agent": "backend"
    }
  ]
}
```

---

## Practice Questions

```question
{
  "id": "oc-multi-q1",
  "type": "multiple-choice",
  "question": "Which orchestration pattern is best for tasks that can run independently?",
  "options": [
    "Pipeline",
    "Router",
    "Parallel",
    "Hierarchical"
  ],
  "correct": 2,
  "explanation": "The parallel pattern executes independent tasks simultaneously, improving performance when tasks don't depend on each other."
}
```

```question
{
  "id": "oc-multi-q2",
  "type": "multiple-choice",
  "question": "What field controls how OpenCode routes tasks to agents?",
  "options": [
    "agentRouting",
    "agentSelection",
    "taskDispatch",
    "routing"
  ],
  "correct": 0,
  "explanation": "The agentRouting configuration controls how tasks are dispatched to agents based on description matching and rule patterns."
}
```

```question
{
  "id": "oc-multi-q3",
  "type": "multiple-choice",
  "question": "When should you use the pipeline pattern instead of parallel?",
  "options": [
    "When tasks are independent",
    "When tasks have sequential dependencies",
    "When you need faster execution",
    "When tasks use different models"
  ],
  "correct": 1,
  "explanation": "The pipeline pattern is for sequential workflows where each step depends on the output of the previous one."
}
```

```question
{
  "id": "oc-multi-q4",
  "type": "multiple-choice",
  "question": "How do subagents communicate with their parent agent?",
  "options": [
    "Direct API calls",
    "Through shared files and context",
    "Via message queues",
    "Through database"
  ],
  "correct": 1,
  "explanation": "Subagents communicate through shared files and context passed by the parent agent, not through external systems."
}
```

```question
{
  "id": "oc-multi-q5",
  "type": "multiple-choice",
  "question": "Which model temperature is best for code review tasks?",
  "options": [
    "0.7 (creative)",
    "0.5 (balanced)",
    "0.3 (deterministic)",
    "1.0 (random)"
  ],
  "correct": 2,
  "explanation": "Code review requires deterministic, focused outputs, so a low temperature (0.1-0.3) is ideal."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Multi-agent workflows improve accuracy through specialization
- The router pattern directs tasks to specialists based on content
- Use pipeline for sequential dependencies, parallel for independent tasks
- Hierarchical patterns with subagents enable complex delegation
- Agent temperature should match the task: low for review, high for creativity
- Permission isolation prevents agents from interfering with each other
- Agents communicate through shared files and context, not external systems