#!/usr/bin/env python3
"""Pytest configuration for mermaid-js tests."""

import tempfile
from pathlib import Path

import pytest


@pytest.fixture
def tmp_md_file() -> Path:
    """Create a temporary Markdown file for testing."""
    with tempfile.NamedTemporaryFile(
        suffix=".md", mode="w", delete=False, encoding="utf-8"
    ) as f:
        path = Path(f.name)
    yield path
    path.unlink(missing_ok=True)


@pytest.fixture
def tmp_mermaid_file(tmp_md_file: Path) -> Path:
    """Create a temporary Markdown file with a valid mermaid block."""
    tmp_md_file.write_text(
        "```mermaid\nflowchart TD\n    A-->B\n```\n",
        encoding="utf-8",
    )
    return tmp_md_file
