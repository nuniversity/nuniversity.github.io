#!/usr/bin/env python3
"""Per-batch quality gate for quiz question batches (quiz-writer skill).

Exit contract: 0 = pass, 2 = blocking failure. Never exits 1.
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

STOPWORDS = frozenset(
    "a an the of to and or in on for with is are as at by from that this be been it its their there "
    "which what when where who how not no do does did can could should would may might will shall "
    "into than then also more most such only other some any each both all".split()
)
BANNED_PHRASES = (
    "select all that apply",
    "choose the correct option",
    "all of the above",
    "none of the above",
)
CHAR_LIMIT = 70
MIN_STEM = 25
DEFAULT_THRESHOLD = 0.30
TYPES = ("mcq", "multi", "ordering", "matching")


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


def token_set(item: dict) -> set:
    """Stopword-filtered token set of the stem and its options."""
    text = str(item.get("question", "")) + " " + " ".join(item.get("options") or [])
    return {t for t in re.findall(r"[a-z0-9]+", text.lower()) if t not in STOPWORDS and len(t) > 1}


def jaccard(a: set, b: set) -> float:
    """Jaccard similarity of two token sets; 0.0 for an empty union."""
    union = a | b
    return len(a & b) / len(union) if union else 0.0


def expected_keys(item: dict) -> list:
    """Canonical field order for an item of the given type."""
    keys = ["subdomain", "type", "question"]
    if item.get("type") == "matching":
        keys.append("prompts")
    return [*keys, "options", "correct", "explanation"]


def validate_item(item: dict, index: int, char_limit: int = CHAR_LIMIT) -> list:
    """Validate one batch item against the schema; returns a list of error strings."""
    label = f"batch item {index + 1}"
    if not isinstance(item, dict):
        return [f"{label}: not a JSON object"]
    errors = []
    if "id" in item:
        errors.append(f"{label}: must not carry an id; the merge assigns it")
    strings = item_strings(item)
    if any(not s.isascii() for s in strings):
        errors.append(f"{label}: contains non-ASCII text")
    if any("$" in s for s in strings):
        errors.append(f"{label}: contains a price symbol")
    low = " ".join(strings).lower()
    for phrase in BANNED_PHRASES:
        if phrase in low:
            errors.append(f"{label}: banned phrase {phrase!r}")
    question = item.get("question")
    if not isinstance(question, str) or len(question.strip()) < MIN_STEM:
        errors.append(f"{label}: question shorter than {MIN_STEM} characters")
    explanation = item.get("explanation")
    if not isinstance(explanation, str) or not explanation.strip():
        errors.append(f"{label}: empty explanation")
    qtype = item.get("type")
    if qtype not in TYPES:
        errors.append(f"{label}: unknown type {qtype!r}")
        return errors
    if list(item.keys()) != expected_keys(item):
        errors.append(f"{label}: key order {list(item.keys())} != {expected_keys(item)}")
    options = item.get("options")
    if not isinstance(options, list) or not options or not all(isinstance(o, str) and o.strip() for o in options):
        errors.append(f"{label}: options must be a non-empty list of strings")
        return errors
    correct = item.get("correct")
    prompts = item.get("prompts")
    errors.extend(_validate_type(qtype, options, correct, label, char_limit, prompts))
    return errors


def _valid_indexes(correct, options: list) -> bool:
    """Unique integer indexes that all point inside the options list."""
    if not isinstance(correct, list) or len(set(correct)) != len(correct):
        return False
    return all(isinstance(c, int) and not isinstance(c, bool) and 0 <= c < len(options) for c in correct)


def _validate_type(qtype: str, options: list, correct, label: str, char_limit: int, prompts=None) -> list:
    """Apply the per-type rules for options and correct."""
    errors = []
    if qtype == "mcq":
        if len(options) != 4:
            errors.append(f"{label}: mcq needs exactly four options, got {len(options)}")
        if not isinstance(correct, int) or isinstance(correct, bool) or not 0 <= correct < len(options):
            errors.append(f"{label}: mcq correct must be an integer index inside the four options")
    elif qtype == "multi":
        if len(options) < 5:
            errors.append(f"{label}: multi needs at least five options, got {len(options)}")
        if not isinstance(correct, list) or len(correct) < 2:
            errors.append(f"{label}: multi needs at least two correct answers")
        elif not _valid_indexes(correct, options):
            errors.append(f"{label}: multi correct must be unique indexes inside the options")
    elif qtype == "ordering":
        if not 3 <= len(options) <= 6:
            errors.append(f"{label}: ordering needs three to six options, got {len(options)}")
        if not isinstance(correct, list) or not 3 <= len(correct) <= 5:
            errors.append(f"{label}: ordering correct must list three to five steps")
        elif not _valid_indexes(correct, options):
            errors.append(f"{label}: ordering correct must be unique indexes inside the options")
        elif correct == sorted(correct):
            errors.append(f"{label}: ordering answer is presented in ascending order (a giveaway); shuffle the options")
    elif qtype == "matching":
        errors.extend(_validate_matching(prompts, options, correct, label, char_limit))
    return errors


def _validate_matching(prompts, options: list, correct, label: str, char_limit: int) -> list:
    """Matching pair counts, string limits and permutation rules."""
    errors = []
    if not isinstance(prompts, list) or not prompts or not all(isinstance(p, str) and p.strip() for p in prompts):
        return [f"{label}: matching prompts must be a non-empty list of strings"]
    if not 3 <= len(prompts) <= 7:
        errors.append(f"{label}: matching needs three to seven pairs, got {len(prompts)}")
    if len(options) != len(prompts) or not isinstance(correct, list) or len(correct) != len(prompts):
        errors.append(f"{label}: matching prompts, options and correct must align in length")
        return errors
    longest = max(len(s) for s in prompts + options)
    if longest > char_limit:
        errors.append(f"{label}: matching string over {char_limit} characters (longest {longest})")
    if not all(isinstance(c, int) for c in correct) or sorted(correct) != list(range(len(prompts))):
        errors.append(f"{label}: matching correct must be a permutation of every prompt index")
    return errors


def check_balance(batch: list) -> list:
    """mcq correct indices must be used evenly across the batch."""
    counts = Counter(
        item["correct"]
        for item in batch
        if isinstance(item, dict) and item.get("type") == "mcq" and isinstance(item.get("correct"), int)
    )
    if not counts:
        return []
    total = sum(counts.values())
    errors = []
    if total >= 4 and len(counts) < 4:
        missing = sorted(set(range(4)) - set(counts))
        errors.append(f"mcq balance: correct index {missing} unused across {total} mcqs")
    spread = max(counts.values()) - min(counts.values())
    if spread > 2:
        errors.append(f"mcq balance: correct index spread {spread} exceeds 2 ({dict(sorted(counts.items()))})")
    return errors


def check_grid(batch: list, grid: dict) -> list:
    """Batch counts must match the Phase 0 quota grid exactly."""
    actual = Counter(
        f"{subprefix(item['subdomain'])}:{item['type']}"
        for item in batch
        if isinstance(item, dict) and item.get("type") in TYPES and isinstance(item.get("subdomain"), str)
    )
    errors = []
    for key, want in sorted(grid.items()):
        got = actual.get(key, 0)
        if got != want:
            errors.append(f"grid {key}: planned {want}, batch has {got}")
    for key, got in sorted(actual.items()):
        if key not in grid:
            errors.append(f"grid: {key} not in the plan ({got} items)")
    return errors


def check_dedup(batch: list, quiz: dict, siblings: list, threshold: float, skip_dedup: bool) -> tuple:
    """Exact-stem and Jaccard gates; returns (errors, report)."""
    errors = []
    bank = [q for q in quiz.get("questions", []) if isinstance(q, dict)]
    bank_stems = {q.get("question", "").strip().lower() for q in bank}
    bank_tokens = [(token_set(q), q.get("question", "")[:60]) for q in bank]
    sib_tokens = [(token_set(q), q.get("question", "")[:60]) for q in siblings if isinstance(q, dict)]
    report = {"worst_bank": 0.0, "worst_sibling": 0.0, "worst_intra": 0.0}
    for i, item in enumerate(batch):
        if not isinstance(item, dict):
            continue
        stem = str(item.get("question", "")).strip().lower()
        tokens = token_set(item)
        if not skip_dedup:
            if stem in bank_stems:
                errors.append(f"batch item {i + 1}: exact stem duplicate of a bank question")
            worst, who = _closest(tokens, bank_tokens)
            report["worst_bank"] = max(report["worst_bank"], worst)
            if worst > threshold:
                errors.append(f"batch item {i + 1}: jaccard {worst:.3f} vs bank over {threshold}: {who!r}")
            worst, who = _closest(tokens, sib_tokens)
            report["worst_sibling"] = max(report["worst_sibling"], worst)
            if worst > threshold:
                errors.append(f"batch item {i + 1}: jaccard {worst:.3f} vs sibling over {threshold}: {who!r}")
    for i in range(len(batch)):
        for j in range(i + 1, len(batch)):
            a, b = batch[i], batch[j]
            if not isinstance(a, dict) or not isinstance(b, dict):
                continue
            worst = jaccard(token_set(a), token_set(b))
            report["worst_intra"] = max(report["worst_intra"], worst)
            if worst > threshold:
                errors.append(f"batch items {i + 1} and {j + 1}: intra-batch jaccard {worst:.3f} over {threshold}")
    return errors, report


def _closest(tokens: set, pool: list) -> tuple:
    """Highest similarity and the stem that produced it."""
    worst, who = 0.0, ""
    for other, stem in pool:
        score = jaccard(tokens, other)
        if score > worst:
            worst, who = score, stem
    return worst, who


def validate_batch(batch, quiz, siblings=None, grid=None, threshold=DEFAULT_THRESHOLD,
                    skip_dedup=False, char_limit=CHAR_LIMIT) -> tuple:
    """Run every gate over one batch; returns (errors, report)."""
    errors = []
    if not isinstance(batch, list) or not batch:
        return ["batch: must be a non-empty JSON array of items"], {"total": 0}
    known = {s for dom in quiz.get("domains", []) for s in dom.get("subdomains", [])}
    for i, item in enumerate(batch):
        errors.extend(validate_item(item, i, char_limit))
        if isinstance(item, dict) and item.get("subdomain") not in known:
            errors.append(f"batch item {i + 1}: unknown subdomain {item.get('subdomain')!r}")
    errors.extend(check_balance(batch))
    if grid is not None:
        errors.extend(check_grid(batch, grid))
    dedup_errors, report = check_dedup(batch, quiz, siblings or [], threshold, skip_dedup)
    errors.extend(dedup_errors)
    report["total"] = len(batch)
    report["types"] = dict(Counter(item.get("type") for item in batch if isinstance(item, dict)))
    return errors, report


def build_parser() -> argparse.ArgumentParser:
    """CLI definition for the batch gate."""
    parser = argparse.ArgumentParser(
        prog="validate_batch", description="Validate a quiz question batch before merging."
    )
    parser.add_argument("--quiz", required=True, help="target quiz JSON (for subdomains and dedup)")
    parser.add_argument("--batch", required=True, help="batch JSON array to validate")
    parser.add_argument("--sibling", action="append", default=[], help="sibling batch JSON (repeatable)")
    parser.add_argument("--grid", help="JSON file mapping 'subdomain:type' to planned counts")
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD, help="Jaccard ceiling (default 0.30)")
    parser.add_argument("--char-limit", type=int, default=CHAR_LIMIT, help="matching string ceiling (default 70)")
    parser.add_argument(
        "--skip-dedup", action="store_true",
        help="skip external bank/sibling comparisons (intra-batch still runs)",
    )
    return parser


def main(argv=None) -> int:
    """Entry point: 0 pass, 2 blocking failure."""
    args = build_parser().parse_args(argv)
    try:
        quiz = load_json(args.quiz)
        batch = load_json(args.batch)
        siblings = [q for path in args.sibling for q in load_json(path)]
        grid = load_json(args.grid) if args.grid else None
    except (OSError, ValueError) as exc:
        print(f"ERR: {exc}", file=sys.stderr)
        return 2
    if not isinstance(quiz, dict):
        print(f"ERR: {args.quiz}: quiz must be a JSON object", file=sys.stderr)
        return 2
    errors, report = validate_batch(
        batch, quiz, siblings=siblings, grid=grid,
        threshold=args.threshold, skip_dedup=args.skip_dedup, char_limit=args.char_limit,
    )
    if errors:
        for error in errors:
            print(f"ERR: {error}", file=sys.stderr)
        print(f"validate-batch: FAIL ({len(errors)} errors, {report.get('total', 0)} items)", file=sys.stderr)
        return 2
    print(
        f"validate-batch: PASS ({report['total']} items, types {report['types']}, "
        f"worst jaccard bank {report.get('worst_bank', 0):.3f} "
        f"sibling {report.get('worst_sibling', 0):.3f} intra {report.get('worst_intra', 0):.3f}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
