#!/usr/bin/env python3
"""Tests for merge_batches.py - the deterministic merge and renumber step of the quiz-writer skill."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from conftest import SUB_11, SUB_12, SUB_21, make_mcq, make_matching, make_quiz, write_batch
from merge_batches import canonical, main, merge, subprefix


class TestSubprefix:
    """Subdomain prefix extraction for histograms and grids."""

    def test_standard_subdomain(self):
        """The '1.1 - Title' form yields its prefix."""
        assert subprefix(SUB_11) == "1.1"

    def test_bare_subdomain_falls_back(self):
        """A subdomain without the title suffix still yields a prefix."""
        assert subprefix("1.1") == "1.1"


class TestCanonical:
    """Field order of merged items: id first, everything else after."""

    def test_id_moves_to_front(self):
        """A batch item without id gets it placed first, not appended."""
        item = make_mcq()
        out = canonical(item, "q042")
        keys = list(out.keys())
        assert keys[0] == "id"
        assert out["id"] == "q042"
        assert keys[1:] == list(item)

    def test_existing_id_stays_first(self):
        """A legacy item that already leads with id keeps canonical order."""
        item = make_matching()
        item_with_id = {"id": "q007", **item}
        out = canonical(item_with_id, "q009")
        assert next(iter(out)) == "id"
        assert out["id"] == "q009"

    def test_prompts_stay_after_question(self):
        """Matching items keep prompts between question and options."""
        out = canonical(make_matching(), "q001")
        keys = list(out.keys())
        assert keys.index("prompts") == keys.index("question") + 1
        assert keys.index("options") == keys.index("prompts") + 1


class TestMerge:
    """Pure merge behaviour: ordering, grouping, numbering and gates."""

    def test_merge_counts_and_ids(self):
        """Bank plus batch equals total, renumbered q001..qNNN in sequence."""
        quiz = make_quiz()
        merged, errors = merge(quiz, [[make_mcq(subdomain=SUB_12)]])
        assert errors == []
        ids = [q["id"] for q in merged["questions"]]
        assert ids == [f"q{i:03d}" for i in range(1, len(ids) + 1)]

    def test_merge_groups_by_subdomain(self):
        """Output is grouped in the quiz's canonical subdomain order."""
        quiz = make_quiz()
        new_21 = make_matching(subdomain=SUB_21)
        merged, errors = merge(quiz, [[new_21]])
        assert errors == []
        subs = [subprefix(q["subdomain"]) for q in merged["questions"]]
        assert subs == sorted(subs)

    def test_merge_preserves_top_level_fields(self):
        """mockQuestionCount and every other top-level key survive untouched."""
        quiz = make_quiz()
        merged, errors = merge(quiz, [[make_mcq(subdomain=SUB_12)]])
        assert errors == []
        assert merged["mockQuestionCount"] == 65
        assert merged["domains"] == make_quiz()["domains"]
        assert merged["passingScore"] == 70

    def test_merge_rejects_duplicate_stems(self):
        """A stem already present anywhere blocks the merge."""
        quiz = make_quiz()
        dup = make_mcq(question=quiz["questions"][0]["question"])
        merged, errors = merge(quiz, [[dup]])
        assert merged is None
        assert any("duplicate" in e for e in errors)

    def test_merge_rejects_unknown_subdomain(self):
        """Batch items must map to a declared subdomain."""
        quiz = make_quiz()
        bad = make_mcq(subdomain="9.9 - Not in this quiz's domain table")
        merged, errors = merge(quiz, [[bad]])
        assert merged is None
        assert any("subdomain" in e for e in errors)

    def test_merge_accepts_multiple_batches(self):
        """Several batches merge in the order given."""
        quiz = make_quiz()
        merged, errors = merge(quiz, [[make_mcq(subdomain=SUB_12)], [make_matching(subdomain=SUB_21)]])
        assert errors == []
        assert len(merged["questions"]) == 3

    def test_merge_does_not_mutate_input(self):
        """The caller's quiz dict is not modified in place."""
        quiz = make_quiz()
        before = json.dumps(quiz, sort_keys=True)
        merge(quiz, [[make_mcq(subdomain=SUB_12)]])
        assert json.dumps(quiz, sort_keys=True) == before
        assert len(quiz["questions"]) == 1


