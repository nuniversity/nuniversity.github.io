#!/usr/bin/env python3
"""Tests for pytest scripts."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from run_tests import build_command, parse_args
from validate_pytest import validate_test_file, validate_conftest


def test_build_command_default():
    """Test default command building."""
    cmd = build_command({})
    assert cmd[-1] != "-v"
    assert "pytest" in cmd


def test_build_command_verbose():
    """Test verbose command building."""
    cmd = build_command({"verbose": True})
    assert "-v" in cmd


def test_build_command_coverage():
    """Test coverage command building."""
    cmd = build_command({"coverage": True, "coverage_src": "src"})
    assert "--cov=src" in cmd
    assert "--cov-report=term-missing" in cmd


def test_build_command_marker():
    """Test marker command building."""
    cmd = build_command({"marker": "slow"})
    assert "-m" in cmd
    assert "slow" in cmd


def test_build_command_parallel():
    """Test parallel command building."""
    cmd = build_command({"parallel": True})
    assert "-n" in cmd
    assert "auto" in cmd


def test_parse_args_coverage():
    """Test parsing --cov argument."""
    args = parse_args(["pytest", "--cov=src"])
    assert args.get("coverage") is True
    assert args.get("coverage_src") == "src"


def test_parse_args_file():
    """Test parsing --file argument."""
    args = parse_args(["pytest", "--file", "test_example.py"])
    assert args.get("file") == "test_example.py"


def test_parse_args_marker():
    """Test parsing --marker argument."""
    args = parse_args(["pytest", "--marker", "not slow"])
    assert args.get("marker") == "not slow"


def test_parse_args_parallel():
    """Test parsing --parallel argument."""
    args = parse_args(["pytest", "--parallel"])
    assert args.get("parallel") is True


def test_validate_test_file_valid():
    """Test validation of valid test file."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write("""
def test_example():
    assert True

class TestExample:
    def test_method(self):
        assert True
""")
        f.flush()
        errors = validate_test_file(Path(f.name))
        assert errors == []


def test_validate_test_file_no_tests():
    """Test validation of file without tests."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write("""
def helper():
    return 42
""")
        f.flush()
        errors = validate_test_file(Path(f.name))
        assert len(errors) > 0


def test_validate_conftest_valid():
    """Test validation of valid conftest.py."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write("""
import pytest

@pytest.fixture
def sample():
    return "data"
""")
        f.flush()
        errors = validate_conftest(Path(f.name))
        assert errors == []


def test_validate_conftest_no_fixtures():
    """Test validation of conftest.py without fixtures."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
        f.write("""
def helper():
    return 42
""")
        f.flush()
        errors = validate_conftest(Path(f.name))
        assert len(errors) > 0


if __name__ == "__main__":
    test_build_command_default()
    test_build_command_verbose()
    test_build_command_coverage()
    test_build_command_marker()
    test_build_command_parallel()
    test_parse_args_coverage()
    test_parse_args_file()
    test_parse_args_marker()
    test_parse_args_parallel()
    test_validate_test_file_valid()
    test_validate_test_file_no_tests()
    test_validate_conftest_valid()
    test_validate_conftest_no_fixtures()
    print("\n✓ All tests passed!")
