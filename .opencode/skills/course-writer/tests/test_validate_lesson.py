#!/usr/bin/env python3
"""Tests for validate_lesson.py script."""
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from validate_lesson import (
    extract_frontmatter,
    validate_frontmatter,
    validate_body,
    validate_lesson,
)


class TestExtractFrontmatter:
    """Tests for extract_frontmatter function."""

    def test_valid_frontmatter(self):
        """Valid frontmatter returns dict."""
        content = "---\ntitle: Test\norder: 1\n---\n\nBody"
        data, err = extract_frontmatter(content)
        assert data is not None
        assert err is None
        assert data["title"] == "Test"
        assert data["order"] == 1

    def test_missing_delimiters(self):
        """Missing frontmatter delimiters returns error."""
        data, err = extract_frontmatter("# No frontmatter here")
        assert data is None
        assert "frontmatter" in err.lower()

    def test_invalid_yaml(self):
        """Invalid YAML returns error."""
        content = "---\n  invalid: yaml: structure\n---\n"
        data, err = extract_frontmatter(content)
        assert data is None
        assert "yaml" in err.lower() or "invalid" in err.lower()

    def test_empty_frontmatter(self):
        """Empty frontmatter returns empty dict or error."""
        content = "---\n---\n\nBody"
        data, err = extract_frontmatter(content)
        assert data is None
        assert err is not None

    def test_non_dict_frontmatter(self):
        """Non-dict frontmatter (list) returns error."""
        content = "---\n- item1\n- item2\n---\n"
        data, err = extract_frontmatter(content)
        assert data is None
        assert "mapping" in err.lower() or "dict" in err.lower()


class TestValidateFrontmatter:
    """Tests for validate_frontmatter function."""

    def test_valid_frontmatter(self):
        """Valid frontmatter returns no errors."""
        data = {"title": "Test Lesson", "order": 1}
        errors, _ = validate_frontmatter(data)
        assert errors == []

    def test_missing_title(self):
        """Missing title returns error."""
        data = {"order": 1}
        errors, _ = validate_frontmatter(data)
        assert any("title" in e.lower() for e in errors)

    def test_missing_order(self):
        """Missing order returns error."""
        data = {"title": "Test"}
        errors, _ = validate_frontmatter(data)
        assert any("order" in e.lower() for e in errors)

    def test_order_not_int(self):
        """Order not an integer returns error."""
        data = {"title": "Test", "order": "1"}
        errors, _ = validate_frontmatter(data)
        assert any("integer" in e.lower() for e in errors)

    def test_order_less_than_one(self):
        """Order < 1 returns error."""
        data = {"title": "Test", "order": 0}
        errors, _ = validate_frontmatter(data)
        assert any(">= 1" in e for e in errors)

    def test_invalid_difficulty(self):
        """Invalid difficulty returns warning."""
        data = {"title": "Test", "order": 1, "difficulty": "super-hard"}
        _, warnings = validate_frontmatter(data)
        assert any("difficulty" in w.lower() for w in warnings)

    def test_valid_difficulty(self):
        """Valid difficulty returns no warning."""
        for diff in ("beginner", "intermediate", "advanced"):
            data = {"title": "Test", "order": 1, "difficulty": diff}
            _, warnings = validate_frontmatter(data)
            assert not any("difficulty" in w.lower() for w in warnings)

    def test_empty_title(self):
        """Empty title returns error."""
        data = {"title": "  ", "order": 1}
        errors, _ = validate_frontmatter(data)
        assert any("empty" in e.lower() for e in errors)

    def test_short_title(self):
        """Short title returns error."""
        data = {"title": "AB", "order": 1}
        errors, _ = validate_frontmatter(data)
        assert any("short" in e.lower() for e in errors)

    def test_empty_description_warning(self):
        """Empty description returns warning."""
        data = {"title": "Test", "order": 1, "description": ""}
        _, warnings = validate_frontmatter(data)
        assert any("description" in w.lower() for w in warnings)

    def test_empty_duration_warning(self):
        """Empty duration returns warning."""
        data = {"title": "Test", "order": 1, "duration": ""}
        _, warnings = validate_frontmatter(data)
        assert any("duration" in w.lower() for w in warnings)


