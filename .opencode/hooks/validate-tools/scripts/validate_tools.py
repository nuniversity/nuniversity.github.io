#!/usr/bin/env python3
"""Validate tool Markdown frontmatter for NUniversity.

Deterministic hook: exit 0 = pass, exit 2 = blocking error.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the tool Markdown file being validated

Notes:
    Single-file validation only checks the file's own frontmatter; cross-locale
    completeness and placeholder/stub bodies are out of scope for this hook.

Dependencies:
    - pyyaml (for YAML parsing)

Exit Codes:
    0 - Validation passed
    2 - Blocking error (invalid frontmatter, missing or invalid fields)
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

REQUIRED_FIELDS = ("title", "description", "category", "icon", "order")
VALID_CATEGORIES = {
    "Artificial Intelligence",
    "Business Strategy",
    "Coding & Programming",
    "Collaboration",
    "Colaboración",
    "Colaboração",
    "Estrategia Empresarial",
    "Estratégia de Negócios",
    "Inteligencia Artificial",
    "Inteligência Artificial",
    "Mathematics",
    "Productivity",
    "Productividad",
    "Produtividade",
    "Study & Learning",
}


def extract_frontmatter(content: str) -> tuple[dict | None, str | None]:
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None, "Missing frontmatter (expected --- delimiters)"
    try:
        frontmatter = yaml.safe_load(match.group(1))
    except yaml.YAMLError as e:
        return None, f"Invalid YAML: {e}"
    if not isinstance(frontmatter, dict):
        return None, "Frontmatter must be a YAML mapping"
    return frontmatter, None


def validate_tool(data: dict) -> list[str]:
    errors = []

    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    for field in ("title", "description", "category", "icon"):
        value = data.get(field)
        if value is not None and (not isinstance(value, str) or not value.strip()):
            errors.append(f"Required field '{field}' must be a non-empty string")

    category = data.get("category")
    if isinstance(category, str) and category.strip() and category not in VALID_CATEGORIES:
        errors.append(
            f"Invalid category: '{category}'. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}"
        )

    order = data.get("order")
    if order is not None and (isinstance(order, bool) or not isinstance(order, int) or order < 1):
        errors.append(f"Invalid order: '{order}'. Must be a positive integer.")

    return errors


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
    except OSError as e:
        print(f"ERROR: Cannot read file: {e}", file=sys.stderr)
        return 2

    data, parse_error = extract_frontmatter(content)
    if parse_error:
        print(f"TOOLS ERROR: {parse_error}", file=sys.stderr)
        return 2

    errors = validate_tool(data)
    if errors:
        for err in errors:
            print(f"TOOLS ERROR: {err}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
