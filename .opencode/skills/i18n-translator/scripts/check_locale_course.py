#!/usr/bin/env python3
"""Course-level locale parity check (deterministic tool #2 of i18n-translator).

Checks, for one course + one target locale:
  1. locale dir exists and its *.md file set == en/ file set (same filenames)
  2. course.json carries a <locale> block with title + description
  3. every pair passes verify_translation.py (errors aggregated)
  4. every target lesson passes course-writer validate_lesson.py

Usage:
    python3 .opencode/skills/i18n-translator/scripts/check_locale_course.py \
        --course content/courses/databricks-lakehouse-aws --locale pt

Exit codes: 0 = all green (verify warnings allowed), 1 = warnings only,
2 = any error (missing file, invariant violation, validator failure).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parents[2]  # .opencode/skills
REPO_ROOT = Path(__file__).resolve().parents[4]
VERIFY = Path(__file__).resolve().parent / "verify_translation.py"
VALIDATE_LESSON = REPO_ROOT / ".opencode/skills/course-writer/scripts/validate_lesson.py"


def run(cmd: list[str]) -> int:
    return subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True).returncode


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--course", required=True, help="course dir, e.g. content/courses/aws-dea-c01")
    ap.add_argument("--locale", required=True, choices=("pt", "es"))
    args = ap.parse_args()

    course = REPO_ROOT / args.course
    en_dir = course / "en"
    loc_dir = course / args.locale
    errors: list[str] = []
    warnings: list[str] = []

    # 1. file set parity
    if not loc_dir.is_dir():
        print(f"ERROR: missing locale dir {loc_dir}")
        return 2
    en_names = sorted(p.name for p in en_dir.glob("*.md"))
    loc_names = sorted(p.name for p in loc_dir.glob("*.md"))
    for n in sorted(set(en_names) - set(loc_names)):
        errors.append(f"missing translation: {args.locale}/{n}")
    for n in sorted(set(loc_names) - set(en_names)):
        errors.append(f"extra file: {args.locale}/{n}")

    # 2. course.json locale block
    cj = json.loads((course / "course.json").read_text(encoding="utf-8"))
    block = cj.get(args.locale) or {}
    if not block.get("title"):
        errors.append(f"course.json missing {args.locale}.title")
    if not block.get("description"):
        errors.append(f"course.json missing {args.locale}.description")

    # 3+4. per-pair verify + validator
    warn_pairs = 0
    for name in sorted(set(en_names) & set(loc_names)):
        src = en_dir / name
        tgt = loc_dir / name
        rc_v = run([sys.executable, str(VERIFY), "--source", str(src), "--target", str(tgt)])
        if rc_v == 2:
            errors.append(f"verify FAILED: {args.locale}/{name}")
        elif rc_v == 1:
            warn_pairs += 1
        rc_l = run([sys.executable, str(VALIDATE_LESSON), ], )
        # validate_lesson reads OPENCODE_FILE_PATH
        import os
        env_rc = subprocess.run(
            [sys.executable, str(VALIDATE_LESSON)],
            cwd=REPO_ROOT,
            capture_output=True,
            env={**os.environ, "OPENCODE_FILE_PATH": str(tgt)},
        ).returncode
        if env_rc != 0:
            errors.append(f"validate_lesson rc={env_rc}: {args.locale}/{name}")

    if warn_pairs:
        warnings.append(f"{warn_pairs} pair(s) with verify warnings only")

    for m in errors:
        print(f"ERROR: {m}")
    for m in warnings:
        print(f"WARNING: {m}")
    n = len(set(en_names) & set(loc_names))
    if errors:
        print(f"FAIL: {args.course} {args.locale} — {len(errors)} error(s) over {n} pairs")
        return 2
    if warnings:
        print(f"OK (warnings): {args.course} {args.locale} — {n} files, no errors, {warn_pairs} warn-pair(s)")
        return 1
    print(f"OK: {args.course} {args.locale} — {n} files, parity + gates green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