class TestValidateBody:
    """Tests for validate_body function."""

    def _make_body(self, **overrides):
        """Create a valid lesson body for testing."""
        h1 = overrides.get("h1", "# Test Lesson")
        practice = overrides.get("practice", "## Practice Questions")
        questions = overrides.get(
            "questions",
            "\n\n".join(
                ["```question\n{}\n```" for _ in range(5)]
            ),
        )
        takeaways = overrides.get(
            "takeaways",
            "> [!SUCCESS]\n> ### Key Takeaways\n\n- Point 1",
        )
        code = overrides.get("code", "")
        return f"{h1}\n\nContent\n\n{practice}\n\n{questions}\n\n{takeaways}\n{code}"

    def test_valid_body(self):
        """Valid body returns no errors."""
        frontmatter = {"title": "Test Lesson"}
        content = self._make_body()
        errors, _ = validate_body(content, frontmatter)
        assert errors == []

    def test_h1_mismatch(self):
        """H1 not matching title returns error."""
        frontmatter = {"title": "Test Lesson"}
        content = self._make_body(h1="# Different Title")
        errors, _ = validate_body(content, frontmatter)
        assert any("does not match" in e.lower() for e in errors)

    def test_missing_h1(self):
        """Missing H1 returns error."""
        frontmatter = {"title": "Test Lesson"}
        content = self._make_body(h1="")
        errors, _ = validate_body(content, frontmatter)
        assert any("h1" in e.lower() for e in errors)

    def test_no_practice_questions_section(self):
        """Missing practice questions section returns error."""
        frontmatter = {"title": "Test Lesson"}
        content = self._make_body(practice="")
        errors, _ = validate_body(content, frontmatter)
        assert any("practice" in e.lower() for e in errors)

    def test_insufficient_questions(self):
        """Less than 5 questions returns error."""
        frontmatter = {"title": "Test Lesson"}
        qs = "```question\n{}\n```\n\n```question\n{}\n```"
        content = self._make_body(questions=qs)
        errors, _ = validate_body(content, frontmatter)
        assert any("insufficient" in e.lower() for e in errors)

    def test_no_key_takeaways(self):
        """Missing key takeaways returns error."""
        frontmatter = {"title": "Test Lesson"}
        content = self._make_body(takeaways="")
        errors, _ = validate_body(content, frontmatter)
        assert any("takeaway" in e.lower() for e in errors)

    def test_success_admonition_takeaways(self):
        """Key takeaways via > [!SUCCESS] is valid."""
        frontmatter = {"title": "Test Lesson"}
        tk = "> [!SUCCESS]\n> ### Key Takeaways\n\n- Point 1"
        content = self._make_body(takeaways=tk)
        errors, _ = validate_body(content, frontmatter)
        assert not any("takeaway" in e.lower() for e in errors)


class TestValidateLesson:
    """Tests for validate_lesson function."""

    def test_valid_lesson(self, tmp_lesson_file):
        """Valid lesson file passes."""
        errors, _ = validate_lesson(tmp_lesson_file)
        assert errors == []

    def test_missing_file(self, tmp_path):
        """Missing file returns error."""
        errors, _ = validate_lesson(tmp_path / "nonexistent.md")
        assert any("not found" in e.lower() for e in errors)

    def test_empty_file(self, tmp_path):
        """Empty file returns error."""
        empty = tmp_path / "empty.md"
        empty.write_text("")
        errors, _ = validate_lesson(empty)
        assert any("empty" in e.lower() for e in errors)

    def test_no_frontmatter(self, tmp_path):
        """File without frontmatter returns error."""
        bad = tmp_path / "bad.md"
        bad.write_text("# Just a heading\n\nNo frontmatter.")
        errors, _ = validate_lesson(bad)
        assert any("frontmatter" in e.lower() for e in errors)


class TestValidateLessonMain:
    """Tests for main() function."""

    def test_main_missing_env_var(self):
        """main() returns 2 when OPENCODE_FILE_PATH is not set."""
        from validate_lesson import main
        with patch.dict(os.environ, {}, clear=True):
            assert main() == 2

    def test_main_file_not_found(self):
        """main() returns 2 when file does not exist."""
        from validate_lesson import main
        env = {"OPENCODE_FILE_PATH": "/nonexistent/file.md"}
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2

    def test_main_valid_file(self, tmp_lesson_file):
        """main() returns 0 for valid lesson file."""
        from validate_lesson import main
        env = {"OPENCODE_FILE_PATH": str(tmp_lesson_file)}
        with patch.dict(os.environ, env, clear=True):
            assert main() == 0

    def test_main_error_file(self, tmp_path):
        """main() returns 2 for invalid lesson file."""
        from validate_lesson import main
        bad = tmp_path / "bad.md"
        bad.write_text("# No frontmatter")
        env = {"OPENCODE_FILE_PATH": str(bad)}
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2

    def test_main_warning_file(self, tmp_path):
        """main() returns 1 for lesson with warnings only."""
        from validate_lesson import main
        warning_file = tmp_path / "warning.md"
        warning_file.write_text(
            '---\ntitle: "Warning Lesson"\norder: 1\n'
            'difficulty: "super-hard"\n---\n\n# Warning Lesson\n\n'
            "---\n\n## Practice Questions\n\n"
            + "\n\n".join(
                ["```question\n{}\n```" for _ in range(5)]
            )
            + "\n\n---\n\n> [!SUCCESS]\n> ### Key Takeaways\n\n- Point 1\n"
        )
        env = {"OPENCODE_FILE_PATH": str(warning_file)}
        with patch.dict(os.environ, env, clear=True):
            result = main()
            assert result in (0, 1)


class TestValidateLessonCLI:
    """CLI tests for validate_lesson.py."""

    def test_valid_lesson_subprocess(self, tmp_lesson_file):
        """Valid lesson passes subprocess execution."""
        script = str(Path(__file__).parent.parent / "scripts" / "validate_lesson.py")
        env = {**os.environ, "OPENCODE_FILE_PATH": str(tmp_lesson_file)}
        result = subprocess.run(
            [sys.executable, script],
            env=env, capture_output=True, text=True,
        )
        assert result.returncode == 0

    def test_invalid_lesson_subprocess(self, tmp_path):
        """Invalid lesson fails subprocess execution."""
        script = str(Path(__file__).parent.parent / "scripts" / "validate_lesson.py")
        bad = tmp_path / "bad.md"
        bad.write_text("# No frontmatter")
        env = {**os.environ, "OPENCODE_FILE_PATH": str(bad)}
        result = subprocess.run(
            [sys.executable, script],
            env=env, capture_output=True, text=True,
        )
        assert result.returncode == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
