#!/usr/bin/env python3
"""Deterministic quota-grid construction for quiz question planning (quiz-writer skill).

Turns a spec of per-subdomain item counts plus a global type mix into a flat
{"<subdomain>:<type>": count} grid, optionally sliced into per-batch grid files.

Exit contract: 0 = written, 2 = blocking failure. Never exits 1.
"""
import argparse
import json
import sys
from pathlib import Path

TYPE_ORDER = ("mcq", "multi", "ordering", "matching")
EPS = 1e-9


def load_json(path: str) -> object:
    """Read a JSON file or raise with a readable message."""
    file_path = Path(path)
    if not file_path.is_file():
        raise FileNotFoundError(f"no such file: {path}")
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON in {path}: {exc}") from exc


def largest_remainder(weights: dict, total: int) -> dict:
    """Distribute `total` across weighted keys exactly; ties break by key order."""
    keys = list(weights)
    weight_sum = sum(weights[k] for k in keys)
    if total < 0 or weight_sum <= 0:
        raise ValueError(f"cannot distribute total {total} over weights {weights}")
    exact = []
    for key in keys:
        value = weights[key] / weight_sum * total
        exact.append((key, int(value), value - int(value)))
    result = {key: floor for key, floor, _ in exact}
    leftovers = total - sum(result.values())
    by_remainder = sorted(exact, key=lambda entry: (-entry[2], keys.index(entry[0])))
    for i in range(leftovers):
        result[by_remainder[i % len(by_remainder)][0]] += 1
    return result


def type_totals(mix: dict, total: int, counts: bool = False) -> dict:
    """Resolve the global type totals from integer counts or a share mix.

    With counts=True the mix values are absolute item counts (must sum to total);
    otherwise they are shares (must sum to 1.0) resolved by largest remainder.
    """
    if not mix:
        raise ValueError("type plan is empty")
    if not isinstance(total, int) or total <= 0:
        raise ValueError(f"total must be a positive integer, got {total!r}")
    if counts:
        if any(not isinstance(v, int) or v < 0 for v in mix.values()):
            raise ValueError(f"type counts must be non-negative integers, got {mix}")
        if sum(mix.values()) != total:
            raise ValueError(f"type counts sum {sum(mix.values())} != total {total}")
        return dict(mix)
    if abs(sum(mix.values()) - 1.0) > EPS:
        raise ValueError(f"type mix must sum to 1.0, got {sum(mix.values())}")
    ordered = {k: mix[k] for k in TYPE_ORDER if k in mix}
    ordered.update({k: mix[k] for k in mix if k not in ordered})
    return largest_remainder(ordered, total)


def allocate(counts: dict, totals: dict, constraints: dict) -> dict:
    """Fill a subdomain x type grid with exact marginals.

    Each type's global total is distributed across subdomains proportionally to
    their *remaining* capacity, in canonical type order, largest-remainder with
    index tie-break. Fixed cells (constraints) are honoured first.
    """
    counts = dict(counts)
    totals = dict(totals)
    order = [t for t in TYPE_ORDER if t in totals] + [t for t in totals if t not in TYPE_ORDER]
    if not order or not counts:
        raise ValueError("counts and type totals must both be non-empty")
    if sum(counts.values()) != sum(totals.values()):
        raise ValueError(f"counts sum {sum(counts.values())} != type totals sum {sum(totals.values())}")

    cells: dict = {}
    remaining_type = dict(totals)
    remaining_cap = dict(counts)
    for key, value in (constraints or {}).items():
        prefix, sep, qtype = key.partition(":")
        if not sep or prefix not in counts or qtype not in totals:
            raise ValueError(f"constraint {key!r} names an unknown subdomain or type")
        if not isinstance(value, int) or value < 0:
            raise ValueError(f"constraint {key!r} must be a non-negative integer")
        if value > counts[prefix]:
            raise ValueError(f"constraint {key!r} ({value}) exceeds the subdomain count {counts[prefix]}")
        cells[key] = value
        remaining_type[qtype] -= value
        remaining_cap[prefix] -= value
        if remaining_type[qtype] < 0:
            raise ValueError(f"constraints overfill type {qtype}")

    prefixes = list(counts)
    for qtype in order[:-1]:
        need = remaining_type[qtype]
        if need == 0:
            continue
        capacity = sum(remaining_cap.values())
        if need > capacity:
            raise ValueError(f"type {qtype} needs {need} items but only {capacity} slots remain")
        shares = []
        for prefix in prefixes:
            exact = need * remaining_cap[prefix] / capacity if capacity else 0.0
            shares.append((prefix, int(exact), exact - int(exact)))
        assignment = {p: floor for p, floor, _ in shares}
        for prefix, floor in assignment.items():
            if floor > remaining_cap[prefix]:  # defensive clamp; exact math prevents this
                assignment[prefix] = remaining_cap[prefix]
        assigned = sum(assignment.values())
        by_remainder = sorted(shares, key=lambda entry: (-entry[2], prefixes.index(entry[0])))
        i = 0
        while assigned < need:
            prefix = by_remainder[i % len(by_remainder)][0]
            if assignment[prefix] < remaining_cap[prefix]:
                assignment[prefix] += 1
                assigned += 1
            i += 1
            if i > 4 * len(prefixes) + need:
                raise ValueError(f"could not place all {need} {qtype} items")
        for prefix, value in assignment.items():
            if value:
                cells[f"{prefix}:{qtype}"] = cells.get(f"{prefix}:{qtype}", 0) + value
            remaining_cap[prefix] -= value
        remaining_type[qtype] = 0

    last = order[-1]
    leftover = remaining_type[last]
    placed = sum(remaining_cap.values())
    if placed != leftover:
        raise ValueError(
            f"last type {last} expects {leftover} items but {placed} slots remain; "
            "the plan is over- or under-constrained"
        )
    for prefix in prefixes:
        if remaining_cap[prefix]:
            key = f"{prefix}:{last}"
            cells[key] = cells.get(key, 0) + remaining_cap[prefix]
    return {k: v for k, v in cells.items() if v > 0}


