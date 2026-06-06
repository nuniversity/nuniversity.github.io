# Testing Plan

## Overview

Add a complete suite of unit tests and integration tests using **Vitest**, **@testing-library/react**, and **Husky** pre-commit hooks to the NUniversity Next.js 14 static site.

## Current State

- **Vitest** configured with jsdom environment, `@/` path alias, v8 coverage
- **src/test-setup.ts** imports `@testing-library/jest-dom/vitest`
- **Husky v9** pre-commit hook runs `lint-staged`
- **lint-staged** runs `vitest related --run` then `eslint --fix` on staged `.ts/.tsx`
- **13 initial tests** covering `lib/i18n/config.ts` and `lib/i18n/get-dictionary.ts` — all passing

---

## Project Architecture

```
app/[lang]/         → Dynamic locale pages (en, pt, es)
components/         → Shared React components
  roadmaps/         → Roadmap timeline + step card (client-side, localStorage)
  tools/            → 10 interactive tools (complex business logic, browser APIs)
  home/             → Landing page sections (framer-motion heavy)
  layout/           → Header (client) + Footer (server)
  contacts/         → Contact form (Formspree API)
  providers/        → Theme context (localStorage + matchMedia)
  language/         → Language switcher (next/navigation)
  markdown/         → Markdown renderer + question blocks
lib/                → Server-only data fetching (fs, path, gray-matter)
  roadmaps/         → Content parsing for roadmaps
  courses/          → Content parsing for courses
  tools/            → Content parsing for tools
  games/            → Content parsing for games
  library/          → Content parsing for library resources
  i18n/             → Locale config + dictionary loading
content/            → Markdown/JSON content files
dictionaries/       → i18n translation JSON
```

---

## Phased Implementation

### Phase 1 — Core Data Pipeline (Unit Tests)

Test the 6 server-only lib files. These read the filesystem with `fs`, `path`, and `gray-matter`. Mock the filesystem using `vi.mock`.

| File | Tests | What to Cover |
|---|---|---|
| `lib/roadmaps/get-roadmap-content.ts` | ~8 | Parse frontmatter, return steps, handle missing locale, error on missing slug |
| `lib/roadmaps/types.ts` | ~6 | Constants match expected values, type shape validation |
| `lib/courses/get-course-content.ts` | ~10 | Course metadata loading, all lessons list, single lesson fetch, error handling, locale fallback |
| `lib/tools/get-tool-content.ts` | ~8 | Tool metadata, all tools list, locale fallback, missing slug |
| `lib/games/get-game-content.ts` | ~8 | Game loading by type/slug, category filtering, malformed JSON handling |
| `lib/library/get-library-resources.ts` | ~8 | Resource filtering by type, category, locale |

**Mocking approach**: `vi.mock('fs')` and `vi.mock('path')` with in-memory file trees, or read from actual `content/` directory for closer-to-production tests.

**Estimated**: ~48 tests, ~2 days

---

### Phase 2 — Core Interactive Components (Component Tests)

Test the roadmap client components. These need mocked `localStorage`, `framer-motion`, and `next/link`.

| File | Tests | What to Cover |
|---|---|---|
| `components/roadmaps/RoadmapTimeline.tsx` | ~12 | Renders all steps, progress bar updates, localStorage read/write, empty state, single step |
| `components/roadmaps/RoadmapStepCard.tsx` | ~10 | Expand/collapse toggle, status badges (locked/complete/current), renders "Go to Course" link, relationship display |
| `app/[lang]/roadmaps/roadmaps-client.tsx` | ~6 | Renders roadmap cards, search/filter behavior, empty search results |

**Mocking approach**:
- `vi.mock('framer-motion')`: replace `motion.*` with plain `<div>`, wrap `AnimatePresence` as identity
- `vi.mock('next/link')`: render `<a>` with same props
- `vi.stubGlobal('localStorage', mockStorage)` in setup or per-test

**Estimated**: ~28 tests, ~2 days

---

### Phase 3 — Tools (Component + Integration Tests)

These 10 tool components contain complex business logic (timers, streak calculations, data import/export, localStorage). Extract pure functions for dedicated unit tests, then write component tests around the UI.

