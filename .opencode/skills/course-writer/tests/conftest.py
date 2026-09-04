#!/usr/bin/env python3
"""Pytest configuration for course-writer tests."""
import json
import tempfile
from pathlib import Path

import pytest


@pytest.fixture
def tmp_course_dir() -> Path:
    """Create a temporary course directory with course.json and en/ locale."""
    with tempfile.TemporaryDirectory() as tmpdir:
        course_dir = Path(tmpdir) / "test-course"
        course_dir.mkdir()
        (course_dir / "course.json").write_text(json.dumps({
            "area": "Computer Science",
            "author": "NUniversity",
            "difficulty": "beginner",
            "duration": "4 weeks",
            "icon": "code",
            "en": {
                "title": "Test Course",
                "description": "A test course for validation",
                "difficulty": "Beginner",
                "duration": "4 Weeks",
            },
            "pt": {
                "title": "Curso de Teste",
                "description": "Um curso de teste para validação",
                "difficulty": "Iniciante",
                "duration": "4 Semanas",
            },
            "es": {
                "title": "Curso de Prueba",
                "description": "Un curso de prueba para validación",
                "difficulty": "Principiante",
                "duration": "4 Semanas",
            },
        }, indent=2))
        en_dir = course_dir / "en"
        en_dir.mkdir()
        (en_dir / "01-first-lesson.md").write_text("""---
title: "First Lesson"
description: "The first lesson"
order: 1
duration: "30 min"
difficulty: "beginner"
---

# First Lesson

Content here.

---

## Practice Questions

---

```question
{
  "id": "tc-01-q1",
  "type": "multiple-choice",
  "question": "Test question?",
  "options": ["A", "B", "C", "D"],
  "correct": 0,
  "explanation": "Test."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Takeaway 1
""")
        pt_dir = course_dir / "pt"
        pt_dir.mkdir()
        (pt_dir / "01-first-lesson.md").write_text("""---
title: "Primeira Lição"
description: "A primeira lição"
order: 1
duration: "30 min"
difficulty: "beginner"
---

# Primeira Lição

Conteúdo aqui.

---

## Practice Questions

---

```question
{
  "id": "tc-01-q1",
  "type": "multiple-choice",
  "question": "Pergunta de teste?",
  "options": ["A", "B", "C", "D"],
  "correct": 0,
  "explanation": "Teste."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Takeaway 1
""")
        es_dir = course_dir / "es"
        es_dir.mkdir()
        (es_dir / "01-first-lesson.md").write_text("""---
title: "Primera Lección"
description: "La primera lección"
order: 1
duration: "30 min"
difficulty: "beginner"
---

# Primera Lección

Contenido aquí.

---

## Practice Questions

---

```question
{
  "id": "tc-01-q1",
  "type": "multiple-choice",
  "question": "¿Pregunta de prueba?",
  "options": ["A", "B", "C", "D"],
  "correct": 0,
  "explanation": "Prueba."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Takeaway 1
""")
        yield course_dir


@pytest.fixture
def tmp_lesson_file(tmp_path) -> Path:
    """Create a temporary lesson .md file with valid frontmatter."""
    lesson = tmp_path / "test-lesson.md"
    lesson.write_text("""---
title: "Test Lesson"
description: "A test lesson for validation"
order: 1
duration: "30 min"
difficulty: "beginner"
---

# Test Lesson

This is a test lesson with valid structure.

```math
{ "expression": "2 + 2 = 4", "display": true }
```

---

## Practice Questions

---

```question
{
  "id": "tl-01-q1",
  "type": "multiple-choice",
  "question": "What is 2+2?",
  "options": ["3", "4", "5", "6"],
  "correct": 1,
  "explanation": "2+2=4."
}
```

```question
{
  "id": "tl-01-q2",
  "type": "multiple-choice",
  "question": "What is 3+3?",
  "options": ["5", "6", "7", "8"],
  "correct": 1,
  "explanation": "3+3=6."
}
```

```question
{
  "id": "tl-01-q3",
  "type": "multiple-choice",
  "question": "What is 4+4?",
  "options": ["7", "8", "9", "10"],
  "correct": 1,
  "explanation": "4+4=8."
}
```

```question
{
  "id": "tl-01-q4",
  "type": "multiple-choice",
  "question": "What is 5+5?",
  "options": ["9", "10", "11", "12"],
  "correct": 1,
  "explanation": "5+5=10."
}
```

```question
{
  "id": "tl-01-q5",
  "type": "multiple-choice",
  "question": "What is 6+6?",
  "options": ["11", "12", "13", "14"],
  "correct": 1,
  "explanation": "6+6=12."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Math is useful
- Practice makes perfect
- Keep learning
""")
    return lesson


@pytest.fixture
def valid_frontmatter() -> dict:
    """Return valid lesson frontmatter dict."""
    return {
        "title": "Test Lesson",
        "description": "A test lesson",
        "order": 1,
        "duration": "30 min",
        "difficulty": "beginner",
    }


@pytest.fixture
def valid_course_json() -> dict:
    """Return valid course.json dict."""
    return {
        "area": "Computer Science",
        "author": "NUniversity",
        "difficulty": "beginner",
        "duration": "4 weeks",
        "icon": "code",
        "en": {
            "title": "Test Course",
            "description": "A test course for validation",
            "difficulty": "Beginner",
            "duration": "4 Weeks",
        },
        "pt": {
            "title": "Curso de Teste",
            "description": "Um curso de teste",
            "difficulty": "Iniciante",
            "duration": "4 Semanas",
        },
        "es": {
            "title": "Curso de Prueba",
            "description": "Un curso de prueba",
            "difficulty": "Principiante",
            "duration": "4 Semanas",
        },
    }
