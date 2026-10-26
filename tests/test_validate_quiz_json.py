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


def _multi_question() -> dict:
    return {
        "subdomain": "1.1",
        "type": "multi",
        "question": "Select the two prime numbers",
        "options": ["4", "7", "9", "11", "15"],
        "correct": [1, 3],
        "explanation": "7 and 11 are prime.",
    }


def _ordering_question() -> dict:
    return {
        "subdomain": "1.1",
        "type": "ordering",
        "question": "Put the pipeline stages in order",
        "options": ["Visualize", "Extract", "Transform", "Load", "Archive"],
        "correct": [1, 2, 3],
        "explanation": "Extract, transform, then load before visualizing.",
    }


def _matching_question() -> dict:
    return {
        "subdomain": "1.1",
        "type": "matching",
        "question": "Match each service to its primary role",
        "prompts": ["Glue", "Athena", "QuickSight"],
        "options": ["ETL service", "SQL query engine", "BI dashboard"],
        "correct": [0, 1, 2],
        "explanation": "Each service maps to its primary role.",
    }


def _set_question(data: dict, index: int, question: dict) -> None:
    question = dict(question)
    question["id"] = f"q{index + 1:03d}"
    question["subdomain"] = data["questions"][index]["subdomain"]
    data["questions"][index] = question


def test_all_supported_question_types_pass(tmp_path, monkeypatch):
    data = _valid_quiz()
    _set_question(data, 0, _multi_question())
    _set_question(data, 1, _ordering_question())
    _set_question(data, 2, _matching_question())
    assert _run(tmp_path, monkeypatch, data) == 0


def test_multi_with_too_few_options_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _multi_question()
    question["options"] = ["4", "7", "9"]
    question["correct"] = [0, 1]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_multi_correct_not_array_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _multi_question()
    question["correct"] = 1
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_multi_correct_duplicate_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _multi_question()
    question["correct"] = [1, 1]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_multi_correct_out_of_range_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _multi_question()
    question["correct"] = [1, 5]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_ordering_correct_too_short_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _ordering_question()
    question["correct"] = [1, 2]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_ordering_correct_out_of_range_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _ordering_question()
    question["correct"] = [1, 2, 9]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_ordering_too_many_presented_items_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _ordering_question()
    question["options"] = ["a", "b", "c", "d", "e", "f", "g"]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_matching_missing_prompts_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _matching_question()
    del question["prompts"]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_matching_prompt_option_count_mismatch_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _matching_question()
    question["options"] = ["ETL service", "SQL query engine"]
    question["correct"] = [0, 1]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_matching_duplicate_pairs_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    question = _matching_question()
    question["correct"] = [0, 0, 2]
    _set_question(data, 0, question)
    assert _run(tmp_path, monkeypatch, data) == 2


def test_mock_question_count_valid_passes(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["mockQuestionCount"] = 65
    assert _run(tmp_path, monkeypatch, data) == 0


def test_mock_question_count_zero_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["mockQuestionCount"] = 0
    assert _run(tmp_path, monkeypatch, data) == 2


def test_mock_question_count_not_integer_fails(tmp_path, monkeypatch):
    data = _valid_quiz()
    data["mockQuestionCount"] = "65"
    assert _run(tmp_path, monkeypatch, data) == 2


def test_locale_options_length_must_match_base(tmp_path, monkeypatch):
    data = _valid_quiz()
    _set_question(data, 0, _multi_question())
    data["locales"]["pt"]["questions"] = {
        "q001": {
            "question": "Números primos",
            "explanation": "7 e 11 são primos.",
            "options": ["4", "7", "9"],
        }
    }
    assert _run(tmp_path, monkeypatch, data) == 2


def test_locale_options_matching_base_passes(tmp_path, monkeypatch):
    data = _valid_quiz()
    _set_question(data, 0, _multi_question())
    data["locales"]["pt"]["questions"] = {
        "q001": {
            "question": "Números primos",
            "explanation": "7 e 11 são primos.",
            "options": ["4", "7", "9", "11", "15"],
        }
    }
    assert _run(tmp_path, monkeypatch, data) == 0
