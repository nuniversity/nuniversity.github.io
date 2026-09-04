# Troubleshooting Guide

## Common Issues

### Issue: Skill Not Triggering

**Symptoms**: Agent doesn't use the skill when expected.

**Causes**:
1. Description is too vague
2. Triggers are not specific enough
3. File patterns don't match

**Solutions**:

```bash
# Check description
cat .opencode/skills/my-skill/skill.md | head -10

# Check triggers
cat .opencode/skills/my-skill/skill.md | grep -A 5 "triggers:"

# Verify file patterns
ls -la content/
```

**Example Fix**:

```yaml
# BAD
description: "Helps with content"

# GOOD
description: "Generates publication-ready Markdown course lesson files with frontmatter validation"
```

### Issue: Instructions Not Followed

**Symptoms**: Agent ignores skill instructions.

**Causes**:
1. Instructions are unclear
2. Instructions are too complex
3. Instructions conflict with other skills

**Solutions**:

```bash
# Check instruction length
wc -l .opencode/skills/my-skill/skill.md

# Check for conflicting skills
grep -r "similar instruction" .opencode/skills/
```

**Example Fix**:

```markdown
# BAD
- Do the thing

# GOOD
### Step 1: Understand Requirements
Analyze the user's request and identify:
- What needs to be created
- What constraints exist
- What output format is expected
```

### Issue: Scripts Failing

**Symptoms**: Validation scripts return unexpected errors.

**Causes**:
1. Script not executable
2. Missing dependencies
3. Invalid input handling

**Solutions**:

```bash
# Check permissions
ls -la .opencode/skills/*/scripts/*.py

# Make executable
chmod +x .opencode/skills/*/scripts/*.py

# Check dependencies
python -c "import yaml; print('yaml ok')"

# Test script
python .opencode/skills/skill-builder/scripts/validate_skill.py /path/to/skill
```

### Issue: Exit Code 2 (Blocking)

**Symptoms**: Operations are blocked with exit code 2.

**Causes**:
1. Validation failed
2. Missing required fields
3. Invalid format

**Solutions**:

```bash
# Run validation to see errors
python scripts/validate_skill.py /path/to/skill 2>&1

# Check stderr for details
python scripts/validate_skill.py /path/to/skill 2> errors.txt
cat errors.txt
```

### Issue: Exit Code 1 (Warning)

**Symptoms**: Warnings are logged but operations proceed.

**Causes**:
1. Non-critical validation issues
2. Deprecated usage
3. Missing optional fields

**Solutions**:

```bash
# Check warnings
python scripts/validate_skill.py /path/to/skill 2>&1 | grep WARNING

# Fix warnings (optional but recommended)
# Update skill to address warnings
```

## Debugging Techniques

### 1. Verbose Output

Add verbose output to scripts:

```python
import os
import sys

VERBOSE = os.environ.get("VERBOSE", "0") == "1"

def log(message):
    if VERBOSE:
        print(f"DEBUG: {message}", file=sys.stderr)
```

### 2. Test Scripts Independently

```bash
# Test validation script
python scripts/validate_skill.py /path/to/skill

# Test with specific file
OPENCODE_FILE_PATH=/path/to/file.md python scripts/validate_frontmatter.py

# Test with environment variables
OPENCODE_SKILL_NAME=test-skill python scripts/generate_skill.py
```

### 3. Check Logs

```bash
# Check hook logs
ls -la .opencode/logs/

# Check error logs
cat .opencode/logs/errors.log

# Check debug logs
cat .opencode/logs/debug.log
```

### 4. Verify Configuration

```bash
# Check opencode.json
cat opencode.json | jq .

# Validate JSON
cat opencode.json | python -m json.tool

# Check hooks registration
cat opencode.json | jq '.hooks'
```

## Performance Issues

### Issue: Slow Validation

**Symptoms**: Validation takes too long.

**Causes**:
1. Large files
2. Complex regex patterns
3. Network calls in hooks

**Solutions**:

```python
# BAD - Network call in hook
def validate(data):
    result = requests.get("https://api.example.com/validate", json=data)
    return result.json()

# GOOD - Local validation
def validate(data):
    errors = []
    if "name" not in data:
        errors.append("Missing name")
    return errors
```

### Issue: Memory Usage

**Symptoms**: High memory usage during validation.

**Causes**:
1. Loading entire files into memory
2. Caching too many results
3. Memory leaks

**Solutions**:

```python
# BAD - Loading entire file
def validate(file_path):
    content = file_path.read_text()  # Loads entire file
    return validate_content(content)

# GOOD - Streaming validation
def validate(file_path):
    with open(file_path) as f:
        for line in f:
            if not validate_line(line):
                return False
    return True
```

## Integration Issues

### Issue: Hook Not Running

**Symptoms**: Hooks don't execute when expected.

**Causes**:
1. Hook not registered in opencode.json
2. Pattern doesn't match files
3. Script path is wrong

**Solutions**:

```bash
# Check hook registration
cat opencode.json | jq '.hooks.file.write'

# Verify pattern matches
ls -la content/courses/

# Check script path
ls -la .opencode/hooks/validate-frontmatter/scripts/
```

### Issue: Plugin Not Loading

**Symptoms**: Plugin tools are not available.

**Causes**:
1. Plugin not registered in opencode.json
2. Plugin path is wrong
3. Plugin has errors

**Solutions**:

```bash
# Check plugin registration
cat opencode.json | jq '.plugin'

# Verify plugin path
ls -la /path/to/plugin/dist/

# Test plugin
node -e "require('/path/to/plugin/dist/index.js')"
```

### Issue: Memory Not Persisting

**Symptoms**: Memory is empty after restart.

**Causes**:
1. Memory file not saved
2. Memory file path is wrong
3. Memory file permissions

**Solutions**:

```bash
# Check memory file
ls -la .opencode/memory/

# Verify memory content
cat .opencode/memory/MEMORY.md

# Check permissions
chmod 644 .opencode/memory/MEMORY.md
```

## Error Messages

### Common Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| `Missing frontmatter` | File doesn't start with `---` | Add frontmatter delimiters |
| `Invalid JSON` | JSON syntax error | Fix JSON syntax |
| `Missing required field` | Required field missing | Add missing field |
| `Invalid pattern` | Regex pattern error | Fix regex pattern |
| `Script not found` | Script path is wrong | Check script path |
| `Permission denied` | Script not executable | Run `chmod +x` |

### Error Format

```
ERROR: [category] [message]
  Location: [file:line]
  Context: [additional info]
  Suggestion: [how to fix]
```

## Getting Help

### Check Documentation

1. [Skill Development Guide](../references/opencode-skills-spec.md)
2. [Hook Specification](../references/opencode-hooks-spec.md)
3. [Plugin Specification](../references/opencode-plugins-spec.md)

### Run Diagnostics

```bash
# Run all tests with coverage
pytest tests/ -v --cov=scripts --cov-fail-under=90

# Run validation
OPENCODE_SKILL_DIR=/path/to/skill python scripts/validate_skill.py

# Run integration checks
OPENCODE_SKILL_DIR=/path/to/skill python tests/skill_tester.py
```

### Report Issues

If you encounter a bug:

1. Check existing issues
2. Run diagnostics
3. Collect error output
4. Report with full context

## References

- [Skill Development Guide](../references/opencode-skills-spec.md)
- [Hook Specification](../references/opencode-hooks-spec.md)
- [Plugin Specification](../references/opencode-plugins-spec.md)
- [Deterministic Patterns](../references/deterministic-patterns.md)
