#!/usr/bin/env python3
"""Validate game JSON files for NUniversity.

Covers every game category under content/games: coding, conversation, logic,
math, physics, and puzzles. Shared rules (JSON shape, title, category,
difficulty) run first, then category-specific structural checks derived from
lib/games/get-game-content.ts and the game client components.

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
import sys
from pathlib import Path


VALID_CATEGORIES = {"coding", "conversation", "logic", "math", "physics", "puzzles"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_MATH_OPERATIONS = {"add", "subtract", "multiply", "divide"}
BINARY_HEX_MODES = {"dec-to-bin", "bin-to-dec", "dec-to-hex", "hex-to-dec", "bin-to-hex", "hex-to-bin"}
PERIODIC_MODES = {"symbol-to-name", "name-to-symbol", "number-to-element", "element-to-number"}


def validate_common(data: dict) -> list[str]:
    errors = []
    required = ["id", "title", "description", "difficulty", "category"]
    for field in required:
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"Missing required field: {field}")

    if "difficulty" in data and data["difficulty"] not in VALID_DIFFICULTIES:
        errors.append(f"Invalid difficulty: '{data['difficulty']}'")

    return errors


def validate_difficulty_levels(levels, numeric_fields: tuple) -> list[str]:
    errors = []
    if levels is None:
        return errors
    if not isinstance(levels, dict):
        return ["difficultyLevels must be an object"]

    for level in ("beginner", "intermediate", "advanced"):
        entry = levels.get(level)
        if not isinstance(entry, dict):
            errors.append(f"difficultyLevels missing '{level}' entry")
            continue
        for field in numeric_fields:
            value = entry.get(field)
            if not isinstance(value, int) or value <= 0:
                errors.append(f"difficultyLevels.{level}.{field} must be a positive integer")
    return errors


def validate_coding(data: dict) -> list[str]:
    errors = []
    has_modes = data.get("modes") is not None
    has_snippets = data.get("snippets") is not None
    if not has_modes and not has_snippets:
        errors.append("coding game must define 'modes' or 'snippets'")
        return errors

    if has_modes:
        modes = data.get("modes")
        if not isinstance(modes, list) or len(modes) == 0:
            errors.append("modes must be a non-empty array")
        else:
            seen = set()
            for mode in modes:
                if mode not in BINARY_HEX_MODES:
                    errors.append(f"Invalid mode: '{mode}'")
                elif mode in seen:
                    errors.append(f"Duplicate mode: '{mode}'")
                if isinstance(mode, str):
                    seen.add(mode)
        if data.get("difficultyLevels") is None:
            errors.append("Missing required field: difficultyLevels")
        else:
            errors.extend(validate_difficulty_levels(data.get("difficultyLevels"), ("maxBits",)))

    if has_snippets:
        durations = data.get("durations")
        if not isinstance(durations, list) or len(durations) == 0:
            errors.append("durations must be a non-empty array")
        else:
            for duration in durations:
                if not isinstance(duration, int) or duration <= 0:
                    errors.append(f"Invalid duration: '{duration}'")

        snippets = data.get("snippets")
        if not isinstance(snippets, dict) or len(snippets) == 0:
            errors.append("snippets must be a non-empty object")
            return errors

        languages = data.get("languages")
        if not isinstance(languages, list) or len(languages) == 0:
            errors.append("languages must be a non-empty array")
        else:
            for language in languages:
                if not isinstance(language, str) or not language.strip():
                    errors.append(f"Invalid language: '{language}'")
                elif language not in snippets:
                    errors.append(f"language '{language}' has no snippets")
            for key in snippets:
                if key not in languages:
                    errors.append(f"snippets key '{key}' missing from languages")

        for key, items in snippets.items():
            if not isinstance(items, list) or len(items) == 0:
                errors.append(f"snippets['{key}'] must be a non-empty array")
                continue
            for j, snippet in enumerate(items):
                if not isinstance(snippet, dict):
                    errors.append(f"snippets['{key}'][{j}] must be an object")
                    continue
                for field in ("code", "language"):
                    value = snippet.get(field)
                    if not isinstance(value, str) or not value.strip():
                        errors.append(f"snippets['{key}'][{j}]: missing '{field}' field")

    return errors


def validate_conversation(data: dict) -> list[str]:
    errors = []
    required = ["sets", "finalExercise"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    final = data.get("finalExercise")
    if final is not None:
        if not isinstance(final, dict):
            errors.append("finalExercise must be an object")
        else:
            for field in ("title", "description"):
                value = final.get(field)
                if not isinstance(value, str) or not value.strip():
                    errors.append(f"finalExercise missing '{field}' field")
            duration = final.get("durationSeconds")
            if not isinstance(duration, int) or duration <= 0:
                errors.append("finalExercise.durationSeconds must be a positive integer")

    locales = data.get("locales")
    if locales is not None:
        if not isinstance(locales, dict):
            errors.append("locales must be an object")
        else:
            for loc, payload in locales.items():
                if not isinstance(payload, dict):
                    errors.append(f"locales['{loc}'] must be an object")
                    continue
                for field in ("title", "description"):
                    value = payload.get(field)
                    if value is not None and not isinstance(value, str):
                        errors.append(f"locales['{loc}']['{field}'] must be a string")
                loc_sets = payload.get("sets")
                if loc_sets is not None and not isinstance(loc_sets, list):
                    errors.append(f"locales['{loc}'].sets must be an array")
                loc_final = payload.get("finalExercise")
                if loc_final is not None and not isinstance(loc_final, dict):
                    errors.append(f"locales['{loc}'].finalExercise must be an object")

    sets = data.get("sets", [])
    if not isinstance(sets, list) or len(sets) == 0:
        errors.append("sets must be a non-empty array")
        return errors

    seen_set_ids = set()
    seen_qids = set()
    numbers = []
    for i, s in enumerate(sets):
        if not isinstance(s, dict):
            errors.append(f"Set {i}: must be an object")
            continue
        sid = s.get("id")
        if not isinstance(sid, int):
            errors.append(f"Set {i}: id must be an integer")
        elif sid in seen_set_ids:
            errors.append(f"Duplicate set id '{sid}' at index {i}")
        else:
            seen_set_ids.add(sid)
        for field in ("name", "subtitle", "description", "color"):
            value = s.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"Set {i}: missing '{field}' field")
        questions = s.get("questions")
        if not isinstance(questions, list) or len(questions) == 0:
            errors.append(f"Set {i}: questions must be a non-empty array")
            continue
        for j, q in enumerate(questions):
            if not isinstance(q, dict):
                errors.append(f"Set {i} question {j}: must be an object")
                continue
            qid = q.get("id")
            if not isinstance(qid, str) or not qid.strip():
                errors.append(f"Set {i} question {j}: missing 'id' field")
            elif qid in seen_qids:
                errors.append(f"Duplicate question id '{qid}' in set {i} at index {j}")
            else:
                seen_qids.add(qid)
            number = q.get("number")
            if not isinstance(number, int):
                errors.append(f"Set {i} question {j}: number must be an integer")
            numbers.append(number)
            text = q.get("text")
            if not isinstance(text, str) or not text.strip():
                errors.append(f"Set {i} question {j}: missing 'text' field")

    if numbers and numbers != list(range(1, len(numbers) + 1)):
        errors.append("question numbers must be sequential from 1 across sets")

    return errors


def validate_logic(data: dict) -> list[str]:
    errors = []
    required = ["startingLength", "maxLength", "displayTimeMs", "maxDigits"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    for field in required:
        value = data.get(field)
        if value is not None and (not isinstance(value, int) or value <= 0):
            errors.append(f"{field} must be a positive integer")

    starting = data.get("startingLength")
    maximum = data.get("maxLength")
    if isinstance(starting, int) and isinstance(maximum, int) and starting > maximum:
        errors.append("startingLength must not exceed maxLength")

    return errors


def validate_math(data: dict) -> list[str]:
    errors = []
    required = ["operations", "difficultyLevels"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    operations = data.get("operations", [])
    if not isinstance(operations, list) or len(operations) == 0:
        errors.append("operations must be a non-empty array")
    else:
        seen = set()
        for op in operations:
            if op not in VALID_MATH_OPERATIONS:
                errors.append(f"Invalid operation: '{op}'")
            elif op in seen:
                errors.append(f"Duplicate operation: '{op}'")
            if isinstance(op, str):
                seen.add(op)

    errors.extend(validate_difficulty_levels(data.get("difficultyLevels"), ("maxNumber", "timeSeconds")))

    return errors


def validate_physics(data: dict) -> list[str]:
    errors = []
    required = ["modes", "elements"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    modes = data.get("modes", [])
    if not isinstance(modes, list) or len(modes) == 0:
        errors.append("modes must be a non-empty array")
    else:
        seen = set()
        for mode in modes:
            if mode not in PERIODIC_MODES:
                errors.append(f"Invalid mode: '{mode}'")
            elif mode in seen:
                errors.append(f"Duplicate mode: '{mode}'")
            if isinstance(mode, str):
                seen.add(mode)

    elements = data.get("elements", [])
    if not isinstance(elements, list) or len(elements) == 0:
        errors.append("elements must be a non-empty array")
        return errors

    seen_numbers = set()
    seen_symbols = set()
    for i, element in enumerate(elements):
        if not isinstance(element, dict):
            errors.append(f"Element {i}: must be an object")
            continue
        for field in ("symbol", "name", "category"):
            value = element.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"Element {i}: missing '{field}' field")
        for field in ("number", "group", "period"):
            value = element.get(field)
            if not isinstance(value, int) or value <= 0:
                errors.append(f"Element {i}: {field} must be a positive integer")
        symbol = element.get("symbol")
        if isinstance(symbol, str) and symbol:
            if symbol in seen_symbols:
                errors.append(f"Element {i}: duplicate symbol '{symbol}'")
            seen_symbols.add(symbol)
        number = element.get("number")
        if isinstance(number, int):
            if number in seen_numbers:
                errors.append(f"Element {i}: duplicate number {number}")
            seen_numbers.add(number)

    return errors


def validate_puzzles(data: dict) -> list[str]:
    errors = []
    required = ["categories"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    categories = data.get("categories", [])
    if not isinstance(categories, dict) or len(categories) == 0:
        errors.append("categories must be a non-empty object")
        return errors

    for name, words in categories.items():
        if not isinstance(words, list) or len(words) == 0:
            errors.append(f"Category '{name}' must be a non-empty array")
            continue
        seen = set()
        for word in words:
            if not isinstance(word, str) or not word.strip():
                errors.append(f"Category '{name}': words must be non-empty strings")
            elif word in seen:
                errors.append(f"Duplicate word '{word}' in category '{name}'")
            else:
                seen.add(word)

    return errors


VALIDATORS = {
    "coding": validate_coding,
    "conversation": validate_conversation,
    "logic": validate_logic,
    "math": validate_math,
    "physics": validate_physics,
    "puzzles": validate_puzzles,
}


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

    if not isinstance(data, dict):
        print("GAME JSON ERROR: Top-level value must be a JSON object", file=sys.stderr)
        return 2

    category = data.get("category", "")
    if not category:
        print("GAME JSON ERROR: Missing 'category' field", file=sys.stderr)
        return 2

    if category not in VALID_CATEGORIES:
        expected = ", ".join(sorted(VALID_CATEGORIES))
        print(f"GAME JSON ERROR: Unknown category: '{category}'. Must be one of: {expected}.", file=sys.stderr)
        return 2

    errors = validate_common(data) + VALIDATORS[category](data)

    if errors:
        for err in errors:
            print(f"GAME JSON ERROR: {err}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