def _counts_from_domains(spec: dict) -> tuple:
    """Flatten the init_quiz spec shape (domains[].subdomains[]) to subdomains + counts."""
    subdomains = []
    counts: dict = {}
    for i, domain in enumerate(spec["domains"]):
        if not isinstance(domain, dict) or not isinstance(domain.get("subdomains"), list):
            raise ValueError(f"domain {i}: must be an object with a subdomains list")
        for entry in domain["subdomains"]:
            if not isinstance(entry, dict) or "prefix" not in entry or "title" not in entry:
                raise ValueError(f"domain {i}: every subdomain needs a prefix and a title")
            prefix = entry["prefix"]
            count = entry.get("count")
            if not isinstance(count, int) or isinstance(count, bool) or count <= 0:
                raise ValueError(f"domain {i} subdomain {prefix}: count must be a positive integer")
            subdomains.append(f"{prefix} - {entry['title']}")
            counts[prefix] = count
    return subdomains, counts


def _resolve_counts(spec: dict) -> dict:
    """Validate the spec's subdomains and counts against each other.

    Accepts either the init_quiz spec shape (domains[].subdomains[] with counts) or the
    flat shape (subdomains[] + counts{}) so one spec file drives the whole Phase 0.
    """
    if isinstance(spec.get("domains"), list) and spec["domains"]:
        subdomains, counts = _counts_from_domains(spec)
    else:
        subdomains = spec.get("subdomains")
        counts = spec.get("counts")
    if not isinstance(subdomains, list) or not subdomains:
        raise ValueError("spec.subdomains must be a non-empty list (or use spec.domains)")
    if not isinstance(counts, dict) or not counts:
        raise ValueError("spec.counts must be a non-empty object")
    prefixes = {}
    for subdomain in subdomains:
        if not isinstance(subdomain, str) or " - " not in subdomain:
            raise ValueError(f"subdomain {subdomain!r} must have the form '1.1 - Title'")
        prefix = subdomain.split(" - ", 1)[0]
        if prefix in prefixes:
            raise ValueError(f"duplicate subdomain prefix {prefix!r}")
        prefixes[prefix] = subdomain
    unknown = [k for k in counts if k not in prefixes]
    if unknown:
        raise ValueError(f"counts reference unknown prefixes {unknown}")
    missing = [k for k in prefixes if k not in counts]
    if missing:
        raise ValueError(f"counts missing for declared subdomains {missing}")
    total = spec.get("total")
    if not isinstance(total, int) or total <= 0:
        raise ValueError("spec.total must be a positive integer")
    if any(not isinstance(v, int) or v <= 0 for v in counts.values()):
        raise ValueError("every subdomain count must be a positive integer")
    if sum(counts.values()) != total:
        raise ValueError(f"counts sum {sum(counts.values())} != total {total}")
    return counts


