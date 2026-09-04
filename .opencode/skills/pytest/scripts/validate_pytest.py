#!/usr/bin/env python3
"""Validate pytest configuration and test files.

Deterministic script: exit 0 = pass, exit 1 = warning, exit 2 = error.

Usage:
    python validate_pytest.py [--file=FILE] [--dir=DIR]

Exit Codes:
    0 - Validation passed
    1 - Non-blocking warnings
    2 - Blocking errors
"""
import ast
import os
import re
import sys
from pathlib import Path


def validate_test_file(file_path: Path) -> list[str]:
    """Validate a test file follows pytest conventions."""
    errors = []

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        return [f"Cannot read file: {e}"]

    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        return [f"Syntax error: {e}"]

    has_tests = False
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
            has_tests = True
        if isinstance(node, ast.ClassDef) and node.name.startswith("Test"):
            has_tests = True

    if not has_tests:
        errors.append(f"No test functions or classes found in {file_path.name}")

    return errors


def validate_conftest(file_path: Path) -> list[str]:
    """Validate conftest.py structure."""
    errors = []

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        return [f"Cannot read file: {e}"]

    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        return [f"Syntax error in conftest.py: {e}"]

    has_fixtures = False
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for decorator in node.decorator_list:
                if isinstance(decorator, ast.Name) and decorator.id == "pytest.fixture":
                    has_fixtures = True
                if isinstance(decorator, ast.Attribute) and decorator.attr == "fixture":
                    has_fixtures = True

    if not has_fixtures:
        errors.append("conftest.py has no pytest fixtures")

    return errors


def validate_pyproject_toml(file_path: Path) -> list[str]:
    """Validate pytest configuration in pyproject.toml."""
    errors = []

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        return [f"Cannot read file: {e}"]

    if "[tool.pytest" not in content:
        errors.append("No [tool.pytest.ini_options] section found in pyproject.toml")

    return errors


def validate_directory(dir_path: Path) -> tuple[list[str], list[str]]:
    """Validate all test files in directory."""
    errors = []
    warnings = []

    for py_file in dir_path.rglob("*.py"):
        if py_file.name.startswith("test_") or py_file.name.endswith("_test.py"):
            file_errors = validate_test_file(py_file)
            for error in file_errors:
                errors.append(f"{py_file}: {error}")

        if py_file.name == "conftest.py":
            file_errors = validate_conftest(py_file)
            for error in file_errors:
                warnings.append(f"{py_file}: {error}")

    return errors, warnings


def main() -> int:
    """Main validation entry point."""
    args = sys.argv[1:]
    target = None

    for arg in args:
        if arg.startswith("--file="):
            target = Path(arg.split("=", 1)[1])
        elif arg.startswith("--dir="):
            target = Path(arg.split("=", 1)[1])
        elif not arg.startswith("-"):
            target = Path(arg)

    if not target:
        if Path("tests").exists():
            target = Path("tests")
        elif Path("test").exists():
            target = Path("test")
        else:
            target = Path(".")

    if target.is_file():
        if target.name == "conftest.py":
            errors = validate_conftest(target)
        elif target.name == "pyproject.toml":
            errors = validate_pyproject_toml(target)
        else:
            errors = validate_test_file(target)
        warnings = []
    elif target.is_dir():
        errors, warnings = validate_directory(target)
    else:
        print(f"ERROR: Target not found: {target}", file=sys.stderr)
        return 2

    for warning in warnings:
        print(f"PYTEST WARNING: {warning}", file=sys.stderr)

    if errors:
        for error in errors:
            print(f"PYTEST ERROR: {error}", file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
