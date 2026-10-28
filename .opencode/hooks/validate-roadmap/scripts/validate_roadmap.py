#!/usr/bin/env python3
"""Validate roadmap Markdown files for Nuniversity.

Deterministic hook: exit 0 = pass, exit 1 = warning (non-blocking), exit 2 = blocking error.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the roadmap Markdown file being validated

Dependencies:
    - pyyaml (for YAML parsing)

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warning (step without a contentRef or externalUrl link target)
    2 - Blocking error (invalid frontmatter, malformed step sections, unresolved references)
"""
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

try:
    import yaml
except ImportError:
    print("ERROR: pyyaml not installed. Run: uv pip install pyyaml", file=sys.stderr)
    sys.exit(2)

VALID_LOCALES = {"en", "pt", "es"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
STEP_TYPES = {"concept", "course", "tool", "game", "library", "milestone"}
RELATIONSHIP_TYPES = {"required", "optional", "branch"}
REQUIRED_FRONTMATTER_FIELDS = ("id", "title", "description", "icon", "estimatedDuration")
REQUIRED_STEP_FIELDS = (
    "id",
    "type",
    "description",
    "prerequisites",
    "conditionals",
    "comments",
    "ideas",
    "relationships",
)
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
RELATIONSHIP_RE = re.compile(
    r"- leadsTo:[ \t]*(.+?)\n[ \t]+type:[ \t]*(.+?)(?:\n[ \t]+label:[ \t]*(.+?))?(?:\n|$)"
)
REPO_ROOT = Path(__file__).resolve().parents[3] / ".."
COURSES_DIR = REPO_ROOT / "content" / "courses"


def extract_frontmatter(content: str) -> tuple[dict | None, str | None]:
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None, "Missing frontmatter (expected --- delimiters)"
    try:
        frontmatter = yaml.safe_load(match.group(1))
    except yaml.YAMLError as e:
        return None, f"Invalid YAML: {e}"
    if not isinstance(frontmatter, dict):
        return None, "Frontmatter must be a YAML mapping"
    return frontmatter, None


def is_http_url(value) -> bool:
    if not isinstance(value, str) or not value:
        return False
    if any(ch.isspace() for ch in value):
        return False
    if not value.startswith(("http://", "https://")):
        return False
    return bool(urlparse(value).netloc)


def find_body_start(content: str) -> int | None:
    match = re.match(r"^---\n.*?\n---", content, re.DOTALL)
    return match.end() if match else None


def derive_roadmap_locale(path: Path) -> str | None:
    parts = path.parts
    if len(parts) >= 4 and parts[-4] == "content" and parts[-3] == "roadmaps" and path.suffix == ".md":
        return path.stem
    return None


def validate_frontmatter(data: dict) -> list[str]:
    errors = []

    for field in REQUIRED_FRONTMATTER_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")
        elif not isinstance(data[field], str) or not data[field].strip():
            errors.append(f"Required field '{field}' must be a non-empty string")

    order = data.get("order")
    if order is None:
        errors.append("Missing required field: order")
    elif isinstance(order, bool) or not isinstance(order, int) or order < 1:
        errors.append(f"Invalid order: '{order}'. Must be a positive integer.")

    difficulty = data.get("difficulty")
    if difficulty is None:
        errors.append("Missing required field: difficulty")
    elif difficulty not in VALID_DIFFICULTIES:
        errors.append(
            f"Invalid difficulty: '{difficulty}'. Must be one of: {', '.join(sorted(VALID_DIFFICULTIES))}"
        )

    return errors


def parse_steps(body: str) -> tuple[list[tuple[str, str]], list[str]]:
    errors = []
    lines = body.splitlines(keepends=True)
    starts: list[tuple[int, str]] = []

    for i, line in enumerate(lines):
        raw = line.rstrip("\n")
        if not raw.startswith("##") or raw.startswith("###"):
            continue
        match = re.match(r"^## Step:[ \t]*(.+?)[ \t]*$", raw)
        if not match:
            errors.append(f"Invalid step heading: '{raw.strip()}' (expected '## Step: <title>')")
            continue
        starts.append((i, match.group(1)))

    steps = []
    for j, (line_index, title) in enumerate(starts):
        end = starts[j + 1][0] if j + 1 < len(starts) else len(lines)
        steps.append((title, "".join(lines[line_index + 1 : end])))

    return steps, errors


def field_line(body: str, field: str) -> str | None:
    match = re.search(rf"^- {re.escape(field)}:[ \t]*(.*)$", body, re.MULTILINE)
    return match.group(1).strip() if match else None


def inline_list_items(body: str, field: str) -> tuple[list[str] | None, bool]:
    match = re.search(rf"^- {re.escape(field)}:[ \t]*\[([^\]]*)\]", body, re.MULTILINE)
    if not match:
        return None, False
    inner = match.group(1).strip()
    if not inner:
        return [], True
    items = [part.strip().replace('"', "") for part in inner.split(",")]
    return items, True


def validate_relationships(title: str, chunk: str, step_ids: set[str], errors: list[str]) -> None:
    line = re.search(r"^- relationships:[ \t]*(.*)$", chunk, re.MULTILINE)
    if line is None:
        return

    value = line.group(1).strip()
    if value and value != "[]":
        errors.append(f"Step '{title}': 'relationships' must be [] or an indented '- leadsTo:' block")
        return
    if value == "[]":
        return

    matches = list(RELATIONSHIP_RE.finditer(chunk))
    leads_count = len(re.findall(r"- leadsTo:", chunk))
    if len(matches) != leads_count:
        errors.append(f"Step '{title}': every '- leadsTo:' entry must be followed by a 'type:' line")

    for match in matches:
        target = match.group(1).strip()
        rel_type = match.group(2).strip()
        if target not in step_ids:
            errors.append(f"Step '{title}': relationship leadsTo '{target}' is not a step id in this file")
        if rel_type not in RELATIONSHIP_TYPES:
            errors.append(
                f"Step '{title}': invalid relationship type '{rel_type}'. "
                f"Must be one of: {', '.join(sorted(RELATIONSHIP_TYPES))}"
            )


def validate_content_ref(title: str, ref: str, locale: str | None, errors: list[str]) -> None:
    parts = ref.split("/")
    if len(parts) > 2 or any(not SLUG_RE.match(part) for part in parts):
        errors.append(f"Step '{title}': invalid contentRef '{ref}'. Expected <course> or <course>/<lesson>")
        return

    course_dir = COURSES_DIR / parts[0]
    if not course_dir.is_dir():
        errors.append(f"Step '{title}': contentRef course '{parts[0]}' not found under content/courses/")
        return

    if len(parts) == 2:
        lesson = parts[1]
        candidates = []
        if locale in VALID_LOCALES:
            candidates.append(course_dir / locale / f"{lesson}.md")
        candidates.append(course_dir / "en" / f"{lesson}.md")
        if not any(candidate.exists() for candidate in candidates):
            errors.append(f"Step '{title}': contentRef lesson '{ref}' not found for locale '{locale}'")


def validate_step(
    title: str,
    chunk: str,
    step_ids: set[str],
    locale: str | None,
    errors: list[str],
    warnings: list[str],
) -> None:
    for field in REQUIRED_STEP_FIELDS:
        if field_line(chunk, field) is None:
            errors.append(f"Step '{title}': missing required field '{field}'")

    for field in ("id", "type", "description", "comments"):
        value = field_line(chunk, field)
        if value is not None and not value:
            errors.append(f"Step '{title}': field '{field}' must be non-empty")

    step_id = field_line(chunk, "id")
    if step_id and not SLUG_RE.match(step_id):
        errors.append(f"Step '{title}': invalid id '{step_id}'. Must be lowercase letters, digits, and hyphens")

    step_type = field_line(chunk, "type")
    if step_type and step_type not in STEP_TYPES:
        errors.append(
            f"Step '{title}': invalid type '{step_type}'. Must be one of: {', '.join(sorted(STEP_TYPES))}"
        )

    for field in ("prerequisites", "conditionals", "ideas"):
        items, found = inline_list_items(chunk, field)
        if not found:
            if field_line(chunk, field) is not None:
                errors.append(
                    f"Step '{title}': field '{field}' must be an inline list (e.g. [] or [\"a\", \"b\"])"
                )
            continue
        if field == "prerequisites":
            for item in items:
                if item not in step_ids:
                    errors.append(f"Step '{title}': prerequisite '{item}' is not a step id in this file")

    validate_relationships(title, chunk, step_ids, errors)

    duration = field_line(chunk, "estimatedDuration")
    if duration is not None and not duration:
        errors.append(f"Step '{title}': field 'estimatedDuration' must be non-empty when present")

    content_ref = field_line(chunk, "contentRef")
    external_url = field_line(chunk, "externalUrl")
    has_ref = bool(content_ref) and content_ref != "null"
    has_external = bool(external_url)

    if not has_ref and not has_external:
        warnings.append(f"Step '{title}': no contentRef or externalUrl link target")
    if has_ref:
        validate_content_ref(title, content_ref, locale, errors)
    if has_external and not is_http_url(external_url):
        errors.append(
            f"Step '{title}': invalid externalUrl '{external_url}'. Must be an http(s) URL without whitespace."
        )


def main() -> int:
    file_path = os.environ.get("OPENCODE_FILE_PATH", "")
    if not file_path:
        print("ERROR: OPENCODE_FILE_PATH not set", file=sys.stderr)
        return 2

    path = Path(file_path)
    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        return 2

    try:
        content = path.read_text(encoding="utf-8")
    except OSError as e:
        print(f"ERROR: Cannot read file: {e}", file=sys.stderr)
        return 2

    data, parse_error = extract_frontmatter(content)
    if parse_error:
        print(f"ROADMAP ERROR: {parse_error}", file=sys.stderr)
        return 2

    locale = derive_roadmap_locale(path)
    errors = validate_frontmatter(data)
    if locale is None or locale not in VALID_LOCALES:
        errors.append(
            f"Path must be content/roadmaps/<slug>/<locale>.md with locale one of: {', '.join(sorted(VALID_LOCALES))}"
        )
        locale = None

    body_start = find_body_start(content)
    body = content[body_start:] if body_start is not None else content
    steps, heading_errors = parse_steps(body)
    errors.extend(heading_errors)

    if not steps:
        errors.append("No step sections found (expected '## Step: <title>' headings)")

    titles = [title for title, _ in steps]
    for title in sorted({t for t in titles if titles.count(t) > 1}):
        errors.append(f"Duplicate step title: '{title}'")

    step_ids = set()
    for _, chunk in steps:
        step_id = field_line(chunk, "id")
        if step_id:
            if step_id in step_ids:
                errors.append(f"Duplicate step id: '{step_id}'")
            step_ids.add(step_id)

    warnings = []
    for title, chunk in steps:
        validate_step(title, chunk, step_ids, locale, errors, warnings)

    if errors:
        for err in errors:
            print(f"ROADMAP ERROR: {err}", file=sys.stderr)
        return 2

    if warnings:
        for warning in warnings:
            print(f"ROADMAP WARNING: {warning}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
