#!/usr/bin/env python3
"""Comprehensive test suite for OpenCode courses.

Validates all courses and lessons meet Nuniversity quality standards.

Usage:
    pytest tests/test_opencode_courses.py
"""

import json
import re
from pathlib import Path

import pytest
import yaml

VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_CAPITALIZED_DIFFICULTIES = {"Beginner", "Intermediate", "Advanced"}
VALID_LOCALES = {"en", "pt", "es"}
DIFFICULTY_ALIASES = {
    "beginner",
    "iniciante",
    "principiante",
    "intermediate",
    "intermediário",
    "intermediario",
    "intermedio",
    "advanced",
    "avanzado",
    "avançado",
}
LESSON_FILE_PATTERN = re.compile(r"^(\d+)-([a-z0-9]+(-[a-z0-9]+)*)\.md$")

COURSES_ROOT = Path(__file__).resolve().parent.parent / "content" / "courses"
COURSE_DIRS = sorted(
    (path for path in COURSES_ROOT.iterdir() if path.is_dir()),
    key=lambda path: path.name,
)
COURSE_IDS = [path.name for path in COURSE_DIRS]


def course_json_problems(course_dir: Path) -> list[str]:
    problems = []
    prefix = f"course.json ({course_dir.name})"
    course_json = course_dir / "course.json"

    if not course_json.exists():
        return [f"{prefix}: course.json not found"]

    try:
        data = json.loads(course_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"{prefix}: Invalid JSON: {e}"]

    if not data.get("area"):
        problems.append(f"{prefix} area: Missing 'area' field")

    en = data.get("en", {})
    if not en.get("title"):
        problems.append(f"{prefix} en.title: Missing 'en.title' field")
    if not en.get("description"):
        problems.append(f"{prefix} en.description: Missing 'en.description' field")

    difficulty = data.get("difficulty", "")
    if difficulty and difficulty not in VALID_DIFFICULTIES:
        problems.append(f"{prefix} difficulty: Invalid: '{difficulty}'")

    en_diff = en.get("difficulty", "")
    if en_diff and en_diff not in VALID_CAPITALIZED_DIFFICULTIES:
        problems.append(f"{prefix} en.difficulty: Invalid: '{en_diff}'")

    for locale in sorted(VALID_LOCALES):
        if locale != "en" and locale not in data and not (course_dir / locale).is_dir():
            continue
        locale_data = data.get(locale, {})
        if not locale_data:
            problems.append(f"{prefix} {locale}: Missing {locale} section")
        elif not locale_data.get("title"):
            problems.append(f"{prefix} {locale}.title: Missing {locale}.title")
        elif not locale_data.get("description"):
            problems.append(
                f"{prefix} {locale}.description: Missing {locale}.description"
            )

    return problems


def lesson_naming_problems(lesson_dir: Path) -> list[str]:
    problems = []
    prefix = f"naming ({lesson_dir.parent.name}/{lesson_dir.name})"
    lesson_files = sorted(lesson_dir.glob("*.md"))

    if not lesson_files:
        return [f"{prefix}: No lesson files found"]

    orders = []
    for lesson_file in lesson_files:
        match = LESSON_FILE_PATTERN.match(lesson_file.name)
        if match:
            orders.append(int(match.group(1)))
        else:
            problems.append(f"{prefix}: Invalid naming: '{lesson_file.name}'")

    if orders:
        orders.sort()
        expected = list(range(1, len(orders) + 1))
        if orders != expected:
            problems.append(f"{prefix}: Non-sequential orders: {orders}")

    return problems


