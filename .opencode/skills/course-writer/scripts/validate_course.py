#!/usr/bin/env python3
"""Validate course directory structure and course.json for Nuniversity.

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

try:
    import yaml
except ImportError:  # pragma: no cover - pyyaml is a declared dependency
    yaml = None

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

    # Optional skill taxonomy consumed by the practice mastery model. When
    # present, lesson `skills` tags must be a subset of it (checked in
    # validate_directory_structure). Absent taxonomy is valid for old courses.
    if "skills" in data:
        skills = data["skills"]
        if not isinstance(skills, list) or not all(
            isinstance(skill, str) and skill.strip() for skill in skills
        ):
            errors.append("course.json 'skills' must be a list of non-empty strings")
        elif len(skills) != len(set(skills)):
            warnings.append("course.json 'skills' contains duplicate entries")

    return errors, warnings


def _read_frontmatter(path: Path) -> dict:
    """Best-effort frontmatter reader for taxonomy subset checks."""
    if yaml is None:
        return {}
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return {}
    match = re.match(r"^---\r?\n(.*?)\r?\n---", text, re.DOTALL)
    if not match:
        return {}
    try:
        data = yaml.safe_load(match.group(1))
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


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

    taxonomy = data.get("skills")
    if isinstance(taxonomy, list) and taxonomy:
        declared = {skill for skill in taxonomy if isinstance(skill, str)}
        en_dir = course_dir / "en"
        lesson_paths = sorted(en_dir.glob("*.md")) if en_dir.exists() else []
        for lesson in lesson_paths:
            frontmatter = _read_frontmatter(lesson)
            lesson_skills = frontmatter.get("skills")
            if not isinstance(lesson_skills, list):
                continue
            for skill in lesson_skills:
                if isinstance(skill, str) and skill not in declared:
                    warnings.append(
                        f"{lesson.name}: skill '{skill}' is not in the "
                        f"course.json skills taxonomy"
                    )

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
