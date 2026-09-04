---
name: platform-engineer
description: Guides TypeScript/Next.js development for the NUniversity platform codebase
triggers:
  - lib/**
  - src/**
  - "**/*.ts"
  - "**/*.tsx"
---

## Activation Context

Activate when the user creates, modifies, or reviews TypeScript files under `lib/` or `src/`. Understand the project conventions: Next.js App Router, static generation, GitHub Pages deployment, `gray-matter` for Markdown parsing, and `fs`/`path` for file-system data.

---

## Server vs Client Component Rules

| Directive | Usage |
|-----------|-------|
| `"use server"` | Server Actions only — never in route handlers or data functions |
| `"use client"` | Interactive components needing browser APIs, hooks, or event handlers |
| *(no directive)* | Default Server Component — prefer this unless client interactivity is required |

- Data-fetching functions in `lib/` run on the server. Never call them from `"use client"` components directly — pass data as props.
- Static data functions use `fs` and `path` at build time for SSG.

---

## TypeScript Conventions

- **Use `import type`** for type-only imports:
  ```typescript
  import type { Locale } from '@/lib/i18n/config'
  ```
- **Prefer optional chaining** (`?.`) over manual null checks.
- **Prefer nullish coalescing** (`??`) over `||` for default values.
- **No `any`** — use `unknown` and narrow with type guards.
- Export interfaces from dedicated `types.ts` files when shared across modules.
- Use `type` keyword for aliases, `interface` for object shapes.

---

## Data Function Patterns

All data functions in `lib/` follow this pattern:

```typescript
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'

const CONTENT_DIR = path.join(process.cwd(), 'content', '{category}')

export async function getContent(slug: string, locale: Locale) {
  const filePath = path.join(CONTENT_DIR, slug, `${locale}.md`)
  const fallbackPath = path.join(CONTENT_DIR, slug, 'en.md')

  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(fallbackPath)) {
      return parseContent(fallbackPath, slug)
    }
    return null
  }

  return parseContent(filePath, slug)
}
```

### Key patterns:

- Use `process.cwd()` for absolute paths — never relative paths.
- **Locale fallback**: try `{locale}.md` first, fall back to `en.md`.
- Parse Markdown frontmatter with `matter(fileContents)`.
- Return typed interfaces — never raw `any`.
- Handle missing files gracefully (return `null` or empty array).

---

## Testing Requirements

- Test setup file: `src/test-setup.ts`
- Run tests with the project's configured test runner.
- Write unit tests for data functions in `lib/` — mock `fs` and `path` where needed.
- Write component tests for interactive UI components.
- Aim for coverage of critical paths: content loading, locale fallback, game data parsing.

---

## Import Conventions

- Use `@/` path alias for project imports (maps to project root).
- Group imports: external libraries first, then `@/` internal imports.
- Separate type imports from value imports.
