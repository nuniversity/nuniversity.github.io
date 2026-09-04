# Schema Validation Patterns

## Overview

Schema validation ensures that data conforms to expected structures before processing. In agentic systems, this is critical for preventing invalid data from reaching infrastructure.

## Why Schema Validation Matters

### The Problem

LLMs reason in natural language, not type-safe systems:
```json
{ "service": "auth", "window": "24 hours" }
{ "service": "Auth Service", "window": "yesterday" }
{ "service": ["auth"], "window": 24 }
```

### The Consequence

- Invalid Elasticsearch queries
- Full index scans
- Query builder crashes
- Silent data corruption
- Retry loops amplify failures

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

## JSON Schema

### Basic Structure

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Skill Schema",
  "type": "object",
  "required": ["name", "version", "description"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "description": {
      "type": "string",
      "minLength": 20
    }
  },
  "additionalProperties": false
}
```

### Key Properties

| Property | Purpose |
|----------|---------|
| `type` | Expected data type |
| `required` | Mandatory fields |
| `pattern` | Regex validation |
| `minLength` | Minimum length |
| `enum` | Allowed values |

## Validation in Python

### Using Pydantic

```python
from pydantic import BaseModel, Field

class SkillSchema(BaseModel):
    name: str = Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")
    version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    description: str = Field(min_length=20)

# Validate
try:
    skill = SkillSchema(**data)
except ValidationError as e:
    print(f"Validation failed: {e}")
```

### Using JSON Schema

```python
import jsonschema

schema = {
    "type": "object",
    "required": ["name", "version"],
    "properties": {
        "name": {"type": "string"},
        "version": {"type": "string"},
    }
}

try:
    jsonschema.validate(instance=data, schema=schema)
except jsonschema.ValidationError as e:
    print(f"Validation failed: {e.message}")
```

## Validation Scripts

### Script Template

```python
#!/usr/bin/env python3
"""Validate data against schema.

Exit Codes:
    0 - Validation passed
    2 - Blocking error
"""
import json
import sys
from pathlib import Path

def validate(data: dict) -> list[str]:
    errors = []
    # Validation logic
    return errors

def main() -> int:
    errors = validate(data)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

### Integration with Hooks

```json
{
  "hooks": {
    "file.write": [
      {
        "name": "validate-skill",
        "pattern": ".opencode/skills/**/skill.json",
        "script": ".opencode/skills/skill-builder/scripts/validate_skill_json.py",
        "blocking": true
      }
    ]
  }
}
```

## Best Practices

### 1. Validate Early

Validate as close to the source as possible:
- Frontmatter validation on write
- Schema validation before processing
- Output validation before persistence

### 2. Provide Clear Errors

Error messages should be actionable:
```python
# BAD
print("Invalid data")

# GOOD
print("Missing required field: 'name' in skill.json")
```

### 3. Use Typed Errors

Different error types for different responses:
```python
# Warning (non-blocking)
print("WARNING: Optional field missing", file=sys.stderr)

# Error (blocking)
print("ERROR: Required field missing", file=sys.stderr)
```

### 4. Test Validation

Test with both valid and invalid inputs:
```python
def test_valid_input():
    assert validate(valid_data) == []

def test_invalid_input():
    assert validate(invalid_data) != []
```

### 5. Document Schemas

Provide schema documentation:
- JSON Schema files
- Example valid/invalid data
- Common validation errors

## Common Patterns

### Pattern: Field Presence

```python
def validate_fields(data: dict, required: list[str]) -> list[str]:
    errors = []
    for field in required:
        if field not in data:
            errors.append(f"Missing required field: '{field}'")
    return errors
```

### Pattern: Type Checking

```python
def validate_types(data: dict, types: dict) -> list[str]:
    errors = []
    for field, expected_type in types.items():
        if field in data and not isinstance(data[field], expected_type):
            errors.append(f"Field '{field}' must be {expected_type.__name__}")
    return errors
```

### Pattern: Pattern Matching

```python
import re

def validate_patterns(data: dict, patterns: dict) -> list[str]:
    errors = []
    for field, pattern in patterns.items():
        if field in data and not re.match(pattern, str(data[field])):
            errors.append(f"Field '{field}' does not match pattern: {pattern}")
    return errors
```

### Pattern: Enum Validation

```python
def validate_enum(data: dict, field: str, allowed: list) -> list[str]:
    errors = []
    if field in data and data[field] not in allowed:
        errors.append(f"Field '{field}' must be one of: {allowed}")
    return errors
```

## References

- [JSON Schema Specification](https://json-schema.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [jsonschema Library](https://python-jsonschema.readthedocs.io/)
