# Plan — High-Level Execution Roadmap

Nine phases from harness-hardened green → bug-free → translated → new apps → rich
learning experience → content resumption. Each phase: goal, workstreams (file refs to
[FIXES.md](./FIXES.md)/[IMPROVEMENTS.md](./IMPROVEMENTS.md)/design docs), acceptance
criteria, dependencies, size, risks.

**Guiding principles**
- Harness first (Phase 1) so everything after lands *verified*.
- Static-export constraints: all state in `localStorage`, redirects via stub pages, no API routes.
- Gates stay green: CI content validation (all-49 structure gate + 28 lesson pairs + legacy `--legacy`; waivers in [GATE-WAIVERS.md](./GATE-WAIVERS.md)) must never regress.
- One phase = one reviewable unit; sizes are T-shirt (S/M/L/XL).

---

## Decision log (locked with stakeholder)

| # | Decision |
|---|---|
| D1 | Deliverables in `docs/assessment/2026-app-review/` (legacy ASSESSMENT.md kept as historical, cross-referenced) |
| D2 | New quiz/exam app route: **`/[lang]/quizzes/`** |
| D3 | **Harness hardening is Phase 1** (early), not last |
| D4 | Languages app: **full hub**, moves the **5 vocabulary games** only; conversation game stays in Games |
| D5 | Deliverable set includes two dedicated design files (quizzes + languages) |
| D6 | Content creation resumes only at Phase 9 |
| D7 | Phase 1 gating shape: course-level `validate_course` for **all 49 dirs** (rc2-fatal) + lesson-level gates for all complete pairs (28), remaining 110 pairs waived in [GATE-WAIVERS.md](./GATE-WAIVERS.md); lesson retrofit deferred to Phase 9 |
| D8 | Python harness: full pytest conversion + suite expanded to all 49 courses (parametrized), coverage `fail_under = 80` |
| D9 | Both hook systems (git-hooks + .opencode) stay; only the broken `pytest-check` block stripped from `.pre-commit-config.yaml`; ruff/bandit dormant (no CI ruff step) |

---

## Phase 1 — Harness & CI hardening (size: M)
*Make quality enforceable before touching features.*

**Workstreams**
1. CI lint: add `npm run lint` step; fix the 7 warnings (F-102) so it passes; un-ignore ESLint in `next.config.js` for CI clarity.
2. TypeScript strictness (gradual): `strict: true` → fix fallout (72 `any`s; `author` mismatch F-040 rides along) → remove `typescript.ignoreBuildErrors` (H-002, legacy IMPROVE-19).
3. Real vitest suites (today: 0 files behind `passWithNoTests`):
   - data integrity: every course has `course.json`, lesson slugs unique, first-lesson resolves;
   - i18n dictionary key parity (port of `check-i18n-parity` hook);
   - library link-check (bare-domain/404 detector → powers F-001);
   - component smoke tests (QuestionBlock check/feedback, LanguageSwitcher path swap).
4. Content-ops validators into CI: fix `validate-game-json` `VALID_CATEGORIES` (2→6), add library/roadmap/tool validators, dict parity step; expand course gating from 26 → all 49 pairs (fix or explicitly whitelist legacy-failing EN sources with documented reason).
5. Python harness: remove committed `egg-info`/`.coverage`; fix `pyproject` coverage sources; make `tests/` pytest-collectable (conftest + signature fix); install dev deps in CI and run `pytest`; align or disable pre-commit hook (F-014).
6. Version/trigger hygiene: node pin unified (`.node-version` = workflow), add `pull_request` trigger, drop dead `export` script, prune unused deps (F-086/087).

**Acceptance:** CI runs lint + strict build + real tests + all validators; all 49 courses gated or waived-with-reason; `pytest` green; `npm test` executes ≥ meaningful suite; no regression in the 26-pair content gate.
**Depends on:** nothing. **Risks:** strict-mode fallout volume → timebox, fix by-file.

