# Learning Engine — Decision Audit (2026-10-28)

This file records every consequential decision in the Courses Learning Engine plans, the evidence behind it, and its status. The executing model must not re-litigate these unless new evidence appears.

Legend: **LOCKED** (implement as written) · **REVISED** (changed after research, plans updated) · **DEFERRED**.

---

## D1. Spaced-repetition algorithm

- **Decision:** FSRS via `ts-fsrs@4.5.0`, pinned.
- **Evidence:** FSRS outperforms SM-2 at equal retention with fewer reviews; `ts-fsrs` 4.5 exposes `fsrs()`, `createEmptyCard()`, `repeat()`, `Rating` (verified empirically in this repo, 2026-10-28).
- **Why pinned:** v5+/v7 replaced the API with an async `DefaultScheduler` and renamed card fields. An unpinned install would break a small model silently.
- **Status:** LOCKED.

## D2. FSRS scheduling profile — **REVISED**

- **Original:** `request_retention: 0.9`, fuzz on, default short-term steps.
- **Finding (empirical):** with default learning steps, a new card answered *Good* is due in **10 minutes**; *Again* in 1 minute. A daily-review page would keep re-serving the same cards the same day and undermine the "daily habit" model.
- **Revised:** `enable_short_term: false`, `maximum_interval: 180`, `request_retention: 0.9`, fuzz on.
- **Empirical intervals after revision:** Good → 3 d, 11 d, 35 d, 101 d (cap 180 d).
- **Retention check:** 0.85 → 5/25/105/389 d (too sparse for a course); 0.95 → 3/5/10/20 d (too frequent). 0.90 is the community and FSRS default and matches course duration.
- **Status:** REVISED — plans and `lib/practice/fsrs.ts` updated.

## D3. Mastery estimator — **REVISED**

- **Original:** EWMA with α = 0.3, initialized to the first outcome.
- **Finding:** a single correct answer produced mastery = 1.0, and EWMA ignores sample size. For 5–10 items per lesson, this overstates mastery.
- **Revised:** Beta posterior mean with a weak uniform prior: `mastery = (correct + 1) / (attempts + 2)`. After one correct → 0.67; one wrong → 0.33; 5/5 → 0.86; 0/5 → 0.14.
- **Why not BKT:** BKT needs per-skill parameter fitting and enough observations per skill; with 49 courses and sparse per-skill data it would be unstable. Beta is transparent, dependency-free, and shrinks small samples.
- **Status:** REVISED — schema field renamed `ewma` → `mastery`.

## D4. Mastery threshold — **REVISED**

- **Original:** soft gate at 70%.
- **Evidence:** mastery-learning literature commonly uses 80–90% as the criterion (e.g., `PMC10159400`, Nebraska mastery grading); 70% is a completion nudge, not mastery.
- **Revised:** three-state learner signal: `<70%` review recommended · `70–79%` solid, review missed items · `≥80%` mastery reached. Progression stays **soft** (never blocked).
- **Note:** the pre-existing `LessonScoreSummary` "suggest complete" at 70% is a *completion* nudge and is intentionally left unchanged; the new hint communicates *mastery*.
- **Status:** REVISED — plans and components updated.

## D5. Review session size

- **Decision:** 20 due cards per daily session; 10 per mixed-practice session.
- **Evidence:** research finds no single optimal spacing/session size; short, repeated sessions beat massed practice. 10–20 items keep a session at roughly 3–6 minutes.
- **Status:** LOCKED (configurable constants).

## D6. Review XP

- **Decision:** 10 XP per session of ≥5 cards, at most once per local day.
- **Evidence:** SDT — competence feedback supports motivation; capping prevents farming and protects intrinsic motivation.
- **Status:** LOCKED.

## D7. Practice-key scheme — **REVISED**

- **Finding:** authored question ids are unique *per course*, not globally. A global review-card map keyed by `q1` collides across 49 courses.
- **Revised:** every practice key is `<courseSlug>::<authoredId>` (or `<courseSlug>::h-<hash>` when no authored id). The question index emits the same prefixed ids.
- **Status:** REVISED — plans updated; recorder and index must use `stablePracticeKey()`.

## D8. Storage

- **Decision:** `localStorage` through `lib/storage/safe-storage.ts`; no IndexedDB.
- **Evidence:** existing platform convention; payload estimate ≤ ~1 MB for 5,000 review cards; storage helper already handles quota/private mode/corruption.
- **Guard:** 5,000-card cap; per-record sanitisation.
- **Status:** LOCKED.

## D9. Code runner security — **REVISED, IMPLEMENTED**

- **Final design:** `public/code-sandbox.html`, loaded in `<iframe sandbox="allow-scripts" referrerpolicy="no-referrer">` (opaque origin). Inline controller evaluates learner code with `new Function` **once per test**. No worker, no blob, no subresources. The parent verifies `event.source === iframe.contentWindow` plus a per-run nonce; a 3s timeout reloads the iframe, terminating runaway code.
- **CSP:** global policy keeps no `'unsafe-eval'`; the sandbox page carries a strict self-only policy with `'unsafe-eval'` and `connect-src 'none'`; `frame-src 'self'` added to the global policy. `verify-csp.mjs` special-cases the sandbox page and asserts these invariants.
- **Why not quickjs-emscripten:** strongest isolation but ~1 MB lazy WASM + dependency; documented fallback if learner code ever reaches network/storage/parent (D9 stays the switch trigger).
- **Status:** IMPLEMENTED + tested (`tests/practice/sandbox-static.test.ts`, `code-harness.test.ts`); browser smoke test remains manual.

## D10. Quiz-bank export schema — **REVISED**

