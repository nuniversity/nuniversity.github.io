#!/usr/bin/env python3
"""Tests for verify_quiz.py - the final structural verifier of the quiz-writer skill."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from conftest import SUB_11, SUB_12, SUB_21, make_matching, make_mcq, make_multi, make_ordering, make_quiz
from verify_quiz import main, verify


def make_final_quiz() -> dict:
    """A quiz that satisfies every final gate: allocations, sequential ids, no giveaways."""
    quiz = make_quiz()
    quiz["allocations"] = {SUB_11: 50, SUB_12: 30, SUB_21: 20}
    quiz["questions"] = [
        {**make_mcq(), "id": "q001"},
        {**make_ordering(subdomain=SUB_12), "id": "q002"},
        {**make_matching(subdomain=SUB_21), "id": "q003"},
        {**make_multi(), "id": "q004"},
    ]
    return quiz


GRID = {f"{SUB_11.split(' - ')[0]}:{t}": 1 for t in ("mcq", "multi")}
GRID.update({f"{SUB_12.split(' - ')[0]}:ordering": 1, f"{SUB_21.split(' - ')[0]}:matching": 1})


class TestCleanRun:
    """The happy path: a compliant quiz verifies clean."""

    def test_clean_quiz_passes(self):
        errors, warnings = verify(make_final_quiz(), stem="aws-aif-c01")
        assert errors == []

    def test_clean_quiz_with_target_and_grid(self):
        errors, _ = verify(make_final_quiz(), stem="aws-aif-c01", target=4, grid=GRID)
        assert errors == []

    def test_warnings_do_not_block(self, capsys):
        quiz = make_final_quiz()
        quiz["questions"][2]["options"][0] = "Stretched" + " x" * 40
        errors, warnings = verify(quiz, stem="aws-aif-c01")
        assert errors == []
        assert any("70" in w for w in warnings)


class TestIdentityGates:
    """id, slug and filename stem must agree; required fields must exist."""

    def test_id_slug_mismatch_rejected(self):
        quiz = make_final_quiz()
        quiz["slug"] = "something-else"
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("slug" in e for e in errors)

    def test_stem_mismatch_rejected(self):
        errors, _ = verify(make_final_quiz(), stem="other-quiz")
        assert any("stem" in e for e in errors)

    def test_missing_required_field_rejected(self):
        quiz = make_final_quiz()
        del quiz["certification"]
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("certification" in e for e in errors)

    def test_empty_questions_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"] = []
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("questions" in e for e in errors)


class TestAllocations:
    """allocations: positive ints, sum 100, exact two-way key match with subdomains."""

    def test_wrong_sum_rejected(self):
        quiz = make_final_quiz()
        quiz["allocations"][SUB_11] = 49
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("sum" in e for e in errors)

    def test_unknown_key_rejected(self):
        quiz = make_final_quiz()
        quiz["allocations"]["9.9 - Not a subdomain here"] = 5
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("unknown" in e for e in errors)

    def test_missing_subdomain_rejected(self):
        quiz = make_final_quiz()
        del quiz["allocations"][SUB_21]
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("missing" in e for e in errors)

    def test_non_positive_value_rejected(self):
        quiz = make_final_quiz()
        quiz["allocations"][SUB_11] = 0
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("positive" in e for e in errors)


class TestQuestionGates:
    """Ids, stems, subdomains, giveaway ordering, charset."""

    def test_non_sequential_ids_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"][1]["id"] = "q009"
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("q002" in e for e in errors)

    def test_bad_id_format_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"][0]["id"] = "item1"
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("id" in e for e in errors)

    def test_duplicate_stem_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"][3]["question"] = quiz["questions"][0]["question"].lower()
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("duplicate" in e for e in errors)

    def test_unknown_subdomain_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"][0]["subdomain"] = "9.9 - Fabricated subdomain"
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("subdomain" in e for e in errors)

    def test_giveaway_ordering_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"][1]["correct"] = sorted(quiz["questions"][1]["correct"])
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("giveaway" in e or "ascending" in e for e in errors)

    def test_non_ascii_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"][0]["explanation"] = "Caf\u00e9 prices vary by region."
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("ASCII" in e for e in errors)

    def test_dollar_sign_rejected(self):
        quiz = make_final_quiz()
        quiz["questions"][0]["options"][1] = "The 5$ entry tier"
        errors, _ = verify(quiz, stem="aws-aif-c01")
        assert any("price" in e for e in errors)


class TestQuotaGates:
    """Total, per-subdomain counts and type totals against the plan."""

    def test_wrong_total_rejected(self):
        errors, _ = verify(make_final_quiz(), stem="aws-aif-c01", target=5)
        assert any("total" in e for e in errors)

    def test_cell_count_mismatch_rejected(self):
        """A subdomain that shipped fewer items than the grid planned is a quota failure."""
        grid = dict(GRID)
        grid["1.1:mcq"] = 2  # the quiz only holds one
        errors, _ = verify(make_final_quiz(), stem="aws-aif-c01", target=4, grid=grid)
        assert any("1.1" in e for e in errors)

    def test_unplanned_cell_rejected(self):
        """An item type the grid never planned for that subdomain blocks the run."""
        grid = dict(GRID)
        del grid["1.2:ordering"]
        errors, _ = verify(make_final_quiz(), stem="aws-aif-c01", target=4, grid=grid)
        assert any("plan" in e or "1.2" in e for e in errors)

    def test_grid_adds_up_gate(self):
        """A grid whose cells do not sum to the target is itself malformed."""
        errors, _ = verify(make_final_quiz(), stem="aws-aif-c01", target=4,
                           grid={"1.1:mcq": 4, "1.2:ordering": 4})
        assert any("grid" in e for e in errors)


class TestBaseline:
    """--baseline protects every top-level field from silent drift."""

    def test_unchanged_fields_pass(self):
        quiz = make_final_quiz()
        baseline = json.loads(json.dumps(quiz))
        errors, _ = verify(quiz, stem="aws-aif-c01", baseline=baseline)
        assert errors == []

    def test_changed_mock_count_rejected(self):
        quiz = make_final_quiz()
        baseline = json.loads(json.dumps(quiz))
        quiz["mockQuestionCount"] = 50
        errors, _ = verify(quiz, stem="aws-aif-c01", baseline=baseline)
        assert any("mockQuestionCount" in e for e in errors)

    def test_changed_domains_rejected(self):
        quiz = make_final_quiz()
        baseline = json.loads(json.dumps(quiz))
        quiz["domains"][0]["color"] = "magenta"
        errors, _ = verify(quiz, stem="aws-aif-c01", baseline=baseline)
        assert any("domains" in e for e in errors)


class TestStrictLength:
    """Over-length matching strings: warning by default, error under --strict-length."""

    def test_strict_mode_blocks(self):
        quiz = make_final_quiz()
        quiz["questions"][2]["options"][0] = "Stretched" + " x" * 40
        errors, _ = verify(quiz, stem="aws-aif-c01", strict_length=True)
        assert any("70" in e for e in errors)

    def test_default_mode_warns(self):
        quiz = make_final_quiz()
        quiz["questions"][2]["options"][0] = "Stretched" + " x" * 40
        errors, warnings = verify(quiz, stem="aws-aif-c01")
        assert errors == []
        assert warnings


class TestMain:
    """CLI contract: 0 pass, 2 blocked; report on stdout, failures on stderr."""

    def write_quiz(self, tmp_path: Path, quiz: dict) -> Path:
        path = tmp_path / "aws-aif-c01.json"
        path.write_text(json.dumps(quiz, indent=2), encoding="utf-8")
        return path

    def test_clean_quiz_exits_zero(self, tmp_path: Path, capsys):
        path = self.write_quiz(tmp_path, make_final_quiz())
        rc = main(["--quiz", str(path), "--target", "4"])
        assert rc == 0
        assert "PASS" in capsys.readouterr().out

    def test_broken_quiz_exits_two(self, tmp_path: Path, capsys):
        quiz = make_final_quiz()
        quiz["questions"][1]["correct"] = [0, 1, 2, 3]
        path = self.write_quiz(tmp_path, quiz)
        rc = main(["--quiz", str(path)])
        assert rc == 2
        captured = capsys.readouterr()
        assert "FAIL" in captured.err
        assert "q002" in captured.err

    def test_missing_file_exits_two(self, tmp_path: Path):
        assert main(["--quiz", str(tmp_path / "absent.json")]) == 2

    def test_baseline_from_file(self, tmp_path: Path):
        quiz = make_final_quiz()
        path = self.write_quiz(tmp_path, quiz)
        baseline_path = tmp_path / "baseline.json"
        baseline_path.write_text(json.dumps(quiz), encoding="utf-8")
        assert main(["--quiz", str(path), "--baseline", str(baseline_path)]) == 0

    def test_report_lists_histograms(self, tmp_path: Path, capsys):
        path = self.write_quiz(tmp_path, make_final_quiz())
        main(["--quiz", str(path), "--target", "4"])
        out = capsys.readouterr().out
        assert "mcq" in out and "1.1" in out
