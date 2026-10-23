---
name: game-builder
description: Generates publication-ready language activity (vocabulary) JSON files for the NUniversity Languages app
triggers:
  - content/languages/**
---

## Activation Context

Activate when the user requests creation or editing of language activity content files under `content/languages/`. Load the full agent prompt from `agents/GAME-BUILDER-AGENT-PROMPT.md` for authoritative schema details and message templates.

---

## Supported Content Types

| Type | Category Value | JSON Top-Level Key | Purpose |
|---|---|---|---|
| **Language activity** | `vocabulary` | `words` | Flashcards / translation-quiz practice for language learning |

Path: `content/languages/vocabulary/{slug}.json` (Languages app, see `docs/assessment/2026-app-review/DESIGN-LANGUAGES-APP.md`).

Certification quizzes live in `content/quizzes/` (Quizzes app) and other games live in `content/games/{category}/` (Games app) — neither is authored with this skill.

---

## Output Format Rules

- Files are **pure JSON** — no trailing commas, no comments, no YAML.
- Stored at: `content/languages/vocabulary/{slug}.json`
- `id` must equal the filename without `.json` (enforced by the validator).
- Every word must have a **sequential string `id`** starting from `"1"`.
- No duplicate IDs and no duplicate word rows within a file.

### Activity Schema

```json
{
  "id": "slug",
  "title": "Activity Title",
  "description": "Brief description",
  "difficulty": "beginner",
  "category": "vocabulary",
  "gameType": "matching",
  "language_pair": { "source": "en", "target": "pt" },
  "words": [
    {
      "id": "1",
      "source": "Hello",
      "target": "Olá",
      "context": "greeting"
    }
  ]
}
```

`gameType` is optional — defaults to `matching` (translation quiz); use `flashcards` for the spaced-repetition player.

---

## Quality Rules

- **Minimum 40 words per activity** (validator-enforced; aim for 50–300).
- Every word must include an **educational context** field.
- Cover a representative spread of difficulty within the chosen level.
- Validate before finishing:

```bash
OPENCODE_FILE_PATH=content/languages/vocabulary/{slug}.json python .opencode/hooks/validate-languages/scripts/validate_languages.py
```

---

## Locale Handling

- Activity files are language-agnostic in structure but localized via `language_pair`.
- `locales` blocks may localize `title`/`description`/`sourceLanguage`/`targetLanguage`/`contextLabels` — word-pair content itself is learning material and is **not translated**.
- When translating chrome, keep technical terms, proper nouns, and code in English.

---

## Reference

For the full agent prompt with user message templates and advanced instructions, see:
`agents/GAME-BUILDER-AGENT-PROMPT.md`
