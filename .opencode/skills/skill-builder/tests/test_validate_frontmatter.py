#!/usr/bin/env python3
"""Tests for validate_frontmatter.py script."""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from validate_frontmatter import (
    extract_frontmatter,
    validate_frontmatter,
)


def test_extract_frontmatter():
    """Test YAML frontmatter extraction."""
    good_content = """---
name: test-skill
description: A test skill for validation purposes
triggers:
  - test/**
---

# Test Skill

Some content here.
"""
    data, error = extract_frontmatter(good_content)
    assert error is None
    assert data is not None
    assert data["name"] == "test-skill"

    bad_content = """# No frontmatter

Some content here.
"""
    data, error = extract_frontmatter(bad_content)
    assert error is not None
    assert data is None

    invalid_yaml = """---
name: test-skill
  invalid: yaml: structure
---
"""
    data, error = extract_frontmatter(invalid_yaml)
    assert error is not None

    print("✓ test_extract_frontmatter passed")


def test_validate_frontmatter():
    """Test frontmatter validation."""
    valid = {
        "name": "test-skill",
        "description": "Generates test skill for validation purposes",
        "triggers": ["test/**"],
    }
    errors, warnings = validate_frontmatter(valid)
    assert errors == []
    assert warnings == []

    missing_name = {
        "description": "Generates test skill for validation purposes",
        "triggers": ["test/**"],
    }
    errors, warnings = validate_frontmatter(missing_name)
    assert any("name" in e.lower() for e in errors)

    missing_desc = {
        "name": "test-skill",
        "triggers": ["test/**"],
    }
    errors, warnings = validate_frontmatter(missing_desc)
    assert any("description" in e.lower() for e in errors)

    missing_triggers = {
        "name": "test-skill",
        "description": "Generates test skill for validation purposes",
    }
    errors, warnings = validate_frontmatter(missing_triggers)
    assert any("trigger" in e.lower() for e in errors)

    bad_name = {
        "name": "My_Skill",
        "description": "Generates test skill for validation purposes",
        "triggers": ["test/**"],
    }
    errors, warnings = validate_frontmatter(bad_name)
    assert any("kebab-case" in e for e in errors)

    short_desc = {
        "name": "test-skill",
        "description": "Short",
        "triggers": ["test/**"],
    }
    errors, warnings = validate_frontmatter(short_desc)
    assert any("short" in e.lower() for e in errors)

    empty_triggers = {
        "name": "test-skill",
        "description": "Generates test skill for validation purposes",
        "triggers": [],
    }
    errors, warnings = validate_frontmatter(empty_triggers)
    assert any("empty" in e.lower() for e in errors)

    # Test warning: description starts with article
    article_desc = {
        "name": "test-skill",
        "description": "A skill that does something useful",
        "triggers": ["test/**"],
    }
    errors, warnings = validate_frontmatter(article_desc)
    assert errors == []
    assert any("article" in w.lower() for w in warnings)

    # Test warning: invalid semver
    bad_version = {
        "name": "test-skill",
        "description": "Generates test skill for validation purposes",
        "triggers": ["test/**"],
        "version": "v1.0",
    }
    errors, warnings = validate_frontmatter(bad_version)
    assert errors == []
    assert any("semver" in w.lower() for w in warnings)

    print("✓ test_validate_frontmatter passed")


def test_with_real_files():
    """Test with actual file operations."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_md = Path(tmpdir) / "skill.md"
        skill_md.write_text("""---
name: real-skill
description: A real skill for testing with actual files
triggers:
  - content/**
---

## Activation Context

When this skill activates.

---

## Instructions

Do something.
""")

        content = skill_md.read_text()
        data, error = extract_frontmatter(content)
        assert error is None
        assert data["name"] == "real-skill"

        errors, warnings = validate_frontmatter(data)
        assert errors == []

    print("✓ test_with_real_files passed")


if __name__ == "__main__":
    test_extract_frontmatter()
    test_validate_frontmatter()
    test_with_real_files()
    print("\n✓ All tests passed!")
