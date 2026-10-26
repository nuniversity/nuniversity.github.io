# Design — Quizzes, Tests & Certification-Simulation App

New top-level section **`/[lang]/quizzes/`** hosting certification quizzes, practice
sets and exam simulations — and the relocation target for the Snowflake quiz currently
buried in Games.

---

## 1. Goals

1. One home for everything assessment-like (quizzes, practice tests, mock exams,
   course exam-simulations) — Games returns to actual games.
2. **Move the Snowflake quiz** (`snowpro-core-cof-c03`, 833 questions) out of
   `content/games/quiz/`.
3. Give course **exam-simulation lessons** a real exam UI (timer, navigator, score
   screen) instead of raw markdown fences.
4. Persist attempts, scores, history; issue printable **certificates** on pass.
5. Full i18n (en/pt/es chrome; question-content policy below) and CI validation.

## 2. Information architecture & routes

```
/[lang]/quizzes/                          → hub: catalog of quiz sets
/[lang]/quizzes/[quizSlug]/               → quiz home: info, modes, history
/[lang]/quizzes/[quizSlug]/practice       → practice mode (optional deep-linkable)
/[lang]/quizzes/[quizSlug]/exam           → timed mock exam
content/quizzes/{slug}.json            → data (migrated from content/games/quiz/);
                                          single schema file w/ `locales` slot (see §4) —
                                          resolved D36, implemented per PLAN-PHASE4.md
```

- **Route source:** new dir `app/[lang]/quizzes/` with `page.tsx` (hub),
  `[quizSlug]/page.tsx` (landing), client players under `components/quizzes/`.
- **Static export:** `generateStaticParams` from all locales × all quiz slugs
  (learned lesson: enumerate the **union of slugs across locales**, cf. F-009).

## 3. What moves / what changes

| From | To | Notes |
|---|---|---|
| `content/games/quiz/snowpro-core-cof-c03.json` (10,915 ln) | `content/quizzes/snowpro-core-cof-c03.json` | schema generalized (§4) |
| `app/[lang]/games/quiz/[slug]/*` incl. `quiz-game-client.tsx` (1,448 ln) | `app/[lang]/quizzes/[quizSlug]/` + `components/quizzes/QuizPlayer.tsx` (refactor, see §6) | games variant deleted after redirect |
| games index category `quiz` (`games-client.tsx:51`) | hub card on `/quizzes/` | games list keeps 7 categories |
| exam-simulation *lessons* (stay in courses) | rendered with **ExamRunner** via the `interactive`/exam fence (§5) | content unchanged except fence fix F-005 |

**Redirects (static-host compatible):**
- Old URLs `/{lang}/games/quiz/snowpro-core-cof-c03/` → keep a thin stub page that
  meta-refreshes/JS-redirects to `/{lang}/quizzes/snowpro-core-cof-c03/` (no server
  rewrites in GH Pages), plus remove links from games index.
- Update header/footer/games cards; fix any content references.

## 4. Data schema (generalized from Snowflake JSON)

Keep compatibility with the existing structure; make it locale-aware and reusable:

```jsonc
{
  "id": "aws-aif-c01",
  "slug": "aws-aif-c01",
  "kind": "certification",              // certification | practice | course-exam
  "category": "ai-ml",
  "title": "AWS AI Practitioner (AIF-C01)",
  "description": "…",
  "durationSeconds": 5400,
  "passingScore": 70,
  "mockQuestionCount": 65,              // OPTIONAL simulation size (default: sum of allocations)
  "domains": [ { "id": "1.0", "name": "1.0 Fundamentals of AI and ML", "color": "blue", "subdomains": [...] } ],
  "allocations": { "1.1 - …": 7, … },   // mock-exam blueprint (sums 100, percent weights)
  "questions": [ … ],                   // discriminated union — see types below
  "locales": {                           // OPTIONAL translations
    "pt": { "title","description", "questions": { "<qid>": { "question","options","explanation" } } },
    "es": { … }
  }
}
```

- **Question-content translation policy:** chrome/UX fully localized immediately;
  question banks translate opportunistically (833 questions ≈ content-loop scale —
  Phase 4 localizes `title/description/` rules; question translation deferred to
  Phase 9 content work, EN questions shown with localized UI meanwhile). Partial
  `locales.questions` supported per-question fallback to EN.
