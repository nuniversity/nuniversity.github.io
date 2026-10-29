#!/usr/bin/env python3
"""Tests for validate_batch.py - the per-batch quality gate of the quiz-writer skill."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from conftest import (
    SUB_11,
    SUB_12,
    SUB_21,
    make_matching,
    make_mcq,
    make_multi,
    make_ordering,
    make_quiz,
    write_batch,
)
from validate_batch import jaccard, main, token_set, validate_batch, validate_item

BALANCE_STEMS = [
    "Which input mode streams objects for immediate training use without waiting for downloads?",
    "Which stopping condition caps the wall clock runtime a single training job may consume?",
    "Where does a finished pipeline write its model artifacts and the final checkpoint copy?",
    "How does Managed Spot Training bill a partial instance hour when capacity is reclaimed today?",
    "Why does a pipeline fail validation when the data quality baseline file is missing entirely?",
    "What happens to the endpoint when the auto scaling target utilization cannot be satisfied?",
    "When should warm pools be enabled for an account with predictable daily inference traffic?",
]


class TestUnitHelpers:
    """Pure-function checks for tokenization and similarity."""

    def test_token_set_drops_stopwords_and_single_chars(self):
        """Stopwords and one-character tokens never count toward similarity."""
        item = make_mcq(question="Which of the steps is the one that a model runs on the data?")
        tokens = token_set(item)
        assert "the" not in tokens
        assert "of" not in tokens
        assert "a" not in tokens
        assert "model" in tokens

    def test_token_set_includes_options(self):
        """Both the stem and the options feed the similarity set."""
        item = make_mcq(question="Pick the documented answer for this unique prompt", correct=2)
        tokens = token_set(item)
        assert "fastfile" in tokens
        assert "unique" in tokens

    def test_jaccard_identical_is_one(self):
        """Identical token sets score 1.0."""
        assert jaccard({"a", "b"}, {"a", "b"}) == 1.0

    def test_jaccard_disjoint_is_zero(self):
        """Disjoint token sets score 0.0."""
        assert jaccard({"a"}, {"b"}) == 0.0

    def test_jaccard_empty_union_is_zero(self):
        """Two empty sets never divide by zero."""
        assert jaccard(set(), set()) == 0.0


class TestItemSchema:
    """Per-item structural rules from the batch contract."""

    def test_valid_item_has_no_errors(self):
        """A well-formed mcq passes clean."""
        assert validate_item(make_mcq(), 0) == []

    def test_key_order_is_enforced(self):
        """Field order must be subdomain, type, question, options, correct, explanation."""
        item = make_mcq()
        reordered = dict(reversed(list(item.items())))
        errors = validate_item(reordered, 0)
        assert any("key order" in e for e in errors)

    def test_id_is_rejected_in_batch(self):
        """Batch items must not carry an id; the merge assigns it."""
        item = make_mcq()
        item["id"] = "q999"
        errors = validate_item(item, 0)
        assert any("id" in e for e in errors)

    def test_non_ascii_is_rejected(self):
        """Non-ASCII text breaks the export pipeline."""
        item = make_mcq()
        item["question"] = "Which mode streams data with a caf\u00e9 label attached?"
        errors = validate_item(item, 0)
        assert any("ASCII" in e for e in errors)

    def test_dollar_sign_is_rejected(self):
        """Prices never appear in quiz content."""
        item = make_mcq()
        item["explanation"] = "The tier costs $5 per hour to run."
        errors = validate_item(item, 0)
        assert any("price" in e for e in errors)

    @pytest.mark.parametrize(
        "phrase",
        ["Select all that apply", "Choose the correct option", "All of the above", "None of the above"],
    )
    def test_banned_phrases_are_rejected(self, phrase):
        """The four banned construction phrases never ship."""
        item = make_multi()
        item["question"] = f"Which statements are correct? {phrase}"
        errors = validate_item(item, 0)
        assert any("banned" in e for e in errors)

    def test_short_stem_is_rejected(self):
        """Stems under 25 characters are too thin to be real scenarios."""
        item = make_mcq()
        item["question"] = "Too short?"
        errors = validate_item(item, 0)
        assert any("25" in e for e in errors)

    def test_unknown_subdomain_is_rejected_by_validate_batch(self):
        """Subdomains must come from the quiz's own domain table."""
        item = make_mcq(subdomain="9.9 - A subdomain that does not exist here")
        errors = validate_batch([item], make_quiz(), siblings=[], grid=None)[0]
        assert any("subdomain" in e for e in errors)


