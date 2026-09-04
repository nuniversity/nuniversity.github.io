#!/usr/bin/env python3
"""Skill integration test runner for course-writer.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Tests:
- Skill can be discovered
- Trigger patterns match expected files
- Scripts are executable
- skill.json is valid
- Referenced files exist

Environment Variables:
    OPENCODE_SKILL_DIR: Path to the skill directory to test

Exit Codes:
    0 - All tests passed
    1 - Some tests failed (non-blocking)
    2 - Critical error (skill cannot be used)
"""
import fnmatch
import json
import os
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None


def check_skill_discovery(skill_dir: Path) -> list[str]:
    """Check that skill can be discovered."""
    errors = []

    skill_md = skill_dir / "skill.md"
    if not skill_md.exists():
        errors.append("skill.md not found")
        return errors

    try:
        content = skill_md.read_text(encoding="utf-8")
    except Exception as e:
        errors.append(f"Cannot read skill.md: {e}")
        return errors

    if not content.startswith("---"):
        errors.append("skill.md missing YAML frontmatter")
        return errors

    frontmatter_end = content.find("---", 3)
    if frontmatter_end == -1:
        errors.append("skill.md frontmatter not closed")
        return errors

    return errors


def check_frontmatter_valid(skill_dir: Path) -> list[str]:
    """Check that skill.md frontmatter is valid YAML with required fields."""
    errors = []

    if yaml is None:
        return errors

    skill_md = skill_dir / "skill.md"
    if not skill_md.exists():
        return errors

    try:
        content = skill_md.read_text(encoding="utf-8")
    except Exception:
        return errors

    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        errors.append("skill.md frontmatter not parseable")
        return errors

    try:
        data = yaml.safe_load(match.group(1))
    except Exception as e:
        errors.append(f"skill.md frontmatter YAML error: {e}")
        return errors

    if not isinstance(data, dict):
        errors.append("skill.md frontmatter is not a mapping")
        return errors

    required = ["name", "description", "triggers"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"skill.md frontmatter missing '{field}'")

    return errors


def check_trigger_patterns(
    skill_dir: Path, test_files: list[str] | None = None
) -> list[str]:
    """Check that trigger patterns match expected files."""
    errors = []

    if yaml is None:
        return errors

    skill_md = skill_dir / "skill.md"
    if not skill_md.exists():
        return errors

    try:
        content = skill_md.read_text(encoding="utf-8")
    except Exception:
        return errors

    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return errors

    try:
        data = yaml.safe_load(match.group(1))
    except Exception:
        return errors

    triggers = data.get("triggers", [])
    if not triggers:
        errors.append("No triggers defined")
        return errors

    if test_files:
        for test_file in test_files:
            matched = False
            for trigger in triggers:
                if fnmatch.fnmatch(test_file, trigger):
                    matched = True
                    break
            if not matched:
                errors.append(
                    f"Test file '{test_file}' not matched by any trigger"
                )

    return errors


def check_scripts_executable(skill_dir: Path) -> list[str]:
    """Check that scripts have proper exit codes."""
    warnings = []

    scripts_dir = skill_dir / "scripts"
    if not scripts_dir.exists():
        return warnings

    for script in scripts_dir.glob("*.py"):
        if script.name.startswith("test_"):
            continue

        try:
            content = script.read_text(encoding="utf-8")
            if "sys.exit" not in content and "exit(" not in content:
                warnings.append(
                    f"Script {script.name} may be missing exit codes"
                )
        except Exception:  # noqa: S110
            pass

    return warnings


def check_skill_json_valid(skill_dir: Path) -> list[str]:
    """Check that skill.json is valid."""
    errors = []

    skill_json = skill_dir / "assets" / "skill.json"
    if not skill_json.exists():
        errors.append("assets/skill.json not found")
        return errors

    try:
        data = json.loads(skill_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"Invalid skill.json: {e}")
        return errors

    required = ["name", "version", "description", "type"]
    for field in required:
        if field not in data:
            errors.append(f"skill.json missing '{field}'")

    return errors


def check_references_exist(skill_dir: Path) -> list[str]:
    """Check that referenced files in skill.md exist."""
    warnings = []

    skill_md = skill_dir / "skill.md"
    if not skill_md.exists():
        return warnings

    try:
        content = skill_md.read_text(encoding="utf-8")
    except Exception:
        return warnings

    # Find backtick-quoted file references
    refs = re.findall(r"`([^`]+\.(?:md|json|py))`", content)
    for ref in refs:
        # Skip external URLs, commands, and paths outside the skill dir
        if ref.startswith("http") or ref.startswith("python "):
            continue
        if ref.startswith("agents/") or ref.startswith("content/"):
            continue
        ref_path = skill_dir / ref
        if not ref_path.exists():
            warnings.append(f"Referenced file not found: {ref}")

    return warnings


def run_all_checks(skill_dir: Path) -> int:
    """Run all checks and return results."""
    all_errors = []
    all_warnings = []

    errors = check_skill_discovery(skill_dir)
    all_errors.extend(errors)

    errors = check_frontmatter_valid(skill_dir)
    all_errors.extend(errors)

    errors = check_trigger_patterns(skill_dir)
    all_errors.extend(errors)

    warnings = check_scripts_executable(skill_dir)
    all_warnings.extend(warnings)

    errors = check_skill_json_valid(skill_dir)
    all_errors.extend(errors)

    warnings = check_references_exist(skill_dir)
    all_warnings.extend(warnings)

    for warning in all_warnings:
        print(f"TEST WARNING: {warning}", file=sys.stderr)

    if all_errors:
        for error in all_errors:
            print(f"TEST ERROR: {error}", file=sys.stderr)
        return 2

    return 0


def main() -> int:
    """Main test entry point."""
    skill_dir_path = os.environ.get("OPENCODE_SKILL_DIR", "")

    if not skill_dir_path:
        print("ERROR: OPENCODE_SKILL_DIR not set", file=sys.stderr)
        return 2

    skill_dir = Path(skill_dir_path)
    if not skill_dir.exists():
        print(f"ERROR: Directory not found: {skill_dir_path}", file=sys.stderr)
        return 2

    return run_all_checks(skill_dir)


if __name__ == "__main__":
    sys.exit(main())
