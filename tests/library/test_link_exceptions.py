import importlib.util
from pathlib import Path
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parents[2]
LIBRARY_ROOT = REPO_ROOT / "content" / "library"
EXCEPTIONS_PATH = LIBRARY_ROOT / "link-exceptions.tsv"
HOOK_PATH = REPO_ROOT / ".opencode" / "hooks" / "validate-library" / "scripts" / "validate_library.py"


def _load_hook():
    spec = importlib.util.spec_from_file_location("validate_library_hook", HOOK_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


hook = _load_hook()


def _frontmatter(path: Path) -> dict:
    data, error = hook.extract_frontmatter(path.read_text(encoding="utf-8"))
    assert error is None, f"{path}: {error}"
    assert isinstance(data, dict)
    return data


def _library_files() -> list[Path]:
    return sorted(LIBRARY_ROOT.rglob("*.md"))


def _exceptions_rows() -> list[tuple[str, str, str]]:
    raw = EXCEPTIONS_PATH.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    lines = [line for line in raw.split("\n") if line.strip()]
    assert lines, "link-exceptions.tsv is empty"
    assert lines[0] == "file\turl\treason", "header must be: file<TAB>url<TAB>reason"
    rows = []
    for line in lines[1:]:
        parts = line.split("\t")
        assert len(parts) >= 3, f"malformed row: {line!r}"
        rows.append((parts[0], parts[1], "\t".join(parts[2:])))
    return rows


def test_exceptions_rows_reference_existing_files_with_matching_url():
    rows = _exceptions_rows()
    assert rows
    for file_rel, url, reason in rows:
        path = REPO_ROOT / file_rel
        assert path.is_file(), f"{file_rel}: listed in exceptions but missing"
        assert url and reason, f"malformed row for {file_rel}"
        assert _frontmatter(path).get("url") == url, f"{file_rel}: exceptions url mismatch"


def test_urls_are_https_or_excepted():
    exempt = {file_rel for file_rel, _, _ in _exceptions_rows()}
    for path in _library_files():
        rel = path.relative_to(REPO_ROOT).as_posix()
        url = _frontmatter(path).get("url")
        if not isinstance(url, str) or not url:
            continue
        if rel in exempt:
            continue
        assert url.startswith("https://"), f"{rel}: non-https url {url} not in exceptions"


def test_duplicate_urls_across_files_are_excepted():
    exception_urls = {url for _, url, _ in _exceptions_rows()}
    by_url: dict[str, list[str]] = {}
    for path in _library_files():
        url = _frontmatter(path).get("url")
        if isinstance(url, str) and url:
            by_url.setdefault(url, []).append(path.relative_to(REPO_ROOT).as_posix())
    for url, files in by_url.items():
        if len(files) > 1:
            assert url in exception_urls, f"duplicate url {url} in {files} not in exceptions"


def test_bare_host_urls_are_excepted():
    exception_urls = {url for _, url, _ in _exceptions_rows()}
    for path in _library_files():
        url = _frontmatter(path).get("url")
        if not isinstance(url, str) or not url:
            continue
        if urlparse(url).path in ("/", ""):
            assert url in exception_urls, f"bare-host url {url} not in exceptions"


def test_hook_curation_rules_pass_for_every_library_file():
    for path in _library_files():
        rel = path.relative_to(REPO_ROOT).as_posix()
        errors = hook.validate_curation(_frontmatter(path), rel)
        assert errors == [], f"{rel}: {errors}"
