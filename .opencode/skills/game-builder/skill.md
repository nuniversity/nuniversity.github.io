---
name: game-builder
description: Generates publication-ready JSON game files (quiz and vocabulary) for the NUniversity platform
triggers:
  - content/games/**
---

## Activation Context

Activate when the user requests creation or editing of game content files under `content/games/`. Load the full agent prompt from `agents/GAME-BUILDER-AGENT-PROMPT.md` for authoritative schema details and message templates.

---

## Supported Game Types

| Type | Category Value | JSON Top-Level Key | Purpose |
|---|---|---|---|
| **Quiz** | `quiz` | `questions` | Multiple-choice Q&A for certification prep and knowledge testing |
| **Vocabulary** | `vocabulary` | `words` | Translation / word-matching for language learning |

---

## Output Format Rules

- Files are **pure JSON** — no trailing commas, no comments, no YAML.
- Stored at: `content/games/{category}/{slug}.json`
- Every item must have a **sequential string `id`** starting from `"1"`.
- No duplicate IDs within a file.

### Quiz Schema

```json
{
  "id": "slug",
  "title": "Game Title",
  "description": "Brief description",
  "difficulty": "beginner",
  "category": "quiz",
  "questions": [
    {
      "id": "1",
      "domain": "domain-label",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Why the answer is correct."
    }
  ]
}
```

- `correct`: zero-based index into `options`.
- Every question must have an `explanation`.

### Vocabulary Schema

```json
{
  "id": "slug",
  "title": "Game Title",
  "description": "Brief description",
  "difficulty": "beginner",
  "category": "vocabulary",
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

---

## Quality Rules

- **Quiz**: minimum 10 questions per game. Use scenario-based questions where possible — avoid pure recall.
- **Vocabulary**: minimum 15 words per game.
- Every question/word must include an **educational explanation or context** field.
- Questions should test understanding, not just memorization. Prefer applied scenarios.
- Cover a representative spread of difficulty within the chosen level.

---

## Locale Handling

- Game files are language-agnostic in structure but localized via `language_pair` (vocabulary) or question text (quiz).
- Supported locales for quiz content translation: `en`, `pt`, `es`.
- When translating, keep technical terms, proper nouns, and code in English.

---

## Reference

For the full agent prompt with user message templates and advanced instructions, see:
`agents/GAME-BUILDER-AGENT-PROMPT.md`
