---
name: i18n-translator
description: Handles dictionary and content localization for the NUniversity platform
triggers:
  - dictionaries/**
  - "**/*.json" (when editing translation values)
  - content/localization
---

## Activation Context

Activate when the user requests translation of dictionary files under `dictionaries/`, localization of content files, or locale-related changes to the platform. Understand the dictionary structure loaded by `lib/i18n/get-dictionary.ts`.

---

## Supported Locales

| Code | Language |
|------|----------|
| `en` | English (source / fallback) |
| `pt` | Portuguese |
| `es` | Spanish |

---

## Dictionary Structure Rules

Dictionaries live at `dictionaries/{locale}.json` and are flat-keyed JSON objects.

- **Keep all keys identical** across locale files — never add, remove, or rename keys.
- **Only translate string values** — numbers, booleans, and `null` remain unchanged.
- Preserve the exact JSON structure (nesting, arrays, object order).
- Do not add comments or trailing commas.
- If a key does not exist in the target locale, it must fall back to `en` at runtime (handled by `getDictionary`).

### Example

```json
// dictionaries/en.json
{ "about": { "hero": { "title": "About Us" } } }

// dictionaries/pt.json
{ "about": { "hero": { "title": "Sobre Nós" } } }
```

---

## Content Localization Rules

When translating Markdown course lessons or game JSON files:

- **Preserve Markdown formatting** — headings, code fences, links, admonition syntax must remain intact.
- **Keep code blocks in English** — translate comments inside code only if explicitly requested.
- **Preserve YAML frontmatter structure** — translate `title` and `description` values; keep all other keys untouched.
- **Preserve JSON structure** — translate only user-facing string values in game files (questions, explanations, words).
- **Keep technical identifiers** (slugs, IDs, file names, route paths) in English.

---

## Locale Fallback Behavior

At runtime, `lib/i18n/get-dictionary.ts` resolves locale to dictionary:

```typescript
const getDictionary = (locale: Locale) => {
  return dictionaries[locale] || dictionaries.en
}
```

- If a locale is not `en`, `pt`, or `es`, English is used as fallback.
- All three dictionary files must always have identical key structures.
- When adding a new key, add it to **all three** locale files in the same commit.

---

## Validation Checklist

Before committing dictionary or locale changes:

1. Run `npx tsc --noEmit` to verify no type errors in locale imports.
2. Verify all three `dictionaries/*.json` files parse as valid JSON.
3. Confirm key structures match across all locales (spot-check or script).
4. Ensure no untranslated keys were added only to `en.json`.
