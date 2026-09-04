---
name: with-hooks-skill
description: A skill demonstrating integration with hooks
triggers:
  - content/hooks/**
---

# With Hooks Skill Example

This skill demonstrates integration with OpenCode hooks.

---

## Activation Context

Activate when the user requests hook integration examples.

---

## Instructions

### Step 1: Understand Hooks

This skill uses hooks to validate output:

1. **Pre-write Hook**: Validates frontmatter before saving
2. **Post-write Hook**: Verifies content after saving

### Step 2: Create Content

1. **Generate Content**
   - Follow skill instructions
   - Ensure valid frontmatter
   - Use consistent formatting

2. **Validate Output**
   - Run validation scripts
   - Check for errors
   - Fix any issues

### Step 3: Save Content

1. **Trigger Hooks**
   - Save file to trigger hooks
   - Wait for hook validation
   - Handle any errors

2. **Verify Success**
   - Check hook output
   - Verify file was saved
   - Confirm no errors

---

## Hook Configuration

### In opencode.json

```json
{
  "hooks": {
    "file.write": [
      {
        "name": "validate-frontmatter",
        "pattern": "content/hooks/**/*.md",
        "script": ".opencode/hooks/validate-frontmatter/scripts/validate_frontmatter.py",
        "blocking": true
      }
    ]
  }
}
```

### Hook Behavior

| Hook | Type | Blocking | Purpose |
|------|------|----------|---------|
| validate-frontmatter | pre-write | Yes | Validate frontmatter |

---

## Output Format

### Required Fields

- title: The title of the content
- description: A brief description

### Optional Fields

- tags: List of tags for categorization

---

## Quality Rules

- Rule 1: All content must be valid Markdown
- Rule 2: Frontmatter must be valid
- Rule 3: Hooks must pass

---

## Reference

See `references/hooks.md` for more details.
