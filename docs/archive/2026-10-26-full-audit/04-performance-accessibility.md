> **HISTORICAL — superseded.** Kept for decision provenance only. Do not follow as current guidance. See `docs/INDEX.md`.

# 04 — Performance & Accessibility Findings

**Audit date:** 2026-10-26
**Measurement basis:** production build (`.next/` + `out/`), `.next/app-build-manifest.json` chunk attribution, `out/**/*.html` byte sizes.

---

## 1. Performance

### 1.1 Route payload baseline

Measured by summing the byte size of every JS chunk + CSS file listed for each route in `.next/app-build-manifest.json`.

| Route | JS + CSS | Heavy contributors |
|-------|---------:|--------------------|
| `/[lang]/courses/[courseSlug]/[lessonSlug]/page` | **1,980.6 KB** | syntax-highlighter 1,175 KB · dnd-kit+md 258 KB · framer-motion 114 KB |
| `/[lang]/layout` | 620.9 KB | framer-motion 114 KB · framework 258 KB |
| `/[lang]/tools/[slug]/page` | 564.1 KB | framer-motion 114 KB |
| `/[lang]/quizzes/[quizSlug]/page` | 536.5 KB | framer-motion 114 KB |
| `/[lang]/languages/[pair]/[activitySlug]/page` | 476.4 KB | framer-motion 114 KB |
| `/[lang]/page` | 469.5 KB | framer-motion 114 KB |
| `/[lang]/games/conversation/[slug]/page` | 463.3 KB | framer-motion 114 KB |
| `/[lang]/about/page` | 459.6 KB | framer-motion 114 KB |
| `/[lang]/contact/page` | 447.1 KB | framer-motion 114 KB |
| `/[lang]/courses/page` | 336.3 KB | — |

### 1.2 HTML document sizes

| File | Size |
|------|-----:|
| `out/en/courses/index.html` | **324 KB** |
| `out/en/index.html` | **262 KB** |
| `out/en/tools/index.html` | 180 KB |

The measured cause: **612 of 637 (96%) of `en.json`'s string leaves appear verbatim inside `out/en/index.html`.** The dictionary is serialised into the RSC payload of every page. See **PERF-02**.

### 1.3 `public/` weight

| File | Size | Share |
|------|-----:|------:|
| `public/team/leandro-alves.png` | **2,513,367 B (2.4 MB)** | 68% |
| `public/search-index/pt.json` | 412,454 B | 11% |
| `public/search-index/es.json` | 384,476 B | 10% |
| `public/search-index/en.json` | 330,333 B | 9% |
| `public/og-image.png` | 24,662 B | <1% |
| `public/favicon.ico` | 4,158 B | <1% |
| `public/favicon.svg` | 519 B | <1% |
| `public/index.html` | 687 B | <1% |
| `public/robots.txt` | 75 B | <1% |
| `public/ads.txt` | 58 B | <1% |
| **Total** | **~3.7 MB** | |

The single team photo is 1328×1328 RGBA PNG, unoptimised, and it is **68% of the entire `public/` directory**. There is exactly one media asset in `content/` (`content/courses/intro-to-data-engineering/en/media/data-engineering-lifecycle.png`).

---

## 2. Findings

---

### PERF-01 — 1.2 MB of unused syntax-highlighting grammars on every lesson page

| | |
|---|---|
| **Category** | Performance · Security (supply chain) |
| **Severity** | **High** |
| **Status** | Confirmed — measured |

**Evidence**

`components/markdown/FixWrapper.tsx` (12 lines):
```tsx
4: import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
5: import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
```

The `Prism` entry point resolves to `node_modules/react-syntax-highlighter/dist/cjs/prism.js`:
```js
var _refractor = require("refractor");
var _supportedLanguages = require("./languages/prism/supported-languages");
```

`refractor` is vendored at `node_modules/react-syntax-highlighter/node_modules/refractor/` and contains **277 language grammars** in `lang/` — **5.2 MB on disk**.

**Measured chunk**

```
.next/static/chunks/1729-bdf9797cf221ae8f.js   1,175.4 KB (1.2 MB)
→ out/_next/static/chunks/1729-bdf9797cf221ae8f.js
```

