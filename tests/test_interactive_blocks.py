#!/usr/bin/env python3
"""Validate ```interactive fences in content/**/*.md (stdlib only)."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_ROOT = ROOT / "content"
FENCE_OPEN = "```interactive"
FENCE_CLOSE = "```"
VALID_TYPES = {"matching", "fillblank", "dragdrop"}
EXPECTED_TOTAL = 12


def iter_fences(path: Path):
    lines = path.read_text(encoding="utf-8").splitlines()
    index = 0
    while index < len(lines):
        if lines[index].strip() == FENCE_OPEN:
            start = index + 1
            index = start
            while index < len(lines) and lines[index].strip() != FENCE_CLOSE:
                index += 1
            yield start + 1, "\n".join(lines[start:index])
        index += 1


def validate_config(config: dict) -> list[str]:
    errors = []
    block_type = config.get("type")
    if block_type not in VALID_TYPES:
        errors.append(f"type must be one of {sorted(VALID_TYPES)}, got {block_type!r}")
        return errors

    if not isinstance(config.get("title"), str) or not config.get("title"):
        errors.append("missing or empty 'title'")

    if block_type == "matching":
        pairs = config.get("pairs")
        if not isinstance(pairs, list) or not pairs:
            errors.append("'pairs' must be a non-empty list")
        else:
            for position, pair in enumerate(pairs):
                if not isinstance(pair, dict) or not isinstance(pair.get("left"), str) or not isinstance(
                    pair.get("right"), str
                ):
                    errors.append(f"pairs[{position}] must be an object with string 'left' and 'right'")
    elif block_type == "fillblank":
        items = config.get("items")
        if not isinstance(items, list) or not items:
            errors.append("'items' must be a non-empty list")
        else:
            for position, item in enumerate(items):
                if not isinstance(item, dict) or not isinstance(item.get("prompt"), str) or not isinstance(
                    item.get("answer"), str
                ):
                    errors.append(f"items[{position}] must be an object with string 'prompt' and 'answer'")
    elif block_type == "dragdrop":
        buckets = config.get("buckets")
        if not isinstance(buckets, list) or not buckets:
            errors.append("'buckets' must be a non-empty list")
        else:
            for position, bucket in enumerate(buckets):
                if not isinstance(bucket, dict) or not isinstance(bucket.get("label"), str):
                    errors.append(f"buckets[{position}] must be an object with a string 'label'")
                    continue
                items = bucket.get("items")
                if not isinstance(items, list) or not all(isinstance(item, str) for item in items):
                    errors.append(f"buckets[{position}].items must be a list of strings")

    return errors


def collect_errors() -> list[str]:
    errors: list[str] = []
    total = 0

    for path in sorted(CONTENT_ROOT.rglob("*.md")):
        file_errors: list[str] = []
        for line_number, raw in iter_fences(path):
            total += 1
            prefix = f"{path.relative_to(ROOT)}:{line_number}"
            try:
                config = json.loads(raw)
            except json.JSONDecodeError as exc:
                file_errors.append(f"{prefix}: invalid JSON: {exc}")
                continue
            if not isinstance(config, dict):
                file_errors.append(f"{prefix}: payload must be a JSON object")
                continue
            for problem in validate_config(config):
                file_errors.append(f"{prefix}: {problem}")
        if file_errors:
            print(f"FAIL {path.relative_to(ROOT)}")
            for problem in file_errors:
                print(f"  {problem}")
            errors.extend(file_errors)

    if total != EXPECTED_TOTAL:
        message = f"expected {EXPECTED_TOTAL} interactive blocks, found {total}"
        print(message)
        errors.append(message)

    return errors


def test_interactive_blocks() -> None:
    errors = collect_errors()
    assert not errors, "\n" + "\n".join(errors)


if __name__ == "__main__":
    found = collect_errors()
    if found:
        print(f"\n{len(found)} problem(s) found", file=sys.stderr)
        sys.exit(1)
    print(f"OK: {EXPECTED_TOTAL} interactive blocks validated")
    sys.exit(0)
