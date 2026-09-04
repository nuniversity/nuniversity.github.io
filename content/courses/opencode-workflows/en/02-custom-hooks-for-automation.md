---
title: "Custom Hooks for Automation"
description: "Build custom hooks to automate repetitive tasks in OpenCode. Learn the hook lifecycle, event types, and how to create hooks that validate, transform, and guard your workflow."
order: 2
duration: "45 min"
difficulty: "intermediate"
---

# Custom Hooks for Automation

## What Are Hooks?

Hooks are scripts that run automatically at specific points in the OpenCode lifecycle. They enable:

- **Validation** — Check inputs/outputs before processing
- **Transformation** — Modify data between steps
- **Guarding** — Block dangerous operations
- **Logging** — Track activity for auditing

---

## Hook Events

| Event | When It Fires | Use Case |
|-------|---------------|----------|
| `session.start` | Session begins | Load context, check environment |
| `session.end` | Session ends | Cleanup, save state |
| `file.write` | Before file is written | Validate content, format code |
| `file.read` | Before file is read | Access control, logging |
| `tool.execute.before` | Before tool runs | Permission checks, validation |
| `tool.execute.after` | After tool runs | Post-processing, logging |

---

## Hook Structure

```
.opencode/hooks/my-hook/
├── hook.json          # Hook configuration
├── scripts/
│   └── handler.py     # Hook script
└── examples/
    └── sample-input.json
```

### hook.json

```json
{
  "name": "validate-frontmatter",
  "description": "Validates YAML frontmatter in lesson files",
  "event": "file.write",
  "pattern": "content/courses/**/*.md",
  "script": ".opencode/hooks/validate-frontmatter/scripts/handler.py",
  "blocking": true
}
```

| Field | Description |
|-------|-------------|
| `name` | Unique identifier |
| `description` | What the hook does |
| `event` | When to trigger |
| `pattern` | File pattern to match (glob) |
| `script` | Path to handler script |
| `blocking` | If true, blocks operation on failure |

---

## Creating a Validation Hook

### Step 1: Create Directory

```bash
mkdir -p .opencode/hooks/validate-frontmatter/scripts
```

### Step 2: Create hook.json

```json
{
  "name": "validate-frontmatter",
  "description": "Validates YAML frontmatter in Markdown files",
  "event": "file.write",
  "pattern": "**/*.md",
  "script": ".opencode/hooks/validate-frontmatter/scripts/handler.py",
  "blocking": true
}
```

### Step 3: Create Handler Script

```python
#!/usr/bin/env python3
"""Validate YAML frontmatter in Markdown files.

Exit Codes:
    0 - Validation passed
    1 - Warning (non-blocking)
    2 - Validation failed (blocking)
"""
import os
import sys
import yaml
from pathlib import Path


def extract_frontmatter(content: str) -> tuple[str | None, str]:
    """Extract YAML frontmatter from Markdown content."""
    if not content.startswith("---"):
        return None, content

    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, content

    return parts[1].strip(), parts[2]


def validate_frontmatter(frontmatter: str) -> list[str]:
    """Validate frontmatter structure and return errors."""
    errors = []

    try:
        data = yaml.safe_load(frontmatter)
    except yaml.YAMLError as e:
        return [f"Invalid YAML: {e}"]

    required_fields = ["title", "description", "order"]
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if "order" in data:
        if not isinstance(data["order"], int):
            errors.append("Field 'order' must be an integer")
        elif data["order"] < 1:
            errors.append("Field 'order' must be >= 1")

    return errors


def main() -> int:
    """Main hook entry point."""
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        print("WARNING: OPENCODE_FILE_PATH not set", file=sys.stderr)
        return 1

    path = Path(file_path)
    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        return 2

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"ERROR: Cannot read file: {e}", file=sys.stderr)
        return 2

    frontmatter, _ = extract_frontmatter(content)
    if frontmatter is None:
        print(f"WARNING: No frontmatter found in {file_path}")
        return 1

    errors = validate_frontmatter(frontmatter)
    if errors:
        for error in errors:
            print(f"VALIDATION ERROR: {error}", file=sys.stderr)
        return 2

    print(f"VALIDATION PASSED: {file_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

### Step 4: Make Script Executable

```bash
chmod +x .opencode/hooks/validate-frontmatter/scripts/handler.py
```

---

## Registering Hooks

Add hooks to `opencode.json`:

```json
{
  "hooks": {
    "file.write": [
      {
        "name": "validate-frontmatter",
        "pattern": "content/courses/**/*.md",
        "script": ".opencode/hooks/validate-frontmatter/scripts/handler.py",
        "blocking": true
      }
    ],
    "session.start": [
      {
        "name": "load-context",
        "script": ".opencode/hooks/load-context/scripts/handler.py",
        "blocking": false
      }
    ]
  }
}
```

---

## Guard Hooks

Guard hooks block dangerous operations:

```python
#!/usr/bin/env python3
"""Block writes to protected directories."""
import os
import sys
from pathlib import Path


