#!/usr/bin/env python3
"""Tests for build_grid.py - deterministic quota-grid construction for the quiz-writer skill."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from build_grid import allocate, build_grid, main, slice_batches, type_totals

SUBS = [
    "1.1 - Benefits of the AWS Cloud",
    "1.2 - Design principles of the AWS Cloud",
    "2.1 - Shared responsibility model",
    "2.2 - Security, governance, compliance concepts",
]

MIX = {"mcq": 0.50, "multi": 0.20, "ordering": 0.15, "matching": 0.15}


def make_spec() -> dict:
    """Small spec whose arithmetic is easy to reason about: 15 items over four subdomains."""
    return {
        "total": 15,
        "subdomains": SUBS,
        "counts": {"1.1": 5, "1.2": 4, "2.1": 3, "2.2": 3},
        "type_mix": MIX,
        "batches": [
            {"name": "b1", "subdomains": ["1.1", "1.2"]},
            {"name": "b2", "subdomains": ["2.1", "2.2"]},
        ],
    }


class TestTypeTotals:
    """Type totals from a mix: exact largest-remainder distribution."""

    def test_half_of_130_is_exact(self):
        """130 items at 50/20/15/15 splits the .5 tie by canonical type order."""
        totals = type_totals(MIX, 130)
        assert totals == {"mcq": 65, "multi": 26, "ordering": 20, "matching": 19}

    def test_totals_sum_to_total(self):
        """Whatever the mix, the parts always sum to the requested total."""
        for total in (1, 7, 49, 130, 500):
            assert sum(type_totals(MIX, total).values()) == total

    def test_explicit_counts_win(self):
        """type_counts bypasses the mix when the plan already fixed the integers."""
        from build_grid import type_totals as tt

        totals = tt({"mcq": 60, "multi": 30, "ordering": 20, "matching": 20}, 130, counts=True)
        assert totals == {"mcq": 60, "multi": 30, "ordering": 20, "matching": 20}

    def test_bad_mix_sum_rejected(self):
        """A mix that does not add up to 1 is a plan error, not a rounding problem."""
        with pytest.raises(ValueError, match="mix"):
            type_totals({"mcq": 0.5, "multi": 0.1}, 100)

    def test_counts_sum_mismatch_rejected(self):
        """Explicit type counts must sum to the total."""
        with pytest.raises(ValueError, match="sum"):
            type_totals({"mcq": 10, "multi": 10}, 30, counts=True)

    def test_zero_total_rejected(self):
        """A zero total means there is nothing to plan."""
        with pytest.raises(ValueError):
            type_totals(MIX, 0)


class TestAllocate:
    """Subdomain x type cell allocation with exact marginals."""

    def test_subdomain_totals_match_counts(self):
        """Every subdomain receives exactly its planned item count."""
        grid = allocate(make_spec()["counts"], type_totals(MIX, 15), {})
        for prefix, count in make_spec()["counts"].items():
            got = sum(v for k, v in grid.items() if k.split(":")[0] == prefix)
            assert got == count, prefix

    def test_type_totals_match(self):
        """Every type receives exactly its planned global total."""
        totals = type_totals(MIX, 15)
        grid = allocate(make_spec()["counts"], totals, {})
        for qtype, want in totals.items():
            got = sum(v for k, v in grid.items() if k.split(":")[1] == qtype)
            assert got == want, qtype

    def test_no_zero_cells_emitted(self):
        """Zero-count cells are omitted so the batch gate reports 'not in the plan'."""
        grid = allocate(make_spec()["counts"], type_totals(MIX, 15), {})
        assert all(v > 0 for v in grid.values())

    def test_constraints_honored(self):
        """A constrained cell lands exactly at its fixed value."""
        counts = {"1.1": 5, "1.2": 4, "2.1": 3, "2.2": 3}
        totals = {"mcq": 8, "multi": 7}
        grid = allocate(counts, totals, {"2.1:multi": 3})
        assert grid["2.1:multi"] == 3
        assert sum(v for k, v in grid.items() if k.endswith(":multi")) == 7

    def test_constraint_beyond_capacity_rejected(self):
        """A constraint larger than the subdomain's own count cannot hold."""
        counts = {"1.1": 5}
        with pytest.raises(ValueError, match="constraint"):
            allocate(counts, {"mcq": 3, "multi": 2}, {"1.1:multi": 6})

    def test_unknown_constraint_type_rejected(self):
        """A constraint naming a type outside the plan is a spec error."""
        with pytest.raises(ValueError):
            allocate({"1.1": 5}, {"mcq": 5}, {"1.1:tf": 1})

    def test_type_exceeding_capacity_rejected(self):
        """No type may be planned for more items than exist."""
        with pytest.raises(ValueError):
            allocate({"1.1": 5, "1.2": 5}, {"mcq": 11, "multi": 9}, {})

    def test_deterministic(self):
        """The same plan always yields the same grid."""
        totals = type_totals(MIX, 15)
        a = allocate(make_spec()["counts"], totals, {})
        b = allocate(make_spec()["counts"], totals, {})
        assert a == b


