# Phase 3 — Deep Implementation Plan (i18n completeness)

Short-term execution plan. Extends [PLAN.md](./PLAN.md) Phase 3 with researched,
file-level detail. Status: ✅ executed 2026-10-22 — closeout evidence in [PLAN.md](./PLAN.md) Phase 3.

## Locked decisions (D31–D35)

| # | Decision |
|---|---|
| D31 | Game content locales: add `locales.title/description` to ALL EN-only game JSONs (6 gameplay + 3 vocab + quiz title/desc); make loaders locale-aware: `getAllGames(locale)`, `getGameFile(type, slug, locale?)`. Pattern proven in `getConversationGame :253-292`. Question banks stay EN (DESIGN-QUIZZES §4, Phase 9). |
| D32 | Legacy `quiz-game-client` (1,448 ln): minimal shared-key wiring only (`back_to_games`, `difficulty.*`, `play_again`, `common.*`). Full ~70-key i18n ships with the Phase 4 rewrite (`quizzes.*` namespace; DESIGN-QUIZZES §11 "refactor while move"). Leak audit waives `/games/quiz/` until Phase 4. |
| D33 | ES library: full 59-item translation now into `content/library/es/` (shared URLs; `link-exceptions.tsv` applies). |
| D34 | F-052 switcher: alias map keyed by guaranteed `NN-` lesson prefix (structure-gate enforces sequential numbering → stable cross-locale identity) for the 5 divergent courses + course-landing fallback. Script generates JSON; committed. |
| D35 | Tool cards use per-tool `tool.icon` (frontmatter); shared complete icon map; category icon only on group headings (add missing `study` key); F-023 normalization + home `iconBgMap` re-key land in the SAME batch (F-023 breaks raw-English keys otherwise). |

Phase order kept: 3 → 4 → 5. Boundary: Quizzes app, Languages app, 833-question
translation = NOT Phase 3.

## Research findings (verified)

- Games: 7/11 clients have 0 `dict.` reads (vocab/flashcards/conversation already
  wired). `games.categories` missing `quiz/puzzles/conversation` (orphans: `grammar/fun`).
  11/13 game JSONs EN-only; `getAllGames()` feeds card titles raw (`get-game-content.ts:167-169`);
  `conversation/[slug]/page.tsx:33` omits `lang` in generateMetadata. New-key budget ≈ 95
  (shared 25, stats +15, per-game ~50, categories 3) + `metadata.games.*`.
- Widgets (F-032): 5 client components, ~30 distinct strings / ~42 sites; `MarkdownRenderer`
  has `lang` (callouts) but no `dict`; lesson page loads dict at `:76`, renders `:178` without
  it. Tests assert EN literals → optional `dict` prop with `?? 'EN'` fallbacks required.
  Inner subs need prop: `DroppableSlot`, `ItemsMode/TemplateMode`, `InlineBlank`.
- Tools icons: frontmatter icons identical across locales. List page ignores `tool.icon`
  (category icon at `tools-client.tsx:189`); `categoryIcons` lacks `study`; slugify turns
  "Study & Learning"/"Coding & Programming" into `&_` keys → Wrench/gray fallback. Home
  `Tools.tsx` `iconMap` covers only 5/10 icons (missing lightbulb, bar-chart, grid-3x3,
  calculator → Code fallback); `iconBgMap` keyed by raw EN categories.
- F-023: 14 distinct category strings across 30 tool frontmatter files; target = the 10
  canonical `dict.tools.categories` slugs (identical in all 3 locales).
- Switcher F-052: 5 courses en/pt divergent (ddd-software-architecture,
  nonprofit-organization-fundamentals, practical-ai, processes-flowchart,
  solid-principles-oop), 2 es divergent.

## Workstreams

| # | Work | Owner |
|---|---|---|
| W0 | Dict scaffolding ×3 (parity test 5/5 stays green): `widgets.*` (~30), `games.*` chrome (~95), `metadata.games` + site description/keywords (F-035), `about.learn_more`, `roadmaps.notFound`, tools chrome keys, `flashcards.learned` + `{n2}` placeholder repair | me |
| W1 | Tools i18n: 9 components read `dict.tools.*`; Eisenhower/SWOT inline pt/es maps → dict (F-022/033) | agent A |
| W2 | Games clients part 1: binary-hex, typing-speed, number-sequence, math-challenge (module-scope `modeLabels` → in-component) + `games-client.tsx` headings/empty-state/difficulty (F-020) | agent B |
| W3 | Games clients part 2: periodic-table (generated question stems → dict), word-search; F-034 metadata (index `:21-22`, 8× "Game Not Found", suffixes, conversation lang pass); D32 minimal quiz wire | agent |
| W4 | Game content: `locales` blocks into 9 JSONs (pt/es titles+descriptions) + loader locale params + call sites (index cards, detail headers) | agent |
| W5 | ES library: translate all 59 items → `content/library/es/`; gated by `validate_library` + dict-parity + leak audit | agent |
| W6 | Tools data & icons: (a) F-023 canonical slugs ×30 files; (b) new `lib/tools/tool-icons.ts` covering all 10 icon names; (c) list cards render `tool.icon`, group heading keeps fixed category icon (+`study`) and color; (d) re-key home `iconBgMap` to slugs — same batch as (a) | me |
| W7 | F-035 layout metadata → dict (`layout.tsx:33-34,57,71,109`); F-030 About `:359` "Learn more"; F-031 "Roadmap Not Found" | me |
| W8 | F-032 widget threading: lesson `page.tsx:178` → `MarkdownRenderer` optional `dict` → 7 dispatch sites → 5 components + inner subs; EN-fallback defaults keep `question-block`/`interactive-adapter` tests green. `widgets.*` reused by Phase 4 ExamRunner | me |
| W9 | F-052 switcher: `NN-`-prefix alias map (5 courses) + landing fallback; gen script + committed JSON | me |
| W10 | Leak audit (curated EN-string grep over `out/pt` + `out/es`, `/games/quiz/` waived per D32) wired into verify_out/ci_sim; full battery; FIXES/PLAN closeout (D31–D35) | me |

## Sequencing

W0 → [W1+W2] ∥ me W7 → [W3+W4] ∥ me W8 → [W5] ∥ me W6, W9 → W10.
Max 2 agents in flight. Dictionary keys land before their consuming workstream.

## Acceptance

1. `/tools` cards show correct per-tool icons in all 3 locales; group headings use fixed
   category icons/colors (incl. study).
2. Leak audit clean on pt/es exports for games/tools/home/list pages (quiz waived, D32).
3. `/es/library/` populated (59 items).
4. All hub/list/detail page titles+descriptions localized (games, layout, metadata).
5. Every non-quiz game client reads `dict`; game card titles localized (D31).
6. Widgets localized on pt/es lessons (spot-check feedback/buttons).
7. Language switcher resolves lessons across all 5 divergent courses, both directions.
8. Battery green: tsc 0 · lint 0 · vitest · pytest · build+postbuild · verify_out
   (core+extended+leak) · ci_sim.

## Phase 4/5 boundary (for the next steps)

- **Phase 4 (Quizzes):** `/quizzes/` routes, move snowpro JSON, split quiz-game-client →
  QuizPlayer/ExamRunner/CertificateCard with `quizzes.*` (~80 keys), redirects,
  `validate_quiz` CI, exam-simulation lessons → ExamRunner wrapper.
- **Phase 5 (Languages):** `/languages/` hub, move 5 vocab JSONs + 2 clients,
  `languages.*` (~60 keys), F-074/F-101, validator category-set fix.
