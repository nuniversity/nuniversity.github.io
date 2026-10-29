#!/usr/bin/env python3
"""Final structural and quota verifier for quiz JSON files (quiz-writer skill).

Checks the whole finished bank against the plan: totals, sequential ids,
duplicate stems, giveaway ordering, allocations, charset, and (optionally)
a quota grid, a baseline snapshot and strict matching-string lengths.

Exit contract: 0 = pass (warnings allowed), 2 = blocking failure. Never exits 1.
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

REQUIRED_FIELDS = (
    "id", "slug", "kind", "category", "title", "description", "difficulty", "topic",
    "certification", "durationSeconds", "passingScore", "mockQuestionCount",
    "domains", "allocations", "questions",
)
BASELINE_KEYS = (
    "id", "slug", "kind", "category", "title", "description", "difficulty", "topic",
    "certification", "durationSeconds", "passingScore", "mockQuestionCount",
    "domains", "allocations",
)
VALID_KINDS = {"certification", "practice", "course-exam"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
VALID_TYPES = {"mcq", "multi", "tf", "ordering", "matching"}
TYPE_ORDER = ("mcq", "multi", "ordering", "matching")
ID_PATTERN = re.compile(r"^q\d{3}$")
CHAR_LIMIT = 70
BANNED_PHRASES = (
    "select all that apply",
    "choose the correct option",
    "all of the above",
    "none of the above",
)


def load_json(path: str) -> object:
    """Read a JSON file or raise with a readable message."""
    file_path = Path(path)
    if not file_path.is_file():
        raise FileNotFoundError(f"no such file: {path}")
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON in {path}: {exc}") from exc


def subprefix(subdomain: str) -> str:
    """Extract the '1.1' prefix from a full subdomain string."""
    if " - " in subdomain:
        return subdomain.split(" - ")[0]
    return subdomain[:3]


def item_strings(item: object) -> list:
    """Collect every string leaf inside an item, recursively."""
    if isinstance(item, dict):
        return [s for value in item.values() for s in item_strings(value)]
    if isinstance(item, list):
        return [s for value in item for s in item_strings(value)]
    return [item] if isinstance(item, str) else []


def _check_identity(quiz: dict, stem: str | None, errors: list) -> None:
    """id, slug and filename stem must agree; core fields must exist."""
    for field in REQUIRED_FIELDS:
        if field not in quiz or quiz[field] is None:
            errors.append(f"missing required field: {field}")
    quiz_id = quiz.get("id")
    slug = quiz.get("slug")
    if isinstance(quiz_id, str) and isinstance(slug, str) and quiz_id != slug:
        errors.append(f"id {quiz_id!r} must match slug {slug!r}")
    if stem and isinstance(quiz_id, str) and quiz_id != stem:
        errors.append(f"id {quiz_id!r} must match filename stem {stem!r}")
    kind = quiz.get("kind")
    if kind is not None and kind not in VALID_KINDS:
        errors.append(f"invalid kind {kind!r}")
    difficulty = quiz.get("difficulty")
    if difficulty is not None and difficulty not in VALID_DIFFICULTIES:
        errors.append(f"invalid difficulty {difficulty!r}")


def _check_domains(quiz: dict, errors: list) -> set:
    """Domains must declare unique, non-empty subdomain strings."""
    declared: set = set()
    domains = quiz.get("domains")
    if not isinstance(domains, list) or not domains:
        errors.append("domains must be a non-empty array")
        return declared
    for i, domain in enumerate(domains):
        if not isinstance(domain, dict):
            errors.append(f"domain {i}: must be an object")
            continue
        for field in ("id", "name", "color"):
            value = domain.get(field)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"domain {i}: missing {field!r}")
        entries = domain.get("subdomains")
        if not isinstance(entries, list) or not entries:
            errors.append(f"domain {i}: subdomains must be a non-empty array")
            continue
        for entry in entries:
            if not isinstance(entry, str) or not entry.strip():
                errors.append(f"domain {i}: subdomain must be a non-empty string")
            elif entry in declared:
                errors.append(f"domain {i}: duplicate subdomain {entry!r}")
            else:
                declared.add(entry)
    return declared


def _check_allocations(quiz: dict, declared: set, errors: list) -> None:
    """allocations: positive ints, sum 100, exact two-way match with subdomains."""
    allocations = quiz.get("allocations")
    if not isinstance(allocations, dict) or not allocations:
        errors.append("allocations must be a non-empty object")
        return
    for key, value in allocations.items():
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            errors.append(f"allocations[{key!r}] must be a positive integer")
    if all(isinstance(v, int) and not isinstance(v, bool) for v in allocations.values()):
        total = sum(allocations.values())
        if total != 100:
            errors.append(f"allocations must sum to 100, got {total}")
    if declared:
        unknown = sorted(set(allocations) - declared)
        if unknown:
            errors.append(f"allocations references unknown subdomains {unknown}")
        missing = sorted(declared - set(allocations))
        if missing:
            errors.append(f"allocations missing subdomains {missing}")


def _check_questions(quiz: dict, declared: set, errors: list, warnings: list,
                     strict_length: bool) -> None:
    """Per-question gates: ids, stems, charset, giveaway ordering, string limits."""
    questions = quiz.get("questions")
    if not isinstance(questions, list) or not questions:
        errors.append("questions must be a non-empty array")
        return
    stems: dict = {}
    overlength = 0
    banned = 0
    legacy_order = 0
    for i, item in enumerate(questions):
        if not isinstance(item, dict):
            errors.append(f"question {i + 1}: must be an object")
            continue
        label = str(item.get("id") or f"question {i + 1}")
        qid = item.get("id")
        if not isinstance(qid, str) or not ID_PATTERN.match(qid):
            errors.append(f"{label}: id must match qNNN, got {qid!r}")
        expected = f"q{i + 1:03d}"
        if qid != expected:
            errors.append(f"{label}: expected id {expected!r} at position {i + 1}, got {qid!r}")
        if isinstance(qid, str) and next(iter(item)) != "id":
            legacy_order += 1
        subdomain = item.get("subdomain")
        if declared and subdomain not in declared:
            errors.append(f"{label}: unknown subdomain {subdomain!r}")
        qtype = item.get("type")
        if qtype not in VALID_TYPES:
            errors.append(f"{label}: invalid type {qtype!r}")
            continue
        question = item.get("question")
        if not isinstance(question, str) or not question.strip():
            errors.append(f"{label}: missing question text")
            continue
        stem = question.strip().casefold()
        if stem in stems:
            errors.append(f"{label}: duplicate stem, already used by {stems[stem]}")
        else:
            stems[stem] = label
        if qtype == "ordering":
            correct = item.get("correct")
            if isinstance(correct, list) and correct == sorted(correct):
                errors.append(f"{label}: ordering answer is presented in ascending order (giveaway)")
        strings = item_strings(item)
        if any(not s.isascii() for s in strings):
            errors.append(f"{label}: contains non-ASCII text")
        if any("$" in s for s in strings):
            errors.append(f"{label}: contains a price symbol")
        low = " ".join(strings).lower()
        banned += sum(1 for phrase in BANNED_PHRASES if phrase in low)
        if qtype == "matching":
            prompts = item.get("prompts") or []
            options = item.get("options") or []
            longest = max([len(s) for s in list(prompts) + list(options)] or [0])
            if longest > CHAR_LIMIT:
                overlength += 1
                if strict_length:
                    errors.append(f"{label}: matching string over {CHAR_LIMIT} characters (longest {longest})")
    if overlength:
        warnings.append(
            f"{overlength} question(s) with matching strings over {CHAR_LIMIT} characters"
            + ("" if strict_length else " (legacy layout tolerated; --strict-length blocks)")
        )
    if banned:
        warnings.append(f"{banned} question(s) contain a banned construction phrase")
    if legacy_order:
        warnings.append(f"{legacy_order} question(s) do not lead with the id field (legacy layout)")


def _check_total(quiz: dict, target: int | None, errors: list) -> None:
    """The finished bank must hold exactly the planned number of items."""
    questions = quiz.get("questions")
    if target is None or not isinstance(questions, list):
        return
    if len(questions) != target:
        errors.append(f"total: planned {target} questions, quiz holds {len(questions)}")


def _check_grid(quiz: dict, grid: dict, target: int | None, errors: list) -> None:
    """Cell-level conformance: every planned (subdomain, type) count must match."""
    for key, value in grid.items():
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            errors.append(f"grid {key}: planned counts must be positive integers, got {value!r}")
    grid_sum = sum(v for v in grid.values() if isinstance(v, int))
    if target is not None and grid_sum != target:
        errors.append(f"grid sums to {grid_sum} but target is {target}")
    actual: Counter = Counter()
    for item in quiz.get("questions") or []:
        if isinstance(item, dict) and item.get("type") in VALID_TYPES and isinstance(item.get("subdomain"), str):
            actual[f"{subprefix(item['subdomain'])}:{item['type']}"] += 1
    for key in sorted(set(grid) | set(actual)):
        planned = grid.get(key, 0)
        got = actual.get(key, 0)
        if key not in grid and got:
            errors.append(f"grid: {key} not in the plan ({got} items)")
        elif got != planned:
            errors.append(f"grid {key}: planned {planned}, quiz has {got}")


def _check_baseline(quiz: dict, baseline: dict, errors: list) -> None:
    """The skeleton's top-level fields must not drift during authoring."""
    for key in BASELINE_KEYS:
        if key not in baseline:
            errors.append(f"baseline is missing {key!r}; cannot compare")
            continue
        if quiz.get(key) != baseline.get(key):
            errors.append(f"baseline drift: {key} differs from the snapshot")


