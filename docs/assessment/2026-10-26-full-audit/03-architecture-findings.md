# 03 — Architecture & Code Quality Findings

**Audit date:** 2026-10-26
**Stack:** Next.js 14.2.33 (App Router) · React 18.2 · TypeScript 5.3 · Tailwind 3 + daisyUI 4 · `output: 'export'` → GitHub Pages

---

## 1. Architecture overview

### 1.1 Structure

```
app/[lang]/          27 routes across 14 route segments
  layout.tsx         Root layout — Header, Footer, Providers, JSON-LD
  page.tsx           Home
  {about,contact,courses,games,languages,library,quizzes,roadmaps,tools}/
  404/               Localized 404 as a *route* (not a boundary)

components/          60 components + 15 subfolders
  home/              Hero, Features, Stats, Tools, Newsletter, FeaturedCourses, ContinueLearning
  layout/            Header, Footer
  markdown/          MarkdownRenderer + 10 interactive block components
  providers/         Theme provider
  language/          LanguageSwitcher
  gamification/      ProfileChip, AwardToaster
  lessons/           Outline, Progress, Feedback, ScoreContext
  quizzes/           Player, ExamRunner, ScoreReport, Certificate…
  tools/             10 interactive tools
  languages/         Vocabulary + flashcard games
  search/            CommandPalette
  contacts/          Contact form
  courses/           ProgressBadge, ResumeCta

lib/                 30 modules
  i18n/ courses/ games/ languages/ library/ quizzes/ roadmaps/ tools/
  markdown/ lessons/ progress/ search/ gamification/

content/              1,513 content files (Markdown + JSON)
dictionaries/        en.json (61 KB), pt.json (65 KB), es.json (66 KB)
scripts/             generate-search-index.mjs, postbuild.mjs, verify_out.mjs
middleware.ts        Dev-only locale redirect (inert under output: 'export')
```

### 1.2 Architectural character

The architecture is **conventional and correct** for Next.js App Router:

- **Server-first by default.** Content loaders live in `lib/**` and run at build time. Only components that genuinely need interactivity carry `'use client'`.
- **Content as data.** Markdown + frontmatter (`gray-matter`) for prose, JSON for structured entities. This makes the site trivially static and trivially portable.
- **Thin route files.** Most `page.tsx` files are 30–120 lines: load data → render a client component.
- **Build-time i18n.** Three dictionaries, statically imported, with `generateStaticParams` enumerating locales.

The issues below are about **consistency, weight, and duplication** — not about a broken model.

---

## 2. Findings

---

### ARCH-01 — Five byte-identical copies of the storage helper trio

| | |
|---|---|
| **Category** | Architecture · Maintainability |
| **Severity** | **High** |
| **Status** | Confirmed |

**Evidence**

`safeGet` is **byte-identical** in five files (verified via `awk` + `md5sum` → `7b3e7c80a37145767a23e38e40600687`):

| File | `safeGet` | `safeSet` | `safeRemove` | `readJson` |
|------|-----------|-----------|--------------|-----------|
| `lib/progress/storage.ts` | :25 | :34 | :54 | :43 |
| `lib/quizzes/storage.ts` | :39 | :48 | :57 | :85 |
| `lib/lessons/feedback.ts` | :10 | :19 | :28 | — |
| `lib/gamification/profile.ts` | :14 | :23 | :32 | — |
| `lib/languages/storage.ts` | :46 | :55 | :175 (inline) | :64 |

Plus **three** near-identical `readJson` implementations and **three** near-identical `sanitize*` shape validators.

**Additionally, six components bypass the helpers entirely** and use raw `localStorage`:

| File | Lines |
|------|-------|
| `components/providers/Providers.tsx` | :37, :48 |
| `components/tools/FlashcardMaker.tsx` | :59, :79 |
| `components/tools/HabitTracker.tsx` | :44, :46, :50, :51 |
| `components/tools/PomodoroTimer.tsx` | :52, :56, :63, :67 |
| `components/roadmaps/RoadmapTimeline.tsx` | :25, :36 |
| `app/[lang]/games/logic/[slug]/number-sequence-client.tsx` | :45, :114 |

**Total: 30 `localStorage` call sites across 11 files.** ~180 duplicated lines.

**Impact — duplication has already produced drift**

This is not a theoretical maintainability concern. The drift is observable today:

| Divergence | Detail |
|-----------|--------|
| `lib/languages/storage.ts:64-72` | Does **not** purge the corrupt key on parse failure, unlike the four sibling modules which all call `safeRemove(key)`. |
| `components/providers/Providers.tsx:36-50` | The only access path with **no `try/catch`** at all. → **SEC-05** |
| `lib/languages/storage.ts:79-105` | Uses a plain `{}` for the progress map → **SEC-04** prototype-setter issue. |
| `components/tools/FlashcardMaker.tsx:61` | Parse is guarded but the **shape is not validated** — `JSON.parse('5')` succeeds and is then treated as `Deck[]`; `.find()` at `:82` throws at render. Same class in `HabitTracker.tsx:45,47` and `PomodoroTimer.tsx:54,58`. |
| `components/roadmaps/RoadmapTimeline.tsx:28-41` | Parse guarded, shape not validated — a stored object without `completedSteps` throws at `:41` (`prev.completedSteps.includes(...)`). |
| `lib/quizzes/storage.ts:79-81` | `perDomain` is assigned wholesale from parsed JSON with no per-key validation. |

