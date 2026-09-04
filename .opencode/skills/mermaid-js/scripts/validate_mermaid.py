#!/usr/bin/env python3
"""Validate Mermaid.js diagram syntax in Markdown files.

Non-blocking hook: exit 0 = pass, exit 1 = warning.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the Markdown file being validated

Exit Codes:
    0 - Validation passed or no diagrams found
    1 - Non-blocking warning (syntax issues detected)
"""

import os
import re
import sys
from pathlib import Path

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
    """Validate a single Mermaid block for common issues."""
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
