#!/usr/bin/env python3
"""Generate a new lesson file from a template for NUniversity.

Deterministic script: exit 0 = success, exit 2 = error.

Generates:
- Lesson .md file with proper frontmatter and body structure
- Follows canonical lesson format from skill.md

Environment Variables:
    OPENCODE_LESSON_TITLE: Lesson title (required)
    OPENCODE_LESSON_ORDER: Lesson order number (required)
    OPENCODE_LESSON_PATH: Output file path (required)
    OPENCODE_LESSON_DIFFICULTY: Difficulty level (optional, default: intermediate)
    OPENCODE_LESSON_DURATION: Duration string (optional, default: "30 min")

Exit Codes:
    0 - Generation successful
    2 - Generation failed
"""

import os
import re
import sys
from pathlib import Path

VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}
DEFAULT_DIFFICULTY = "intermediate"
DEFAULT_DURATION = "30 min"
DEFAULT_DESCRIPTION = ""

LESSON_TEMPLATE = """---
title: "{title}"
description: "{description}"
order: {order}
duration: "{duration}"
difficulty: "{difficulty}"
---

# {title}

---

## Overview

This lesson covers the fundamentals of {title_lower}.

---

## Practice Questions

---

```question
{{
  "id": "{slug}-q1",
  "type": "multiple-choice",
  "question": "Question 1 about {title_lower}?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Explanation for question 1."
}}
```

```question
{{
  "id": "{slug}-q2",
  "type": "multiple-choice",
  "question": "Question 2 about {title_lower}?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 1,
  "explanation": "Explanation for question 2."
}}
```

```question
{{
  "id": "{slug}-q3",
  "type": "multiple-choice",
  "question": "Question 3 about {title_lower}?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 2,
  "explanation": "Explanation for question 3."
}}
```

```question
{{
  "id": "{slug}-q4",
  "type": "multiple-choice",
  "question": "Question 4 about {title_lower}?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 3,
  "explanation": "Explanation for question 4."
}}
```

```question
{{
  "id": "{slug}-q5",
  "type": "multiple-choice",
  "question": "Question 5 about {title_lower}?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Explanation for question 5."
}}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Key point 1 about {title_lower}
- Key point 2 about {title_lower}
- Key point 3 about {title_lower}
"""


def title_to_slug(title: str) -> str:
    """Convert a title to a kebab-case slug."""
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug


def generate_lesson(
    title: str,
    order: int,
    difficulty: str = DEFAULT_DIFFICULTY,
    duration: str = DEFAULT_DURATION,
    description: str = DEFAULT_DESCRIPTION,
) -> str:
    """Generate lesson file content from template.

    Returns:
        Complete lesson file content as string.
    """
    slug = title_to_slug(title)
    title_lower = title.lower()
    if not description:
        description = f"Learn about {title_lower}"

    return LESSON_TEMPLATE.format(
        title=title,
        description=description,
        order=order,
        duration=duration,
        difficulty=difficulty,
        title_lower=title_lower,
        slug=slug,
    )


def validate_inputs(
    title: str, order_str: str, path_str: str, difficulty: str, duration: str
) -> tuple[list[str], int | None, Path | None]:
    """Validate all inputs and return (errors, order, path).

    Returns:
        Tuple of (errors_list, parsed_order, parsed_path).
        If errors, order and path may be None.
    """
    errors = []

    if not title:
        errors.append("OPENCODE_LESSON_TITLE is required")

    order = None
    if not order_str:
        errors.append("OPENCODE_LESSON_ORDER is required")
    else:
        try:
            order = int(order_str)
            if order < 1:
                errors.append(f"Order must be >= 1, got {order}")
                order = None
        except ValueError:
            errors.append(f"Invalid order: '{order_str}'. Must be an integer.")

    path = None
    if not path_str:
        errors.append("OPENCODE_LESSON_PATH is required")
    else:
        path = Path(path_str)

    if difficulty and difficulty not in VALID_DIFFICULTIES:
        errors.append(
            f"Invalid difficulty: '{difficulty}'. "
            f"Must be beginner, intermediate, or advanced."
        )

    if errors:
        return errors, order, path

    return [], order, path


def main() -> int:
    """Main generation entry point."""
    title = os.environ.get("OPENCODE_LESSON_TITLE", "")
    order_str = os.environ.get("OPENCODE_LESSON_ORDER", "")
    path_str = os.environ.get("OPENCODE_LESSON_PATH", "")
    difficulty = os.environ.get("OPENCODE_LESSON_DIFFICULTY", DEFAULT_DIFFICULTY)
    duration = os.environ.get("OPENCODE_LESSON_DURATION", DEFAULT_DURATION)
    description = os.environ.get("OPENCODE_LESSON_DESCRIPTION", DEFAULT_DESCRIPTION)

    errors, order, path = validate_inputs(
        title, order_str, path_str, difficulty, duration
    )
    if errors:
        for error in errors:
            print(f"GENERATE ERROR: {error}", file=sys.stderr)
        return 2

    try:
        content = generate_lesson(title, order, difficulty, duration, description)
    except Exception as e:
        print(f"GENERATE ERROR: Cannot generate content: {e}", file=sys.stderr)
        return 2

    try:
        if path.parent and not path.parent.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
    except Exception as e:
        print(f"GENERATE ERROR: Cannot write file: {e}", file=sys.stderr)
        return 2

    print(f"GENERATE: Created lesson '{title}' at {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
