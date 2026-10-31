> **HISTORICAL — superseded.** Kept for decision provenance only. Do not follow as current guidance. See `docs/INDEX.md`.

# Deep Assessment — Website Application

Evidence-based state of the Nuniversity Next.js application. All references are
`file:line` against the working tree (Oct 2026) and cross-checked against the static
export in `out/`.

---

## 1. Architecture & routing

### 1.1 How it works

| Aspect | State | Ref |
|---|---|---|
| Framework | Next.js `^14.2.33`, App Router | `package.json:36` |
| Output | `output: 'export'` in production → static `out/` on GitHub Pages | `next.config.js:10` |
| Locales | `defaultLocale: 'en'`, `locales: ['en','pt','es']` | `lib/i18n/config.ts:1-4` |
| Detection | path → `NEXT_LOCALE` cookie → `Accept-Language` → en fallback | `middleware.ts:6-37` |
| Dictionary | all 3 JSONs statically imported; unknown → en | `lib/i18n/get-dictionary.ts:1-10` |
| Layout | `generateStaticParams` returns 3 locales, materializes every `[lang]` route | `app/[lang]/layout.tsx:13-15` |
| HTML lang | correct per locale (verified `out/pt/index.html` → `lang="pt"`) | `app/[lang]/layout.tsx:94` |
| trailingSlash | `true` + `skipTrailingSlashRedirect: true` → every nav link 301s on GH Pages | `next.config.js:11-12` |

### 1.2 Critical structural defects

1. **Middleware is dead in production.** It compiles into `.next/server/` but nothing
   middleware-related exists in `out/` — the locale redirect/cookie logic only runs under
   `next dev`. All locale routing on the live site relies on links being correct, not on
   redirects.
2. **No root page.** There is no `app/page.tsx`; `out/` has no `index.html` →
   `https://nuniversity.github.io/` serves `out/404.html`.
3. **Default 404 only.** No `app/not-found.tsx`, `error.tsx`, `global-error.tsx`,
   `loading.tsx` anywhere → English-only Next-default 404, no Header/Footer.
4. **Soft-404**: `roadmaps/[roadmapSlug]/page.tsx:38-54` renders an HTML “Roadmap Not
   Found” block instead of `notFound()`.
5. **Dead redirect asset**: root `app/math-physics-foundations/` exists but is empty.
6. **Trailing-slash noise**: exported `<Link>` hrefs lack trailing slashes while
   `trailingSlash:true` → 301 on every internal navigation.

---

## 2. Internationalization state

### 2.1 Dictionary layer — healthy

- `en.json`/`es.json`: 434 keys each; `pt.json`: 436 (2 extra tip keys). Only 11–13
  values byte-identical to EN → genuinely translated.
- Parity hook exists (`.opencode/hooks/check-i18n-parity`) but is **not in CI**.

### 2.2 Component layer — widespread EN leaks (verified in `out/` HTML)

| Area | Leak | Ref |
|---|---|---|
| Games index | category headings hardcoded EN (`Language - Vocabulary` etc.); EN empty state | `games-client.tsx:49-64,131-134` |
| Games index | `<title>` hardcoded EN for all locales | `app/[lang]/games/page.tsx:23-24` |
| Game detail | **all 13 clients** declare `dict: any` and read it 0× (e.g. “Back to Games”, “How to Play”, “Start Game”) | e.g. `number-sequence-client.tsx:12`, `quiz-game-client.tsx:19` |
| Tools detail | **9 of 10 components** ignore `dict` (only `LLMPromptBuilder.tsx:27` uses it); Eisenhower/SWOT keep private inline maps | `EisenhowerMatrix.tsx:33`, `SWOTMatrix.tsx:35` |
| Tools list | untranslated category keys `study_&_learning`, `coding_&_programming` (all locales) | `tools-client.tsx:78-79` |
| Home | stats labels EN (`Courses/Tools/Games/Resources`) | `app/[lang]/page.tsx:56-59` |
| Home | raw `course.area`, `All Levels`, `Course` string; fake rating; “View all ferramentas” mixed string | `FeaturedCourses.tsx:118,126,151`, `Tools.tsx:135` |
| Newsletter | “No spam, unsubscribe at any time.” | `Newsletter.tsx:96` |
| Courses list | `'{n} course/courses'` → “7 courses” on pt | `courses-client.tsx:219` |
| Library | “Showing X of Y resources” EN on pt; es shows 0/0 | `library-client.tsx:239` |
| About | “Learn more” | `AboutPageClient.tsx:359` |
| Roadmaps | “Roadmap Not Found”, “Back to Roadmaps” EN | `roadmaps/[roadmapSlug]/page.tsx:42,49` |
| Lesson widgets | QuestionBlock “Correct!/Incorrect!/Check Answer”, Matching “Check Matches”, FillBlank/DragOrder equivalents all EN regardless of lesson locale | `QuestionBlock.tsx:120,136`, `MatchingQuestion.tsx:210`, `FillBlankQuestion.tsx:213` |
| Tools | Pomodoro/Habit/UnitConverter hardcoded EN strings + `'en'` locale in date formatting | `PomodoroTimer.tsx:216-381`, `HabitTracker.tsx:204,260`, `UnitConverter.tsx:169` |