PROTECTED_PATTERNS = [
    ".env",
    "secrets/**",
    "*.key",
    "*.pem",
]


def is_protected(path: Path) -> bool:
    """Check if path matches protected patterns."""
    from fnmatch import fnmatch

    path_str = str(path)
    for pattern in PROTECTED_PATTERNS:
        if fnmatch(path_str, pattern):
            return True
        if fnmatch(path.name, pattern):
            return True
    return False


def main() -> int:
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        return 0

    path = Path(file_path)
    if is_protected(path):
        print(f"BLOCKED: Cannot write to protected file: {file_path}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
```

---

## Hook Debugging

### Enable Debug Logging

```bash
export OPENCODE_DEBUG=1
opencode
```

### Test Hooks Manually

```bash
OPENCODE_FILE_PATH=test.md python .opencode/hooks/validate-frontmatter/scripts/handler.py
```

### Check Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Pass | Continue operation |
| `1` | Warning | Log, continue |
| `2` | Block | Stop operation, show error |

---

## Practice Questions

```question
{
  "id": "oc-hooks-q1",
  "type": "multiple-choice",
  "question": "What happens when a blocking hook returns exit code 2?",
  "options": [
    "Operation continues with warning",
    "Operation is blocked and error is shown",
    "Hook is skipped",
    "OpenCode crashes"
  ],
  "correct": 1,
  "explanation": "Exit code 2 blocks the operation and displays the error message to the user."
}
```

```question
{
  "id": "oc-hooks-q2",
  "type": "multiple-choice",
  "question": "Which hook event fires before a file is written?",
  "options": [
    "file.write",
    "file.save",
    "file.commit",
    "file.create"
  ],
  "correct": 0,
  "explanation": "The file.write event fires before a file is written, allowing validation or transformation."
}
```

```question
{
  "id": "oc-hooks-q3",
  "type": "multiple-choice",
  "question": "What field in hook.json specifies which files trigger the hook?",
  "options": [
    "filter",
    "match",
    "pattern",
    "glob"
  ],
  "correct": 2,
  "explanation": "The pattern field uses glob syntax to specify which files trigger the hook."
}
```

```question
{
  "id": "oc-hooks-q4",
  "type": "multiple-choice",
  "question": "How do you test a hook manually?",
  "options": [
    "Run opencode --test-hook",
    "Set OPENCODE_FILE_PATH and run the script directly",
    "Use the /hook-test command",
    "Add a test flag to hook.json"
  ],
  "correct": 1,
  "explanation": "Set the OPENCODE_FILE_PATH environment variable and run the handler script directly to test."
}
```

```question
{
  "id": "oc-hooks-q5",
  "type": "multiple-choice",
  "question": "What is a guard hook used for?",
  "options": [
    "Logging file operations",
    "Blocking dangerous operations",
    "Transforming content",
    "Loading context"
  ],
  "correct": 1,
  "explanation": "Guard hooks check for dangerous patterns and block operations that match protected files or commands."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Hooks are scripts that run automatically at specific lifecycle points
- The `file.write` event is ideal for validating content before saving
- Use exit code 0 for pass, 1 for warning, 2 for blocking
- Guard hooks protect sensitive files and dangerous operations
- Hooks are registered in `opencode.json` under the `hooks` key
- The `pattern` field uses glob syntax to match files
- Test hooks manually by setting OPENCODE_FILE_PATH and running the script