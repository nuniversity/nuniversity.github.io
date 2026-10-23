import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
HOOKS = REPO_ROOT / ".opencode" / "hooks"


def _load(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, HOOKS / rel)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


library_hook = _load("validate_library_hook", "validate-library/scripts/validate_library.py")
roadmap_hook = _load("validate_roadmap_hook", "validate-roadmap/scripts/validate_roadmap.py")
tools_hook = _load("validate_tools_hook", "validate-tools/scripts/validate_tools.py")
quiz_hook = _load("validate_quiz_json_hook", "validate-quiz-json/scripts/validate_quiz_json.py")

REAL_LIBRARY = REPO_ROOT / "content" / "library" / "en" / "article" / "mlops-guide.md"
REAL_ROADMAP = REPO_ROOT / "content" / "roadmaps" / "intro-to-software-engineering" / "en.md"
REAL_TOOL = REPO_ROOT / "content" / "tools" / "pomodoro-timer" / "en.md"


def _fm(body: str, **fields) -> str:
    lines = "---"
    for key, value in fields.items():
        lines += f"\n{key}: {json.dumps(value) if isinstance(value, (dict, list)) else value}"
    lines += "\n---\n"
    return lines + body


def _write(tmp_path: Path, name: str, content: str) -> Path:
    path = tmp_path / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path


class TestLibrary:
    def test_real_file_passes(self, monkeypatch):
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(REAL_LIBRARY))
        assert library_hook.main() == 0

    def test_check_ids_passes(self, monkeypatch):
        monkeypatch.setattr("sys.argv", ["validate_library.py", "--check-ids"])
        assert library_hook.main() == 0

    def test_missing_env_fails(self, monkeypatch):
        monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
        assert library_hook.main() == 2

    def test_missing_file_fails(self, monkeypatch, tmp_path):
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(tmp_path / "nope.md"))
        assert library_hook.main() == 2

    def test_bad_path_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "loose.md", _fm("body", id="x", title="X", description="D", url="https://e.com", category="article", language="en"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert library_hook.main() == 2

    def test_missing_required_field_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/article/x.md", _fm("body", id="x", title="X", description="D", category="article", language="en"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert library_hook.main() == 2

    def test_placeholder_url_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/article/x.md", _fm("body", id="x", title="X", description="D", url="https://example.com/placeholder", category="article", language="en"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert library_hook.main() == 2

    def test_bad_difficulty_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/article/x.md", _fm("body", id="x", title="X", description="D", url="https://e.com/a", category="article", language="en", difficulty="expert"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert library_hook.main() == 2

    def test_language_mismatch_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/article/x.md", _fm("body", id="x", title="X", description="D", url="https://e.com/a", category="article", language="pt"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert library_hook.main() == 2

    def test_malformed_frontmatter_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/article/x.md", "---\ntitle: [unclosed\n---\nbody")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert library_hook.main() == 2


class TestRoadmap:
    def test_real_file_passes(self, monkeypatch):
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(REAL_ROADMAP))
        assert roadmap_hook.main() == 0

    def test_missing_env_fails(self, monkeypatch):
        monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
        assert roadmap_hook.main() == 2

    def test_missing_file_fails(self, monkeypatch, tmp_path):
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(tmp_path / "nope.md"))
        assert roadmap_hook.main() == 2

    def test_bad_locale_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "content/roadmaps/x/de.md", _fm("## Step: A\n\n- id: s1\n", id="x", title="X", description="D", icon="code", estimatedDuration="1h", order=1, difficulty="beginner"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert roadmap_hook.main() == 2

    def test_missing_frontmatter_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "content/roadmaps/x/en.md", _fm("## Step: A\n\n- id: s1\n", id="x"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert roadmap_hook.main() == 2

    def test_no_steps_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "content/roadmaps/x/en.md", _fm("plain body\n", id="x", title="X", description="D", icon="code", estimatedDuration="1h", order=1, difficulty="beginner"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert roadmap_hook.main() == 2

    def test_duplicate_step_title_fails(self, monkeypatch, tmp_path):
        body = "## Step: A\n\n- id: s1\n\n## Step: A\n\n- id: s2\n"
        path = _write(tmp_path, "content/roadmaps/x/en.md", _fm(body, id="x", title="X", description="D", icon="code", estimatedDuration="1h", order=1, difficulty="beginner"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert roadmap_hook.main() == 2

    def test_bad_order_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "content/roadmaps/x/en.md", _fm("## Step: A\n\n- id: s1\n", id="x", title="X", description="D", icon="code", estimatedDuration="1h", order=0, difficulty="beginner"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert roadmap_hook.main() == 2

    def test_bad_difficulty_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "content/roadmaps/x/en.md", _fm("## Step: A\n\n- id: s1\n", id="x", title="X", description="D", icon="code", estimatedDuration="1h", order=1, difficulty="impossible"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert roadmap_hook.main() == 2


class TestTools:
    def test_real_file_passes(self, monkeypatch):
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(REAL_TOOL))
        assert tools_hook.main() == 0

    def test_missing_env_fails(self, monkeypatch):
        monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
        assert tools_hook.main() == 2

    def test_missing_file_fails(self, monkeypatch, tmp_path):
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(tmp_path / "nope.md"))
        assert tools_hook.main() == 2

    def test_missing_required_field_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/x.md", _fm("body", title="X"))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert tools_hook.main() == 2

    def test_empty_title_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/x.md", _fm("body", title="", description="D", category="productivity", icon="clock", order=1))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert tools_hook.main() == 2

    def test_bad_category_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/x.md", _fm("body", title="X", description="D", category="nope", icon="clock", order=1))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert tools_hook.main() == 2

    def test_bad_order_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/x.md", _fm("body", title="X", description="D", category="productivity", icon="clock", order=-3))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert tools_hook.main() == 2

    def test_malformed_frontmatter_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "en/x.md", "---\ntitle: [oops\n---\nbody")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert tools_hook.main() == 2


class TestQuizJsonExtra:
    def test_missing_env_fails(self, monkeypatch):
        monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
        assert quiz_hook.main() == 2

    def test_missing_file_fails(self, monkeypatch, tmp_path):
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(tmp_path / "nope.json"))
        assert quiz_hook.main() == 2

    def test_invalid_json_fails(self, monkeypatch, tmp_path):
        path = _write(tmp_path, "bad.json", "{not json")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert quiz_hook.main() == 2

    def test_invalid_kind_fails(self, monkeypatch, tmp_path):
        example = json.loads((HOOKS / "validate-quiz-json/examples/valid_quiz.json").read_text(encoding="utf-8"))
        example["kind"] = "speedrun"
        path = _write(tmp_path, "valid_quiz.json", json.dumps(example))
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
        assert quiz_hook.main() == 2
