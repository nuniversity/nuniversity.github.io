# Practice Mastery and Daily Review

The learning engine persists every in-lesson answer locally, schedules spaced
review, and shows a soft mastery signal. It is fully client-side: no account,
no backend, no analytics.

## Storage keys

| Key | Shape | Purpose |
|---|---|---|
| `v1:practice-answers-<courseSlug>` | `{version:2, updatedAt, answers: Record<key, record>}` | Per-answer counts, mastery, last result |
| `v1:review-cards` | `Record<key, ReviewCardState>` | FSRS scheduling state (max 5,000 cards) |
| `v1:review-xp-day` | `YYYY-MM-DD` | Caps review XP at once per local day |

Practice keys are globally unique: `<courseSlug>::<authoredId>` (or
`<courseSlug>::h-<hash>` when a widget has no authored id).

## Mastery model

Beta posterior mean with a uniform prior:

```
mastery = (correct + 1) / (attempts + 2)
```

One correct answer gives 0.67, five of five gives 0.86, zero of five gives 0.14.
This shrinks small samples instead of overstating mastery after one lucky answer.

The lesson page shows a live bar with three states:

- `<70%` — review recommended
- `70–79%` — solid; review the missed items
- `≥80%` — mastery reached

Completion is **never blocked** (soft gate). A "Review recommended" chip appears
next to the Completed badge when a completed lesson is under 80%.

## Spaced repetition

`ts-fsrs@4.5.0` with `request_retention: 0.9`, `enable_short_term: false`, and a
180-day interval cap. Correct answers are rated `Good`, incorrect `Again`, so
intervals grow roughly 3 → 11 → 35 → 101 days.

Cards are seeded automatically as learners answer questions. `/review/` serves
up to 20 due cards across courses, interleaved round-robin; each course also has
a 10-question `/courses/<slug>/practice/` session. A completed session of five
or more cards awards 10 XP once per local day.

## Content requirements

- Stable question ids (`<prefix>-NN-qN`) that are never renumbered
- Self-contained stems (review shows the question without the lesson)
- `skills` frontmatter (1–3 course-taxonomy tags) and `objectives` (2–4)
- The course-writer validator warns when they are missing

## Reset local data

Remove these keys in the browser console:

```js
Object.keys(localStorage)
  .filter(k => k.startsWith('v1:practice-answers-') || k === 'v1:review-cards' || k === 'v1:review-xp-day')
  .forEach(k => localStorage.removeItem(k))
```

## Known limits

- Answers are local to one browser profile; clearing site data resets mastery.
- Multi-tab edits are last-write-wins.
- Courses without `question` fences (older courses) show an empty review deck
  until the content rollout adds them; Python/SQL courses get Parsons-style
  `dragdrop` exercises rather than sandboxed JS.

## Migration tooling (Phase 6)

| Command | Purpose |
|---|---|
| `npm run report:coverage` | Per-course fence/skills/media coverage table |
| `npm run report:media` | Lessons with embedded media vs media files |
| `npm run backfill:skills -- <course> <map.json> [--write]` | Idempotent `skills`/`objectives` frontmatter writer (all locales, CRLF-safe) |
| `npm run convert:questions -- <course> [--write]` | Converts legacy prose `**1.** / A) ✅` questions into `question` fences (skips multi-select) |
| `npm run validate:courses` | Course-writer gate: strict for engine-adopted lessons, migration warnings for legacy (`--strict` to enforce all) |
| `npm run export:quizzes` | Lesson fences → Quizzes-app JSON in `.scratch/question-bank/` |
