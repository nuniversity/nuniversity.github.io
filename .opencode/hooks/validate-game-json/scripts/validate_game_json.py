#!/usr/bin/env python3
"""Validate quiz and vocabulary game JSON files for NUniversity.

Deterministic hook: exit 0 = pass, exit 2 = blocking error.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the JSON file being validated

Dependencies:
    - Standard library only (json, re, sys, os)

Exit Codes:
    0 - Validation passed
    2 - Blocking error (invalid JSON, missing fields, schema violations)
"""
import json
import os
import re
import sys
from pathlib import Path


VALID_CATEGORIES = {"quiz", "vocabulary"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}


def validate_quiz(data: dict) -> list[str]:
    errors = []
    required = ["id", "title", "difficulty", "category", "questions"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    if "difficulty" in data and data["difficulty"] not in VALID_DIFFICULTIES:
        errors.append(f"Invalid difficulty: '{data['difficulty']}'")

    questions = data.get("questions", [])
    if not isinstance(questions, list) or len(questions) == 0:
        errors.append("questions must be a non-empty array")
        return errors

    for i, q in enumerate(questions):
        qid = q.get("id", "")
        if not re.match(r"^q\d{3}$", qid):
            errors.append(f"Question {i}: id '{qid}' must be q followed by 3 digits (e.g. q001)")

        options = q.get("options", [])
        if len(options) != 4:
            errors.append(f"Question {i} ({qid}): must have exactly 4 options, found {len(options)}")

        correct = q.get("correct", -1)
        if not isinstance(correct, int) or correct < 0 or correct > 3:
            errors.append(f"Question {i} ({qid}): correct must be 0-3, got {correct}")

    for i, q in enumerate(questions):
        expected = f"q{i + 1:03d}"
        actual = q.get("id", "")
        if actual != expected:
            errors.append(f"Question {i}: expected id '{expected}', got '{actual}'")

    return errors


def validate_vocabulary(data: dict) -> list[str]:
    errors = []
    required = ["id", "title", "difficulty", "category", "language_pair", "words"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    lp = data.get("language_pair", {})
    if not lp.get("source") or not lp.get("target"):
        errors.append("language_pair must have source and target")

    words = data.get("words", [])
    if not isinstance(words, list):
        errors.append("words must be an array")
        return errors

    if len(words) < 40:
        errors.append(f"words array has {len(words)} entries, minimum is 40")

    seen_sources = set()
    for i, w in enumerate(words):
        for key in ("source", "target", "context"):
            if key not in w or not w[key]:
                errors.append(f"Word {i}: missing '{key}' field")
        src = w.get("source", "")
        if src in seen_sources:
            errors.append(f"Duplicate source word '{src}' at index {i}")
        seen_sources.add(src)

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
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"GAME JSON ERROR: Invalid JSON: {e}", file=sys.stderr)
        return 2

    category = data.get("category", "")
    if not category:
        print("GAME JSON ERROR: Missing 'category' field", file=sys.stderr)
        return 2

    if category not in VALID_CATEGORIES:
        print(f"GAME JSON ERROR: Unknown category: '{category}'. Must be 'quiz' or 'vocabulary'.", file=sys.stderr)
        return 2

    if category == "quiz":
        errors = validate_quiz(data)
    else:
        errors = validate_vocabulary(data)

    if errors:
        for err in errors:
            print(f"GAME JSON ERROR: {err}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
