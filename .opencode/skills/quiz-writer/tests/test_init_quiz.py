#!/usr/bin/env python3
"""Tests for init_quiz.py - the new-quiz bootstrap of the quiz-writer skill."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from init_quiz import build, main

CANONICAL_ORDER = [
    "id", "slug", "kind", "category", "title", "description", "difficulty", "topic",
    "certification", "durationSeconds", "passingScore", "mockQuestionCount",
    "domains", "allocations", "questions",
]


def make_spec() -> dict:
    """A four-domain spec mirroring a certification blueprint at miniature scale."""
    return {
        "id": "aws-test-c99",
        "kind": "certification",
        "category": "cloud-computing",
        "title": "Test Cloud Exam (TEST-C99)",
        "description": "Exam-style questions for the fictional TEST-C99 certification exam.",
        "difficulty": "beginner",
        "topic": "AWS",
        "certification": "AWS Certified Test Exam (TEST-C99)",
        "durationSeconds": 5400,
        "passingScore": 70,
        "mockQuestionCount": 65,
        "total": 16,
        "domains": [
            {
                "id": "1.0", "name": "1.0 Cloud Concepts", "color": "blue", "percent": 40,
                "subdomains": [
                    {"prefix": "1.1", "title": "Benefits of the cloud", "count": 5},
                    {"prefix": "1.2", "title": "Cloud economics", "count": 3},
                ],
            },
            {
                "id": "2.0", "name": "2.0 Security", "color": "purple", "percent": 60,
                "subdomains": [
                    {"prefix": "2.1", "title": "Shared responsibility", "count": 4},
                    {"prefix": "2.2", "title": "Access management", "count": 4},
                ],
            },
        ],
    }


class TestBuild:
    """Skeleton construction and the arithmetic it owns."""

    def test_identity_is_triple_locked(self):
        """id, slug and the output filename stem are the same string."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert skeleton["id"] == skeleton["slug"] == "aws-test-c99"

    def test_questions_start_empty(self):
        """The skeleton ships with an empty bank for the first batch to fill."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert skeleton["questions"] == []

    def test_top_level_key_order_is_canonical(self):
        """Field order mirrors the established quiz files exactly."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert list(skeleton.keys()) == CANONICAL_ORDER

    def test_subdomain_strings_assembled(self):
        """'1.1' plus a title becomes the repo-convention subdomain string."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert skeleton["domains"][0]["subdomains"] == [
            "1.1 - Benefits of the cloud",
            "1.2 - Cloud economics",
        ]

    def test_domain_key_order(self):
        """Domains carry id, name, color, subdomains - nothing else."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert list(skeleton["domains"][0].keys()) == ["id", "name", "color", "subdomains"]

    def test_allocations_sum_to_100(self):
        """The official validator's hardest constraint, satisfied by construction."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert sum(skeleton["allocations"].values()) == 100

    def test_allocations_domain_sums_match_percents(self):
        """Each domain's allocations add up to its official blueprint weight."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        domain_one = [k for k in skeleton["allocations"] if k.startswith("1.")]
        domain_two = [k for k in skeleton["allocations"] if k.startswith("2.")]
        assert sum(skeleton["allocations"][k] for k in domain_one) == 40
        assert sum(skeleton["allocations"][k] for k in domain_two) == 60

    def test_allocations_all_positive(self):
        """No subdomain may be allocated zero percent."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert all(v > 0 for v in skeleton["allocations"].values())

    def test_allocations_keys_match_subdomains(self):
        """allocations keys are exactly the declared subdomain strings, in order."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        subs = [s for d in skeleton["domains"] for s in d["subdomains"]]
        assert list(skeleton["allocations"]) == subs

    def test_metadata_copied_through(self):
        """Exam logistics survive untouched."""
        skeleton = build(make_spec(), stem="aws-test-c99")
        assert skeleton["durationSeconds"] == 5400
        assert skeleton["passingScore"] == 70
        assert skeleton["mockQuestionCount"] == 65
        assert skeleton["difficulty"] == "beginner"
        assert skeleton["kind"] == "certification"

    def test_counts_total_checked(self):
        """When the spec declares a total, the per-subdomain counts must hit it."""
        spec = make_spec()
        spec["total"] = 17
        with pytest.raises(ValueError, match="sum"):
            build(spec, stem="aws-test-c99")

    def test_percent_sum_checked(self):
        """Domain weights that do not add to 100 are refused."""
        spec = make_spec()
        spec["domains"][1]["percent"] = 30
        with pytest.raises(ValueError, match="100"):
            build(spec, stem="aws-test-c99")

    def test_stem_mismatch_checked(self):
        """Writing aws-other.json for id aws-test-c99 would break the hook validator."""
        with pytest.raises(ValueError, match="stem"):
            build(make_spec(), stem="aws-other")

    def test_invalid_kind_refused(self):
        spec = make_spec()
        spec["kind"] = "quizlet"
        with pytest.raises(ValueError, match="kind"):
            build(spec, stem="aws-test-c99")

    def test_invalid_difficulty_refused(self):
        spec = make_spec()
        spec["difficulty"] = "expert"
        with pytest.raises(ValueError, match="difficulty"):
            build(spec, stem="aws-test-c99")

    def test_missing_field_refused(self):
        spec = make_spec()
        del spec["certification"]
        with pytest.raises(ValueError, match="certification"):
            build(spec, stem="aws-test-c99")

    def test_impossible_allocation_refused(self):
        """A weight too small for the number of subdomains would round someone to zero."""
        spec = make_spec()
        spec["domains"][0]["percent"] = 1
        spec["domains"][1]["percent"] = 99
        with pytest.raises(ValueError):
            build(spec, stem="aws-test-c99")

    def test_deterministic(self):
        """The same spec always yields byte-identical structure."""
        a = build(make_spec(), stem="aws-test-c99")
        b = build(make_spec(), stem="aws-test-c99")
        assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)