Verified to contain **85 of 86 sampled** Prism language identifiers: `abap, actionscript, ada, agda, applescript, arduino, asm6502, bash, bison, brainfuck, csharp, clojure, coffeescript, crystal, css, dart, docker, elixir, elm, erlang, fortran, gherkin, glsl, graphql, groovy, haskell, hcl, java, javascript, json, jsx, julia, kotlin, less, lisp, livescript, lua, makefile, markdown, matlab, nginx, nim, nix, objectivec, ocaml, pascal, perl, php, powershell, prolog, python, reason, ruby, rust, sass, scala, scheme, scss, shell, sql, swift, toml, tsx, twig, typescript, vbnet, verilog, vhdl, visualbasic, wasm, yaml, zig`.

Internals confirm `tokenize` ×192 and `insertBefore` ×133.

**Languages actually used** — `components/markdown/MarkdownRenderer.tsx:44-72` (`langMap`):

```
text, mermaid, question, math, phet, plot, molecule, dragdrop, matching,
fillblank, interactive, sql, javascript, typescript, python, rust, bash,
terraform, hcl, tf, psql, postgresql, sh, shell, zsh, js, py, rs
```

After mapping to real syntax-highlighter languages: **`sql`, `javascript`, `typescript`, `python`, `rust`, `bash`, `terraform`** — **7 languages**.

**Impact**

- **~95% of the chunk is dead weight** (1,175 KB → ~60 KB achievable).
- The chunk is loaded **eagerly on all 1,486 lesson pages** (en 483, pt 522, es 481).
- The lesson route ships **1.98 MB** of JS. On a 3G connection at ~1.6 Mbps effective, that is **~10 seconds** of transfer and parse before the lesson is interactive.
- It carries the `prismjs` DOM-clobbering advisory (GHSA-x7hr-w5r2-h6wg) — the **one dependency advisory with genuine browser-side relevance** (see SEC-11).

**Remediation — Option A (recommended): per-language registration**

```tsx
// components/markdown/FixWrapper.tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash'
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript'
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python'
import rust from 'react-syntax-highlighter/dist/cjs/languages/prism/rust'
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql'
import terraform from 'react-syntax-highlighter/dist/cjs/languages/prism/terraform'
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('javascript', javascript)
// …
```

**Remediation — Option B (cleaner): replace the dependency**

`shiki` (TextMate grammars, on-demand, ~300 KB core + per-language chunks) or `highlight.js` core with explicit language registration. `shiki` produces better fidelity and supports the same 7 languages plus `hcl`, `psql`, `zsh`, `shell` for free.

**Remediation — Option C (best for perf): render syntax highlighting at build time**

Because the content is static, highlighting can happen in `lib/` at build time and be emitted as HTML. This removes the highlighter from the client bundle **entirely** (0 KB). Trade-off: no client-side re-highlighting, and a slightly larger HTML payload per code block. Given the content is fully static, this is the strongest option and should be evaluated.

**Effort:** Option A ≈ 3 hours. Option B ≈ 5 hours. Option C ≈ 8 hours.

---

### PERF-02 — The full 192.6 KB dictionary is serialised into every page

| | |
|---|---|
| **Category** | Performance |
| **Severity** | **High** |
| **Status** | Confirmed — measured |

**Evidence**

`lib/i18n/get-dictionary.ts:1-6`:
```ts
1: import en from '@/dictionaries/en.json'
2: import pt from '@/dictionaries/pt.json'
3: import es from '@/dictionaries/es.json'
…
6: const dictionaries = { en, pt, es }
```

Sizes: `en.json` 61,047 B · `pt.json` 65,438 B · `es.json` 66,121 B = **192.6 KB raw**.

The entire `dictionaries` object graph is bundled into the server build, and the **selected dictionary is serialised as a prop into the RSC payload of every page**.

**Measurement**

612 of 637 (96%) of `en.json`'s string leaves appear verbatim inside `out/en/index.html` (262 KB).