**Status (2026-10-20): ✅ Complete.**
Evidence: CI = 21 steps, PR trigger, node pinned, uv-managed python; `tsc --noEmit` 0 with `strict: true` ×3 configs; ESLint 0/0 (7 warnings fixed) and CI-blocking; vitest 683 tests / 5 suites with `passWithNoTests` removed; pytest 436 green, coverage 81.49% ≥ 80; content gates all-49 structure + 28 lesson pairs (waivers: [GATE-WAIVERS.md](./GATE-WAIVERS.md)) + games 13/13 + library 59 + roadmap 3 + tools 30 + dict parity; ordered local CI simulation 13/13 PASS. Deviations from workstream wording: game categories fixed 2→**8** (not 6); lesson gating landed as structure-gate-all-49 + 26→28 gated pairs + waiver manifest (decision D7), not per-lesson retrofit; pre-commit ruff/bandit kept dormant (D9) — ruff reports 38 residual errors in `.opencode/skills/*/scripts` (deferred backlog, never CI-blocking) and 2 in test files (`skill_tester.py:55` RUF013, `:122` S110).

## Phase 2 — Critical bug fixes (size: L)
*Everything in FIXES P0 + cheap P1 wins.*

**Workstreams**
1. Library deep-link curation (F-001) — editorial pass over all 59 items + link-check script output; dedupe; dead thumbnail fallback (F-045).
2. Course landing pages (F-002) — syllabus route; rewire card/breadcrumb/roadmap links (F-058, F-103).
3. Root + 404 experience (F-003, F-004, F-012, F-013).
4. `interactive` fence dispatch (F-005) + exam-simulation rendering proof.
5. ES library fallback (F-006) until Phase 3 content.
6. SEO P0: canonicals (F-007), og-image (F-008), sitemap/robots/ads.txt (F-055/056/057).
7. Quick data/metadata fixes: contact page (F-011), about titles (F-047), author/badges/rating placeholders (F-040–043), footer links (F-048), roadmap metadata (F-050), avatar overflow (F-062).
8. Dead-code sweep (F-080–085).
9. Tools locale-union static params (F-009), vocab stale-state (F-010).

**Acceptance:** P0 table all ✅; link-check 0 bare domains/0 hard 404s; `out/` has root index + localized 404 + all course landing pages; canonical self-referential on sampled subpages; export has zero commented-out files from the cleanup list.
**Depends on:** Phase 1 (validators catch regressions). **Size driver:** F-001 is editorial.

**Status (2026-10-21): ✅ Complete.**
Evidence: build 1585 canonicals replaced / 0 inserted; `app/sitemap.ts` emits 1582 URLs; postbuild writes root `404.html` + `out/{en,pt,es}/404/` locale stubs + en-fallback library; 143 course landings exported (47/49/47 per locale); library curation deepened 7 shallow URLs, stripped 29 dead thumbnails, deleted veduca dup, 31-row `content/library/link-exceptions.tsv` + https-only/dup-URL detectors + LIVE_LINKS=1 gated live test (58 pass); interactive adapter live (`split-answer.ts`, items-mode FillBlank, `BucketDropQuestion`; 25 vitest + `test_interactive_blocks.py` total==12; verify_out invariant "exam-b processed"); dead code swept (lesson-client 281 lines → `DESIGN-LESSON-OUTLINE.md`, page copy, ContactForm, AdsSpace+ads/, math-physics-foundations, favicon dup); vitest 712 pass / 58 gated-skip; pytest 491 pass / 1 skip / 1 xfail; ESLint 0/0; `tsc --noEmit` 0; ordered CI simulation **14/14 PASS** (incl. new verify-out step).
Execution decisions (beyond D1–D18): **D19** full library curation (editorial, CI-blocking link-check with exceptions file) over shallow trim · **D20** root redirect = committed `public/index.html` (cookie→navigator→en JS, noindex); middleware documented dev-only (F-012) · **D21** localized 404 = `app/[lang]/404` route + postbuild stubs; `html-lang` untouched · **D22** og-image committed PNG (pillow dev extra) · **D23** interactive dispatch ships new files (never guessed links) — F-005 proven at build time by verify_out · **D24** footer dead rows deleted (resources column + legal trio), not repointed · **D25** `validate_interactive` (source fence total==12) as pytest regression gate · **D26** difficulty normalized loader-side via alias table (single choke point ×4 sites) + pytest `test_difficulty_aliases` data gate. Also: `resolveContentUrl` moved to pure `lib/roadmaps/resolve-content-url.ts` (client-safe, no fs) and wired in RoadmapStepCard (F-103); `courses.difficulty_labels`/`all_levels` dict keys ×3; tools en-fallback + union `generateStaticParams` (F-009); vocab completion derived in `useEffect` (F-010). Residual (deferred, tracked): `error.tsx`/`global-error.tsx` boundaries (F-004 error-boundary scope → Phase 7 hygiene); F-049 build-frozen year accepted.

