#!/usr/bin/env python3
"""Validate course directory structure and course.json for NUniversity.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Validates:
- course.json exists and is valid JSON
- Required fields present (area, en.title, en.description)
- Difficulty fields follow conventions (lowercase root, capitalized locale)
- Locale directories contain lesson files
- Lesson files follow naming convention
- Lesson orders are sequential

Environment Variables:
    OPENCODE_SKILL_DIR: Path to the course directory to validate

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warnings (optional issues)
    2 - Blocking error (invalid structure)
"""

import json
import os
import re
import sys
from pathlib import Path

VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_CAPITALIZED_DIFFICULTIES = {"Beginner", "Intermediate", "Advanced"}
VALID_LOCALES = {"en", "pt", "es"}
LESSON_FILE_PATTERN = re.compile(r"^(\d+)-([a-z0-9]+(-[a-z0-9]+)*)\.md$")


def validate_course_json(data: dict) -> tuple[list[str], list[str]]:
    """Validate course.json content.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    if not data.get("area"):
        errors.append("Missing required field: area")

    en = data.get("en", {})
    if not en.get("title"):
        errors.append("Missing required field: en.title")
    if not en.get("description"):
        errors.append("Missing required field: en.description")

    difficulty = data.get("difficulty", "")
    if difficulty and difficulty not in VALID_DIFFICULTIES:
        errors.append(
            f"Invalid difficulty: '{difficulty}'. "
            f"Must be beginner, intermediate, or advanced."
        )

    en_diff = en.get("difficulty", "")
    if en_diff and en_diff not in VALID_CAPITALIZED_DIFFICULTIES:
        errors.append(
            f"Invalid en.difficulty: '{en_diff}'. "
            f"Must be Beginner, Intermediate, or Advanced."
        )

    if "author" in data:
        author = str(data["author"]).strip()
        if not author:
            warnings.append("Author field is empty")

    if "duration" in data:
        duration = str(data["duration"]).strip()
        if not duration:
            warnings.append("Duration field is empty")

    for locale in ["pt", "es"]:
        locale_data = data.get(locale, {})
        if not locale_data:
            warnings.append(f"Missing locale section: {locale}")
        else:
            if not locale_data.get("title"):
                warnings.append(f"Missing {locale}.title")
            if not locale_data.get("description"):
                warnings.append(f"Missing {locale}.description")

    return errors, warnings


def validate_lesson_naming(lesson_files: list[Path]) -> tuple[list[str], list[str]]:
    """Validate lesson file naming convention and sequential ordering.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    if not lesson_files:
        warnings.append("No lesson files found")
        return errors, warnings

    orders = []
    for lesson_file in lesson_files:
        match = LESSON_FILE_PATTERN.match(lesson_file.name)
        if not match:
            errors.append(
                f"Invalid lesson naming: '{lesson_file.name}'. "
                f"Expected format: {{NN}}-{{kebab-case}}.md"
            )
        else:
            order = int(match.group(1))
            orders.append(order)

    if orders:
        orders.sort()
        expected = list(range(1, len(orders) + 1))
        if orders != expected:
            errors.append(
                f"Non-sequential lesson orders: {orders}. "
                f"Expected: {expected}"
            )

    return errors, warnings


def validate_directory_structure(
    course_dir: Path,
) -> tuple[list[str], list[str]]:
    """Validate complete course directory structure.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    course_json = course_dir / "course.json"
    if not course_json.exists():
        errors.append(f"course.json not found in {course_dir}")
        return errors, warnings

    try:
        data = json.loads(course_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"Invalid course.json: {e}")
        return errors, warnings

    json_errors, json_warnings = validate_course_json(data)
    errors.extend(json_errors)
    warnings.extend(json_warnings)

    for locale in VALID_LOCALES:
        locale_dir = course_dir / locale
        if not locale_dir.exists():
            warnings.append(f"Locale directory '{locale}/' not found")
        else:
            lesson_files = list(locale_dir.glob("*.md"))
            if not lesson_files:
                warnings.append(f"No lesson files in '{locale}/'")
            else:
                naming_errors, naming_warnings = validate_lesson_naming(lesson_files)
                errors.extend(naming_errors)
                warnings.extend(naming_warnings)

    return errors, warnings


def main() -> int:
    """Main validation entry point."""
    skill_dir_path = os.environ.get("OPENCODE_SKILL_DIR", "")

    if not skill_dir_path:
        print("ERROR: OPENCODE_SKILL_DIR not set", file=sys.stderr)
        return 2

    course_dir = Path(skill_dir_path)
    if not course_dir.exists():
        print(f"ERROR: Directory not found: {skill_dir_path}", file=sys.stderr)
        return 2

    if not course_dir.is_dir():
        print(f"ERROR: Not a directory: {skill_dir_path}", file=sys.stderr)
        return 2

    errors, warnings = validate_directory_structure(course_dir)

    for warning in warnings:
        print(f"COURSE WARNING: {warning}", file=sys.stderr)

    if errors:
        for error in errors:
            print(f"COURSE ERROR: {error}", file=sys.stderr)
        return 2

    if warnings:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
