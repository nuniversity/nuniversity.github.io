#!/usr/bin/env python3
"""Validate quiz JSON files for Nuniversity.

Covers the generalized quiz schema under content/quizzes: shared structural
checks (identity, kind, scoring, domains, allocations) run first, then
question-bank and locale checks derived from
docs/assessment/2026-app-review/DESIGN-QUIZZES-APP.md.

Deterministic hook: exit 0 = pass, exit 2 = blocking error.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the JSON file being validated

Dependencies:
    - Standard library only (json, re, sys, os)

Exit Codes:
    0 - Validation passed (non-blocking warnings may print to stderr)
    2 - Blocking error (invalid JSON, missing fields, schema violations)
"""
import json
import os
import re
import sys
from pathlib import Path


VALID_KINDS = {"certification", "practice", "course-exam"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_QUESTION_TYPES = {"mcq", "multi", "tf", "ordering", "matching"}
VALID_LOCALES = {"en", "pt", "es"}
REQUIRED_FIELDS = (
    "id",
    "slug",
    "kind",
    "category",
    "title",
    "description",
    "durationSeconds",
    "passingScore",
    "domains",
    "allocations",
    "questions",
)


def validate_quiz(data: dict, filename_stem: str = "") -> tuple[list[str], list[str]]:
    errors = []
    warnings = []

    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    for field in ("id", "slug", "category", "title", "description"):
        value = data.get(field)
        if value is not None and (not isinstance(value, str) or not value.strip()):
            errors.append(f"Invalid {field}: must be a non-empty string")

    for field in ("topic", "certification"):
        value = data.get(field)
        if value is not None and (not isinstance(value, str) or not value.strip()):
            errors.append(f"Invalid {field}: must be a non-empty string")

    quiz_id = data.get("id")
    slug = data.get("slug")
    if isinstance(quiz_id, str) and quiz_id.strip() and isinstance(slug, str) and slug.strip():
        if quiz_id != slug:
            errors.append(f"id '{quiz_id}' must match slug '{slug}'")
    if filename_stem and isinstance(quiz_id, str) and quiz_id.strip() and quiz_id != filename_stem:
        errors.append(f"id '{quiz_id}' must match filename stem '{filename_stem}'")

    kind = data.get("kind")
    if kind is not None and (not isinstance(kind, str) or kind not in VALID_KINDS):
        errors.append(f"Invalid kind: '{kind}'. Must be one of: {', '.join(sorted(VALID_KINDS))}.")

    if "difficulty" in data and data["difficulty"] is not None:
        difficulty = data["difficulty"]
        if not isinstance(difficulty, str) or difficulty not in VALID_DIFFICULTIES:
            errors.append(f"Invalid difficulty: '{difficulty}'")

    duration = data.get("durationSeconds")
    if duration is not None and (not isinstance(duration, int) or duration <= 0):
        errors.append("durationSeconds must be a positive integer")

    passing_score = data.get("passingScore")
    if passing_score is not None and (not isinstance(passing_score, int) or passing_score <= 0 or passing_score > 100):
        errors.append("passingScore must be an integer in (0, 100]")

    mock_count = data.get("mockQuestionCount")
    if mock_count is not None and (not isinstance(mock_count, int) or mock_count <= 0):
        errors.append("mockQuestionCount must be a positive integer")

    subdomains: set[str] = set()
    domains = data.get("domains")
    if domains is not None:
        if not isinstance(domains, list) or len(domains) == 0:
            errors.append("domains must be a non-empty array")
        else:
            for i, domain in enumerate(domains):
                if not isinstance(domain, dict):
                    errors.append(f"Domain {i}: must be an object")
                    continue
                for field in ("id", "name", "color"):
                    value = domain.get(field)
                    if not isinstance(value, str) or not value.strip():
                        errors.append(f"Domain {i}: missing '{field}' field")
                entries = domain.get("subdomains")
                if not isinstance(entries, list) or len(entries) == 0:
                    errors.append(f"Domain {i}: subdomains must be a non-empty array")
                    continue
                for entry in entries:
                    if not isinstance(entry, str) or not entry.strip():
                        errors.append(f"Domain {i}: subdomains must be non-empty strings")
                    elif entry in subdomains:
                        errors.append(f"Domain {i}: duplicate subdomain '{entry}'")
                    else:
                        subdomains.add(entry)

    allocations = data.get("allocations")
    if allocations is not None:
        if not isinstance(allocations, dict) or len(allocations) == 0:
            errors.append("allocations must be a non-empty object")
            allocations = None
        else:
            values = list(allocations.values())
            for key, value in allocations.items():
                if not isinstance(value, int) or value <= 0:
                    errors.append(f"allocations['{key}'] must be a positive integer")
            if all(isinstance(value, int) for value in values):
                total = sum(values)
                if total != 100:
                    errors.append(f"allocations must sum to 100, got {total}")
            if subdomains:
                for key in sorted(allocations):
                    if key not in subdomains:
                        errors.append(f"allocations references unknown subdomain '{key}'")
                for entry in sorted(subdomains):
                    if entry not in allocations:
                        errors.append(f"allocations missing subdomain '{entry}'")

    questions = data.get("questions", [])
    if not isinstance(questions, list) or len(questions) == 0:
        errors.append("questions must be a non-empty array")
        return errors, warnings

    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            errors.append(f"Question {i}: must be an object")
            continue
        qid = q.get("id", "")
        if not isinstance(qid, str) or not re.match(r"^q\d{3}$", qid):
            errors.append(f"Question {i}: id '{qid}' must be q followed by 3 digits (e.g. q001)")

        for field in ("subdomain", "question", "explanation"):
            value = q.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"Question {i} ({qid}): missing '{field}' field")

        subdomain = q.get("subdomain")
        if isinstance(subdomain, str) and subdomain.strip() and isinstance(allocations, dict):
            if subdomain not in allocations:
                errors.append(f"Question {i} ({qid}): subdomain '{subdomain}' not found in allocations")

        qtype = q.get("type")
        if not isinstance(qtype, str) or qtype not in VALID_QUESTION_TYPES:
            expected = ", ".join(sorted(VALID_QUESTION_TYPES))
            errors.append(f"Question {i} ({qid}): invalid type '{qtype}'. Must be one of: {expected}.")
            continue

        options = q.get("options", [])
        if not isinstance(options, list):
            errors.append(f"Question {i} ({qid}): options must be an array")
            continue
        if any(not isinstance(o, str) or not o.strip() for o in options):
            errors.append(f"Question {i} ({qid}): options must be non-empty strings")
            continue

        correct = q.get("correct", -1)
        if qtype == "mcq":
            if len(options) != 4:
                errors.append(f"Question {i} ({qid}): must have exactly 4 options, found {len(options)}")
            elif not isinstance(correct, int) or correct < 0 or correct >= len(options):
                errors.append(f"Question {i} ({qid}): correct must be 0-3, got {correct}")
        elif qtype == "tf":
            if len(options) not in (2, 4):
                errors.append(f"Question {i} ({qid}): tf must have 2 or 4 options, found {len(options)}")
            elif not isinstance(correct, int) or correct < 0 or correct >= len(options):
                errors.append(f"Question {i} ({qid}): correct must be a valid option index, got {correct}")
        elif qtype == "multi":
            if len(options) < 5:
                errors.append(f"Question {i} ({qid}): multi must have at least 5 options, found {len(options)}")
            elif not isinstance(correct, list) or len(correct) < 2:
                errors.append(f"Question {i} ({qid}): multi correct must be an array of at least 2 indexes")
            elif any(not isinstance(c, int) or c < 0 or c >= len(options) for c in correct):
                errors.append(f"Question {i} ({qid}): multi correct indexes out of range")
            elif len(set(correct)) != len(correct):
                errors.append(f"Question {i} ({qid}): multi correct contains duplicate indexes")
        elif qtype == "ordering":
            if len(options) < 3 or len(options) > 6:
                errors.append(f"Question {i} ({qid}): ordering must present 3-6 items, found {len(options)}")
            elif not isinstance(correct, list) or len(correct) < 3 or len(correct) > 5:
                errors.append(f"Question {i} ({qid}): ordering correct must be an ordered subset of 3-5 indexes")
            elif len(correct) > len(options):
                errors.append(f"Question {i} ({qid}): ordering correct is longer than options")
            elif any(not isinstance(c, int) or c < 0 or c >= len(options) for c in correct):
                errors.append(f"Question {i} ({qid}): ordering correct indexes out of range")
            elif len(set(correct)) != len(correct):
                errors.append(f"Question {i} ({qid}): ordering correct contains duplicate indexes")
        elif qtype == "matching":
            prompts = q.get("prompts")
            if not isinstance(prompts, list) or len(prompts) < 3 or len(prompts) > 7:
                errors.append(f"Question {i} ({qid}): matching must have 3-7 prompts, found {prompts}")
            elif any(not isinstance(p, str) or not p.strip() for p in prompts):
                errors.append(f"Question {i} ({qid}): matching prompts must be non-empty strings")
            elif len(options) != len(prompts):
                errors.append(f"Question {i} ({qid}): matching must have as many options as prompts")
            elif not isinstance(correct, list) or len(correct) != len(prompts):
                errors.append(f"Question {i} ({qid}): matching correct must map every prompt")
            elif any(not isinstance(c, int) or c < 0 or c >= len(options) for c in correct):
                errors.append(f"Question {i} ({qid}): matching correct indexes out of range")
            elif len(set(correct)) != len(correct):
                errors.append(f"Question {i} ({qid}): matching correct must be one-to-one")

    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            continue
        expected = f"q{i + 1:03d}"
        actual = q.get("id", "")
        if actual != expected:
            errors.append(f"Question {i}: expected id '{expected}', got '{actual}'")

    locales = data.get("locales")
    if locales is not None:
        base_ids = {q.get("id") for q in questions if isinstance(q, dict)}
        base_options_len = {
            q.get("id"): len(q.get("options", []))
            for q in questions
            if isinstance(q, dict) and isinstance(q.get("options"), list)
        }
        if not isinstance(locales, dict):
            errors.append("locales must be an object")
        else:
            for loc, payload in locales.items():
                if not isinstance(loc, str) or loc not in VALID_LOCALES:
                    errors.append(
                        f"Invalid locale: '{loc}'. Must be one of: {', '.join(sorted(VALID_LOCALES))}."
                    )
                if not isinstance(payload, dict):
                    errors.append(f"locales['{loc}'] must be an object")
                    continue
                for field in ("title", "description"):
                    value = payload.get(field)
                    if not isinstance(value, str) or not value.strip():
                        errors.append(f"locales['{loc}']: missing '{field}' field")
                loc_questions = payload.get("questions")
                if loc_questions is None:
                    continue
                if not isinstance(loc_questions, dict):
                    errors.append(f"locales['{loc}'].questions must be an object")
                    continue
                for qkey, translation in loc_questions.items():
                    if qkey not in base_ids:
                        errors.append(f"locales['{loc}'].questions references unknown question id '{qkey}'")
                    if not isinstance(translation, dict):
                        errors.append(f"locales['{loc}'].questions['{qkey}'] must be an object")
                        continue
                    for field in ("question", "explanation"):
                        value = translation.get(field)
                        if value is not None and (not isinstance(value, str) or not value.strip()):
                            errors.append(
                                f"locales['{loc}'].questions['{qkey}']['{field}'] must be a non-empty string"
                            )
                    options = translation.get("options")
                    if options is None:
                        continue
                    expected_len = base_options_len.get(qkey)
                    if not isinstance(options, list) or (
                        expected_len is not None and len(options) != expected_len
                    ):
                        errors.append(
                            f"locales['{loc}'].questions['{qkey}'].options must be an array of "
                            f"{expected_len} entries matching the base question"
                        )
                    elif any(not isinstance(o, str) or not o.strip() for o in options):
                        errors.append(
                            f"locales['{loc}'].questions['{qkey}'].options must be non-empty strings"
                        )

    return errors, warnings


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
        print(f"QUIZ JSON ERROR: Invalid JSON: {e}", file=sys.stderr)
        return 2

    if not isinstance(data, dict):
        print("QUIZ JSON ERROR: Top-level value must be a JSON object", file=sys.stderr)
        return 2

    errors, warnings = validate_quiz(data, path.stem)

    if errors:
        for err in errors:
            print(f"QUIZ JSON ERROR: {err}", file=sys.stderr)
        return 2

    for warning in warnings:
        print(f"QUIZ JSON WARNING: {warning}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
