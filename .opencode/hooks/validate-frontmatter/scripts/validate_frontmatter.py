#!/usr/bin/env python3
"""Validate Markdown frontmatter for NUniversity lesson files.

Deterministic hook: exit 0 = pass, exit 2 = blocking error.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the file being validated

Dependencies:
    - pyyaml (for YAML parsing)

Exit Codes:
    0 - Validation passed
    2 - Blocking error (missing fields, invalid values)
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


REQUIRED_FIELDS = ["title", "description", "order", "duration", "difficulty"]
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}


def extract_frontmatter(content: str) -> tuple[dict | None, str | None]:
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


def validate_frontmatter(data: dict) -> list[str]:
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    if "title" in data and data["title"]:
        title = str(data["title"]).strip()
        if not title:
            errors.append("Frontmatter 'title' must be a non-empty string")

    if "difficulty" in data and data["difficulty"]:
        if data["difficulty"] not in VALID_DIFFICULTIES:
            errors.append(
                f"Invalid difficulty: '{data['difficulty']}'. "
                f"Must be one of: {', '.join(sorted(VALID_DIFFICULTIES))}"
            )

    if "order" in data and data["order"] is not None:
        if not isinstance(data["order"], int) or data["order"] < 1:
            errors.append(f"Invalid order: '{data['order']}'. Must be a positive integer.")

    if "duration" in data and data["duration"]:
        duration = str(data["duration"]).strip()
        if not re.match(r"^\d+\s*(min|minutes|hour|hours)$", duration):
            errors.append(
                f"Invalid duration: '{duration}'. "
                "Must be format 'N min', 'N minutes', 'N hour', or 'N hours'."
            )
    return errors


def validate_h1_matches_title(content: str, title: str) -> str | None:
    h1_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    if h1_match:
        h1 = h1_match.group(1).strip()
        if h1 != title:
            return f"H1 heading '{h1}' does not match title '{title}'"
    return None


def main() -> int:
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

    errors = validate_frontmatter(data)

    if "title" in data and data["title"]:
        h1_error = validate_h1_matches_title(content, str(data["title"]))
        if h1_error:
            errors.append(h1_error)

    if errors:
        for err in errors:
            print(f"FRONTMATTER ERROR: {err}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
