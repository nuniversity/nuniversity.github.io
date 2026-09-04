#!/usr/bin/env python3
"""Pytest configuration for skill-builder tests."""
import tempfile
from pathlib import Path

import pytest


@pytest.fixture
def tmp_skill_dir() -> Path:
    """Create a temporary skill directory for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        skill_dir = Path(tmpdir) / "test-skill"
        skill_dir.mkdir()
        yield skill_dir
