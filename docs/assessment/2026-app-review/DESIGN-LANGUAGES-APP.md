# Design — Languages App

> **Status: ✅ implemented (Phase 5, 2026-10-23).** Execution evidence in
> [PLAN-PHASE5.md](./PLAN-PHASE5.md) + [PLAN.md](./PLAN.md); acceptance §9 verified
> (verify_out invariants, 45-probe leak audit, ci_sim 16/16).

New top-level section **`/[lang]/languages/`**: a full hub for language learning,
launching with the five vocabulary games relocated out of Games.

---

## 1. Goals

1. Give language practice a proper home — Games returns to non-language games
   (coding, conversation, logic, math, physics, puzzles + formerly quiz).
2. **Move the 5 vocabulary JSONs** out of `content/games/vocabulary/`.
3. Upgrade relocation into a **real hub**: language-pair cards, consistent practice
   UX, progress tracking, full i18n — mirroring the quizzes app’s structure/patterns.
4. Keep every old URL working (static-export redirects) and stay CI-validated.

## 2. Scope decisions (locked)

| Item | Decision |
|---|---|
| Moves now | **Vocabulary games (5)**: `en-to-pt`, `en-to-pt-advanced`, `es-to-en`, `es-to-pt` (flashcards), `fr-to-pt-flashcards` |
| Stays in Games | `conversation/36-questions-to-fall-in-love` (relationship conversation; stays per scope decision) |
| Stays in Library | language resources (IFRS Idiomas, MEC Idiomas, My English Online) — may be *surfaced* later as hub links, not moved |
| Future language tracks | content-phase (Phase 9); hub leaves room for `kind: "track"` cards (course-like) |
| Ambition | Full hub section (not simple relocation) |

## 3. Information architecture & routes

```
/[lang]/languages/                          → hub: language pairs + skills
/[lang]/languages/[pair]/                   → pair page (e.g. en-pt): available activities
/[lang]/languages/[pair]/[activitySlug]/    → player (flashcards / quiz / …)
content/languages/vocabulary/*.json         → migrated from content/games/vocabulary/
content/languages/README.md                 → schema + locale conventions (optional)
```

- `pair` slugs: `en-pt`, `es-en`, `es-pt`, `fr-pt` (derived from the JSON
  `languagePair` field; add if missing — derive from filenames).
- Players: existing `flashcard-game-client.tsx` (510 ln) and
  `vocabulary-game-client.tsx` (327 ln) **move to `components/languages/`** with i18n +
  mobile fixes folded in (F-021, F-074, F-101).
- `generateStaticParams`: union of slugs × 3 locales (lesson from F-009).

## 4. What moves / changes

| From | To |
|---|---|
| `content/games/vocabulary/{en-to-pt,en-to-pt-advanced,es-to-en,es-to-pt,fr-to-pt-flashcards}.json` | `content/languages/vocabulary/` (same filenames) |
| `app/[lang]/games/vocabulary/[slug]/*` + page/branching logic (`page.tsx:58-74`) | `app/[lang]/languages/[pair]/[activitySlug]/*` |
| `components/games`-adjacent clients (vocabulary + flashcard) | `components/languages/` |
| games index `vocabulary` category (`games-client.tsx:51,69`) | hub cards on `/languages/` |

- `lib/games/get-game-content.ts` loses vocabulary branches
  (`getVocabularyGame` `:190-214`); new `lib/languages/get-language-content.ts` owns
  loading + `locales` merging (reuse the pattern from `getConversationGame :253-292`).
- **Redirects:** `/{lang}/games/vocabulary/<slug>/` → thin client-side redirect stub to
  `/{lang}/languages/<pair>/<slug>/` (map old slug → pair path in a small table).

## 5. Hub UX

**Home (`/languages/`):**
- Hero: “Learn by doing” + language search/filter.
- **Language-pair cards** (en↔pt, es↔en, es→pt, fr→pt): flag pair visual, activity
  count, progress (activities completed / words learned), CTA.