## Phase 3 — i18n completeness (size: L)
*Games, tools and every English leak.*

**Workstreams**
1. Tools: dict wiring in 7 components, Eisenhower/SWOT map migration, category normalization (F-022/023), localized metadata.
2. Games (non-vocabulary): 6 clients + index + metadata (F-020/021/034); `locales` blocks for untranslated JSONs via i18n gates (conversation already done).
3. Remaining leaks: home stats/featured/tools/newsletter (F-024–027), courses plural (F-028), library count (F-029), about/roadmaps (F-030/031), lesson widgets (F-032), Pomodoro/Habit/Unit (F-033), layout metadata (F-035).
4. Language switcher slug awareness (F-052); partial-lesson policy (F-053).
5. ES library content creation — translate/port `content/library/es/` (F-006 end-state).

**Acceptance:** grep-style leak audit clean on `/pt`/`/es` exports for games/tools/home/list pages; every moved/kept game client reads `dict`; `/es/library/` populated; page titles/descriptions localized for all hub/list pages.
**Depends on:** Phase 2 (metadata fixes share files). **Risks:** dictionary growth merge conflicts — one namespace per phase.

**Status (2026-10-22): ✅ Complete.**
Evidence: deep plan executed from [PLAN-PHASE3.md](./PLAN-PHASE3.md) (workstreams W0–W10). Dictionaries grew ~470 keys ×3 (`metadata.site`/`metadata.games`, `games.*` chrome + per-game namespaces, `widgets.*` ~34, `tools.*` incl. Eisenhower/SWOT inline maps absorbed verbatim from source — 39/44 camelCase keys ×3), parity 5/5 green throughout. All 11 game clients read `dict` (D32 quiz = minimal shared-key wire); 12 game JSONs gained `locales.title/description`, loaders locale-aware, pt/es titles verified on export (D31, F-034); F-020 hub chrome/empty states wired. Tools: F-022 — all components wired (`dict: any` convention + `tpl/t2` interpolation helper from flashcard pattern), Eisenhower/SWOT migrated to dictionaries; F-023 — all 30 frontmatter files normalized to 10 canonical category slugs, shared `lib/tools/tool-icons.ts` (all 10 icon names), card icons = `tool.icon`, `study` group icon/color added, home `iconBgMap` re-keyed to slugs, tools validator `VALID_CATEGORIES` updated (D35). Widgets (F-032): QuestionBlock, Matching, FillBlank (Items + Template modes), DragOrder, BucketDrop all read `dict` with EN-fallback reads; MarkdownRenderer forwards `dict` at 7 dispatch sites; lesson page passes it. F-033 Pomodoro/Habit (lang-aware dates) + UnitConverter (68 units ×3); F-030/031/035 about/roadmap/layout metadata. F-006 end-state: `content/library/es/` 58 items + `link-exceptions.tsv` +28 rows (D33) — pytest 491 green. F-052: `NN-` prefix alias map for 5 divergent courses (`lib/i18n/course-lesson-aliases.json` + `scripts/generate-lesson-aliases.mjs`, coverage-verified both directions) with course-landing fallback; switcher strips/rewrites locale segment (3 vitest tests green) (D34). Bonus audit fixes: difficulty badges localized across home/courses/lesson/roadmaps/list surfaces (incl. wrong `roadmaps.difficulty` nesting → `difficultyLevels`, raw-slug badges). Leak audit wired into `verify_out` extended invariants: 28 curated probes (27 EN chrome strings over `out/pt`+`out/es` + case-insensitive raw difficulty-slug text-node probe with script/code/token stripping; `/games/quiz/` waived per D32; lesson bodies excluded from the slug probe — Phase-4 content). Final ordered CI simulation **14/14 PASS** (`tsc` 0, ESLint 0/0, pytest 491, vitest **1002 pass / 116 skip**, build + postbuild, verify_out incl. leak audit).
Execution decisions: **D31–D35** locked and executed per [PLAN-PHASE3.md](./PLAN-PHASE3.md) (game locales, quiz minimal-wire waiver, ES library, switcher alias map, tool icon/category batch). Residuals (deferred, tracked): full quiz i18n + question-bank/word-list translation → Phase 4 (D32, F-046); F-053 missing lesson translations → Phase 9 (per-lesson en-fallback retained — 143 landings + all lessons export); F-021 vocabulary wording beyond existing dict reads → Phase 5.