- **Finding:** `lib/quizzes/types.ts` requires `kind: 'certification' | 'practice' | 'course-exam'`, `allocations: Record<string, number>` (not an array), and `explanation: string` on every question. The draft export used an array and `kind: 'course'`.
- **Revised:** export emits `kind: 'practice'`, allocations keyed by lesson, `explanation: ''` fallback, `mockQuestionCount` optional.
- **Status:** REVISED — Phases 4–6 plan updated.

## D11. Gamification integration — **REVISED**

- **Finding:** `applyEvent` indexes `XP_GAINS[event.type]`, `touchStreak` runs for every event, and `evaluateBadges` ignores unknown types. No `profile.ts` branch is needed.
- **Revised:** only `types.ts` changes (union + XP entry).
- **Status:** REVISED — Phases 0–3 plan updated.

## D12. Learning-styles framing

- **Decision:** do **not** build VARK/VAK profiles. Adapt on prior knowledge, mastery, and pacing; provide multiple means (UDL 3.0).
- **Evidence:** learning-styles matching is a debunked neuromyth (Pashler et al. 2008; Hattie & O'Leary 2025); UDL and mastery adaptivity have support.
- **Status:** LOCKED.

## D13. Interleaving

- **Decision:** daily review mixes courses round-robin; mixed practice mixes lessons within a course.
- **Evidence:** interleaved practice improves discrimination and transfer versus blocked practice.
- **Status:** LOCKED.

## D14. Roadmap mastery

- **Decision:** advisory badge only; no locks.
- **Rationale:** self-directed learners react badly to hard gates; the platform is static and has no authoritative enforcement.
- **Status:** LOCKED.

## Open questions (do not block Phases 0–3)

- Whether to add a Python runner later (revisit after Phase 4 usage data).
- Whether to expose mastery as a course-level skill map (needs per-skill tagging coverage first).

---

# Skill v2 decisions (2026-10-28)

## D15. Question ids are permanent; stems are self-contained — LOCKED

- **Why:** answered questions become spaced-review cards keyed by `<course>::<id>` (D7); review sessions render the stem outside the lesson. Item-writing guidance for retrieval practice warns against cue-heavy prompts that leak the answer (Effortful Educator, "diminishing cues"; retrievalpractice.org).
- **Enforcement:** ids are an authoring rule + permanent-key convention (validator checks uniqueness/format only); stem quality is a Pedagogy Checklist item.

## D16. Course-scoped skills taxonomy — LOCKED

- **Why:** knowledge-component tagging is the prerequisite for per-skill analytics and adaptivity (EDM/ITS literature); a course-scoped vocabulary keeps tags coherent and validator-checkable.
- **Shape:** optional `skills` array in `course.json`; lessons carry 1–3 tags; `validate_course.py` warns when a lesson tag is outside the taxonomy.
- **Rejected:** free-form tags (drift), global taxonomy (overkill for 49 courses).

## D17. `codeexercise` is JavaScript-only and banned on non-JS courses — LOCKED

- **Why:** the runner is JS-only (D9); using pseudo-JS on Python/SQL/Rust courses teaches the wrong syntax. Those courses keep matching/fillblank/dragdrop.
- **Enforcement:** validator errors on `language != "javascript"` and on forbidden network/eval APIs; the guide states the course-type rule.

## D18. Missing media is a warning, not an error — LOCKED

- **Why:** most legacy lessons predate the media pipeline; a warning drives the Phase 6 backfill without breaking CI (rc 1 tolerated).

## D19. Glossary is recommended, not required — LOCKED

- **Why:** pre-training helps concept-dense lessons; forcing term lists into narrative courses violates coherence (Mayer) and adds noise.

**Skill version:** 1.1.0 (`assets/skill.json`).

---

# Phase 6 decisions (2026-10-28)

## D20. CI course gate runs in migration mode — LOCKED

- **Finding:** 333 of 436 legacy lessons return rc 2 (missing Practice Questions / Key Takeaways). A strict gate would block CI on day one and pressure rushed content.
- **Decision:** `validate-courses.mjs` is strict for **engine-adopted** lessons (those with `skills` frontmatter) and reports legacy rc 2 as a migration count. `--strict` enforces everything and becomes the target once waves complete.
- **Effect:** waves progressively flip courses to strict simply by adding `skills`.

## D21. Convert legacy prose questions instead of rewriting lessons — LOCKED

- **Finding:** four SnowPro lessons had well-written questions in the legacy `**1.** / A) … ✅` format and failed rc 2 only because they lacked `question` fences.
- **Decision:** `convert-prose-questions.mjs` parses that format into `question` fences (unique ids, skips multi-select, requires ≥5 convertible, dry-run default). Reused across the rollout.
- **Verified:** 28 questions converted across 4 lessons; all four now validate at rc 1 (warnings only) and join the review engine.

## D22. CRLF-safe parsing everywhere — LOCKED

- **Finding:** SnowPro EN lessons use CRLF; the skill validator and metadata scripts missed their frontmatter.
- **Decision:** frontmatter/fence regexes accept `\r?\n` across `validate_lesson.py`, `validate_course.py`, `add-lesson-skills.mjs`, `report-content-coverage.mjs`, and the converter; regression test added.

## D23. Wave 1 metadata landed

- **Scope:** `aws-dea-c01`, `aws-aif-c01`, `aws-clf-c02`, `aws-data-lakehouse`, `databricks-lakehouse-aws`, `snowpro-core-cof-c03`.
- **Result:** 101/436 lessons now carry `skills` (course taxonomies in `course.json`); engine-adopted lessons pass the gate strictly. Objectives were included for `aws-dea-c01`; remaining courses intentionally defer objectives to their content waves.