def verify(quiz: dict, *, stem: str | None = None, target: int | None = None,
           grid: dict | None = None, baseline: dict | None = None,
           strict_length: bool = False) -> tuple:
    """Run every gate; returns (errors, warnings)."""
    errors: list = []
    warnings: list = []
    if not isinstance(quiz, dict):
        return ["quiz must be a JSON object"], warnings
    _check_identity(quiz, stem, errors)
    declared = _check_domains(quiz, errors)
    _check_allocations(quiz, declared, errors)
    _check_questions(quiz, declared, errors, warnings, strict_length)
    _check_total(quiz, target, errors)
    if grid is not None:
        if not isinstance(grid, dict) or not grid:
            errors.append("grid must be a non-empty object")
        else:
            _check_grid(quiz, grid, target, errors)
    if baseline is not None:
        if not isinstance(baseline, dict):
            errors.append("baseline must be a JSON object")
        else:
            _check_baseline(quiz, baseline, errors)
    return errors, warnings


def build_parser() -> argparse.ArgumentParser:
    """CLI definition for the final verifier."""
    parser = argparse.ArgumentParser(
        prog="verify_quiz", description="Verify a finished quiz against its plan."
    )
    parser.add_argument("--quiz", required=True, help="quiz JSON file to verify")
    parser.add_argument("--target", type=int, help="exact question count expected")
    parser.add_argument("--grid", help="quota grid JSON ('subdomain:type' -> count)")
    parser.add_argument("--baseline", help="snapshot JSON of the pristine top-level fields")
    parser.add_argument("--strict-length", action="store_true",
                        help=f"treat matching strings over {CHAR_LIMIT} characters as errors")
    return parser