### 2.3 Content-level locale gaps

- **`/es/library/` empty** — no `content/library/es/` → `getAllResources('es')` returns `[]` (`lib/library/get-library-resources.ts:11-15`, no EN fallback).
- **PT-only courses**: `hybrid-impact-enterprise`, `math-foundations` → `/en`, `/es` 404.
- **Partial lesson sets**: `solid-principles-oop` pt has 7/8 lessons (no fallback under static export — `get-course-content.ts:63-67` dead code because `generateStaticParams` only enumerates existing files, `lesson page.tsx:21-47`).
- **Localized lesson slugs** (`nonprofit-organization-fundamentals`): EN lesson URLs under `/pt` `/es` 404; language switcher mid-lesson lands on non-exported URLs (`LanguageSwitcher.tsx:36-38` blindly swaps segment 1).
- **Games data**: only 3/13 game JSONs carry `locales`; `getAllGames()` ignores locale entirely (`lib/games/get-game-content.ts:146-185`), so titles/descriptions on `/pt` `/es` are EN.
- **Games metadata**: `games/page.tsx:20` fetches dict in `generateMetadata` but returns hard-coded EN.

---

## 3. Surface-by-surface state

### 3.1 Courses list — `courses-client.tsx`

**Exists:** client search (title/desc/area/author `:32-51`), difficulty chips `:143-175`,
area grouping `:53-68`, empty state, counts header.

**Broken:**
- **No course detail route** → card fallback `/${lang}/courses/${slug}` 404s when
  `firstLessonSlug` missing (`:234-238`; same in `FeaturedCourses.tsx:156-159`).
- `author` rendered/searched but never populated: `CourseInfo` omits it
  (`lib/courses/get-course-content.ts:30-39`, `:173-181`).
- Difficulty badge colors match lowercase EN only (`:77-88`) while localized values
  (`Beginner/Iniciante/Principianti`) win the lookup (`get-course-content.ts:178`) →
  badges mostly gray.
- Home “featured” cards show **hash-generated fake ratings** (`FeaturedCourses.tsx:59-66`)
  and the literal string “Course” instead of lesson count (`:149-152`).
- No sort, no pagination (all ~50 cards render).

### 3.2 Lesson player — `courses/[courseSlug]/[lessonSlug]/page.tsx`

**Exists:** breadcrumbs `:106-135`, difficulty/duration/“Lesson N of M” `:140-163`,
prev/next with titles `:194-239`, bottom “Course Content” list `:241-266`, positional
progress bar `:178-192`, full MarkdownRenderer (mermaid zoom/fullscreen, KaTeX, callouts,
4 interactive fence types), dark mode.

**Broken/dead:**
- `lesson-client.tsx` — **entire 281-line file commented out** (a designed sidebar+drawer player, unused).
- Breadcrumb course segment is plain text, not a link (`:122-129`) — and there is no course page to link to.

**Missing:** in-page TOC/anchors (headings render bare, `MarkdownRenderer.tsx:352-355`),
scroll progress, sticky sidebar, reading time, font-size controls, **any progress
tracking** (zero `localStorage` in courses code; no mark-complete; no resume), feedback
widget, keyboard ←/→ navigation.

### 3.3 Roadmaps

**Exists:** list with search/difficulty/stats (`roadmaps-client.tsx:34-130`); detail =
`RoadmapTimeline` with per-step toggle, prerequisite locking, current-step highlighting,
progress bar, congratulations banner, localStorage persistence
(`RoadmapTimeline.tsx:24-80,187-196`); steps link to real course lessons
(`RoadmapStepCard.tsx:195`; all 10 `contentRef`s resolve).

