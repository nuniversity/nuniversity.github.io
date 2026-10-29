#!/usr/bin/env python3
"""New-quiz bootstrap: spec JSON -> validated skeleton quiz file (quiz-writer skill).

Assembles the subdomain strings, computes the allocations (official domain
weights split across subdomains by largest remainder, summing to exactly 100)
and writes the canonical skeleton with an empty question bank.

Note: the official hook validator requires a non-empty questions array, so the
skeleton is validated by this script and verify_quiz until the first batch merges.

Exit contract: 0 = written, 2 = blocking failure. Never exits 1.
"""
import argparse
import json
import re
import sys
from pathlib import Path

from build_grid import largest_remainder

ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
VALID_KINDS = {"certification", "practice", "course-exam"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
REQUIRED_SPEC_FIELDS = (
    "id", "kind", "category", "title", "description", "difficulty", "topic",
    "certification", "durationSeconds", "passingScore", "mockQuestionCount", "domains",
)
CANONICAL_ORDER = (
    "id", "slug", "kind", "category", "title", "description", "difficulty", "topic",
    "certification", "durationSeconds", "passingScore", "mockQuestionCount",
    "domains", "allocations", "questions",
)


def load_json(path: str) -> object:
    """Read a JSON file or raise with a readable message."""
    file_path = Path(path)
    if not file_path.is_file():
        raise FileNotFoundError(f"no such file: {path}")
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON in {path}: {exc}") from exc


def _check_meta(spec: dict, stem: str) -> None:
    """Validate identity, enums and exam logistics before any assembly."""
    for field in REQUIRED_SPEC_FIELDS:
        if field not in spec or spec[field] is None:
            raise ValueError(f"spec is missing required field: {field}")
    quiz_id = spec["id"]
    if not isinstance(quiz_id, str) or not ID_PATTERN.match(quiz_id):
        raise ValueError(f"id {quiz_id!r} must be kebab-case (e.g. 'aws-clf-c02')")
    if quiz_id != stem:
        raise ValueError(f"id {quiz_id!r} must match output filename stem {stem!r}")
    if spec["kind"] not in VALID_KINDS:
        raise ValueError(f"invalid kind {spec['kind']!r}; expected one of {sorted(VALID_KINDS)}")
    if spec["difficulty"] not in VALID_DIFFICULTIES:
        raise ValueError(
            f"invalid difficulty {spec['difficulty']!r}; expected one of {sorted(VALID_DIFFICULTIES)}"
        )
    for field in ("durationSeconds", "passingScore", "mockQuestionCount"):
        value = spec[field]
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            raise ValueError(f"{field} must be a positive integer, got {value!r}")
    if not 0 < spec["passingScore"] <= 100:
        raise ValueError(f"passingScore must be in (0, 100], got {spec['passingScore']}")
    for field in ("category", "title", "description", "topic", "certification"):
        value = spec[field]
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{field} must be a non-empty string")


def _parse_domains(spec: dict) -> tuple:
    """Validate the domain blueprint; returns (domains, allocations)."""
    domains = spec["domains"]
    if not isinstance(domains, list) or not domains:
        raise ValueError("spec.domains must be a non-empty list")
    allocations: dict = {}
    seen_prefixes: set = set()
    percent_total = 0
    count_total = 0
    out_domains = []
    for i, domain in enumerate(domains):
        if not isinstance(domain, dict):
            raise ValueError(f"domain {i}: must be an object")
        for field in ("id", "name", "color", "percent", "subdomains"):
            if field not in domain or domain[field] is None:
                raise ValueError(f"domain {i}: missing {field!r}")
        percent = domain["percent"]
        if not isinstance(percent, int) or isinstance(percent, bool) or percent <= 0:
            raise ValueError(f"domain {i}: percent must be a positive integer, got {percent!r}")
        percent_total += percent
        entries = domain["subdomains"]
        if not isinstance(entries, list) or not entries:
            raise ValueError(f"domain {i}: subdomains must be a non-empty list")
        full_strings = []
        weights = []
        for entry in entries:
            if not isinstance(entry, dict):
                raise ValueError(f"domain {i}: every subdomain needs a prefix, title and count")
            for field in ("prefix", "title", "count"):
                if field not in entry or entry[field] is None:
                    raise ValueError(f"domain {i}: subdomain missing {field!r}")
            prefix = entry["prefix"]
            if not isinstance(prefix, str) or not prefix.strip():
                raise ValueError(f"domain {i}: prefix must be a non-empty string")
            if prefix in seen_prefixes:
                raise ValueError(f"duplicate subdomain prefix {prefix!r}")
            seen_prefixes.add(prefix)
            count = entry["count"]
            if not isinstance(count, int) or isinstance(count, bool) or count <= 0:
                raise ValueError(f"domain {i} subdomain {prefix}: count must be a positive integer")
            count_total += count
            weights.append(count)
            full_strings.append(f"{prefix} - {entry['title']}")
        positional = largest_remainder({str(n): w for n, w in enumerate(weights)}, percent)
        values = [positional[str(n)] for n in range(len(weights))]
        if min(values) < 1:
            raise ValueError(
                f"domain {i}: percent {percent} rounds a subdomain to zero across {len(weights)} subdomains"
            )
        for full, value in zip(full_strings, values, strict=True):
            if full in allocations:
                raise ValueError(f"duplicate subdomain string {full!r}")
            allocations[full] = value
        out_domains.append({
            "id": domain["id"],
            "name": domain["name"],
            "color": domain["color"],
            "subdomains": full_strings,
        })
    if percent_total != 100:
        raise ValueError(f"domain percents must sum to 100, got {percent_total}")
    if "total" in spec and spec["total"] is not None:
        if not isinstance(spec["total"], int) or count_total != spec["total"]:
            raise ValueError(f"subdomain counts sum {count_total} != total {spec.get('total')}")
    return out_domains, allocations


def build(spec: dict, stem: str) -> dict:
    """Validate the spec and assemble the skeleton quiz document."""
    if not isinstance(spec, dict):
        raise ValueError("spec must be a JSON object")
    _check_meta(spec, stem)
    domains, allocations = _parse_domains(spec)
    if sum(allocations.values()) != 100:  # defensive; per-domain splits guarantee this
        raise ValueError(f"allocations must sum to 100, got {sum(allocations.values())}")
    skeleton = {
        "id": spec["id"],
        "slug": spec["id"],
        "kind": spec["kind"],
        "category": spec["category"],
        "title": spec["title"],
        "description": spec["description"],
        "difficulty": spec["difficulty"],
        "topic": spec["topic"],
        "certification": spec["certification"],
        "durationSeconds": spec["durationSeconds"],
        "passingScore": spec["passingScore"],
        "mockQuestionCount": spec["mockQuestionCount"],
        "domains": domains,
        "allocations": allocations,
        "questions": [],
    }
    if list(skeleton) != list(CANONICAL_ORDER):
        raise ValueError("internal error: skeleton key order drifted from the canonical order")
    return skeleton


def build_parser() -> argparse.ArgumentParser:
    """CLI definition for the bootstrap."""
    parser = argparse.ArgumentParser(
        prog="init_quiz", description="Create a skeleton quiz JSON file from a spec."
    )
    parser.add_argument("--spec", required=True, help="spec JSON describing the quiz blueprint")
    parser.add_argument("--out", required=True, help="output path; filename stem must equal the quiz id")
    parser.add_argument("--force", action="store_true", help="overwrite an existing file")
    return parser


def main(argv=None) -> int:
    """Entry point: 0 written, 2 blocked."""
    args = build_parser().parse_args(argv)
    out_path = Path(args.out)
    if out_path.exists() and not args.force:
        print(f"ERR: {out_path} already exists (use --force to overwrite)", file=sys.stderr)
        print("init-quiz: FAIL", file=sys.stderr)
        return 2
    try:
        spec = load_json(args.spec)
        if not isinstance(spec, dict):
            raise ValueError("spec must be a JSON object")
        skeleton = build(spec, out_path.stem)
    except (OSError, ValueError) as exc:
        print(f"ERR: {exc}", file=sys.stderr)
        print("init-quiz: FAIL", file=sys.stderr)
        return 2
    out_path.write_text(json.dumps(skeleton, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    by_domain = {
        domain["id"]: sum(v for k, v in skeleton["allocations"].items() if k in domain["subdomains"])
        for domain in skeleton["domains"]
    }
    print(f"init-quiz: PASS ({out_path})")
    print(f"  allocations sum: {sum(skeleton['allocations'].values())}")
    print("  domain weights:", by_domain)
    print(f"  subdomains: {len(skeleton['allocations'])}, questions: 0 (awaiting first batch)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
