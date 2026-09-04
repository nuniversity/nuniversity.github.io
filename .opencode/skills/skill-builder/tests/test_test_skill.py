#!/usr/bin/env python3
"""Tests for skill_tester.py integration test runner."""
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from skill_tester import (
    check_skill_discovery,
    check_trigger_patterns,
    check_scripts_executable,
    check_skill_json_valid,
    run_all_checks,
)


def test_skill_discovery_pass():
    """Test skill discovery with valid skill."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        skill_md = skill_dir / "skill.md"
        skill_md.write_text("""---
name: test-skill
description: A test skill for validation
triggers:
  - test/**
---

## Activation Context

When this skill activates.

---

## Instructions

Do something.
""")

        errors = check_skill_discovery(skill_dir)
        assert errors == []


def test_skill_discovery_fail():
    """Test skill discovery with missing skill.md."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        errors = check_skill_discovery(skill_dir)
        assert len(errors) > 0


def test_trigger_patterns_pass():
    """Test trigger patterns with matching files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        skill_md = skill_dir / "skill.md"
        skill_md.write_text("""---
name: test-skill
description: A test skill for validation
triggers:
  - content/**
  - docs/**
---

## Activation Context

When this skill activates.

---

## Instructions

Do something.
""")

        test_files = ["content/lesson.md", "docs/guide.md"]
        errors = check_trigger_patterns(skill_dir, test_files)
        assert errors == []


def test_trigger_patterns_fail():
    """Test trigger patterns with non-matching files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        skill_md = skill_dir / "skill.md"
        skill_md.write_text("""---
name: test-skill
description: A test skill for validation
triggers:
  - content/**
---

## Activation Context

When this skill activates.

---

## Instructions

Do something.
""")

        test_files = ["other/file.md"]
        errors = check_trigger_patterns(skill_dir, test_files)
        assert len(errors) > 0


def test_scripts_executable_pass():
    """Test scripts with proper exit codes."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        scripts_dir = skill_dir / "scripts"
        scripts_dir.mkdir()

        script = scripts_dir / "validate.py"
        script.write_text("""#!/usr/bin/env python3
import sys
sys.exit(0)
""")

        warnings = check_scripts_executable(skill_dir)
        assert warnings == []


def test_skill_json_valid_pass():
    """Test valid skill.json."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        assets_dir = skill_dir / "assets"
        assets_dir.mkdir()

        skill_json = assets_dir / "skill.json"
        skill_json.write_text(json.dumps({
            "name": "test-skill",
            "version": "1.0.0",
            "description": "A test skill for validation",
        }))

        errors = check_skill_json_valid(skill_dir)
        assert errors == []


def test_run_all_checks_pass():
    """Test complete test suite with valid skill."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        skill_md = skill_dir / "skill.md"
        skill_md.write_text("""---
name: test-skill
description: A test skill for validation purposes
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
        skill_json.write_text(json.dumps({
            "name": "test-skill",
            "version": "1.0.0",
            "description": "A test skill for validation purposes",
        }))

        exit_code = run_all_checks(skill_dir)
        assert exit_code == 0
