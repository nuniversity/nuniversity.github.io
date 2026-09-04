#!/usr/bin/env python3
"""Generate a new skill from a template.

Deterministic script: exit 0 = success, exit 2 = error.

Generates:
- skill.md with proper frontmatter and sections
- assets/skill.json with metadata
- Basic directory structure

Environment Variables:
    OPENCODE_SKILL_NAME: Name of the skill to generate (kebab-case)
    OPENCODE_SKILL_DIR: Directory where skill should be created
    OPENCODE_SKILL_DESCRIPTION: Optional description for the skill

Exit Codes:
    0 - Generation successful
    2 - Generation failed
"""

import json
import os
import re
import sys
from pathlib import Path

VALID_NAME_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

SKILL_MD_TEMPLATE = """---
name: {name}
description: {description}
triggers:
  - {trigger_pattern}
---

# {title}

## Activation Context

Activate when the user requests creation or editing of {purpose}.

---

## Instructions

### Step 1: Understand Requirements

Analyze the user's request and identify:
- What needs to be created or modified
- What constraints or requirements exist
- What output format is expected

### Step 2: Generate Content

Follow these rules:
- Use consistent formatting
- Follow established conventions
- Validate output before saving

### Step 3: Validate Output

Run validation checks:
- Schema validation
- Format validation
- Content validation

### Step 4: Save Results

Save the generated content to the appropriate location.

---

## Output Format

### Required Fields

- Field 1: Description
- Field 2: Description

### Optional Fields

- Field 3: Description

---

## Quality Rules

- Rule 1: Description
- Rule 2: Description
- Rule 3: Description

---

## Reference

See `references/guide.md` for more details.
"""

SKILL_JSON_TEMPLATE = """{{
    "name": "{name}",
    "version": "1.0.0",
    "description": "{description}",
    "type": "skill",
    "triggers": ["{trigger_pattern}"],
    "dependencies": [],
    "references": {{}}
}}"""


def validate_name(name: str) -> list[str]:
    """Validate skill name is kebab-case."""
    errors = []
    if not name:
        errors.append("Name is empty")
    elif not VALID_NAME_PATTERN.match(name):
        errors.append(f"Name '{name}' must be kebab-case (e.g., 'my-skill')")
    return errors


def name_to_title(name: str) -> str:
    """Convert kebab-case name to Title Case."""
    return name.replace("-", " ").title()


def name_to_trigger(name: str) -> str:
    """Convert skill name to trigger pattern."""
    return f"content/{name}/**"


def generate_skill_md(
    name: str,
    description: str,
    trigger_pattern: str,
    purpose: str,
) -> str:
    """Generate skill.md content."""
    title = name_to_title(name)
    return SKILL_MD_TEMPLATE.format(
        name=name,
        description=description,
        trigger_pattern=trigger_pattern,
        title=title,
        purpose=purpose,
    )


def generate_skill_json(
    name: str,
    description: str,
    trigger_pattern: str,
) -> dict:
    """Generate skill.json content."""
    return json.loads(
        SKILL_JSON_TEMPLATE.format(
            name=name,
            description=description,
            trigger_pattern=trigger_pattern,
        )
    )


def create_skill_directory(
    skill_dir: Path,
    name: str,
    description: str,
    trigger_pattern: str,
    purpose: str,
) -> list[str]:
    """Create complete skill directory structure."""
    errors = []

    try:
        skill_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        errors.append(f"Cannot create directory: {e}")
        return errors

    skill_md = skill_dir / "skill.md"
    try:
        content = generate_skill_md(name, description, trigger_pattern, purpose)
        skill_md.write_text(content, encoding="utf-8")
    except Exception as e:
        errors.append(f"Cannot write skill.md: {e}")

    assets_dir = skill_dir / "assets"
    try:
        assets_dir.mkdir(exist_ok=True)
    except Exception as e:
        errors.append(f"Cannot create assets directory: {e}")

    skill_json = assets_dir / "skill.json"
    try:
        data = generate_skill_json(name, description, trigger_pattern)
        skill_json.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        errors.append(f"Cannot write skill.json: {e}")

    scripts_dir = skill_dir / "scripts"
    try:
        scripts_dir.mkdir(exist_ok=True)
    except Exception as e:
        errors.append(f"Cannot create scripts directory: {e}")

    references_dir = skill_dir / "references"
    try:
        references_dir.mkdir(exist_ok=True)
    except Exception as e:
        errors.append(f"Cannot create references directory: {e}")

    examples_dir = skill_dir / "examples"
    try:
        examples_dir.mkdir(exist_ok=True)
    except Exception as e:
        errors.append(f"Cannot create examples directory: {e}")

    return errors


def main() -> int:
    """Main generation entry point."""
    name = os.environ.get("OPENCODE_SKILL_NAME", "")
    description = os.environ.get("OPENCODE_SKILL_DESCRIPTION", "")
    skill_dir_path = os.environ.get("OPENCODE_SKILL_DIR", "")

    if not name:
        print("ERROR: OPENCODE_SKILL_NAME not set", file=sys.stderr)
        return 2

    errors = validate_name(name)
    if errors:
        for error in errors:
            print(f"SKILL ERROR: {error}", file=sys.stderr)
        return 2

    if not description:
        description = f"Generates and validates {name.replace('-', ' ')} content"

    if not skill_dir_path:
        skill_dir_path = f".opencode/skills/{name}"

    skill_dir = Path(skill_dir_path)
    trigger_pattern = name_to_trigger(name)
    purpose = name.replace("-", " ")

    errors = create_skill_directory(
        skill_dir, name, description, trigger_pattern, purpose
    )

    if errors:
        for error in errors:
            print(f"SKILL ERROR: {error}", file=sys.stderr)
        return 2

    print(f"SKILL: Generated skill '{name}' at {skill_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