- Each activity card: type badge (Flashcards / Translation Quiz), difficulty, word
  count, best score/streak, locale availability.
- Section for future **tracks** (“Language courses — coming soon”) until Phase 9.

**Pair page:** activities list, per-activity stats, settings (direction toggle where
the data supports it — only `es-to-pt` style pairs move as-is; no new pair generation).

**Player:** flashcards keep SR-style buckets (new/learning/learned), per-card streaks,
import/export (existing behavior `flashcard-game-client.tsx:83-111,149-155`); quiz mode
keeps `vocabulary-game-client` matching flow — both gain:
- localized chrome (all strings via `dict.languages.*`),
- progress saved per activity (`lang-progress-<pair>-<slug>`),
- mobile-responsive layout (grid variants F-063, aspect overflow F-074),
- reduced-motion-safe animations.

## 6. i18n design

- **New dictionary namespace `languages.*`** (~60 keys): hub headings, pair labels,
  activity types, player chrome (Start/Retry/Shuffle/Correct…), stats, empty states,
  metadata templates.
- **Game data:** the 5 JSONs are *inherently* cross-lingual (word pairs); their
  `title`/`description`/`contextLabels` gain `locales` blocks (two already have:
  `es-to-pt`, `fr-to-pt-flashcards`) — same verify+quality gate pipeline as courses.
  Word-pair **content is not translated** (it is the learning material).
- Page metadata localized from first render (no hardcoded-EN titles like
  `games/page.tsx:23` had).
- Remaining EN leaks in moved clients fixed during the move (they’re in F-021/F-101).

## 7. Navigation

- Header: add **Languages** link — *after* header redesign (F-060); total nav will be
  Home-critical items + Courses/Roadmaps/Tools/Library/Games/Quizzes/Languages →
  collapse strategy mandatory (dropdown/“More” group on md, drawer on mobile).
- Games index: remove vocabulary category; optional “Language practice → /languages/”
  cross-link card (mirrors quizzes approach).
- Home (Phase 8): Languages rail with pair cards.

## 8. Validation & harness

- **New validator** `.opencode/skills/game-builder/scripts/validate_language_content.py`
  (or generalize `validate_game-json.py`): schema, unique ids, pair field matches path,
  locale blocks reference existing question ids, word arrays non-empty.
- Fix the existing hook bug regardless: `VALID_CATEGORIES` currently
  `{"quiz","vocabulary"}` only (`validate_game-json.py:22`) → after the move, categories
  are `coding, conversation, logic, math, physics, puzzles` — update set accordingly and
  add `content/languages/**` to the hook pattern.
- **CI:** add languages content validation entry (same workflow pattern).
- Update `game-builder` skill: vocabulary no longer a game category; document hub.

## 9. Acceptance criteria

1. `/{lang}/languages/` hub renders pair + activity cards in en/pt/es with localized
   chrome and correct metadata.
2. All 5 activities playable at new URLs; progress/streaks persist; import/export works.
3. Old `/games/vocabulary/*` URLs redirect; games index no longer lists a vocabulary
   category; `/games/` shows remaining 7 categories.
4. `lib/games` vocabulary code removed (no dead exports); new `lib/languages` loader
   with locale merge.
5. Validator + CI entry green; `out/{lang}/languages/**` page counts match
   generateStaticParams.
6. No horizontal scroll at 320px in hub/player; keyboard-operable quiz matching.
7. Zero hardcoded EN in moved components (grep `dict`-less UI strings clean).

## 10. Risks

| Risk | Mitigation |
|---|---|
| Broken bookmarks to old game URLs | redirect stubs + full internal-link sweep |
| Scope creep (phrasebook, TTS, new pairs) | hub ships relocation + polish; new activities = Phase 9 content |
| Games section loses visible content | Games keeps 7 categories + conversation; cross-link cards preserve discovery |
| Double implementation with quizzes app | shared patterns: hub card grid, localStorage storage lib, redirect stubs, validator style — build in order (quizzes first, Phase 4) |
