#!/usr/bin/env python3
"""Tests for validate_course.py script."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from validate_course import (
    validate_course_json,
    validate_lesson_naming,
    validate_directory_structure,
)


class TestValidateCourseJson:
    """Tests for validate_course_json function."""

    def test_valid_course_json(self, valid_course_json):
        """Valid course.json returns no errors."""
        errors, _ = validate_course_json(valid_course_json)
        assert errors == []

    def test_missing_area(self, valid_course_json):
        """Missing area returns error."""
        valid_course_json["area"] = ""
        errors, _ = validate_course_json(valid_course_json)
        assert any("area" in e.lower() for e in errors)

    def test_missing_en_title(self, valid_course_json):
        """Missing en.title returns error."""
        valid_course_json["en"]["title"] = ""
        errors, _ = validate_course_json(valid_course_json)
        assert any("en.title" in e.lower() for e in errors)

    def test_missing_en_description(self, valid_course_json):
        """Missing en.description returns error."""
        valid_course_json["en"]["description"] = ""
        errors, _ = validate_course_json(valid_course_json)
        assert any("en.description" in e.lower() for e in errors)

    def test_difficulty_not_lowercase(self, valid_course_json):
        """Difficulty not lowercase returns error."""
        valid_course_json["difficulty"] = "Intermediate"
        errors, _ = validate_course_json(valid_course_json)
        assert any("difficulty" in e.lower() for e in errors)

    def test_en_difficulty_not_capitalized(self, valid_course_json):
        """en.difficulty not capitalized returns error."""
        valid_course_json["en"]["difficulty"] = "intermediate"
        errors, _ = validate_course_json(valid_course_json)
        assert any("en.difficulty" in e.lower() for e in errors)

    def test_valid_difficulties(self, valid_course_json):
        """Valid difficulty values return no errors."""
        for diff in ("beginner", "intermediate", "advanced"):
            valid_course_json["difficulty"] = diff
            errors, _ = validate_course_json(valid_course_json)
            assert not any("difficulty" in e.lower() for e in errors)

    def test_empty_author_warning(self, valid_course_json):
        """Empty author returns warning."""
        valid_course_json["author"] = ""
        _, warnings = validate_course_json(valid_course_json)
        assert any("author" in w.lower() for w in warnings)

    def test_empty_duration_warning(self, valid_course_json):
        """Empty duration returns warning."""
        valid_course_json["duration"] = ""
        _, warnings = validate_course_json(valid_course_json)
        assert any("duration" in w.lower() for w in warnings)

    def test_missing_locale_warning(self, valid_course_json):
        """Missing locale section returns warning."""
        del valid_course_json["pt"]
        _, warnings = validate_course_json(valid_course_json)
        assert any("pt" in w.lower() for w in warnings)

    def test_missing_locale_title_warning(self, valid_course_json):
        """Missing locale title returns warning."""
        valid_course_json["pt"]["title"] = ""
        _, warnings = validate_course_json(valid_course_json)
        assert any("pt.title" in w.lower() for w in warnings)


class TestValidateLessonNaming:
    """Tests for validate_lesson_naming function."""

    def test_valid_naming(self):
        """Valid lesson names pass."""
        files = [Path("01-first.md"), Path("02-second.md")]
        errors, _ = validate_lesson_naming(files)
        assert errors == []

    def test_invalid_naming(self):
        """Invalid lesson names return error."""
        files = [Path("first.md"), Path("02-second.md")]
        errors, _ = validate_lesson_naming(files)
        assert any("naming" in e.lower() for e in errors)

    def test_non_sequential_orders(self):
        """Non-sequential orders return error."""
        files = [Path("01-first.md"), Path("03-third.md")]
        errors, _ = validate_lesson_naming(files)
        assert any("non-sequential" in e.lower() for e in errors)

    def test_empty_files_warning(self):
        """Empty file list returns warning."""
        _, warnings = validate_lesson_naming([])
        assert any("no lesson" in w.lower() for w in warnings)

    def test_valid_naming_with_hyphens(self):
        """Valid naming with hyphens in slug."""
        files = [Path("01-my-complex-topic.md")]
        errors, _ = validate_lesson_naming(files)
        assert errors == []


class TestValidateDirectoryStructure:
    """Tests for validate_directory_structure function."""

    def test_valid_course(self, tmp_course_dir):
        """Valid course directory passes."""
        errors, _ = validate_directory_structure(tmp_course_dir)
        assert errors == []

    def test_missing_course_json(self, tmp_path):
        """Missing course.json returns error."""
        course_dir = tmp_path / "no-json"
        course_dir.mkdir()
        errors, _ = validate_directory_structure(course_dir)
        assert any("course.json" in e.lower() for e in errors)

    def test_empty_locale_dir_warning(self, tmp_path):
        """Empty locale directory returns warning."""
        course_dir = tmp_path / "empty-locale"
        course_dir.mkdir()
        (course_dir / "course.json").write_text(json.dumps({
            "area": "Test",
            "en": {"title": "Test", "description": "Test"},
        }))
        en_dir = course_dir / "en"
        en_dir.mkdir()
        _, warnings = validate_directory_structure(course_dir)
        assert any("no lesson" in w.lower() for w in warnings)

    def test_invalid_lesson_naming(self, tmp_path):
        """Invalid lesson naming returns error."""
        course_dir = tmp_path / "bad-naming"
        course_dir.mkdir()
        (course_dir / "course.json").write_text(json.dumps({
            "area": "Test",
            "en": {"title": "Test", "description": "Test"},
        }))
        en_dir = course_dir / "en"
        en_dir.mkdir()
        (en_dir / "bad-name.md").write_text("# Bad")
        errors, _ = validate_directory_structure(course_dir)
        assert any("naming" in e.lower() for e in errors)

    def test_invalid_json(self, tmp_path):
        """Invalid course.json returns error."""
        course_dir = tmp_path / "bad-json"
        course_dir.mkdir()
        (course_dir / "course.json").write_text("{invalid json}")
        errors, _ = validate_directory_structure(course_dir)
        assert any("invalid" in e.lower() or "json" in e.lower() for e in errors)

    def test_non_sequential_orders(self, tmp_path):
        """Non-sequential lesson orders return error."""
        course_dir = tmp_path / "seq"
        course_dir.mkdir()
        (course_dir / "course.json").write_text(json.dumps({
            "area": "Test",
            "en": {"title": "Test", "description": "Test"},
        }))
        en_dir = course_dir / "en"
        en_dir.mkdir()
        (en_dir / "01-first.md").write_text("# First")
        (en_dir / "03-third.md").write_text("# Third")
        errors, _ = validate_directory_structure(course_dir)
        assert any("non-sequential" in e.lower() for e in errors)


class TestValidateCourseMain:
    """Tests for main() function."""

    def test_main_missing_env_var(self):
        """main() returns 2 when OPENCODE_SKILL_DIR is not set."""
        from validate_course import main
        with patch.dict(os.environ, {}, clear=True):
            assert main() == 2

    def test_main_dir_not_found(self):
        """main() returns 2 when directory does not exist."""
        from validate_course import main
        env = {"OPENCODE_SKILL_DIR": "/nonexistent/dir"}
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2

    def test_main_not_a_dir(self):
        """main() returns 2 when path is a file."""
        from validate_course import main
        with tempfile.NamedTemporaryFile(delete=False) as f:
            env = {"OPENCODE_SKILL_DIR": f.name}
            try:
                with patch.dict(os.environ, env, clear=True):
                    assert main() == 2
            finally:
                os.unlink(f.name)

    def test_main_valid_course(self, tmp_course_dir):
        """main() returns 0 for valid course directory."""
        from validate_course import main
        env = {"OPENCODE_SKILL_DIR": str(tmp_course_dir)}
        with patch.dict(os.environ, env, clear=True):
            assert main() == 0

    def test_main_invalid_course(self, tmp_path):
        """main() returns 2 for invalid course directory."""
        from validate_course import main
        bad_dir = tmp_path / "bad-course"
        bad_dir.mkdir()
        env = {"OPENCODE_SKILL_DIR": str(bad_dir)}
        with patch.dict(os.environ, env, clear=True):
            assert main() == 2


class TestValidateCourseCLI:
    """CLI tests for validate_course.py."""

    def test_valid_course_subprocess(self, tmp_course_dir):
        """Valid course passes subprocess execution."""
        script = str(Path(__file__).parent.parent / "scripts" / "validate_course.py")
        env = {**os.environ, "OPENCODE_SKILL_DIR": str(tmp_course_dir)}
        result = subprocess.run(
            [sys.executable, script],
            env=env, capture_output=True, text=True,
        )
        assert result.returncode == 0

    def test_invalid_course_subprocess(self, tmp_path):
        """Invalid course fails subprocess execution."""
        script = str(Path(__file__).parent.parent / "scripts" / "validate_course.py")
        bad_dir = tmp_path / "bad-course"
        bad_dir.mkdir()
        env = {**os.environ, "OPENCODE_SKILL_DIR": str(bad_dir)}
        result = subprocess.run(
            [sys.executable, script],
            env=env, capture_output=True, text=True,
        )
        assert result.returncode == 2


class TestSkillTaxonomy:
    """Optional course-level skills taxonomy (learning engine)."""

    def test_valid_taxonomy(self, valid_course_json):
        valid_course_json["skills"] = ["sql-basics", "joins"]
        errors, _ = validate_course_json(valid_course_json)
        assert errors == []

    def test_taxonomy_must_be_list_of_strings(self, valid_course_json):
        valid_course_json["skills"] = "sql-basics"
        errors, _ = validate_course_json(valid_course_json)
        assert any("skills" in e for e in errors)

    def test_duplicate_taxonomy_warns(self, valid_course_json):
        valid_course_json["skills"] = ["a", "a"]
        errors, warnings = validate_course_json(valid_course_json)
        assert errors == []
        assert any("duplicate" in w.lower() for w in warnings)

    def _course_with_taxonomy(self, tmp_path, lesson_skills):
        course_dir = tmp_path / "tax"
        course_dir.mkdir()
        (course_dir / "course.json").write_text(json.dumps({
            "area": "Test",
            "skills": ["sql-basics"],
            "en": {"title": "Test", "description": "Test"},
        }))
        en_dir = course_dir / "en"
        en_dir.mkdir()
        skill_lines = "\n".join(f"  - {skill}" for skill in lesson_skills)
        (en_dir / "01-first.md").write_text(
            f'---\ntitle: "First"\norder: 1\nskills:\n{skill_lines}\n---\n\n# First\n'
        )
        return course_dir

    def test_unknown_lesson_skill_warns(self, tmp_path):
        course_dir = self._course_with_taxonomy(tmp_path, ["joins"])
        _, warnings = validate_directory_structure(course_dir)
        assert any("joins" in w and "taxonomy" in w for w in warnings)

    def test_known_lesson_skill_is_clean(self, tmp_path):
        course_dir = self._course_with_taxonomy(tmp_path, ["sql-basics"])
        _, warnings = validate_directory_structure(course_dir)
        assert not any("taxonomy" in w for w in warnings)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