**Remediation**

Create `lib/storage/safe-storage.ts`:

```ts
export function safeGet<T>(key: string, parse?: (raw: string) => T): T | null
export function safeSet(key: string, value: unknown): void
export function safeRemove(key: string): void
```

Requirements for the shared implementation:
1. Wrap every access in `try/catch` — handles `SecurityError` and `QuotaExceededError`.
2. Purge the key on parse failure (matching the best existing behaviour).
3. Accept an optional **schema validator** so shape validation is not optional — this eliminates the `FlashcardMaker`/`HabitTracker`/`PomodoroTimer`/`RoadmapTimeline` crash class at the source.
4. Use `Object.create(null)` for any map it constructs, and skip `__proto__`/`constructor`/`prototype` keys.

Then migrate all 11 files, deleting the five local copies.

**Effort:** ≈ 4 hours. **Risk:** Low — the existing tests (`tests/progress/storage.test.ts`, `tests/quizzes/storage.test.ts`, `tests/languages/storage.test.ts`, `tests/gamification/profile.test.ts`, `tests/lessons/feedback.test.ts`) cover 5 of the 11 files and will catch regressions.

---

### ARCH-02 — 24 client components exceed 300 lines

| | |
|---|---|
| **Category** | Architecture · Maintainability |
| **Severity** | **High** |
| **Status** | Confirmed |

**Evidence — the largest client components**

| Lines | File |
|------:|------|
| 698 | `app/[lang]/games/conversation/[slug]/thirty-six-questions-client.tsx` |
| 679 | `components/markdown/MarkdownRenderer.tsx` |
| 662 | `components/tools/SWOTMatrix.tsx` |
| 615 | `components/tools/EisenhowerMatrix.tsx` |
| 575 | `components/quizzes/ScoreReport.tsx` |
| 488 | `components/tools/BrainWritingSession.tsx` |
| 485 | `components/languages/flashcard-game-client.tsx` |
| 462 | `components/quizzes/QuizDetail.tsx` |
| 449 | `components/quizzes/ExamRunner.tsx` |
| 426 | `components/tools/FlashcardMaker.tsx` |
| 417 | `components/tools/PomodoroTimer.tsx` |
| 408 | `components/markdown/FillBlankQuestion.tsx` |
| 387 | `app/[lang]/library/library-client.tsx` |
| 385 | `components/tools/RegexTester.tsx` |
| 379 | `components/quizzes/QuestionBody.tsx` |
| 377 | `components/tools/UnitConverter.tsx` |
| 376 | `components/quizzes/LessonExam.tsx` |
| 376 | `components/tools/LLMPromptBuilder.tsx` |
| 372 | `components/tools/DecisionMatrix.tsx` |
| 369 | `app/[lang]/about/AboutPageClient.tsx` |
| 369 | `components/languages/vocabulary-game-client.tsx` |
| 367 | `components/quizzes/QuestionBody.tsx` |
| 361 | `components/tools/HabitTracker.tsx` |
| 337 | `app/[lang]/games/puzzles/[slug]/word-search-client.tsx` |
| 310 | `app/[lang]/games/math/[slug]/math-challenge-client.tsx` |
| 299 | `app/[lang]/courses/courses-client.tsx` |
| 297 | `app/[lang]/quizzes/quizzes-client.tsx` |
| 292 | `components/contacts/Contact.tsx` |

**75** files carry `'use client'`; **24** of them exceed 300 lines.

**Impact**

- **`MarkdownRenderer.tsx` is the highest-leverage problem.** At 679 lines it bundles:
  - `MathBlock` (:99-141)
  - `MermaidDiagram` (:143-294)
  - the alert preprocessor (:296-396)
  - **8** JSON-config renderer branches (:419-643)

  It statically imports `SciencePlot`, `MoleculeViewer`, `DragOrderQuestion`, `MatchingQuestion`, `FillBlankQuestion`, `BucketDropQuestion` (:16-21) — which is exactly why **dnd-kit is pulled into the lesson bundle** even though only ~1 in 50 lessons uses an interactive block.

- **`SWOTMatrix.tsx` (662) and `EisenhowerMatrix.tsx` (615) share ~80% structure** — two matrix tools with near-identical quadrant rendering, drag handling, and export logic.

- **`thirty-six-questions-client.tsx` (698)** contains 4 distinct phases (set / exercise / final / session-complete), each with its own full-page layout, and **5 copies** of the same `text-3xl font-bold mb-2` result header.

**Remediation — targeted, not a rewrite**

