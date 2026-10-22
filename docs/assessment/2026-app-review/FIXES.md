# Fixes — Complete Bug & Defect Inventory

Prioritized fix list for the application + harness. Format:
**ID · file:line · problem · fix approach · verification**.
Severity: **P0** = broken/404/security · **P1** = wrong experience/i18n/SEO · **P2** = quality/polish.
The *Phase* column maps to [PLAN.md](./PLAN.md).

---

## P0 — Critical (broken functionality)

| ID | Location | Problem | Fix | Verify | Phase |
|---|---|---|---|---|---|
| **F-001** | `content/library/**` frontmatter `url` + `library-client.tsx:359-367` | **29/59 library URLs are bare domain roots**, 18 more shallow; links go to platform homepages not the resource (user-reported) | Curate every item: replace with deep resource URLs (course/video/article deep links); dedupe 5 duplicates; fix 1 hard 404 (`en/podcast/software-engineering-daily`); remove/replace dead 403s | Link-check script over all 59 `url` values → 0 bare domains, 0 404s; spot-audit | 2 |
| **F-002** | `courses-client.tsx:234-238`, `FeaturedCourses.tsx:156-159` | **No course landing page** — `/{lang}/courses/{slug}` 404s (only `[lessonSlug]` exists) | Create `app/[lang]/courses/[courseSlug]/page.tsx`: syllabus/curriculum landing (meta, lessons accordion, start/resume CTA); route cards to it | `out/{lang}/courses/{slug}/index.html` exists for all 49; no card 404 | 2 |
| **F-003** | app root; `next.config.js` export | **No root `index.html`** → site root serves default 404 | Add locale-less root `page.tsx` that renders detectable redirect (meta-refresh/JS to `/{locale}/`, serverless-static) or generate `out/index.html` in a post-build step | `out/index.html` exists; `npx serve out` → `/` lands on `/en/` | 2 |
| **F-004** | `app/` (missing files) | **Default English 404, no chrome**; no error/loading boundaries | Add locale-aware `not-found.tsx` + `error.tsx` (+ `global-error.tsx`) inside `app/[lang]` with Header/Footer; root `not-found` for unknown paths | `out/404.html` shows site chrome; `/{lang}/garbage/` renders localized 404 | 2 |
| **F-005** | `MarkdownRenderer.tsx:520-530` | **12 ` ```interactive ` blocks render as raw JSON** (exam-simulation lessons) | Add `interactive` dispatch branch (payload `{type: matching|fillblank|dragdrop}` → reuse existing components); fix content fence language if preferred | Lesson `aws-dea-c01/{pt}/16-exam-simulation-b.md` renders exercises, not JSON | 2 |
| **F-006** | `content/library/es/` (missing) | **`/es/library/` empty — 0 resources** | Create `es/` content: translate/port EN+PT items (aligns with content loop) **or** temporary EN fallback in `get-library-resources.ts:11-15` | `out/es/library/index.html` shows >0 cards | 2 (fallback) / 3 (content) |
| **F-007** | `app/[lang]/layout.tsx:40-47` | **Canonical = locale root on every subpage** → massive duplicate-content SEO bug | Child pages set `alternates.canonical` to full path (helper in layout or per-page `generateMetadata`) | grep canonical in `out/en/tools/index.html` → self URL | 2 |
| **F-008** | `layout.tsx:57,68` | `og-image.png` referenced but **missing** | Generate `public/og-image.png` (1200×630 brand card) | file exists; URL 200 in build output | 2 |
| **F-009** | `app/[lang]/tools/[slug]/page.tsx:73-88` | `generateStaticParams` per-locale only → EN slugs missing when pt/es frontmatter differs (legacy BUG-03) | Enumerate union of all locales’ slugs; map missing-locale slug to EN content | all 10 slugs × 3 locales export regardless of locale-specific frontmatter | 2 |
| **F-010** | `vocabulary-game-client.tsx:97-105` | **Stale-state completion bug** (legacy BUG-02): `matchedPairs.size+1===numPairs` check races | Compute completion from functional updater result | unit test + manual playthrough | 2 |
| **F-011** | `contact/page.tsx:1-29` | Contact page uses **home metadata/function name** (`HomePage`, Hero/Features imports) (legacy BUG-01) | Rewrite metadata (localized title/desc), rename component, remove dead imports | `out/*/contact/index.html` has contact title | 2 |
| **F-012** | `middleware.ts:39-69` | Locale redirects/cookies **never run in production** (static export) | Document as dev-only; rely on F-003 root handling + correct links; optional post-build redirect map for GH Pages (`_redirects`/custom 404 logic) | root + no-locale paths resolve in `serve out` | 2 |
| **F-013** | `roadmaps/[roadmapSlug]/page.tsx:38-54` | Soft-404 HTML block instead of `notFound()` | Call `notFound()` | unknown roadmap → localized 404 route | 2 |
| **F-014** | `.pre-commit-config.yaml:16-23` + `pyproject.toml:54-60` | `uv run pytest` would fail (no pytest, broken collection); coverage targets nonexistent dirs | Fix harness (H-003…H-005) first or temporarily disable hook | `uv run pytest` collects & passes | 1 |
| **F-015** | `ContactForm.tsx:36` (unimported) | Placeholder `formspree.io/f/YOUR_FORM_ID` could ship by accident | Delete file (part of F-020 cleanup) or hardcode real endpoint | file gone | 2 |

## P1 — High (wrong/misleading experience, i18n, SEO)

### English leaks (translate via dictionaries; full list with refs in ASSESSMENT-APP §2.2)

| ID | Location | Problem / Fix | Phase |
|---|---|---|---|
| F-020 | `games-client.tsx:49-64,131-134` + `games/page.tsx:23-24` | Category headings, empty state, `<title>` hardcoded EN → use `dict.games.*` (add missing `quiz/puzzles/conversation` category keys) | 3 |
| F-021 | **13 game clients** (`dict: any`, 0 reads) | Localize all game UI (“How to Play”, stats, buttons) → wire `dict.games.*` per client | 3 (12) / 5 (vocab 2) |
| F-022 | **9/10 tool components** | Wire `dict.tools.*`; migrate Eisenhower/SWOT inline maps to dictionaries (single source) | 3 |
| F-023 | `tools-client.tsx:78-79` + tool frontmatter | `study_&_learning`/`coding_&_programming` keys unresolved; pt/es category values inconsistent → normalize category slugs across all 30 frontmatter files + dict keys | 3 |
| F-024 | `app/[lang]/page.tsx:56-59` | Home stats labels EN → dict (`stats.*` already exists — wire it) | 2 |
| F-025 | `FeaturedCourses.tsx:118,126,151` | raw `course.area`, `All Levels`, `Course` → dict + localized area labels | 2 |
| F-026 | `Tools.tsx:135` | “View all ferramentas” mixed string → full dict sentence | 2 |
| F-027 | `Newsletter.tsx:96` | “No spam…” EN → dict | 2 |
| F-028 | `courses-client.tsx:219` | `'{n} course/courses'` → dict plural | 2 |
| F-029 | `library-client.tsx:239` | “Showing X of Y resources” → dict | 2 |
| F-030 | `AboutPageClient.tsx:359` | “Learn more” → dict | 3 |
| F-031 | `roadmaps/[roadmapSlug]/page.tsx:42,49` | “Roadmap Not Found”/“Back to Roadmaps” → dict | 3 |
| F-032 | `QuestionBlock.tsx:120,136`, `MatchingQuestion.tsx:210`, `FillBlankQuestion.tsx:213`, `DragOrderQuestion.tsx` | Lesson widget chrome EN in all locales → dict (localized per lesson lang) | 3 |
| F-033 | `PomodoroTimer.tsx:216-381`, `HabitTracker.tsx:204,260`, `UnitConverter.tsx:169` | Hardcoded EN + `'en'` date locale → dict + pass `lang` | 3 |
| F-034 | `games/page.tsx:20-24` | `generateMetadata` unused dict → localized metadata | 3 |
| F-035 | `layout.tsx:29-30` | Layout description/keywords always EN → per-locale dict | 3 |

### Data/metadata defects

| ID | Location | Problem / Fix | Phase |
|---|---|---|---|
| F-040 | `lib/courses/get-course-content.ts:30-39,173-181` | `author` never populated though rendered (`courses-client.tsx:265`) → include in `CourseInfo` | 2 |
| F-041 | `courses-client.tsx:77-88` | Difficulty badge colors fail for localized values → match on localized keys or store enum | 2 |
| F-042 | `FeaturedCourses.tsx:59-66` | **Fake hash ratings** shown → remove stars or show lesson count/real metric | 2 |
| F-043 | `FeaturedCourses.tsx:149-152` | Literal “Course” placeholder instead of lesson count → real count | 2 |
| F-044 | `library-client.tsx:174` | Filter omits `podcast` + `article` → derive types from data | 2 |
| F-045 | `library-client.tsx:279-283` | Raw `<img>` → `next/image` or width/height + `loading="lazy"` (51 thumbnails dead → placeholder strategy in F-001) | 2 |
| F-046 | `games/quiz` data (`snowpro-core-cof-c03.json`) | EN-only quiz (titles/questions) — as part of quiz move: localize chrome; question-content policy in design file | 4 |
| F-047 | `dictionaries/{en,pt,es}.json:8` | About title placeholder “Your Company Name” in **all** locales → real titles | 2 |
| F-048 | `Footer.tsx:37-42,144-152` | `resources` column never rendered; privacy/terms/cookies + docs/blog/community/support all → `/${lang}/` | 2 |
| F-049 | `Footer.tsx:22` | `new Date().getFullYear()` frozen at build → acceptable or client footer year | 2 |
| F-050 | `roadmaps/page.tsx`, `roadmaps/[roadmapSlug]/page.tsx` | No `generateMetadata` → layout default EN title | 2 |
| F-051 | `games/page.tsx` | see F-034; also library/tools list metadata localized | 2 |
| F-052 | `LanguageSwitcher.tsx:36-38` | Blind segment swap → localized-slug awareness (map EN↔localized lesson slugs; fall back to course index (F-002)) | 3 |
| F-053 | partial lesson sets (`solid-principles-oop` pt 7/8) | Missing lesson not exported → fill missing translation (content loop) or per-lesson fallback policy decision | 3/9 |
| F-054 | PT-only courses (`hybrid-impact-enterprise`, `math-foundations`) | `/en` `/es` 404 → defer to content phase or add EN/ES metadata stubs with “available in PT” notice | 9 |
| F-055 | `public/robots.txt`, missing sitemap | No sitemap, robots has no Sitemap line → add `app/sitemap.ts` (static export: generate `sitemap.xml` post-build) + robots line | 2 |
| F-056 | `public/Ads.txt` | Capital A → rename `ads.txt` | 2 |
| F-057 | `layout.tsx:96,99-102` | Duplicate viewport + duplicate hreflang sets (one with slash, one without) → keep one canonical set | 2 |
| F-058 | `courses/[courseSlug]/[lessonSlug]/page.tsx:106-129` | Breadcrumb course segment unlinked → link to new course landing (F-002) | 2 |

## P2 — Medium (responsive, a11y, dead code, hygiene)

### Responsive (file:line from ASSESSMENT-APP §4)

| ID | Location | Fix | Phase |
|---|---|---|---|
| F-060 | `Header.tsx:49-65,86,101-123` | Redesign header: collapse nav into dropdown below ~1100px; close mobile menu on route change; move menu out of sticky flow (drawer) — **prerequisite for Quizzes/Languages nav links** | 7 |
| F-061 | `LanguageSwitcher.tsx:36-38` | Collapse to flag-only on small screens / under md | 7 |
| F-062 | `AboutPageClient.tsx:331-340` | Avatar: `overflow-hidden` + `w-full h-full object-cover` | 2 |
| F-063 | 10+ files with bare `grid-cols-4/-3/-7` (list in ASSESSMENT-APP §4) | Add `grid-cols-2 sm:grid-cols-4` style variants | 7 |
| F-064 | `HabitTracker.tsx:196,219` | Horizontal-scroll wrapper for the 7-day grid; fix `'en'` date locale | 7 |
| F-065 | double `min-h-screen` (layout + pages) | Remove page-level `min-h-screen` where layout already provides | 7 |
| F-066 | `MoleculeViewer.tsx:30,109` | Responsive height (aspect or `clamp`) | 7 |
| F-067 | `globals.css` | Add safe `overflow-x:hidden`/`clip` guard on body + audit wide tables | 7 |
| F-068 | `library-client.tsx:279-283` | see F-045 | 2 |

### Accessibility

| ID | Fix | Phase |
|---|---|---|
| F-070 | Skip-to-content link + `id="main-content"` on `<main>` (`layout.tsx:122-144`) | 7 |
| F-071 | `prefers-reduced-motion` media query gating framer-motion/pulse animations | 7 |
| F-072 | Global `:focus-visible` styles; remove `focus:outline-none` (`MarkdownRenderer.tsx:71`) | 7 |
| F-073 | `aria-live` on QuestionBlock + DragOrder feedback; `aria-label` on breadcrumb nav; `aria-current` on nav links | 7 |
| F-074 | `vocabulary-game-client.tsx:228` aspect-square overflow (legacy IMPROVE-23) | 5 |

### Dead code & hygiene (single cleanup task)

| ID | Item | Phase |
|---|---|---|
| F-080 | Delete `app/[lang]/contact/page copy.tsx` | 2 |
| F-081 | Delete (or implement) `lesson-client.tsx` — 281 commented lines; its sidebar design becomes the Phase 6 lesson outline spec | 2 |
| F-082 | Delete `components/contacts/ContactForm.tsx` | 2 |
| F-083 | Delete/rewrite `components/ads/AdsSpace.tsx` (all commented) — decide ads policy | 2 |
| F-084 | Remove empty `app/math-physics-foundations/` | 2 |
| F-085 | Remove commented duplicates in `layout.tsx:124-132`; unused dict fetches (`layout.tsx:22`, `games/page.tsx:20`) | 2 |
| F-086 | Unused deps (ASSESSMENT-HARNESS §5) → `npm prune` from package.json | 7 |
| F-087 | Fix `export` script (`next export` removed in Next 14) | 7 |
| F-088 | Tailwind config scans nonexistent `./pages` | 7 |

### Security

| ID | Fix | Phase |
|---|---|---|
| F-090 | Add `rehype-sanitize` after `rehype-raw` (`MarkdownRenderer.tsx:6,350`) — allowlist `class` for KaTeX/callouts | 6 |
| F-091 | Mermaid `securityLevel: 'strict'` (verify diagrams still render) | 6 |

---

## Legacy cross-reference (`docs/assessment/ASSESSMENT.md`, Sep 6 — 23/25 open)

| Legacy ID | Status | New home |
|---|---|---|
| BUG-01 contact metadata | OPEN | F-011 |
| BUG-02 vocab stale state | OPEN | F-010 |
| BUG-03 tools locale fallback | OPEN | F-009 |
| BUG-04 course link fallback | OPEN | F-002 |
| ISSUE-05 `dict: any` | OPEN | F-021/F-022 + TS-strict phase |
| ISSUE-06 vocab hardcoded EN | OPEN | F-021 |
| ISSUE-07 library filter types | OPEN | F-044 |
| ISSUE-08 results count EN | OPEN | F-029 |
| ISSUE-09 course plural EN | OPEN | F-028 |
| ISSUE-10 lesson locale params | OPEN | covered by course-gate expansion (PLAN P1) |
| SEC-01 rehype-raw | OPEN | F-090 |
| IMPROVE-11 Eisenhower inline maps | OPEN | F-022 |
| IMPROVE-12 no loading on dynamic imports | OPEN | F-100 (below) |
| IMPROVE-13 mermaid course | OBSOLETE | — (course removed) |
| IMPROVE-14 page copy.tsx | OPEN | F-080 |
| IMPROVE-15 container-custom | re-check in F-067 | F-067 |
| IMPROVE-16 error boundaries | OPEN | F-004 |
| IMPROVE-17 placeholder about title | OPEN | F-047 |
| IMPROVE-18 slider reset | OPEN | F-101 |
| SEC-02 mermaid loose | OPEN | F-091 |
| SEC-03 formspree placeholder | OPEN | F-015 |
| PERF-01 lazy loading | OPEN | F-045 |
| IMPROVE-19 ts strict | CLOSED (Phase 1) | H-002 → `strict: true` ×3, `ignoreBuildErrors` removed |
| IMPROVE-20 robots/sitemap | OPEN | F-055 |
| IMPROVE-22 footer placeholder links | OPEN | F-048 |
| IMPROVE-24 sharp unused | CLOSED (Phase 1) | F-086 → sharp pruned from package.json |

## Extra fixes referenced above

| ID | Problem | Fix | Phase |
|---|---|---|---|
| F-100 | `tools/[slug]/page.tsx` dynamic imports have no `loading:` fallback | add skeleton/loading state | 7 |
| F-101 | `vocabulary-game-client.tsx:41` `useEffect([game,numPairs])` resets slider on unrelated changes | fix deps (migrates with Languages app) | 5 |
| F-102 | 7 eslint warnings (react-hooks deps ×3, MoleculeViewer ref, BrainWriting/DecisionMatrix/Pomodoro) | fix all; lint becomes CI-blocking in Phase 1 | 1 |
| F-103 | `resolveContentUrl` dead + would emit 404 bare-course URLs (`get-roadmap-content.ts:144-158`) | use helper in `RoadmapStepCard:195`, guard bare courses against new landing page | 6 |

## Content-quality defects (post-review scan — all fixed Oct 20, 2026)

| ID | Defect | Scope | Status |
|---|---|---|---|
| F-104 | Mermaid blocks failing real `mermaid.parse` (unquoted `(`/`"`/`|` in labels, unquoted subgraph titles, stray brackets, class-diagram arrow in flowchart, missing edge-label `\|`, `;` in sequence notes, `{id}` in edge labels) | 75 blocks · 31 base files × locales · 9 courses (computing-imperative-python 24, processes-flowchart 18, aws-dea-c01 7, algorithm-foundations 6, ddd 6, databricks 5, aws-data-lakehouse 3, clean-architecture 3, python-advanced 3) | **Fixed** — repo-wide 2,738 blocks parse; locale gates 26/26 green |
| F-105 | Unsupported locale callout markers (`[!NOTA]` `[!SUCESSO]` `[!ÉXITO]` `[!IMPORTANTE]` `[!DICA]` `[!CONSEJO]` `[!AVISO]` `[!ADVERTENCIA]`) rendered as literal text | 178 markers · langgraph-intermediate/advanced pt+es (40 files) | **Fixed** — normalized to canonical EN types; renderer additionally accepts aliases as safety net (F-109) |
| F-106 | Empty callout bodies: content after `> [!TYPE]` not prefixed with `>` (body fell outside the callout box); pipe-prefixed prose bodies | 197 + 9 instances · 148 files · rust-*, python-*, sql-intermediate, agentic-ai-development, ddd, opencode-agents (all locales) | **Fixed** — bodies wrapped into callouts; detector 0 remaining; parity preserved |
| F-107 | Translation defects: EN prose left untranslated in pt/es; bare EN headings | 58 prose lines + ~16 headings (langgraph int/adv), bare `## Practice Questions` ×52 files (math-foundations pt, opencode-fundamentals/production/workflows pt+es), sql-intermediate CTE H1+frontmatter, nonprofit-es PT contamination (es/01,05–09,11), pt "gaveta" calque ×2 | **Fixed** — verify_translation 40/40 rc0 (langgraph), gated pt validate rc0 |
| F-108 | Mermaid parse failures in docs (architecture-beta space-icons + group→group edge + nested brackets in labels; `Author: "…"` quote-inside-label) | 4 blocks · `docs/architecture/ARCHITECTURE.md` ×2, `docs/ai/OPENCODE-HARNESS.md` ×2 | **Fixed** — docs+content 2,786 blocks parse; diagram meaning preserved (CDN modeled as service) |
| F-109 | `MarkdownRenderer` callout gaps: no locale alias handling; hardcoded English callout labels on pt/es pages; `**bold**` titles rendered as literal asterisks in label span; no `lang` passed | `components/markdown/MarkdownRenderer.tsx`, `app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx` | **Fixed** — alias map (NOTA→NOTE, …), per-lang labels (en/pt/es), `renderAlertLabel()` emphasis→HTML, optional `lang` prop; `tsc` clean |
| F-110 | `validate_mermaid.py` was a regex heuristic: 151/161 false `end` warnings, 0/75 real failures detected | `.opencode/skills/mermaid-js/scripts/` + CI | **Fixed** — ground-truth `parse_check.mjs` (installed mermaid + jsdom), heuristics only as no-Node fallback; CI step added; 48/48 skill tests pass |
| F-111 | No gate for callout marker/body defects (regression protection) | new `course-writer/scripts/callout_lint.py` + CI step + tests | **Fixed** — fence-aware lint (unsupported/alias types, empty bodies, stacked markers, both styles); 1,447 files clean; 20/20 tests pass |

## Phase 1 closeout — harness & CI (2026-10-20)

| ID | Status | Evidence |
|---|---|---|
| F-014 | **Fixed** | pytest dev deps via `uv` (`uv sync --extra dev --frozen` in CI); `tests/` collectable (unified `testpaths`, removed stray `tests/__init__.py`, `sys.modules` pop guards for the shared `skill_tester` module); broken `pytest-check` pre-commit block stripped (decision D9); CI step `uv run --no-sync pytest` green |
| F-040 | **Fixed (rides Phase 1)** | `CourseInfo.author?: string` populated in `getAllCourses` from `courseJson.author` (all 49 `course.json` carry top-level `author`) |
| F-086 | **Fixed** | 13 unused deps pruned from `package.json` (incl. `sharp`); each candidate verified by import grep before removal |
| F-087 | **Fixed** | dead `"export"` script removed (`next export` gone since Next 14); engines `">=22 <23"` + `.node-version` pin shared with workflow |
| F-102 | **Fixed** | 7 ESLint warnings fixed (flashcards deps, vocabulary-game `useCallback`, BrainWriting latest-ref, DecisionMatrix lookup, Pomodoro `handleSessionEnd` — the last two also fixed real stale-closure bugs); `ignoreDuringBuilds` removed from `next.config.js`; CI `npm run lint` step blocking at 0/0 |
| H-002 (= IMPROVE-19) | **Fixed** | `strict: true` in all 3 tsconfigs; matrix components fixed by-file (EisenhowerMatrix 44, SWOTMatrix 39) + small-file fixes (UnitConverter, math-challenge, `types/3dmol.d.ts` ambient module, TDZ reorders); `typescript.ignoreBuildErrors` removed; `tsc --noEmit` = 0 |
| H-003 | **Fixed** | unified pytest harness: 436 passed / 1 skipped / 1 xfailed, coverage 81.49% ≥ `fail_under = 80`; CI pytest step after setup-uv |

Also landed in Phase 1 (harness scope): `passWithNoTests` removed (vitest 683 tests / 5 suites); games validator 2→8 categories + snowpro id normalization + vocab exact-row dedupe (13/13 green); new `validate-library`/`validate-roadmap`/`validate-tools` hooks (92 files green); dict-parity CI step; all-49 course structure gate + 28 lesson-gate pairs with [GATE-WAIVERS.md](./GATE-WAIVERS.md); dict orphan `tip4` removed (parity rc0); 3 rc2 courses renamed to kebab-case (all 49 pass `validate_course`); Instagram handle `@thenuniversity` → `@nuniversityedu` (6 spots); `parse_check.mjs` stale-git-index fix; ordered local CI simulation 13/13 PASS.

## Phase 2 closeout — critical bug fixes (2026-10-21)

| ID | Status | Evidence |
|---|---|---|
| F-001 | **Fixed** | Full library curation (D19): 7 shallow URLs deepened (re-curated, all 200), 29 dead thumbnails stripped, veduca dup course deleted, 31-row `content/library/link-exceptions.tsv`; detectors extended (https-only + dup-URL + exceptions) in TS + mirrored in `validate_library.py`; LIVE_LINKS=1 gated live test (58 pass); `.scratch/CURATION-SUMMARY.md` evidence |
| F-002 | **Fixed** | `app/[lang]/courses/[courseSlug]/page.tsx` force-static landing (hero, normalized difficulty badge, duration, lesson count, syllabus, Start → `lessons[0]`); 143 landings exported (en 47 / pt 49 / es 47); cards rewired to landing |
| F-003 | **Fixed** | `public/index.html` cookie→navigator→`en` JS redirect (noindex); `serve out` `/` lands on `/en/` |
| F-004 | **Fixed (404 scope)** | `app/[lang]/404` + `not-found-client` (typed dict, `?p=`, chrome); locale stubs `out/{en,pt,es}/404/` + root `404.html`; **residual:** `error.tsx`/`global-error.tsx` boundaries deferred to Phase 7 |
| F-005 | **Fixed** | `interactive` dispatch: `lib/markdown/split-answer.ts`, items-mode FillBlank, new click-based `BucketDropQuestion` (no dnd-kit); MarkdownRenderer `interactive` branch + langMap; 25 vitest + `test_interactive_blocks.py` (total==12); verify_out invariant "exam-b processed" |
| F-006 | **Fixed (fallback)** | en-fallback in `get-library-resources.ts` — `/es/library/` shows EN items until Phase 3 content |
| F-007 | **Fixed** | postbuild canonical rewrite (`scripts/postbuild.mjs`): 1585 replaced / 0 inserted every build; verify_out canonical=self on sampled pages |
| F-008 | **Fixed** | `public/og-image.png` via `scripts/og-image.py` (pillow in dev extra), committed 1200×630; verify_out dimension check |
| F-009 | **Fixed** | `getAllTools`/`getToolMetadata` en-fallback + union `generateStaticParams` (`Array.from(Set)`); all 10 slugs × 3 locales export |
| F-010 | **Fixed** | completion derived in `useEffect` (matchedPairs vs `gameWords.length`) — stale-closure race closed; 4 vitest tests incl. overlay-not-early |
| F-011 | **Fixed** | `ContactPage` rewrite, localized metadata `dict.metadata.contact.*` |
| F-012 | **Fixed** | dev-only documented in middleware comment; production root/no-locale = F-003 + localized 404 |
| F-013 | **Fixed** | `notFound()` in roadmap detail |
| F-015 | **Fixed** | `ContactForm.tsx` deleted (F-082) |
| F-024 | **Fixed** | home stats → `dict.stats.labels.*` |
| F-025 | **Fixed** | FeaturedCourses: area → `dict.courses.areas`, All Levels → `all_levels`, "Course" → lessonCount; `difficulty_labels` keys added ×3 |
| F-026 | **Fixed** | `Tools.tsx` → `dict.tools.view_all` |
| F-027 | **Fixed** | `Newsletter.tsx` → `dict.footer.newsletter.noSpam` |
| F-028 | **Fixed** | courses-client count → `dict.courses.count.{course,courses}` (`{n}` replacement); `lessonCount` wired from `CourseInfo` |
| F-029 | **Fixed** | library-client showing-count → `dict.library.showing` |
| F-041 | **Fixed** | `normalizeDifficulty` alias table in `get-course-content.ts` (loader choke point ×4 sites incl. lesson metadata); badge color switch now matches; pytest `test_difficulty_aliases` gates course.json top+locale + lesson frontmatter |
| F-042 | **Fixed** | pseudoRating + Star removed |
| F-043 | **Fixed** | literal "Course" → `{lessonCount} {lesson\|lessons}` dict plural |
| F-044 | **Fixed** | library filter types derived from data |
| F-045/F-068 | **Fixed** | next/image + `loading="lazy"` + placeholder strategy; dead thumbs stripped (F-001) |
| F-047 | **Fixed** | about title real strings ×3 |
| F-048 | **Fixed** | resources column + privacy/terms/cookies trio deleted (D24) |
| F-050 | **Fixed** | `generateMetadata` on roadmaps list (dict) + detail (roadmap title/description) |
| F-051 | **Fixed** | library/tools list metadata verified localized; games metadata remains Phase 3 (F-034) |
| F-055 | **Fixed** | `app/sitemap.ts` force-static (1582 URLs: hubs+landings+lessons+tools+games+roadmaps ×locales, slash URLs) + robots Sitemap line + postbuild fallback |
| F-056 | **Fixed** | `Ads.txt` → `ads.txt` |
| F-057 | **Fixed** | layout: `viewport` export themeColor; single slash `languages`+x-default set; duplicate head block removed |
| F-058 | **Fixed** | breadcrumb course segment → Link to landing |
| F-062 | **Fixed** | avatar `w-full h-full object-cover` |
| F-080 | **Fixed** | `page copy.tsx` deleted |
| F-081 | **Fixed** | `lesson-client.tsx` deleted; design captured in `DESIGN-LESSON-OUTLINE.md` |
| F-082 | **Fixed** | `components/contacts/ContactForm.tsx` deleted |
| F-083 | **Fixed** | `AdsSpace.tsx` + empty `components/ads/` deleted |
| F-084 | **Fixed** | empty `app/math-physics-foundations/` removed |
| F-085 | **Fixed** | layout commented Providers block removed; layout `dict` kept (used by Header/Footer) |
| F-103 | **Fixed** | `resolveContentUrl` extracted to pure `lib/roadmaps/resolve-content-url.ts` (client-safe) + wired in `RoadmapStepCard` (2-part ref → lesson URL, bare course → landing, trailing slashes) |

Legacy cross-reference flips: BUG-01, BUG-02, BUG-03, BUG-04, ISSUE-07, ISSUE-08, ISSUE-09, SEC-03, IMPROVE-14, IMPROVE-17, IMPROVE-20, IMPROVE-22, PERF-01 → **CLOSED**. IMPROVE-16 → **partial** (404 shipped; error boundaries deferred Phase 7). F-049 accepted as-is (build-frozen year).

## Phase 3 closeout — i18n completeness (2026-10-22)

Deep plan: [PLAN-PHASE3.md](./PLAN-PHASE3.md) (W0–W10), decisions **D31–D35**.

| ID | Status | Evidence |
|---|---|---|
| F-020 | **Fixed** | games hub: categories/empty states/search/difficulty → `dict.games.*` (+`quiz/puzzles/conversation` category keys ×3) |
| F-021 | **Fixed** | all 11 game clients read `dict` (binary-hex, typing-speed, number-sequence, math-challenge, periodic-table, word-search wired in Phase 3; conversation/flashcards/vocabulary pre-wired; quiz per D32) |
| F-022 | **Fixed** | all tool components wired; Eisenhower (39 keys) + SWOT (44 keys) inline maps absorbed verbatim into `dict.tools.*` ×3 with report/templates/confirmClear; Regex/UnitConverter/Pomodoro/Habit/BrainWriting/DecisionMatrix/FlashcardMaker wired |
| F-023 | **Fixed** | 30 frontmatter files → 10 canonical slugs (identical ×locales); shared `lib/tools/tool-icons.ts` (10 icons); cards render `tool.icon`; `study` group icon/color; home `iconBgMap` re-keyed to slugs; tools validator `VALID_CATEGORIES` updated (D35 — same batch) |
| F-030 | **Fixed** | `AboutContent.learn_more` ×3 + `{content.learn_more \|\| 'Learn more'}` render |
| F-031 | **Fixed** | roadmap detail `generateMetadata` → `dict.roadmaps.notFound` |
| F-032 | **Fixed** | QuestionBlock, Matching, FillBlank (Items+Template), DragOrder, BucketDrop all read `dict` (EN-fallback reads); MarkdownRenderer forwards `dict` at 7 dispatch sites; lesson page passes `dict={dict}` |
| F-033 | **Fixed** | Pomodoro + HabitTracker date rendering → lang (`toLocaleDateString`), weekday array localized; UnitConverter 68 units ×3 via `t.units` with locale-aware `toLocaleString` |
| F-034 | **Fixed** | games index + 8 detail `notFound` metadata; suffixes via `dict.games.suffixes.*`; 12 game JSONs gained `locales.title/description`, loaders locale-aware — pt/es titles verified on export (D31) |
| F-035 | **Fixed** | layout `metadata.site` per-locale (title/description/og/keywords/JSON-LD contactType/availableLanguage) |
| F-052 | **Fixed** | `NN-` lesson-prefix alias map, 5 divergent courses (`lib/i18n/course-lesson-aliases.json` + `scripts/generate-lesson-aliases.mjs`, en↔pt↔es coverage verified) + course-landing fallback; switcher strips/rewrites locale segment; 3 switcher vitest tests green (D34) |
| F-006 | **Fixed (content)** | `content/library/es/` 58 items (ids `-es`, global id-uniqueness test), `link-exceptions.tsv` +28 rows; pytest 491 (D33) — replaces the Phase 2 fallback |
| F-053 | **Deferred → 9** | per-lesson en-fallback retained (no policy change: 143 landings + all lessons export); missing pt/es lesson translations stay a Phase 9 content item |

Also landed: difficulty badge localization sweep found by the leak audit (home `FeaturedCourses`, courses list cards + filter, course landing lesson badges, roadmaps list + timeline incl. wrong `roadmaps.difficulty` string-index nesting, library resources → `difficulty_labels`/`difficultyLevels`/`library.difficulty` dict lookups); `tools.tool_count`/`tool_singular` keys ×3; leak audit as a blocking `verify_out` extended invariant (27 chrome strings + raw difficulty-slug text-node probe over `out/pt`+`out/es`, `/games/quiz/` waived per D32, lesson bodies excluded from the slug probe as Phase-4 content).

**Totals:** 15 P0 · 38 P1 · 30+ P2 (incl. legacy mapping) + 8 content-quality defects (F-104–F-111) — sequenced across Phases 1–7 in [PLAN.md](./PLAN.md); F-104–F-111 closed ahead of Phase 9; Phase 1 harness items closed 2026-10-20; Phase 2 critical-bug items closed 2026-10-21 (residual: error.tsx boundaries → Phase 7); Phase 3 i18n items closed 2026-10-22 (residuals: full quiz i18n + question banks → Phase 4 per D32/F-046, F-053 missing translations → Phase 9, F-021 beyond-existing vocab wording → Phase 5).