def _type_plan(spec: dict) -> dict:
    """Resolve the type totals from type_counts or type_mix."""
    total = spec["total"]
    if "type_counts" in spec:
        return type_totals(spec["type_counts"], total, counts=True)
    if "type_mix" in spec:
        return type_totals(spec["type_mix"], total)
    raise ValueError("spec needs type_mix or type_counts")


def build_grid(spec: dict) -> dict:
    """Full spec -> flat {'prefix:type': count} grid (zero cells omitted).

    When the spec carries a batch plan, the batches are validated as part of the
    build so a broken plan fails even when only --out was requested.
    """
    counts = _resolve_counts(spec)
    totals = _type_plan(spec)
    if sum(totals.values()) != sum(counts.values()):
        raise ValueError(
            f"type totals sum {sum(totals.values())} != counts sum {sum(counts.values())}"
        )
    grid = allocate(counts, totals, spec.get("constraints") or {})
    if spec.get("batches"):
        slice_batches(grid, spec["batches"])
    return grid


def slice_batches(grid: dict, batches: list) -> dict:
    """Split the grid into per-batch slices; batches must partition the subdomains."""
    if not isinstance(batches, list) or not batches:
        raise ValueError("spec.batches must be a non-empty list")
    claimed: dict = {}
    slices: dict = {}
    for batch in batches:
        if not isinstance(batch, dict) or not batch.get("name") or not isinstance(batch.get("subdomains"), list):
            raise ValueError("every batch needs a name and a subdomains list")
        name = batch["name"]
        if name in slices:
            raise ValueError(f"duplicate batch name {name!r}")
        cells: dict = {}
        for prefix in batch["subdomains"]:
            if prefix in claimed:
                raise ValueError(f"subdomain {prefix!r} appears in batches {claimed[prefix]!r} and {name!r}")
            claimed[prefix] = name
            for key, value in grid.items():
                if key.split(":", 1)[0] == prefix:
                    cells[key] = value
        if not cells:
            raise ValueError(f"batch {name!r} claims subdomains with no planned items")
        slices[name] = cells
    missing = sorted({k.split(":", 1)[0] for k in grid} - set(claimed))
    if missing:
        raise ValueError(f"subdomains {missing} are not covered by any batch")
    unknown = sorted(set(claimed) - {k.split(":", 1)[0] for k in grid})
    if unknown:
        raise ValueError(f"batches claim subdomains with no grid cells: {unknown}")
    return slices


def build_parser() -> argparse.ArgumentParser:
    """CLI definition for the grid builder."""
    parser = argparse.ArgumentParser(
        prog="build_grid", description="Build a subdomain x type quota grid from a spec."
    )
    parser.add_argument("--spec", required=True, help="spec JSON with subdomains, counts, type plan, batches")
    parser.add_argument("--out", help="write the full grid here")
    parser.add_argument("--batches-dir", help="write one grid-<name>.json slice per batch here")
    return parser


def main(argv=None) -> int:
    """Entry point: 0 written, 2 blocked."""
    args = build_parser().parse_args(argv)
    if not args.out and not args.batches_dir:
        print("ERR: provide --out and/or --batches-dir", file=sys.stderr)
        return 2
    try:
        spec = load_json(args.spec)
        if not isinstance(spec, dict):
            raise ValueError("spec must be a JSON object")
        grid = build_grid(spec)
        slices = slice_batches(grid, spec.get("batches")) if args.batches_dir else {}
    except (OSError, ValueError) as exc:
        print(f"ERR: {exc}", file=sys.stderr)
        print("build-grid: FAIL", file=sys.stderr)
        return 2

    if args.out:
        Path(args.out).write_text(json.dumps(grid, indent=2) + "\n", encoding="utf-8")
    if args.batches_dir:
        out_dir = Path(args.batches_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        for name, cells in slices.items():
            (out_dir / f"grid-{name}.json").write_text(json.dumps(cells, indent=2) + "\n", encoding="utf-8")

    by_type: dict = {}
    by_prefix: dict = {}
    for key, value in grid.items():
        prefix, qtype = key.split(":", 1)
        by_type[qtype] = by_type.get(qtype, 0) + value
        by_prefix[prefix] = by_prefix.get(prefix, 0) + value
    print(f"build-grid: PASS ({sum(grid.values())} items, {len(grid)} cells)")
    print("  types:", {t: by_type.get(t, 0) for t in TYPE_ORDER if t in by_type})
    print("  subdomains:", dict(sorted(by_prefix.items())))
    if slices:
        print("  batches:", {name: sum(cells.values()) for name, cells in slices.items()})
    return 0


if __name__ == "__main__":
    sys.exit(main())