## Phase 4 — Quizzes app (size: L)
*Per [DESIGN-QUIZZES-APP.md](./DESIGN-QUIZZES-APP.md).*

**Workstreams:** schema + loader → move Snowflake data → refactor player (i18n, persistence, components) → hub pages → ExamRunner for exam-simulation lessons (+ F-005 proof) → certificates → redirect stubs → validator + CI entry → nav link (requires header F-060 — at minimum a temporary header slot).

**Acceptance:** all seven criteria in DESIGN §10.
**Depends on:** Phase 1 (validator/CI pattern), Phase 2 (F-005), header fix (Phase 7 or a dedicated early header task — see risk).

**Status (2026-10-22): ✅ Complete.**
Evidence: deep plan executed from [PLAN-PHASE4.md](./PLAN-PHASE4.md) (workstreams W0–W8, decisions **D36–D44**). Data: legacy `content/games/quiz/` moved to `content/quizzes/snowpro-core-cof-c03.json` on the generalized schema (D36, `.scratch/migrate-quiz.py`); loader/types in `lib/quizzes/`. Dictionary: new `quizzes.*` namespace (160 leaves ×3) + `metadata.quizzes` + `navigation.quizzes` (+ `quizzes.promo.*` for the games-hub link-through card), parity 5/5 green throughout; `games.categories.quiz`/`games.suffixes.quiz` removed ×3 with consumers gone (D40/D43). Storage: `lib/quizzes/storage.ts` versioned `v1:quizzes-*` keys (12/12 tests, D42). Validator: new `.opencode/hooks/validate-quiz-json/` hook + pytest (9 tests), quiz stripped from the game hook, workflow + `ci_sim.sh` gates (D39). Routes: hub `/{lang}/quizzes/` + single `[quizSlug]` detail (deep-links deferred, D37) + noindex redirect stubs at `app/[lang]/games/quiz/[slug]/` (D38) + sitemap `quizzes` loop. Player: 1,448-line `quiz-game-client.tsx` refactored into 8 `components/quizzes/*` files with zero hardcoded EN, printable `CertificateCard`, acceptance-7 a11y + print fixes. Exam-sim lessons: all 5 lessons (15 files) flagged `exam`/`examMinutes` → `lib/markdown/exam-questions.ts` extractor → `LessonExam` session with deferred grading (QuestionBlock `reveal`), +3 vitest files (+5 tests). Nav: Quizzes item + temporary `md→lg` header shift + Footer link + games-hub promo card (D43). Verification: `verify_out.mjs` leak waiver retired (`LEAK_WAIVERS = []`, D32/F-046 closed) with 5 curated quiz probes added (33 total), quiz hub/detail/stub/sitemap/exam-lesson invariants; final ordered CI simulation **15/15 PASS** (`tsc` 0, ESLint 0/0, pytest 500, vitest **1019 pass / 116 skip**, build + postbuild, verify_out, mermaid/callouts gates).
Execution decisions: **D36–D44** locked and executed per [PLAN-PHASE4.md](./PLAN-PHASE4.md) (generalized quiz schema, single detail route, noindex redirect stub, dedicated validator hook, `quizzes.*` namespace, lesson ExamRunner for all 5 exam-sim lessons, versioned storage keys, temporary nav slot, sitemap/docs sweeps). Residuals (deferred, tracked): `/practice`/`/exam` deep-links (design-optional) → post-Phase-4; question-content translation (833) → Phase 9 (D32 policy); full header redesign F-060 → Phase 7 (temporary `md→lg` slot now); review-by-domain + home "Test yourself" rail → Phase 6/8.

## Phase 5 — Languages app (size: M)
*Per [DESIGN-LANGUAGES-APP.md](./DESIGN-LANGUAGES-APP.md).*

**Workstreams:** move 5 JSONs + clients → `lib/languages` loader → hub + pair + player routes → `languages.*` dict → progress persistence → redirect stubs → games index/category cleanup → validator + CI → nav link.

