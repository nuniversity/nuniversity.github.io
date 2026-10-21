#!/usr/bin/env python3
"""Validate Mermaid.js diagram syntax in Markdown files.

Prefers ground-truth `mermaid.parse` (Node + installed mermaid/jsdom) via the
companion script `parse_check.mjs`; falls back to static heuristics when the
Node toolchain is unavailable. Heuristic warnings are suppressed when the real
parser succeeds (the parser is authoritative), which eliminates the old
false-positive `end`/bracket noise.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the Markdown file being validated

Exit Codes:
    0 - Validation passed or no diagrams found
    1 - Non-blocking warning (real parser failed, or heuristics in fallback mode)
"""

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
PARSE_CHECK = Path(__file__).resolve().parent / "parse_check.mjs"

DIAGRAM_TYPES = {
    "flowchart",
    "graph",
    "sequencediagram",
    "classdiagram",
    "statediagram",
    "statediagram-v2",
    "erdiagram",
    "gantt",
    "pie",
    "mindmap",
    "timeline",
    "gitgraph",
    "architecture-beta",
    "journey",
    "quadrantchart",
    "requirementdiagram",
    "sankey-beta",
    "xychart-beta",
    "block-beta",
    "packet-beta",
    "kanban-beta",
    "radar-beta",
    "eventmodeling",
    "treemap-beta",
    "venn-beta",
    "ishikawa-beta",
    "wardley-beta",
    "cynefin-beta",
    "treeview-beta",
    "zenuml",
    "c4context",
    "c4container",
    "c4component",
    "c4dynamic",
    "c4deployment",
}

KNOWN_ISSUES = [
    (
        r"\bend\b(?![\s\]\)\"\'`])",
        'The word "end" may break diagrams. Wrap in quotes: [end], (end), {end}',
    ),
    (
        r"%%.*[\{\}]",
        "Avoid {} inside comments. Use alternative syntax.",
    ),
    (
        r"^\s+(?:flowchart|graph|sequenceDiagram)",
        "Diagram type keyword must be first non-blank line (no leading spaces)",
    ),
]


def extract_mermaid_blocks(content: str) -> list[dict]:
    """Extract all mermaid code blocks from Markdown."""
    blocks = []
    pattern = r"```mermaid\s*\n(.*?)```"
    for i, match in enumerate(re.finditer(pattern, content, re.DOTALL | re.IGNORECASE)):
        blocks.append(
            {
                "index": i,
                "content": match.group(1).strip(),
                "start": match.start(),
            }
        )
    return blocks


def validate_block(block: dict) -> list[str]:
    """Validate a single Mermaid block for common issues (static heuristics)."""
    errors = []
    content = block["content"]
    lines = content.split("\n")

    if not lines:
        errors.append("Empty mermaid block")
        return errors

    first_line = lines[0].strip().lower()
    diagram_type = first_line.split()[0] if first_line else ""

    if diagram_type not in DIAGRAM_TYPES and not first_line.startswith("%%"):
        errors.append(f"Unknown or invalid diagram type: '{diagram_type}'")

    for pattern, message in KNOWN_ISSUES:
        if re.search(pattern, content):
            errors.append(message)

    bracket_count = {"[": 0, "]": 0, "(": 0, ")": 0, "{": 0, "}": 0}
    for char in content:
        if char in bracket_count:
            bracket_count[char] += 1

    open_sq = bracket_count["["]
    close_sq = bracket_count["]"]
    open_par = bracket_count["("]
    close_par = bracket_count[")"]
    open_cur = bracket_count["{"]
    close_cur = bracket_count["}"]

    if open_sq != close_sq:
        errors.append(f"Unbalanced brackets: [ = {open_sq}, ] = {close_sq}")
    if open_par != close_par:
        errors.append(f"Unbalanced parentheses: ( = {open_par}, ) = {close_par}")
    if open_cur != close_cur:
        errors.append(f"Unbalanced braces: {{ = {open_cur}, }} = {close_cur}")

    return errors


def real_parse(file_path: Path) -> tuple[bool, list[str]]:
    """Run the ground-truth parser.

    Returns (ran, errors). ran=False means the toolchain is unavailable
    (caller should fall back to heuristics). ran=True with empty errors means
    every block parsed.
    """
    node = shutil.which("node")
    if not node or not PARSE_CHECK.exists():
        return False, []
    if not (REPO_ROOT / "node_modules" / "mermaid").exists():
        return False, []
    try:
        proc = subprocess.run(
            [node, str(PARSE_CHECK), "--quiet", str(file_path)],
            capture_output=True,
            text=True,
            timeout=180,
            cwd=str(REPO_ROOT),
        )
    except Exception:
        return False, []
    if proc.returncode == 0:
        return True, []
    if proc.returncode == 1:
        details = [
            line.strip()
            for line in (proc.stdout + proc.stderr).splitlines()
            if line.strip() and not line.startswith("---")
        ]
        return True, details
    # rc=2: tooling error (jsdom/mermaid import failed, no files matched, ...)
    return False, []


def main() -> int:
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        return 0

    path = Path(file_path)
    if not path.exists() or not path.suffix == ".md":
        return 0

    try:
        content = path.read_text(encoding="utf-8")
    except Exception:
        return 0

    blocks = extract_mermaid_blocks(content)
    if not blocks:
        return 0

    ran, parse_errors = real_parse(path)
    if ran:
        if parse_errors:
            for err in parse_errors:
                print(f"MERMAID WARNING: {err}", file=sys.stderr)
            return 1
        # Real parser is authoritative: suppress heuristic noise (e.g. the
        # "end" rule fired on ~150 blocks that parse fine).
        return 0

    # Fallback: static heuristics (no Node/mermaid toolchain available).
    all_errors = []
    for block in blocks:
        errors = validate_block(block)
        if errors:
            all_errors.append((block["index"], errors))

    if all_errors:
        for block_idx, errors in all_errors:
            for err in errors:
                print(
                    f"MERMAID WARNING: Diagram {block_idx + 1}: {err}",
                    file=sys.stderr,
                )
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
