---
name: course-writer
description: Generates and validates publication-ready Markdown course lesson files for the NUniversity platform with deterministic quality checks
triggers:
  - content/courses/**
---

## Activation Context

Activate when the user requests creation or editing of course lesson files under `content/courses/`. Load the full agent prompt from `agents/COURSE-WRITER-AGENT-PROMPT.md` for authoritative formatting rules and message templates.

---

## Instructions

When activated, follow these steps:

1. **Identify the course context** — Determine which course and locale the user is working with.
2. **Validate existing content** — Run validation scripts to check for issues:
   ```bash
   OPENCODE_FILE_PATH=<path-to-lesson.md> python scripts/validate_lesson.py
   OPENCODE_SKILL_DIR=<path-to-course-dir> python scripts/validate_course.py
   ```
3. **Generate new content** — Use generate_lesson.py to scaffold new lessons:
   ```bash
   OPENCODE_LESSON_TITLE="Lesson Title" OPENCODE_LESSON_ORDER=1 OPENCODE_LESSON_PATH=<output-path> python scripts/generate_lesson.py
   ```
4. **Follow the lesson structure** — Ensure all sections are present: frontmatter, H1, content sections, practice questions (min 5), key takeaways.
5. **Validate before saving** — Always run validate_lesson.py after creating or editing a lesson.
6. **Maintain locale consistency** — When translating, keep code/technical identifiers in English. Only translate prose and frontmatter title/description values.

---

## Output Format Rules

Every lesson file is a single Markdown document with YAML frontmatter. The structure must follow this exact order:

### 1. YAML Frontmatter (required)

```yaml
---
title: "Lesson Title"
description: "Concise description for SEO and course listing (1-2 sentences)"
order: 1
duration: "45 minutes"
difficulty: "beginner" | "intermediate" | "advanced"
---
```

- `order`: integer controlling lesson sequence within the course (1-indexed).
- `difficulty`: one of `beginner`, `intermediate`, `advanced`.
- `duration`: human-readable estimate (e.g., "30 minutes", "1 hour").

### 2. Body Content

- H1 (`#`) must match the frontmatter `title`.
- Use `##` for major sections, `###` for subsections.

### 3. Code Block Rules

**CRITICAL:** Opening and closing fences have different rules:

- **Opening fences:** Include a language identifier: ` ```python `, ` ```sql `, ` ```text `, ` ```matching `, etc.
- **Closing fences:** Must be BARE ` ``` ` with NO text after them. Never ` ```text ` as a closing fence.

```markdown
# Correct — opening has language, closing is bare:
```text
Some plain text content here
```

# Correct — interactive block:
```matching
{ "question": "...", "pairs": [...] }
```

# WRONG — closing fence has "text" (breaks JSON parsing):
```matching
{ "question": "...", "pairs": [...] }
```text

# WRONG — closing fence has "text" (breaks rendering):
```text
Some content
```text
```

> [!WARNING]
> Never use ` ```text ` as a closing fence. This is the #1 cause of "Invalid matching config" and "Invalid question format" JSON errors. The closing fence must always be bare ` ``` `.

### 4. Math Formulas

Use standard LaTeX notation with `$$` and `$` delimiters. Do NOT use ` ```math ` JSON format.

```markdown
# Display math (centered, on its own line):
$$
\frac{a}{b} = c
$$

# Inline math (within text):
The formula $a^2 + b^2 = c^2$ is the Pythagorean theorem.
```

**LaTeX escape rules:** Use single backslashes in `$$` notation (not double like in JSON). Common commands: `\frac{a}{b}`, `\sqrt{x}`, `\int`, `\sum`, `\vec{F}`, `\alpha`, `\beta`.

### 5. Plain Text Code Blocks

For code blocks with plain text content (no syntax highlighting), use ` ```text ` for the OPENING fence:

```markdown
```text
||| = 3
⊏ = 10
⊏ | = 11
```
```

---

## Quality Rules

- **Minimum 5 practice questions** per lesson, placed in a "Practice Questions" section near the end.
- **Warning boxes** using GitHub-flavored admonition syntax:
  ```
  > [!WARNING]
  > Content here.
  ```
- **Key takeaways** section at the end summarizing the 3-5 most important points.
- Content must be accurate, exam-prepared, and technically precise.
- Write for learners preparing for professional certifications.

---

## Interactive Components

The platform supports 6 interactive component types. When generating STEM lessons (Math, Physics, Chemistry, Biology, Engineering), include at least 2 interactive components per lesson.

### Available Types

| Tag | Component | Use When |
|-----|-----------|----------|
| `phet` | PhET simulations | Demonstrating physics/chemistry concepts visually |
| `plot` | Interactive charts | Showing data trends, relationships, comparisons |
| `molecule` | 3D molecular viewer | Teaching chemistry, biochemistry, molecular structure |
| `dragdrop` | Ordering quiz | Teaching sequences, steps, procedures |
| `matching` | Matching pairs | Teaching associations, definitions, classifications |
| `fillblank` | Fill-in-the-blank | Teaching key terms, formulas, definitions |

> [!NOTE]
> For math formulas, use `$$` notation (display math) or `$` notation (inline math) instead of interactive components. See "Math Formulas" section above.

### Rules

- STEM lessons: minimum 2 interactive components, maximum 3
- Non-STEM lessons: interactive components are optional
- Always include an `explanation` field in quiz configs (dragdrop, matching, fillblank)
- Place interactive components after the text that explains the concept
- Vary component types across lessons — don't repeat the same type in consecutive lessons

### Syntax

Each component uses a fenced code block with a language identifier and JSON config. The closing fence MUST be bare ` ``` `:

````markdown
```matching
{
  "question": "Match the terms with their definitions",
  "pairs": [
    {"left": "Term 1", "right": "Definition 1"},
    {"left": "Term 2", "right": "Definition 2"}
  ],
  "explanation": "Explanation of the correct matches."
}
```
````

```markdown
# Question block example:
```question
{
  "id": "unique-id",
  "type": "multiple-choice",
  "question": "What is the capital of France?",
  "options": ["London", "Berlin", "Paris", "Madrid"],
  "correct": 2,
  "explanation": "Paris is the capital of France."
}
```
```

See `references/guide.md` for full JSON schemas and examples.

---

## Locale Handling

- Content is stored per locale: `content/courses/{course-slug}/{lang}/`
- Supported locales: `en`, `pt`, `es`
- **Course discovery requires:** A course must have either an `en/` directory OR a locale-specific directory to appear in the course listing. Without `en/`, the course won't appear for English users.
- When translating, translate the prose but keep code, variable names, and technical identifiers in English.
- Preserve all YAML frontmatter keys; only translate `title` and `description` values.

---

## GitHub Pages Deployment

If deploying to GitHub Pages:

1. **Add `.nojekyll` file** to the repository root to prevent Jekyll from processing markdown files
2. **Configure Pages source** to "GitHub Actions" (not "Deploy from a branch")
3. **For Jinja/Liquid syntax** in content (e.g., dbt courses), wrap code blocks in `{% raw %}...{% endraw %}`:
   ```markdown
   {% raw %}
   ```sql
   {{ config(materialized='table') }}
   SELECT * FROM {{ ref('stg_orders') }}
   ```
   {% endraw %}
   ```

---

## Reference

### Agent Prompt

For the full agent prompt with user message templates and advanced instructions, see:
`agents/COURSE-WRITER-AGENT-PROMPT.md`

### Internal References

- `references/guide.md` — Course structure and lesson format guide
- `references/course-json-schema.md` — course.json schema documentation
- `references/lesson-template.md` — Lesson file template reference

### Examples

- `examples/valid-lesson.md` — Valid lesson file example
- `examples/invalid-lesson.md` — Invalid lesson file (documents errors)
- `examples/valid-course.json` — Valid course.json example