- **Types** (`lib/quizzes/types.ts`, discriminated union on `type`):

  | type | shape | grading |
  |---|---|---|
  | `mcq` | 4 `options`, `correct: number` | single index |
  | `multi` | ≥5 `options`, `correct: number[]` (≥2) | set equality — all-or-nothing |
  | `tf` | 2 or 4 `options`, `correct: number` | single index |
  | `ordering` | 3–6 presented items, `correct: number[]` ordered 3–5 item subset | exact sequence |
  | `matching` | `prompts` (3–7) + equal-count `options`, `correct: number[]` one-to-one | every pair |

  Every type maps to a `QuizResponse` carrying the same `type` discriminator
  (`selected` / `selected[]` / `sequence` / `pairs`); grading lives in
  `lib/quizzes/grade.ts` (`gradeAnswer`, `isAnswered`, `responseFor`).
- **Simulation sizing:** `mockExamSize()` = `mockQuestionCount` when present,
  else `sum(allocations)`. `scaledTargets()` scales allocations hierarchically
  (domain level → subdomain level, largest-remainder both times) and
  `drawMockQuestions()` draws per-subdomain pools — SnowPro legacy behavior
  (alloc sum 100 → targets = allocations) is preserved.


## 5. Exam-simulation lessons → ExamRunner

Course lessons like `aws-clf-c02/{en,pt,es}/15-exam-simulation-a.md` embed `question`,
`matching`, `fillblank`, `dragdrop` fences (5,783 `question` blocks exist app-wide).

- **Mechanism:** detect exam-mode lessons (frontmatter flag `exam: true` or `## N. Exam
  Simulation` heading convention) → render a **session wrapper** around the fences:
  - collect all question widgets into an ordered navigator (sidebar grid),
  - countdown timer (configurable frontmatter `examMinutes`),
  - “Submit” → aggregated score screen (correct/incorrect, per-type breakdown, review
    of explanations),
  - persists attempt to the same localStorage history store as the quizzes app.