**Acceptance:** all seven criteria in DESIGN §9.
**Depends on:** Phase 4 patterns (build quizzes first), Phase 3 (shared leak fixes), header capacity.

**Status (2026-10-23): ✅ Complete.**
Evidence: deep plan executed from [PLAN-PHASE5.md](./PLAN-PHASE5.md) (workstreams W0–W9, decisions **D45–D53**). Coverage pre-work first (W0: `tests/test_validator_coverage.py` → 80.29% ≥ 80). Data: 5 JSONs `git mv` → `content/languages/vocabulary/` (word counts unchanged); `lib/games` vocabulary code stripped (CRLF preserved), new `lib/languages/{types,get-language-content}.ts` (gameType default `matching`, locale merge, pair derivation). Dictionary: new `languages.*` namespace (75 leaves ×3) + `metadata.languages` + `navigation.languages`/`navigation.more` + `languages.promo.*`, migration of `games.flashcards`(38 keys)+`games.instructions.vocabulary_match`, dead `games.categories.vocabulary`/`quizzes.card.languages` removed, parity 5/5 green throughout. Storage: `lib/languages/storage.ts` `v1:lang-progress-*` + `v1:lang-best-*` with **dual-read** of legacy `flashcard_progress_*` (read-only) + matching best-score (accuracy, tie→faster) — 17 vitest. Routes: hub `/{lang}/languages/` (search/type/difficulty filters, pair grouping, tracks section), `[pair]`, `[pair]/[activitySlug]` (pair-mismatch→404) + shared `lib/languages/format.ts` (server/client-safe helpers). Players: both clients moved to `components/languages/`, rewired to `languages.*`, storage-integrated (best-score chip, one-per-run record; flashcard dual-read load/versioned save), residuals **F-021 remainder/F-063/F-074/F-101** fixed. Stubs: 5 noindex `app/[lang]/games/vocabulary/[slug]` redirects (pair-resolved targets). Validator: new `.opencode/hooks/validate-languages/` (35 pytest incl. parametrized real files), vocabulary stripped from game hook (categories→6, schema/example updated), workflow step + `ci_sim` `languages-gate-5`, stale `games-gate-13`→`games-gate-7`. Nav: Languages primary item (`NEW` badge) + More▾ dropdown (About/Contact) at `lg` (D52, partial collapse). Games hub: vocabulary icon entry dropped + `languages.promo.*` cross-link card; sitemap gains `languages` hub/pairs/activities, no legacy vocabulary URLs. Verification: `verify_out.mjs` +16 languages invariants & 13 leak probes (45 total), final ordered CI simulation **16/16 PASS** (`tsc` 0, ESLint 0/0, pytest **566**, vitest **1036 pass / 116 skip**, build 1626 pages, verify_out, coverage **81% ≥ 80**).
Execution decisions: **D45–D53** locked and executed per [PLAN-PHASE5.md](./PLAN-PHASE5.md) (routes/data move, loader split, `languages.*` namespace with shared-keys copy-not-move, dual-read storage, client move+rewire, noindex stubs, dedicated validator hook, partial nav collapse, games-hub promo/sitemap). Residuals (deferred, tracked): full header redesign F-060 → Phase 7; home Languages rail → Phase 8; language course tracks → Phase 9; `dict: any` typing → TS-strict.

## Phase 6 — Learning experience (size: XL)
*The LMS leap: progress, scoring, search, gamification.*

**Workstreams**
1. Progress system (`lib/progress/storage.ts`): mark-complete, completed sets, % — surfaced on course landing/list/home (resume rail).
2. Lesson outline: sidebar/drawer (resurrect `lesson-client.tsx` design), heading TOC + anchors, scroll progress, keyboard nav, reading time, feedback widget.
3. Lesson score aggregation + review (feeds lesson-complete); partial credit in matching/fillblank.
4. Site-wide ⌘K search (build-time index over courses/lessons/tools/games/library/roadmaps/quizzes/languages).
5. Gamification v1: XP + streaks + badges (localStorage), wired to lessons/quizzes; certificates library page.
6. Platform polish bundled: rehype-sanitize (F-090), mermaid security (F-091), roadmap helper (F-103).

