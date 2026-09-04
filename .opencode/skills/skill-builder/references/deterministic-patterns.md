# Deterministic Patterns for Agentic Development

## Core Principle

**Deterministic Agentic Harness**: Build the most deterministic harness possible by creating deterministic AI agentic development pipelines based on deterministic skills, hooks, plugins, and tools. Let the uncertainty and decision-making stay with the LLM models — they call or loop into engineering using deterministic solutions.

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM LAYER (Flexible)                      │
│  • Understanding user intent                                │
│  • Making decisions                                         │
│  • Orchestrating workflows                                  │
│  • Handling edge cases                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │ calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 HARNESS LAYER (Deterministic)                │
│  • Skills: Structured prompts with known outputs            │
│  • Hooks: Schema validation on every write                  │
│  • Plugins: Automated quality gates                         │
│  • Tools: Python scripts with exit codes                    │
└─────────────────────────────────────────────────────────────┘
```

## The Three Pillars

### 1. Enablement

Give agents the knowledge and tools they need:
- Instructions and documentation
- Custom agents for specialized tasks
- Skills and MCP servers for extended capabilities

### 2. Enforcement

Make it impossible for agents to break the rules:
- Specs (TypeScript, OpenAPI, JSON Schema)
- Agent hooks (intercept at tool-use level)
- Orchestration layers that control agent workflows

### 3. Final Gate

Traditional CI/CD as the last line of defense:
- Automated tests
- Static analysis
- Security scanning
- Build verification

## Pattern: Schema-Validated Tool Execution

### The Problem

When LLMs emit tool arguments directly:
```json
{ "service": "auth", "window": "24 hours" }
{ "service": "Auth Service", "window": "yesterday" }
{ "service": ["auth"], "window": 24 }
```

### The Solution

Contract-driven execution:
```
Agent emits tool call
        ↓
Raw arguments (untrusted)
        ↓
Schema validation
   ┌───────────────┐
   │ Invalid       │ → reject and replan
   └───────────────┘
          ↓
       Valid
          ↓
Tool executes
          ↓
Infrastructure queried safely
```

## Pattern: Hook-Based Enforcement

### Prompt vs Hook

> "Prompts request behavior; hooks require it. A prompt instruction is a probabilistic 'should-do' that degrades under task pressure. A hook is a deterministic 'must-do' that runs as code outside the agent's context."

### Hook Types

| Type | Purpose | Example |
|------|---------|---------|
| Pre-tool-use | Validate before execution | Schema validation |
| Post-tool-use | Validate after execution | Output verification |
| Session-start | Load context | Project memory |
| Session-end | Save state | Audit logging |

## Pattern: Exit Code Convention

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Pass | Proceed with operation |
| `1` | Warning | Log warning, proceed |
| `2` | Block | Stop operation, report error |

### Implementation

```python
#!/usr/bin/env python3
import sys

def validate(input_data):
    errors = []
    # Validation logic here
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(validate(input_data))
```

## Pattern: Deterministic Caching

### The Problem

Even with perfect validation, agents repeat work:
```python
execute_tool("fetch_logs", {"service": "auth", "window": "24h"})
execute_tool("fetch_logs", {"window": "24h", "service": "auth"})
```

Same intent, same backend, different argument order.

### The Solution

Deterministic caching:
1. Normalize inputs (sort keys, standardize values)
2. Compute hash of normalized input
3. Check cache before execution
4. Store results with TTL

## Pattern: Compiled AI

### The Paradigm

Use the LLM once to generate a solution, validate it thoroughly, then run it deterministically without further AI calls.

### Benefits

- **96% task completion** rate
- Eliminates per-transaction AI costs
- Deterministic execution
- Easy to debug and audit

### Implementation

1. **Compile Phase**: LLM generates schemas, templates, code
2. **Validation Phase**: Verify all artifacts
3. **Execution Phase**: Run deterministically

## Best Practices

### 1. Validate on Write

Every file mutation triggers schema validation via hooks.

### 2. Never Trust the Agent

LLM output is always treated as untrusted input — validated before persistence.

### 3. Fail Fast

Hook exit code `2` blocks the operation immediately; stderr becomes agent feedback.

### 4. Idempotent Hooks

Running the same validation twice produces the same result.

### 5. Deterministic Outputs

Temperature `0.3–0.5`, structured prompts, rigid output schemas.

## Anti-patterns

### ❌ Hope-Based Governance

```markdown
# BAD
Please follow architecture rules...
```

### ❌ Enforcement-Based Governance

```python
# GOOD
if violates_architecture(file):
    reject(file)
    explain_violation(file)
```

### ❌ Self-Policing

```markdown
# BAD
Make sure to validate your output...
```

### ❌ External Enforcement

```python
# GOOD
hook = validate_output(output)
if not hook.passed:
    reject(output)
    provide_feedback(hook.errors)
```

## References

- [Agent Hooks: The Secret to Controlling AI Agents](https://htek.dev/articles/agent-hooks-controlling-ai-codebase)
- [Agentic AI: Schema-Validated Tool Execution](https://dev.to/sudarshangouda/agentic-ai-schema-validated-tool-execution-and-deterministic-caching-2d14)
- [Hooks & Deterministic Lifecycle Enforcement](https://learn.agentpatterns.ai/tool-engineering/hooks-and-deterministic-enforcement/)
- [Compiled AI: Engineering Deterministic LLM Systems](https://dev.to/boristep/compiled-ai-engineering-deterministic-llm-systems-33o4)
