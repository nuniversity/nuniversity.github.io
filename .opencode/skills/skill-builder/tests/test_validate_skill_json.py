#!/usr/bin/env python3
"""Tests for validate_skill_json.py script."""
import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from validate_skill_json import (
    validate_name,
    validate_version,
    validate_skill_json,
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
    print("✓ test_validate_name passed")


def test_validate_version():
    """Test version validation."""
    assert validate_version("1.0.0") == []
    assert validate_version("0.1.0") == []
    assert validate_version("10.20.30") == []
    assert validate_version("") != []
    assert validate_version("1.0") != []
    assert validate_version("v1.0.0") != []
    assert validate_version("1.0.0-beta") != []
    print("✓ test_validate_version passed")


def test_validate_skill_json():
    """Test complete skill.json validation."""
    valid = {
        "name": "test-skill",
        "version": "1.0.0",
        "description": "A test skill for validation",
        "type": "skill",
    }
    errors, warnings = validate_skill_json(valid)
    assert errors == []

    missing_name = {
        "version": "1.0.0",
        "description": "A test skill for validation",
        "type": "skill",
    }
    errors, warnings = validate_skill_json(missing_name)
    assert any("name" in e.lower() for e in errors)

    missing_version = {
        "name": "test-skill",
        "description": "A test skill for validation",
        "type": "skill",
    }
    errors, warnings = validate_skill_json(missing_version)
    assert any("version" in e.lower() for e in errors)

    missing_desc = {
        "name": "test-skill",
        "version": "1.0.0",
        "type": "skill",
    }
    errors, warnings = validate_skill_json(missing_desc)
    assert any("description" in e.lower() for e in errors)

    bad_type = {
        "name": "test-skill",
        "version": "1.0.0",
        "description": "A test skill for validation",
        "type": "invalid",
    }
    errors, warnings = validate_skill_json(bad_type)
    assert any("type" in e.lower() for e in errors)

    bad_name = {
        "name": "My_Skill",
        "version": "1.0.0",
        "description": "A test skill for validation",
        "type": "skill",
    }
    errors, warnings = validate_skill_json(bad_name)
    assert any("kebab-case" in e for e in errors)

    bad_version = {
        "name": "test-skill",
        "version": "1.0",
        "description": "A test skill for validation",
        "type": "skill",
    }
    errors, warnings = validate_skill_json(bad_version)
    assert any("semver" in e for e in errors)

    # Test warning: empty triggers
    empty_triggers = {
        "name": "test-skill",
        "version": "1.0.0",
        "description": "A test skill for validation",
        "type": "skill",
        "triggers": [],
    }
    errors, warnings = validate_skill_json(empty_triggers)
    assert errors == []
    assert any("triggers" in w.lower() for w in warnings)

    # Test warning: short description
    short_desc = {
        "name": "test-skill",
        "version": "1.0.0",
        "description": "Short",
        "type": "skill",
    }
    errors, warnings = validate_skill_json(short_desc)
    assert errors == []
    assert any("short" in w.lower() for w in warnings)

    print("✓ test_validate_skill_json passed")


def test_with_real_files():
    """Test with actual file operations."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_json = Path(tmpdir) / "skill.json"
        skill_json.write_text(json.dumps({
            "name": "real-skill",
            "version": "1.0.0",
            "description": "A real skill for testing with actual files",
            "type": "skill",
            "triggers": ["content/**"],
        }))

        data = json.loads(skill_json.read_text())
        errors, warnings = validate_skill_json(data)
        assert errors == []

    print("✓ test_with_real_files passed")


if __name__ == "__main__":
    test_validate_name()
    test_validate_version()
    test_validate_skill_json()
    test_with_real_files()
    print("\n✓ All tests passed!")
