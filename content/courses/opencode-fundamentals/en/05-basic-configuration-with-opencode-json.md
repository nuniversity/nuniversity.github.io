---
title: "Basic Configuration with opencode.json"
description: "Configure OpenCode using opencode.json. Learn the configuration schema, agents, providers, permissions, and how to customize behavior for your projects."
order: 5
duration: "45 min"
difficulty: "beginner"
---

# Basic Configuration with opencode.json

## Configuration File Locations

OpenCode searches for configuration in this order:

| Priority | Location | Purpose |
|----------|----------|---------|
| 1 | `.opencode/config.json` | Project-specific (preferred) |
| 2 | `opencode.json` | Project-specific (legacy) |
| 3 | `~/.config/opencode/config.json` | User-wide defaults |

> [!TIP]
> For new projects, use `.opencode/config.json`. The root `opencode.json` is kept for backward compatibility.

---

## Basic Configuration Structure

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {},
  "providers": {},
  "permissions": [],
  "skills": {}
}
```

---

## Configuring Agents

Agents are AI assistants with specific models and behaviors.

### Simple Agent

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "General-purpose coding assistant"
    }
  }
}
```

### Multiple Agents

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "General-purpose coding assistant"
    },
    "reviewer": {
      "model": "claude-sonnet-4-20250514",
      "description": "Code review specialist"
    },
    "fast": {
      "model": "gpt-4o-mini",
      "description": "Quick tasks and simple questions"
    }
  }
}
```

### Agent with Custom Prompt

```json
{
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Senior software engineer",
      "prompt": "You are a senior software engineer with 10+ years of experience. Focus on clean, maintainable code. Always consider edge cases and error handling."
    }
  }
}
```

---

## Configuring Providers

Providers define how OpenCode connects to LLM services.

### OpenAI

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o"
    }
  }
}
```

### Anthropic

```json
{
  "providers": {
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}",
      "model": "claude-sonnet-4-20250514"
    }
  }
}
```

### Multiple Providers

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    },
    "google": {
      "apiKey": "${GOOGLE_API_KEY}"
    }
  }
}
```

---

## Configuring Permissions

Permissions control what actions agents can perform.

### Basic Permissions

```json
{
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *", "pip *"],
      "deny": ["rm -rf /", "sudo *"]
    },
    {
      "tool": "write",
      "allow": ["src/**", "docs/**"],
      "deny": [".env", "secrets/**"]
    }
  ]
}
```

### Permission Rules

| Rule | Description |
|------|-------------|
| `tool` | The tool to control |
| `allow` | Patterns that are permitted |
| `deny` | Patterns that are blocked |
| Order | Deny rules are checked first |

---

## Configuring Skills

Skills are reusable instruction packages.

```json
{
  "skills": {
    "react-component": {
      "manifest": "skills/react-component/skill.yaml",
      "autoLoad": true,
      "matchPattern": "react component|jsx"
    },
    "python-helper": {
      "manifest": "skills/python-helper/skill.yaml",
      "autoLoad": false
    }
  }
}
```

| Option | Description |
|--------|-------------|
| `manifest` | Path to skill manifest file |
| `autoLoad` | Load automatically when pattern matches |
| `matchPattern` | Regex pattern to trigger auto-load |

---

## Configuring MCP Servers

MCP servers connect OpenCode to external tools and services.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["mcp-server-fs.js"],
      "env": {
        "ALLOWED_PATHS": "/home/user/projects"
      }
    },
    "database": {
      "command": "python",
      "args": ["mcp-server-db.py"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

---

## Complete Example

Here's a complete `opencode.json` for a typical project:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "default": {
      "model": "gpt-4o",
      "description": "Primary coding assistant",
      "prompt": "You are a senior developer. Focus on clean, testable code."
    },
    "reviewer": {
      "model": "claude-sonnet-4-20250514",
      "description": "Code review specialist"
    }
  },
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    },
    "anthropic": {
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  },
  "permissions": [
    {
      "tool": "bash",
      "allow": ["npm *", "git *", "pytest *"],
      "deny": ["rm -rf *", "sudo *"]
    },
    {
      "tool": "write",
      "allow": ["src/**", "tests/**", "docs/**"],
      "deny": [".env", "secrets/**", "*.key"]
    }
  ],
  "skills": {
    "customize-opencode": {
      "manifest": ".opencode/skills/customize-opencode/skill.yaml"
    }
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## Validation

OpenCode validates your configuration on startup. Common errors:

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid JSON" | Syntax error | Check JSON formatting |
| "Unknown provider" | Unsupported provider | Check provider documentation |
| "Invalid model" | Wrong model name | Verify model exists |
| "Permission conflict" | Overlapping rules | Review permission order |

---

## Environment Variable Substitution

Use `${VARIABLE_NAME}` to reference environment variables:

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}"
    }
  }
}
```

This keeps sensitive data out of your configuration files.

---

## Practice Questions

```question
{
  "id": "oc-config-q1",
  "type": "multiple-choice",
  "question": "Which configuration location is recommended for new projects?",
  "options": [
    "opencode.json in project root",
    ".opencode/config.json",
    "~/.config/opencode/config.json",
    "~/.opencode/config.json"
  ],
  "correct": 1,
  "explanation": ".opencode/config.json is the recommended location for new projects as it keeps configuration organized and can be selectively version-controlled."
}
```

```question
{
  "id": "oc-config-q2",
  "type": "multiple-choice",
  "question": "How do you reference environment variables in opencode.json?",
  "options": [
    "{{VARIABLE}}",
    "$VARIABLE",
    "${VARIABLE}",
    "%VARIABLE%"
  ],
  "correct": 2,
  "explanation": "Use ${VARIABLE_NAME} syntax to reference environment variables in opencode.json, which keeps sensitive data out of configuration files."
}
```

```question
{
  "id": "oc-config-q3",
  "type": "multiple-choice",
  "question": "What happens when a permission command matches both allow and deny rules?",
  "options": [
    "Allow takes precedence",
    "Deny takes precedence",
    "The first rule wins",
    "An error is thrown"
  ],
  "correct": 1,
  "explanation": "Deny rules are checked first. If a command matches both allow and deny patterns, the deny rule takes precedence for security."
}
```

```question
{
  "id": "oc-config-q4",
  "type": "multiple-choice",
  "question": "What does the autoLoad option do for skills?",
  "options": [
    "Loads the skill on startup",
    "Loads the skill when pattern matches",
    "Loads the skill manually",
    "Disables the skill"
  ],
  "correct": 1,
  "explanation": "When autoLoad is true, the skill loads automatically when the user's input matches the matchPattern regex."
}
```

```question
{
  "id": "oc-config-q5",
  "type": "multiple-choice",
  "question": "Which field is required to define an agent?",
  "options": [
    "model and prompt",
    "model and description",
    "name and version",
    "model and constraints"
  ],
  "correct": 1,
  "explanation": "An agent requires at minimum a model (which LLM to use) and a description (used for routing). All other fields are optional."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Use `.opencode/config.json` for new projects (preferred over root `opencode.json`)
- Agents require at least `model` and `description` fields
- Environment variables are referenced using `${VARIABLE_NAME}` syntax
- Deny rules always take precedence over allow rules in permissions
- Skills can auto-load when user input matches a pattern
- MCP servers run as separate processes and communicate via JSON-RPC
- OpenCode validates your configuration on startup and reports errors