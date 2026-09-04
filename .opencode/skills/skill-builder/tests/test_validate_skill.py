#!/usr/bin/env python3
"""Tests for validate_skill.py script."""
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from validate_skill import (
    validate_name,
    validate_description,
    validate_triggers,
    validate_frontmatter,
    validate_body_sections,
    validate_skill_directory,
)


def test_validate_name():
    """Test skill name validation."""
    assert validate_name("my-skill") == []
    assert validate_name("skill-name-123") == []
    assert validate_name("a") == []
    assert validate_name("") != []
    assert validate_name("My-Skill") != []
    assert validate_name("my_skill") != []
    assert validate_name("my skill") != []
    assert validate_name("123-skill") != []
    print("✓ test_validate_name passed")


def test_validate_description():
    """Test skill description validation."""
    assert validate_description("Generates publication-ready Markdown files") == []
    assert validate_description("A") != []
    assert validate_description("") != []
    assert validate_description("Helps with code") != []
    assert validate_description("A tool for processing") != []
    assert validate_description("Validates Markdown frontmatter for lesson files") == []
    print("✓ test_validate_description passed")


def test_validate_triggers():
    """Test skill triggers validation."""
    assert validate_triggers(["content/**"]) == []
    assert validate_triggers(["content/**", "docs/**"]) == []
    assert validate_triggers([]) != []
    assert validate_triggers(None) != []
    assert validate_triggers([""]) != []
    assert validate_triggers([123]) != []
    print("✓ test_validate_triggers passed")


def test_validate_frontmatter():
    """Test complete frontmatter validation."""
    valid = {
        "name": "test-skill",
        "description": "Validates skill structure and content",
        "triggers": ["test/**"],
    }
    assert validate_frontmatter(valid) == []

    missing_name = {
        "description": "A test skill for validation",
        "triggers": ["test/**"],
    }
    assert validate_frontmatter(missing_name) != []

    missing_desc = {
        "name": "test-skill",
        "triggers": ["test/**"],
    }
    assert validate_frontmatter(missing_desc) != []

    missing_triggers = {
        "name": "test-skill",
        "description": "A test skill for validation",
    }
    assert validate_frontmatter(missing_triggers) != []

    print("✓ test_validate_frontmatter passed")


def test_validate_body_sections():
    """Test body section validation."""
    good_content = """---
name: test-skill
description: A test skill
triggers:
  - test/**
---

## Activation Context

When this skill activates.

---

## Instructions

Do something.
"""
    errors, warnings = validate_body_sections(good_content)
    assert errors == []
    assert warnings == []

    bad_content = """---
name: test-skill
description: A test skill
triggers:
  - test/**
---

Some content without sections.
"""
    errors, warnings = validate_body_sections(bad_content)
    assert len(errors) > 0
    assert "Missing required section: '## Activation Context'" in errors[0]

    print("✓ test_validate_body_sections passed")


def test_validate_skill_directory():
    """Test complete skill directory validation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        skill_md = skill_dir / "skill.md"
        skill_md.write_text("""---
name: test-skill
description: Validates skill structure and content
triggers:
  - test/**
---

## Activation Context

When this skill activates.

---

## Instructions

Do something.
""")

        assets_dir = skill_dir / "assets"
        assets_dir.mkdir()
        skill_json = assets_dir / "skill.json"
        skill_json.write_text('{"name": "test-skill", "version": "1.0.0"}')

        errors, warnings = validate_skill_directory(skill_dir)
        assert errors == []

    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "bad-skill"
        skill_dir.mkdir()

        errors, warnings = validate_skill_directory(skill_dir)
        assert len(errors) > 0

    print("✓ test_validate_skill_directory passed")


if __name__ == "__main__":
    test_validate_name()
    test_validate_description()
    test_validate_triggers()
    test_validate_frontmatter()
    test_validate_body_sections()
    test_validate_skill_directory()
    print("\n✓ All tests passed!")