def main(argv=None) -> int:
    """Entry point: 0 pass, 2 blocking failure."""
    args = build_parser().parse_args(argv)
    try:
        quiz = load_json(args.quiz)
        grid = load_json(args.grid) if args.grid else None
        baseline = load_json(args.baseline) if args.baseline else None
    except (OSError, ValueError) as exc:
        print(f"ERR: {exc}", file=sys.stderr)
        print("verify-quiz: FAIL", file=sys.stderr)
        return 2
    if not isinstance(quiz, dict):
        print("ERR: quiz must be a JSON object", file=sys.stderr)
        print("verify-quiz: FAIL", file=sys.stderr)
        return 2

    errors, warnings = verify(
        quiz, stem=Path(args.quiz).stem, target=args.target, grid=grid,
        baseline=baseline, strict_length=args.strict_length,
    )
    for warning in warnings:
        print(f"WARN: {warning}", file=sys.stderr)
    if errors:
        for error in errors:
            print(f"ERR: {error}", file=sys.stderr)
        print(f"verify-quiz: FAIL ({len(errors)} errors, {len(warnings)} warnings)", file=sys.stderr)
        return 2

    questions = quiz["questions"]
    types = Counter(q.get("type") for q in questions if isinstance(q, dict))
    subdomains = Counter(subprefix(q.get("subdomain", "?")) for q in questions if isinstance(q, dict))
    print(f"verify-quiz: PASS ({len(questions)} questions, {len(warnings)} warnings)")
    print("  types:", {t: types.get(t, 0) for t in TYPE_ORDER if t in types})
    print("  subdomains:", dict(sorted(subdomains.items())))
    if args.target is not None:
        print(f"  target: {args.target} exact")
    if grid is not None:
        print(f"  grid: {len(grid)} planned cells matched")
    return 0


if __name__ == "__main__":
    sys.exit(main())
