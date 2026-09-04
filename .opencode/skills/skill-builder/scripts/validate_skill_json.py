#!/usr/bin/env python3
"""Validate skill.json metadata files.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Validates:
- JSON is valid and parseable
- Required fields are present
- Field values are correct types and formats
- Validates against skill-schema.json when available

Environment Variables:
    OPENCODE_FILE_PATH: Path to the skill.json file to validate

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warnings (optional issues)
    2 - Blocking error (invalid JSON or schema)
"""

import json
import os
import re
import sys
from pathlib import Path

try:
    from jsonschema import SchemaError, ValidationError, validate
except ImportError:
    validate = None
    ValidationError = None
    SchemaError = None


REQUIRED_FIELDS = ["name", "version", "description", "type"]
VALID_NAME_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
VALID_VERSION_PATTERN = re.compile(r"^\d+\.\d+\.\d+$")
VALID_TYPES = {"skill", "hook", "plugin", "tool"}

# Schema path relative to this script
SCHEMA_PATH = Path(__file__).parent.parent / "assets" / "skill-schema.json"


def validate_name(name: str) -> list[str]:
    """Validate skill name is kebab-case."""
    errors = []
    if not name:
        errors.append("Name is empty")
    elif not VALID_NAME_PATTERN.match(name):
        errors.append(f"Name '{name}' must be kebab-case")
    return errors


def validate_version(version: str) -> list[str]:
    """Validate version is semantic versioning."""
    errors = []
    if not version:
        errors.append("Version is empty")
    elif not VALID_VERSION_PATTERN.match(version):
        errors.append(f"Version '{version}' must be semver (e.g., 1.0.0)")
    return errors


def validate_skill_json(data: dict) -> tuple[list[str], list[str]]:
    """Validate complete skill.json structure.

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
        errors.extend(validate_name(data["name"]))

    if data.get("version"):
        errors.extend(validate_version(data["version"]))

    if data.get("type"):
        if data["type"] not in VALID_TYPES:
            errors.append(
                f"Invalid type: '{data['type']}'. "
                f"Must be one of: {', '.join(sorted(VALID_TYPES))}"
            )

    if "triggers" in data:
        if not isinstance(data["triggers"], list):
            errors.append("Triggers must be a list")
        elif len(data["triggers"]) == 0:
            warnings.append("Triggers list is empty")

    if "dependencies" in data:
        if not isinstance(data["dependencies"], list):
            errors.append("Dependencies must be a list")
        elif len(data["dependencies"]) == 0:
            warnings.append("Dependencies list is empty (consider adding at least one)")

    if data.get("description"):
        desc = str(data["description"]).strip()
        if len(desc) < 10:
            warnings.append(f"Description is quite short ({len(desc)} chars)")

    return errors, warnings


def load_schema() -> dict | None:
    """Load the skill JSON schema if available."""
    if not SCHEMA_PATH.exists():
        return None
    try:
        return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, Exception):
        return None


def validate_against_schema(data: dict) -> tuple[list[str], list[str]]:
    """Validate data against JSON schema.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    if validate is None:
        warnings.append("jsonschema not installed; skipping schema validation")
        return errors, warnings

    schema = load_schema()
    if schema is None:
        warnings.append("skill-schema.json not found; skipping schema validation")
        return errors, warnings

    try:
        validate(instance=data, schema=schema)
    except SchemaError as e:
        warnings.append(f"Schema itself is invalid: {e.message}")
    except ValidationError as e:
        # Map schema validation errors to our error format
        path = (
            ".".join(str(p) for p in e.absolute_path)
            if e.absolute_path
            else e.json_path
        )
        errors.append(f"Schema violation at {path}: {e.message}")

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
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"SKILL JSON ERROR: Invalid JSON: {e}", file=sys.stderr)
        return 2

    errors, warnings = validate_skill_json(data)

    # Also validate against JSON schema if available
    schema_errors, schema_warnings = validate_against_schema(data)
    errors.extend(schema_errors)
    warnings.extend(schema_warnings)

    for warning in warnings:
        print(f"SKILL JSON WARNING: {warning}", file=sys.stderr)

    if errors:
        for err in errors:
            print(f"SKILL JSON ERROR: {err}", file=sys.stderr)
        return 2

    if warnings:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
