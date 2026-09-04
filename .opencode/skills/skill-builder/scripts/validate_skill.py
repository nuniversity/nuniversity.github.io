#!/usr/bin/env python3
"""Validate OpenCode skill structure and content.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Validates:
- skill.md exists and has valid frontmatter
- assets/skill.json exists and is valid
- Required sections exist in skill.md
- Directory structure follows conventions

Environment Variables:
    OPENCODE_SKILL_DIR: Path to the skill directory to validate

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warnings
    2 - Blocking error (invalid structure)
"""

import json
import os
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not installed. Run: uv pip install pyyaml", file=sys.stderr)
    sys.exit(2)


REQUIRED_FRONTMATTER_FIELDS = ["name", "description", "triggers"]
REQUIRED_BODY_SECTIONS = ["Activation Context", "Instructions"]
VALID_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$")


def validate_name(name: str) -> list[str]:
    """Validate skill name is kebab-case."""
    errors = []
    if not name:
        errors.append("Name is empty")
    elif not VALID_NAME_PATTERN.match(name):
        errors.append(f"Name '{name}' must be kebab-case (e.g., 'my-skill')")
    return errors


def validate_description(description: str) -> list[str]:
    """Validate skill description is specific enough."""
    errors = []
    if not description:
        errors.append("Description is empty")
    elif len(description) < 20:
        errors.append(f"Description too short ({len(description)} chars, minimum 20)")
    elif description.lower().startswith(("a ", "an ", "the ")):
        errors.append("Description should start with a verb, not an article")
    vague_terms = ["helps with", "a tool", "various", "things", "stuff"]
    for term in vague_terms:
        if term in description.lower():
            errors.append(f"Description contains vague term: '{term}'")
    return errors


def validate_triggers(triggers: list) -> list[str]:
    """Validate skill triggers are valid glob patterns."""
    errors = []
    if not triggers:
        errors.append("No triggers defined")
    elif not isinstance(triggers, list):
        errors.append("Triggers must be a list")
    else:
        for trigger in triggers:
            if not isinstance(trigger, str):
                errors.append(f"Trigger must be string: {trigger}")
            elif not trigger.strip():
                errors.append("Trigger is empty")
    return errors


def validate_frontmatter(data: dict) -> list[str]:
    """Validate complete frontmatter."""
    errors = []
    for field in REQUIRED_FRONTMATTER_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    if data.get("name"):
        errors.extend(validate_name(data["name"]))

    if data.get("description"):
        errors.extend(validate_description(data["description"]))

    if "triggers" in data:
        errors.extend(validate_triggers(data["triggers"]))

    return errors


def validate_body_sections(content: str) -> tuple[list[str], list[str]]:
    """Validate required body sections exist.

    Returns:
        Tuple of (errors, warnings). Required sections missing = error.
    """
    errors = []
    warnings = []
    for section in REQUIRED_BODY_SECTIONS:
        if f"## {section}" not in content:
            errors.append(f"Missing required section: '## {section}'")
    return errors, warnings


def validate_skill_directory(skill_dir: Path) -> tuple[list[str], list[str]]:
    """Validate complete skill directory structure."""
    errors = []
    warnings = []

    skill_md = skill_dir / "skill.md"
    if not skill_md.exists():
        errors.append(f"skill.md not found in {skill_dir}")
        return errors, warnings

    try:
        content = skill_md.read_text(encoding="utf-8")
    except Exception as e:
        errors.append(f"Cannot read skill.md: {e}")
        return errors, warnings

    frontmatter_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not frontmatter_match:
        errors.append("skill.md missing YAML frontmatter (expected --- delimiters)")
        return errors, warnings

    try:
        frontmatter = yaml.safe_load(frontmatter_match.group(1))
        if not isinstance(frontmatter, dict):
            errors.append("Frontmatter must be a YAML mapping")
            return errors, warnings
    except yaml.YAMLError as e:
        errors.append(f"Invalid YAML frontmatter: {e}")
        return errors, warnings

    errors.extend(validate_frontmatter(frontmatter))
    body_errors, body_warnings = validate_body_sections(content)
    errors.extend(body_errors)
    warnings.extend(body_warnings)

    skill_json = skill_dir / "assets" / "skill.json"
    if not skill_json.exists():
        warnings.append("assets/skill.json not found (recommended)")
    else:
        try:
            data = json.loads(skill_json.read_text(encoding="utf-8"))
            if "name" not in data:
                errors.append("skill.json missing 'name' field")
            if "version" not in data:
                warnings.append("skill.json missing 'version' field (recommended)")
        except json.JSONDecodeError as e:
            errors.append(f"Invalid skill.json: {e}")

    scripts_dir = skill_dir / "scripts"
    if scripts_dir.exists():
        for script in scripts_dir.glob("*.py"):
            if script.name.startswith("test_"):
                continue
            try:
                content = script.read_text(encoding="utf-8")
                if "sys.exit" not in content and "exit(" not in content:
                    warnings.append(f"Script {script.name} may missing exit codes")
            except Exception as e:
                warnings.append(f"Cannot read {script.name}: {e}")

    return errors, warnings


def main() -> int:
    """Main validation entry point."""
    skill_dir_path = os.environ.get("OPENCODE_SKILL_DIR", "")

    if not skill_dir_path:
        print("ERROR: OPENCODE_SKILL_DIR not set", file=sys.stderr)
        return 2

    skill_dir = Path(skill_dir_path)
    if not skill_dir.exists():
        print(f"ERROR: Directory not found: {skill_dir_path}", file=sys.stderr)
        return 2

    if not skill_dir.is_dir():
        print(f"ERROR: Not a directory: {skill_dir_path}", file=sys.stderr)
        return 2

    errors, warnings = validate_skill_directory(skill_dir)

    for warning in warnings:
        print(f"SKILL WARNING: {warning}", file=sys.stderr)

    if errors:
        for error in errors:
            print(f"SKILL ERROR: {error}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
