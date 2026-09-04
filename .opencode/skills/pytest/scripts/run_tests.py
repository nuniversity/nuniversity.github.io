#!/usr/bin/env python3
"""Run pytest with standard configuration.

Deterministic script: exit 0 = pass, exit 1 = fail, exit 2 = error.

Usage:
    python run_tests.py [--cov=SRC] [--file=FILE] [--marker=MARKER] [--parallel]

Environment Variables:
    PYTEST_ADDOPTS: Additional pytest options
    PYTEST_COVERAGE_SRC: Source directory for coverage

Exit Codes:
    0 - All tests passed
    1 - One or more tests failed
    2 - pytest error (not test failures)
"""
import os
import subprocess
import sys
from pathlib import Path


def build_command(args: dict) -> list[str]:
    """Build pytest command from arguments."""
    cmd = [sys.executable, "-m", "pytest"]

    if args.get("file"):
        cmd.append(args["file"])

    if args.get("verbose"):
        cmd.append("-v")

    if args.get("coverage"):
        src = args.get("coverage_src", "src")
        cmd.extend([f"--cov={src}", "--cov-report=term-missing"])

    if args.get("marker"):
        cmd.extend(["-m", args["marker"]])

    if args.get("parallel"):
        cmd.extend(["-n", "auto"])

    if args.get("fail_under"):
        cmd.extend(["--cov-fail-under", str(args["fail_under"])])

    extra = os.environ.get("PYTEST_ADDOPTS", "")
    if extra:
        cmd.extend(extra.split())

    return cmd


def run_tests(args: dict) -> int:
    """Run pytest and return exit code."""
    cmd = build_command(args)
    print(f"Running: {' '.join(cmd)}", file=sys.stderr)

    result = subprocess.run(cmd, cwd=os.getcwd())

    if result.returncode == 5:
        print("WARNING: No tests collected", file=sys.stderr)
        return 1

    return result.returncode


def parse_args(argv: list[str]) -> dict:
    """Parse command line arguments."""
    args = {}
    i = 1
    while i < len(argv):
        arg = argv[i]
        if arg == "--cov" or arg.startswith("--cov="):
            args["coverage"] = True
            if "=" in arg:
                args["coverage_src"] = arg.split("=", 1)[1]
            elif i + 1 < len(argv) and not argv[i + 1].startswith("-"):
                i += 1
                args["coverage_src"] = argv[i]
        elif arg == "--file" or arg.startswith("--file="):
            if "=" in arg:
                args["file"] = arg.split("=", 1)[1]
            elif i + 1 < len(argv):
                i += 1
                args["file"] = argv[i]
        elif arg == "--marker" or arg.startswith("--marker="):
            if "=" in arg:
                args["marker"] = arg.split("=", 1)[1]
            elif i + 1 < len(argv):
                i += 1
                args["marker"] = argv[i]
        elif arg == "--parallel":
            args["parallel"] = True
        elif arg == "--verbose" or arg == "-v":
            args["verbose"] = True
        elif arg.startswith("--fail-under="):
            args["fail_under"] = int(arg.split("=", 1)[1])
        i += 1
    return args


def main() -> int:
    """Main entry point."""
    if not Path("pyproject.toml").exists() and not Path("pytest.ini").exists():
        if not Path("tests").exists() and not any(Path(".").glob("test_*.py")):
            print("ERROR: No pytest project detected", file=sys.stderr)
            return 2

    args = parse_args(sys.argv)
    return run_tests(args)


if __name__ == "__main__":
    sys.exit(main())
