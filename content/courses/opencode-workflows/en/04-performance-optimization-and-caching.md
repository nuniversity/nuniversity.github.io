---
title: "Performance Optimization and Caching"
description: "Optimize OpenCode for speed and cost efficiency. Learn caching strategies, token optimization, model selection, and how to reduce API calls while maintaining quality."
order: 4
duration: "45 min"
difficulty: "intermediate"
---

# Performance Optimization and Caching

## Why Optimize?

| Metric | Impact |
|--------|--------|
| **Response Time** | Faster development workflow |
| **Token Usage** | Lower API costs |
| **Quality** | Better results with less overhead |
| **Scalability** | Handle larger projects |

---

## Token Optimization

### Understanding Tokens

Tokens are the basic units LLMs process:

| Content | Approximate Tokens |
|---------|-------------------|
| 1 word | 1-2 tokens |
| 1 line of code | 5-15 tokens |
| 1 file (100 lines) | 500-1500 tokens |

### Reduce Token Usage

1. **Clear conversation regularly**:
```
> /clear
```

2. **Be specific in prompts**:
```
❌ "Fix the bug"
✅ "Fix the ZeroDivisionError in calculate_average() when list is empty"
```

3. **Read only relevant files**:
```
❌ "Read all files in src/"
✅ "Read src/utils.py"
```

4. **Use grep before reading**:
```
> Search for "TODO" in src/ before reading entire files
```

---

## Model Selection Strategy

| Task | Model | Reason |
|------|-------|--------|
| Simple questions | gpt-4o-mini | Fast, cheap |
| Code generation | gpt-4o | Balanced |
| Complex reasoning | claude-sonnet-4-20250514 | High quality |
| Code review | claude-sonnet-4-20250514 | Thorough analysis |
| Quick edits | gpt-4o-mini | Speed |

### Configuration

```json
{
  "agents": {
    "quick": {
      "model": "gpt-4o-mini",
      "description": "Simple tasks, fast responses"
    },
    "complex": {
      "model": "gpt-4o",
      "description": "Complex tasks, high quality"
    }
  }
}
```

---

## Caching Strategies

### File Content Cache

Cache frequently accessed files:

```python
# Pseudo-code for caching
file_cache = {}

def read_file(path):
    if path in file_cache:
        return file_cache[path]
    
    content = read_from_disk(path)
    file_cache[path] = content
    return content
```

### Prompt Cache

Reuse prompt templates:

```json
{
  "skills": {
    "code-review": {
      "prompt_template": "Review this code for security issues: {code}"
    }
  }
}
```

### Result Cache

Cache AI responses for repeated queries:

```json
{
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 1000
  }
}
```

---

## Batch Processing

### Process Multiple Files

Instead of:
```
> Read file1.py
> Read file2.py
> Read file3.py
```

Use:
```
> Read all Python files in src/ and summarize their purposes
```

### Parallel Requests

```json
{
  "performance": {
    "parallelRequests": true,
    "maxConcurrent": 3
  }
}
```

---

## Context Window Management

### Monitor Context Size

```
> /verbose
Context: 4523 tokens (15% of 32k limit)
```

### Optimize Context

1. **Clear history** when switching topics
2. **Read only necessary files**
3. **Summarize long conversations**
4. **Use subagents** for isolated tasks

---

## Network Optimization

### Connection Pooling

```json
{
  "providers": {
    "openai": {
      "keepAlive": true,
      "maxConnections": 5
    }
  }
}
```

### Request Batching

```json
{
  "performance": {
    "batchRequests": true,
    "batchSize": 10
  }
}
```

---

## Performance Monitoring

### Track Metrics

```json
{
  "logging": {
    "performance": true,
    "tokenUsage": true,
    "responseTime": true
  }
}
```

### Analyze Logs

```bash
# Find slow requests
grep "response_time" opencode.log | awk '{print $NF}' | sort -n

# Calculate average tokens
grep "total_tokens" opencode.log | awk '{sum+=$NF} END {print sum/NR}'
```

---

## Practice Questions

```question
{
  "id": "oc-perf-q1",
  "type": "multiple-choice",
  "question": "What is the most effective way to reduce token usage?",
  "options": [
    "Use a smaller model",
    "Clear conversation regularly and be specific in prompts",
    "Disable caching",
    "Use only one provider"
  ],
  "correct": 1,
  "explanation": "Clearing conversation regularly and being specific in prompts reduces context size and token consumption."
}
```

```question
{
  "id": "oc-perf-q2",
  "type": "multiple-choice",
  "question": "Which model is best for quick, simple tasks?",
  "options": [
    "claude-opus-4-20250514",
    "gpt-4o",
    "gpt-4o-mini",
    "gemini-pro"
  ],
  "correct": 2,
  "explanation": "gpt-4o-mini is optimized for speed and cost, making it ideal for simple tasks where high quality isn't critical."
}
```

```question
{
  "id": "oc-perf-q3",
  "type": "multiple-choice",
  "question": "How does caching improve performance?",
  "options": [
    "It makes AI responses more accurate",
    "It reduces API calls by storing previous results",
    "It increases token limits",
    "It speeds up network connections"
  ],
  "correct": 1,
  "explanation": "Caching stores previous results so repeated queries don't require new API calls, reducing cost and latency."
}
```

```question
{
  "id": "oc-perf-q4",
  "type": "multiple-choice",
  "question": "What should you monitor to track performance?",
  "options": [
    "Only response time",
    "Token usage, response time, and cost",
    "Only errors",
    "Only network traffic"
  ],
  "correct": 1,
  "explanation": "Monitor token usage, response time, and cost to get a complete picture of performance."
}
```

```question
{
  "id": "oc-perf-q5",
  "type": "multiple-choice",
  "question": "How do you reduce context window usage?",
  "options": [
    "Use a larger model",
    "Clear conversation and read only necessary files",
    "Disable debug mode",
    "Use more agents"
  ],
  "correct": 1,
  "explanation": "Clearing conversation and reading only necessary files keeps context size manageable."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Clear conversation regularly to reduce context size
- Be specific in prompts to minimize token usage
- Use gpt-4o-mini for simple tasks, gpt-4o for complex ones
- Cache frequently accessed files and prompt templates
- Monitor token usage, response time, and cost
- Batch process multiple files instead of reading one at a time
- Network optimization reduces latency for API calls