**Acceptance:** resume works across sessions; lesson “X/Y correct” summary displays; ⌘K finds a lesson by title in all 3 locales; badge awarded + persisted; no XSS-path regressions (sanitize in).
**Depends on:** Phases 2–5 (landing pages, quizzes). **Risks:** XL scope → sub-order 1→2→3→4→5, each independently shippable.

**Status (2026-10-24): ✅ Complete.**
Evidence: deep plan executed from [PLAN-PHASE6.md](./PLAN-PHASE6.md) (workstreams W0–W9, decisions **D54–D64** + amendments N1–N8). Dictionary: +52 leaves ×3 (`search.*`, `lesson.*`, `gamification.*`, `quizzes.certificates.*`, footer `links.languages/roadmaps` — D64), parity 5/5 green throughout. Stores: `lib/progress/storage.ts` (mark-complete → `{progress, newlyCompleted}`, course %, last-visited) + `lib/gamification/{types,profile,bus}.ts` (XP_GAINS +10/+20/+100, 5 badges, daily streak, level ladder, `recordAndEmit` pub/sub facade) — 46 tests. Lesson layer: `lg:grid-cols-[20rem_1fr]` shell, `LessonOutline` (h2/h3 TOC + scroll-spy + mobile drawer, syllabus ✓-check), `LessonProgress` (scroll bar, ←/→ keyboard nav, visit tracker, mark-complete), `LessonScoreContext` + 5 widgets + summary panel (partial credit; exam sessions excluded), `LessonFeedback`, heading ids + `scroll-mt-24`, reading-time chip ×3 locales; resume surfaces (ResumeCta, CourseProgressBadge, ContinueLearning, CourseContentList ✓). Search: `scripts/generate-search-index.mjs` (new `prebuild` hook; 515/596/563 docs → gitignored `public/search-index/`, library-id collision fixed, skip-on-empty → exit 1) + `lib/search/matcher.ts` (NFD fold, word-token AND, weighted scoring, type ranking) + `CommandPalette` (lazy `ssr:false`, grouped results, keyboard nav, per-instance fetch cache) + header ⌘K trigger (⌘/Ctrl detection) — 27 tests. Security: `rehype-sanitize` allowlist schema over `defaultSchema` with the N6 chain (raw → sanitize → headingIds → katex); callouts/details/`cite[index]`/kbd/interactive survive while scripts/`onerror=`/`javascript:` hrefs are stripped; MathBlock `trust` removed; mermaid `securityLevel: 'strict'` (F-090/F-091; D58/D59) — 11 tests. Gamification UI + certificates (D60/D61): `ProfileChip` (lg-only header chip + badge popover w/ streak row) + `AwardToaster` (xp/badge/level toasts, 4.5s) mounted in Header; `recordAndEmit` wired in `LessonCompleteButton` (lesson +10; course +100 gated on `lessonSlugs.every(completed)`), `QuizDetail` practice/exam, `LessonExam` course-exam; `/{lang}/quizzes/certificates/` (force-static ×3, `getBest` hydrate, existing `CertificateCard`, print) + quizzes-hub link + sitemap `weekly/0.7` — 20 tests. Verification: `verify_out` +~28 probes (search index sizes + EN trigger, post-sanitize KaTeX/details/cite/XSS-page probes, certificates route self-canonicals ×3 + sitemap + hub link, badge templates in client bundle, D64 footer links, +6 leak strings → 51-probe audit) all green; final ordered CI simulation **16/16 PASS** (`tsc` 0, ESLint 0/0, pytest 566 + coverage **81.04%**, vitest **1209 pass / 116 skip**, build 1,624 pages + postbuild, verify_out).
Execution decisions: **D54–D64** locked and executed per [PLAN-PHASE6.md](./PLAN-PHASE6.md) (per-course progress keys; lesson score excludes exam sessions; TOC from h2/h3 only; build-time JSON index with custom matcher instead of pagefind/flexsearch; sanitize layered over `defaultSchema` with fixed chain order; ProfileChip-only gamification UI with no `/profile` route; certificates hydrate from `getBest` with no new storage). Residuals (deferred, tracked): font-size control + heading copy-link → Phase 7 polish; roadmap 100% / language-streak badges + course-completion certificate → gamification v2 (D63 scope was 5 badges + quiz certificates); full header redesign F-060 → Phase 7.

