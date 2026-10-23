#!/usr/bin/env python3
"""Validate language activity JSON files for NUniversity.

Covers vocabulary activities under content/languages/vocabulary. Rules are
ported from the former game-category vocabulary validator and derived from
lib/languages/get-language-content.ts and the language player clients.

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


VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_LEVELS = {"A1", "A2", "B1"}
VALID_GAME_TYPES = {"matching", "flashcards"}


def validate_common(data: dict) -> list[str]:
    errors = []
    required = ["id", "title", "description", "difficulty"]
    for field in required:
        value = data.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"Missing required field: {field}")

    if "difficulty" in data and data["difficulty"] not in VALID_DIFFICULTIES:
        errors.append(f"Invalid difficulty: '{data['difficulty']}'")

    category = data.get("category")
    if category is not None and category != "vocabulary":
        errors.append(f"Invalid category: '{category}'. Must be 'vocabulary'.")

    return errors


def validate_language_activity(data: dict) -> list[str]:
    errors = []
    required = ["language_pair", "words"]
    for field in required:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    lp = data.get("language_pair", {})
    if not isinstance(lp, dict):
        errors.append("language_pair must be an object")
        lp = {}
    else:
        if not lp.get("source") or not lp.get("target"):
            errors.append("language_pair must have source and target")
        elif not isinstance(lp.get("source"), str) or not isinstance(lp.get("target"), str):
            errors.append("language_pair source and target must be strings")
        elif lp.get("source") == lp.get("target"):
            errors.append("language_pair source and target must differ")

    game_type = data.get("gameType")
    if game_type is not None and game_type not in VALID_GAME_TYPES:
        errors.append(f"Invalid gameType: '{game_type}'")

    for field in ("sourceLanguage", "targetLanguage"):
        value = data.get(field)
        if value is not None and not isinstance(value, str):
            errors.append(f"Invalid {field}: must be a string")

    words = data.get("words", [])
    if not isinstance(words, list):
        errors.append("words must be an array")
        return errors

    if len(words) < 40:
        errors.append(f"words array has {len(words)} entries, minimum is 40")

    seen_ids = set()
    seen_rows = set()
    for i, w in enumerate(words):
        if not isinstance(w, dict):
            errors.append(f"Word {i}: must be an object")
            continue
        for key in ("id", "source", "target", "context"):
            if key not in w or w[key] is None or (isinstance(w[key], str) and not w[key].strip()):
                errors.append(f"Word {i}: missing '{key}' field")
        wid = w.get("id")
        if isinstance(wid, str) and wid:
            if wid in seen_ids:
                errors.append(f"Duplicate word id '{wid}' at index {i}")
            seen_ids.add(wid)
        row = json.dumps({k: v for k, v in w.items() if k != "id"}, sort_keys=True, ensure_ascii=False)
        if row in seen_rows:
            errors.append(f"Duplicate word row for source '{w.get('source', '')}' at index {i}")
        seen_rows.add(row)
        for key in ("emoji", "pronunciation", "example", "exampleTranslation"):
            if key in w and w[key] is not None and not isinstance(w[key], str):
                errors.append(f"Word {i}: '{key}' must be a string")
        if "isExpression" in w and w["isExpression"] is not None and not isinstance(w["isExpression"], bool):
            errors.append(f"Word {i}: 'isExpression' must be a boolean")
        if w.get("level") is not None and w["level"] not in VALID_LEVELS:
            errors.append(f"Word {i}: invalid level '{w['level']}'")

    labels = data.get("contextLabels")
    if labels is not None:
        if not isinstance(labels, dict):
            errors.append("contextLabels must be an object")
        else:
            for context, mapping in labels.items():
                if not isinstance(mapping, dict):
                    errors.append(f"contextLabels['{context}'] must be an object")
                    continue
                for locale, label in mapping.items():
                    if not isinstance(label, str):
                        errors.append(f"contextLabels['{context}']['{locale}'] must be a string")

    locales = data.get("locales")
    if locales is not None:
        if not isinstance(locales, dict):
            errors.append("locales must be an object")
        else:
            for loc, payload in locales.items():
                if not isinstance(payload, dict):
                    errors.append(f"locales['{loc}'] must be an object")
                    continue
                for field in ("title", "description", "sourceLanguage", "targetLanguage"):
                    value = payload.get(field)
                    if value is not None and not isinstance(value, str):
                        errors.append(f"locales['{loc}']['{field}'] must be a string")
                loc_labels = payload.get("contextLabels")
                if loc_labels is not None and not isinstance(loc_labels, dict):
                    errors.append(f"locales['{loc}'].contextLabels must be an object")

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
        print(f"LANGUAGE JSON ERROR: Invalid JSON: {e}", file=sys.stderr)
        return 2

    if not isinstance(data, dict):
        print("LANGUAGE JSON ERROR: Top-level value must be a JSON object", file=sys.stderr)
        return 2

    errors = validate_common(data) + validate_language_activity(data)

    activity_id = data.get("id")
    if isinstance(activity_id, str) and activity_id and activity_id != path.stem:
        errors.append(f"id '{activity_id}' must match filename '{path.stem}'")

    if errors:
        for err in errors:
            print(f"LANGUAGE JSON ERROR: {err}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