| File | Tests | What to Cover |
|---|---|---|
| `components/tools/PomodoroTimer.tsx` | ~14 | Timer start/pause/reset, session logging to localStorage, streak calculation, sound notification |
| `components/tools/HabitTracker.tsx` | ~12 | Habit CRUD, daily logging, streak calculation, calendar rendering, localStorage sync |
| `components/tools/FlashcardMaker.tsx` | ~12 | Deck CRUD, card add/edit/delete, spaced repetition algorithm, study session flow |
| `components/tools/SWOTMatrix.tsx` | ~10 | CRUD for each quadrant, CSV import/export, inline i18n switching |
| `components/tools/EisenhowerMatrix.tsx` | ~10 | CRUD for quadrants, import/export, inline i18n |
| `components/tools/RegexTester.tsx` | ~10 | Pattern input, test string matching, flags toggling, matches list, error display |
| `components/tools/UnitConverter.tsx` | ~8 | All conversion categories, rounding, unit switching |
| `components/tools/DecisionMatrix.tsx` | ~10 | Row/column CRUD, weighted scoring calculation, CSV export |
| `components/tools/BrainWritingSession.tsx` | ~10 | Timer, round management, idea submission, time-up behavior |
| `components/tools/LLMPromptBuilder.tsx` | ~8 | Template assembly, variable insertion, export |

**Mocking approach**:
- `localStorage` stubbed globally
- `navigator.clipboard` stubbed
- `URL.createObjectURL` / `FileReader` stubbed for import/export
- `alert`/`confirm` stubbed

**Estimated**: ~104 tests, ~5 days

---

### Phase 4 — Integration Tests

Test cross-component interactions, external services, and app-wide context.

| File | Tests | What to Cover |
|---|---|---|
| `components/providers/Providers.tsx` | ~8 | Theme toggle, localStorage sync, `matchMedia` detection, children render |
| `components/language/LanguageSwitcher.tsx` | ~8 | Dropdown open/close, locale selection calls router, cookie set |
| `components/layout/Header.tsx` | ~8 | Mobile menu toggle, nav links render, theme button, language switcher |
| `components/contacts/ContactForm.tsx` | ~8 | Form fields, validation, submission to Formspree, success/error states |
| `components/contacts/Contact.tsx` | ~6 | Formspree `useForm` hook integration, social links render |

**Mocking approach**:
- `vi.mock('next/navigation')`: stub `usePathname`, `useRouter`
- Mock `fetch()` or use **MSW (Mock Service Worker)** for HTTP
- Mock `@formspree/react` hook
- `document.cookie` stubbed

**Estimated**: ~38 tests, ~3 days

---

### Phase 5 — Remaining Components

Lower-priority render tests.

| File | Tests | What to Cover |
|---|---|---|
| `components/home/*` (6 files) | ~12 | Render content, animation wrapper presence |
| `components/layout/Footer.tsx` | ~4 | Render links, social icons |
| `components/markdown/MarkdownRenderer.tsx` | ~6 | Render markdown, code blocks, zoom toggle |
| `components/markdown/QuestionBlock.tsx` | ~4 | Question display, answer reveal |
| `components/markdown/FixWrapper.tsx` | ~2 | Syntax highlighting render |

**Estimated**: ~28 tests, ~1 day

---

## Mocking Strategy

| Dependency | Approach |
|---|---|
| **`fs` / `path` / `process.cwd()`** | `vi.mock('fs', () => ({ ... }))` with in-memory file tree |
| **`gray-matter`** | `vi.mock('gray-matter')` — return controlled frontmatter + content |
| **`framer-motion`** | Central mock module at `src/__mocks__/framer-motion.ts` — `motion.*` → `<div>`, `AnimatePresence` → identity, `useAnimation` → noop |
| **`localStorage`** | `vi.stubGlobal('localStorage', { ... })` or per-test `beforeEach` setup |
| **`next/link`** | `vi.mock('next/link')` — `React.forwardRef((props, ref) => <a ref={ref} {...props} />)` |
| **`next/navigation`** | `vi.mock('next/navigation')` — `usePathname` returns `'/'`, `useRouter` returns `{ push: vi.fn(), replace: vi.fn() }` |
| **`window.matchMedia`** | `vi.stubGlobal('matchMedia', ...)` in `src/test-setup.ts` |
| **`@formspree/react`** | `vi.mock('@formspree/react')` — `useForm` returns `[state, handleSubmit]` |
| **`fetch()`** | `vi.fn().mockResolvedValue(...)` or MSW |
| **`URL.createObjectURL`** | `vi.fn().mockReturnValue('blob:...')` |
| **`navigator.clipboard`** | `vi.fn().mockResolvedValue(undefined)` |
| **`react-markdown`** | `vi.mock('react-markdown')` — render children as text |
| **`mermaid`** | Already dynamic, but mock dynamic import in tests |
| **`next/image`** | `vi.mock('next/image')` — render `<img>` |

