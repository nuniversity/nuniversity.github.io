#!/usr/bin/env python3
"""Comprehensive test suite for OpenCode courses.

Validates all courses and lessons meet NUniversity quality standards.

Usage:
    python tests/test_opencode_courses.py

Exit Codes:
    0 - All tests passed
    1 - One or more tests failed
"""
import json
import os
import re
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_CAPITALIZED_DIFFICULTIES = {"Beginner", "Intermediate", "Advanced"}
VALID_LOCALES = {"en", "pt", "es"}
MIN_PRACTICE_QUESTIONS = 5
LESSON_FILE_PATTERN = re.compile(r"^(\d+)-([a-z0-9]+(-[a-z0-9]+)*)\.md$")

COURSES = [
    "opencode-fundamentals",
    "opencode-workflows",
    "opencode-production",
]


class TestResult:
    """Track test results."""

    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def pass_test(self, name: str):
        self.passed += 1
        print(f"  ✅ {name}")

    def fail_test(self, name: str, reason: str):
        self.failed += 1
        self.errors.append((name, reason))
        print(f"  ❌ {name}: {reason}")

    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"Results: {self.passed}/{total} passed, {self.failed} failed")
        if self.errors:
            print("\nFailed tests:")
            for name, reason in self.errors:
                print(f"  - {name}: {reason}")
        return 0 if self.failed == 0 else 1


