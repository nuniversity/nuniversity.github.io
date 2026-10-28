#!/usr/bin/env python3
"""Validate lesson Markdown files for Nuniversity.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = blocking error.

Validates:
- YAML frontmatter exists and is parseable
- Required fields present (title, order)
- Body structure matches canonical format
- Practice questions section exists with minimum 5 questions
- Key takeaways section exists
- Code blocks have language identifiers
- Interactive component blocks have valid JSON syntax
- Prose is read-aloud friendly: no em/en dashes, no spaced hyphens, no long
  parenthetical asides (warnings, exit 1)

Environment Variables:
    OPENCODE_FILE_PATH: Path to the lesson .md file to validate

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warnings (optional issues)
    2 - Blocking error (invalid structure)
"""

import os
import re
import sys
import json
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not installed. Run: uv pip install pyyaml", file=sys.stderr)
    sys.exit(2)


REQUIRED_FRONTMATTER_FIELDS = ["title", "order"]
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
MIN_PRACTICE_QUESTIONS = 5
INTERACTIVE_BLOCK_TYPES = {
    "math", "phet", "plot", "molecule", "dragdrop", "matching", "fillblank",
    "codeexercise", "glossary", "resources",
}
FORBIDDEN_CODE_API = re.compile(
    r"\b(fetch|XMLHttpRequest|WebSocket|importScripts|eval|Function)\s*\("
)


def extract_frontmatter(content: str) -> tuple[dict | None, str | None]:
    """Extract YAML frontmatter from Markdown content.

    Returns:
        Tuple of (frontmatter_dict, error_message). error is None on success.
    """
    match = re.match(r"^---\r?\n(.*?)\r?\n---", content, re.DOTALL)
    if not match:
        return None, "Missing frontmatter (expected --- delimiters)"
    try:
        frontmatter = yaml.safe_load(match.group(1))
        if not isinstance(frontmatter, dict):
            return None, "Frontmatter must be a YAML mapping"
        return frontmatter, None
    except yaml.YAMLError as e:
        return None, f"Invalid YAML: {e}"


def check_learning_metadata(data: dict) -> tuple[list[str], list[str]]:
    """Validate learning-engine frontmatter (skills, objectives).

    Both fields are optional so legacy lessons keep passing:
    - absent  -> warning (recommended for new lessons)
    - present -> must be a non-empty list of strings (error otherwise)
    """
    errors: list[str] = []
    warnings: list[str] = []
    for field in ("skills", "objectives"):
        if field not in data:
            warnings.append(
                f"frontmatter: optional '{field}' list missing (recommended)"
            )
            continue
        value = data[field]
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            errors.append(f"frontmatter: '{field}' must be a list of strings")
        elif not value:
            errors.append(f"frontmatter: '{field}' must not be empty when present")
        elif field == "skills" and len(value) > 3:
            warnings.append(
                f"frontmatter: {len(value)} 'skills' tags; prefer 1-3 focused tags"
            )
    return errors, warnings


def validate_frontmatter(data: dict) -> tuple[list[str], list[str]]:
    """Validate frontmatter fields.

    Returns:
        Tuple of (errors, warnings). Required field issues = errors.
        Optional field issues = warnings.
    """
    errors = []
    warnings = []

    for field in REQUIRED_FRONTMATTER_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")

    if "title" in data:
        title = str(data["title"]).strip()
        if not title:
            errors.append("Title is empty")
        elif len(title) < 3:
            errors.append(f"Title too short ({len(title)} chars, minimum 3)")

    if "order" in data:
        order = data["order"]
        if not isinstance(order, int):
            errors.append(f"Order must be an integer, got {type(order).__name__}")
        elif order < 1:
            errors.append(f"Order must be >= 1, got {order}")

    if "difficulty" in data:
        difficulty = str(data["difficulty"]).strip().lower()
        if difficulty and difficulty not in VALID_DIFFICULTIES:
            warnings.append(
                f"Invalid difficulty: '{data['difficulty']}'. "
                f"Expected beginner, intermediate, or advanced."
            )

    if "description" in data:
        desc = str(data["description"]).strip()
        if not desc:
            warnings.append("Description is empty")

    if "duration" in data:
        duration = str(data["duration"]).strip()
        if not duration:
            warnings.append("Duration is empty")

    meta_errors, meta_warnings = check_learning_metadata(data)
    errors.extend(meta_errors)
    warnings.extend(meta_warnings)

    return errors, warnings


