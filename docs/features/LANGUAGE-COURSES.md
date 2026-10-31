# Language Courses (Languages app → LanguageCourse)

Interactive language courses at `/[lang]/languages/courses/...` that train listening,
reading, writing and speaking through typed exercise steps, with vocabulary on a
spaced-repetition schedule (FSRS) and grammar taught through structured input.

## Routes

| Route | Purpose |
|---|---|
| `/[lang]/languages/` | Hub — activities plus real course cards (replaced the "coming soon" block) |
| `/[lang]/languages/courses/` | Language-course index |
| `/[lang]/languages/courses/[course]/` | Course overview: units, progress, daily goal, continue CTA |
| `/[lang]/languages/courses/[course]/[unit]/[lesson]/` | Lesson player (client step engine) |

All pages are `force-static`; routes are enumerated from content at build time.

## Content model

```
content/language-courses/<course>/
├── course.json    # manifest: name, source (L1), target (L2), CEFR, units, grammar registry
├── vocab.json     # shared vocab bank (ids wNNN are permanent; FSRS keys use them)
└── units/<unit>/lessons/NN-<slug>.json   # one lesson = ordered steps
```

Types live in `lib/language-courses/types.ts`. Step types (each trains a named skill):

`knowledge` (CLIL fact card) · `input` (dialogue/story with audio) · `vocab` (new words) ·
`tip` (pattern card from the grammar registry) · `grammar` (structured input: the L1
interpretation depends on processing the target form) · `select` · `match` · `listen` ·
`dictation` (typed, fuzzy-checked: 1 typo per ~12 chars) · `build` (word bank) ·
`fillblank` · `pairs` (minimal pairs for L1-interference perception) · `speak`
(shadowing, self-graded) · `review` (weaves due FSRS vocab; skipped when none due) ·
`quiz`.

## Validation

```bash
npm run validate:language   # rc 0 pass / rc 2 fail
```

Checks manifest shape, vocab id stability and uniqueness, step payloads, reference
integrity (vocab/grammar ids), option/correct bounds, word banks, and prose safety
(no em/en dashes in spoken or visible strings — browser TTS skips them).

## Spaced repetition

- Lesson finish schedules its new words into the shared FSRS store (`v1:review-cards`)
  under the reserved namespace `lang::<pair>::<vocabId>` (`lib/language-courses/schedule.ts`).
- `scripts/build-vocab-index.mjs` (prebuild) emits `public/vocab-index/<pair>.json`.
- The daily review page (`/[lang]/review/`) interleaves due vocab cards (recall +
  self-grade) with the existing question cards.
- Legacy flashcard streak buckets seed FSRS cards once, so no progress is lost.

## Storage keys

| Key | Shape |
|---|---|
| `v1:language-course-progress-<course>` | units → lessons → `{completedAt, bestPercent, lastPercent, attempts}` + `lastLesson` |
| `v1:review-cards` | shared; new `lang::` namespace |
| `v1:xp-log` | daily XP totals for the goal ring |

## Gamification

New events: `language-lesson-complete` (15 XP), `language-course-complete` (100 XP);
new badge `polyglot-start` (first language lesson). Daily goal = 20 XP
(`DAILY_GOAL_XP`), shown as a ring on the course overview.

## Adding a new language (framework checklist)

1. Create `content/language-courses/<new-id>/` with `course.json` (swap source/target,
   write that L1's interference targets into the grammar registry), `vocab.json`.
2. Author lessons following the `course-writer` skill / `agents/COURSE-WRITER-AGENT-PROMPT.md` with the language-course variant metadata; a dedicated language-course prompt is not yet checked in.
   validate with `npm run validate:language`.
3. Extend `SPEECH_LANG_MAP` in `lib/speech/speech.ts` if the new language code is unmapped.
4. No UI changes required: hub cards, routes, sitemap and review integration are loader-driven.

## Speech

All audio goes through `lib/speech/speech.ts` (extracted from `LessonAudio`):
voice picking, queued sequences, rate 0.75/1/1.25, iOS-gesture notes. Flashcards and
language exercises call `speak()` directly — no external TTS links.
