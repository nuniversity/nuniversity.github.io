#!/usr/bin/env python3
"""Hygiene gate for Nuniversity unit/component tests.

Deterministic script: exit 0 = pass, exit 2 = blocking. The rule set is
intentionally narrow: it reports only patterns that are never legitimate in a
deterministic unit/component suite, so a clean tree passes today.

Rules:
    skip-only          it.only / it.skip / describe.only / describe.skip / it.todo
    console-log        console.log left in a test
    nondeterministic-clock  Date.now() or new Date() with no argument
    randomness         Math.random() in a test
    ts-ignore          @ts-ignore (prefer @ts-expect-error with a reason)
    screen-debug       screen.debug() left in a test
    wait-timeout       waitForTimeout in a unit test

Known, justified exceptions live in a JSON allowlist:
    {"allow": [{"rule": "console-log", "path": "tests/x.test.ts", "reason": "..."}]}

Usage:
    .venv/bin/python .opencode/skills/unit-tests/scripts/check_unit_hygiene.py
    ... --root <repo> --allowlist <file> --report-only

Exit Codes:
    0 - Clean (or --report-only)
    2 - Violations found
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_ALLOWLIST = REPO_ROOT / ".opencode/skills/unit-tests/references/unit-hygiene-allowlist.json"

RULES: list[tuple[str, re.Pattern[str], str]] = [
    (
        "skip-only",
        re.compile(r"\b(?:it|test|describe)\.(?:only|skip)\s*\(|\b(?:it|test)\.todo\s*\("),
        "skip/nested focus must not be committed; use a documented allowlist instead",
    ),
    (
        "console-log",
        re.compile(r"\bconsole\.log\s*\("),
        "remove debug logging or assert the behaviour instead",
    ),
    (
        "nondeterministic-clock",
        re.compile(r"\bDate\.now\s*\(|\bnew\s+Date\s*\(\s*\)"),
        "Date.now()/new Date() are nondeterministic; inject a clock or use a fixed date",
    ),
    (
        "randomness",
        re.compile(r"\bMath\.random\s*\("),
        "Math.random() is nondeterministic; seed it or inject the random source",
    ),
    (
        "ts-ignore",
        re.compile(r"@ts-ignore\b"),
        "use @ts-expect-error with a reason, or fix the type",
    ),
    (
        "screen-debug",
        re.compile(r"\bscreen\.debug\s*\("),
        "screen.debug() is leftover debugging; remove it",
    ),
    (
        "wait-timeout",
        re.compile(r"\bwaitForTimeout\s*\("),
        "fixed sleeps are not allowed; wait on the user-visible state",
    ),
]


@dataclass(frozen=True)
class Violation:
    rule: str
    path: str
    line: int
    reason: str
    text: str


def iter_test_files(root: Path) -> list[Path]:
    tests = root / "tests"
    if not tests.exists():
        return []
    files = []
    for path in sorted(tests.rglob("*")):
        if path.suffix not in {".ts", ".tsx"}:
            continue
        relative = path.relative_to(tests)
        if relative.parts and relative.parts[0] == "e2e":
            continue
        files.append(path)
    return files


def load_allowlist(path: Path | None) -> set[tuple[str, str]]:
    if path is None or not path.exists():
        return set()
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"ERROR: cannot read allowlist {path}: {error}", file=sys.stderr)
        return set()
    allowed: set[tuple[str, str]] = set()
    for entry in payload.get("allow", []):
        rule = entry.get("rule")
        rel = entry.get("path")
        reason = entry.get("reason")
        if not rule or not rel or not reason:
            print(f"WARNING: ignored incomplete allowlist entry: {entry}", file=sys.stderr)
            continue
        allowed.add((rule, rel))
    return allowed


def scan(root: Path, allowlist_path: Path | None) -> list[Violation]:
    allowed = load_allowlist(allowlist_path)
    violations: list[Violation] = []
    for path in iter_test_files(root):
        rel = path.relative_to(root).as_posix()
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError) as error:
            print(f"WARNING: cannot read {rel}: {error}", file=sys.stderr)
            continue
        for number, line in enumerate(lines, start=1):
            for rule, pattern, reason in RULES:
                if not pattern.search(line):
                    continue
                if (rule, rel) in allowed:
                    continue
                violations.append(Violation(rule=rule, path=rel, line=number, reason=reason, text=line.strip()))
    return violations


def emit(violations: list[Violation], files: int) -> None:
    print(f"unit-hygiene: scanned {files} file(s), {len(violations)} violation(s)")
    for violation in violations:
        print(f"  {violation.path}:{violation.line} [{violation.rule}] {violation.reason}")
        print(f"    {violation.text}")
    payload = {
        "ok": not violations,
        "files": files,
        "count": len(violations),
        "violations": [asdict(violation) for violation in violations],
    }
    print("---JSON---")
    print(json.dumps(payload, indent=2))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=REPO_ROOT)
    parser.add_argument("--allowlist", type=Path, default=DEFAULT_ALLOWLIST)
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="print violations but always exit 0",
    )
    parser.add_argument("--json", action="store_true", help="accepted for symmetry; JSON is always emitted")
    args = parser.parse_args(argv)

    violations = scan(args.root, args.allowlist)
    emit(violations, len(iter_test_files(args.root)))

    if violations and not args.report_only:
        return 2
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
