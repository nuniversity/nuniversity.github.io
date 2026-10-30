#!/usr/bin/env python3
"""Hygiene gate for Playwright E2E specs.

Deterministic script: exit 0 = pass, exit 2 = blocking. It enforces the
repo-specific conventions that fixtures and the static server already provide.

Rules:
    skip-only          test.only / test.skip / describe.only / test.todo
    console-log        console.log in the suite (guarded support logging may be allowed)
    wait-timeout       page.waitForTimeout / fixed sleeps
    networkidle        waitForLoadState('networkidle')
    page-pause         page.pause() left in a spec
    bare-test-import   spec imports test from @playwright/test instead of ./support/fixtures
    legacy-page-api    page.click() / page.$() / page.$$()
    xpath              XPath locators (use role/test-id locators)

Justified exceptions live in a JSON allowlist:
    {"allow": [{"rule": "console-log", "path": "tests/e2e/support/x.ts", "reason": "..."}]}

Usage:
    .venv/bin/python .opencode/skills/e2e-tests/scripts/check_e2e_hygiene.py
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
DEFAULT_ALLOWLIST = REPO_ROOT / ".opencode/skills/e2e-tests/references/e2e-hygiene-allowlist.json"

ALL_RULES: list[tuple[str, re.Pattern[str], str]] = [
    (
        "skip-only",
        re.compile(r"\b(?:it|test|describe)\.(?:only|skip)\s*\(|\b(?:it|test)\.todo\s*\("),
        "remove .only/.skip/.todo before committing",
    ),
    (
        "console-log",
        re.compile(r"\bconsole\.log\s*\("),
        "remove debug output; guard intentional traces behind a debug env flag + allowlist",
    ),
    (
        "wait-timeout",
        re.compile(r"\bwaitForTimeout\s*\("),
        "fixed sleeps are flaky; assert the user-visible state instead",
    ),
    (
        "networkidle",
        re.compile(r"networkidle"),
        "networkidle waits on unrelated requests; wait on a concrete UI/API signal",
    ),
    (
        "page-pause",
        re.compile(r"\bpage\.pause\s*\("),
        "page.pause() is a local debugging aid and must never be committed",
    ),
    (
        "legacy-page-api",
        re.compile(r"\bpage\.(?:click|\$|\$\$)\s*\("),
        "use locators and web-first actions (getByRole/getByTestId + click)",
    ),
    (
        "xpath",
        re.compile(r"(?:xpath=|locator\(\s*['\"]//)"),
        "XPath is brittle; use role, label, text (unique) or test ids",
    ),
]

BARE_TEST_IMPORT = re.compile(r"^\s*import\s*\{[^}]*\btest\b[^}]*\}\s*from\s*['\"]@playwright/test['\"]")


@dataclass(frozen=True)
class Violation:
    rule: str
    path: str
    line: int
    reason: str
    text: str


def iter_spec_files(root: Path) -> list[Path]:
    e2e = root / "tests/e2e"
    if not e2e.exists():
        return []
    return sorted(path for path in e2e.rglob("*.ts") if path.is_file())


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
    for path in iter_spec_files(root):
        rel = path.relative_to(root).as_posix()
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError) as error:
            print(f"WARNING: cannot read {rel}: {error}", file=sys.stderr)
            continue

        is_spec = rel.endswith(".spec.ts")
        for number, line in enumerate(lines, start=1):
            for rule, pattern, reason in ALL_RULES:
                if not pattern.search(line):
                    continue
                if (rule, rel) in allowed:
                    continue
                violations.append(Violation(rule=rule, path=rel, line=number, reason=reason, text=line.strip()))

            if is_spec and BARE_TEST_IMPORT.search(line) and ("bare-test-import", rel) not in allowed:
                violations.append(
                    Violation(
                        rule="bare-test-import",
                        path=rel,
                        line=number,
                        reason="specs must import test/expect from ../support/fixtures.ts",
                        text=line.strip(),
                    )
                )
    return violations


def emit(violations: list[Violation], files: int) -> None:
    print(f"e2e-hygiene: scanned {files} file(s), {len(violations)} violation(s)")
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
    parser.add_argument("--report-only", action="store_true", help="print but always exit 0")
    parser.add_argument("--json", action="store_true", help="accepted for symmetry; JSON is always emitted")
    args = parser.parse_args(argv)

    files = iter_spec_files(args.root)
    violations = scan(args.root, args.allowlist)
    emit(violations, len(files))

    if violations and not args.report_only:
        return 2
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