This is a direct consequence of the **prop-drilling architecture**: `app/[lang]/layout.tsx:100` loads the full dictionary and passes it to `<Header dict={dict}>` and `<Footer dict={dict}>`, and every page re-loads it and passes it to its own client component.

**Impact**

- Every HTML document is inflated by 60–190 KB of JSON that is **mostly unused on that page**.
- `out/en/courses/index.html` = **324 KB**; `out/en/tools/index.html` = 180 KB.
- For a text-heavy educational site, this directly hurts LCP and inflates the crawl budget for 1,606 sitemap URLs.
- It compounds with the fact that the same dictionary is inlined into **every one of the 1,633** generated pages.

**Remediation**

Split the dictionary into **per-namespace** modules and let each route pull only what it needs:

```
dictionaries/
  en/
    navigation.json  home.json  courses.json  tools.json  games.json
    quizzes.json     library.json  roadmaps.json  languages.json
    about.json       contact.json metadata.json  search.json  notFound.json
  pt/…
  es/…
```

Then a typed accessor:

```ts
// lib/i18n/get-dictionary.ts
export function getDictionary(locale: Locale) {
  const d = dictionaries[locale]
  return {
    navigation: d.navigation,
    metadata: d.metadata,
    // …
  }
}
```

and per-page namespace selection:

```ts
const dict = getDictionary(lang, ['navigation', 'courses'])
```

**Expected result:** `out/en/index.html` from 262 KB → **< 120 KB**; `out/en/courses/index.html` from 324 KB → **< 150 KB**.

**Compatibility constraint:** `tests/i18n/dict-parity.test.ts` compares the leaf-path sets of `en`/`pt`/`es`. It must be updated to walk the namespace directories and compare the union.

**Effort:** ≈ 6 hours. See **ARCH-08**.

---

### PERF-03 — `framer-motion` in the shared chunk for animations only

| | |
|---|---|
| **Category** | Performance |
| **Severity** | **High** |
| **Status** | Confirmed — measured |

**Evidence**

**26 import statements across 25 files**, all in `'use client'` components:

```
app/[lang]/about/AboutPageClient.tsx:5,8
app/[lang]/games/conversation/[slug]/thirty-six-questions-client.tsx:4
app/[lang]/games/coding/[slug]/typing-speed-client.tsx:4
app/[lang]/games/coding/[slug]/binary-hex-client.tsx:4
app/[lang]/games/math/[slug]/math-challenge-client.tsx:4
app/[lang]/games/physics/[slug]/periodic-table-client.tsx:4
app/[lang]/games/logic/[slug]/number-sequence-client.tsx:4
app/[lang]/games/puzzles/[slug]/word-search-client.tsx:4
components/gamification/AwardToaster.tsx:4
components/home/{Stats,FeaturedCourses,Hero,Tools,Newsletter,Features}.tsx
components/lessons/LessonProgress.tsx:5
components/quizzes/{ExamRunner,QuizPlayer,ScoreReport}.tsx:3
components/contacts/Contact.tsx:4
components/roadmaps/{RoadmapStepCard,RoadmapTimeline}.tsx
components/languages/{vocabulary-game-client,flashcard-game-client}.tsx:4
components/tools/FlashcardMaker.tsx:4
```

Because every one of those files is a client component, framer-motion lands in the **shared chunk `440-b164a72ea7defb65.js` = 113.7 KB**, loaded on **14 routes** (verified via `.next/app-build-manifest.json`).

**Usage** is limited to entrance/exit animations (`motion.div`, `AnimatePresence`, `whileHover`).

**Impact**

113.7 KB is loaded on the **home page, every layout, and 14 routes** for what amounts to fade-and-rise transitions. On the home page (469.5 KB total) that is **24%** of the payload.

**Remediation**

Replace with **CSS animations** for the entrance transitions, which are the overwhelming majority of usage. The Tailwind config already defines `fade-in` and `slide-in` keyframes (`tailwind.config.js:68-82`).

```css
/* globals.css */
@media (prefers-reduced-motion: no-preference) {
  .animate-fade-in-up { animation: fade-in 0.45s ease-out both; }
}
```

