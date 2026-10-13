#!/usr/bin/env python3
"""Verify a translated lesson against its English source.

Deterministic comparator: structural invariants that a correct translation
MUST preserve, plus heuristics that flag likely untranslated prose.

Usage:
    OPENCODE_SOURCE=content/courses/<slug>/en/NN.md \
    OPENCODE_TARGET=content/courses/<slug>/pt/NN.md \
    python3 .opencode/skills/i18n-translator/scripts/verify_translation.py

    # or flags:
    python3 verify_translation.py --source <en.md> --target <pt.md>
    python3 verify_translation.py --source-dir <en/> --target-dir <pt/>   # file-set check

Exit codes: 0 = pass (warnings allowed), 1 = warnings only, 2 = errors.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

# Fence languages whose bodies must be byte-identical between locales.
CODE_LANGS = {
    "sql", "python", "bash", "yaml", "hcl", "json", "math",
    "javascript", "typescript", "rust", "terraform", "sh",
}

# Fence languages that carry translatable user-facing strings.
INTERACTIVE_LANGS = {"question", "matching", "fillblank", "dragdrop", "plot", "phet", "molecule"}

FENCE_RE = re.compile(r"^```(\w*)\s*$", re.MULTILINE)
URL_RE = re.compile(r"https?://[^\s\)\]\>\"'`]+")
QID_RE = re.compile(r'"id"\s*:\s*"([^"]+)"')
PLACEHOLDER_RE = re.compile(r"\{\{\s*\d+\s*\}\}")
H2_NUM_RE = re.compile(r"^##\s+\d+", re.MULTILINE)
MERMAID_ARROW_RE = re.compile(r"(-->|---|==>|-.->)")

# Common English words for leakage heuristic (lowercase prose words >= 4 chars).
EN_MARKERS = {
    "the", "and", "for", "with", "that", "this", "from", "you", "your", "are",
    "was", "were", "have", "has", "had", "will", "would", "should", "can",
    "when", "then", "than", "they", "their", "there", "which", "what", "about",
    "into", "over", "under", "between", "because", "while", "where", "each",
    "every", "must", "not", "but", "any", "all", "one", "two", "use", "using",
    "data", "query", "queries", "table", "tables", "column", "columns",
}


def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    raw = text[3:end]
    body = text[end + 4 :].lstrip("\n")
    if yaml is None:
        # Minimal fallback parser for the flat keys we need.
        data = {}
        for line in raw.splitlines():
            m = re.match(r'^([A-Za-z_]+):\s*"?(.*?)"?\s*$', line)
            if m:
                data[m.group(1)] = m.group(2)
        return data, body
    try:
        data = yaml.safe_load(raw) or {}
    except yaml.YAMLError:
        data = {}
    return data, body


def extract_fence_bodies(text: str) -> dict[str, list[str]]:
    """Return {lang: [bodies...]} for every fenced block, lang '' = bare."""
    out: dict[str, list[str]] = {}
    lines = text.split("\n")
    i = 0
    while i < len(lines):
        m = re.match(r"^```(\w*)\s*$", lines[i])
        if m:
            lang = m.group(1).lower()
            j = i + 1
            body: list[str] = []
            while j < len(lines) and not re.match(r"^```\s*$", lines[j]):
                body.append(lines[j])
                j += 1
            out.setdefault(lang, []).append("\n".join(body))
            i = j + 1
        else:
            i += 1
    return out


def parse_interactive(bodies: list[str], lang: str) -> list[dict | None]:
    parsed = []
    for b in bodies:
        try:
            parsed.append(json.loads(b.strip()))
        except json.JSONDecodeError:
            parsed.append(None)
    return parsed


def check_pair(src_path: Path, tgt_path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if src_path.name != tgt_path.name:
        errors.append(f"Filename mismatch: {src_path.name} vs {tgt_path.name}")
    if not tgt_path.exists():
        errors.append(f"Target missing: {tgt_path}")
        return errors, warnings

    src = src_path.read_text(encoding="utf-8")
    tgt = tgt_path.read_text(encoding="utf-8")

    s_fm, s_body = parse_frontmatter(src)
    t_fm, t_body = parse_frontmatter(tgt)

    # --- frontmatter invariants ---
    # duration: compare the leading number only — EN "75 minutes" vs locale "75 min"
    s_dur = re.match(r"(\d+)", str(s_fm.get("duration", "")).strip())
    t_dur = re.match(r"(\d+)", str(t_fm.get("duration", "")).strip())
    if not s_dur or not t_dur or s_dur.group(1) != t_dur.group(1):
        errors.append(
            f"Frontmatter 'duration' differs: {s_fm.get('duration')!r} vs {t_fm.get('duration')!r}"
        )
    for key in ("order", "difficulty"):
        if str(s_fm.get(key, "")).strip() != str(t_fm.get(key, "")).strip():
            errors.append(
                f"Frontmatter '{key}' differs: {s_fm.get(key)!r} vs {t_fm.get(key)!r}"
            )
    if not str(t_fm.get("title", "")).strip():
        errors.append("Target frontmatter title missing/empty")
    if not str(t_fm.get("description", "")).strip():
        errors.append("Target frontmatter description missing/empty")
    if str(s_fm.get("title", "")).strip() == str(t_fm.get("title", "")).strip():
        warnings.append("Target title identical to source (possibly untranslated)")
    if str(s_fm.get("description", "")).strip() == str(t_fm.get("description", "")).strip():
        warnings.append("Target description identical to source (possibly untranslated)")

    # --- H1 == target title ---
    t_h1 = re.search(r"^# (.+)$", t_body, re.MULTILINE)
    if not t_h1:
        errors.append("Target missing H1")
    elif t_h1.group(1).strip() != str(t_fm.get("title", "")).strip():
        errors.append("Target H1 does not equal target frontmatter title")

    # --- validator literals (dual-heading pattern; source-aware so legacy
    # courses that predate the rule can translate as-is; modern EN sources
    # have these, so targets must too) ---
    s_has_pq = bool(re.search(r"^## .*Practice Questions", s_body, re.MULTILINE))
    t_has_pq = bool(re.search(r"^## .*Practice Questions", t_body, re.MULTILINE))
    if s_has_pq and not t_has_pq:
        errors.append("Target missing '## … Practice Questions' heading (dual-heading pattern)")
    s_has_kt = bool(re.search(r"^## .*Key Takeaways", s_body, re.MULTILINE) or
                    ("> [!SUCCESS]" in s_body and "Key Takeaways" in s_body))
    t_has_kt = bool(re.search(r"^## .*Key Takeaways", t_body, re.MULTILINE) or
                    ("> [!SUCCESS]" in t_body and "Key Takeaways" in t_body))
    if s_has_kt and not t_has_kt:
        errors.append("Target missing Key Takeaways / > [!SUCCESS] block")
    if "> [!SUCCESS]" in s_body and "> [!SUCCESS]" not in t_body:
        errors.append("Target missing '> [!SUCCESS]' callout")

    # --- fences ---
    s_fences = extract_fence_bodies(src)
    t_fences = extract_fence_bodies(tgt)
    s_counts = {k: len(v) for k, v in s_fences.items()}
    t_counts = {k: len(v) for k, v in t_fences.items()}
    for lang in sorted(set(s_counts) | set(t_counts)):
        if s_counts.get(lang, 0) != t_counts.get(lang, 0):
            errors.append(
                f"Fence count mismatch for '{lang}': source {s_counts.get(lang, 0)} "
                f"vs target {t_counts.get(lang, 0)}"
            )

    # --- code fences byte-identical ---
    for lang in sorted(CODE_LANGS):
        if s_fences.get(lang) and t_fences.get(lang):
            if s_fences[lang] != t_fences[lang]:
                for idx, (a, b) in enumerate(zip(s_fences[lang], t_fences[lang])):
                    if a != b:
                        errors.append(f"Code fence #{idx + 1} in ```{lang} differs (must be identical)")
                        break
                if len(s_fences[lang]) != len(t_fences[lang]):
                    errors.append(f"```{lang} body lists differ in length")

    # --- interactive structural invariants ---
    def inter(lang: str):
        return parse_interactive(s_fences.get(lang, []), lang), parse_interactive(
            t_fences.get(lang, []), lang
        )

    # question ids, ordered
    s_ids = QID_RE.findall("\n".join(s_fences.get("question", [])))
    t_ids = QID_RE.findall("\n".join(t_fences.get("question", [])))
    # ids also live in other interactive fences — collect all
    s_all_ids, t_all_ids = [], []
    for lang in INTERACTIVE_LANGS:
        s_all_ids += QID_RE.findall("\n".join(s_fences.get(lang, [])))
        t_all_ids += QID_RE.findall("\n".join(t_fences.get(lang, [])))
    if s_all_ids != t_all_ids:
        errors.append(
            f"Question id sequence differs: source {len(s_all_ids)} ids vs target {len(t_all_ids)} ids"
            + ("" if len(s_all_ids) != len(t_all_ids) else " (same count, different ids/order)")
        )

    # multiple-choice: options count
    s_q, t_q = inter("question")
    if len(s_q) == len(t_q):
        for i, (a, b) in enumerate(zip(s_q, t_q)):
            if a is None or b is None:
                errors.append(f"question block #{i + 1}: JSON parse failure")
                continue
            if len(a.get("options", [])) != len(b.get("options", [])):
                errors.append(f"question #{a.get('id', i)}: options count differs")

    # matching: pair counts
    s_m, t_m = inter("matching")
    if len(s_m) == len(t_m):
        for i, (a, b) in enumerate(zip(s_m, t_m)):
            if a is None or b is None:
                errors.append(f"matching block #{i + 1}: JSON parse failure")
                continue
            if len(a.get("pairs", [])) != len(b.get("pairs", [])):
                errors.append(f"matching #{a.get('id', i)}: pairs count differs")

    # fillblank: placeholder sets + answers keys
    s_f, t_f = inter("fillblank")
    if len(s_f) == len(t_f):
        for i, (a, b) in enumerate(zip(s_f, t_f)):
            if a is None or b is None:
                errors.append(f"fillblank block #{i + 1}: JSON parse failure")
                continue
            s_ph = set(PLACEHOLDER_RE.findall(a.get("template", "")))
            t_ph = set(PLACEHOLDER_RE.findall(b.get("template", "")))
            if s_ph != t_ph:
                errors.append(f"fillblank #{a.get('id', i)}: placeholder set differs {s_ph} vs {t_ph}")
            if set(a.get("answers", {})) != set(b.get("answers", {})):
                errors.append(f"fillblank #{a.get('id', i)}: answers keys differ")

    # dragdrop: item counts, correctOrder length parity
    s_d, t_d = inter("dragdrop")
    if len(s_d) == len(t_d):
        for i, (a, b) in enumerate(zip(s_d, t_d)):
            if a is None or b is None:
                errors.append(f"dragdrop block #{i + 1}: JSON parse failure")
                continue
            if len(a.get("items", [])) != len(b.get("items", [])):
                errors.append(f"dragdrop #{a.get('id', i)}: items count differs")
            if len(a.get("correctOrder", [])) != len(b.get("correctOrder", [])):
                errors.append(f"dragdrop #{a.get('id', i)}: correctOrder length differs")
            if set(b.get("correctOrder", [])) != set(b.get("items", [])):
                errors.append(f"dragdrop #{a.get('id', i)}: target correctOrder is not a permutation of target items")

    # plot: data/dataKeys/type/xKey identical
    s_p, t_p = inter("plot")
    if len(s_p) == len(t_p):
        for i, (a, b) in enumerate(zip(s_p, t_p)):
            if a is None or b is None:
                errors.append(f"plot block #{i + 1}: JSON parse failure")
                continue
            for key in ("type", "data", "dataKeys", "xKey"):
                if a.get(key) != b.get(key):
                    errors.append(f"plot #{i + 1}: '{key}' must be identical across locales")

    # --- mermaid arrow/structure counts ---
    s_arrows = sum(len(MERMAID_ARROW_RE.findall(b)) for b in s_fences.get("mermaid", []))
    t_arrows = sum(len(MERMAID_ARROW_RE.findall(b)) for b in t_fences.get("mermaid", []))
    if s_arrows != t_arrows:
        warnings.append(f"Mermaid connector count differs: {s_arrows} vs {t_arrows} (check diagram structure)")

    # --- URLs ---
    s_urls = sorted(URL_RE.findall(src))
    t_urls = sorted(URL_RE.findall(tgt))
    if s_urls != t_urls:
        missing = [u for u in s_urls if u not in t_urls]
        extra = [u for u in t_urls if u not in s_urls]
        errors.append(
            f"URL set differs (missing {len(missing)}, extra {len(extra)})"
            + (f"; e.g. missing {missing[0]}" if missing else "")
            + (f"; e.g. extra {extra[0]}" if extra else "")
        )

    # --- numbered section count ---
    s_secs = len(H2_NUM_RE.findall(s_body))
    t_secs = len(H2_NUM_RE.findall(t_body))
    if s_secs != t_secs:
        errors.append(f"Numbered '## N.' section count differs: {s_secs} vs {t_secs}")

    # --- English leakage heuristic (warning only) ---
    prose_lines = []
    in_fence = False
    for line in t_body.split("\n"):
        if re.match(r"^```", line):
            in_fence = not in_fence
            continue
        if in_fence or line.startswith("http") or "> [" in line[:8]:
            continue
        prose_lines.append(line)
    words = re.findall(r"[a-zA-Z]{4,}", "\n".join(prose_lines).lower())
    if words:
        hits = sum(1 for w in words if w in EN_MARKERS)
        ratio = hits / len(words)
        if ratio > 0.045:
            warnings.append(
                f"Possible untranslated English prose (marker ratio {ratio:.3f} over {len(words)} words)"
            )

    return errors, warnings


def check_dir(src_dir: Path, tgt_dir: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    src_names = {p.name for p in src_dir.glob("*.md")}
    tgt_names = {p.name for p in tgt_dir.glob("*.md")}
    for name in sorted(src_names - tgt_names):
        errors.append(f"Missing translation: {tgt_dir / name}")
    for name in sorted(tgt_names - src_names):
        errors.append(f"Extra file not in source: {tgt_dir / name}")
    return errors, warnings


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=Path)
    ap.add_argument("--target", type=Path)
    ap.add_argument("--source-dir", type=Path)
    ap.add_argument("--target-dir", type=Path)
    args = ap.parse_args()

    import os

    source = args.source or (Path(os.environ["OPENCODE_SOURCE"]) if os.environ.get("OPENCODE_SOURCE") else None)
    target = args.target or (Path(os.environ["OPENCODE_TARGET"]) if os.environ.get("OPENCODE_TARGET") else None)
    sdir = args.source_dir
    tdir = args.target_dir

    all_errors: list[str] = []
    all_warnings: list[str] = []

    if sdir and tdir:
        e, w = check_dir(sdir, tdir)
        all_errors += e
        all_warnings += w
        if not source and not target:
            for name in sorted({p.name for p in sdir.glob("*.md")} & {p.name for p in tdir.glob("*.md")}):
                e, w = check_pair(sdir / name, tdir / name)
                all_errors += [f"{name}: {m}" for m in e]
                all_warnings += [f"{name}: {m}" for m in w]
    elif source and target:
        e, w = check_pair(source, target)
        all_errors += e
        all_warnings += w
    else:
        ap.error("provide --source/--target or --source-dir/--target-dir (or env OPENCODE_SOURCE/OPENCODE_TARGET)")

    for m in all_errors:
        print(f"ERROR: {m}")
    for m in all_warnings:
        print(f"WARNING: {m}")
    if all_errors:
        return 2
    if all_warnings:
        return 1
    print("OK: translation invariants hold")
    return 0


if __name__ == "__main__":
    sys.exit(main())