def test_course_json(course_dir: Path, result: TestResult):
    """Test course.json structure and content."""
    course_json = course_dir / "course.json"
    test_prefix = f"course.json ({course_dir.name})"

    if not course_json.exists():
        result.fail_test(test_prefix, "course.json not found")
        return

    try:
        data = json.loads(course_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        result.fail_test(test_prefix, f"Invalid JSON: {e}")
        return

    # Required fields
    if not data.get("area"):
        result.fail_test(f"{test_prefix} area", "Missing 'area' field")
    else:
        result.pass_test(f"{test_prefix} area")

    en = data.get("en", {})
    if not en.get("title"):
        result.fail_test(f"{test_prefix} en.title", "Missing 'en.title' field")
    else:
        result.pass_test(f"{test_prefix} en.title")

    if not en.get("description"):
        result.fail_test(f"{test_prefix} en.description", "Missing 'en.description' field")
    else:
        result.pass_test(f"{test_prefix} en.description")

    # Difficulty validation
    difficulty = data.get("difficulty", "")
    if difficulty and difficulty not in VALID_DIFFICULTIES:
        result.fail_test(f"{test_prefix} difficulty", f"Invalid: '{difficulty}'")
    else:
        result.pass_test(f"{test_prefix} difficulty")

    en_diff = en.get("difficulty", "")
    if en_diff and en_diff not in VALID_CAPITALIZED_DIFFICULTIES:
        result.fail_test(f"{test_prefix} en.difficulty", f"Invalid: '{en_diff}'")
    else:
        result.pass_test(f"{test_prefix} en.difficulty")

    # Locale sections
    for locale in ["pt", "es"]:
        locale_data = data.get(locale, {})
        if not locale_data:
            result.fail_test(f"{test_prefix} {locale}", f"Missing {locale} section")
        elif not locale_data.get("title"):
            result.fail_test(f"{test_prefix} {locale}.title", f"Missing {locale}.title")
        elif not locale_data.get("description"):
            result.fail_test(f"{test_prefix} {locale}.description", f"Missing {locale}.description")
        else:
            result.pass_test(f"{test_prefix} {locale}")


def test_lesson_file(lesson_path: Path, result: TestResult):
    """Test a single lesson file."""
    test_prefix = f"lesson ({lesson_path.parent.parent.name}/{lesson_path.parent.name}/{lesson_path.name})"

    if not lesson_path.exists():
        result.fail_test(test_prefix, "File not found")
        return

    content = lesson_path.read_text(encoding="utf-8")
    if not content.strip():
        result.fail_test(test_prefix, "File is empty")
        return

    # Check frontmatter
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        result.fail_test(f"{test_prefix} frontmatter", "Missing frontmatter")
        return

    try:
        import yaml
        frontmatter = yaml.safe_load(match.group(1))
    except Exception as e:
        result.fail_test(f"{test_prefix} frontmatter", f"Invalid YAML: {e}")
        return

    if not isinstance(frontmatter, dict):
        result.fail_test(f"{test_prefix} frontmatter", "Frontmatter must be a mapping")
        return

    # Required fields
    for field in ["title", "order"]:
        if field not in frontmatter or frontmatter[field] is None:
            result.fail_test(f"{test_prefix} {field}", f"Missing required field: {field}")
        else:
            result.pass_test(f"{test_prefix} {field}")

    # Title length
    title = str(frontmatter.get("title", "")).strip()
    if title and len(title) < 3:
        result.fail_test(f"{test_prefix} title length", f"Too short: {len(title)} chars")
    elif title:
        result.pass_test(f"{test_prefix} title length")

    # Order validation
    order = frontmatter.get("order")
    if order is not None:
        if not isinstance(order, int):
            result.fail_test(f"{test_prefix} order type", f"Must be int, got {type(order).__name__}")
        elif order < 1:
            result.fail_test(f"{test_prefix} order value", f"Must be >= 1, got {order}")
        else:
            result.pass_test(f"{test_prefix} order")

    # Check H1 matches title
    h1_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    if h1_match:
        h1_text = h1_match.group(1).strip()
        if title and h1_text != title:
            result.fail_test(f"{test_prefix} H1 match", f"H1 '{h1_text}' != title '{title}'")
        else:
            result.pass_test(f"{test_prefix} H1 match")
    else:
        result.fail_test(f"{test_prefix} H1", "Missing H1 heading")

    # Check practice questions
    has_practice_section = bool(
        re.search(r"^## .*Practice Questions", content, re.MULTILINE)
    )
    if not has_practice_section:
        result.fail_test(f"{test_prefix} practice section", "Missing '## Practice Questions'")
    else:
        result.pass_test(f"{test_prefix} practice section")

    question_blocks = re.findall(r"```question\b", content)
    if len(question_blocks) < MIN_PRACTICE_QUESTIONS:
        result.fail_test(
            f"{test_prefix} question count",
            f"Found {len(question_blocks)}, minimum {MIN_PRACTICE_QUESTIONS} required"
        )
    else:
        result.pass_test(f"{test_prefix} question count ({len(question_blocks)})")

    # Check key takeaways
    has_takeaways = bool(
        re.search(r"^## .*Key Takeaways", content, re.MULTILINE)
    ) or bool(
        re.search(r"> \[!SUCCESS\]", content)
        and re.search(r"Key Takeaways", content)
    )
    if not has_takeaways:
        result.fail_test(f"{test_prefix} key takeaways", "Missing Key Takeaways section")
    else:
        result.pass_test(f"{test_prefix} key takeaways")

    # Check code blocks are balanced (every opening has a closing)
    # Note: Not all opening fences need language identifiers (e.g., output blocks)
    all_fences = re.findall(r"^```", content, re.MULTILINE)
    fence_count = len(all_fences)
    
    # Code blocks should come in pairs (opening + closing)
    if fence_count % 2 != 0:
        result.fail_test(f"{test_prefix} code block balance", 
                        f"Odd number of fences: {fence_count}")
    else:
        result.pass_test(f"{test_prefix} code block balance ({fence_count // 2} blocks)")


def test_lesson_naming(lesson_dir: Path, result: TestResult):
    """Test lesson file naming convention."""
    test_prefix = f"naming ({lesson_dir.parent.name}/{lesson_dir.name})"

    lesson_files = list(lesson_dir.glob("*.md"))
    if not lesson_files:
        result.fail_test(test_prefix, "No lesson files found")
        return

    orders = []
    for lesson_file in lesson_files:
        match = LESSON_FILE_PATTERN.match(lesson_file.name)
        if not match:
            result.fail_test(test_prefix, f"Invalid naming: '{lesson_file.name}'")
        else:
            order = int(match.group(1))
            orders.append(order)

    if orders:
        orders.sort()
        expected = list(range(1, len(orders) + 1))
        if orders != expected:
            result.fail_test(test_prefix, f"Non-sequential orders: {orders}")
        else:
            result.pass_test(test_prefix)


def main() -> int:
    """Run all tests."""
    print("=" * 60)
    print("OpenCode Courses Test Suite")
    print("=" * 60)

    result = TestResult()
    base_dir = Path("content/courses")

    for course_name in COURSES:
        course_dir = base_dir / course_name
        print(f"\n{'─'*60}")
        print(f"Testing: {course_name}")
        print(f"{'─'*60}")

        if not course_dir.exists():
            result.fail_test(f"course dir ({course_name})", "Directory not found")
            continue

        # Test course.json
        test_course_json(course_dir, result)

        # Test each locale
        for locale in VALID_LOCALES:
            locale_dir = course_dir / locale
            if not locale_dir.exists():
                result.fail_test(f"locale dir ({course_name}/{locale})", "Directory not found")
                continue

            # Test naming
            test_lesson_naming(locale_dir, result)

            # Test each lesson
            for lesson_file in sorted(locale_dir.glob("*.md")):
                test_lesson_file(lesson_file, result)

    return result.summary()


if __name__ == "__main__":
    sys.exit(main())
