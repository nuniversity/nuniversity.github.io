#!/usr/bin/env python3
"""Tests for skill_tester.py integration test runner."""
import json
import sys
import tempfile
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
from skill_tester import (
    check_skill_discovery,
    check_frontmatter_valid,
    check_trigger_patterns,
    check_scripts_executable,
    check_skill_json_valid,
    check_references_exist,
    run_all_checks,
)


def test_skill_discovery_pass():
    """Test skill discovery with valid skill."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        (skill_dir / "skill.md").write_text("""---
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

        errors = check_skill_discovery(skill_dir)
        assert errors == []


def test_skill_discovery_fail():
    """Test skill discovery with missing skill.md."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        errors = check_skill_discovery(skill_dir)
        assert len(errors) > 0


def test_skill_discovery_no_frontmatter():
    """Test skill discovery with no frontmatter."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("# No frontmatter\n")

        errors = check_skill_discovery(skill_dir)
        assert any("frontmatter" in e.lower() for e in errors)


def test_frontmatter_valid_pass():
    """Test valid frontmatter passes."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("""---
name: test-skill
description: A test skill for validation purposes
triggers:
  - test/**
---

## Activation Context

When active.

---

## Instructions

Do stuff.
""")

        errors = check_frontmatter_valid(skill_dir)
        assert errors == []


def test_frontmatter_valid_fail():
    """Test invalid frontmatter fails."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("""---
name: test-skill
---

## Activation Context

When active.

---

## Instructions

Do stuff.
""")

        errors = check_frontmatter_valid(skill_dir)
        assert any("description" in e.lower() or "triggers" in e.lower()
                    for e in errors)


def test_trigger_patterns_pass():
    """Test trigger patterns with matching files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("""---
name: test-skill
description: A test skill for validation purposes
triggers:
  - content/**
  - docs/**
---

## Activation Context

When active.

---

## Instructions

Do stuff.
""")

        test_files = ["content/lesson.md", "docs/guide.md"]
        errors = check_trigger_patterns(skill_dir, test_files)
        assert errors == []


def test_trigger_patterns_fail():
    """Test trigger patterns with non-matching files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("""---
name: test-skill
description: A test skill for validation purposes
triggers:
  - content/**
---

## Activation Context

When active.

---

## Instructions

Do stuff.
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
        (scripts_dir / "validate.py").write_text("""\
#!/usr/bin/env python3
import sys
sys.exit(0)
""")

        warnings = check_scripts_executable(skill_dir)
        assert warnings == []


def test_scripts_executable_skip_tests():
    """Test that test_*.py files are skipped."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        scripts_dir = skill_dir / "scripts"
        scripts_dir.mkdir()
        (scripts_dir / "test_example.py").write_text("# no exit code\n")

        warnings = check_scripts_executable(skill_dir)
        assert not any("test_example" in w for w in warnings)


def test_skill_json_valid_pass():
    """Test valid skill.json."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        assets_dir = skill_dir / "assets"
        assets_dir.mkdir()
        (assets_dir / "skill.json").write_text(json.dumps({
            "name": "test-skill",
            "version": "1.0.0",
            "description": "A test skill for validation purposes",
            "type": "skill",
        }))

        errors = check_skill_json_valid(skill_dir)
        assert errors == []


def test_skill_json_valid_fail():
    """Test invalid skill.json fails."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        assets_dir = skill_dir / "assets"
        assets_dir.mkdir()
        (assets_dir / "skill.json").write_text('{"name": "test"}')

        errors = check_skill_json_valid(skill_dir)
        assert any("version" in e or "description" in e or "type" in e
                    for e in errors)


def test_skill_json_not_found():
    """Test missing skill.json fails."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()

        errors = check_skill_json_valid(skill_dir)
        assert any("not found" in e.lower() for e in errors)


def test_references_exist_pass():
    """Test references that exist pass."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("""---
name: test-skill
description: A test skill for validation purposes
triggers:
  - test/**
---

## Activation Context

When active.

---

## Instructions

Do stuff.

---

## Reference

See `references/guide.md` for details.
""")
        refs_dir = skill_dir / "references"
        refs_dir.mkdir()
        (refs_dir / "guide.md").write_text("# Guide\n")

        warnings = check_references_exist(skill_dir)
        assert warnings == []


def test_references_exist_fail():
    """Test references that don't exist warn."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("""---
name: test-skill
description: A test skill for validation purposes
triggers:
  - test/**
---

## Activation Context

When active.

---

## Instructions

Do stuff.

---

## Reference

See `references/missing.md` for details.
""")

        warnings = check_references_exist(skill_dir)
        assert any("missing" in w.lower() for w in warnings)


def test_run_all_checks_pass():
    """Test complete test suite with valid skill."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "skill.md").write_text("""---
name: test-skill
description: A test skill for validation purposes
triggers:
  - test/**
---

## Activation Context

When active.

---

## Instructions

Do stuff.
""")

        assets_dir = skill_dir / "assets"
        assets_dir.mkdir()
        (assets_dir / "skill.json").write_text(json.dumps({
            "name": "test-skill",
            "version": "1.0.0",
            "description": "A test skill for validation purposes",
            "type": "skill",
        }))

        exit_code = run_all_checks(skill_dir)
        assert exit_code == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