class TestMain:
    """CLI contract: 0 written, 2 blocked; no silent overwrite."""

    def write_spec(self, tmp_path: Path) -> Path:
        path = tmp_path / "spec.json"
        path.write_text(json.dumps(make_spec()), encoding="utf-8")
        return path

    def test_writes_skeleton(self, tmp_path: Path, capsys):
        spec_path = self.write_spec(tmp_path)
        out_path = tmp_path / "aws-test-c99.json"
        rc = main(["--spec", str(spec_path), "--out", str(out_path)])
        assert rc == 0
        data = json.loads(out_path.read_text(encoding="utf-8"))
        assert data["questions"] == []
        assert out_path.read_text(encoding="utf-8").endswith("\n")
        assert "100" in capsys.readouterr().out

    def test_refuses_overwrite(self, tmp_path: Path):
        spec_path = self.write_spec(tmp_path)
        out_path = tmp_path / "aws-test-c99.json"
        assert main(["--spec", str(spec_path), "--out", str(out_path)]) == 0
        assert main(["--spec", str(spec_path), "--out", str(out_path)]) == 2
        assert main(["--spec", str(spec_path), "--out", str(out_path), "--force"]) == 0

    def test_missing_spec_exits_two(self, tmp_path: Path):
        rc = main(["--spec", str(tmp_path / "nope.json"), "--out", str(tmp_path / "x.json")])
        assert rc == 2

    def test_wrong_stem_exits_two(self, tmp_path: Path):
        spec_path = self.write_spec(tmp_path)
        rc = main(["--spec", str(spec_path), "--out", str(tmp_path / "wrong-name.json")])
        assert rc == 2
        assert not (tmp_path / "wrong-name.json").exists()

    def test_invalid_spec_exits_two(self, tmp_path: Path):
        spec_path = self.write_spec(tmp_path)
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
        spec["id"] = "has spaces and CAPITALS"
        spec_path.write_text(json.dumps(spec), encoding="utf-8")
        rc = main(["--spec", str(spec_path), "--out", str(tmp_path / "bad.json")])
        assert rc == 2
