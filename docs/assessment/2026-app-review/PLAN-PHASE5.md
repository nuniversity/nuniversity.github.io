# Phase 5 — Deep Implementation Plan (Languages app)

*Executed 2026-10-23. Companion to [DESIGN-LANGUAGES-APP.md](./DESIGN-LANGUAGES-APP.md);
status evidence in [PLAN.md](./PLAN.md); closeout in [FIXES.md](./FIXES.md).*

## Locked decisions (D45–D53)

| ID | Decision |
|---|---|
| D45 | Routes `/{lang}/languages/` → `[pair]` → `[activitySlug]`; the 5 JSONs move as-is to `content/languages/vocabulary/` (snake_case `language_pair` kept; pairs `en-pt` ×2 activities, `es-en`, `es-pt`, `fr-pt`); activity slug = JSON filename (= `id`, enforced by validator) |
| D46 | New `lib/languages/{types,get-language-content}.ts` loader (gameType default `matching`, locale merge, `getPairForSlug`/`getAllPairs`); vocabulary types + `getVocabularyGame` stripped from `lib/games` |
| D47 | Dictionary: new `languages.*` namespace — migrate `games.flashcards` (38 keys) + `games.instructions.vocabulary_match`, copy shared player chrome into `languages.matching.*` (shared `games.*` keys kept for the other 7 game clients), new hub/metadata/navigation/promo keys; remove dead `games.categories.vocabulary` + `quizzes.card.languages` ×3 |
| D48 | `lib/languages/storage.ts`: versioned `v1:lang-progress-<pair>-<slug>` + `v1:lang-best-<pair>-<slug>`; flashcards **dual-read** legacy `flashcard_progress_<game.id>` (read-only, no write-back); matching gains best score (accuracy, tie → faster time) |
| D49 | Move both player clients → `components/languages/`; dict-namespace rename only + F-021 remainder (`({n} cards)`, `Number of pairs:`, instruction fallbacks) + F-074 (`aspect-[4/3]`) + F-101 (slider clamp effect) + F-063 grid bases |
| D50 | 5 noindex redirect stubs at `app/[lang]/games/vocabulary/[slug]/page.tsx` mirroring RedirectToQuizzes, target includes the pair (`/languages/<pair>/<slug>/`) |
| D51 | New `.opencode/hooks/validate-languages/` (ported vocabulary rules, gameType enum `matching|flashcards`, id==filename, category-if-present=`vocabulary`); vocabulary stripped from `validate-game-json` (`VALID_CATEGORIES` → 6, `validate_vocabulary` removed, schema/example updated); pytest suite + workflow step + `ci_sim` `languages-gate-5`; stale `games-gate-13` label → `games-gate-7` |
| D52 | Nav = **partial collapse** (F-060 full redesign stays Phase 7): Languages as primary desktop item with `NEW` badge, About+Contact behind a `More ▾` dropdown at `lg`, flat list on mobile |
| D53 | Games hub: `'vocabulary'` icon entry dropped, cross-link promo card `languages.promo.*` (grid with the quizzes promo), sitemap `languages` loop (hub + pairs + activities); footer link skipped |

## Workstreams (W0–W9) — executed

