#!/usr/bin/env python3
"""Validate library resource Markdown files for Nuniversity.

Deterministic hook: exit 0 = pass, exit 1 = warning (non-blocking), exit 2 = blocking error.

Environment Variables:
    OPENCODE_FILE_PATH: Path to the library Markdown file being validated

Usage:
    validate_library.py                 Validate one file from OPENCODE_FILE_PATH
    validate_library.py --check-ids     Walk content/library and warn on duplicate ids per locale

Dependencies:
    - pyyaml (for YAML parsing)

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warning (duplicate ids within a locale, --check-ids mode)
    2 - Blocking error (invalid frontmatter, missing or invalid fields)
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
VALID_CATEGORIES = {
    "Computer Science",
    "Data Engineering",
    "Software Engineering",
    "Cloud Computing",
    "Artificial Intelligence",
    "Mathematics",
    "Physics",
    "Web Development",
    "Mobile Development",
    "DevOps",
    "Cybersecurity",
    "Blockchain",
    "Portuguese Language",
    "Brazilian History",
    "Literature",
    "Education & Pedagogy",
    "Exam Preparation",
    "Business & Administration",
    "Law & Economics",
    "Biology & Life Sciences",
    "Humanities & Social Sciences",
    "Astronomy & Space Science",
    "Digital Library",
    "Teacher Training",
    "Open Access Research",
}
RESOURCE_TYPES = {"video", "ebook", "course", "blog", "repository", "podcast", "article"}
DIFFICULTIES = {"beginner", "intermediate", "advanced", "all"}
PLACEHOLDER_MARKERS = ("yourdomain", "placeholder", "changeme")
PLACEHOLDER_HOSTS = {"localhost", "127.0.0.1", "example.com", "example.org", "example.net"}
REQUIRED_FIELDS = ("id", "title", "description", "url", "category", "language")
OPTIONAL_STRING_FIELDS = ("author", "publishDate", "lastUpdated", "platform", "duration")
REPO_ROOT = Path(__file__).resolve().parents[3] / ".."
LIBRARY_ROOT = REPO_ROOT / "content" / "library"
EXCEPTIONS_PATH = REPO_ROOT / "content" / "library" / "link-exceptions.tsv"


def repo_relative(path: Path) -> str:
    resolved = path.resolve()
    try:
        return resolved.relative_to(REPO_ROOT.resolve()).as_posix()
    except ValueError:
        return resolved.as_posix()


def load_exceptions() -> tuple[dict[str, str], list[str]]:
    errors = []
    rows: dict[str, str] = {}
    if not EXCEPTIONS_PATH.is_file():
        return rows, [f"Missing link exceptions ledger: {EXCEPTIONS_PATH}"]
    try:
        raw = EXCEPTIONS_PATH.read_text(encoding="utf-8")
    except OSError as e:
        return rows, [f"Cannot read link exceptions ledger: {e}"]
    lines = [line for line in raw.replace("\r\n", "\n").replace("\r", "\n").split("\n") if line.strip()]
    for line in lines[1:]:
        parts = line.split("\t")
        if len(parts) < 3 or not parts[0].strip() or not parts[1].strip() or not "".join(parts[2:]).strip():
            errors.append(f"Malformed link exceptions row: {line!r}")
            continue
        rows[parts[0].strip()] = parts[1].strip()
    return rows, errors


def collect_urls() -> dict[str, list[str]]:
    urls: dict[str, list[str]] = {}
    if not LIBRARY_ROOT.is_dir():
        return urls
    for file_path in sorted(LIBRARY_ROOT.rglob("*.md")):
        try:
            content = file_path.read_text(encoding="utf-8")
        except OSError:
            continue
        data, parse_error = extract_frontmatter(content)
        if parse_error or data is None:
            continue
        url = data.get("url")
        if isinstance(url, str) and url.strip():
            urls.setdefault(url, []).append(repo_relative(file_path))
    return urls


def validate_curation(data: dict, current_file: str) -> list[str]:
    errors = []
    exception_files, ledger_errors = load_exceptions()
    errors.extend(ledger_errors)

    url = data.get("url")
    if isinstance(url, str) and url.strip():
        if not url.startswith("https://") and current_file not in exception_files:
            errors.append(f"Url must use https:// (or be listed in content/library/link-exceptions.tsv): {url}")
        if not ledger_errors:
            shared = collect_urls().get(url, [])
            if len(shared) > 1 and url not in set(exception_files.values()):
                errors.append(
                    f"Duplicate url shared by {', '.join(shared)} — "
                    f"list it in content/library/link-exceptions.tsv: {url}"
                )
    return errors


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


def is_placeholder_url(value: str) -> bool:
    host = urlparse(value).netloc.split("@")[-1].split(":")[0].lower()
    if host.startswith("www."):
        host = host[4:]
    if host in PLACEHOLDER_HOSTS:
        return True
    return any(marker in host for marker in PLACEHOLDER_MARKERS)


def derive_location(path: Path) -> tuple[str | None, str | None]:
    parts = path.parts
    if len(parts) >= 5 and parts[-5] == "content" and parts[-4] == "library":
        locale, resource_type = parts[-3], parts[-2]
        if locale in VALID_LOCALES and resource_type in RESOURCE_TYPES:
            return locale, resource_type
    return None, None


def validate_resource(data: dict, locale: str | None) -> list[str]:
    errors = []

    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            errors.append(f"Missing required field: {field}")
        elif not isinstance(data[field], str) or not data[field].strip():
            errors.append(f"Required field '{field}' must be a non-empty string")

    category = data.get("category")
    if isinstance(category, str) and category.strip() and category not in VALID_CATEGORIES:
        errors.append(f"Invalid category: '{category}'. Must be one of: {', '.join(sorted(VALID_CATEGORIES))}")

    url = data.get("url")
    if isinstance(url, str) and url.strip():
        if not is_http_url(url):
            errors.append(f"Invalid url: '{url}'. Must be an http(s) URL without whitespace.")
        elif is_placeholder_url(url):
            errors.append(f"Placeholder url host: '{url}'")

    language = data.get("language")
    if locale is not None and isinstance(language, str) and language.strip() and language != locale:
        errors.append(f"language '{language}' does not match locale folder '{locale}'")

    thumbnail = data.get("thumbnail")
    if thumbnail is not None and not is_http_url(thumbnail):
        errors.append(f"Invalid thumbnail: '{thumbnail}'. Must be an http(s) URL without whitespace.")

    for field in OPTIONAL_STRING_FIELDS:
        value = data.get(field)
        if value is not None and (not isinstance(value, str) or not value.strip()):
            errors.append(f"Field '{field}' must be a non-empty string when present")

    difficulty = data.get("difficulty")
    if difficulty is not None and difficulty not in DIFFICULTIES:
        errors.append(f"Invalid difficulty: '{difficulty}'. Must be one of: {', '.join(sorted(DIFFICULTIES))}")

    is_paid = data.get("isPaid")
    if is_paid is not None and not isinstance(is_paid, bool):
        errors.append(f"Field 'isPaid' must be a boolean, got {is_paid!r}")

    rating = data.get("rating")
    if rating is not None and (isinstance(rating, bool) or not isinstance(rating, (int, float))):
        errors.append(f"Field 'rating' must be a number, got {rating!r}")

    pages = data.get("pages")
    if pages is not None and (isinstance(pages, bool) or not isinstance(pages, int)):
        errors.append(f"Field 'pages' must be an integer, got {pages!r}")

    tags = data.get("tags")
    if tags is not None:
        if not isinstance(tags, list):
            errors.append("Field 'tags' must be a list of strings when present")
        else:
            for i, tag in enumerate(tags):
                if not isinstance(tag, str) or not tag.strip():
                    errors.append(f"Field 'tags' entry {i} must be a non-empty string")

    return errors


def check_ids() -> int:
    if not LIBRARY_ROOT.is_dir():
        print(f"LIBRARY ERROR: Directory not found: {LIBRARY_ROOT}", file=sys.stderr)
        return 2

    errors = []
    warnings = []
    seen: dict[tuple[str, str], str] = {}

    for file_path in sorted(LIBRARY_ROOT.rglob("*.md")):
        try:
            content = file_path.read_text(encoding="utf-8")
        except OSError as e:
            errors.append(f"Cannot read {file_path}: {e}")
            continue

        data, parse_error = extract_frontmatter(content)
        if parse_error:
            errors.append(f"{file_path}: {parse_error}")
            continue

        locale, _ = derive_location(file_path)
        resource_id = data.get("id")
        if locale is None or not isinstance(resource_id, str) or not resource_id.strip():
            continue

        key = (locale, resource_id)
        if key in seen:
            warnings.append(f"Duplicate id '{resource_id}' in locale '{locale}': {seen[key]} and {file_path}")
        else:
            seen[key] = str(file_path)

    if errors:
        for err in errors:
            print(f"LIBRARY ERROR: {err}", file=sys.stderr)
        return 2

    if warnings:
        for warning in warnings:
            print(f"LIBRARY WARNING: {warning}", file=sys.stderr)
        return 1

    return 0


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "--check-ids":
        return check_ids()

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
        print(f"LIBRARY ERROR: {parse_error}", file=sys.stderr)
        return 2

    locale, resource_type = derive_location(path)
    errors = validate_resource(data, locale)
    if locale is None or resource_type is None:
        errors.insert(0, "Path must be content/library/<locale>/<resource-type>/<file>.md")
    errors.extend(validate_curation(data, repo_relative(path)))

    if errors:
        for err in errors:
            print(f"LIBRARY ERROR: {err}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
