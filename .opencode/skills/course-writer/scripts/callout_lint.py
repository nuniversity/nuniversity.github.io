#!/usr/bin/env python3
"""Lint Markdown callouts (GitHub-style alerts) for renderer compatibility.

The site renderer (components/markdown/MarkdownRenderer.tsx) supports exactly
these alert types in both styles:

    > [!NOTE]            [!TIP]
    > Body line          Body line

Checks performed:
    1. Unsupported callout types (anything outside the supported set).
    2. Locale aliases (NOTA, DICA, AVISO, ...) — content must use the
       canonical English type; the renderer accepts aliases only as a
       compatibility safety net.
    3. Empty callout bodies — a marker whose immediately-following lines are
       blank / not part of the callout / another marker (renders as an empty
       colored box with the content floating outside it).

Usage:
    OPENCODE_FILE_PATH=<file> python3 callout_lint.py        # single file
    python3 callout_lint.py --all [path ...]                 # repo-wide
                                                             # (default: content/courses docs)

Exit Codes:
    0 - No findings
    1 - Findings (each reported as "file:line: message" on stdout)
"""

import os
import re
import sys
from pathlib import Path

SUPPORTED = {
    "NOTE",
    "INFO",
    "WARNING",
    "DANGER",
    "ERROR",
    "SUCCESS",
    "TIP",
    "IMPORTANT",
}

# Locale variants observed in translated content → canonical type.
ALIASES = {
    "NOTA": "NOTE",
    "DICA": "TIP",
    "CONSEJO": "TIP",
    "AVISO": "WARNING",
    "ADVERTENCIA": "WARNING",
    "SUCESSO": "SUCCESS",
    "ÉXITO": "SUCCESS",
    "EXITO": "SUCCESS",
    "IMPORTANTE": "IMPORTANT",
    "ATENCAO": "WARNING",
    "ATENCION": "WARNING",
}

TYPE_RE = r"([A-Za-zÀ-ÿ]+)"

BLOCK_MARKER_RE = re.compile(r"^\s{0,3}>\s*\[!" + TYPE_RE + r"\][ \t]*$")
PLAIN_MARKER_RE = re.compile(r"^\s{0,3}\[!" + TYPE_RE + r"\]([^\n]*)$")
FENCE_RE = re.compile(r"^(\s*)(```+|~~~+)")


def lint_text(text: str, label: str) -> list[str]:
    """Return findings for one document as 'label:line: message' strings."""
    findings: list[str] = []
    lines = text.split("\n")
    fence_marker = None
    fence_indent = None

    for i, line in enumerate(lines):
        fence = FENCE_RE.match(line)
        if fence:
            indent, marker = fence.group(1), fence.group(2)
            if fence_marker is None:
                fence_marker = marker[0] * 3
                fence_indent = indent
            elif marker[0] * 3 == fence_marker and indent == fence_indent:
                fence_marker = None
                fence_indent = None
            continue
        if fence_marker is not None:
            continue  # inside a code fence — never a callout

        block = BLOCK_MARKER_RE.match(line)
        plain = None if block else PLAIN_MARKER_RE.match(line)
        marker = block or plain
        if not marker:
            continue

        raw_type = marker.group(1)
        ctype = raw_type.upper()
        loc = f"{label}:{i + 1}"

        if ctype in ALIASES:
            findings.append(
                f"{loc}: locale alias callout marker [!{raw_type}] "
                f"— use canonical [!{ALIASES[ctype]}]"
            )
        elif ctype not in SUPPORTED:
            findings.append(
                f"{loc}: unsupported callout marker [!{raw_type}] "
                f"— renderer supports: {', '.join(sorted(SUPPORTED))}"
            )
        # An unsupported/alias marker already renders broken or non-canonically;
        # still check body emptiness below when the type itself is renderable.

        # --- empty body checks -------------------------------------------
        nxt = i + 1
        if block:
            # Renderer pass 1: body must be consecutive '>' lines starting on
            # the very next line (a blank line breaks it).
            if nxt >= len(lines) or lines[nxt].strip() == "" or not re.match(r"^\s*>", lines[nxt]):
                findings.append(f"{loc}: empty callout body — [!{raw_type}] must be "
                                f"immediately followed by '> ' body lines")
        else:
            # Renderer pass 2 (plain style): body = lazy capture up to the
            # first blank line *sequence*; a single blank line right after the
            # marker is skipped and the following content IS captured (that is
            # the common `[!SUCCESS] **Key Takeaways**` + list pattern).
            # Port of the renderer regex:
            #   ^\[!TYPE\][^\n]*\n([\s\S]*?)(?=\n\n|\n\[!|(?![\s\S]))
            rest = "\n".join(lines[i:])
            m = re.match(
                r"\A\[![A-Za-zÀ-ÿ]+\][^\n]*\n([\s\S]*?)(?=\n\n|\n\[!|\Z)", rest
            )
            body = m.group(1) if m else ""
            if not body.strip():
                findings.append(f"{loc}: empty callout body — [!{raw_type}] must be "
                                f"followed by non-blank body content")
            elif nxt < len(lines) and PLAIN_MARKER_RE.match(lines[nxt]):
                findings.append(f"{loc}: callout markers stacked without a blank line — "
                                f"the next [!...] marker is swallowed as literal text")

    return findings


def lint_file(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return []
    try:
        rel = path.resolve().relative_to(Path.cwd().resolve())
    except ValueError:
        rel = path
    return lint_text(text, str(rel))


def iter_md(root: Path):
    for p in sorted(root.rglob("*.md")):
        if "node_modules" in p.parts or ".git" in p.parts:
            continue
        yield p


def main(argv: list[str]) -> int:
    findings: list[str] = []
    single = os.environ.get("OPENCODE_FILE_PATH", "")

    if argv and argv[0] == "--all":
        targets = argv[1:] or ["content/courses", "docs"]
        count = 0
        for t in targets:
            p = Path(t)
            if p.is_file():
                findings.extend(lint_file(p))
                count += 1
            elif p.is_dir():
                for f in iter_md(p):
                    findings.extend(lint_file(f))
                    count += 1
            else:
                print(f"callout_lint: path not found: {t}", file=sys.stderr)
                return 2
        for f in findings:
            print(f)
        print(f"---")
        print(f"files scanned: {count}  findings: {len(findings)}")
        return 1 if findings else 0

    if single:
        path = Path(single)
        if not path.exists() or path.suffix != ".md":
            return 0
        findings = lint_file(path)
        for f in findings:
            print(f)
        return 1 if findings else 0

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
