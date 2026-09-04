#!/usr/bin/env python3
"""Tests for generate_lesson.py script."""
import os
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from generate_lesson import (
    title_to_slug,
    generate_lesson,
    validate_inputs,
)


class TestTitleToSlug:
    """Tests for title_to_slug function."""

    def test_simple_title(self):
        """Simple title converts to slug."""
        assert title_to_slug("My Lesson") == "my-lesson"

    def test_multiple_words(self):
        """Multi-word title converts to slug."""
        result = title_to_slug("Introduction to Programming")
        assert result == "introduction-to-programming"

    def test_special_characters(self):
        """Special characters are removed."""
        assert title_to_slug("C++ Programming!") == "c-programming"

    def test_multiple_hyphens(self):
        """Multiple hyphens are collapsed."""
        assert title_to_slug("My   Lesson") == "my-lesson"

    def test_leading_trailing_spaces(self):
        """Leading/trailing spaces are trimmed."""
        assert title_to_slug("  My Lesson  ") == "my-lesson"


class TestGenerateLesson:
    """Tests for generate_lesson function."""

    def test_valid_lesson(self):
        """Valid parameters produce lesson content."""
        content = generate_lesson("Test Lesson", 1)
        assert "---" in content
        assert 'title: "Test Lesson"' in content
        assert "order: 1" in content
        assert "# Test Lesson" in content
        assert "## Practice Questions" in content
        assert "```question" in content
        assert "Key Takeaways" in content

    def test_custom_difficulty(self):
        """Custom difficulty is included."""
        content = generate_lesson("Advanced Topic", 3, difficulty="advanced")
        assert 'difficulty: "advanced"' in content

    def test_custom_duration(self):
        """Custom duration is included."""
        content = generate_lesson("Long Lesson", 1, duration="2 hours")
        assert 'duration: "2 hours"' in content

    def test_default_values(self):
        """Default difficulty and duration are used."""
        content = generate_lesson("Default Lesson", 1)
        assert 'difficulty: "intermediate"' in content
        assert 'duration: "30 min"' in content

    def test_custom_description(self):
        """Custom description is included."""
        content = generate_lesson("Described Lesson", 1, description="Custom desc")
        assert 'description: "Custom desc"' in content

    def test_default_description(self):
        """Default description includes title."""
        content = generate_lesson("My Topic", 1)
        assert "learn about my topic" in content.lower()

    def test_five_practice_questions(self):
        """Generated lesson has 5 practice questions."""
        content = generate_lesson("Test", 1)
        assert content.count("```question") == 5


class TestValidateInputs:
    """Tests for validate_inputs function."""

    def test_valid_inputs(self):
        """Valid inputs return no errors."""
        errors, order, path = validate_inputs(
            "Test", "1", "/tmp/t.md", "beginner", "30 min"
        )
        assert errors == []
        assert order == 1
        assert path == Path("/tmp/t.md")

    def test_missing_title(self):
        """Missing title returns error."""
        errors, _, _ = validate_inputs("", "1", "/tmp/t.md", "beginner", "30 min")
        assert any("title" in e.lower() for e in errors)

    def test_missing_order(self):
        """Missing order returns error."""
        errors, _, _ = validate_inputs("Test", "", "/tmp/t.md", "beginner", "30 min")
        assert any("order" in e.lower() for e in errors)

    def test_invalid_order(self):
        """Non-integer order returns error."""
        errors, _, _ = validate_inputs(
            "Test", "abc", "/tmp/t.md", "beginner", "30 min"
        )
        assert any("integer" in e.lower() for e in errors)

    def test_order_less_than_one(self):
        """Order < 1 returns error."""
        errors, order, _ = validate_inputs(
            "Test", "0", "/tmp/t.md", "beginner", "30 min"
        )
        assert any(">= 1" in e for e in errors)
        assert order is None

    def test_missing_path(self):
        """Missing path returns error."""
        errors, _, _ = validate_inputs("Test", "1", "", "beginner", "30 min")
        assert any("path" in e.lower() for e in errors)

    def test_invalid_difficulty(self):
        """Invalid difficulty returns error."""
        errors, _, _ = validate_inputs(
            "Test", "1", "/tmp/t.md", "super-hard", "30 min"
        )
        assert any("difficulty" in e.lower() for e in errors)


class TestGenerateLessonMain:
    """Tests for main() function."""

    def test_main_missing_env_var(self):
        """main() returns 2 when env vars are not set."""
        from generate_lesson import main
        with patch.dict(os.environ, {}, clear=True):
            assert main() == 2

    def test_main_missing_title(self):
        """main() returns 2 when title is missing."""
        from generate_lesson import main
        env = {
            "OPENCODE_LESSON_TITLE": "",
            "OPENCODE_LESSON_ORDER": "1",
            "OPENCODE_LESSON_PATH": "/tmp/t.md",
        }
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2

    def test_main_missing_order(self):
        """main() returns 2 when order is missing."""
        from generate_lesson import main
        env = {
            "OPENCODE_LESSON_TITLE": "Test",
            "OPENCODE_LESSON_ORDER": "",
            "OPENCODE_LESSON_PATH": "/tmp/t.md",
        }
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2

    def test_main_missing_path(self):
        """main() returns 2 when path is missing."""
        from generate_lesson import main
        env = {
            "OPENCODE_LESSON_TITLE": "Test",
            "OPENCODE_LESSON_ORDER": "1",
            "OPENCODE_LESSON_PATH": "",
        }
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2

    def test_main_valid_generation(self, tmp_path):
        """main() succeeds with valid parameters."""
        from generate_lesson import main
        output = tmp_path / "output.md"
        env = {
            "OPENCODE_LESSON_TITLE": "Generated Lesson",
            "OPENCODE_LESSON_ORDER": "1",
            "OPENCODE_LESSON_PATH": str(output),
            "OPENCODE_LESSON_DIFFICULTY": "beginner",
            "OPENCODE_LESSON_DURATION": "45 min",
        }
        with patch.dict(os.environ, env, clear=True):
            assert main() == 0
            assert output.exists()
            content = output.read_text()
            assert 'title: "Generated Lesson"' in content
            assert 'difficulty: "beginner"' in content
            assert 'duration: "45 min"' in content

    def test_main_invalid_difficulty(self, tmp_path):
        """main() returns 2 for invalid difficulty."""
        from generate_lesson import main
        output = tmp_path / "output.md"
        env = {
            "OPENCODE_LESSON_TITLE": "Test",
            "OPENCODE_LESSON_ORDER": "1",
            "OPENCODE_LESSON_PATH": str(output),
            "OPENCODE_LESSON_DIFFICULTY": "invalid",
        }
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2


class TestGenerateLessonCLI:
    """CLI tests for generate_lesson.py."""

    def test_valid_generation_subprocess(self, tmp_path):
        """Valid generation passes subprocess execution."""
        script = str(Path(__file__).parent.parent / "scripts" / "generate_lesson.py")
        output = tmp_path / "subprocess.md"
        env = {
            **os.environ,
            "OPENCODE_LESSON_TITLE": "Subprocess Test",
            "OPENCODE_LESSON_ORDER": "2",
            "OPENCODE_LESSON_PATH": str(output),
        }
        result = subprocess.run(
            [sys.executable, script],
            env=env, capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert output.exists()

    def test_invalid_generation_subprocess(self):
        """Invalid generation fails subprocess execution."""
        script = str(Path(__file__).parent.parent / "scripts" / "generate_lesson.py")
        result = subprocess.run(
            [sys.executable, script],
            env={**os.environ},
            capture_output=True, text=True,
        )
        assert result.returncode == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
