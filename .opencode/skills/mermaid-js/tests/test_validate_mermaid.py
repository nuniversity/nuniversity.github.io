#!/usr/bin/env python3
"""Tests for validate_mermaid.py — Mermaid.js diagram validation."""

import os
import subprocess
import sys
from pathlib import Path

import pytest

# Add scripts directory to path for imports
SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from validate_mermaid import extract_mermaid_blocks, main, validate_block


# ---------------------------------------------------------------------------
# extract_mermaid_blocks tests
# ---------------------------------------------------------------------------


class TestExtractMermaidBlocks:
    """Tests for extract_mermaid_blocks()."""

    def test_single_block(self):
        md = "```mermaid\nflowchart TD\n    A-->B\n```"
        blocks = extract_mermaid_blocks(md)
        assert len(blocks) == 1
        assert blocks[0]["index"] == 0
        assert "flowchart TD" in blocks[0]["content"]

    def test_multiple_blocks(self):
        md = (
            "Text\n\n```mermaid\nflowchart TD\n    A-->B\n```\n\n"
            "More text\n\n```mermaid\nsequenceDiagram\n"
            "    A->>B: Hi\n```\n\n"
            'End\n\n```mermaid\npie\n    "X" : 1\n```'
        )
        blocks = extract_mermaid_blocks(md)
        assert len(blocks) == 3
        assert blocks[0]["index"] == 0
        assert blocks[1]["index"] == 1
        assert blocks[2]["index"] == 2

    def test_no_blocks(self):
        md = "Just some regular markdown\n## Title\n- list item"
        blocks = extract_mermaid_blocks(md)
        assert blocks == []

    def test_empty_block(self):
        md = "```mermaid\n```"
        blocks = extract_mermaid_blocks(md)
        assert len(blocks) == 1
        assert blocks[0]["content"] == ""

    def test_block_with_content(self):
        md = "```mermaid\nflowchart TD\n    A[Start] --> B[End]\n```"
        blocks = extract_mermaid_blocks(md)
        assert len(blocks) == 1
        assert "A[Start] --> B[End]" in blocks[0]["content"]

    def test_case_insensitive_fence(self):
        md = "```Mermaid\nflowchart TD\n    A-->B\n```"
        blocks = extract_mermaid_blocks(md)
        assert len(blocks) == 1

    def test_surrounding_text(self):
        md = "# Title\n\n```mermaid\nflowchart TD\n    A-->B\n```\n\nFooter"
        blocks = extract_mermaid_blocks(md)
        assert len(blocks) == 1
        assert blocks[0]["start"] > 0

    def test_preserves_order(self):
        md = (
            "```mermaid\nflowchart TD\n    A-->B\n```\n"
            "text\n"
            '```mermaid\npie\n    "X" : 1\n```'
        )
        blocks = extract_mermaid_blocks(md)
        assert len(blocks) == 2
        assert blocks[0]["index"] < blocks[1]["index"]


# ---------------------------------------------------------------------------
# validate_block tests
# ---------------------------------------------------------------------------


class TestValidateBlockValid:
    """Tests for valid diagram types."""

    @pytest.mark.parametrize(
        "diagram_type",
        [
            "flowchart TD",
            "flowchart LR",
            "graph TD",
            "sequenceDiagram",
            "classDiagram",
            "stateDiagram-v2",
            "erdiagram",
            "gantt",
            "pie",
            "mindmap",
            "timeline",
            "gitGraph",
            "architecture-beta",
            "journey",
        ],
    )
    def test_valid_diagram_types(self, diagram_type):
        block = {
            "index": 0,
            "content": f"{diagram_type}\n    A-->B",
            "start": 0,
        }
        errors = validate_block(block)
        type_errors = [e for e in errors if "Unknown or invalid" in e]
        assert type_errors == []

    def test_comment_only_block(self):
        block = {
            "index": 0,
            "content": "%% just a comment",
            "start": 0,
        }
        errors = validate_block(block)
        assert errors == []


class TestValidateBlockInvalid:
    """Tests for invalid diagram types and edge cases."""

    def test_unknown_diagram_type(self):
        block = {
            "index": 0,
            "content": "foobar\n    A-->B",
            "start": 0,
        }
        errors = validate_block(block)
        assert any("Unknown or invalid diagram type" in e for e in errors)

    def test_empty_block(self):
        block = {"index": 0, "content": "", "start": 0}
        errors = validate_block(block)
        assert any("Unknown or invalid" in e for e in errors)


class TestValidateBlockBrackets:
    """Tests for bracket/parenthesis/brace balance checking."""

    def test_unbalanced_brackets(self):
        block = {
            "index": 0,
            "content": "flowchart TD\n    A[ --> B",
            "start": 0,
        }
        errors = validate_block(block)
        assert any("Unbalanced brackets" in e for e in errors)

    def test_unbalanced_parentheses(self):
        block = {
            "index": 0,
            "content": "flowchart TD\n    A( --> B",
            "start": 0,
        }
        errors = validate_block(block)
        assert any("Unbalanced parentheses" in e for e in errors)

    def test_unbalanced_braces(self):
        block = {
            "index": 0,
            "content": "flowchart TD\n    A{ --> B",
            "start": 0,
        }
        errors = validate_block(block)
        assert any("Unbalanced braces" in e for e in errors)

    def test_balanced_all(self):
        block = {
            "index": 0,
            "content": 'flowchart TD\n    A[("x")]{y} --> B',
            "start": 0,
        }
        errors = validate_block(block)
        bracket_errors = [e for e in errors if "Unbalanced" in e]
        assert bracket_errors == []


