# Course Content Gate — Waiver Manifest

Decision (Phase 1, plan Q1): every course directory is gated at the course level in CI, lesson-level
detail gates cover all currently-complete course:locale pairs, and the remaining pairs are waived here
with evidence. Lesson retrofit for waived pairs is deferred to **Phase 9** (assessment decision D6;
lesson content restructuring was explicitly out of Phase 1 scope).

## Gate inventory (all enforced in `.github/workflows/nextjs.yml`)

1. **Course-level structure gate — all 49 course directories** (`validate_course`, rc2 fatal, rc1
   tolerated for deferred locale stubs). No waivers at this layer.
2. **Lesson-level detail gates — 28 course:locale pairs** (`validate_lesson` rc0 required; legacy
   pairs use `check_locale_course --legacy` at rc0 instead).
3. **Dictionary parity** (`check_i18n_parity`) — blocking, all locales.

## Numbers

| Metric | Count |
|---|---|
| Course:locale lesson pairs in repo (locale dirs with `*.md`) | 138 |
| Gated pairs (layer 2) | 28 |
| Waived pairs (manifest below) | 110 |

## Reason codes

| Code | Meaning |
|---|---|
| `EN-INCOMPLETE` | EN source fails `validate_lesson` (missing question fences / Key Takeaways / practice blocks). pt/es pairs of the same course inherit the EN-source deferral. |
| `LOCALE-STRUCT-MISMATCH` | This locale's lesson structure differs from `validate_lesson` expectation (verify/quality structure gates fail on the sample lesson). |
| `LEGACY-EN-NO-QUESTIONS` | Legacy parity-designed course: EN sources never carried lesson gates; `es` for these courses IS gated via `check_locale_course --legacy` (evidence below). |
| `PAIR-DEFERRED` | Sibling locale not gated yet; sample lesson(s) of this locale currently pass — retest candidates before Phase 9. |

Reasons were derived by running `validate_lesson` on up to 2 sample lessons per waived locale
(first + middle file, all files when ≤2), executed Phase-1 audit, 2026-10-20. Courses with 0 sample
failures are reported as `PAIR-DEFERRED` (retest candidates), never silently waived.

## Evidence

- **Legacy parity sweep**: 61/61 legacy-pair checks pass at rc0 (`check_locale_course --legacy`,
  10 courses × ES + parity sample set) — legacy `es` gates are enforced, not waived.
- **Regression from Phase 1 sample audit**: 261 already-gated lessons validate rc0 in CI.
- **Newly gated during Phase 1**: `hybrid-impact-enterprise:pt` (16/16 lessons rc0) and
  `math-foundations:pt` (20/20 rc0) were promoted from waiver to gate after sampling showed full
  compliance; their EN sources remain waived (`EN-INCOMPLETE`, 1 lesson each, rc2).
- **What the structural gate guarantees for waived pairs**: all 138 pairs live under courses that
  pass `validate_course` (course.json schema, locales, INDEX) — waivers concern lesson-internal
  structure only, never JSON/locale validity.

## Waived pairs (110)

| Course | Waived locales | Reason code | Evidence / detail |
|---|---|---|---|
| `agent-memory-knowledge` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `agent-memory-knowledge` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `agent-memory-knowledge` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `agentic-ai-development` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `algorithm-foundations` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `clean-architecture` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `clean-code-design-patterns` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `computing-imperative-python` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `crewai-agents` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `crewai-agents` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `crewai-agents` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `data-platforms` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `dbt-redshift-advanced` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `dbt-redshift-advanced` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `ddd-software-architecture` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `functional-declarative-coding` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `guardrails-evaluation` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `guardrails-evaluation` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `guardrails-evaluation` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `intro-to-data-engineering` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `intro-to-programming` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `intro-to-programming` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `intro-to-programming` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `langfuse-observability` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `langfuse-observability` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `langfuse-observability` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-advanced` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `langgraph-advanced` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-advanced` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-agents` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `langgraph-agents` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-agents` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-beginner` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `langgraph-beginner` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-beginner` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-intermediate` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `langgraph-intermediate` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `langgraph-intermediate` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `nonprofit-organization-fundamentals` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `nonprofit-organization-fundamentals` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `opencode-agents` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `opencode-agents` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `opencode-agents` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `opencode-fundamentals` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `opencode-fundamentals` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=1) |
| `opencode-fundamentals` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=1) |
| `opencode-production` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `opencode-production` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=1) |
| `opencode-production` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=1) |
| `opencode-workflows` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `opencode-workflows` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=1) |
| `opencode-workflows` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=1) |
| `practical-ai` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `practical-ai` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `practical-ai` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `processes-flowchart` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `prompt-engineering` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `prompt-engineering` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `prompt-engineering` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `python-advanced` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `python-advanced` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `python-advanced` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `python-beginner` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `python-beginner` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `python-beginner` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `python-intermediate` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `python-intermediate` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `python-intermediate` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `rust-advanced` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `rust-advanced` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `rust-advanced` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `rust-beginner` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `rust-beginner` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `rust-beginner` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `rust-intermediate` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `rust-intermediate` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `rust-intermediate` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `snowpro-core-cof-c03` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `snowpro-core-cof-c03` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `snowpro-core-cof-c03` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `solid-principles-oop` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
| `spark-advanced` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `spark-advanced` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `spark-advanced` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `spark-beginner` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `spark-beginner` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `spark-beginner` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `spark-intermediate` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `spark-intermediate` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `spark-intermediate` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `sql-advanced` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `sql-advanced` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `sql-advanced` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `sql-beginner` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `sql-beginner` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `sql-beginner` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `sql-intermediate` | en | EN-INCOMPLETE | EN source fails validate_lesson (question fences / takeaways / practice missing) |
| `sql-intermediate` | es | LOCALE-STRUCT-MISMATCH | es lesson structure differs from validate_lesson expectation (rc=2) |
| `sql-intermediate` | pt | LOCALE-STRUCT-MISMATCH | pt lesson structure differs from validate_lesson expectation (rc=2) |
| `tdd-code-quality-tools` | en,pt | LEGACY-EN-NO-QUESTIONS | EN source never had lesson gates (parity-designed); es gated via check_locale_course --legacy |
