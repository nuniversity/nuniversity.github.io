# OpenCode Hooks Specification

## Overview

Hooks intercept agent operations to enforce deterministic rules. They validate, transform, or block operations based on code, not instructions.

## Hook Types

### Pre-tool-use

Runs before a tool is executed. Used for validation:
```json
{
  "name": "validate-frontmatter",
  "pattern": "content/**/*.md",
  "script": ".opencode/hooks/validate-frontmatter/scripts/validate_frontmatter.py",
  "blocking": true
}
```

### Post-tool-use

Runs after a tool is executed. Used for verification:
```json
{
  "name": "verify-content",
  "pattern": "content/**/*.md",
  "script": ".opencode/hooks/verify-content/scripts/verify_content.py",
  "blocking": false
}
```

### Session hooks

Runs at session start/end. Used for state management.

## Configuration

### In opencode.json

```json
{
  "hooks": {
    "file.write": [
      {
        "name": "hook-name",
        "pattern": "glob-pattern",
        "script": "path/to/script.py",
        "blocking": true
      }
    ]
  }
}
```

### Hook Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique hook identifier |
| `pattern` | string | Yes | Glob pattern for files |
| `script` | string | Yes | Path to Python script |
| `blocking` | boolean | Yes | Whether to block on failure |

## Script Requirements

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENCODE_FILE_PATH` | Full path of the file |
| `OPENCODE_FILE_NAME` | Filename only |
| `OPENCODE_OPERATION` | Operation type |

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Pass | Proceed with operation |
| `1` | Warning | Log, proceed |
| `2` | Block | Stop operation |

### Error Output

Write errors to stderr:
```python
print("ERROR: Validation failed", file=sys.stderr)
```

## Examples

### Frontmatter Validation

```python
#!/usr/bin/env python3
import sys
from pathlib import Path

def validate_frontmatter(file_path: Path) -> list[str]:
    errors = []
    content = file_path.read_text()
    
    if not content.startswith("---"):
        errors.append("Missing frontmatter delimiters")
    
    return errors

def main() -> int:
    file_path = Path(os.environ.get("OPENCODE_FILE_PATH", ""))
    errors = validate_frontmatter(file_path)
    
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

### Game JSON Validation

```python
#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def validate_game(file_path: Path) -> list[str]:
    errors = []
    
    with open(file_path) as f:
        data = json.load(f)
    
    required = ["id", "title", "category", "description", "difficulty"]
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: '{field}'")
    
    return errors

def main() -> int:
    file_path = Path(os.environ.get("OPENCODE_FILE_PATH", ""))
    errors = validate_game(file_path)
    
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

## Best Practices

### 1. Make Scripts Executable

```bash
chmod +x .opencode/hooks/*/scripts/*.py
```

### 2. Use Deterministic Logic

Hooks must produce the same result every time:
```python
# GOOD
def validate(data):
    errors = []
    if "name" not in data:
        errors.append("Missing name")
    return errors

# BAD
import random
def validate(data):
    return [] if random.random() > 0.5 else ["Random error"]
```

### 3. Provide Clear Errors

```python
# BAD
print("Invalid")

# GOOD
print("ERROR: Missing required field 'name' in skill.json", file=sys.stderr)
```

### 4. Test Hooks

```python
def test_hook_valid():
    assert validate(valid_data) == []

def test_hook_invalid():
    assert validate(invalid_data) == ["Missing name"]
```

### 5. Keep Hooks Fast

Hooks block operations. Keep them fast:
- No network calls
- No complex computations
- Minimal file I/O

## Anti-patterns

### ❌ Blocking Everything

```json
// BAD
{
  "blocking": true,
  "pattern": "**/*"
}
```

### ✅ Specific Patterns

```json
// GOOD
{
  "blocking": true,
  "pattern": "content/courses/**/*.md"
}
```

### ❌ Vague Errors

```python
# BAD
print("Error", file=sys.stderr)
```

### ✅ Specific Errors

```python
# GOOD
print("ERROR: Missing required field 'category' in game.json at line 15", file=sys.stderr)
```

## Integration Points

### With Skills

Hooks validate skill structure:
```json
{
  "hooks": {
    "file.write": [
      {
        "name": "validate-skill",
        "pattern": ".opencode/skills/**/skill.md",
        "script": ".opencode/skills/skill-builder/scripts/validate_skill.py",
        "blocking": true
      }
    ]
  }
}
```

### With Plugins

Plugins can register hooks programmatically.

## References

- [OpenCode Hooks](https://opencode.ai/docs/hooks/)
- [Agent Hooks: The Secret to Controlling AI Agents](https://htek.dev/articles/agent-hooks-controlling-ai-codebase)
- [Hooks & Deterministic Lifecycle Enforcement](https://learn.agentpatterns.ai/tool-engineering/hooks-and-deterministic-enforcement/)
