#!/usr/bin/env python3
"""Simulate the CI/CD pipeline from .github/workflows/nextjs.yml locally.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = error.

Usage:
    python run_pipeline.py [--stage=STAGES] [--dry-run] [--verbose]

Environment Variables:
    PIPELINE_STAGES: Comma-separated list of stages to run (overrides --stage)

Exit Codes:
    0 - All stages passed (warnings OK)
    1 - Warnings but no failures
    2 - One or more stages failed
"""
import os
import subprocess
import sys
import time
from pathlib import Path

STAGE_DEFINITIONS = [
    {
        "id": "install",
        "name": "Install dependencies",
        "command": ["npm", "ci"],
        "requires": ["package.json", "package-lock.json"],
    },
    {
        "id": "tests",
        "name": "Run tests",
        "command": ["npx", "vitest", "run"],
        "requires": ["package.json", "vitest.config.ts"],
    },
    {
        "id": "build",
        "name": "Build with Next.js",
        "command": ["npx", "next", "build"],
        "requires": ["package.json", "next.config.js"],
    },
]


def parse_args(argv: list[str]) -> dict:
    """Parse command line arguments manually."""
    args = {"stages": None, "dry_run": False, "verbose": False}
    for arg in argv[1:]:
        if arg == "--dry-run":
            args["dry_run"] = True
        elif arg == "--verbose":
            args["verbose"] = True
        elif arg.startswith("--stage="):
            args["stages"] = arg.split("=", 1)[1].split(",")
        elif arg.startswith("--stage"):
            idx = argv.index(arg)
            if idx + 1 < len(argv):
                args["stages"] = argv[idx + 1].split(",")
    env_stages = os.environ.get("PIPELINE_STAGES", "")
    if env_stages:
        args["stages"] = env_stages.split(",")
    return args


def detect_stages(available: list[dict], requested: list[str] | None) -> list[dict]:
    """Filter stages based on project detection and user request."""
    cwd = Path.cwd()
    detected = []
    for stage in available:
        if requested and stage["id"] not in requested:
            continue
        if all((cwd / req).exists() for req in stage["requires"]):
            detected.append(stage)
    return detected


def run_stage(stage: dict, verbose: bool = False, timeout: int = 600) -> dict:
    """Run a single pipeline stage and return result."""
    start = time.monotonic()
    try:
        result = subprocess.run(  # noqa: S603
            stage["command"],
            capture_output=not verbose,
            text=True,
            timeout=timeout,
        )
        elapsed = time.monotonic() - start
        return {
            "stage": stage,
            "exit_code": result.returncode,
            "elapsed": elapsed,
            "stdout": result.stdout if not verbose else "",
            "stderr": result.stderr if not verbose else "",
        }
    except subprocess.TimeoutExpired:
        elapsed = time.monotonic() - start
        return {
            "stage": stage,
            "exit_code": 2,
            "elapsed": elapsed,
            "stdout": "",
            "stderr": "Stage timed out after 600s",
        }
    except FileNotFoundError:
        elapsed = time.monotonic() - start
        return {
            "stage": stage,
            "exit_code": 2,
            "elapsed": elapsed,
            "stdout": "",
            "stderr": f"Command not found: {stage['command'][0]}",
        }


def format_status(code: int) -> str:
    """Format stage status emoji."""
    if code == 0:
        return "✅ PASS"
    return "❌ FAIL"


def print_header() -> None:
    """Print pipeline header."""
    print("╔══════════════════════════════════════════════╗")
    print("║          CI/CD Pipeline Simulator            ║")
    print("╚══════════════════════════════════════════════╝")
    print()


def print_result(results: list[dict], total_time: float) -> int:
    """Print pipeline results and return exit code."""
    passed = sum(1 for r in results if r["exit_code"] == 0)
    failed = sum(1 for r in results if r["exit_code"] != 0)
    print()
    print("══════════════════════════════════════════════")
    print(f"  Result: {passed} PASSED, {failed} FAILED")
    print(f"  Total time: {total_time:.1f}s")
    print("══════════════════════════════════════════════")
    if failed > 0:
        return 2
    return 0


def main() -> int:
    """Main entry point."""
    args = parse_args(sys.argv)
    stages = detect_stages(STAGE_DEFINITIONS, args["stages"])
    if not stages:
        print("CICD WARNING: No stages detected for this project", file=sys.stderr)
        return 0
    if args["dry_run"]:
        print_header()
        for i, stage in enumerate(stages, 1):
            print(f"[{i}/{len(stages)}] {stage['name']} ({' '.join(stage['command'])})")
        print()
        print(f"  Would run {len(stages)} stages (dry run)")
        return 0
    print_header()
    results = []
    total_start = time.monotonic()
    for i, stage in enumerate(stages, 1):
        label = f"[{i}/{len(stages)}] {stage['name']} ({' '.join(stage['command'])})"
        print(f"{label}...", end=" ", flush=True)
        r = run_stage(stage, verbose=args["verbose"])
        status = format_status(r["exit_code"])
        print(f"{status} ({r['elapsed']:.1f}s)")
        if r["exit_code"] != 0 and not args["verbose"]:
            if r["stderr"]:
                print(f"         {r['stderr'][:200]}")
        results.append(r)
    total_time = time.monotonic() - total_start
    return print_result(results, total_time)


if __name__ == "__main__":
    sys.exit(main())