### Central Mock Modules

```
src/__mocks__/
  framer-motion.ts    → Shared framer-motion mock
  next-link.ts        → Shared next/link mock
  next-navigation.ts  → Shared next/navigation mock
```

---

## Pre-commit Workflow

### Current Flow
```
git commit
  └─ Husky v9 triggers .husky/pre-commit
       └─ npx lint-staged
            └─ For each staged *.ts / *.tsx:
                 1. vitest related --run   (runs tests related to changed files)
                 2. eslint --fix           (auto-fix lint)
```

### Suggested Improvements
| Improvement | Reason |
|---|---|
| Add `.js,.jsx,.json,.css` to lint-staged pattern | Only `.ts/.tsx` are covered; other files slip through |
| Add `--max-warnings 0` to eslint command | Currently warnings don't block commits |
| Swap order: lint first, then test | Tests are slower; fail fast on lint |
| Add `pre-push` hook | Block pushes that break tests or lint (optional, team preference) |

---

## CI Integration

Add a test step to `.github/workflows/nextjs.yml`:

```yaml
- name: Run tests
  run: npx vitest run
```

Position: between `npm ci` and the build step.

---

## File Tree (New Files)

```
src/
  __mocks__/                      ← Mock helper modules
    framer-motion.ts
    next-link.ts
    next-navigation.ts
  test-setup.ts                   ← Already exists
lib/
  i18n/__tests__/                 ← Already exists
  roadmaps/__tests__/             ← Phase 1
  courses/__tests__/              ← Phase 1
  tools/__tests__/                ← Phase 1
  games/__tests__/                ← Phase 1
  library/__tests__/              ← Phase 1
components/
  roadmaps/__tests__/             ← Phase 2
  tools/__tests__/                ← Phase 3
    PomodoroTimer.test.tsx
    HabitTracker.test.tsx
    FlashcardMaker.test.tsx
    ...
  providers/__tests__/            ← Phase 4
  language/__tests__/             ← Phase 4
  layout/__tests__/               ← Phase 4
  contacts/__tests__/             ← Phase 4
  home/__tests__/                 ← Phase 5
  markdown/__tests__/             ← Phase 5
docs/
  TESTING.md                      ← This file
```

---

## Key Constraints

1. **Static export**: No Next.js server runtime in production. Tests must not depend on `next start`.
2. **`typescript.ignoreBuildErrors: true`**, **`strict: false`**: The production build is lenient. Tests may surface type issues the build ignores — this is intentional and desirable.
3. **Content-driven**: 37 courses, 10 tools, 7 game categories, 1 roadmap. Tests can leverage actual content files for realistic data.
4. **`framer-motion` pervasive**: Every client component wraps content in `motion.*` elements. The central mock is essential for all component tests.

---

## Effort Summary

| Phase | Files | Tests (est.) | Effort |
|---|---|---|---|
| 1 — Core Data Pipeline | 6 lib files | ~48 | 2 days |
| 2 — Core Interactive | 3 components | ~28 | 2 days |
| 3 — Tools | 10 components | ~104 | 5 days |
| 4 — Integration | 5 components | ~38 | 3 days |
| 5 — Remaining | ~10 components | ~28 | 1 day |
| Infrastructure | CI, mocks, config | — | 1 day |
| **Total** | **~34 source files** | **~246 tests** | **~14 days** |