| Target | Action | Effort |
|--------|--------|--------|
| `MarkdownRenderer.tsx` | Extract the alert preprocessor into `lib/markdown/alerts.ts` (pure function, testable). Convert the 8 JSON-config branches to a **registry map** (`Record<string, (config) => ReactNode>`) instead of an if-chain. Lazy-load `SciencePlot`, `MoleculeViewer`, `PhETEmbed`, and the dnd-kit question components via `next/dynamic`. | 4 h |
| `thirty-six-questions-client.tsx` | Extract the 4 phase components into separate files. Extract the shared result-header into a `<GameResultHeader>` component (it is duplicated across 7 game clients). | 3 h |
| `SWOTMatrix` / `EisenhowerMatrix` | Extract a shared `<MatrixGrid>` primitive (quadrant rendering + axis labels). | 3 h |
| `ScoreReport.tsx` (575) | Extract the 3 duplicated `container-custom py-12` result blocks. | 2 h |
| `FillBlankQuestion.tsx` (408) | Split the two modes (`fill-blank-items` at :115, `fill-blank-template` at :251) into separate components; hoist the duplicated `shuffle`. | 2 h |
| `QuizDetail` / `ExamRunner` / `QuizPlayer` / `LessonExam` | Extract a shared `<QuizShell>` (progress bar, question counter, timer slot, nav buttons). | 3 h |

**Effort:** ≈ 17 hours total, but each item is independently shippable.

---

### ARCH-03 — `MarkdownRenderer` bundles all interactive blocks into the lesson route

| | |
|---|---|
| **Category** | Architecture · Performance |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

```tsx
// components/markdown/MarkdownRenderer.tsx:16-21
import SciencePlot from './SciencePlot'
import MoleculeViewer from './MoleculeViewer'
import DragOrderQuestion from './DragOrderQuestion'
import MatchingQuestion from './MatchingQuestion'
import FillBlankQuestion from './FillBlankQuestion'
import BucketDropQuestion from './BucketDropQuestion'
```

All six are **static** imports from a `'use client'` module. Therefore `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` are in the lesson chunk.

**Measured content distribution**

| Block type | Fences in `content/` | Bundled? |
|------------|--------------------|----------|
| ` ```plot ` | 25+ (live, e.g. `content/courses/aws-data-lakehouse/pt/02-s3-data-lake-foundation.md:591`) | Statically bundled |
| ` ```molecule ` | **0** | Statically bundled |
| ` ```phet ` | **0** | Statically bundled |
| ` ```dragdrop ` / ` ```matching ` / ` ```fillblank ` | sparse (~1 in 50 lessons) | Statically bundled (dnd-kit) |
| ` ```mermaid ` | common | Dynamically imported ✅ |
| ` ```math ` | common | Dynamically imported ✅ |

**Impact:** the two heaviest interactive components (`recharts` 500 KB and `3dmol` 564 KB) are *already* correctly code-split, but the **dnd-kit trio is not** — so every lesson page pays for drag-and-drop machinery it mostly never uses.

**Remediation**

```tsx
const SciencePlot = dynamic(() => import('./SciencePlot'), { ssr: false })
const MoleculeViewer = dynamic(() => import('./MoleculeViewer'), { ssr: false })
const PhETEmbed = dynamic(() => import('./PhETEmbed'), { ssr: false })
const DragOrderQuestion = dynamic(() => import('./DragOrderQuestion'), { ssr: false })
// …etc
```

Also convert `components/markdown/FixWrapper.tsx` (which wraps `react-syntax-highlighter`) to a dynamic import — see **PERF-01**.

**Effort:** ≈ 2 hours.

---

### ARCH-04 — No `not-found.tsx` boundary; 18 `notFound()` calls render the default Next.js page

| | |
|---|---|
| **Category** | Architecture · UX |
| **Severity** | **High** |
| **Status** | Confirmed |

**Evidence**

```
$ find app -name "not-found.tsx" -o -name "error.tsx" -o -name "loading.tsx" -o -name "global-error.tsx"
(no results)
```

**Zero** error/loading/not-found boundaries across **27 routes and 14 route segments**.

**18 `notFound()` call sites:**

```
app/[lang]/quizzes/[quizSlug]/page.tsx:49
app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx:93, 104
app/[lang]/courses/[courseSlug]/page.tsx:88
app/[lang]/roadmaps/[roadmapSlug]/page.tsx:59
app/[lang]/languages/[pair]/[activitySlug]/page.tsx:56, 61
app/[lang]/languages/[pair]/page.tsx:53
app/[lang]/tools/[slug]/page.tsx:119
app/[lang]/games/conversation/[slug]/page.tsx:53
app/[lang]/games/coding/[slug]/page.tsx:37, 39
app/[lang]/games/math/[slug]/page.tsx:31
app/[lang]/games/physics/[slug]/page.tsx:31
app/[lang]/games/logic/[slug]/page.tsx:31
app/[lang]/games/puzzles/[slug]/page.tsx:31
```

**The problem**

`app/[lang]/404/page.tsx` is a **normal route** (`/en/404/`), not a Next.js boundary. So when `notFound()` fires inside a statically-exported page, Next.js renders the **root** `/404` boundary — and because no `not-found.tsx` exists, the user gets **Next.js's default unstyled 404**, not the polished localized page.

The polished page is only reachable via the hand-written `out/404.html` stub (`scripts/postbuild.mjs:50-75`), which does `location.replace('/<locale>/404/?p=…')`. That stub only fires on **GitHub Pages' 404 handler** — i.e. when the requested file does not exist at all. A `notFound()` triggered *within* a page that does exist still yields the default Next 404.

**Impact**

A learner following a stale or mistyped internal link sees a raw Next.js error page instead of the designed 404 — a jarring break in the learning flow, and a bounce.

**Remediation**