**Gaps:** only **1 roadmap**; `conditionals` parsed but never rendered
(`get-roadmap-content.ts:61,85`); `resolveContentUrl` helper never called and its
bare-course branch would emit 404 URLs (`:144-158`); manual “Mark as Complete” doesn’t
sync with actually visiting the linked lesson; no cross-roadmap dashboard.

### 3.4 Quizzes & interactive exercises

**In lessons (fences → components):**

| Fence | Renderer | Notes |
|---|---|---|
| `question` (5,783 blocks!) | `QuestionBlock.tsx` | local state only, no `aria-live`, all-or-nothing |
| `matching` (403) | `MatchingQuestion.tsx` (@dnd-kit) | `aria-live` present; no partial credit |
| `fillblank` (320) | `FillBlankQuestion.tsx` | `aria-live`; no partial credit |
| `dragdrop` (293) | `DragOrderQuestion.tsx` | keyboard sensor good; no `aria-live` on feedback |
| `plot`/`phet`/`molecule` | SciencePlot / PhETEmbed / MoleculeViewer | exist |
| **`interactive` (12)** | **no branch → raw JSON fallback** (`MarkdownRenderer.tsx:520-530`) | **BUG** — used by `aws-dea-c01/16-exam-simulation-b.md` |

- **No score aggregation, no persistence, no lesson quiz summary** anywhere in
  `components/markdown/*`.
- **Exam-simulation lessons are ordinary markdown** — no timer/navigator/submit/score
  UI. The only true exam UI is the Snowflake quiz game (below).

**Games quiz (to be moved):** `content/games/quiz/snowpro-core-cof-c03.json` — 10,915
lines, **833 questions**, 19 subdomains, `mockExam` config (6,900s, pass 75%, 100-question
proportional sample). Client `quiz-game-client.tsx` (1,448 lines): practice mode with
domain filter/counts/shuffle, mock exam mode with timer + pass/fail — **fully hardcoded
English** (receives `dict`, reads it 0×), **no localStorage persistence** of results.
Routes exist at `/{lang}/games/quiz/snowpro-core-cof-c03`.

### 3.5 Games (13, 8 categories)

Inventory: coding (binary-hex, code-typing-speed), conversation (36-questions — has
pt/es locales), logic (number-sequence), math (math-speed-challenge), physics
(periodic-table), puzzles (word-search), quiz (snowpro), vocabulary (5: en→pt basic/
advanced, es→en, es→pt flashcards, fr→pt flashcards).

- JSON data + runtime-generated interactivity; **titles/descriptions EN** except the 3
  games with `locales`.
- Category icons map at `games-client.tsx:69`; `dict.games.categories` exists but is
  used nowhere; `quiz/puzzles/conversation` keys missing from it.
- Progress/high-scores exist only in: number-sequence (best score), flashcards
  (per-card streaks + import/export), math (in-session multiplier).

### 3.6 Tools (10)

- All 10 have `en/pt/es.md` frontmatter, but **the Markdown bodies are dead data** —
  `getToolMetadata` never returns `content` (`lib/tools/get-tool-content.ts:57-83`),
  detail page renders only the interactive component (`tools/[slug]/page.tsx:132`), no
  title/description/body.
- i18n: 1 dict-driven, 2 inline-map, 7 EN-hardcoded (see §2.2).
- **Category inconsistency per locale**: pt mixes `Produtividade` (eisenhower) with
  `Productivity` (habit/pomodoro); es mixes `Productividad`/`Productivity`/`Business
  Strategy` → split/duplicated category groups on list page.
- `generateStaticParams` per-locale only, no EN-slug fallback (legacy BUG-03).
- Mobile: `HabitTracker.tsx:196,219` fixed `grid-cols-[200px,repeat(7,1fr)]` clipped at
  ≤410px; `DecisionMatrix` needs horizontal scroll (acceptable, wrapped in
  `overflow-x-auto`); `RegexTester`/others use `min-h-screen` double-height pages.

### 3.7 Library (59 items) — the worst surface

**Link pipeline:** frontmatter `url` → `get-library-resources.ts:39,84` → single
outbound anchor `library-client.tsx:359-367`. Card body is a non-clickable `<div>`
(`:272-275`); title/image do nothing.

**Quantified defects:**

