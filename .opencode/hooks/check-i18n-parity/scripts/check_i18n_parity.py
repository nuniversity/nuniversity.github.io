#!/usr/bin/env python3
"""Check dictionary key parity across en/pt/es locale files.

Non-blocking hook: exit 0 = pass, exit 1 = warning (non-blocking).

Environment Variables:
    OPENCODE_DICT_DIR: Path to dictionaries directory (default: ../../dictionaries)

Exit Codes:
    0 - All keys in parity
    1 - Non-blocking warning (missing or orphan keys)
"""
import json
import os
import sys
from pathlib import Path


def flatten(d: dict, prefix: str = "") -> dict[str, bool]:
    keys = {}
    for k, v in d.items():
        full = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(flatten(v, full))
        else:
            keys[full] = True
    return keys


def main() -> int:
    dict_dir = os.environ.get(
        "OPENCODE_DICT_DIR",
        str(Path(__file__).resolve().parents[3] / ".." / "dictionaries")
    )

    dict_path = Path(dict_dir)
    en_file = dict_path / "en.json"
    pt_file = dict_path / "pt.json"
    es_file = dict_path / "es.json"

    for f in [en_file, pt_file, es_file]:
        if not f.exists():
            print(f"Dictionary file not found: {f}", file=sys.stderr)
            return 1

    try:
        en = json.loads(en_file.read_text(encoding="utf-8"))
        pt = json.loads(pt_file.read_text(encoding="utf-8"))
        es = json.loads(es_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in dictionary: {e}", file=sys.stderr)
        return 1

    en_keys = set(flatten(en).keys())
    pt_keys = set(flatten(pt).keys())
    es_keys = set(flatten(es).keys())

    warnings = []

    missing_pt = en_keys - pt_keys
    if missing_pt:
        sorted_missing = sorted(missing_pt)
        warnings.append(
            f"Keys in en.json missing from pt.json ({len(missing_pt)}): "
            f"{', '.join(sorted_missing[:10])}{'...' if len(missing_pt) > 10 else ''}"
        )

    missing_es = en_keys - es_keys
    if missing_es:
        sorted_missing = sorted(missing_es)
        warnings.append(
            f"Keys in en.json missing from es.json ({len(missing_es)}): "
            f"{', '.join(sorted_missing[:10])}{'...' if len(missing_es) > 10 else ''}"
        )

    orphan_pt = pt_keys - en_keys
    if orphan_pt:
        sorted_orphan = sorted(orphan_pt)
        warnings.append(
            f"Orphan keys in pt.json not in en.json ({len(orphan_pt)}): "
            f"{', '.join(sorted_orphan[:10])}{'...' if len(orphan_pt) > 10 else ''}"
        )

    orphan_es = es_keys - en_keys
    if orphan_es:
        sorted_orphan = sorted(orphan_es)
        warnings.append(
            f"Orphan keys in es.json not in en.json ({len(orphan_es)}): "
            f"{', '.join(sorted_orphan[:10])}{'...' if len(orphan_es) > 10 else ''}"
        )

    if warnings:
        for w in warnings:
            print(f"I18N WARNING: {w}", file=sys.stderr)
        return 1

    print("I18N: All dictionary keys are in parity.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