1. Add `app/[lang]/not-found.tsx` that renders the same `NotFoundClient` (`app/[lang]/404/not-found-client.tsx`). This is the correct Next.js boundary and will be used by all `notFound()` calls within the `[lang]` segment.
2. Add `app/not-found.tsx` at the root for any path outside `[lang]`.
3. Add `app/[lang]/error.tsx` — a client error boundary so a crash in one of the 24 large client components does not take down the whole page.
4. Keep `app/[lang]/404/page.tsx` as the *navigable* 404 route (it is linked and indexed); the `not-found.tsx` boundary can simply redirect to it, or render the same component.

**Effort:** ≈ 2 hours.

---

### ARCH-05 — Canonical URLs are patched by post-processing HTML rather than metadata

| | |
|---|---|
| **Category** | Architecture · SEO |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

`app/[lang]/layout.tsx:48-56`:
```ts
alternates: {
  canonical: `/${params.lang}`,
  languages: {
    'en': '/en/',
    'pt': '/pt/',
    'es': '/es/',
    'x-default': '/en/',
  },
},
```

Next.js does **not** inherit `alternates.canonical` from a layout to its children — a child's `metadata` replaces the parent's for that key. Since no child page defines `alternates.canonical`, **most pages ship no canonical at all**.

This is why `scripts/postbuild.mjs:28-48` exists:

```js
const CANONICAL_RE = /<link rel="canonical" href="[^"]*"\s*\/?>/
…
function fixCanonicals() {
  for (const file of walkHtml(OUT)) {
    …
    if (CANONICAL_RE.test(html)) { html = html.replace(CANONICAL_RE, tag); replaced++ }
    else { html = html.replace('</head>', `    ${tag}\n  </head>`); inserted++ }
    fs.writeFileSync(file, html)
  }
}
```

**Problems**

1. It is a **regex mutation of 1,633 HTML files** after the fact — fragile, and it silently depends on Next's exact output format.
2. It **skips** `index.html`, `404.html`, and `404/index.html` (`:33`), so those keep whatever Next emitted.
3. It does not add **hreflang** alternates — the international SEO gap is unaddressed.
4. The canonical it writes is `ORIGIN + route + '/'`, which ignores the `basePath` computed in `next.config.js:7`.

**Remediation**

1. Add a shared helper that composes `alternates` for a page:
   ```ts
   // lib/seo/alternates.ts
   export function buildAlternates(lang: Locale, path = '') {
     return {
       canonical: `/${lang}${path}`,
       languages: {
         en: `/en${path}`, pt: `/pt${path}`, es: `/es${path}`, 'x-default': `/en${path}`,
       },
     }
   }
   ```
2. Apply it in each `generateMetadata` — 27 files, mechanical change.
3. Then **delete `fixCanonicals()`** from `scripts/postbuild.mjs` and verify with `scripts/verify_out.mjs`.

**Effort:** ≈ 4 hours. **Value:** correct canonicals + **1,486 lesson pages** gain proper per-locale hreflang — a significant international-SEO improvement.

---

### ARCH-06 — `middleware.ts` is dead code under `output: 'export'`

| | |
|---|---|
| **Category** | Architecture · Maintainability |
| **Severity** | Low |
| **Status** | Confirmed (self-documented) |

**Evidence**

`middleware.ts:1-3`:
```ts
// middleware.ts
// Dev-only: static export (output: 'export') never runs middleware in production.
// Prod locale redirect lives in public/index.html (root) + the postbuild 404.html stub.
```

The file is 77 lines implementing locale detection via pathname → cookie → `Accept-Language`. Under `output: 'export'` it **never executes in production**.

**Assessment**

This is correctly documented in the file header, which is good. But it is still:
- 77 lines of code that only runs in `next dev`.
- A **divergent implementation** of the locale redirect that already exists twice in raw JavaScript: `public/index.html:8-15` and `scripts/postbuild.mjs:57-65`. Three implementations of one behaviour, and they are **not kept in sync**.

Compare the three:

| Implementation | Cookie read | `navigator.language` fallback | Pathname check |
|----------------|-------------|---------------------------|----------------|
| `middleware.ts:8-42` | ✅ | ✅ | ✅ |
| `public/index.html:8-15` | ✅ | ✅ | ❌ |
| `scripts/postbuild.mjs:57-65` | ✅ | ✅ | ❌ (matches `/(en\|pt\|es)(\/\|$)/`) |

**Remediation**

Option A (recommended): keep `middleware.ts` for dev convenience but extract the locale-resolution logic into a **shared pure function** (`lib/i18n/resolve-locale.ts`) and note that the two inline scripts cannot import it (they are raw strings) — so instead, generate the inline scripts from the shared constant.

Option B: delete `middleware.ts` entirely and rely on `public/index.html` for dev too. The dev server would then serve the static stub at `/`, which works.

Either way, **one source of truth for the locale list** is the important part — `i18n.locales` from `lib/i18n/config.ts`.

**Effort:** ≈ 1 hour.

---

### ARCH-07 — Hardcoded locale list bypasses `i18n.locales`

| | |
|---|---|
| **Category** | Architecture · Maintainability |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence**

`app/[lang]/tools/[slug]/page.tsx:73-75`:
```ts
export async function generateStaticParams() {
  const locales = ['en', 'pt', 'es']   // ← duplicated literal
  …
}
```

