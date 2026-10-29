#!/usr/bin/env python3
"""Deterministic batch merge and renumber for quiz JSON (quiz-writer skill).

Exit contract: 0 = merged and written, 2 = blocked. Never exits 1.
Preserves every top-level field (including mockQuestionCount) and emits
canonical field order with the id first.
"""
import argparse
import collections
import json
import os
import sys
from pathlib import Path

REQUIRED_ITEM_KEYS = ("subdomain", "type", "question", "options", "correct", "explanation")


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


def canonical(item: dict, qid: str) -> dict:
    """Return a copy of item with the id placed first."""
    return {"id": qid, **{k: v for k, v in item.items() if k != "id"}}


def merge(quiz: dict, batches: list) -> tuple:
    """Merge batch items into the quiz; returns (merged_quiz, errors)."""
    existing = [dict(q) for q in quiz.get("questions", []) if isinstance(q, dict)]
    added = [item for batch in batches for item in batch]
    errors = []
    for item in added:
        if not isinstance(item, dict):
            errors.append("batch contains an entry that is not a JSON object")
            continue
        missing = [k for k in REQUIRED_ITEM_KEYS if k not in item]
        if missing:
            errors.append(f"batch item {item.get('question', '?')[:50]!r} missing keys {missing}")
    if errors:
        return None, errors
    all_questions = existing + added
    stems = collections.Counter(q.get("question", "").strip().lower() for q in all_questions)
    dups = [s for s, c in stems.items() if c > 1]
    if dups:
        return None, [f"duplicate stem: {s[:100]!r}" for s in dups]
    order = [s for dom in quiz.get("domains", []) for s in dom.get("subdomains", [])]
    known = set(order)
    for q in all_questions:
        if q.get("subdomain") not in known:
            return None, [f"unknown subdomain {q.get('subdomain')!r}"]
    groups = collections.defaultdict(list)
    for q in all_questions:
        groups[q["subdomain"]].append(q)
    questions = []
    for subdomain in order:
        for item in groups.get(subdomain, []):
            questions.append(canonical(item, f"q{len(questions) + 1:03d}"))
    merged = dict(quiz)
    merged["questions"] = questions
    return merged, []


def write_atomic(path: str, data: dict) -> None:
    """Write pretty-printed JSON atomically in the repo's file style."""
    target = Path(path)
    tmp = target.with_name(target.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(tmp, target)


def report(merged: dict) -> None:
    """Print the post-merge summary on stdout."""
    questions = merged["questions"]
    print("written:", len(questions))
    print(dict(collections.Counter(q["type"] for q in questions)))
    print(dict(sorted(collections.Counter(subprefix(q["subdomain"]) for q in questions).items())))
    print("duplicate stems: 0")


def build_parser() -> argparse.ArgumentParser:
    """CLI definition for the merge step."""
    parser = argparse.ArgumentParser(prog="merge_batches", description="Merge validated batches into a quiz JSON file.")
    parser.add_argument("--quiz", required=True, help="target quiz JSON (updated in place unless --out)")
    parser.add_argument("--batch", action="append", required=True, help="validated batch JSON (repeatable)")
    parser.add_argument("--out", help="write the merged result here instead of in place")
    parser.add_argument("--dry-run", action="store_true", help="validate and report without writing")
    return parser


def main(argv=None) -> int:
    """Entry point: 0 written, 2 blocked."""
    args = build_parser().parse_args(argv)
    try:
        quiz = load_json(args.quiz)
        batches = [load_json(path) for path in args.batch]
    except (OSError, ValueError) as exc:
        print(f"ERR: {exc}", file=sys.stderr)
        return 2
    if not isinstance(quiz, dict):
        print(f"ERR: {args.quiz}: quiz must be a JSON object", file=sys.stderr)
        return 2
    for path, batch in zip(args.batch, batches, strict=True):
        if not isinstance(batch, list):
            print(f"ERR: {path}: batch must be a JSON array", file=sys.stderr)
            return 2
    merged, errors = merge(quiz, batches)
    if errors:
        for error in errors:
            print(f"ERR: {error}", file=sys.stderr)
        print(f"merge-batches: FAIL ({len(errors)} errors)", file=sys.stderr)
        return 2
    report(merged)
    if not args.dry_run:
        write_atomic(args.out or args.quiz, merged)
    return 0


if __name__ == "__main__":
    sys.exit(main())
