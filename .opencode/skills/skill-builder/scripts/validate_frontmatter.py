#!/usr/bin/env python3
"""Validate YAML frontmatter in skill.md files.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Validates:
- YAML frontmatter exists and is parseable
- Required fields are present
- Field values are valid (name, description, triggers)

Environment Variables:
    OPENCODE_FILE_PATH: Path to the skill.md file to validate

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warnings (optional issues)
    2 - Blocking error (invalid frontmatter)
"""

import os
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not installed. Run: uv pip install pyyaml", file=sys.stderr)
    sys.exit(2)


REQUIRED_FIELDS = ["name", "description", "triggers"]
VALID_NAME_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def extract_frontmatter(content: str) -> tuple[dict | None, str | None]:
    """Extract YAML frontmatter from Markdown content."""
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None, "Missing frontmatter (expected --- delimiters)"
    try:
        frontmatter = yaml.safe_load(match.group(1))
        if not isinstance(frontmatter, dict):
            return None, "Frontmatter must be a YAML mapping"
        return frontmatter, None
    except yaml.YAMLError as e:
        return None, f"Invalid YAML: {e}"


def validate_frontmatter(data: dict) -> tuple[list[str], list[str]]:
    """Validate frontmatter fields.

    Returns:
        Tuple of (errors, warnings). Required field issues = errors.
        Optional field issues = warnings.
    """
    errors = []
    warnings = []

    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    if data.get("name"):
        name = str(data["name"]).strip()
        if not name:
            errors.append("Name is empty")
        elif not VALID_NAME_PATTERN.match(name):
            errors.append(f"Name '{name}' must be kebab-case")

    if data.get("description"):
        desc = str(data["description"]).strip()
        if not desc:
            errors.append("Description is empty")
        elif len(desc) < 20:
            errors.append(f"Description too short ({len(desc)} chars, minimum 20)")
        elif desc.lower().startswith(("a ", "an ", "the ")):
            warnings.append(
                "Description starts with an article (consider starting with a verb)"
            )

    if "triggers" in data:
        triggers = data["triggers"]
        if not isinstance(triggers, list):
            errors.append("Triggers must be a list")
        elif len(triggers) == 0:
            errors.append("Triggers list is empty")

    if data.get("version"):
        version = str(data["version"]).strip()
        if not re.match(r"^\d+\.\d+\.\d+$", version):
            warnings.append(f"Version '{version}' is not valid semver (expected X.Y.Z)")

    return errors, warnings


def main() -> int:
    """Main validation entry point."""
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")

    if not file_path:
        print("ERROR: OPENCODE_FILE_PATH not set", file=sys.stderr)
        return 2

    path = Path(file_path)
    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        return 2

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"ERROR: Cannot read file: {e}", file=sys.stderr)
        return 2

    data, parse_error = extract_frontmatter(content)
    if parse_error:
        print(f"FRONTMATTER ERROR: {parse_error}", file=sys.stderr)
        return 2

    errors, warnings = validate_frontmatter(data)

    for warning in warnings:
        print(f"FRONTMATTER WARNING: {warning}", file=sys.stderr)

    if errors:
        for err in errors:
            print(f"FRONTMATTER ERROR: {err}", file=sys.stderr)
        return 2

    if warnings:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