Every other route derives locales from `i18n.locales` (`lib/i18n/config.ts:3`).

**Impact:** adding a 4th locale would silently omit the tools route for it — a silent, content-invisible bug. The same class of issue exists in the two inline redirect scripts (`public/index.html:9`, `postbuild.mjs:60`), which hardcode `(en|pt|es)` in a regex.

**Remediation:** import `i18n` and use `i18n.locales`; have `scripts/postbuild.mjs` and `public/index.html` derive the list from a shared generated constant (e.g. `scripts/generate-locale-stubs.mjs` writing the locale list into the stub at build time).

**Effort:** ≈ 1 hour.

---

### ARCH-08 — The i18n dictionary is a single monolithic JSON

| | |
|---|---|
| **Category** | Architecture · Performance |
| **Severity** | Medium (with **PERF-02**) |
| **Status** | Confirmed |

**Evidence**

`lib/i18n/get-dictionary.ts`:
```ts
1: import en from '@/dictionaries/en.json'
2: import pt from '@/dictionaries/pt.json'
3: import es from '@/dictionaries/es.json'
4: import type { Locale } from './config'
5:
6: const dictionaries = { en, pt, es }
7:
8: export const getDictionary = (locale: Locale) => {
9:   return dictionaries[locale] || dictionaries.en
10: }
```

Sizes: `en.json` 61,047 B · `pt.json` 65,438 B · `es.json` 66,121 B = **192.6 KB raw**.

**Two issues**

1. **Weight.** The full dictionary is serialised into the RSC payload of **every** page. See **PERF-02** for measurements.
2. **Structural.** `getDictionary` is **synchronous** but every one of the **53** call sites `await`s it (`await getDictionary(params.lang)`). The `await` is a no-op. The commented-out block at `:14-27` shows an intended `await import()` design was abandoned — which is precisely the design that would have fixed the weight problem.

Also: `getDictionary` takes `Locale` (not `Locale | undefined`), so the `|| dictionaries.en` fallback at `:9` is **unreachable dead code**.

**Remediation**

1. **Namespace-split** the dictionaries: `dictionaries/en/{navigation,home,courses,tools,games,quizzes,library,roadmaps,languages,about,contact,metadata,search,notFound}.json`.
2. Export a typed accessor per namespace:
   ```ts
   export const getDict = (locale: Locale) => ({
     navigation: en.navigation, …
   })
   ```
   so each route imports only what it needs.
3. Alternatively — and with **zero** per-route churn — keep the single files but make the *server* pass only the namespaces the route uses:
   ```ts
   const dict = getDictionary(lang, ['navigation', 'home'])
   ```
   with `getDictionary` returning a `Pick`-style projection.
4. Remove the `await` from the 53 call sites, or make the function genuinely async.

> **Compatibility constraint.** `tests/i18n/dict-parity.test.ts` asserts that `pt` and `es` have **exactly** the same leaf-path set as `en`. Any namespace split must keep that test passing — the test should be updated to compare the union of namespaces rather than a single file.

**Effort:** ≈ 6 hours. **Value:** removes ~150 KB from every page.

---

### ARCH-09 — Content loaders have no tests

| | |
|---|---|
| **Category** | Architecture · Quality |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

**10 of 26** non-type `lib/` modules have zero direct test coverage:

| Module | Lines | Drives |
|---------|------:|--------|
| `lib/courses/get-course-content.ts` | 263 | **1,486 lesson pages** — locale fallback, `course.json` parsing, `DIFFICULTY_ALIASES`, lesson ordering |
| `lib/games/get-game-content.ts` | ~170 | 7 games |
| `lib/languages/get-language-content.ts` | ~130 | 4 pairs, 5 activities |
| `lib/quizzes/get-quiz-content.ts` | 77 | 2 quizzes, 6 routes |
| `lib/tools/get-tool-content.ts` | 87 | 10 tools, 30 pages |
| `lib/roadmaps/get-roadmap-content.ts` | — | 1 roadmap, 3 pages |
| `lib/library/get-library-resources.ts` | — | 117 resources |
| `lib/roadmaps/resolve-content-url.ts` | — | roadmap URL resolution |
| `lib/languages/format.ts` | — | `pairChipLabel`, `tpl` |
| `lib/tools/tool-icons.ts` | — | icon mapping |

Also untested: **34 of 60** components (including every one of the 10 `components/tools/*`), **0 of 27** `page.tsx` files, and **0** assertions on any `generateStaticParams` output.

**Impact**

`lib/courses/get-course-content.ts` is the highest-risk untested module: it decides which of 1,486 pages exist and what they contain, and it contains locale-fallback logic with three different fallback behaviours (course present in locale / absent in locale but present in `en` / absent entirely).

**Remediation**

Add focused unit tests for the loaders' **decision logic** (not their file reads):
- `get-course-content.test.ts` — locale fallback matrix, lesson ordering, `DIFFICULTY_ALIASES`.
- `get-quiz-content.test.ts` — locale override application.
- `get-tool-content.test.ts` — locale → `en` fallback.
- `get-language-content.test.ts` — `getAllPairs` / `getPairForSlug` slug construction (**and** the `languagePair` vs `language_pair` mismatch risk noted in §5.2 below).
- `get-library-resources.test.ts` — frontmatter parsing, type inference.

**Effort:** ≈ 6 hours.