class TestMain:
    """CLI contract: 0 written, 2 blocked, atomic output, report on stdout."""

    def test_successful_merge_writes_out(self, tmp_path: Path, quiz: Path):
        """--out writes the merged file and leaves the input quiz alone."""
        batch_path = write_batch(tmp_path, [make_mcq(subdomain=SUB_12)])
        out_path = tmp_path / "merged.json"
        rc = main(["--quiz", str(quiz), "--batch", str(batch_path), "--out", str(out_path)])
        assert rc == 0
        merged = json.loads(out_path.read_text(encoding="utf-8"))
        assert len(merged["questions"]) == 2
        original = json.loads(quiz.read_text(encoding="utf-8"))
        assert len(original["questions"]) == 1

    def test_output_is_pretty_printed_with_newline(self, tmp_path: Path, quiz: Path):
        """Output matches the repo style: indent 2, trailing newline, unicode preserved."""
        batch_path = write_batch(tmp_path, [make_mcq(subdomain=SUB_12)])
        out_path = tmp_path / "merged.json"
        main(["--quiz", str(quiz), "--batch", str(batch_path), "--out", str(out_path)])
        raw = out_path.read_text(encoding="utf-8")
        assert raw.endswith("\n")
        assert not raw.endswith("\n\n")
        json.loads(raw)

    def test_duplicate_blocks_merge(self, tmp_path: Path, quiz: Path, capsys):
        """A duplicate stem exits 2 and names the stem."""
        existing = json.loads(quiz.read_text(encoding="utf-8"))["questions"][0]["question"]
        batch_path = write_batch(tmp_path, [make_mcq(question=existing)])
        out_path = tmp_path / "merged.json"
        rc = main(["--quiz", str(quiz), "--batch", str(batch_path), "--out", str(out_path)])
        assert rc == 2
        assert not out_path.exists()
        captured = capsys.readouterr()
        assert "duplicate" in (captured.out + captured.err).lower()

    def test_report_shows_totals(self, tmp_path: Path, quiz: Path, capsys):
        """The summary prints total, type counter and subdomain histogram."""
        batch_path = write_batch(tmp_path, [make_mcq(subdomain=SUB_12), make_matching(subdomain=SUB_21)])
        out_path = tmp_path / "merged.json"
        rc = main(["--quiz", str(quiz), "--batch", str(batch_path), "--out", str(out_path)])
        assert rc == 0
        captured = capsys.readouterr().out
        assert "written: 3" in captured
        assert "mcq" in captured and "matching" in captured
        assert "1.1" in captured and "1.2" in captured

    def test_dry_run_writes_nothing(self, tmp_path: Path, quiz: Path):
        """--dry-run reports without touching the filesystem."""
        batch_path = write_batch(tmp_path, [make_mcq(subdomain=SUB_12)])
        out_path = tmp_path / "merged.json"
        rc = main(["--quiz", str(quiz), "--batch", str(batch_path), "--out", str(out_path), "--dry-run"])
        assert rc == 0
        assert not out_path.exists()

    def test_missing_batch_exits_two(self, tmp_path: Path, quiz: Path):
        """A missing batch file blocks with exit 2."""
        rc = main(["--quiz", str(quiz), "--batch", str(tmp_path / "absent.json")])
        assert rc == 2

    def test_in_place_merge_when_no_out(self, tmp_path: Path, quiz: Path):
        """Without --out the quiz itself is updated."""
        batch_path = write_batch(tmp_path, [make_mcq(subdomain=SUB_12)])
        rc = main(["--quiz", str(quiz), "--batch", str(batch_path)])
        assert rc == 0
        updated = json.loads(quiz.read_text(encoding="utf-8"))
        assert len(updated["questions"]) == 2
        assert updated["mockQuestionCount"] == 65
