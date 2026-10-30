#!/usr/bin/env python3
"""Coverage ratchet gate for Nuniversity unit tests.

Compares `.coverage/coverage-summary.json` (produced by
`npm run test:coverage`) with the recorded floor in
`references/coverage-floor.json`.

Policy:
- A floor may only move upward. The script never writes the floor file; the
  agent edits it after a deliberate improvement.
- Missing or unreadable input is blocking (exit 2), never a silent pass.

Usage:
    .venv/bin/python .opencode/skills/unit-tests/scripts/coverage_gate.py
    ... --summary <file> --floor <file>

Exit Codes:
    0 - Every metric is at or above the floor
    2 - Missing input, malformed metrics, or a metric below the floor
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_SUMMARY = REPO_ROOT / ".coverage/coverage-summary.json"
DEFAULT_FLOOR = REPO_ROOT / ".opencode/skills/unit-tests/references/coverage-floor.json"

METRICS = ("lines", "statements", "functions", "branches")


def load_json(path: Path, label: str) -> dict | None:
    if not path.exists():
        print(f"ERROR: {label} not found: {path}", file=sys.stderr)
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"ERROR: cannot read {label} {path}: {error}", file=sys.stderr)
        return None
    if not isinstance(payload, dict):
        print(f"ERROR: {label} must be a JSON object: {path}", file=sys.stderr)
        return None
    return payload


def metric_value(summary: dict, metric: str) -> float | None:
    value = summary.get(metric)
    if isinstance(value, dict):
        value = value.get("pct")
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return float(value)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--summary", type=Path, default=DEFAULT_SUMMARY)
    parser.add_argument("--floor", type=Path, default=DEFAULT_FLOOR)
    args = parser.parse_args(argv)

    summary = load_json(args.summary, "coverage summary")
    floor = load_json(args.floor, "coverage floor")
    if summary is None or floor is None:
        print(
            "coverage gate: run `npm run test:coverage` and retry",
            file=sys.stderr,
        )
        return 2

    total = summary.get("total")
    if not isinstance(total, dict):
        print("ERROR: coverage summary has no `total` object", file=sys.stderr)
        return 2

    report: dict[str, dict[str, float]] = {}
    failures: list[str] = []
    ratchet: list[str] = []

    for metric in METRICS:
        expected = floor.get(metric)
        if isinstance(expected, bool) or not isinstance(expected, (int, float)):
            print(f"ERROR: floor is missing numeric `{metric}`", file=sys.stderr)
            return 2
        actual = metric_value(total, metric)
        if actual is None:
            print(f"ERROR: summary is missing numeric `total.{metric}.pct`", file=sys.stderr)
            return 2
        report[metric] = {"actual": round(actual, 2), "floor": float(expected)}
        if actual + 1e-9 < float(expected):
            failures.append(f"{metric}: {actual:.2f}% < floor {float(expected):.2f}%")
        elif actual > float(expected):
            ratchet.append(f"{metric}: +{actual - float(expected):.2f} points available")

    print("coverage gate:")
    for metric in METRICS:
        row = report[metric]
        status = "FAIL" if row["actual"] + 1e-9 < row["floor"] else "PASS"
        print(f"  {status} {metric:10s} {row['actual']:6.2f}%  floor {row['floor']:6.2f}%")
    if ratchet:
        print("  ratchet available (update references/coverage-floor.json):")
        for line in ratchet:
            print(f"    {line}")

    payload = {"ok": not failures, "metrics": report, "failures": failures}
    print("coverage gate: PASS" if not failures else "coverage gate: FAIL")
    print("---JSON---")
    print(json.dumps(payload, indent=2))

    if failures:
        for failure in failures:
            print(f"  {failure}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
