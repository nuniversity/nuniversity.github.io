#!/usr/bin/env python3
"""Validate lesson Markdown files for NUniversity.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Validates:
- YAML frontmatter exists and is parseable
- Required fields present (title, order)
- Body structure matches canonical format
- Practice questions section exists with minimum 5 questions
- Key takeaways section exists
- Code blocks have language identifiers
- Interactive component blocks have valid JSON syntax

Environment Variables:
    OPENCODE_FILE_PATH: Path to the lesson .md file to validate

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warnings (optional issues)
    2 - Blocking error (invalid structure)
"""

import os
import re
import sys
import json
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not installed. Run: uv pip install pyyaml", file=sys.stderr)
    sys.exit(2)


REQUIRED_FRONTMATTER_FIELDS = ["title", "order"]
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
MIN_PRACTICE_QUESTIONS = 5
INTERACTIVE_BLOCK_TYPES = {"math", "phet", "plot", "molecule", "dragdrop", "matching", "fillblank"}


def extract_frontmatter(content: str) -> tuple[dict | None, str | None]:
    """Extract YAML frontmatter from Markdown content.

    Returns:
        Tuple of (frontmatter_dict, error_message). error is None on success.
    """
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

    for field in REQUIRED_FRONTMATTER_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    if "title" in data:
        title = str(data["title"]).strip()
        if not title:
            errors.append("Title is empty")
        elif len(title) < 3:
            errors.append(f"Title too short ({len(title)} chars, minimum 3)")

    if "order" in data:
        order = data["order"]
        if not isinstance(order, int):
            errors.append(f"Order must be an integer, got {type(order).__name__}")
        elif order < 1:
            errors.append(f"Order must be >= 1, got {order}")

    if "difficulty" in data:
        difficulty = str(data["difficulty"]).strip().lower()
        if difficulty and difficulty not in VALID_DIFFICULTIES:
            warnings.append(
                f"Invalid difficulty: '{data['difficulty']}'. "
                f"Expected beginner, intermediate, or advanced."
            )

    if "description" in data:
        desc = str(data["description"]).strip()
        if not desc:
            warnings.append("Description is empty")

    if "duration" in data:
        duration = str(data["duration"]).strip()
        if not duration:
            warnings.append("Duration is empty")

    return errors, warnings


def validate_body(content: str, frontmatter: dict) -> tuple[list[str], list[str]]:
    """Validate lesson body structure.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    title = str(frontmatter.get("title", "")).strip()

    # Check H1 matches title
    h1_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    if h1_match:
        h1_text = h1_match.group(1).strip()
        if title and h1_text != title:
            errors.append(f"H1 '{h1_text}' does not match title '{title}'")
    else:
        errors.append("Missing H1 heading")

    # Check practice questions section
    has_practice_section = bool(
        re.search(r"^## .*Practice Questions", content, re.MULTILINE)
    )
    if not has_practice_section:
        errors.append("Missing '## Practice Questions' section")

    # Count practice questions (```question blocks)
    question_blocks = re.findall(r"```question\b", content)
    if len(question_blocks) < MIN_PRACTICE_QUESTIONS:
        errors.append(
            f"Insufficient practice questions: {len(question_blocks)} found, "
            f"minimum {MIN_PRACTICE_QUESTIONS} required"
        )

    # Check key takeaways section
    has_takeaways = bool(
        re.search(r"^## .*Key Takeaways", content, re.MULTILINE)
    ) or bool(
        re.search(r"> \[!SUCCESS\]", content)
        and re.search(r"Key Takeaways", content)
    )
    if not has_takeaways:
        errors.append(
            "Missing '## Key Takeaways' or '> [!SUCCESS] Key Takeaways' section"
        )

    return errors, warnings


def validate_interactive_blocks(content: str) -> tuple[list[str], list[str]]:
    """Validate interactive component blocks have valid JSON configs.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    interactive_blocks = []
    for match in re.finditer(r"```(\w+)\n(.*?)```", content, re.DOTALL):
        lang = match.group(1).lower()
        if lang in INTERACTIVE_BLOCK_TYPES:
            code = match.group(2).strip()
            interactive_blocks.append((lang, code))
            try:
                json.loads(code)
            except json.JSONDecodeError as e:
                errors.append(f"Invalid JSON in ```{lang}`` block: {e}")

    if not interactive_blocks:
        warnings.append(
            "No interactive components found — STEM lessons should include "
            "at least 1 interactive block (math, phet, plot, molecule, "
            "dragdrop, matching, fillblank)"
        )

    return errors, warnings


def validate_lesson(path: Path) -> tuple[list[str], list[str]]:
    """Validate a complete lesson file.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    if not path.exists():
        errors.append(f"File not found: {path}")
        return errors, warnings

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        errors.append(f"Cannot read file: {e}")
        return errors, warnings

    if not content.strip():
        errors.append("File is empty")
        return errors, warnings

    frontmatter, parse_error = extract_frontmatter(content)
    if parse_error:
        errors.append(parse_error)
        return errors, warnings

    fm_errors, fm_warnings = validate_frontmatter(frontmatter)
    errors.extend(fm_errors)
    warnings.extend(fm_warnings)

    body_errors, body_warnings = validate_body(content, frontmatter)
    errors.extend(body_errors)
    warnings.extend(body_warnings)

    interactive_errors, interactive_warnings = validate_interactive_blocks(content)
    errors.extend(interactive_errors)
    warnings.extend(interactive_warnings)

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

    errors, warnings = validate_lesson(path)

    for warning in warnings:
        print(f"LESSON WARNING: {warning}", file=sys.stderr)

    if errors:
        for error in errors:
            print(f"LESSON ERROR: {error}", file=sys.stderr)
        return 2

    if warnings:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
