"""Shared fixtures for the e2e-tests skill scripts."""

import importlib.util
import io
import json
import sys
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from types import SimpleNamespace

import pytest

SKILL_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = SKILL_ROOT / "scripts" / "check_e2e_hygiene.py"


def load_script():
    spec = importlib.util.spec_from_file_location("e2e_skill_check", SCRIPT)
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
    module = load_script()

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
def write_e2e_file(tmp_path: Path):
    def write(name: str, body: str) -> Path:
        path = tmp_path / "tests/e2e" / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")
        return path

    return write