---

### ARCH-10 — 100% `generateMetadata` coverage, but thin per-page SEO

| | |
|---|---|
| **Category** | Architecture · SEO |
| **Severity** | Medium |
| **Status** | Confirmed — positive finding with gaps |

**Evidence — the good part**

All **27** `page.tsx` files export `generateMetadata`. Zero static `export const metadata` exports exist. This is uniformly good.

**The gaps**

| Gap | Detail |
|-----|--------|
| No `openGraph` / `twitter` on 20 of 27 pages | Only `layout.tsx`, `page.tsx`, `about/page.tsx`, `contact/page.tsx`, and `library/page.tsx` set them. The other 20 have title + description only. |
| No per-page `hreflang` | Only the layout defines `alternates.languages`, and it always points to the **locale homepages**. → **ARCH-05** |
| No `Course` / `LearningResource` JSON-LD | The site has 1,298 lessons and 49 courses and ships **none** of this structured data. The only JSON-LD is `EducationalOrganization` with `"sameAs": []` (empty). |
| No `BreadcrumbList` JSON-LD | A breadcrumb UI already exists at `app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx:150` — it is simply not marked up. |
| `metadataBase` hardcoded | `app/[lang]/layout.tsx:47` — `new URL('https://nuniversity.github.io')`, ignoring the `basePath` from `next.config.js:7`. |
| `app/robots.ts` missing | Only a static `public/robots.txt` with blanket `Allow: /`. |

**Remediation** — see [08 Implementation Plan §Phase 6](./08-implementation-plan.md).

---

### ARCH-11 — Duplicated UI patterns (secondary to ARCH-02)

| | |
|---|---|
| **Category** | Architecture · Maintainability |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence**

| Pattern | Count | Locations |
|---------|------:|-----------|
| `<div className="container-custom py-12">` | **25** | 17 in `app/`, 8 in `components/` |
| Error box `my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50` | **9** | `components/markdown/MarkdownRenderer.tsx:132,447,472,494,515,535,557,570,618` |
| Spinner `w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin` | **3** | `PhETEmbed.tsx:63`, `MoleculeViewer.tsx:114`, `SciencePlot.tsx:65` |
| Card header `bg-muted/50 px-4 py-2 border-b flex items-center gap-2` | **10** | 8 markdown components |
| Card body `rounded-xl border bg-card shadow-sm` | **11** | 8 markdown components |
| Difficulty badge strings | **4 each** | green/yellow/red × 4 files |
| `shuffle<T>()` — byte-identical (md5 `dbe6a26e…`) | **4** | `MatchingQuestion.tsx:21`, `FillBlankQuestion.tsx:22`, `DragOrderQuestion.tsx:25`, `BucketDropQuestion.tsx:15` |
| Game result header `text-3xl font-bold mb-2` | **7** | 7 game `*-client.tsx` files |
| `JSON.parse` + try/catch config blocks | **8** | `MarkdownRenderer.tsx:437,456,481,503,524,544,566,579` |
| `JSON.parse` + try/catch storage reads | **5** | `HabitTracker.tsx:45,47`, `PomodoroTimer.tsx:54,58`, `FlashcardMaker.tsx:61` |
| Breadcrumb nav class string | **2** | `courses/[courseSlug]/[lessonSlug]/page.tsx:150`, `courses/[courseSlug]/page.tsx:97` |
| Silent `catch {}` | **6** | `number-sequence-client.tsx:46`, `FlashcardMaker.tsx:61`, `HabitTracker.tsx:45,47`, `PomodoroTimer.tsx:54,58` |

**Total: ~34 `JSON.parse` call sites**, 24 of which are wrapped in `try`.

**Remediation**

Extract shared primitives into `components/ui/`:
- `<PageShell>` — replaces the 25 `container-custom py-12` occurrences.
- `<ErrorBox>` — replaces the 9 error divs.
- `<Spinner>` / `<LoadingBlock>` — replaces the 3 spinners.
- `<Card>`, `<CardHeader>`, `<CardBody>` — replaces the 10 + 11 card occurrences.
- `<DifficultyBadge>` — replaces the 12 badge strings.
- `<GameResultHeader>` — replaces the 7 result headers.
- `lib/utils/shuffle.ts` — replaces the 4 copies.

Each of these also becomes the vehicle for the **design-system consolidation** (UX-01), so the effort is shared.

**Effort:** ≈ 5 hours. **Value:** removes ~250 duplicated lines and creates the seam where the design tokens get applied consistently.

---

### ARCH-12 — `next/dynamic` is used well; the pattern should be extended

| | |
|---|---|
| **Category** | Architecture · Performance |
| **Severity** | Informational (positive) |
| **Status** | Confirmed |

**Evidence**

**11** `next/dynamic` calls, all with `ssr: false`:
- `app/[lang]/tools/[slug]/page.tsx:20,24,28,32,36,40,44,48,52,56` — 10 tools
- `components/layout/Header.tsx:15` — `CommandPalette`

This is **correct** — the heavy tools are already split out of the main bundle. The recommendation is simply to **extend the same pattern** to `MarkdownRenderer`'s interactive blocks (ARCH-03) and the syntax highlighter (PERF-01).

**Effort:** covered by ARCH-03 and PERF-01.

---

