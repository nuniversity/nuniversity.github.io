# Skill Quality Checklist

## Overview

Use this checklist to verify that a skill meets all quality standards before deployment.

## Pre-Deployment Checklist

### Structure

- [ ] Skill directory follows naming convention (`kebab-case`)
- [ ] All required files exist (`skill.md`, `assets/skill.json`)
- [ ] Scripts directory exists (if applicable)
- [ ] References directory exists (if applicable)
- [ ] Examples directory exists (if applicable)

### Frontmatter

- [ ] `name` is kebab-case
- [ ] `name` is unique across all skills
- [ ] `description` is 20-200 characters
- [ ] `description` clearly states what the skill does
- [ ] `description` clearly states when to use it
- [ ] `triggers` list is not empty
- [ ] `triggers` patterns are specific (not `**/*`)

### Content

- [ ] `## Activation Context` section exists
- [ ] `## Instructions` section exists
- [ ] Instructions are step-by-step
- [ ] Instructions are clear and actionable
- [ ] Output format is documented (if applicable)
- [ ] Quality rules are documented (if applicable)
- [ ] References are linked (if applicable)

### Scripts

- [ ] Scripts are executable (`chmod +x`)
- [ ] Scripts have shebang line (`#!/usr/bin/env python3`)
- [ ] Scripts use exit codes (0, 1, 2)
- [ ] Scripts write errors to stderr
- [ ] Scripts have unit tests
- [ ] Scripts handle edge cases

### Assets

- [ ] `skill.json` exists
- [ ] `skill.json` is valid JSON
- [ ] `skill.json` matches frontmatter metadata
- [ ] All schema files are valid

### References

- [ ] Reference docs are accurate
- [ ] Reference docs are up-to-date
- [ ] Links are valid
- [ ] Examples are correct

### Examples

- [ ] Valid examples pass validation
- [ ] Invalid examples fail validation
- [ ] Examples cover edge cases
- [ ] Examples are well-documented

## Quality Metrics

### Documentation Quality

| Metric | Target | Status |
|--------|--------|--------|
| Description length | 20-200 chars | [ ] |
| Instructions length | 500+ words | [ ] |
| Examples provided | 3+ | [ ] |
| References linked | 3+ | [ ] |

### Script Quality

| Metric | Target | Status |
|--------|--------|--------|
| Test coverage | 90%+ | [ ] |
| Exit code usage | 0, 1, 2 only | [ ] |
| Error messages | Actionable | [ ] |
| Edge cases handled | All | [ ] |

### Integration Quality

| Metric | Target | Status |
|--------|--------|--------|
| Hook registration | Valid | [ ] |
| Plugin compatibility | Verified | [ ] |
| Memory integration | Working | [ ] |
| Tool compatibility | Verified | [ ] |

## Testing Procedures

### Run All Tests

```bash
# Run full test suite with coverage
pytest tests/ -v --cov=scripts --cov-fail-under=90

# Run specific test files
pytest tests/test_generate_skill.py -v
pytest tests/test_validate_frontmatter.py -v
pytest tests/test_validate_skill_json.py -v
pytest tests/test_validate_skill.py -v
pytest tests/test_test_skill.py -v
pytest tests/test_main_coverage.py -v
```

### Run Validation Scripts

```bash
# Validate skill directory structure
OPENCODE_SKILL_DIR=/path/to/skill python scripts/validate_skill.py

# Validate skill.md frontmatter
OPENCODE_FILE_PATH=/path/to/skill.md python scripts/validate_frontmatter.py

# Validate skill.json metadata
OPENCODE_FILE_PATH=/path/to/skill.json python scripts/validate_skill_json.py

# Run integration checks
OPENCODE_SKILL_DIR=/path/to/skill python tests/skill_tester.py
```

### Manual Testing

1. **Skill Activation**: Does the skill trigger correctly?
2. **Instruction Following**: Does the agent follow instructions?
3. **Output Quality**: Is the output correct and complete?
4. **Error Handling**: Does the skill handle errors gracefully?

### Integration Testing

1. **Hook Testing**: Do hooks validate correctly?
2. **Plugin Testing**: Do plugins extend functionality?
3. **Memory Testing**: Does memory persist correctly?
4. **Tool Testing**: Do tools work as expected?

## Common Issues

### Issue: Skill Not Triggering

**Symptoms**: Agent doesn't use the skill when expected.

**Causes**:
- Description is too vague
- Triggers are not specific enough
- File patterns don't match

**Solutions**:
- Make description more specific
- Add more specific triggers
- Verify file patterns

### Issue: Instructions Not Followed

**Symptoms**: Agent ignores skill instructions.

**Causes**:
- Instructions are unclear
- Instructions are too complex
- Instructions conflict with other skills

**Solutions**:
- Rewrite instructions clearly
- Break complex instructions into steps
- Resolve conflicts with other skills

### Issue: Scripts Failing

**Symptoms**: Validation scripts return unexpected errors.

**Causes**:
- Script not executable
- Missing dependencies
- Invalid input handling

**Solutions**:
- Run `chmod +x` on scripts
- Install dependencies
- Add input validation

## Quality Gates

### Gate 1: Structure

- All required files exist
- Directory structure is correct
- Naming conventions followed

### Gate 2: Content

- Frontmatter is valid
- Instructions are clear
- Output format is documented

### Gate 3: Scripts

- Scripts are executable
- Tests pass
- Exit codes are correct

### Gate 4: Integration

- Hooks are registered
- Plugins are compatible
- Memory is working

### Gate 5: Documentation

- References are accurate
- Examples are correct
- Links are valid

## Approval Process

### Step 1: Self-Review

- [ ] Run all validation scripts
- [ ] Check all quality metrics
- [ ] Test skill manually

### Step 2: Peer Review

- [ ] Another developer reviews skill
- [ ] Tests are run independently
- [ ] Integration is verified

### Step 3: Final Approval

- [ ] All quality gates passed
- [ ] Documentation is complete
- [ ] Deployment is approved

## References

- [Skill Development Guide](../references/opencode-skills-spec.md)
- [Quality Standards](../references/deterministic-patterns.md)
- [Testing Best Practices](../references/tool-calling-best-practices.md)