class TestBuildGrid:
    """Full spec handling: prefix validation, totals, batch slicing."""

    def test_spec_round_trip(self):
        """build_grid returns a flat prefix:type grid matching the spec counts."""
        grid = build_grid(make_spec())
        for prefix, count in make_spec()["counts"].items():
            got = sum(v for k, v in grid.items() if k.split(":")[0] == prefix)
            assert got == count

    def test_counts_sum_mismatch_rejected(self):
        """Counts that do not add up to the spec total are refused."""
        spec = make_spec()
        spec["counts"]["1.1"] = 6
        with pytest.raises(ValueError, match="sum"):
            build_grid(spec)

    def test_unknown_prefix_rejected(self):
        """A count for a subdomain that the spec never declares is refused."""
        spec = make_spec()
        spec["counts"] = {"1.1": 5, "1.2": 4, "2.1": 3, "9.9": 3}
        with pytest.raises(ValueError, match="prefix"):
            build_grid(spec)

    def test_missing_subdomain_count_rejected(self):
        """Every declared subdomain must carry a count."""
        spec = make_spec()
        del spec["counts"]["2.2"]
        with pytest.raises(ValueError):
            build_grid(spec)

    def test_duplicate_prefix_rejected(self):
        """Two subdomains sharing a prefix would collide in the grid keys."""
        spec = make_spec()
        spec["subdomains"] = [*SUBS, "1.1 - A second claim on the same prefix"]
        spec["counts"] = {"1.1": 4, "1.2": 4, "2.1": 3, "2.2": 3, "1.1b": 1}
        spec["total"] = 15
        with pytest.raises(ValueError):
            build_grid(spec)

    def test_batch_slices_partition_the_grid(self):
        """Slices together cover every cell exactly once."""
        spec = make_spec()
        grid = build_grid(spec)
        slices = slice_batches(grid, spec["batches"])
        merged: dict = {}
        for name, cells in slices.items():
            for key, value in cells.items():
                assert key not in merged, f"cell {key} claimed by two batches ({name})"
                merged[key] = value
        assert merged == grid

    def test_batch_slice_counts(self):
        """A slice carries only its own subdomains' cells."""
        spec = make_spec()
        slices = slice_batches(build_grid(spec), spec["batches"])
        assert set(slices["b1"]) <= {"1.1:mcq", "1.1:multi", "1.1:ordering", "1.1:matching",
                                     "1.2:mcq", "1.2:multi", "1.2:ordering", "1.2:matching"}
        assert sum(slices["b1"].values()) == 9  # 5 + 4

    def test_batches_must_cover_every_subdomain(self):
        """An unbatched subdomain would silently never be authored."""
        spec = make_spec()
        spec["batches"] = [{"name": "b1", "subdomains": ["1.1", "1.2"]}]
        with pytest.raises(ValueError, match="batch"):
            build_grid(spec)

    def test_batches_may_not_overlap(self):
        """A subdomain in two batches would be double-authored."""
        spec = make_spec()
        spec["batches"] = [
            {"name": "b1", "subdomains": ["1.1", "1.2", "2.1"]},
            {"name": "b2", "subdomains": ["2.1", "2.2"]},
        ]
        with pytest.raises(ValueError):
            build_grid(spec)

    def test_unknown_batch_prefix_rejected(self):
        """Batch groups may only reference declared subdomains."""
        spec = make_spec()
        spec["batches"] = [
            {"name": "b1", "subdomains": ["1.1", "1.2"]},
            {"name": "b2", "subdomains": ["2.1", "7.7"]},
        ]
        with pytest.raises(ValueError):
            build_grid(spec)

    def test_domains_shape_supported(self):
        """The init_quiz spec shape (domains[].subdomains[]) drives build_grid too."""
        spec = make_spec()
        del spec["subdomains"]
        del spec["counts"]
        spec["domains"] = [
            {"id": "1.0", "percent": 60, "subdomains": [
                {"prefix": "1.1", "title": "Benefits of the AWS Cloud", "count": 5},
                {"prefix": "1.2", "title": "Design principles of the AWS Cloud", "count": 4},
            ]},
            {"id": "2.0", "percent": 40, "subdomains": [
                {"prefix": "2.1", "title": "Shared responsibility model", "count": 3},
                {"prefix": "2.2", "title": "Security, governance, compliance concepts", "count": 3},
            ]},
        ]
        grid = build_grid(spec)
        assert sum(grid.values()) == 15
        assert sum(v for k, v in grid.items() if k.startswith("1.1:")) == 5
        assert sum(v for k, v in grid.items() if k.startswith("2.2:")) == 3


