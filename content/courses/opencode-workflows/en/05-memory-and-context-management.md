---
title: "Memory and Context Management"
description: "Manage memory and context in OpenCode sessions. Learn how to maintain state across conversations, use memory files, and optimize context for better results."
order: 5
duration: "45 min"
difficulty: "intermediate"
---

# Memory and Context Management

## Understanding Context

Context is the information the AI remembers during a session:

| Context Type | Description | Persistence |
|-------------|-------------|-------------|
| **Conversation** | Chat history | Session only |
| **File Content** | Read files | Until cleared |
| **Project** | Project structure | Session only |
| **Memory Files** | Persistent storage | Across sessions |

---

## Conversation Memory

### View History

```
> /history
```

### Save Session

```
> /save project-setup
```

### Load Session

```
> /load project-setup
```

### Clear Context

```
> /clear
```

---

## Memory Files

Memory files persist information across sessions.

### Project Memory

Create `.opencode/memory/project.md`:

```markdown
# Project Memory

## Architecture
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL

## Conventions
- Use camelCase for variables
- Use PascalCase for components
- All API endpoints prefixed with /api/

## Decisions
- 2024-01-15: Chose PostgreSQL over MongoDB for ACID compliance
```

### Personal Memory

Create `~/.config/opencode/memory/personal.md`:

```markdown
# Personal Memory

## Preferences
- Preferred model: gpt-4o
- Coding style: Functional programming
- Testing: Jest with 80% coverage minimum

## Shortcuts
- Use /clear between topics
- Always review AI suggestions before applying
```

---

## Loading Memory

### Automatic Loading

Configure auto-load in `opencode.json`:

```json
{
  "memory": {
    "autoLoad": [
      ".opencode/memory/project.md",
      ".opencode/memory/conventions.md"
    ]
  }
}
```

### Manual Loading

```
> Load the project memory file at .opencode/memory/project.md
```

---

## Context Optimization

### When Context Gets Too Large

**Symptoms:**
- Slow responses
- AI forgets early instructions
- Token limit warnings

**Solutions:**

1. **Clear and reload essentials**:
```
> /clear
> Load .opencode/memory/project.md
> We're working on the authentication module
```

2. **Use subagents for isolated tasks**:
```
> Have the test-agent write tests for the login function
```

3. **Summarize long conversations**:
```
> Summarize what we've discussed so far into a memory file
```

### Context Window Management

```
> /verbose
Context: 15234 tokens (47% of 32k limit)
```

**Best Practices:**

| Situation | Action |
|-----------|--------|
| Context > 70% | Clear and reload essentials |
| Switching topics | Clear conversation |
| Complex project | Use memory files |
| Multiple tasks | Use subagents |

---

## Memory File Structure

### Recommended Format

```markdown
# [Memory Type] Memory

## [Section]
- Key point
- Key point

## [Section]
- Key point
```

### Naming Conventions

| File | Purpose |
|------|---------|
| `project.md` | Project architecture and decisions |
| `conventions.md` | Coding standards and patterns |
| `decisions.md` | Architectural decision records |
| `todo.md` | Current tasks and priorities |
| `learned.md` | Things learned during sessions |

---

## Using Memory in Prompts

### Reference Memory

```
> According to our project memory, what database are we using?
```

### Update Memory

```
> Update the project memory to note we've switched from MongoDB to PostgreSQL
```

### Create from Session

```
> Save our conversation about the API design to .opencode/memory/api-design.md
```

---

## Best Practices

### Memory Hygiene

| Practice | Benefit |
|----------|---------|
| Regular updates | Keeps memory accurate |
| Clear sections | Easy to find information |
| Date decisions | Track evolution |
| Remove outdated | Prevents confusion |

### Context Management

| Practice | Benefit |
|----------|---------|
| Clear between topics | Prevents cross-contamination |
| Load essentials only | Reduces token usage |
| Use subagents | Isolates complex tasks |
| Monitor context size | Avoids limits |

---

## Practice Questions

```question
{
  "id": "oc-memory-q1",
  "type": "multiple-choice",
  "question": "Where should you store project-specific memory files?",
  "options": [
    "~/.config/opencode/memory/",
    ".opencode/memory/",
    "src/memory/",
    "tmp/memory/"
  ],
  "correct": 1,
  "explanation": "Project-specific memory files belong in .opencode/memory/ within the project directory."
}
```

```question
{
  "id": "oc-memory-q2",
  "type": "multiple-choice",
  "question": "What is the benefit of memory files over conversation history?",
  "options": [
    "They're faster to load",
    "They persist across sessions",
    "They use fewer tokens",
    "They're automatically updated"
  ],
  "correct": 1,
  "explanation": "Memory files persist across sessions, while conversation history is lost when the session ends."
}
```

```question
{
  "id": "oc-memory-q3",
  "type": "multiple-choice",
  "question": "When should you clear the conversation context?",
  "options": [
    "Never",
    "Only when switching topics",
    "Every 10 messages",
    "When responses are slow"
  ],
  "correct": 1,
  "explanation": "Clear conversation when switching topics to prevent cross-contamination between unrelated discussions."
}
```

```question
{
  "id": "oc-memory-q4",
  "type": "multiple-choice",
  "question": "What should you do when context exceeds 70% of the limit?",
  "options": [
    "Use a larger model",
    "Clear and reload only essentials",
    "Add more memory files",
    "Restart OpenCode"
  ],
  "correct": 1,
  "explanation": "When context gets too large, clear it and reload only the essential memory files needed for the current task."
}
```

```question
{
  "id": "oc-memory-q5",
  "type": "multiple-choice",
  "question": "How do you update memory files during a session?",
  "options": [
    "Edit them manually outside OpenCode",
    "Ask OpenCode to update them",
    "Memory files cannot be updated",
    "Use the /memory-update command"
  ],
  "correct": 1,
  "explanation": "You can ask OpenCode to update memory files, and it will use the edit tool to make changes."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Memory files persist information across sessions, unlike conversation history
- Store project memory in `.opencode/memory/` within the project
- Clear conversation when switching topics to prevent cross-contamination
- Monitor context size and reload essentials when it exceeds 70%
- Use descriptive sections in memory files for easy retrieval
- Memory files should be dated and regularly updated
- Subagents help isolate complex tasks from main context