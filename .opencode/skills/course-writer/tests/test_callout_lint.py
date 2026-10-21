#!/usr/bin/env python3
"""Tests for callout_lint.py — Markdown callout linting."""
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

import callout_lint


def findings(md: str) -> list[str]:
    return callout_lint.lint_text(md, "test.md")


class TestBlockStyle:
    def test_valid_body(self):
        md = "> [!NOTE]\n> Body line 1\n> Body line 2\n"
        assert findings(md) == []

    def test_valid_table_body(self):
        md = "> [!WARNING]\n> | a | b |\n> |---|---|\n> | 1 | 2 |\n\nAfter.\n"
        assert findings(md) == []

    def test_empty_body_blank_line(self):
        md = "> [!TIP]\n\nContent below.\n"
        f = findings(md)
        assert len(f) == 1
        assert "empty callout body" in f[0]

    def test_empty_body_eof(self):
        assert findings("> [!DANGER]\n") != []

    def test_marker_only(self):
        assert findings("> [!SUCCESS]") != []


class TestPlainStyle:
    def test_key_takeaways_pattern_not_flagged(self):
        # `[!SUCCESS] **Title**` + one blank line + list: the renderer's lazy
        # regex skips the single blank and captures the list (regression guard
        # against the earlier false-positive rule).
        md = "[!SUCCESS] **Key Takeaways**\n\n- Point 1\n- Point 2\n"
        assert findings(md) == []

    def test_plain_with_immediate_body(self):
        md = "[!NOTE]\nSome text right after.\n"
        assert findings(md) == []

    def test_plain_eof_after_marker(self):
        assert findings("[!NOTE]\n") != []

    def test_plain_double_blank_empty(self):
        md = "[!NOTE]\n\n\nContent.\n"
        assert len(findings(md)) == 1
        assert "empty callout body" in findings(md)[0]

    def test_stacked_markers_flagged(self):
        md = "[!NOTE]\n[!TIP]\nBody.\n"
        f = findings(md)
        assert any("swallowed" in x for x in f)


class TestTypes:
    def test_unsupported_type_block(self):
        f = findings("> [!DEPRECATE]\n> Body.\n")
        assert any("unsupported callout marker" in x for x in f)

    def test_unsupported_type_plain(self):
        f = findings("[!REMINDER]\nBody.\n")
        assert any("unsupported callout marker" in x for x in f)

    def test_locale_alias_flagged_with_canonical_hint(self):
        f = findings("> [!NOTA]\n> Corpo.\n")
        assert any("alias" in x and "[!NOTE]" in x for x in f)

    def test_all_supported_pass(self):
        for t in ("NOTE", "INFO", "WARNING", "DANGER", "ERROR", "SUCCESS", "TIP", "IMPORTANT"):
            assert findings(f"> [!{t}]\n> Body.\n") == [], t


class TestFences:
    def test_marker_inside_fence_ignored(self):
        md = "```markdown\n> [!BOGUS]\n> x\n\n[!ALSO]\n```\n"
        assert findings(md) == []

    def test_marker_after_fence_checked(self):
        md = "```\ncode\n```\n\n> [!BOGUS]\n> x\n"
        assert findings(md) != []


class TestMainEntry:
    def test_single_file_clean(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.md"
        f.write_text("> [!NOTE]\n> Body.\n")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(f))
        monkeypatch.setattr("sys.argv", ["callout_lint.py"])
        assert callout_lint.main([]) == 0

    def test_single_file_dirty(self, tmp_path, monkeypatch):
        f = tmp_path / "bad.md"
        f.write_text("> [!TIP]\n\nOrphan.\n")
        monkeypatch.setenv("OPENCODE_FILE_PATH", str(f))
        assert callout_lint.main([]) == 1

    def test_all_on_dir(self, tmp_path, monkeypatch):
        (tmp_path / "a.md").write_text("> [!NOTE]\n> Body.\n")
        (tmp_path / "b.md").write_text("> [!WAT]\n> Body.\n")
        monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
        assert callout_lint.main(["--all", str(tmp_path)]) == 1

    def test_all_clean_dir(self, tmp_path, monkeypatch):
        (tmp_path / "a.md").write_text("> [!NOTE]\n> Body.\n")
        monkeypatch.delenv("OPENCODE_FILE_PATH", raising=False)
        assert callout_lint.main(["--all", str(tmp_path)]) == 0
