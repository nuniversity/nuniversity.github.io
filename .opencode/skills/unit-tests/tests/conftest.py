"""Shared fixtures for the unit-tests skill scripts."""

import importlib.util
import io
import json
import sys
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from types import SimpleNamespace

import pytest

SKILL_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = SKILL_ROOT / "scripts"


def load_script(name: str):
    """Load a skill script by path so tests exercise it in-process (coverage)."""
    path = SCRIPTS / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"unit_skill_{name}", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def invoke(module, argv: list[str]):
    out = io.StringIO()
    err = io.StringIO()
    with redirect_stdout(out), redirect_stderr(err):
        code = module.main(argv)
    return SimpleNamespace(returncode=code, stdout=out.getvalue(), stderr=err.getvalue())


@pytest.fixture
def run_hygiene(tmp_path: Path):
    """Run check_unit_hygiene.py against a temporary repository tree."""
    module = load_script("check_unit_hygiene")

    def run(allowlist: dict | None = None, raw_allowlist: str | None = None):
        args = ["--root", str(tmp_path)]
        if allowlist is not None:
            allow_path = tmp_path / "allowlist.json"
            allow_path.write_text(json.dumps(allowlist), encoding="utf-8")
            args += ["--allowlist", str(allow_path)]
        if raw_allowlist is not None:
            allow_path = tmp_path / "allowlist.json"
            allow_path.write_text(raw_allowlist, encoding="utf-8")
            args += ["--allowlist", str(allow_path)]
        return invoke(module, args)

    return run


@pytest.fixture
def write_test_file(tmp_path: Path):
    def write(name: str, body: str) -> Path:
        path = tmp_path / "tests" / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")
        return path

    return write


@pytest.fixture
def run_coverage_gate(tmp_path: Path):
    """Run coverage_gate.py against arbitrary summary/floor files."""
    module = load_script("coverage_gate")

    def run(
        summary: dict | None,
        floor: dict | None,
        raw_summary: str | None = None,
        raw_floor: str | None = None,
    ):
        args: list[str] = []
        if raw_summary is not None:
            summary_path = tmp_path / "coverage-summary.json"
            summary_path.write_text(raw_summary, encoding="utf-8")
            args += ["--summary", str(summary_path)]
        elif summary is None:
            args += ["--summary", str(tmp_path / "missing.json")]
        else:
            summary_path = tmp_path / "coverage-summary.json"
            summary_path.write_text(json.dumps(summary), encoding="utf-8")
            args += ["--summary", str(summary_path)]
        if raw_floor is not None:
            floor_path = tmp_path / "floor.json"
            floor_path.write_text(raw_floor, encoding="utf-8")
            args += ["--floor", str(floor_path)]
        elif floor is not None:
            floor_path = tmp_path / "floor.json"
            floor_path.write_text(json.dumps(floor), encoding="utf-8")
            args += ["--floor", str(floor_path)]
        return invoke(module, args)

    return run
