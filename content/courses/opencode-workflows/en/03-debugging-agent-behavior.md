---
title: "Debugging Agent Behavior"
description: "Diagnose and fix issues with OpenCode agents. Learn debugging techniques, log analysis, and how to trace the request lifecycle to identify problems."
order: 3
duration: "45 min"
difficulty: "intermediate"
---

# Debugging Agent Behavior

## Debug Mode

Enable debug mode to see detailed information:

```bash
opencode --debug
```

Or set the environment variable:

```bash
export OPENCODE_DEBUG=1
opencode
```

---

## What Debug Mode Shows

### Request Lifecycle

```
[DEBUG] Request received: "Fix the bug in main.py"
[DEBUG] Agent routing: Matched 'default' agent (description: "General-purpose coding assistant")
[DEBUG] Tool selection: Using 'read' tool for src/main.py
[DEBUG] Permission check: read tool allowed for src/**
[DEBUG] Tool execution: read src/main.py (234 bytes)
[DEBUG] Tool selection: Using 'edit' tool for src/main.py
[DEBUG] Permission check: edit tool allowed for src/**
[DEBUG] Tool execution: edit src/main.py (success)
[DEBUG] Response generated: "Fixed the bug by adding null check"
```

### Tool Invocations

```
[DEBUG] Tool: read
[DEBUG] Arguments: {"path": "src/main.py"}
[DEBUG] Result: Success (234 bytes)

[DEBUG] Tool: edit
[DEBUG] Arguments: {"path": "src/main.py", "old": "...", "new": "..."}
[DEBUG] Result: Success
```

### Permission Checks

```
[DEBUG] Permission check: bash tool
[DEBUG] Command: "npm test"
[DEBUG] Pattern: "npm *" → ALLOWED
[DEBUG] Permission granted
```

---

## Common Issues and Solutions

### Issue: Agent Not Responding

**Symptoms:**
- No response after sending a message
- Long delays with no output

**Debug Steps:**

1. Check API key validity:
```bash
echo $OPENAI_API_KEY | head -c 10
```

2. Verify network connectivity:
```bash
curl -I https://api.openai.com
```

3. Check debug logs for timeout errors

**Solution:**
```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "timeout": 60000
    }
  }
}
```

### Issue: Wrong Agent Selected

**Symptoms:**
- Request goes to wrong agent
- Agent doesn't understand the task

**Debug Steps:**

1. Check agent descriptions in debug output
2. Review routing rules
3. Test pattern matching

**Solution:**
```json
{
  "agentRouting": {
    "rules": [
      {
        "pattern": "specific-pattern",
        "agent": "target-agent"
      }
    ]
  }
}
```

### Issue: Permission Denied

**Symptoms:**
- "Permission denied" errors
- Tools not executing

**Debug Steps:**

1. Check permission rules in debug output
2. Verify pattern matching
3. Review deny vs allow order

**Solution:**
```json
{
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *"],
      "deny": ["sudo *"]
    }
  ]
}
```

---

## Log Analysis

### Log Levels

| Level | Output | Use Case |
|-------|--------|----------|
| Default | Basic info | Normal operation |
| Debug | Detailed traces | Troubleshooting |
| Verbose | Full content | Deep debugging |

### Enabling Verbose Mode

```bash
opencode --verbose
```

Or in interactive session:

```
> /verbose
```

---

## Tracing Requests

### Manual Trace

Follow this checklist for manual debugging:

1. **Check configuration**:
```bash
cat opencode.json | jq .
```

2. **Verify API key**:
```bash
echo "Key starts with: ${OPENAI_API_KEY:0:8}..."
```

3. **Test API directly**:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "test"}]}'
```

4. **Check debug output**:
```bash
opencode --debug 2>&1 | grep -i error
```

---

## Performance Debugging

### Slow Responses

**Causes:**
- Large context window
- Complex prompts
- Network latency
- Rate limiting

**Solutions:**

| Cause | Solution |
|-------|----------|
| Large context | Clear conversation with `/clear` |
| Complex prompts | Simplify instructions |
| Network latency | Check connection, use closer region |
| Rate limiting | Add delays, upgrade API plan |

### Token Usage

Monitor token usage in debug output:

```
[DEBUG] Token usage: prompt=1234, completion=567, total=1801
[DEBUG] Estimated cost: $0.03
```

---

## Practice Questions

```question
{
  "id": "oc-debug-q1",
  "type": "multiple-choice",
  "question": "How do you enable debug mode in OpenCode?",
  "options": [
    "Set OPENCODE_DEBUG=1 or use --debug flag",
    "Add debug: true to opencode.json",
    "Use /debug command",
    "All of the above"
  ],
  "correct": 3,
  "explanation": "Debug mode can be enabled via environment variable, command-line flag, or interactive command."
}
```

```question
{
  "id": "oc-debug-q2",
  "type": "multiple-choice",
  "question": "What does the request lifecycle trace show?",
  "options": [
    "Only the final response",
    "Agent routing, tool selection, permissions, and execution",
    "Only API calls",
    "Only errors"
  ],
  "correct": 1,
  "explanation": "The request lifecycle trace shows the complete flow from agent routing through tool execution."
}
```

```question
{
  "id": "oc-debug-q3",
  "type": "multiple-choice",
  "question": "What should you check first when an agent doesn't respond?",
  "options": [
    "Reinstall OpenCode",
    "API key validity and network connectivity",
    "Your code for bugs",
    "The agent's temperature setting"
  ],
  "correct": 1,
  "explanation": "Always check API key validity and network connectivity first, as these are the most common causes of no response."
}
```

```question
{
  "id": "oc-debug-q4",
  "type": "multiple-choice",
  "question": "How do you clear the conversation to reduce context size?",
  "options": [
    "Restart OpenCode",
    "Use /clear command",
    "Delete the config file",
    "Use /reset command"
  ],
  "correct": 1,
  "explanation": "The /clear command clears the conversation history while maintaining the session, reducing context size."
}
```

```question
{
  "id": "oc-debug-q5",
  "type": "multiple-choice",
  "question": "What does the token usage line in debug output show?",
  "options": [
    "Only response length",
    "Prompt tokens, completion tokens, and total cost",
    "Only errors",
    "Only network latency"
  ],
  "correct": 1,
  "explanation": "Token usage shows prompt tokens, completion tokens, total tokens, and estimated cost for the request."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Enable debug mode with `--debug` flag or `OPENCODE_DEBUG=1`
- Debug output shows agent routing, tool selection, permissions, and execution
- Always check API key validity and network connectivity first
- Use `/clear` to reduce context size when responses are slow
- Token usage and cost estimates appear in debug output
- Log levels can be adjusted for more or less detail
- Manual tracing follows a systematic checklist approach