Keep `framer-motion` **only** where genuinely needed — `AnimatePresence` exit animations and layout/drag transitions in the interactive tools and games. Those components are already route-scoped, so framer-motion would then only load on those routes.

**Expected result:** the shared chunk drops from 113.7 KB to ~0 KB on the 14 routes that only need entrance animations.

**Effort:** ≈ 5 hours (mechanical, but 25 files).

---

### PERF-04 — 2.4 MB unoptimised PNG is 68% of `public/`

| | |
|---|---|
| **Category** | Performance |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

`public/team/leandro-alves.png` — 2,513,367 bytes, 1328×1328 RGBA PNG. Verified to contain no EXIF or tEXt metadata (so no privacy leak — but the byte count is a pure waste).

**Impact**

- 2.4 MB for a **team member headshot** is disproportionate. On a mobile connection this single asset can dominate the page weight of the About page.
- `next.config.js:16` sets `images: { unoptimized: true }` — **required** for static export (no image optimizer at build time on Pages). So the fix must be done at the asset level, not via `next/image`.

**Remediation**

1. Resize to the maximum display size (the team grid renders at ~96–160 px; 2× for retina = **320 px**).
2. Convert to **WebP** (or AVIF with a PNG fallback).
3. Target: **< 40 KB**.

```bash
# target: 320px wide, WebP quality 80
npx sharp-cli -i public/team/leandro-alves.png -o public/team/leandro-alves.webp resize 320 webp
```

Expected: 2,513,367 B → **~20–40 KB**. `public/` total: 3.7 MB → **~1.2 MB**.

**Effort:** ≈ 30 minutes.

---

### PERF-05 — The search index is 1.1 MB and fetched in full

| | |
|---|---|
| **Category** | Performance |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

`public/search-index/{en,es,pt}.json` = 330 KB / 384 KB / 412 KB = **1.1 MB total**, containing 516 / 597 / 564 documents.

`components/search/CommandPalette.tsx:84`:
```tsx
84:     fetch(`/search-index/${lang}.json`)
```

**What works well**

- ✅ The fetch is **lazy** — it only happens when the palette opens (`:74` returns early if `!open`).
- ✅ It is **cached per-locale** in a `Map` (`cacheRef`, `:46`, `:88`) so it is fetched at most once per session per locale.
- ✅ Failures degrade gracefully to an empty result set (`:91-95`), and `response.ok` is checked (`:85`) so an HTML 404 page is never parsed.

**What could be better**

- 330–412 KB for a single search index is heavy over a slow connection. The palette shows a spinner for the duration.
- The index is fetched with the default `fetch` priority — no `AbortController` (`:97` only guards the state update), so a navigation does not cancel the request.
- No `response schema validation` — the JSON is cast straight to `SearchDoc[]` (`:86`).

**Remediation**

1. **Shrink the index.** 516 documents at 640 B average is large for a title + short description. The `text` field (used for full-text matching) is the bulk. Options:
   - Drop `text` and match on `title` + `description` only → typically a 60–70% reduction.
   - Store the index as a **gzip-friendly format** — GitHub Pages serves `application/json` without automatic compression, but a `.json.gz` + `DecompressionStream` path is not worth the complexity. Simpler: use a **more compact JSON shape** (arrays instead of objects, or a single delimited string).
   - **Best:** move to a **sharded index** — `search-index/{lang}/{bucket}.json` with a small `search-index/{lang}/manifest.json`. The palette loads the manifest and queries only the buckets needed for the current query length.
2. **Add `AbortController`** to cancel on unmount/locale change.
3. **Validate the response shape** before use.

**Effort:** ≈ 5 hours (index format change) / 1 hour (AbortController + validation).

---

### PERF-06 — `katex.min.css` is imported from JavaScript

| | |
|---|---|
| **Category** | Performance |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence**

`components/markdown/MarkdownRenderer.tsx:9`:
```tsx
import 'katex/dist/katex.min.css'
```

The stylesheet (23.8 KB) is emitted into `out/_next/static/css/87dfc6598b12eeb9.css` and loaded **only on lesson routes** — which is correct scoping. However:

