# Phase 4 — Deep Implementation Plan (Quizzes app)

Short-term execution plan. Extends [PLAN.md](./PLAN.md) Phase 4 with researched,
file-level detail. Status: ✅ executed 2026-10-22 — closeout evidence in [PLAN.md](./PLAN.md) Phase 4.

## Locked decisions (D36–D44)

| # | Decision |
|---|---|
| D36 | **Data.** Single `content/quizzes/{slug}.json` with the generalized schema (DESIGN §4) — transform script from the legacy shape (`mockExam` → top-level `durationSeconds`/`passingScore`/`domains`/`allocations`; `questions.domain` → `subdomain`; add `kind`/`slug`/`type`; `locales` slot for later question translation). Loader `lib/quizzes/get-quiz-content.ts` (`getAllQuizzes(locale)` / `getQuiz(locale)`); types move out of `lib/games`. Rejected: per-locale files (locale-merge complexity, no volume need); keeping the old schema (design mandates generalization for `kind: course-exam` reuse). |
| D37 | **Routes.** Hub `/{lang}/quizzes/` + single `/{lang}/quizzes/[quizSlug]/` detail — client state machine owns practice/exam modes. `/practice` and `/exam` deep-link routes **deferred** (design marks them optional; split routes = duplicated state/SSG cost). |
| D38 | **Redirect.** App-router stub page at the legacy path `app/[lang]/games/quiz/[slug]/page.tsx` — client `RedirectToQuizzes` (mount-time replace + `<noscript>` link fallback), `robots: noindex`, `generateStaticParams` from `content/quizzes` slugs × locales, thin localized countdown text. Rejected: postbuild-generated static HTML (duplicates canonical/sitemap logic; app-router stub is the design's "thin stub page"). |
| D39 | **Validator.** New `.opencode/hooks/validate-quiz-json/` (own `hook.json` pattern `content/quizzes/**/*.json`; script = ported + extended `validate_quiz`: `locales.questions` ⊂ base ids, `allocations` sum == 100, `kind` enum); quiz stripped from `validate-game-json` (VALID_CATEGORIES, validators, schema enum, examples, skill docs); CI workflow `find content/quizzes` step + `ci_sim.sh` gate. Old-path stub is not content → no hook. |
| D40 | **i18n.** New top-level `quizzes.*` namespace (~160 leaves) + `metadata.quizzes.{title,description,notFound}` + `dict.navigation.quizzes`; player drops all `games.*` reads; EN-fallback convention `dict.quizzes?.x \|\| 'EN'` retained; `dict.games.categories.quiz` / `dict.games.suffixes.quiz` removed ×3 after consumers disappeared. Parity test 5/5 gate (en/es no trailing newline, pt has one). |
| D41 | **ExamRunner scope.** All 5 exam-simulation lessons (15 files) — detection via frontmatter `exam: true` + `examMinutes: <n>` (validator tolerates extra keys); server-side extraction of ` ```question ` fences (`lib/markdown/exam-questions.ts` → typed items); lesson page branch renders `components/quizzes/LessonExam.tsx` (timer, navigator grid, deferred grading via QuestionBlock `reveal`, submit → score, attempt persisted to quizzes storage with `source: course-exam`); plain lessons unchanged. 327 fences in scope; other lessons' fences stay inline. Rejected: DOM-wrapper session (fragile). |
| D42 | **Persistence.** `lib/quizzes/storage.ts` with versioned keys `v1:quizzes-history-<slug>`, `v1:quizzes-best-<slug>`, `v1:quizzes-cert-name`; attempt entries `{date, mode: practice\|exam\|course-exam, score, total, passed, perDomain?, source?}`; safe parse + try/catch; hub best-score read post-hydration only. Certificate printable via `certificate-print` + `@media print` rules + `window.print()`. |
| D43 | **Nav (temporary slot).** Quizzes nav item (`isNew`) + desktop nav breakpoint `md` → `lg` (temporary — full F-060 collapse stays Phase 7) + Footer link + **games-hub link-through card** ("Certification Quizzes" → `/{lang}/quizzes/`, `quizzes.promo.*` dict keys ×3). Games index: quiz category disappears with the content move; `'quiz': Award` icon entry removed. Rejected: no header link (PLAN requires at minimum a temporary slot). |
| D44 | **Games count + sitemap + docs.** Home stats auto-adjust (`getAllGames().length`); sitemap gains `quizzes` in `staticPaths` + `getAllQuizzes` loop (quiz URLs leave the games loop automatically); docs sweeps (GAMES.md, game-builder skill/agent prompts, MEMORY, INDEX/README/AGENTS/TESTING/ROADMAPS) in closeout. |

## Workstreams (W0–W8) — executed

| # | Scope | Deliverables | Status |
|---|---|---|---|
| W0 | Dictionary scaffolding | `.scratch/w0_batch_{a,b}.py` → `quizzes.*` (160 leaves) + `metadata.quizzes` + `navigation.quizzes` ×3 locales; parity 5/5 green | ✅ |
| W1 | Schema + migration + loader | `.scratch/migrate-quiz.py` (legacy `snowpro-source.json` → generalized schema), `content/quizzes/snowpro-core-cof-c03.json`, `lib/quizzes/{get-quiz-content,types}.ts` | ✅ |
| W2 | Storage + validator + CI | `lib/quizzes/storage.ts` (12/12 tests), `.opencode/hooks/validate-quiz-json/` (+ `tests/test_validate_quiz_json.py`), quiz stripped from game hook, workflow + `ci_sim.sh` gates | ✅ |
| W3 | Hub, sitemap, redirect stub | `app/[lang]/quizzes/page.tsx` + `quizzes-client.tsx` (kind/category/search filters, localized metadata/empty states), sitemap `quizzes` loop, `app/[lang]/games/quiz/[slug]/page.tsx` noindex stub | ✅ |
| W4 | Player refactor | legacy `quiz-game-client.tsx` (1,448 ln) → `components/quizzes/{QuizDetail,QuizHome,PracticeConfig,QuizPlayer,ExamRunner,ScoreReport,CertificateCard,AttemptHistory}.tsx` + `app/[lang]/quizzes/[quizSlug]/page.tsx`; zero hardcoded EN; acceptance-7 a11y + print fixes (flex-wrap, y-motion, `break-words`, `aria-disabled`/`aria-pressed`/labels, dialog role/Escape, `print:hidden` chrome, `.certificate-print` rules, Header/Footer `print:hidden`) | ✅ |
| W5 | Lesson ExamRunner | `exam`/`examMinutes` frontmatter on 15 files (5 lessons × 3 locales), `lib/markdown/exam-questions.ts` extractor, `components/quizzes/LessonExam.tsx`, QuestionBlock `reveal`/`onAnswer`, lesson-page branch; 3 vitest files (+5 tests → 1,019) | ✅ |
| W6 | Nav + games cleanup | Header `md→lg` ×3 + Quizzes item, Footer link, games-client quiz icon removed, `games.categories/suffixes.quiz` removed ×3 (verified vs `.scratch/dict-backup/`), D43 link-through card + `quizzes.promo.*` ×3 | ✅ |
| W7 | Verification | `verify_out.mjs`: `LEAK_WAIVERS = []` (D32 waiver retired) + 5 curated quiz probes (33 total) + quiz hub/detail/stub/sitemap/exam-lesson invariants; full battery green | ✅ |
| W8 | Docs closeout | this file, PLAN.md Phase 4 status, FIXES.md closeout, GAMES.md surgery + doc sweeps, README/DESIGN updates, game-builder/skill-builder skill strip, agent prompt domain-labels removal | ✅ |

## Acceptance mapping (DESIGN §10 — 7 criteria)

| # | Criterion | Evidence |
|---|---|---|
| 1 | Hub renders quiz cards with localized chrome (en/pt/es) | W3 — `quizzes-client.tsx` dict-driven; `metadata.quizzes` ×3; parity 5/5 |
| 2 | Snowflake quiz playable at `/{lang}/quizzes/snowpro-core-cof-c03/` — practice + mock parity, zero hardcoded EN | W4 — 8-component split; leak probes over `out/pt` + `out/es` green |
| 3 | Old `/games/quiz/*` URLs redirect; games index shows no quiz category | W1 (content moved) + W3 (noindex stubs) + W6 (category/icon/dict keys removed) |
| 4 | Exam-simulation lessons render through ExamRunner (timer, navigator, score); interactive fences mount real widgets | W5 — 15 flagged files, `LessonExam` branch, F-005 fixture tests |
| 5 | Attempts/best-scores persist; certificate prints on pass | W2 (`v1:quizzes-*` keys, 12/12 tests) + W4 (`CertificateCard`, print rules) |
| 6 | `validate_quiz` green in CI; `out/` page counts match | W2 (hook + workflow + ci_sim) + W7 (sitemap/stub invariants in `verify_out`) |
| 7 | No horizontal scroll on mobile; keyboard operable | W4 (flex-wrap/`break-words`, button-based flow, navigator aria, dialog Escape) |

## Alternatives rejected

1. Keep the quiz inside Games (D2 in PLAN.md already locked the move).
2. `/practice`, `/exam` split routes now → deferred (D37, design-optional).
3. Per-locale content files → single file + `locales` slot (D36).
4. Old schema + adapter → one-time migration + validator (D36/D39).
5. Postbuild HTML redirect → app-router stub (D38).
6. Extend the game-json hook (single `pattern` field) → new hook dir (D39).
7. No header link until F-060 → temporary `md→lg` slot (D43).
8. Heading-based exam detection → explicit frontmatter (D41).
9. DOM-wrapper exam session → server-side fence extraction (D41).
10. Two ExamRunner implementations → one shared component, differing inputs (D41).

## Residuals (deferred, tracked)

- `/practice`, `/exam` deep-links → post-Phase-4 (D37; design-optional).
- Full header redesign F-060 → Phase 7 (temporary `md→lg` slot per D43).
- Question-content translation (833) → Phase 9 (D32/§4 policy).
- Review-by-domain analytics, home "Test yourself" rail (Phase 8), roadmap mock-exam links (future).
