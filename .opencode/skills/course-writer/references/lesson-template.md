# Lesson Template Reference

## Read-aloud and level rules (apply to every lesson)

- **No em dashes (`—`), en dashes (`–`) or `--` in prose.** The read-aloud
  engine skips them, so the sentence loses its pause. Use a comma, semicolon,
  colon or full stop. Hyphens inside compound words (`read-only`) are fine.
- **Open with a hook**, a real situation or a surprising number. Definitions
  come after the reader has a reason to care.
- **Follow the level profile** in `skill.md`: beginner uses daily-life
  comparisons, intermediate is complete and practical, advanced is deep and
  precise.
- **Visual explanations**: a mechanism with three or more parts gets a Mermaid
  diagram; three or more options get a table or a `plot`.

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

---

## Publication-Grade Lesson Skeleton (exam-course pattern)

The validator minimum is 5 questions + 1 interactive + Key Takeaways. Publication-grade lessons (see `content/courses/aws-dea-c01/en/`) go further; use this skeleton for full course builds:

````markdown
---
title: "<Full lesson title>"
description: "<crafted, keyword-rich>"
order: 2
difficulty: "intermediate"
duration: "60 minutes"
---
# <Full lesson title>

## 1. <Teaching section: concept + table + mermaid diagram>

Prose with inline math where natural ($...$), a ```sql / ```python worked
example with real numbers, then the interactive block that drills the concept
(```matching / ```fillblank / ```dragdrop / ```plot).

<!-- Media: reference a file that exists in content/media/<course-slug>/,
     or embed a video. Pick the diagram type that fits the concept. -->
![<alt text describing the diagram for a screen reader>](/media/<course-slug>/<file>.png)

````
```video
{ "provider": "youtube", "id": "<real-video-id>", "title": "<title>" }
```
````

### 📚 Did you know?
<3+ curiosity callouts as plain bold paragraphs or TIP boxes across the lesson>

## 2. <Next teaching section>

...

> **Comparative Verdict:** <this-service/platform> vs <alternative-cloud> vs
> <self-managed/on-prem>: when the exam prefers each.

## Real-World Case Studies

### <Named company>: <one-line outcome>
<challenge / services / AWS-published metrics with source date / which domain it illustrates>

### 2026 Updates (as of October 2026)
- <3 to 6 sourced bullets: rebrands, new limits, exam-guide revisions>

⚠️ WARNING (or IMPORTANT) box with the sharpest trap for this topic.

## Practice Questions

≥10 ```question blocks (ids <prefix>-NN-q1…), scenario-style stems,
explanation names the top distractor. ≥2 interactive blocks mixed in or
right after relevant sections.

> [!SUCCESS]
> ### Key Takeaways
> 1. ...
> 2. ...
> 3. ...
````

Mandatory closers for publication-grade work:

- Bare ` ``` ` fence closers everywhere (never ` ```text ` as a closer)
- `> [!SUCCESS]` block containing the literal string `Key Takeaways` as the LAST content
- Heading matching `^## .*Practice Questions` (e.g. `## Practice Questions`, `## 2. Practice Questions: Set A`)