- The global stylesheet `out/_next/static/css/3099ac3eb265ca0b.css` (**152 KB**, loaded on **every** page) contains **13 incidental `katex` token matches** from daisyUI, indicating daisyUI ships KaTeX-adjacent CSS that is dead weight on non-lesson pages.
- Importing CSS from a client component is a **render-blocking** request discovered only after the JS bundle parses. Importing it from `app/globals.css` (or a route-level CSS import) lets the browser discover it in parallel with the document parse.

**Remediation**

Move the KaTeX import into the lesson route's own CSS, or into `app/globals.css` behind a `@layer` so it is purged. Then measure whether the 13 daisyUI KaTeX rules can be excluded.

**Effort:** ≈ 1 hour.

---

### PERF-07 — `react-syntax-highlighter` renders the full `Prism` object per code block

| | |
|---|---|
| **Category** | Performance |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence**

`components/markdown/MarkdownRenderer.tsx:631`:
```tsx
631:                 <SyntaxHighlighterWrapper language={language} PreTag="div" className="!my-0 !rounded-none">
632:                   {codeString}
633:                 </SyntaxHighlighterWrapper>
```

**Context:** the `Prism` build re-registers its language list on module load, and each `<SyntaxHighlighter>` instance re-tokenises. For lessons with many code blocks this is measurable.

**Remediation**

- Fix **PERF-01** first (the dominant cost).
- Then consider **Option C** (build-time highlighting), which eliminates runtime tokenisation entirely.
- `react-syntax-highlighter` has no `memo` on the wrapper; wrapping `FixWrapper` in `React.memo` avoids re-highlighting on unrelated re-renders.

**Effort:** ≈ 1 hour (after PERF-01).

---

### PERF-08 — `public/search-index/` is gitignored but `out/` is committed?

| | |
|---|---|
| **Category** | Performance · Build hygiene |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence**

`.gitignore:83` excludes `public/search-index/`. ✅ Correct — the index is generated at `prebuild`.

**However:** `out/` is 782 MB on disk and `out/` contains 1,633 HTML files plus ~1.1 MB of search indexes plus the full `_next/` asset tree. If `out/` were committed it would bloat the repository enormously.

Verified: `.gitignore:80` excludes `out`. ✅

**Assessment: correct.** The only observation is that `out/` on disk (782 MB) is larger than expected for ~1,600 pages — because `_next/static/media` contains the Next.js font assets and every route's chunks, and each of the 1,486 lesson pages has its own HTML file with the full RSC payload. This is a **symptom of PERF-02**, not a separate problem: shrinking the dictionary payload shrinks the entire `out/` tree proportionally.

**Effort:** covered by PERF-02.

---

### PERF-09 — Positive: the heavy dependencies *are* correctly code-split

| | |
|---|---|
| **Category** | Performance |
| **Severity** | Informational (positive) |
| **Status** | Confirmed |

| Package | Import style | Site |
|---------|--------------|------|
| `mermaid` | ✅ dynamic `await import()` | `MarkdownRenderer.tsx:164` |
| `recharts` | ✅ dynamic `await import()` | `SciencePlot.tsx:50` |
| `3dmol` | ✅ dynamic `await import()` | `MoleculeViewer.tsx:52` |
| `katex` | ✅ dynamic `await import()` | `MarkdownRenderer.tsx:112` |
| `CommandPalette` | ✅ `next/dynamic` | `Header.tsx:15` |
| 10 tools | ✅ `next/dynamic` | `tools/[slug]/page.tsx:20-56` |

**Measured lazy chunks (not in the main bundle):**

| Chunk | Size | Contents |
|-------|-----:|----------|
| `3a7aa434…` | 635 KB | mermaid |
| `198781b9…` | 564 KB | 3dmol |
| `7146.10b0…` | 500 KB | recharts |
| `3116.1225…` | 356 KB | mermaid-related |
| `26d302b2…` | 200 KB | katex |
| `90542734…` | 421 KB | — |
| `4604.59e0…` | 145 KB | — |

