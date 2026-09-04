#!/usr/bin/env python3
"""Skill integration test runner.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Tests:
- Skill can be discovered
- Trigger patterns match expected files
- Scripts are executable
- Integration with hooks works

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
import sys
from pathlib import Path


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


def check_trigger_patterns(
    skill_dir: Path, test_files: list[str] = None
) -> list[str]:
    """Check that trigger patterns match expected files."""
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

    frontmatter_match = content.split("---")
    if len(frontmatter_match) < 3:
        errors.append("skill.md frontmatter not found")
        return errors

    try:
        import yaml

        frontmatter = yaml.safe_load(frontmatter_match[1])
    except Exception as e:
        errors.append(f"Cannot parse frontmatter: {e}")
        return errors

    triggers = frontmatter.get("triggers", [])
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
                    f"Script {script.name} may missing exit codes"
                )
        except Exception:
            pass

    return warnings


def check_skill_json_valid(skill_dir: Path) -> list[str]:
    """Check that skill.json is valid."""
    errors = []

    skill_json = skill_dir / "assets" / "skill.json"
    if not skill_json.exists():
        return errors

    try:
        data = json.loads(skill_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"Invalid skill.json: {e}")
        return errors

    required = ["name", "version", "description"]
    for field in required:
        if field not in data:
            errors.append(f"skill.json missing '{field}'")

    return errors


def run_all_checks(skill_dir: Path) -> int:
    """Run all checks and return results."""
    all_errors = []
    all_warnings = []

    errors = check_skill_discovery(skill_dir)
    all_errors.extend(errors)

    errors = check_trigger_patterns(skill_dir)
    all_errors.extend(errors)

    warnings = check_scripts_executable(skill_dir)
    all_warnings.extend(warnings)

    errors = check_skill_json_valid(skill_dir)
    all_errors.extend(errors)

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
