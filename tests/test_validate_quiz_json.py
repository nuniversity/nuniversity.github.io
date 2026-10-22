import copy
import importlib.util
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
HOOK_PATH = REPO_ROOT / ".opencode" / "hooks" / "validate-quiz-json" / "scripts" / "validate_quiz_json.py"
EXAMPLE_PATH = REPO_ROOT / ".opencode" / "hooks" / "validate-quiz-json" / "examples" / "valid_quiz.json"


def _load_hook():
    spec = importlib.util.spec_from_file_location("validate_quiz_json_hook", HOOK_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


hook = _load_hook()


def _valid_quiz() -> dict:
    return copy.deepcopy(json.loads(EXAMPLE_PATH.read_text(encoding="utf-8")))


def _run(tmp_path, monkeypatch, data: dict, name: str = "valid_quiz.json") -> int:
    path = tmp_path / name
    path.write_text(json.dumps(data), encoding="utf-8")
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
    return hook.main()


def test_valid_fixture_passes(monkeypatch):
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(EXAMPLE_PATH))
    assert hook.main() == 0


def test_valid_in_memory_quiz_passes(tmp_path, monkeypatch):
    assert _run(tmp_path, monkeypatch, _valid_quiz()) == 0


def test_correct_index_out_of_range_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["questions"][1]["correct"] = 4
    assert _run(tmp_path, monkeypatch, data) == 2


def test_allocations_sum_not_100_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["allocations"] = {"1.1": 40, "2.1": 50}
    assert _run(tmp_path, monkeypatch, data) == 2


def test_non_sequential_question_ids_fail(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["questions"][1]["id"] = "q005"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_locale_question_key_not_in_base_ids_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["locales"]["pt"]["questions"] = {
        "q001": {"question": "Tradução da questão um"},
        "q999": {"question": "Chave desconhecida"},
    }
    assert _run(tmp_path, monkeypatch, data) == 2


def test_missing_required_top_level_key_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    del data["passingScore"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_id_not_matching_filename_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["id"] = "other-quiz-id"
    assert _run(tmp_path, monkeypatch, data, name="valid_quiz.json") == 2


def test_unknown_question_subdomain_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["questions"][0]["subdomain"] = "9.9"
    assert _run(tmp_path, monkeypatch, data) == 2