def lesson_file_problems(lesson_path: Path) -> list[str]:
    prefix = (
        f"lesson ({lesson_path.parent.parent.name}/{lesson_path.parent.name}"
        f"/{lesson_path.name})"
    )

    if not lesson_path.exists():
        return [f"{prefix}: File not found"]

    content = lesson_path.read_text(encoding="utf-8")
    if not content.strip():
        return [f"{prefix}: File is empty"]

    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return [f"{prefix} frontmatter: Missing frontmatter"]

    try:
        frontmatter = yaml.safe_load(match.group(1))
    except Exception as e:
        return [f"{prefix} frontmatter: Invalid YAML: {e}"]

    if not isinstance(frontmatter, dict):
        return [f"{prefix} frontmatter: Frontmatter must be a mapping"]

    problems = []
    for field in ["title", "order"]:
        if field not in frontmatter or frontmatter[field] is None:
            problems.append(f"{prefix} {field}: Missing required field: {field}")

    title = str(frontmatter.get("title", "")).strip()
    if title and len(title) < 3:
        problems.append(f"{prefix} title length: Too short: {len(title)} chars")

    order = frontmatter.get("order")
    if order is not None:
        if not isinstance(order, int):
            problems.append(
                f"{prefix} order type: Must be int, got {type(order).__name__}"
            )
        elif order < 1:
            problems.append(f"{prefix} order value: Must be >= 1, got {order}")

    all_fences = re.findall(r"^```", content, re.MULTILINE)
    if len(all_fences) % 2 != 0:
        problems.append(
            f"{prefix} code block balance: Odd number of fences: {len(all_fences)}"
        )

    return problems


def locale_dirs(course_dir: Path) -> list[Path]:
    return [
        course_dir / locale
        for locale in sorted(VALID_LOCALES)
        if (course_dir / locale).is_dir()
    ]


@pytest.mark.parametrize("course_dir", COURSE_DIRS, ids=COURSE_IDS)
def test_course_json(course_dir: Path):
    problems = course_json_problems(course_dir)
    assert not problems, "\n".join(problems)


@pytest.mark.parametrize("course_dir", COURSE_DIRS, ids=COURSE_IDS)
def test_lesson_naming(course_dir: Path):
    dirs = locale_dirs(course_dir)
    problems = []
    if not dirs:
        problems.append(f"locale dir ({course_dir.name}): No locale directories found")
    for lesson_dir in dirs:
        problems.extend(lesson_naming_problems(lesson_dir))
    assert not problems, "\n".join(problems)


@pytest.mark.parametrize("course_dir", COURSE_DIRS, ids=COURSE_IDS)
def test_lesson_files(course_dir: Path):
    problems = []
    for lesson_dir in locale_dirs(course_dir):
        for lesson_file in sorted(lesson_dir.glob("*.md")):
            problems.extend(lesson_file_problems(lesson_file))
    assert not problems, "\n".join(problems)


def difficulty_alias_problems(value, prefix: str) -> list[str]:
    if value in (None, ""):
        return []
    normalized = str(value).strip().lower()
    if normalized not in DIFFICULTY_ALIASES:
        return [f"{prefix}: Unrecognized difficulty: '{value}'"]
    return []


@pytest.mark.parametrize("course_dir", COURSE_DIRS, ids=COURSE_IDS)
def test_difficulty_aliases(course_dir: Path):
    problems = []
    course_json = course_dir / "course.json"
    if not course_json.exists():
        return

    data = json.loads(course_json.read_text(encoding="utf-8"))
    problems.extend(
        difficulty_alias_problems(
            data.get("difficulty"), f"course.json ({course_dir.name}) difficulty"
        )
    )
    for locale in sorted(VALID_LOCALES):
        locale_data = data.get(locale) or {}
        problems.extend(
            difficulty_alias_problems(
                locale_data.get("difficulty"),
                f"course.json ({course_dir.name}) {locale}.difficulty",
            )
        )

    for lesson_dir in locale_dirs(course_dir):
        for lesson_file in sorted(lesson_dir.glob("*.md")):
            content = lesson_file.read_text(encoding="utf-8")
            match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
            if not match:
                continue
            try:
                frontmatter = yaml.safe_load(match.group(1))
            except Exception:
                continue
            if isinstance(frontmatter, dict):
                problems.extend(
                    difficulty_alias_problems(
                        frontmatter.get("difficulty"),
                        f"lesson ({course_dir.name}/{lesson_dir.name}"
                        f"/{lesson_file.name}) difficulty",
                    )
                )

    assert not problems, "\n".join(problems)


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__]))
