---
name: skill-builder
description: Meta-skill for creating deterministic, production-ready OpenCode skills with proper structure, validation, and integration into the agentic harness
triggers:
  - .opencode/skills/**
  - "**/*skill*"
---

# Skill Builder — Deterministic Skill Creation

## Core Principle

**Deterministic Agentic Harness**: Build the most deterministic harness possible by creating deterministic AI agentic development pipelines based on deterministic skills, hooks, plugins, and tools. Let the uncertainty and decision-making stay with the LLM models — they call or loop into engineering using deterministic solutions.

The skill is the foundation. The LLM is the orchestrator.

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
│                 SKILL LAYER (Deterministic)                  │
│  • Structured prompts with known outputs                    │
│  • Schema validation on every write                         │
│  • Python scripts with exit codes                           │
│  • Reference materials for context                          │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles (All Mandatory for Every Skill)

| # | Principle | What It Means for Skills |
|---|-----------|--------------------------|
| 1 | **TDD** | Every script must have tests written before implementation. Red→Green→Refactor. 90% coverage. Tests go in `tests/` folder. |
| 2 | **DDD** | Each skill is a bounded context. Use ubiquitous language: lesson, course, quiz, vocabulary. No synonyms. |
| 3 | **Clean Architecture** | Scripts depend on entities, not on OpenCode internals. Exit codes are the abstraction boundary. |
| 4 | **SOLID** | SRP: one script does one thing. OCP: new skills don't modify existing ones. LSP: all hooks follow exit code contract. |
| 5 | **Clean Code** | Descriptive function names, 20 lines max, docstrings on public functions, errors to stderr. |
| 6 | **Spec-Driven** | Skill.md is the spec. Tests verify the spec. Implementation makes tests pass. |

### Standard Tool Stack

Every skill MUST use these tools (no alternatives):

| Task | Tool | Command |
|------|------|---------|
| **Package mgmt** | `uv` | `uv add`, `uv run` |
| **Linting** | `ruff` | `ruff check scripts/`, `ruff format scripts/` |
| **Security** | `bandit` | `bandit -r scripts/` |
| **Testing** | `pytest` | `pytest tests/ -v --tb=short` |
| **Pre-commit** | `pre-commit` | `pre-commit run --all-files` |

---

## Skill Anatomy

### Required Components

Every skill MUST have:

```
.opencode/skills/{skill-name}/
├── skill.md              # Skill definition (YAML frontmatter + Markdown)
└── assets/
    └── skill.json        # Skill metadata and configuration
```

### Optional Components

Skills MAY have:

```
.opencode/skills/{skill-name}/
├── scripts/              # Deterministic Python scripts
├── references/           # Reference documentation
└── examples/             # Example inputs/outputs
```