## Phase 7 — Responsive, accessibility & SEO polish (size: M)

**Workstreams:** header redesign + drawer + language-switcher collapse (F-060/061 — *unblocks Quizzes/Languages nav*), responsive grid variants sweep (F-063–067), a11y set (F-070–073), unused-dep/`min-h-screen`/loading-state hygiene (F-065, F-086, F-088, F-100).

**Acceptance:** 320px/768px/1100px visual pass on home, courses, lesson, games, tools, library, roadmaps, quizzes, languages (no overflow, no clipped grids); axe/skip-link/reduced-motion checks; header fits with 9+ nav items via collapse.
**Depends on:** best after Phases 4–5 (nav items exist), but header fix may be **pulled early** as a sub-task if Phase 4/5 need nav room (tracked risk).

## Phase 8 — Roadmaps, home & library expansion (size: M)

**Workstreams:** home rails (roadmaps, games, continue-learning, quizzes/languages, search CTA; real stats); roadmap step auto-complete from lesson progress + render `conditionals` + dashboard; library detail pages (activate `getResourceById` + MD bodies) + collections; multi-roadmap content seeds (structure only — content lands Phase 9).

**Acceptance:** home shows ≥2 new rails with working links; roadmap-linked lesson visit checks the step; a library card opens a detail page with metadata + working outbound CTA.
**Depends on:** Phases 2 (course pages), 6 (progress).

## Phase 9 — Return to content creation (size: ongoing)

Explicit handoff back to the content loop (course-writer/i18n-translator gates unchanged):
- new courses (per backlog), language tracks for the Languages hub, additional roadmaps,
- library items (ES expansion, deep links), extra quizzes (AWS cert sets reusing the schema),
- translate deferred question banks (Snowflake pt/es) per DESIGN-QUIZZES §4 policy.
- Also closes residual content-type fixes: F-053 (missing lessons), F-054 (PT-only courses).

---

## Sequencing map (fix IDs → phase)

| Phase | Key fix IDs |
|---|---|
| 1 | F-014, F-086, F-087, F-102, H-002/003 (harness) |
| 2 | F-001–015, F-024–029, F-040–051, F-055–062, F-068, F-080–085 |
| 3 | F-020–023, F-030–035, F-052, F-053, F-006 |
| 4 | F-046 + DESIGN-QUIZZES |
| 5 | F-074, F-101 + DESIGN-LANGUAGES |
| 6 | F-090, F-091, F-103 + IMPROVEMENTS §2–3 |
| 7 | F-060–067, F-070–073, F-088, F-100 |
| 8 | IMPROVEMENTS §4, §1.2 (detail pages) |
| 9 | F-054 + content backlog |

## Cross-phase quality gates (Definition of Done for the program)

1. **CI green** including: lint, strict-mode build, real vitest suites, pytest, all content validators (courses incl. legacy `--legacy`, quizzes, languages, games, library, roadmaps, tools, dict parity).
2. **Zero P0** and zero unowned P1 items (each either fixed or explicitly deferred with ID + reason).
3. **Locale matrix:** for a sampled 20-page journey per locale — no EN leaks, no 404s, correct titles/canonicals (automated smoke preferred).
4. **Responsive pass** at 320/768/1100/1440 on every section (Phase 7 checklist).
5. **New apps live** with redirects verified old→new.
6. **Experience:** resume + lesson scoring + ⌘K search + one gamification loop demonstrably working.
7. Docs refreshed (INDEX/TESTING stats corrected); this review folder updated with per-phase status.

## Risks register

| Risk | Impact | Mitigation |
|---|---|---|
| Strict-TS fallout larger than estimated | Phase 1 slips | timebox; `noImplicitAny` first, `strictNullChecks` second |
| Header redesign late vs apps needing nav | Poor discoverability of new apps | pull F-060 into Phase 4 as sub-task if needed |
| F-001 editorial URL curation needs external verification | slow | script flags candidates; human verifies; ship in batches |
| localStorage schema changes across phases | data loss for early users | versioned keys (`v1:` prefix) from Phase 6 onward |
| Scope creep inside XL Phase 6 | stalled delivery | independent sub-shipments, acceptance per sub-item |
| GH Pages static redirects (no rewrites) | broken old links | client stub pages + internal link sweeps + sitemap regeneration |