class TestMain:
    """CLI contract: 0 written, 2 blocked; grid and per-batch slice files."""

    def write_spec(self, tmp_path: Path) -> Path:
        path = tmp_path / "spec.json"
        path.write_text(json.dumps(make_spec()), encoding="utf-8")
        return path

    def test_writes_grid(self, tmp_path: Path):
        spec_path = self.write_spec(tmp_path)
        out_path = tmp_path / "grid.json"
        rc = main(["--spec", str(spec_path), "--out", str(out_path)])
        assert rc == 0
        assert json.loads(out_path.read_text(encoding="utf-8")) == build_grid(make_spec())

    def test_writes_batch_slices(self, tmp_path: Path):
        spec_path = self.write_spec(tmp_path)
        batches_dir = tmp_path / "batches"
        rc = main(["--spec", str(spec_path), "--batches-dir", str(batches_dir)])
        assert rc == 0
        assert json.loads((batches_dir / "grid-b1.json").read_text(encoding="utf-8")) == {
            k: v for k, v in build_grid(make_spec()).items() if k.startswith(("1.1:", "1.2:"))
        }
        assert (batches_dir / "grid-b2.json").is_file()

    def test_needs_an_output(self, tmp_path: Path):
        """With neither --out nor --batches-dir the run would do nothing."""
        spec_path = self.write_spec(tmp_path)
        assert main(["--spec", str(spec_path)]) == 2

    def test_missing_spec_exits_two(self, tmp_path: Path):
        assert main(["--spec", str(tmp_path / "nope.json"), "--out", str(tmp_path / "g.json")]) == 2

    def test_invalid_spec_exits_two(self, tmp_path: Path):
        bad = tmp_path / "bad.json"
        bad.write_text(json.dumps({"total": 10, "subdomains": [], "counts": {}, "type_mix": MIX}),
                       encoding="utf-8")
        rc = main(["--spec", str(bad), "--out", str(tmp_path / "g.json")])
        assert rc == 2
        assert not (tmp_path / "g.json").exists()

    def test_summary_printed(self, tmp_path: Path, capsys):
        spec_path = self.write_spec(tmp_path)
        rc = main(["--spec", str(spec_path), "--out", str(tmp_path / "g.json")])
        captured = capsys.readouterr().out
        assert rc == 0
        assert "15" in captured and "mcq" in captured
