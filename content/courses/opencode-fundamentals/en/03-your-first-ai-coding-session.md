---
title: "Your First AI Coding Session"
description: "Walk through a complete AI-assisted coding session using OpenCode. Learn how to ask questions, review code suggestions, and apply changes to your project."
order: 3
duration: "45 min"
difficulty: "beginner"
---

# Your First AI Coding Session

## Starting a Session

Launch OpenCode in your project directory:

```bash
cd your-project
opencode
```

The AI agent will automatically detect your project type and provide relevant assistance.

---

## Understanding the Interface

```
OpenCode v1.x.x
Connected to: gpt-4o
Project: your-project
>
```

| Element | Description |
|---------|-------------|
| `>` prompt | Ready for your input |
| `Connected to:` | Shows active LLM provider |
| `Project:` | Current working directory |

### Input Commands

| Command | Action |
|---------|--------|
| Type message | Send to AI |
| `/help` | Show available commands |
| `/quit` or `/exit` | Exit OpenCode |
| `/clear` | Clear conversation |
| `/history` | Show conversation history |

---

## Example Session: Fixing a Bug

Let's walk through a real-world scenario — fixing a bug in a Python function.

### Step 1: Describe the Problem

```
> I have a function that calculates the average of a list, but it's returning 
  wrong results for empty lists. Can you help me fix it?
```

### Step 2: Share the Code

```
> Here's the function:
  
  def calculate_average(numbers):
      total = sum(numbers)
      return total / len(numbers)
```

### Step 3: Get the Fix

The AI will analyze your code and suggest:

```
The issue is that dividing by zero (when the list is empty) raises a 
ZeroDivisionError. Here's the fixed version:

def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
```

### Step 4: Apply the Change

```
> Can you apply this fix to my file at src/utils.py?
```

OpenCode will use the `edit` tool to update your file.

---

## Working with Files

### Reading Files

```
> Read the contents of src/main.py
```

OpenCode uses the `read` tool to fetch file contents and display them.

### Searching Files

```
> Find all Python files that import requests
```

OpenCode uses `grep` to search file contents.

```
> Find all configuration files in this project
```

OpenCode uses `glob` to find files by pattern.

### Creating Files

```
> Create a new Python file at src/helpers.py with a function to validate email addresses
```

OpenCode uses the `write` tool to create new files.

---

## Best Practices for Prompts

### Be Specific

| ❌ Vague | ✅ Specific |
|----------|------------|
| "Fix my code" | "Fix the ZeroDivisionError in calculate_average() when the list is empty" |
| "Add a function" | "Add a Python function that validates email addresses using regex" |
| "Optimize this" | "Optimize this SQL query to use an index instead of full table scan" |

### Provide Context

```
> I'm working on a Django REST API. The User model has fields: id, email, 
  name, created_at. I need a function to check if a user is active 
  (created within the last 30 days).
```

### Ask Follow-up Questions

```
> Can you explain why you used datetime.timedelta instead of dateutil.relativedelta?
```

---

## Using Tools Effectively

### The read Tool

```
> Read src/config.py and explain what each setting does
```

### The bash Tool

```
> Run the tests in my project using pytest
```

### The grep Tool

```
> Search for all TODO comments in the codebase
```

### The glob Tool

```
> Find all JavaScript files in the src/components directory
```

---

## Handling Errors

### When the AI Doesn't Understand

```
> I need to make the thing better
```

If the AI asks for clarification, provide more details:

```
> Sorry, I mean I need to optimize the database query in the UserViewSet 
  to reduce the number of queries from 5 to 1.
```

### When the AI Makes Mistakes

```
> That's not quite right. The function should return a tuple of (average, count), 
  not just the average.
```

---

## Saving and Loading Sessions

### Save Session

```
> /save my-session
```

### Load Session

```
> /load my-session
```

### View History

```
> /history
```

---

## Practice Questions

```question
{
  "id": "oc-first-q1",
  "type": "multiple-choice",
  "question": "What command clears the conversation history in OpenCode?",
  "options": [
    "/clear",
    "/reset",
    "/new",
    "/empty"
  ],
  "correct": 0,
  "explanation": "The /clear command clears the current conversation while maintaining the session."
}
```

```question
{
  "id": "oc-first-q2",
  "type": "multiple-choice",
  "question": "Which tool does OpenCode use to search for text patterns in files?",
  "options": [
    "bash",
    "read",
    "grep",
    "glob"
  ],
  "correct": 2,
  "explanation": "The grep tool searches file contents using regular expressions, making it ideal for finding text patterns like TODO comments."
}
```

```question
{
  "id": "oc-first-q3",
  "type": "multiple-choice",
  "question": "What's the best way to ask OpenCode to fix a specific bug?",
  "options": [
    "Fix my code",
    "Fix the ZeroDivisionError in calculate_average() when the list is empty",
    "Make it work",
    "Debug this"
  ],
  "correct": 1,
  "explanation": "Specific prompts that include the error type, function name, and conditions help the AI provide accurate fixes."
}
```

```question
{
  "id": "oc-first-q4",
  "type": "multiple-choice",
  "question": "Which tool creates new files in OpenCode?",
  "options": [
    "read",
    "write",
    "edit",
    "bash"
  ],
  "correct": 1,
  "explanation": "The write tool creates new files or completely overwrites existing ones with new content."
}
```

```question
{
  "id": "oc-first-q5",
  "type": "multiple-choice",
  "question": "How do you exit an OpenCode session?",
  "options": [
    "Ctrl+C",
    "/quit or /exit",
    "/stop",
    "close"
  ],
  "correct": 1,
  "explanation": "Use /quit or /exit commands to gracefully exit an OpenCode session."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Start OpenCode in your project directory for context-aware assistance
- Be specific in your prompts — include error types, file names, and expected behavior
- OpenCode uses tools (read, write, edit, grep, glob, bash) to interact with your project
- You can save and load sessions for continuity
- Ask follow-up questions to understand the AI's reasoning
- The AI will ask for clarification when prompts are too vague