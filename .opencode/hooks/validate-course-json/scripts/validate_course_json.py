#!/usr/bin/env python3
"""Validate course.json metadata files for NUniversity.

Deterministic hook: exit 0 = pass, exit 2 = blocking error.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the course.json file being validated

Exit Codes:
    0 - Validation passed
    2 - Blocking error (invalid JSON, missing required fields)
"""
import json
import os
import sys
from pathlib import Path


VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_CAPITALIZED_DIFFICULTIES = {"Beginner", "Intermediate", "Advanced"}


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
        print(f"COURSE JSON ERROR: Invalid JSON: {e}", file=sys.stderr)
        return 2

    errors = []

    if not data.get("area"):
        errors.append("Missing required field: area")

    en = data.get("en", {})
    if not en.get("title"):
        errors.append("Missing required field: en.title")
    if not en.get("description"):
        errors.append("Missing required field: en.description")

    difficulty = data.get("difficulty", "")
    if difficulty and difficulty not in VALID_DIFFICULTIES:
        errors.append(f"Invalid difficulty: '{difficulty}'. Must be beginner, intermediate, or advanced.")

    en_diff = en.get("difficulty", "")
    if en_diff and en_diff not in VALID_CAPITALIZED_DIFFICULTIES:
        errors.append(f"Invalid en.difficulty: '{en_diff}'. Must be Beginner, Intermediate, or Advanced.")

    if errors:
        for err in errors:
            print(f"COURSE JSON ERROR: {err}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