## 3. Static-export contract — verified compliant

This is the single most important architectural invariant for a GitHub Pages deployment. It was checked exhaustively.

| Check | Result |
|-------|--------|
| `cookies()` / `headers()` / `draftMode()` / `next/headers` | **0** occurrences across `app/`, `components/`, `lib/`, `src/`, `middleware.ts` |
| `dynamic = 'force-dynamic'` | **0** occurrences |
| `export const dynamic` | 22 files, **all** `'force-static'` |
| `export const revalidate` | 21 files, **all** `false` |
| `useSearchParams` | **0** occurrences — no Suspense boundary requirement triggered |
| `redirect()` / `permanentRedirect()` | **0** in `app/` — the two "redirect" routes use client-side `window.location.replace()` (`RedirectToLanguages.tsx:26`, `RedirectToQuizzes.tsx:25`) |
| API routes (`route.ts`) | **None exist** |
| `generateStaticParams` on every dynamic route | ✅ **13 / 13** |
| Prerendered routes | **1,632**, all with `fallback: null` (`.next/prerender-manifest.json`) |
| Redirects / rewrites | **0** (`.next/routes-manifest.json`) |
| `out/` HTML files | **1,633** (en 531, pt 570, es 529, root, 404) |
| `out/sitemap.xml` | **1,606** `<loc>` entries, **0** references to `/404/` ✅ |
| `next.config.js` | `trailingSlash: true` ✅ (required for GitHub Pages), `skipTrailingSlashRedirect: true` ✅, `images.unoptimized: true` ✅ (required for export) |
| `basePath` computation | `next.config.js:5-7` reads `GITHUB_REPOSITORY`; for `nuniversity.github.io` → `isOrgSite` → `basePath = ''` ✅ |

**Verdict: the export is correct and reliable.** The improvements in this document are about weight, cohesion, and failure modes — not about fixing a broken export.

---

## 4. Content pipeline

| Stage | Script | Behaviour |
|-------|--------|-----------|
| Prebuild | `scripts/generate-search-index.mjs` | Walks `content/`, builds `public/search-index/{en,pt,es}.json`. **Library URLs are validated** with `/^https?:\/\//i.test(url)` (`:159-160`); all other content URLs are **hardcoded relative paths** (`:80,91,110,122,134,147,185`) — content cannot inject a URL. |
| Build | `next build` | Static export to `out/`. |
| Postbuild | `scripts/postbuild.mjs` | `fixCanonicals()` (→ ARCH-05), `write404()` (locale stub), `sitemapFallback()` (only if `app/sitemap.ts` did not produce one). |
| Verify | `scripts/verify_out.mjs` | Post-export verification of the output. |

**Content inventory**

| Entity | Count | Notes |
|--------|------:|-------|
| Courses | 49 | `content/courses/<slug>/` |
| Lessons | 1,298 `.md` | en 436, pt 456, es 406 |
| Generated lesson pages | **1,486** | en 483, pt 522, es 481 (locale fallback expansion) |
| Tools | 10 | × 3 locales = 30 `.md` |
| Games | 7 | 6 categories, locale-neutral JSON |
| Quizzes | 2 | locale-neutral JSON with `locales` overrides |
| Roadmaps | 1 | × 3 locales |
| Library resources | 117 | **en 8 / pt 50 / es 58** |
| Language activities | 5 | 4 pairs |

**Content gap — the English Library has 8 resources vs 58 in Spanish.** A 6–7× disparity on the site's *default* locale and `x-default` fallback. See **UX-02**.

**Locale coverage gaps**

| Course | en | pt | es |
|--------|----|----|----|
| `data-platforms` | ✅ | ❌ | ❌ |
| `math-foundations` | ❌ | ✅ | ❌ |
| `hybrid-impact-enterprise` | ❌ | ✅ | ❌ |
| `dbt-redshift-advanced` | ✅ | ✅ | ❌ |

Missing locales fall back to `en` at render time, so no page 404s — but the *page count* differs per locale, which is why `pt` has 570 pages and `en` has 531.

---

## 5. Risk register — architectural fragility

### 5.1 `notFound()` during prerendering

Under `output: 'export'`, `notFound()` firing during prerender is a **build-time hazard**. Currently the build succeeds because `generateStaticParams` and the render-time lookup derive their param sets from the **same** functions. But three sites are fragile:

| Site | Fragility |
|------|-----------|
| `app/[lang]/games/coding/[slug]/page.tsx:39` | `notFound()` fires if `clients[slug]` is missing. Adding a game JSON without a client component would **break the entire build**. |
| `app/[lang]/languages/[pair]/[activitySlug]/page.tsx:61` | Compares `activityPair !== pair`, where `activityPair` is built from `game.language_pair.source/target` (snake_case) but `generateStaticParams` (`:24`) builds `pair` from `activity.languagePair.source/target` (camelCase). **If the JSON ever has both fields and they disagree, every generated page 404s and the build breaks.** |
| `app/[lang]/tools/[slug]/page.tsx:119` | `notFound()` if the tool dir is missing; `:125-133` has a "coming soon" branch for a missing *component* (currently dead — all 10 tools have components). |

**Remediation:** make `notFound()` non-fatal during export by returning a styled "unavailable" page instead of calling `notFound()` from the page body, or by validating the param set against the loader before rendering. Add a build-time assertion that every generated param resolves.

