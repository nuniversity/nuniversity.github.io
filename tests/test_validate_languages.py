import copy
import importlib.util
import json
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]
HOOK_PATH = REPO_ROOT / ".opencode" / "hooks" / "validate-languages" / "scripts" / "validate_languages.py"
EXAMPLE_PATH = REPO_ROOT / ".opencode" / "hooks" / "validate-languages" / "examples" / "valid-language.json"
CONTENT_DIR = REPO_ROOT / "content" / "languages" / "vocabulary"


def _load_hook():
    spec = importlib.util.spec_from_file_location("validate_languages_hook", HOOK_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


hook = _load_hook()


def _valid() -> dict:
    return copy.deepcopy(json.loads(EXAMPLE_PATH.read_text(encoding="utf-8")))


def _run(tmp_path, monkeypatch, data: dict, name: str = "valid-language.json") -> int:
    path = tmp_path / name
    path.write_text(json.dumps(data), encoding="utf-8")
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
    return hook.main()


def test_valid_fixture_passes(monkeypatch):
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(EXAMPLE_PATH))
    assert hook.main() == 0


@pytest.mark.parametrize(
    "filename",
    sorted(p.name for p in CONTENT_DIR.glob("*.json")),
)
def test_real_content_files_pass(filename, monkeypatch):
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(CONTENT_DIR / filename))
    assert hook.main() == 0


def test_valid_in_memory_activity_passes(tmp_path, monkeypatch):
    assert _run(tmp_path, monkeypatch, _valid()) == 0


def test_missing_open_code_file_path_returns_error(monkeypatch):
    monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
    assert hook.main() == 2


def test_file_not_found_returns_error(tmp_path, monkeypatch):
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(tmp_path / "missing.json"))
    assert hook.main() == 2


def test_invalid_json_returns_error(tmp_path, monkeypatch):
    path = tmp_path / "broken.json"
    path.write_text("{not json", encoding="utf-8")
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
    assert hook.main() == 2


def test_non_object_top_level_returns_error(tmp_path, monkeypatch):
    path = tmp_path / "list.json"
    path.write_text("[1, 2, 3]", encoding="utf-8")
    monkeypatch.setenv("OPENCODE_FILE_PATH", str(path))
    assert hook.main() == 2


def test_id_must_match_filename(tmp_path, monkeypatch):
    data = _valid()
    data["id"] = "other-activity"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_missing_required_top_level_key_fails(tmp_path, monkeypatch):
    data = _valid()
    del data["difficulty"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_missing_language_pair_fails(tmp_path, monkeypatch):
    data = _valid()
    del data["language_pair"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_language_pair_missing_target_fails(tmp_path, monkeypatch):
    data = _valid()
    data["language_pair"] = {"source": "en"}
    assert _run(tmp_path, monkeypatch, data) == 2


def test_language_pair_same_source_target_fails(tmp_path, monkeypatch):
    data = _valid()
    data["language_pair"] = {"source": "pt", "target": "pt"}
    assert _run(tmp_path, monkeypatch, data) == 2


def test_invalid_difficulty_fails(tmp_path, monkeypatch):
    data = _valid()
    data["difficulty"] = "expert"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_invalid_category_fails(tmp_path, monkeypatch):
    data = _valid()
    data["category"] = "coding"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_missing_game_type_defaults_to_matching(tmp_path, monkeypatch):
    data = _valid()
    assert "gameType" not in data
    assert _run(tmp_path, monkeypatch, data) == 0


def test_valid_game_types_pass(tmp_path, monkeypatch):
    for game_type in ("matching", "flashcards"):
        data = _valid()
        data["gameType"] = game_type
        assert _run(tmp_path, monkeypatch, data) == 0


def test_invalid_game_type_fails(tmp_path, monkeypatch):
    data = _valid()
    data["gameType"] = "memory"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_too_few_words_fails(tmp_path, monkeypatch):
    data = _valid()
    data["words"] = data["words"][:10]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_words_must_be_array_fails(tmp_path, monkeypatch):
    data = _valid()
    data["words"] = {"a": 1}
    assert _run(tmp_path, monkeypatch, data) == 2


def test_missing_word_field_fails(tmp_path, monkeypatch):
    data = _valid()
    del data["words"][0]["context"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_duplicate_word_id_fails(tmp_path, monkeypatch):
    data = _valid()
    data["words"][1]["id"] = data["words"][0]["id"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_duplicate_word_row_fails(tmp_path, monkeypatch):
    data = _valid()
    data["words"][1]["source"] = data["words"][0]["source"]
    data["words"][1]["target"] = data["words"][0]["target"]
    data["words"][1]["context"] = data["words"][0]["context"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_invalid_word_level_fails(tmp_path, monkeypatch):
    data = _valid()
    data["words"][0]["level"] = "C1"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_non_string_optional_word_field_fails(tmp_path, monkeypatch):
    data = _valid()
    data["words"][0]["emoji"] = 42
    assert _run(tmp_path, monkeypatch, data) == 2


def test_non_boolean_is_expression_fails(tmp_path, monkeypatch):
    data = _valid()
    data["words"][0]["isExpression"] = "yes"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_context_labels_must_be_object_fails(tmp_path, monkeypatch):
    data = _valid()
    data["contextLabels"] = ["greeting"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_context_labels_mapping_must_be_object_fails(tmp_path, monkeypatch):
    data = _valid()
    data["contextLabels"] = {"greeting": "Greetings"}
    assert _run(tmp_path, monkeypatch, data) == 2


def test_locales_must_be_object_fails(tmp_path, monkeypatch):
    data = _valid()
    data["locales"] = ["en"]
    assert _run(tmp_path, monkeypatch, data) == 2


def test_locale_field_must_be_string_fails(tmp_path, monkeypatch):
    data = _valid()
    data["locales"] = {"pt": {"title": 42}}
    assert _run(tmp_path, monkeypatch, data) == 2


def test_locale_context_labels_must_be_object_fails(tmp_path, monkeypatch):
    data = _valid()
    data["locales"] = {"pt": {"contextLabels": ["a"]}}
    assert _run(tmp_path, monkeypatch, data) == 2


def test_valid_full_activity_with_optional_fields_passes(tmp_path, monkeypatch):
    data = _valid()
    data["gameType"] = "flashcards"
    data["sourceLanguage"] = "English"
    data["targetLanguage"] = "Portuguese"
    data["contextLabels"] = {"greeting": {"en": "Greetings", "pt": "Saudações"}}
    data["locales"] = {
        "pt": {
            "title": "Vocabulário do dia a dia",
            "description": "Quarenta palavras essenciais",
            "sourceLanguage": "Inglês",
            "targetLanguage": "Português",
            "contextLabels": {"greeting": "Saudações"},
        }
    }
    data["words"][0]["emoji"] = "👋"
    data["words"][0]["pronunciation"] = "hɛˈləʊ"
    data["words"][0]["example"] = "Hello there!"
    data["words"][0]["exampleTranslation"] = "Olá!"
    data["words"][0]["isExpression"] = True
    data["words"][1]["level"] = "A1"
    assert _run(tmp_path, monkeypatch, data) == 0