**Assessment:** the pattern is applied well. The gap is that it was not extended to `react-syntax-highlighter` (**PERF-01**) or the dnd-kit question components (**ARCH-03**).

---

## 3. Accessibility (WCAG 2.2 AA)

### 3.1 What is already good

- ✅ **Semantic HTML throughout** — `<main>` (`layout.tsx:128`), `<header>`, `<footer>`, `<nav>`, `<article>`, `<section>`.
- ✅ **`prefers-reduced-motion` is partially honoured** — `globals.css:504` has a `:focus-visible` rule; the Mermaid `@media print` block is present.
- ✅ **Focus-visible styling exists** in `globals.css:504`.
- ✅ **Copy button has an `aria-label`** (`MarkdownRenderer.tsx:90`).
- ✅ **Icon-only buttons have `aria-label`s** — `Header.tsx:126` ("Toggle theme"), `:139` (`dict.search.trigger`), `:156` ("Toggle menu").
- ✅ **`aria-expanded` / `aria-haspopup`** on the "More" dropdown (`Header.tsx:89-90`).
- ✅ **Mermaid zoom buttons** have `aria-label` + `disabled` (`MarkdownRenderer.tsx:267-278`).
- ✅ **Semantic tables** via the `table`/`thead`/`th`/`td` component overrides (`MarkdownRenderer.tsx:654-661`).
- ✅ **Skip-to-content is missing** — see A11Y-01.
- ✅ **Language switcher** is a real `<select>` (`components/language/LanguageSwitcher.tsx`) — keyboard accessible by default.

### 3.2 Findings

---

#### A11Y-01 — No skip-to-content link (WCAG 2.4.1 — Level A)

| | |
|---|---|
| **Category** | Accessibility |
| **Severity** | **High** |
| **Status** | Confirmed |

**Evidence**

`app/[lang]/layout.tsx:124-135`:
```tsx
<body className={inter.className}>
  <Providers>
    <div className="min-h-screen flex flex-col">
      <Header lang={params.lang} dict={dict} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer lang={params.lang} dict={dict} />
```

There is no `<a href="#main">` before `<Header>`. The `<main>` element has **no `id`**.

**Impact**

Keyboard and screen-reader users must traverse the **entire header** on every page load — the logo, 8 navigation links, the "More" dropdown, theme toggle, search button, profile chip, language select, and the mobile menu button — before reaching content. On a page with 1,486 lessons this is a meaningful per-navigation cost. This is a **Level A** criterion and the most commonly-audited accessibility requirement.

**Remediation**

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
>
  {dict.navigation.skipToContent ?? 'Skip to content'}
</a>
…
<main id="main-content" tabIndex={-1} className="flex-grow">
```

The skip link must be added to **all three** dictionaries (`en`, `pt`, `es`) to preserve the `dict-parity` test.

**Effort:** ≈ 1 hour.

---

#### A11Y-02 — Command palette has no focus trap, no dialog semantics, no focus restoration

| | |
|---|---|
| **Category** | Accessibility |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

`components/search/CommandPalette.tsx` (272 lines) renders an overlay triggered by ⌘K. It has **no**:
- `role="dialog"` / `aria-modal="true"`
- `aria-label` on the overlay
- focus trap (Tab can escape into the page behind)
- focus restoration (closing returns focus to… nothing)
- `aria-live` on the results count

**Impact**

A keyboard user who opens the palette and presses Tab can move focus into the page behind the overlay, losing all track of context. Screen-reader users get no announcement that a dialog opened. This violates **4.1.2 Name, Role, Value** (Level A) and **2.4.3 Focus Order** (Level A).

**Remediation**

```tsx
<div role="dialog" aria-modal="true" aria-label={dict.search.title}>
  <div role="combobox" aria-expanded="true" aria-controls="search-results" aria-activedescendant={activeId}>
    <input … />
  </div>
  <ul id="search-results" role="listbox">…</ul>