- **W0 (coverage pre-work):** `tests/test_validator_coverage.py` (31 tests over library/roadmap/tools/quiz hook mains) → coverage **80.29% ≥ 80** gate restored before Phase 5 churn.
- **W1:** batch script `.scratch/w5_dict.py` — `languages.*` (75 leaves ×3), `metadata.languages`, `navigation.languages`, `navigation.more`, `languages.promo.*`, `languages.matching.num_pairs` added; `games.flashcards`/`games.instructions.vocabulary_match`/`games.categories.vocabulary`/`quizzes.card.languages` removed; parity 5/5 green throughout.
- **W2:** `git mv` the 5 JSONs → `content/languages/vocabulary/` (word counts unchanged); `lib/languages/types.ts` + `get-language-content.ts` created; `lib/games/get-game-content.ts` vocab code stripped (CRLF preserved).
- **W3:** `lib/languages/storage.ts` (dual-read load, versioned save, best-score record) + `tests/languages/storage.test.ts` (17 tests).
- **W4:** `.opencode/hooks/validate-languages/` (script + hook.json + schema + 41-word example) + `tests/test_validate_languages.py` (35 tests incl. parametrized real files); game hook stripped; workflow + ci_sim gates added/renamed.
- **W5:** routes — hub `app/[lang]/languages/page.tsx` + `languages-hub-client.tsx` (search/type/difficulty filters, pair grouping, tracks section), pair `[pair]/page.tsx`, player `[pair]/[activitySlug]/page.tsx` (gameType dispatch, pair-mismatch → 404), shared `lib/languages/format.ts` (server/client-safe `pairChipLabel`/`tpl`).
- **W6:** agent rewiring — both clients → `dict.languages.*`, storage integration (best-score chip + one-per-run recording; flashcard dual-read load + versioned save), residuals F-021/F-063/F-074/F-101, `pair` prop plumbed from the player page; `vocabulary-game.test.tsx` updated.
- **W7:** redirect stub (`components/languages/RedirectToLanguages.tsx` + stub page), games-hub icon/promo cleanup, Header More-dropdown + Languages item, `navigation.more` ×3.
- **W8:** sitemap (hub in staticPaths + pairs + activities; legacy vocabulary URLs absent), `verify_out.mjs` +16 checks (languages hub/pair/player/stub exports ×3, stub noindex+link, games hub cross-link/no-vocab, 5 players count, sitemap probes, 13 new leak probes → 45 total), final battery.
- **W9:** docs closeout (this file, PLAN/FIXES/README/DESIGN/GAMES/CONTENT-MANAGEMENT/ARCHITECTURE/OPENCODE-HARNESS/TESTING/INDEX/CONTRIBUTING/DEPLOYMENT, game-builder skill repointed to `content/languages/**`, MEMORY).

## Acceptance mapping (DESIGN §9 — 7 criteria)

| # | Criterion | Evidence |
|---|---|---|
| 1 | Hub renders pair + activity cards in en/pt/es, localized chrome + metadata | `out/{en,pt,es}/languages/index.html` ×3; verify_out hub probes; leak audit 45 probes clean |
| 2 | All 5 activities playable at new URLs; progress persists; import/export works | 5 players ×3 locales exported (verify_out count); `v1:lang-*` storage + dual-read (17 tests); import/export kept |
| 3 | Old `/games/vocabulary/*` redirect; games index has no vocabulary category (7 remaining) | 5 noindex stubs ×3 with pair-correct links (verify_out); games-gate-7; `games.categories.vocabulary` removed |
| 4 | `lib/games` vocabulary code removed; `lib/languages` loader with locale merge | W2 strip; `get-language-content.ts` (activities/pairs/locales merge) |
| 5 | Validator + CI green; out page counts match generateStaticParams | validate-languages 35 pytest + `languages-gate-5`; verify_out `5 language players` + pair/hub counts; ci_sim **16/16 PASS** |
| 6 | No horizontal scroll at 320px; keyboard-operable matching | F-063 grid bases (`grid-cols-1` first) + `min-w-0` cards; matching buttons remain native buttons |
| 7 | Zero hardcoded EN in moved components | verify_out leak audit (45 probes, incl. `Number of pairs:`, `Translation Quiz`, redirect texts) |

## Final battery (2026-10-23)

`tsc` 0 · ESLint 0/0 · vitest **1036 pass / 116 skip** · pytest **566 passed / 1 skipped / 1 xfailed** · coverage **81% ≥ 80** · build 1626 pages · verify_out **all checks passed** (33 core + 45 leak probes) · ci_sim **16/16 PASS**.

## Alternatives rejected

- **Full nav redesign now** — F-060 stays Phase 7 (D52); the More-dropdowm is the minimal capacity fix.
- **Write-back migration of legacy flashcard keys** — dual-read-only keeps the legacy data intact and avoids cross-app coupling (D48).
- **Removing shared `games.*` player chrome keys** — the other 7 game clients still read them (D47 copy-not-move).
- **Old slugs without pair in redirect** — would 404; stub resolves the pair server-side via `getPairForSlug`.

## Residuals (deferred, tracked)

- Full header redesign + drawer + switcher collapse (F-060/061) → Phase 7.
- Home Languages rail (pair cards, real stats) → Phase 8.
- Language course tracks (`languages.tracks.coming_soon` placeholder) → Phase 9.
- Question banks / word-list translation policy unchanged (word content is learning material) → Phase 9.
- `dict: any` typing (ISSUE-05) → TS-strict phase.
