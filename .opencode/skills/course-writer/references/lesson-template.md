# Lesson Template Reference

## File Structure

Every lesson file follows this exact structure:

```yaml
---
title: "Lesson Title"
description: "Concise description for SEO and course listing (1-2 sentences)"
order: 1
duration: "30 min"
difficulty: "beginner" | "intermediate" | "advanced"
---

# Lesson Title

---

## Overview

Brief introduction to what this lesson covers.

---

## Practice Questions

---

```question
{
  "id": "course-slug-q1",
  "type": "multiple-choice",
  "question": "Question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Explanation of the correct answer."
}
```

---

> [!SUCCESS]
> ### Key Takeaways

- Key point 1
- Key point 2
- Key point 3
```

## Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `title` | Yes | string | Lesson title (must match H1) |
| `order` | Yes | integer | Sequence number (1-indexed) |
| `description` | No | string | SEO description |
| `duration` | No | string | Estimated duration |
| `difficulty` | No | string | beginner, intermediate, advanced |

## Body Sections

| Section | Required | Notes |
|---------|----------|-------|
| H1 heading | Yes | Must match `title` exactly |
| Content sections | Yes | Use `##` for major sections |
| Practice Questions | Yes | Minimum 5 `question` code blocks |
| Key Takeaways | Yes | Use `> [!SUCCESS]` admonition |

## Practice Question Format

Each question is a fenced code block with `question` language ID:

````
```question
{
  "id": "unique-id",
  "type": "multiple-choice",
  "question": "Question text?",
  "options": ["A", "B", "C", "D"],
  "correct": 0,
  "explanation": "Why this answer is correct."
}
```
````

## Naming Convention

Lesson files: `{NN}-{kebab-case}.md`

- `NN` = two-digit order number (01, 02, 03...)
- `kebab-case` = slug derived from title

Examples:
- `01-foundations-of-agent-memory.md`
- `02-vector-stores-embeddings-and-rag-architecture.md`