| Defect | Count / evidence |
|---|---|
| Bare-domain URLs (point to platform home, not resource) | **29/59** (e.g. `pt/course/estudos-indigenas-afrobrasileiros.md:5` → `https://unilab.edu.br`; all 6 pt videos → YouTube channel roots) |
| Single-path URLs | 18 |
| True deep links | only 12 |
| Duplicate URLs | 5 cards / 2 URLs (3× FGV, 2× Veduca) |
| Hard 404 URL | `en/podcast/software-engineering-daily.md` (dead 2019 post); several 403/timeout |
| Dead thumbnails | **51/59** (404/403; e.g. fabricated YouTube IDs in `pt/video/nerdologia.md`, `spacetoday.md`) |
| Filter omits types | `['video','ebook','course','blog','repository']` hardcoded (`:174`) — podcast + article (3 items) unfilterable |
| ES content | **0 files** → `/es/library/` empty page |
| EN content | only 8 files vs 51 pt |
| Dead API | `getResourceById`/`getResourcesByType(s)`/`getResourcesByCategory` never called (`get-library-resources.ts:63-107`); MD bodies never rendered; no detail route |
| i18n | “Showing X of Y” EN; `dict: any` |
| Perf | raw `<img>` no width/height/lazy/srcset (`:279-283`) |

### 3.8 Home

Exists: Hero, Features (dict), Stats (real server-side counts), Featured Courses
(first 6), Tools, Newsletter.

Missing: search entry, roadmaps section (nav-only today), games section (a stat
number only), continue-learning, testimonials. Stats labels EN (§2.2). `AdsSpace.tsx`
is 100% commented out and unimported — no ads render anywhere.

### 3.9 Search

Per-section client filters only (courses/roadmaps/games/tools/library). **No site-wide
search**: no `/search`, no ⌘K/Ctrl+K palette, no search entry in Header/Footer, no
index (flexsearch/pagefind) anywhere.

### 3.10 Gamification

Exists only inside games/tools (high-score, flashcard streaks, math multiplier,
Pomodoro/Habit day streaks). **No XP/points/badges/achievements/leaderboard/certificates**
in courses, roadmaps or home. Only celebration: roadmap 100% banner.

---

## 4. Responsive & mobile risks

Config: default Tailwind breakpoints; `.container-custom`/`section-padding` are fine;
**no `overflow-x` guard on html/body**; globals media queries only for mermaid/KaTeX.

| Severity | Issue | Ref |
|---|---|---|
| High | Header 768–1100px: logo + 8 links w/ “NEW” badges + theme + full flag+name switcher + hamburger, no wrap | `Header.tsx:49-65,86` |
| High | Mobile menu inside sticky `h-16` grows the header; closes only on link click (not route/theme/language) | `Header.tsx:35,101-123` |
| High | LanguageSwitcher always shows full name (~130px) even at 320px | `LanguageSwitcher.tsx:36-38` |
| High | About avatar: 200×200 image in 96px circle, no `overflow-hidden`/`w-full` | `AboutPageClient.tsx:331-340` |
| Med | Fixed `grid-cols-4/-3/-7` with no responsive prefix in ≥10 files (typing-speed:193, quiz-game:960,1319,1434, math:196, periodic:229, word-search:235, thirty-six:652, flashcard:339, FlashcardMaker:342, Pomodoro:229, UnitConverter:281) | see each |
| Med | HabitTracker rows clipped ≤410px; also hardcodes `'en'` date locale | `HabitTracker.tsx:196,219,204,260` |
| Med | DecisionMatrix table ≈ 160+120n+180px — needs x-scroll on phones (wrapped OK) | `DecisionMatrix.tsx:207-222` |
| Med | Double `min-h-screen` (layout `:135` + page bodies) → permanent extra scroll | e.g. `RegexTester.tsx:129` |
| Med | MoleculeViewer fixed `height='500px'` | `MoleculeViewer.tsx:30,109` |
| Low | Library raw `<img>` layout-shift | `library-client.tsx:279-283` |
| Low | Footer year frozen at build time | `Footer.tsx:22` |
| Low | KaTeX `.katex-display` nowrap + x-scroll only ≥640 | `globals.css:508-524` |

**Handled well:** markdown table wrapper, image `max-w-full`, code `overflow-x-auto`,
marketing grids with responsive variants, hero blob clipping.

---

## 5. Accessibility

**Good:** aria-labels on theme/menu/switcher/socials/mermaid buttons; `aria-live` on
Matching+FillBlank; keyboard sensor on DragOrder.

**Gaps:**
- No skip link; `<main>` has no id target (`layout.tsx:122-144`).
- No `prefers-reduced-motion` anywhere (framer-motion loops run unconditionally — `Hero.tsx:42-56,124-131`; `animate-pulse`).
- One `:focus-visible` rule in the whole site (`globals.css:493`, mermaid only); code
  copy button `focus:outline-none` (`MarkdownRenderer.tsx:71`).
