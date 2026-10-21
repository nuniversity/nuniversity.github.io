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
content/quizzes/{slug}/{en,pt,es}.json    → data (migrated from content/games/quiz/)
content/quizzes/{slug}.json?              → decision: single schema file w/ locales
                                             (see §4) — recommended: one JSON per slug
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
  "id": "snowpro-core-cof-c03",
  "slug": "snowpro-core-cof-c03",
  "kind": "certification",              // certification | practice | course-exam
  "category": "data-platforms",
  "title": "SnowPro Core Certification (COF-C03)",
  "description": "…",
  "durationSeconds": 6900,
  "passingScore": 75,
  "domains": [ { "id": "1.0", "name": "Architecture & Design", "color": "#…", "subdomains": [...] } ],
  "allocations": { "1.1": 8, … },        // mock-exam blueprint (sums 100)
  "questions": [ { "id","subdomain","type":"mcq","question","options","correct","explanation" } ],
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
- **Types:** start with `mcq` (current data is MCQ); schema reserves `multi`/`tf` for
  the exam-runner fence extraction.

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
| `QuizPlayer` | question flow, per-question flag/review, progress bar |
| `ExamRunner` | timed full-length mock (port `buildMockExamQuestions` proportional sampling `:228-251`, timer `:63`, pass logic `:111`) |
| `ScoreReport` | % vs passing, domain breakdown, review list, certificate CTA |
| `CertificateCard` | printable pass certificate (name input, date, slug code) |
| `AttemptHistory` | localStorage list of past attempts w/ trend |

- **Persistence** (`lib/quizzes/storage.ts`): `quizzes-history-<slug>` — attempts
  `{date, mode, score, total, passed, perDomain}`; `quizzes-best-<slug>`;
  safe JSON access, versioned keys.
- **i18n:** `dictionaries/*.json` → new `quizzes.*` namespace (~80 keys); zero
  hardcoded EN (current client reads `dict` 0×).
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

- **New script** `.opencode/skills/game-builder/scripts/validate_quiz.py` (or a new
  `quiz-writer` skill): schema check (jsonschema — already a harness dep), allocations
  sum = 100, every question `correct` in range, ids unique, mockExam totals ≥ requested
  size, locale `questions` ids ⊂ base ids.
- **Hook:** extend `.opencode/hooks/validate-game-json.py` → stop accepting `quiz`
  category (moves out) or repurpose for `content/quizzes/`.
- **CI:** add `quizzes:<slug>` content entry to `.github/workflows/nextjs.yml` (same
  pattern as course entries).
- **game-builder skill** updated: `examples/valid_quiz.json` → new schema; skill.md
  documents the hub vs games split.

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

## 11. Risks & decisions

| Risk/decision | Mitigation/choice |
|---|---|
| Redirects on static host | client-side stub pages + updated internal links (no server rewrites) |
| 833-question translation volume | chrome-first, question content deferred to Phase 9 (policy §4) |
| ExamRunner scope creep | Phase 4 ships wrapper + timer + score; review-by-domain and analytics later |
| Legacy `quiz-game-client` rewrite vs move | refactor while moving — the file needs i18n anyway (F-021) |
