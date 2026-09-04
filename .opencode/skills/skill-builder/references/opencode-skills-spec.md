# OpenCode Skills Specification

## Overview

Skills are modular workflow packages for AI agents. They define the procedure, guardrails, quality bar, and decision logic the agent should follow.

## Discovery and Loading

OpenCode discovers skills from skill directories and loads them progressively:

1. **Metadata** is always available through `name` and `description` frontmatter
2. **Full instructions** are loaded only when a skill is relevant
3. **Optional scripts, references, or assets** are used only when the skill asks for them

## Frontmatter Schema

### Required Fields

```yaml
---
name: skill-name              # kebab-case identifier
description: "..."            # Trigger description (1-2 sentences)
triggers:                     # File patterns that activate skill
  - content/**
---
```

### Optional Fields

```yaml
---
name: skill-name
version: "1.0.0"              # Semantic version
author: "Author Name"         # Skill author
dependencies:                 # Required packages
  - pyyaml
metadata:
  category: "content-creation"
  audience: "developers"
---
```

## Description as Trigger

The `description` is the trigger. Good descriptions:
- Say what the skill does
- Say when the agent should use it
- Are specific enough for deterministic matching

### Examples

```yaml
description: "Generates publication-ready Markdown course lesson files"
description: "Validates Markdown frontmatter for lesson files"
description: "Creates and validates Mermaid.js diagrams"
```

## Directory Structure

```
.opencode/skills/{skill-name}/
├── skill.md              # Skill definition
├── assets/
│   └── skill.json        # Skill metadata
├── scripts/              # Deterministic Python scripts
├── references/           # Reference documentation
└── examples/             # Example inputs/outputs
```

## Script Requirements

Scripts must:
1. Be executable Python scripts
2. Use deterministic exit codes
3. Read from environment variables
4. Write errors to stderr

### Exit Code Convention

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Pass | Proceed |
| `1` | Warning | Log, proceed |
| `2` | Block | Stop, report error |

## Integration Points

### With Hooks

Skills can register hooks in `opencode.json`:

```json
{
  "hooks": {
    "file.write": [
      {
        "name": "validate-frontmatter",
        "pattern": "content/courses/**/*.md",
        "script": ".opencode/hooks/validate-frontmatter/scripts/validate_frontmatter.py",
        "blocking": true
      }
    ]
  }
}
```

### With Plugins

Skills can use plugins for extended functionality:

```json
{
  "plugin": ["file:///path/to/plugin/dist/index.js"]
}
```

### With Memory

Skills can access shared memory via `.opencode/memory/MEMORY.md`.

## Best Practices

1. **Keep descriptions specific** — Vague descriptions don't trigger reliably
2. **Use deterministic scripts** — Exit codes must be predictable
3. **Provide examples** — Show valid and invalid inputs
4. **Include references** — Link to official documentation
5. **Test thoroughly** — Use the test harness

## Official Documentation

- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Hooks](https://opencode.ai/docs/hooks/)