- QuestionBlock & DragOrder feedback regions lack `aria-live` (contrast with
  Matching/FillBlank).
- Breadcrumb `<nav>` no `aria-label` (`lesson page.tsx:106`); no `aria-current` on
  prev/next/TOC links; zero `sr-only` usage.

---

## 6. SEO & metadata

| Defect | Ref / evidence |
|---|---|
| **Canonical = locale root on every subpage** (no child overrides `alternates`) | `layout.tsx:40-47`; e.g. `out/en/tools/index.html` canonical → `/en/` |
| Duplicate hreflang sets (metadata alternates + hand-written links, inconsistent trailing slash) | `layout.tsx:40-47,99-102` |
| Duplicate viewport meta | `layout.tsx:96` + Next automatic |
| `og-image.png` referenced but does not exist | `layout.tsx:57,68`; absent from `public/`/`out/` |
| No sitemap; robots.txt has no `Sitemap:` line | `public/robots.txt` (2 lines) |
| Layout `description`/`keywords` always EN | `layout.tsx:29-30` |
| About title is a template placeholder in all 3 dictionaries | `dictionaries/*.json:8` (“Nome da Sua Empresa”) |
| Contact page uses **home** metadata; function still named `HomePage` | `contact/page.tsx:18-29` |
| Games list title/desc EN | `games/page.tsx:23-24` |
| Roadmaps pages have **no generateMetadata** → layout default | `roadmaps/page.tsx` (file ends `:26`) |
| Home `<title>` lacks `| Nuniversity` suffix | `layout.tsx:26-27` vs `page.tsx:26` |
| `Ads.txt` capital-A (served `/Ads.txt`, ad networks expect `/ads.txt`) | `public/Ads.txt` |
| Favicon duplicated 4× (root, public, app, app/[lang]) | repo tree |

## 7. Security notes

- `rehype-raw` without `rehype-sanitize` (`MarkdownRenderer.tsx:6,350`) — raw HTML from
  content passes through (trusted-content risk, flagged in legacy SEC-01).
- Mermaid `securityLevel: 'loose'` (`MarkdownRenderer.tsx:151`).
- Stale `ContactForm.tsx:36` posts to `formspree.io/f/YOUR_FORM_ID` placeholder (file
  unimported; live form uses `Contact.tsx:17`).
- No analytics/tracking scripts anywhere; only outbound integrations are Formspree
  (`xandddko`) and the newsletter UI.

## 8. Dead & stray code inventory

| Item | Evidence |
|---|---|
| `app/[lang]/contact/page copy.tsx` (375 lines, space in filename) | unmatched by routing; imports @formspree |
| `lesson-client.tsx` (281 lines, fully commented) | never imported |
| `components/contacts/ContactForm.tsx` (216 lines, placeholder endpoint) | never imported |
| `components/ads/AdsSpace.tsx` (52 lines, all commented) | never imported |
| Empty `app/math-physics-foundations/` | no files |
| Duplicate commented layout block | `layout.tsx:124-132` |
| Unused dict fetches in `generateMetadata` | `layout.tsx:22`, `games/page.tsx:20` |
| `Footer` `resources` column defined, never rendered | `Footer.tsx:37-42` vs `:87,105,122` |
| Footer privacy/terms/cookies all link to `/${lang}/` | `Footer.tsx:144-152` |
| `footerLinks` documentation/blog/community/support → `/${lang}/` | `Footer.tsx:38-41` |

`TODO/FIXME/HACK/BUG` greps: **0** real hits; 72 `any` occurrences across 31 files
(worst: `quiz-game-client.tsx`); `strict:false` makes mismatches like `author` silent.

## 9. What’s healthy (for balance)

- Dictionary key parity across 3 locales; genuine translations (≈97% distinct values).
- Static export green; per-lesson pages generated for every locale that has files.
- Markdown renderer feature set (mermaid+zoom, KaTeX, callouts, 4 dnd exercise types,
  plots, molecule, PhET) is strong for a static site.
- Roadmap timeline UX (locking, progress, localStorage) is a solid pattern to replicate.
- Library filter/sort UX (5 sort modes) is the best list UX in the app.
- Translation ops harness (validate/verify/quality gates) is mature — 20/20 course:locale
  pairs green; CI content step now includes legacy `--legacy` gating.
