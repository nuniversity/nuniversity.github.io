#!/usr/bin/env python3
"""Tests for run_pipeline.py script."""
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

from run_pipeline import (
    STAGE_DEFINITIONS,
    detect_stages,
    format_status,
    parse_args,
    run_stage,
)


class TestParseArgs:
    """Tests for parse_args function."""

    def test_default_args(self):
        """Default args has no stages and no flags."""
        args = parse_args(["python", "script.py"])
        assert args["stages"] is None
        assert args["dry_run"] is False
        assert args["verbose"] is False

    def test_dry_run_flag(self):
        """--dry-run sets dry_run to True."""
        args = parse_args(["python", "script.py", "--dry-run"])
        assert args["dry_run"] is True

    def test_verbose_flag(self):
        """--verbose sets verbose to True."""
        args = parse_args(["python", "script.py", "--verbose"])
        assert args["verbose"] is True

    def test_stage_flag(self):
        """--stage=tests,build parses stage list."""
        args = parse_args(["python", "script.py", "--stage=tests,build"])
        assert args["stages"] == ["tests", "build"]

    def test_stage_flag_space(self):
        """--stage STAGES with space separator."""
        args = parse_args(["python", "script.py", "--stage", "install,build"])
        assert args["stages"] == ["install", "build"]

    def test_env_override(self):
        """PIPELINE_STAGES env var overrides --stage."""
        with patch.dict("os.environ", {"PIPELINE_STAGES": "tests,build"}):
            args = parse_args(["python", "script.py"])
            assert args["stages"] == ["tests", "build"]


class TestDetectStages:
    """Tests for detect_stages function."""

    def test_filters_by_requirements(self, tmp_path):
        """Only stages with existing required files are included."""
        (tmp_path / "package.json").write_text("{}")
        (tmp_path / "package-lock.json").write_text("{}")
        (tmp_path / "vitest.config.ts").write_text("export default {}")
        (tmp_path / "next.config.js").write_text("module.exports = {}")
        with patch("pathlib.Path.cwd", return_value=tmp_path):
            detected = detect_stages(STAGE_DEFINITIONS, None)
            ids = [s["id"] for s in detected]
            assert "install" in ids
            assert "tests" in ids
            assert "build" in ids

    def test_filters_by_request(self, tmp_path):
        """Only requested stages are included."""
        (tmp_path / "package.json").write_text("{}")
        (tmp_path / "package-lock.json").write_text("{}")
        with patch("pathlib.Path.cwd", return_value=tmp_path):
            detected = detect_stages(STAGE_DEFINITIONS, ["install"])
            assert len(detected) == 1
            assert detected[0]["id"] == "install"

    def test_empty_when_no_files(self, tmp_path):
        """No stages detected when required files are missing."""
        with patch("pathlib.Path.cwd", return_value=tmp_path):
            detected = detect_stages(STAGE_DEFINITIONS, None)
            assert detected == []


class TestFormatStatus:
    """Tests for format_status function."""

    def test_pass(self):
        """Exit code 0 returns PASS."""
        assert "PASS" in format_status(0)

    def test_fail(self):
        """Non-zero exit returns FAIL."""
        assert "FAIL" in format_status(2)


class TestRunStage:
    """Tests for run_stage function."""

    def test_successful_command(self):
        """Successful command returns exit code 0."""
        stage = {"command": ["echo", "hello"]}
        r = run_stage(stage)
        assert r["exit_code"] == 0
        assert r["elapsed"] >= 0

    def test_failing_command(self):
        """Failing command returns non-zero exit code."""
        stage = {"command": ["false"]}
        r = run_stage(stage)
        assert r["exit_code"] != 0

    def test_timeout(self):
        """Command exceeding timeout returns exit code 2."""
        stage = {"command": ["sleep", "10"]}
        r = run_stage(stage, timeout=1)
        assert r["exit_code"] == 2
        assert "timed out" in r["stderr"]

    def test_file_not_found(self):
        """Missing command returns exit code 2."""
        stage = {"command": ["nonexistent_command_xyz"]}
        r = run_stage(stage)
        assert r["exit_code"] == 2
        assert "not found" in r["stderr"]


class TestRunPipelineCLI:
    """CLI integration tests for run_pipeline.py."""

    def test_dry_run(self, tmp_path):
        """--dry-run prints stages without executing."""
        (tmp_path / "package.json").write_text("{}")
        (tmp_path / "package-lock.json").write_text("{}")
        script = str(Path(__file__).parent.parent / "scripts" / "run_pipeline.py")
        result = subprocess.run(
            [sys.executable, script, "--dry-run"],
            capture_output=True,
            text=True,
            cwd=str(tmp_path),
        )
        assert result.returncode == 0
        assert "Would run" in result.stdout

    def test_full_pipeline(self):
        """Full pipeline runs and returns exit code."""
        script = str(Path(__file__).parent.parent / "scripts" / "run_pipeline.py")
        result = subprocess.run(
            [sys.executable, script],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent.parent.parent.parent),
            timeout=120,
        )
        assert result.returncode in (0, 2)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