class TestValidateBlockKnownIssues:
    """Tests for known Mermaid.js issues detection."""

    def test_end_without_quotes(self):
        block = {
            "index": 0,
            "content": "flowchart TD\n    A --> end",
            "start": 0,
        }
        errors = validate_block(block)
        assert any("end" in e.lower() for e in errors)

    def test_end_quoted_no_warning(self):
        block = {
            "index": 0,
            "content": "flowchart TD\n    A --> [end]",
            "start": 0,
        }
        errors = validate_block(block)
        end_warnings = [e for e in errors if "end" in e.lower()]
        assert end_warnings == []

    def test_braces_in_comment(self):
        block = {
            "index": 0,
            "content": "flowchart TD\n    %% {x}",
            "start": 0,
        }
        errors = validate_block(block)
        assert any("inside comments" in e for e in errors)

    def test_leading_whitespace_on_keyword(self):
        block = {
            "index": 0,
            "content": "  flowchart TD\n    A-->B",
            "start": 0,
        }
        errors = validate_block(block)
        assert any("first non-blank line" in e for e in errors)


class TestValidateBlockEdgeCases:
    """Tests for edge cases."""

    def test_multiline_labels(self):
        block = {
            "index": 0,
            "content": ('flowchart TD\n    A["line1\nline2"] --> B'),
            "start": 0,
        }
        errors = validate_block(block)
        bracket_errors = [e for e in errors if "Unbalanced" in e]
        assert bracket_errors == []

    def test_special_chars_in_labels(self):
        block = {
            "index": 0,
            "content": ('flowchart TD\n    A["text (with parens)"] --> B'),
            "start": 0,
        }
        errors = validate_block(block)
        assert isinstance(errors, list)

    def test_nested_subgraphs(self):
        block = {
            "index": 0,
            "content": (
                "flowchart TD\n"
                '    subgraph "Outer"\n'
                '        subgraph "Inner"\n'
                "            A-->B\n"
                "        end\n"
                "    end"
            ),
            "start": 0,
        }
        errors = validate_block(block)
        bracket_errors = [e for e in errors if "Unbalanced" in e]
        assert bracket_errors == []

    def test_unicode_labels(self):
        block = {
            "index": 0,
            "content": ("flowchart TD\n    A[\u65e5\u672c\u8a9e] --> B"),
            "start": 0,
        }
        errors = validate_block(block)
        assert errors == []

    def test_trailing_whitespace(self):
        block = {
            "index": 0,
            "content": "flowchart TD\n    A-->B  \n  ",
            "start": 0,
        }
        errors = validate_block(block)
        assert isinstance(errors, list)


# ---------------------------------------------------------------------------
# main() integration tests
# ---------------------------------------------------------------------------


class TestMain:
    """Tests for the main() entry point."""

    def test_no_env_var(self, monkeypatch):
        monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
        assert main() == 0

    def test_nonexistent_file(self, monkeypatch):
        monkeypatch.setenv("OPENCODE_FILE_PATH", "/nonexistent/file.md")
        assert main() == 0

    def test_non_markdown_file(self, monkeypatch, tmp_path):
        txt_file = tmp_path / "test.txt"
        txt_file.write_text("```mermaid\nflowchart TD\n    A-->B\n```")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(txt_file))
        assert main() == 0

    def test_no_mermaid_blocks(self, monkeypatch, tmp_path):
        md_file = tmp_path / "test.md"
        md_file.write_text("# Title\nJust some text\n")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(md_file))
        assert main() == 0

    def test_valid_diagrams(self, monkeypatch, tmp_path):
        md_file = tmp_path / "test.md"
        md_file.write_text("```mermaid\nflowchart TD\n    A-->B\n```\n")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(md_file))
        assert main() == 0

    def test_invalid_diagrams(self, monkeypatch, tmp_path):
        md_file = tmp_path / "test.md"
        md_file.write_text("```mermaid\nfoobar\n    A-->B\n```\n")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(md_file))
        assert main() == 1

    def test_multiple_blocks_mixed(self, monkeypatch, tmp_path):
        md_file = tmp_path / "test.md"
        md_file.write_text(
            "```mermaid\nflowchart TD\n    A-->B\n```\n\n"
            "```mermaid\nfoobar\n    X-->Y\n```\n"
        )
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(md_file))
        assert main() == 1

    def test_encoding_error(self, monkeypatch, tmp_path):
        md_file = tmp_path / "test.md"
        md_file.write_bytes(b"\x80\x81\x82")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(md_file))
        assert main() == 0


# ---------------------------------------------------------------------------
# CLI integration test (subprocess)
# ---------------------------------------------------------------------------


class TestCLI:
    """Tests for running validate_mermaid.py as a CLI script."""

    def _run(self, file_path: str) -> subprocess.CompletedProcess:
        script = (
            Path(__file__).resolve().parent.parent / "scripts" / "validate_mermaid.py"
        )
        env = os.environ.copy()
        env["OPENCODE_FILE_PATH"] = file_path
        return subprocess.run(
            [sys.executable, str(script)],
            env=env,
            capture_output=True,
            text=True,
        )

    def test_cli_valid(self, tmp_path):
        md = tmp_path / "valid.md"
        md.write_text("```mermaid\nflowchart TD\n    A-->B\n```\n")
        result = self._run(str(md))
        assert result.returncode == 0

    def test_cli_invalid(self, tmp_path):
        md = tmp_path / "bad.md"
        md.write_text("```mermaid\nfoobar\n```\n")
        result = self._run(str(md))
        assert result.returncode == 1
        assert "MERMAID WARNING" in result.stderr