def validate_body(content: str, frontmatter: dict) -> tuple[list[str], list[str]]:
    """Validate lesson body structure.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    title = str(frontmatter.get("title", "")).strip()

    # Check H1 matches title
    h1_match = re.search(r"^# (.+)$", content, re.MULTILINE)
    if h1_match:
        h1_text = h1_match.group(1).strip()
        if title and h1_text != title:
            errors.append(f"H1 '{h1_text}' does not match title '{title}'")
    else:
        errors.append("Missing H1 heading")

    # Check practice questions section
    has_practice_section = bool(
        re.search(r"^## .*Practice Questions", content, re.MULTILINE)
    )
    if not has_practice_section:
        errors.append("Missing '## Practice Questions' section")

    # Count practice questions (```question blocks)
    question_blocks = re.findall(r"```question\b", content)
    if len(question_blocks) < MIN_PRACTICE_QUESTIONS:
        errors.append(
            f"Insufficient practice questions: {len(question_blocks)} found, "
            f"minimum {MIN_PRACTICE_QUESTIONS} required"
        )

    # Check key takeaways section
    has_takeaways = bool(
        re.search(r"^## .*Key Takeaways", content, re.MULTILINE)
    ) or bool(
        re.search(r"> \[!SUCCESS\]", content)
        and re.search(r"Key Takeaways", content)
    )
    if not has_takeaways:
        errors.append(
            "Missing '## Key Takeaways' or '> [!SUCCESS] Key Takeaways' section"
        )

    # Multimedia principle: a visual anchor for every lesson. Warning only, so
    # legacy narrative lessons keep passing (exit 1, not 2).
    has_media = bool(re.search(r"!\[[^\]]*\]\([^)]+\)", content)) or bool(
        re.search(r"```video\b", content)
    )
    if not has_media:
        warnings.append(
            "No image or video embed (Mayer multimedia principle): add one where it aids understanding"
        )

    return errors, warnings


def _validate_codeexercise(parsed) -> list[str]:
    """Schema for ```codeexercise (JavaScript-only sandboxed exercise)."""
    errors: list[str] = []
    if not isinstance(parsed, dict):
        return ["codeexercise: config must be a JSON object"]
    for field in ("id", "title", "instructions", "starter", "language", "tests"):
        if field not in parsed:
            errors.append(f"codeexercise: missing '{field}'")
    if parsed.get("language") != "javascript":
        errors.append("codeexercise: 'language' must be 'javascript' (JS-only runner)")
    tests = parsed.get("tests")
    if not isinstance(tests, list) or not (2 <= len(tests) <= 6):
        errors.append("codeexercise: 'tests' must be a list of 2-6 test objects")
    else:
        for index, test in enumerate(tests):
            if not isinstance(test, dict) or not all(
                key in test for key in ("name", "call", "expected")
            ):
                errors.append(
                    f"codeexercise: test {index} must have name, call, expected"
                )
    if FORBIDDEN_CODE_API.search(json.dumps(parsed)):
        errors.append(
            "codeexercise: forbidden network/eval API "
            "(fetch, XMLHttpRequest, WebSocket, importScripts, eval, Function)"
        )
    return errors


def _validate_glossary(parsed) -> list[str]:
    """Schema for ```glossary (pre-training key terms)."""
    if not isinstance(parsed, dict) or not isinstance(parsed.get("terms"), list):
        return ["glossary: expected {'terms': [...]}"]
    terms = parsed["terms"]
    if not (3 <= len(terms) <= 12):
        return ["glossary: 'terms' must contain 3-12 entries"]
    errors: list[str] = []
    for index, term in enumerate(terms):
        if (
            not isinstance(term, dict)
            or not isinstance(term.get("term"), str)
            or not term.get("term").strip()
            or not isinstance(term.get("definition"), str)
            or not term.get("definition").strip()
        ):
            errors.append(
                f"glossary: term {index} must have non-empty string 'term' and 'definition'"
            )
    return errors


def _validate_resources(parsed) -> list[str]:
    """Schema for ```resources (Library cross-links)."""
    if not isinstance(parsed, dict) or not isinstance(parsed.get("items"), list):
        return ["resources: expected {'items': [...]}"]
    items = parsed["items"]
    if not (1 <= len(items) <= 8):
        return ["resources: 'items' must contain 1-8 entries"]
    allowed = {"video", "ebook", "course", "blog", "repository", "podcast", "article"}
    errors: list[str] = []
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            errors.append(f"resources: item {index} must be an object")
            continue
        if item.get("type") not in allowed:
            errors.append(
                f"resources: item {index} type must be one of {sorted(allowed)}"
            )
        if not isinstance(item.get("title"), str) or not item.get("title").strip():
            errors.append(f"resources: item {index} needs a non-empty title")
        url = item.get("url")
        if not isinstance(url, str) or not url.startswith("https://"):
            errors.append(f"resources: item {index} url must start with https://")
    return errors


def validate_interactive_blocks(content: str) -> tuple[list[str], list[str]]:
    """Validate interactive component blocks have valid JSON configs.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    interactive_blocks = []
    for match in re.finditer(r"```(\w+)\r?\n(.*?)```", content, re.DOTALL):
        lang = match.group(1).lower()
        if lang in INTERACTIVE_BLOCK_TYPES:
            code = match.group(2).strip()
            interactive_blocks.append((lang, code))
            try:
                parsed = json.loads(code)
            except json.JSONDecodeError as e:
                errors.append(f"Invalid JSON in ```{lang}`` block: {e}")
                continue
            # Fence language must match the component type — the renderer
            # routes by fence (MarkdownRenderer), NOT by the JSON "type" field.
            # ```question only supports multiple-choice / true-false; anything
            # else (matching, dragdrop, fillblank, plot) crashes the prerender
            # in QuestionBlock (data.options.map on undefined).
            if lang == "question" and isinstance(parsed, dict):
                qtype = parsed.get("type")
                if qtype is not None and qtype not in ("multiple-choice", "true-false"):
                    qid = parsed.get("id", "unknown-id")
                    errors.append(
                        f"Misfenced interactive block: ```question fence with "
                        f"type '{qtype}' (id {qid}) — use ```{qtype} fence "
                        f"instead (renderer routes by fence language)"
                    )
            if lang == "codeexercise":
                errors.extend(_validate_codeexercise(parsed))
            elif lang == "glossary":
                errors.extend(_validate_glossary(parsed))
            elif lang == "resources":
                errors.extend(_validate_resources(parsed))

    if not interactive_blocks:
        warnings.append(
            "No interactive components found — STEM lessons should include "
            "at least 1 interactive block (math, phet, plot, molecule, "
            "dragdrop, matching, fillblank, codeexercise, glossary, resources)"
        )

    return errors, warnings




