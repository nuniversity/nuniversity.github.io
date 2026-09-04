#!/usr/bin/env python3
"""Tests for generate_skill.py script."""
import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from generate_skill import (
    validate_name,
    name_to_title,
    name_to_trigger,
    generate_skill_md,
    generate_skill_json,
    create_skill_directory,
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


def test_name_to_title():
    """Test name to title conversion."""
    assert name_to_title("my-skill") == "My Skill"
    assert name_to_title("course-writer") == "Course Writer"
    assert name_to_title("game-builder") == "Game Builder"
    assert name_to_title("a") == "A"
    print("✓ test_name_to_title passed")


def test_name_to_trigger():
    """Test name to trigger pattern conversion."""
    assert name_to_trigger("my-skill") == "content/my-skill/**"
    assert name_to_trigger("course-writer") == "content/course-writer/**"
    assert name_to_trigger("game-builder") == "content/game-builder/**"
    print("✓ test_name_to_trigger passed")


def test_generate_skill_md():
    """Test skill.md generation."""
    content = generate_skill_md(
        name="test-skill",
        description="A test skill for validation",
        trigger_pattern="content/test-skill/**",
        purpose="test skill content",
    )

    assert "---" in content
    assert "name: test-skill" in content
    assert "description: A test skill for validation" in content
    assert "triggers:" in content
    assert "content/test-skill/**" in content
    assert "## Activation Context" in content
    assert "## Instructions" in content
    print("✓ test_generate_skill_md passed")


def test_generate_skill_json():
    """Test skill.json generation."""
    data = generate_skill_json(
        name="test-skill",
        description="A test skill for validation",
        trigger_pattern="content/test-skill/**",
    )

    assert data["name"] == "test-skill"
    assert data["version"] == "1.0.0"
    assert data["description"] == "A test skill for validation"
    assert data["type"] == "skill"
    assert "content/test-skill/**" in data["triggers"]
    print("✓ test_generate_skill_json passed")


def test_create_skill_directory():
    """Test complete skill directory creation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"

        errors = create_skill_directory(
            skill_dir=skill_dir,
            name="test-skill",
            description="A test skill for validation",
            trigger_pattern="content/test-skill/**",
            purpose="test skill content",
        )

        assert errors == []
        assert skill_dir.exists()
        assert (skill_dir / "skill.md").exists()
        assert (skill_dir / "assets" / "skill.json").exists()
        assert (skill_dir / "scripts").exists()
        assert (skill_dir / "references").exists()
        assert (skill_dir / "examples").exists()

        skill_md_content = (skill_dir / "skill.md").read_text()
        assert "name: test-skill" in skill_md_content

        skill_json_data = json.loads((skill_dir / "assets" / "skill.json").read_text())
        assert skill_json_data["name"] == "test-skill"

    print("✓ test_create_skill_directory passed")


def test_create_skill_directory_existing():
    """Test skill directory creation with existing directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        (skill_dir / "skill.md").write_text("existing content")

        errors = create_skill_directory(
            skill_dir=skill_dir,
            name="test-skill",
            description="A test skill for validation",
            trigger_pattern="content/test-skill/**",
            purpose="test skill content",
        )

        assert errors == []
        assert skill_dir.exists()
        assert (skill_dir / "skill.md").exists()

    print("✓ test_create_skill_directory_existing passed")


def test_with_real_files():
    """Test with actual file operations."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "real-skill"

        os.environ["OPENCODE_SKILL_NAME"] = "real-skill"
        os.environ["OPENCODE_SKILL_DESCRIPTION"] = "A real skill for testing"
        os.environ["OPENCODE_SKILL_DIR"] = str(skill_dir)

        try:
            from generate_skill import main
            exit_code = main()
            assert exit_code == 0
            assert skill_dir.exists()
            assert (skill_dir / "skill.md").exists()
            assert (skill_dir / "assets" / "skill.json").exists()
        finally:
            del os.environ["OPENCODE_SKILL_NAME"]
            del os.environ["OPENCODE_SKILL_DESCRIPTION"]
            del os.environ["OPENCODE_SKILL_DIR"]

    print("✓ test_with_real_files passed")


if __name__ == "__main__":
    test_validate_name()
    test_name_to_title()
    test_name_to_trigger()
    test_generate_skill_md()
    test_generate_skill_json()
    test_create_skill_directory()
    test_create_skill_directory_existing()
    test_with_real_files()
    print("\n✓ All tests passed!")