class TestMcqRules:
    """mcq option counts, correct range and per-batch index balance."""

    def test_three_options_rejected(self):
        """mcq always carries exactly four options."""
        item = make_mcq()
        item["options"] = item["options"][:3]
        errors = validate_item(item, 0)
        assert any("four options" in e for e in errors)

    def test_out_of_range_correct_rejected(self):
        """correct must index one of the four options."""
        item = make_mcq(correct=4)
        errors = validate_item(item, 0)
        assert any("correct" in e for e in errors)

    def test_balance_rejects_unused_index(self):
        """When a batch has four or more mcqs every correct index must appear."""
        stems = BALANCE_STEMS[:4]
        batch = [make_mcq(question=stem, correct=0) for stem in stems]
        errors = validate_batch(batch, make_quiz(), siblings=[], grid=None)[0]
        assert any("balance" in e for e in errors)

    def test_balance_rejects_wide_spread(self):
        """No correct index may run more than two ahead of the rarest one."""
        batch = [make_mcq(question=stem, correct=1) for stem in BALANCE_STEMS[:6]]
        batch += [make_mcq(question=BALANCE_STEMS[6], correct=0)]
        errors = validate_batch(batch, make_quiz(), siblings=[], grid=None)[0]
        assert any("spread" in e or "balance" in e for e in errors)

    def test_balanced_batch_passes(self):
        """A batch using all four indices evenly is clean."""
        batch = [make_mcq(question=stem, correct=i) for i, stem in enumerate(BALANCE_STEMS[:4])]
        errors = validate_batch(batch, make_quiz(), siblings=[], grid=None)[0]
        assert errors == []


class TestMultiRules:
    """multi-select option floor and correct-set bounds."""

    def test_four_options_rejected(self):
        """multi needs at least five options."""
        item = make_multi()
        item["options"] = item["options"][:4]
        item["correct"] = [0, 1]
        errors = validate_item(item, 0)
        assert any("five options" in e for e in errors)

    def test_single_correct_rejected(self):
        """multi needs at least two correct answers."""
        item = make_multi(correct=[1])
        errors = validate_item(item, 0)
        assert any("two correct" in e for e in errors)

    def test_duplicate_correct_rejected(self):
        """correct entries are unique."""
        item = make_multi(correct=[0, 0, 2])
        errors = validate_item(item, 0)
        assert any("correct" in e for e in errors)


class TestOrderingRules:
    """ordering option bounds, subset validity and the anti-giveaway rule."""

    def test_two_options_rejected(self):
        """ordering needs at least three options."""
        item = make_ordering()
        item["options"] = item["options"][:2]
        item["correct"] = [0, 1]
        errors = validate_item(item, 0)
        assert any("options" in e for e in errors)

    def test_correct_beyond_five_rejected(self):
        """At most five steps are ever asked for."""
        item = make_ordering()
        item["correct"] = [0, 1, 2, 3, 4, 5]
        errors = validate_item(item, 0)
        assert any("correct" in e for e in errors)

    def test_correct_not_subset_rejected(self):
        """correct indexes must point at real options."""
        item = make_ordering(correct=[0, 1, 9])
        errors = validate_item(item, 0)
        assert any("correct" in e for e in errors)

    def test_ascending_answer_is_rejected(self):
        """An answer that follows presentation order gives the solution away."""
        item = make_ordering(correct=[0, 1, 2, 3])
        errors = validate_item(item, 0)
        assert any("ascending" in e for e in errors)

    def test_valid_shuffled_answer_passes(self):
        """A non-ascending answer is accepted."""
        assert validate_item(make_ordering(correct=[3, 1, 4, 0]), 0) == []


class TestMatchingRules:
    """matching pair counts, string length, prompts position and permutation."""

    def test_pair_count_bounds(self):
        """Three to seven pairs."""
        item = make_matching()
        item["prompts"] = item["prompts"][:2]
        item["options"] = item["options"][:2]
        item["correct"] = [0, 1]
        errors = validate_item(item, 0)
        assert any("pairs" in e for e in errors)

    def test_length_mismatch_rejected(self):
        """prompts, options and correct must line up."""
        item = make_matching(correct=[0, 1])
        errors = validate_item(item, 0)
        assert any("pairs" in e or "correct" in e for e in errors)

    def test_long_string_rejected(self):
        """Matching strings stay within the character limit."""
        item = make_matching()
        item["options"][0] = "A" * 71
        errors = validate_item(item, 0)
        assert any("70" in e for e in errors)

    def test_non_permutation_rejected(self):
        """correct must be a permutation of every prompt index."""
        item = make_matching(correct=[0, 1, 1])
        errors = validate_item(item, 0)
        assert any("permutation" in e for e in errors)

    def test_prompts_before_options(self):
        """prompts must precede options in the field order."""
        item = make_matching()
        reordered = {"subdomain": item["subdomain"], "type": item["type"], "question": item["question"]}
        reordered["options"] = item["options"]
        reordered["prompts"] = item["prompts"]
        reordered["correct"] = item["correct"]
        reordered["explanation"] = item["explanation"]
        errors = validate_item(reordered, 0)
        assert any("key order" in e for e in errors)