INTERACTIVE_FENCES = {
    "question", "matching", "fillblank", "dragdrop", "plot",
    "video", "phet", "molecule", "interactive",
}

DASH_CHARS = {
    "\u2014": "Em dash (—)",
    "\u2013": "En dash (–)",
}
LONG_PARENTHETICAL = 80
MAX_REPORTED_LINES = 3


def _prose_lines(content: str):
    """Yield (line_number, text) for prose, skipping fenced blocks and code spans."""
    in_fence = False
    fence_lang = ""
    in_display_math = False
    for number, line in enumerate(content.splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            if not in_fence:
                in_fence = True
                fence_lang = stripped.lstrip("`~").strip().lower()
            else:
                in_fence = False
                fence_lang = ""
            continue
        if in_fence:
            # Quiz and widget JSON is rendered text, so its strings are prose.
            if fence_lang not in INTERACTIVE_FENCES:
                continue
        if in_display_math:
            if stripped.endswith("$$"):
                in_display_math = False
            continue
        if stripped.startswith("$$"):
            if not (len(stripped) > 4 and stripped.endswith("$$")):
                in_display_math = True
            continue
        # Table separator rows and horizontal rules are structure, not prose.
        if re.fullmatch(r"\s*\|?[\s:|-]{5,}\|?\s*", line) or re.fullmatch(r"\s*-{3,}\s*", line):
            continue
        # HTML comments are not rendered.
        if "<!--" in line or "-->" in line:
            continue
        prose = re.sub(r"`[^`]*`", " ", line)
        # Only maths-looking `$...$`. Currency also uses `$`, and stripping a
        # pair of prices would hide the prose between them.
        prose = re.sub(
            r"\$[^$\n]{1,80}\$",
            lambda m: " "
            if re.search(r"[\\^_{}]", m.group(0)) or re.match(r"\$[A-Za-z\\]", m.group(0))
            else m.group(0),
            prose,
        )
        yield number, prose


def validate_prose(content: str) -> tuple[list[str], list[str]]:
    """Check prose for punctuation that breaks text-to-speech.

    The lesson is read aloud by the browser's speech engine. Em dashes, en
    dashes and spaced hyphens are skipped rather than voiced, so the sentence
    loses its pause; long parenthetical asides are not voiced either. These are
    warnings (exit 1) because the repository still contains legacy content, but
    the skill requires zero in new lessons.

    Returns:
        Tuple of (errors, warnings). Prose issues are warnings.
    """
    errors: list[str] = []
    warnings: list[str] = []

    dash_hits: dict[str, list[int]] = {char: [] for char in DASH_CHARS}
    double_hyphen_lines: list[int] = []
    spaced_hyphen_lines: list[int] = []
    parentheticals: list[tuple[int, int]] = []

    for number, line in _prose_lines(content):
        for char in DASH_CHARS:
            if char in line:
                dash_hits[char].append(number)
        # `--flag` is a CLI flag and a table cell of dashes is a placeholder.
        if re.search(r"(?<!-)--(?![\w-])", line) and not re.search(r"\|\s*--\s*\|", line):
            double_hyphen_lines.append(number)
        # Ignore the blockquote markers and the list bullet: "> - item" is not
        # a dash. Proper names ("ML Engineer - Associate") are not dashes
        # either.
        stripped = re.sub(r"^\s*(?:>\s*)+", "", line)
        stripped = re.sub(r"^\s*(?:[-*+]|\d+[.)])\s+", "", stripped)
        if re.search(r"\S\s+-\s+\S", stripped) and not re.search(
            r"[A-ZÀ-Þ][\w.'’]*\s+-\s+[A-ZÀ-Þ]", stripped
        ):
            spaced_hyphen_lines.append(number)
        for match in re.finditer(r"\(([^()]{80,})\)", line):
            parentheticals.append((number, len(match.group(1))))

    for char, name in DASH_CHARS.items():
        lines = dash_hits[char]
        if lines:
            shown = ", ".join(str(n) for n in lines[:MAX_REPORTED_LINES])
            more = "" if len(lines) <= MAX_REPORTED_LINES else f" and {len(lines) - MAX_REPORTED_LINES} more"
            warnings.append(
                f"{name} used {len(lines)}x in prose (lines {shown}{more}). "
                "Text-to-speech skips it: use a comma, semicolon, colon or full stop."
            )

    if double_hyphen_lines:
        shown = ", ".join(str(n) for n in double_hyphen_lines[:MAX_REPORTED_LINES])
        warnings.append(
            f"Double hyphen (--) used {len(double_hyphen_lines)}x in prose (lines {shown}). "
            "Replace it with a comma, semicolon, colon or full stop."
        )

    if spaced_hyphen_lines:
        shown = ", ".join(str(n) for n in spaced_hyphen_lines[:MAX_REPORTED_LINES])
        warnings.append(
            f"Hyphen used as a dash {len(spaced_hyphen_lines)}x in prose (lines {shown}). "
            "Use a comma or semicolon; a hyphen belongs inside a compound word."
        )

    if parentheticals:
        shown = ", ".join(str(line) for line, _ in parentheticals[:MAX_REPORTED_LINES])
        warnings.append(
            f"{len(parentheticals)} parenthetical aside(s) longer than {LONG_PARENTHETICAL} "
            f"characters (lines {shown}). Parentheses are not voiced: rewrite as a "
            "clause after a comma, or as its own sentence."
        )

    return errors, warnings


def validate_lesson(path: Path) -> tuple[list[str], list[str]]:
    """Validate a complete lesson file.

    Returns:
        Tuple of (errors, warnings).
    """
    errors = []
    warnings = []

    if not path.exists():
        errors.append(f"File not found: {path}")
        return errors, warnings

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        errors.append(f"Cannot read file: {e}")
        return errors, warnings

    if not content.strip():
        errors.append("File is empty")
        return errors, warnings

    frontmatter, parse_error = extract_frontmatter(content)
    if parse_error:
        errors.append(parse_error)
        return errors, warnings

    fm_errors, fm_warnings = validate_frontmatter(frontmatter)
    errors.extend(fm_errors)
    warnings.extend(fm_warnings)

    body_errors, body_warnings = validate_body(content, frontmatter)
    errors.extend(body_errors)
    warnings.extend(body_warnings)

    interactive_errors, interactive_warnings = validate_interactive_blocks(content)
    errors.extend(interactive_errors)
    warnings.extend(interactive_warnings)

    prose_errors, prose_warnings = validate_prose(content)
    errors.extend(prose_errors)
    warnings.extend(prose_warnings)

    return errors, warnings


def main() -> int:
    """Main validation entry point."""
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")

    if not file_path:
        print("ERROR: OPENCODE_FILE_PATH not set", file=sys.stderr)
        return 2

    path = Path(file_path)
    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        return 2

    errors, warnings = validate_lesson(path)

    for warning in warnings:
        print(f"LESSON WARNING: {warning}", file=sys.stderr)

    if errors:
        for error in errors:
            print(f"LESSON ERROR: {error}", file=sys.stderr)
        return 2

    if warnings:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