- Fix ` ```interactive ` fence dispatch (F-005) so its payloads
  (`{type:"matching|fillblank|dragdrop"}`) mount the right component — those blocks
  become the exam runner’s composite exercises.
- Ordinary lessons keep today’s inline widgets; no behavior change.

## 6. Quiz player (refactor of `quiz-game-client.tsx`)

Split the 1,448-line client into components with i18n from day one:

| Component | Responsibility |
|---|---|
| `QuizHome` | description, blueprint (domains/allocation), best score, mode selection |
| `PracticeConfig` | domain filter, question count, shuffle (port `:254-257`) |
| `QuizPlayer` | learning-mode flow: stage → **Check answer** → feedback, skip/return, navigator tiles |
| `QuestionBody` | renders all 4 interactive types (click-select, ▲▼ ordering, lettered response bank + bounded `<select>` matching); `reveal` mode for review |
| `ExamRunner` | timed mock (scaled draw via `drawMockQuestions`, timer, flagging, no feedback until submit) |
| `ScoreReport` | % vs passing, domain breakdown, review list (per `UserAnswer`), certificate CTA |
| `CertificateCard` | printable pass certificate (name input, date, slug code) |
| `AttemptHistory` | localStorage list of past attempts w/ trend |

- **Learning mode** (practice): answers are *staged* (blue navigator tile) and only
  graded when the learner presses **Check answer** — feedback (correct/incorrect +
  explanation) appears for that question afterwards; **Skip for now** / Previous /
  Next let learners move freely. The score on finish **excludes blanks**:
  reported as `scored_of` = correct ÷ *graded* (staged-and-checked + staged-then-
  checked-later counts; never-checked blanks are listed as skipped, not wrong).
  Tile states: correct (green) / wrong (red) / staged (blue) / blank (muted), with
  a legend under the navigator; progress bar shows `% checked`.
- **Simulation mode** (mock exam): fixed 65-item draw for AIF (`mockQuestionCount`),
  no per-question feedback, flagging + filters, submit confirm with unanswered
  counts, blanks = wrong (unchanged exam semantics).
- **dnd decision:** no dnd-kit in quiz questions — ordering uses click-to-add +
  Move up/down buttons, matching uses native selects (a11y + jsdom-testable);
  dnd-kit stays in lesson fence widgets only.
- **Persistence** (`lib/quizzes/storage.ts`): `quizzes-history-<slug>` — attempts
  `{date, mode, score, total, passed, perDomain}`; `quizzes-best-<slug>`;
  safe JSON access, versioned keys.
- **i18n:** `dictionaries/*.json` → `quizzes.*` namespace incl. new `quizzes.body.*`
  (14 renderer keys), `quizzes.practice.*` (staging/tiles/legend), `score.not_scored`;
  zero hardcoded EN (client reads `dict` everywhere; enforced by leak probes).
- **Responsive:** navigator/`grid-cols-4` stat rows get breakpoints (F-063 pattern).

## 7. Hub page design

- Cards per quiz: title, kind badge (Certification/Practice/Course Exam), question
  count, duration, passing score, domains chips, **best score** (if any), locales
  available.
- Filters: kind, category, search.
- Empty/partial states; SEO metadata per locale (fix the hardcoded-EN pattern of
  `games/page.tsx:23`).
- Home page: optional “Test yourself” rail (Phase 8).

## 8. Validation & harness (CI from day one)

- **Hook** `.opencode/hooks/validate-quiz-json/scripts/validate_quiz_json.py`
  (stdlib-only, exit 0/2): required fields, id = slug = filename stem, allocations
  sum = 100 & every subdomain covered, qNNN id sequence, locales ⊂ base ids, and
  **per-type question rules** — `mcq` exactly 4 options/one index; `multi` ≥5 options
  with ≥2 unique correct indexes; `tf` 2–4 options; `ordering` 3–6 presented items
  with a unique 3–5 index subset; `matching` 3–7 prompts, option count = prompt count,
  one-to-one `correct`; optional `mockQuestionCount` positive int; locale `options`
  length must match the base question.
- Reference material: `references/schema.json` (JSON Schema sketch) and
  `examples/valid_quiz.json` fixture; pytest coverage in
  `tests/test_validate_quiz_json.py` + `tests/test_validator_coverage.py`.
- **CI:** `quizzes:<slug>` content entry in `.github/workflows/nextjs.yml` (same
  pattern as course entries); component behavior covered by `tests/quizzes/*.test.tsx`
  (learning flow, multi toggle, ordering, matching, blank-excluded scoring, mock draw).

## 9. Navigation & discoverability

- Header nav: add **Quizzes** link (needs header redesign F-060 first — nav is already
  overflowing at md).
- Games index: remove `quiz` category; optionally a link-through card
  “Certification quizzes → /quizzes/”.
- Courses: exam-simulation lessons get an “Open exam mode” button → same ExamRunner
  session.
- Roadmaps (future): mock-exam steps link to `/quizzes/…`.

## 10. Acceptance criteria

1. `/{lang}/quizzes/` hub renders all quiz cards with localized chrome in en/pt/es.
2. Snowflake quiz playable at `/{lang}/quizzes/snowpro-core-cof-c03/` — practice + mock
   exam parity with the old game (sampling, timer, pass/fail), zero hardcoded EN.
3. Old `/games/quiz/*` URLs redirect; games index shows no quiz category.
4. Exam-simulation lesson(s) render through ExamRunner with timer, navigator, score
   screen; `interactive` fences mount real widgets (F-005 verified).
5. Attempts/best-scores persist across reloads; certificate prints on pass.
6. `validate_quiz` script green in CI; page counts in `out/` match generateStaticParams.
7. Lighthouse-level checks: no horizontal scroll on mobile for hub/player; keyboard
   operable (answer, navigate, submit).
8. All four question types (mcq/multi/ordering/matching) render and grade in both
   modes — all-or-nothing for multi/ordering/matching, verified by `tests/quizzes/`.
9. Learning mode never reveals feedback before **Check answer**; finish excludes
   blanks from the score and reports them as skipped; simulation hides all results
   until submit.
10. `validate-quiz-json` hook green on every `content/quizzes/*.json`, including the
    per-type question rules and `mockQuestionCount`.

## 11. Risks & decisions

| Risk/decision | Mitigation/choice |
|---|---|
| Redirects on static host | client-side stub pages + updated internal links (no server rewrites) |
| 833-question translation volume | chrome-first, question content deferred to Phase 9 (policy §4) |
| ExamRunner scope creep | Phase 4 ships wrapper + timer + score; review-by-domain and analytics later |
| Legacy `quiz-game-client` rewrite vs move | refactor while moving — the file needs i18n anyway (F-021) |
| **D1** simulation size ≠ blueprint sum | optional `mockQuestionCount` (AIF: 65) + hierarchical largest-remainder scaling; allocations stay percent weights summing 100 — validator rule unchanged |
| **D2** AIF bank size | phased: 65 blueprint-exact → 151 (Domains 1–2 deep dive) → +24 balance batch across Domains 3–5 = **175 total**; mock draw always 65; further expansion toward 260 optional |
| **D3** blanks in learning mode | excluded from score (score = correct ÷ graded; blanks reported as skipped); simulation keeps blank = wrong |
| **D4** ordering interaction | select-subset + order (presented items may include distractors; correct = 3–5 item ordered subset) |
| Question-type interactions | no dnd-kit in quiz questions (click + buttons + native select) — see §6 |
| Content accuracy (AIF-C01) | grounded in official exam-guide task statements + `content/courses/aws-aif-c01/en/*` lessons; validator enforces structure, humans review semantics |