class TestDedupGate:
    """Exact stems and stopword-filtered Jaccard against bank, siblings and itself."""

    def test_exact_stem_vs_bank_rejected(self):
        """A stem already in the bank never passes."""
        quiz = make_quiz()
        item = make_mcq(question=quiz["questions"][0]["question"])
        errors = validate_batch([item], quiz, siblings=[], grid=None)[0]
        assert any("exact stem" in e for e in errors)

    def test_high_jaccard_vs_bank_rejected(self):
        """Near-paraphrase of a bank item trips the similarity ceiling."""
        near = make_mcq(
            question="Which service stores retrieved passages before a generation call is made?",
            options=["A vector database used for retrieval", "A message queue", "A block device", "A cron daemon"],
            correct=0,
        )
        errors = validate_batch([near], make_quiz(), siblings=[], grid=None)[0]
        assert any("jaccard" in e for e in errors)

    def test_high_jaccard_vs_sibling_rejected(self):
        """Near-duplicates across batches are caught too."""
        sibling = [make_mcq(question="Which input mode streams objects for immediate use?")]
        near = make_mcq(question="Which input mode streams objects for immediate use today?")
        errors = validate_batch([near], make_quiz(), siblings=sibling, grid=None)[0]
        assert any("sibling" in e for e in errors)

    def test_high_jaccard_within_batch_rejected(self):
        """Two near-identical items in one batch are caught even with skip_dedup."""
        a = make_mcq(question="Which input mode streams objects for immediate use?")
        b = make_mcq(question="Which input mode streams objects for immediate use now?")
        errors = validate_batch([a, b], make_quiz(), siblings=[], grid=None, skip_dedup=True)[0]
        assert any("intra-batch" in e for e in errors)

    def test_skip_dedup_only_skips_external_comparisons(self):
        """skip_dedup still enforces intra-batch similarity and schema."""
        a = make_mcq(question="Which input mode streams objects for immediate use?")
        errors = validate_batch([a], make_quiz(), siblings=[], grid=None, skip_dedup=True)[0]
        assert errors == []


class TestGrid:
    """The subdomain-by-type quota grid from Phase 0."""

    def test_grid_mismatch_rejected(self):
        """Counts must match the planned grid exactly."""
        grid = {"1.1:mcq": 3}
        errors = validate_batch([make_mcq()], make_quiz(), siblings=[], grid=grid)[0]
        assert any("grid" in e for e in errors)

    def test_grid_match_passes(self):
        """A batch matching its grid is clean."""
        grid = {"1.1:mcq": 1, "1.2:ordering": 1, "1.1:multi": 1, "2.1:matching": 1}
        batch = [make_mcq(), make_ordering(subdomain=SUB_12), make_multi(), make_matching(subdomain=SUB_21)]
        errors = validate_batch(batch, make_quiz(), siblings=[], grid=grid)[0]
        assert errors == []

    def test_grid_file_drives_main(self, tmp_path: Path, quiz: Path):
        """The CLI reads a grid JSON file."""
        batch_path = write_batch(tmp_path, [make_mcq()])
        grid_path = tmp_path / "grid.json"
        grid_path.write_text(json.dumps({"1.1:mcq": 2}), encoding="utf-8")
        rc = main(["--quiz", str(quiz), "--batch", str(batch_path), "--grid", str(grid_path)])
        assert rc == 2


class TestMainExitCodes:
    """Exit contract: 0 pass, 2 blocking failure."""

    def test_valid_batch_exits_zero(self, tmp_path: Path, quiz: Path, valid_batch: list):
        """A clean batch passes the CLI end to end."""
        batch_path = write_batch(tmp_path, valid_batch)
        assert main(["--quiz", str(quiz), "--batch", str(batch_path)]) == 0

    def test_broken_batch_exits_two(self, tmp_path: Path, quiz: Path):
        """A schema violation exits 2, never 1."""
        item = make_mcq(correct=7)
        batch_path = write_batch(tmp_path, [item])
        assert main(["--quiz", str(quiz), "--batch", str(batch_path)]) == 2

    def test_missing_batch_file_exits_two(self, tmp_path: Path, quiz: Path):
        """A missing input is a blocking error."""
        assert main(["--quiz", str(quiz), "--batch", str(tmp_path / "nope.json")]) == 2

    def test_report_lists_failures(self, tmp_path: Path, quiz: Path, capsys):
        """Every failure line names the offending batch index."""
        batch_path = write_batch(tmp_path, [make_mcq(correct=7)])
        main(["--quiz", str(quiz), "--batch", str(batch_path)])
        out = capsys.readouterr()
        captured = out.out + out.err
        assert "batch" in captured and "1" in captured