</div>
```

Plus: trap Tab within the dialog, restore focus to the trigger on close, and announce the result count via `aria-live="polite"`.

**Effort:** ≈ 3 hours.

---

#### A11Y-03 — Quiz and game feedback is not announced

| | |
|---|---|
| **Category** | Accessibility |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

`components/quizzes/ScoreReport.tsx` (575 lines) and `components/quizzes/ExamRunner.tsx` (449 lines) render results, correct/incorrect counts, and score tiles **visually only**. There is no `aria-live` region anywhere in the codebase:

```
$ grep -rn "aria-live\|role=\"status\"\|role=\"alert\"" app components
(no matches)
```

The same applies to the seven game `*-client.tsx` result screens.

**Impact**

A screen-reader user submits an answer and receives **no feedback** — the result appears silently. For a *learning* platform, this is the highest-consequence accessibility gap: the feedback loop that makes an assessment educational is entirely inaccessible.

This is **WCAG 4.1.3 Status Messages** (Level AA).

**Remediation**

1. Add a `role="status"` / `aria-live="polite"` region in `ExamRunner`, `QuizPlayer`, and `ScoreReport` that announces the outcome.
2. Add `role="alert"` (assertive) for errors — e.g. the Formspree `ValidationError` output.
3. Add a shared `<LiveRegion>` component in `components/ui/`.

**Effort:** ≈ 3 hours.

---

#### A11Y-04 — `prefers-reduced-motion` is not honoured

| | |
|---|---|
| **Category** | Accessibility |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

```
$ grep -rn "prefers-reduced-motion" app components lib
(no matches)
```

Meanwhile the codebase uses motion in several places:
- `app/globals.css:61-63` — `html { scroll-behavior: smooth; }`
- `components/layout/Header.tsx:79` — `animate-pulse` on the "NEW" badge (infinite animation)
- `components/layout/Header.tsx:170` — `animate-slide-in` on the mobile menu
- `tailwind.config.js:77-82` — `accordion-down`, `accordion-up`, `fade-in`, `slide-in`
- 25 files using `framer-motion` entrance animations

**Impact**

For users with vestibular disorders, `prefers-reduced-motion: reduce` is the standard, widely-expected accommodation. The infinite `animate-pulse` on the "NEW" badge is the worst offender — it runs continuously on every page.

WCAG **2.2.2 Pause, Stop, Hide** (Level A) applies to the pulsing badge, and **2.3.3 Animation from Interactions** (Level AAA) to the rest.

**Remediation**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Effort:** ≈ 1 hour.

---

#### A11Y-05 — Missing `aria-current` on navigation, and inconsistent focus indicators

| | |
|---|---|
| **Category** | Accessibility |
| **Severity** | Low–Medium |
| **Status** | Confirmed |

**Evidence — `aria-current`**

`components/layout/Header.tsx:70-84`:
```tsx
{primaryNavigation.map((item) => (
  <Link
    key={item.name}
    href={item.href}
    className="relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-accent hover:text-blue-600 …"
  >
```

No `aria-current="page"`. A screen-reader user cannot tell which section they are in.

**Evidence — focus indicators**

`components/markdown/MarkdownRenderer.tsx:90`:
```tsx
className="absolute top-2 right-2 bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-600 focus:outline-none"
```

`focus:outline-none` with **no replacement focus style** — the button becomes completely invisible to keyboard navigation. This is a **WCAG 2.4.7 Focus Visible** (Level AA) failure.

Other `focus:outline-none` occurrences across the codebase should be audited for the same pattern.

**Remediation**

1. Add `aria-current={isActive(item.href) ? 'page' : undefined}` to the header links (and the mobile menu).
2. Replace every `focus:outline-none` with a visible `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (the `--ring` token already exists at `globals.css:25`).
3. Add a global `:focus-visible` baseline in `globals.css`.

**Effort:** ≈ 2 hours.

---

#### A11Y-06 — Colour contrast of the hardcoded palette

| | |
|---|---|
| **Category** | Accessibility |
| **Severity** | Low |
| **Status** | **Potential** — needs measurement |

**Evidence**

The token layer is well-chosen (`--muted-foreground: 215.4 16.3% 46.9%` on `--background: 0 0% 100%` → ~4.6:1, passes AA for normal text).

However, the **hardcoded** palette used in ~40 component files bypasses the tokens:
- `text-gray-700 dark:text-gray-300` — passes.
- `text-gray-800 dark:text-gray-100` — passes.
- `text-gray-500 dark:text-gray-400` — **`#6b7280` on white = 4.83:1** (passes AA), but `dark:text-gray-400` on `dark:bg-gray-900` = `#9ca3af` on `#111827` = **7.0:1** ✅.
- The **callout system** (`globals.css:100-250`) uses 53 hardcoded hex values, e.g. `#f59e0b` (amber-500) for warning icons on `#fffbeb` (amber-50) → **~2.1:1 — fails AA** for text, though it is used for an icon + bold label, which is a different contrast requirement (3:1 for non-text).
- `text-green-600` on white = 3.4:1 — **fails AA for normal text**; used for the game result headers (`binary-hex-client.tsx:245`, etc.).

**Remediation**

1. Convert all hardcoded hex to tokens (**UX-01**) — the token system has audited, accessible values.
2. Verify contrast for the specific pairs flagged above.
3. Add an automated contrast check to the test suite where feasible.

**Effort:** covered by UX-01 + 2 hours of verification.

---

## 4. Performance & accessibility summary

| ID | Finding | Severity | Category | Effort |
|----|---------|----------|----------|--------|
| PERF-01 | 1.2 MB unused Prism grammars on every lesson page | **High** | Performance · Security | 3 h |
| PERF-02 | 192.6 KB dictionary serialised into every page | **High** | Performance | 6 h |
| PERF-03 | `framer-motion` 113.7 KB in the shared chunk for animations only | **High** | Performance | 5 h |
| PERF-04 | 2.4 MB unoptimised PNG = 68% of `public/` | Medium | Performance | 0.5 h |
| PERF-05 | 1.1 MB search index fetched in full | Medium | Performance | 5 h |
| PERF-06 | `katex.min.css` imported from JS | Low | Performance | 1 h |
| PERF-07 | Highlighter re-renders without memoisation | Low | Performance | 1 h |
| PERF-08 | `out/` at 782 MB — symptom of PERF-02 | Low | Performance | — |
| PERF-09 | Heavy deps *are* correctly code-split (positive) | Info | Performance | — |
| A11Y-01 | No skip-to-content link (2.4.1 A) | **High** | Accessibility | 1 h |
| A11Y-02 | Command palette: no focus trap / dialog role (4.1.2 A, 2.4.3 A) | Medium | Accessibility | 3 h |
| A11Y-03 | Quiz/game feedback not announced (4.1.3 AA) | Medium | Accessibility | 3 h |
| A11Y-04 | `prefers-reduced-motion` not honoured (2.2.2 A) | Medium | Accessibility | 1 h |
| A11Y-05 | No `aria-current`; `focus:outline-none` without replacement (2.4.7 AA) | Low–Med | Accessibility | 2 h |
| A11Y-06 | Hardcoded palette may fail contrast (1.4.3 AA) | Low | Accessibility | 2 h |

---

## 5. Performance targets after remediation

| Metric | Before | After | Method |
|--------|--------:|------:|--------|
| Lesson route JS | 1,980.6 KB | **< 400 KB** | PERF-01 + PERF-03 + ARCH-03 |
| `out/en/index.html` | 262 KB | **< 120 KB** | PERF-02 |
| `out/en/courses/index.html` | 324 KB | **< 150 KB** | PERF-02 |
| `out/` total | 782 MB | **< 350 MB** | PERF-02 (proportional) |
| `public/` total | 3.7 MB | **< 1.2 MB** | PERF-04 |
| Shared chunk (layout shell) | 113.7 KB | **~0 KB** | PERF-03 |
| Search index (per locale) | 330–412 KB | **< 150 KB** | PERF-05 |
| Code-block highlighter | 1,175 KB | **~60 KB** | PERF-01 |

**Cumulative effect on a lesson page:** 1,980.6 KB JS + 262 KB HTML → **~380 KB JS + ~100 KB HTML** — a **~78% reduction** in transferred bytes, with no loss of functionality.