---

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
description: "..."
triggers:
  - content/**
version: "1.0.0"              # Semantic version
author: "Author Name"         # Skill author
dependencies:                 # Required packages
  - pyyaml
  - requests
metadata:
  category: "content-creation"
  audience: "developers"
---
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | kebab-case identifier (e.g., `course-writer`) |
| `description` | string | Yes | 1-2 sentence trigger description |
| `triggers` | list | Yes | Glob patterns for activation |
| `version` | string | No | Semantic version (e.g., `1.0.0`) |
| `author` | string | No | Skill author name |
| `dependencies` | list | No | Required Python packages |
| `metadata` | object | No | Additional metadata |

---

## Description Best Practices

The `description` is the trigger. It must be:

1. **Specific** — Say exactly what the skill does
2. **Actionable** — Say when the agent should use it
3. **Deterministic** — Enable reliable matching

### Good Descriptions

```yaml
description: "Generates publication-ready Markdown course lesson files for the NUniversity platform"
description: "Validates Markdown frontmatter for NUniversity lesson files"
description: "Creates and validates Mermaid.js diagrams for documentation"
```

### Bad Descriptions

```yaml
description: "Helps with code"                    # Too vague
description: "A tool for processing"              # Unclear purpose
description: "Does various things"                # Not specific
```

### Description Formula

```
[Action verb] + [what it creates/validates] + [for what context]
```

Examples:
- "Generates publication-ready Markdown course lesson files for the NUniversity platform"
- "Validates quiz and vocabulary game JSON files for the NUniversity platform"
- "Creates and validates Mermaid.js diagrams for documentation and architecture visualization"

---

## Body Structure

### Required Sections

Every skill.md MUST have:

```markdown
## Activation Context

When and how this skill activates.

---

## Instructions

Detailed instructions for the skill behavior.
```

### Optional Sections

Skills MAY have:

```markdown
## Output Format Rules

Expected output structure and format.

---

## Quality Rules

Validation requirements and constraints.

---

## Locale Handling

Internationalization requirements (if applicable).

---

## Reference

Links to additional documentation.
```

### Section Specifications

| Section | Purpose | Required |
|---------|---------|----------|
| `Activation Context` | When/how skill activates | Yes |
| `Instructions` | Detailed behavior specification | Yes |
| `Output Format Rules` | Expected output structure | No |
| `Quality Rules` | Validation requirements | No |
| `Locale Handling` | i18n requirements | No |
| `Reference` | Links to docs | No |

---

## Script Integration

### Script Requirements

Scripts in `scripts/` MUST:

1. Be executable Python scripts (no bash — use Python for all deterministic logic)
2. Use deterministic exit codes (0=pass, 1=warn, 2=block)
3. Read from environment variables (`OPENCODE_FILE_PATH`, etc.)
4. Write errors to stderr (`print(msg, file=sys.stderr)`)
5. Return structured output
6. Have tests written BEFORE implementation (TDD: Red→Green→Refactor)
7. Pass `ruff check` and `ruff format --check`
8. Pass `bandit -r` security scan
9. Meet 90% test coverage minimum
10. Follow Clean Architecture (depend on entities, not frameworks)
11. Follow SRP (one script = one responsibility)
12. Use descriptive function names (no abbreviations)
13. Include docstrings on all public functions
14. Be under 20 lines per function

### Exit Code Convention

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Pass | Proceed with operation |
| `1` | Warning | Log warning, proceed |
| `2` | Block | Stop operation, report error |

### Environment Variables

Scripts receive input via environment variables:

```python
import os
file_path = os.environ.get("OPENCODE_FILE_PATH", "")
```

### Error Output

Errors MUST go to stderr:

```python
import sys
print("ERROR: Something went wrong", file=sys.stderr)
```

### Example Script Template

```python
#!/usr/bin/env python3
"""Script description.

Exit Codes:
    0 - Success
    1 - Warning
    2 - Blocking error
"""
import os
import sys
from pathlib import Path

def main() -> int:
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        print("ERROR: OPENCODE_FILE_PATH not set", file=sys.stderr)
        return 2

    path = Path(file_path)
    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        return 2

    # Validation logic here
    # ...

    return 0

if __name__ == "__main__":
    sys.exit(main())
```

---

## Reference Material

### What to Put in references/

- Official specifications
- Schema definitions
- Best practices guides
- Troubleshooting guides
- Comparison tables

### Reference File Naming

- `opencode-skills-spec.md` — Official skills spec
- `opencode-hooks-spec.md` — Official hooks spec
- `deterministic-patterns.md` — Deterministic patterns
- `schema-validation.md` — Schema validation patterns
- `troubleshooting.md` — Common issues

### Reference Content Structure

```markdown
# Reference Title

## Overview

Brief overview of the topic.

## Specification

Detailed specification.

## Examples

Code examples.

## Best Practices

Recommended patterns.

## Common Issues

Known issues and solutions.
```

---

## Example Patterns

### Example Structure

Examples use flat files with descriptive prefixes:

```
examples/
├── skill.md                # Basic valid skill template
├── skill.json              # Basic valid skill.json
├── valid-skill.md          # Full valid skill with all sections
├── valid-skill.json        # Full valid skill.json with metadata
├── invalid-skill.md        # Invalid skill (documents errors)
├── invalid-skill.json      # Invalid skill.json (documents errors)
├── minimal-skill.md        # Minimal valid skill
├── advanced-skill.md       # Advanced skill with all features
├── advanced-skill.json     # Advanced skill.json with dependencies
├── with-hooks-skill.md     # Skill with hook integration
└── with-hooks-skill.json   # Skill.json with hook metadata
```

### Example File Naming

- `valid-skill.md` — Valid skill example (hyphen-separated)
- `invalid-skill.md` — Invalid skill example
- `minimal-skill.md` — Minimal valid skill
- `advanced-skill.md` — Skill with all features
- `*-skill.json` — Corresponding skill.json files

---

## Validation Checklist

Before releasing a skill, verify:

### Design Principles
- [ ] TDD: Tests written before implementation (Red→Green→Refactor)
- [ ] TDD: 90% test coverage minimum
- [ ] TDD: Tests are in `tests/` folder (NOT in `scripts/`)
- [ ] DDD: Bounded context is clear (what domain does this skill serve?)
- [ ] DDD: Ubiquitous language used (no synonyms for domain terms)
- [ ] Clean Architecture: Scripts depend on entities, not on OpenCode internals
- [ ] SOLID: SRP — one script does one thing
- [ ] SOLID: OCP — new skills don't modify existing ones
- [ ] SOLID: DIP — exit codes are the abstraction boundary
- [ ] Clean Code: Descriptive names, functions under 20 lines, docstrings present
- [ ] Spec-Driven: Skill.md serves as the specification

### Frontmatter
- [ ] `name` is kebab-case
- [ ] `description` is specific and triggerable
- [ ] `triggers` has at least one pattern
- [ ] All fields are properly formatted

### Body
- [ ] `Activation Context` section exists
- [ ] `Instructions` section exists
- [ ] Instructions are clear and complete
- [ ] No ambiguous language

### Scripts
- [ ] Scripts are Python (not bash)
- [ ] Scripts have deterministic exit codes
- [ ] Scripts read from environment variables
- [ ] Scripts write errors to stderr
- [ ] Scripts handle edge cases
- [ ] Scripts pass `ruff check`
- [ ] Scripts pass `ruff format --check`
- [ ] Scripts pass `bandit -r`
- [ ] Each script has a test file in `tests/`

### Examples
- [ ] At least one valid example
- [ ] At least one invalid example (if applicable)
- [ ] Examples cover edge cases

### References
- [ ] References are up-to-date
- [ ] References link to official docs
- [ ] References include examples

### Integration
- [ ] Skill integrates with hooks (if applicable)
- [ ] Quality gates are defined
- [ ] Error handling is documented

---

## Common Patterns

### Pattern: Validation Skill

**Purpose:** Validates input against a schema

**Structure:**
```
validate-{thing}/
├── skill.md
├── scripts/validate_{thing}.py
├── assets/
│   ├── skill.json
│   └── schema.json
├── examples/
│   ├── valid.json
│   └── invalid.json
└── references/
    └── schema-spec.md
```

**Exit Codes:**
- `0` — Validation passed
- `2` — Validation failed (blocking)

### Pattern: Generation Skill

**Purpose:** Generates content from templates

**Structure:**
```
generate-{thing}/
├── skill.md
├── scripts/generate_{thing}.py
├── assets/
│   └── skill.json
├── examples/
│   ├── input.json
│   └── output.md
└── references/
    └── template-spec.md
```

**Exit Codes:**
- `0` — Generation successful
- `2` — Generation failed

### Pattern: Integration Skill

**Purpose:** Connects external services

**Structure:**
```
integrate-{service}/
├── skill.md
├── scripts/integrate_{service}.py
├── assets/
│   └── skill.json
├── examples/
│   └── config.json
└── references/
    └── api-spec.md
```

**Exit Codes:**
- `0` — Integration successful
- `1` — Warning (non-critical issue)
- `2` — Integration failed

---

## Anti-patterns

### ❌ Vague Descriptions

```yaml
# BAD
description: "Helps with code"
description: "A useful tool"
description: "Processes things"

# GOOD
description: "Validates Markdown frontmatter for NUniversity lesson files"
description: "Generates publication-ready quiz JSON files"
```

### ❌ Missing Exit Codes

```python
# BAD
import sys
sys.exit(0)  # Always succeeds

# GOOD
import sys
if errors:
    print("ERROR: Validation failed", file=sys.stderr)
    sys.exit(2)
sys.exit(0)
```

### ❌ No Examples

```
# BAD
examples/
  (empty)

# GOOD
examples/
├── valid_lesson.md
├── invalid_lesson.md
└── README.md
```

### ❌ No References

```
# BAD
references/
  (empty)

# GOOD
references/
├── opencode-skills-spec.md
├── schema-spec.md
└── best-practices.md
```

### ❌ Tight Coupling to LLM

```markdown
# BAD
## Instructions
Use Claude to generate content...

# GOOD
## Instructions
Generate content following this schema...
```

---

## Testing

### Unit Test

Test individual scripts:

```bash
python scripts/validate_skill.py --test examples/valid-skill/
```

### Integration Test

Test skill + hook combinations:

```bash
python tests/test_skill.py --skill course-writer --input "create lesson"
```

### E2E Test

Test complete workflows by running all validation gates:

```bash
python tests/test_skill.py  # Runs all integration tests
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Skill not triggering | Vague description | Make description specific |
| Script fails | Missing env var | Check `OPENCODE_FILE_PATH` |
| Validation errors | Invalid schema | Check `references/schema.json` |
| Hook not running | Wrong pattern | Check `triggers` in frontmatter |

### Debug Mode

Enable debug logging:

```bash
export OPENCODE_DEBUG=1
python scripts/validate_skill.py
```

---

## Integration with Hooks

### Hook Registration

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

### Hook → Skill Mapping

| Hook Event | Skill Action |
|------------|--------------|
| `file.write` | Validate output |
| `tool.read` | Guard sensitive files |
| `session.start` | Load context |

---

## Integration with Plugins

### Plugin Structure

```
.opencode/plugins/nuniversity-plugin/
├── src/
│   └── index.ts
├── assets/
├── examples/
├── references/
└── scripts/
```

### Plugin → Skill Mapping

| Plugin Event | Skill Action |
|--------------|--------------|
| `file.edited` | Trigger validation |
| `tool.execute.before` | Guard tool calls |
| `tool.execute.after` | Log results |

---

## Quality Gates

### Gate 1: Frontmatter Validation

```bash
python scripts/validate_frontmatter.py
```

### Gate 2: Schema Validation

```bash
python scripts/validate_skill_json.py
```

### Gate 3: Script Validation

```bash
python scripts/validate_skill.py
```

### Gate 4: Integration Test

```bash
python tests/test_skill.py
```

---

## Reference

### Official Documentation

- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [OpenCode Plugins](https://opencode.ai/docs/plugins/)
- [OpenCode Hooks](https://opencode.ai/docs/hooks/)

### Internal References

- `references/opencode-skills-spec.md`
- `references/opencode-hooks-spec.md`
- `references/opencode-plugins-spec.md`
- `references/deterministic-patterns.md`
- `references/schema-validation.md`
- `references/skill-quality-checklist.md`
- `references/tool-calling-best-practices.md`
- `references/troubleshooting.md`

### Asset Schemas

- `assets/skill-schema.json` — JSON Schema for skill.json validation
- `assets/hook-schema.json` — JSON Schema for hook configuration
- `assets/test-harness-schema.json` — JSON Schema for test harness structure
- `assets/quality-gates-schema.json` — JSON Schema for quality gate definitions