### 5.2 The `languagePair` vs `language_pair` mismatch

**Evidence:** `generateStaticParams` at `app/[lang]/languages/[pair]/[activitySlug]/page.tsx:24` uses `activity.languagePair.source`; the page body at `:59` uses `game.language_pair.source`. Two different casings of what appears to be the same field.

**Impact:** a latent build-breaking inconsistency that no test currently covers.

**Remediation:** normalise the field name in `lib/languages/types.ts` and add a test asserting `getPairForSlug` round-trips.

### 5.3 `not-found.tsx` absence

→ **ARCH-04**.

---

## 6. Test & CI posture

### 6.1 Current state

| Metric | Value |
|--------|-------|
| Vitest files | 36 |
| Tests passing | **1,253** |
| Tests skipped | 116 (`tests/library/link-check.live.test.ts` — requires `RUN_LIVE=1`) |
| Pytest files | 6 |
| Coverage thresholds | **None configured** |
| `coverage.all` | **Off** — files never imported by a test are **not counted at all**, so untested modules are invisible rather than reported as 0% |
| Coverage output | The repo-root `.coverage` (53 KB) is a **Python `coverage` SQLite DB** covering 17 files under `.opencode/` — it is **unrelated** to the v8 coverage output and is stale. Misleading artifact. |
| **Tests in CI** | ⚠️ `vitest run` **is** run in `.github/workflows/nextjs.yml`. The **Python suite is not.** |

### 6.2 Coverage config gaps

`vitest.config.ts:12-24`:
```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [ 'node_modules/', '.next/', 'out/', 'src/test-setup.ts', 'vitest.config.ts',
             '**/*.{test,spec}.{ts,tsx}', '**/types.ts', '**/*.d.ts' ],
},
```

- ❌ No `thresholds` → coverage can regress to 0% and CI stays green.
- ❌ No `all: true` → untested files are excluded from the denominator.
- ⚠️ `'**/types.ts'` excludes `lib/quizzes/types.ts`, `lib/languages/types.ts`, `lib/library/types.ts`, `lib/roadmaps/types.ts`, `lib/gamification/types.ts` — types are generally fine to exclude, but the pattern is broad.

### 6.3 High-value existing tests

| Test | Lines | Guards |
|-------|------:|--------|
| `tests/i18n/dict-parity.test.ts` | 59 | **en/pt/es key parity** — this is why the `dict.foo?.bar` style is safe |
| `tests/quizzes/grade.test.ts` | 151 | The grading engine, across all 5 question types |
| `tests/courses/data-integrity.test.ts` | 105 | Gap-free lesson numbering, `course.json` schema, per-locale presence |
| `tests/lessons/mermaid-security.test.tsx` | 53 | Mermaid `securityLevel: 'strict'` and no `<script>` in the SVG |
| `tests/lessons/markdown-sanitize.test.tsx` | 110 | Markdown sanitisation |
| `tests/search/generator.test.ts` | 96 | Search-index generation |
| `tests/components/command-palette.test.tsx` | 253 | ⌘K open/close, keyboard nav, `router.push` |
| `tests/components/interactive-adapter.test.tsx` | 338 | Interactive block adapters |
| `tests/quizzes/draw.test.ts` | 182 | Question randomisation |

**Remediation**

1. Add `coverage: { all: true, thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 } }`.
2. Run the Python suite in CI.
3. Add the loader tests from **ARCH-09**.
4. Add tests for the new shared storage helper (**ARCH-01**) covering: quota errors, corrupt JSON, shape validation, `__proto__` keys.
5. Add a **CSP regression test** that asserts the emitted HTML contains the expected `Content-Security-Policy` meta and that no inline script violates it.
6. Add a **canonical/hreflang test** over the built `out/` (extending `scripts/verify_out.mjs`).

---

## 7. Summary — architecture findings

| ID | Finding | Severity | Effort |
|----|---------|----------|--------|
| ARCH-01 | 5 byte-identical storage-helper copies + 6 raw-access files (~180 lines) | **High** | 4 h |
| ARCH-02 | 24 client components > 300 lines | **High** | 17 h |
| ARCH-03 | `MarkdownRenderer` statically bundles all interactive blocks (pulls in dnd-kit) | Medium | 2 h |
| ARCH-04 | No `not-found.tsx` / `error.tsx` boundary for 27 routes | **High** | 2 h |
| ARCH-05 | Canonicals patched by post-processing HTML; no per-page hreflang | Medium | 4 h |
| ARCH-06 | `middleware.ts` is dead code; 3 divergent locale-redirect implementations | Low | 1 h |
| ARCH-07 | Hardcoded `['en','pt','es']` in `tools/[slug]/page.tsx:74` | Low | 1 h |
| ARCH-08 | Monolithic 192.6 KB dictionary serialised into every page | Medium | 6 h |
| ARCH-09 | 10 `lib/` loaders untested, incl. the one driving 1,486 pages | Medium | 6 h |
| ARCH-10 | 100% `generateMetadata` but thin OG/hreflang/JSON-LD | Medium | 4 h |
| ARCH-11 | ~250 lines of duplicated UI patterns | Low | 5 h |
| ARCH-12 | `next/dynamic` used well — extend the pattern | Info | — |
