# 2026 Application Review — Nuniversity

Deep assessment of the **application** (not course content) and the **harness** of the
solution, plus the complete fix/improvement inventory and the phased plan to make the
site bug-free, responsive, translated, feature-rich (courses, tools, library, roadmaps,
quizzes/simulations, games), and ready to resume content creation.

- **Date:** October 2026
- **Method:** four read-only deep audits (app shell/i18n/responsive · games/tools/library/quiz · learning UX/roadmaps/home/gamification · harness/CI/docs/config), all findings verified against working-tree code and the exported `out/` build
- **Scope:** `app/`, `components/`, `lib/`, `middleware.ts`, configs, CI, Python harness, content-*ops* tooling (content correctness itself is covered by the existing translation work, not here)

## Reading guide

| # | File | What it answers |
|---|---|---|
| 1 | [ASSESSMENT-APP.md](./ASSESSMENT-APP.md) | Deep state of the website application: architecture, i18n, every surface (courses, lessons, roadmaps, quizzes, games, tools, library, home), responsive risks, accessibility, SEO/security |
| 2 | [ASSESSMENT-HARNESS.md](./ASSESSMENT-HARNESS.md) | Deep state of the harness: CI, Python harness, tests, content-ops scripts/hooks, config quality, docs drift |
| 3 | [FIXES.md](./FIXES.md) | Every bug/defect as prioritized tables (P0/P1/P2) with file:line, fix approach and verification; legacy-issue cross-reference |
| 4 | [IMPROVEMENTS.md](./IMPROVEMENTS.md) | Best improvements and features, incl. the mapped items: games/tools translation, library overhaul, new apps |
| 5 | [DESIGN-QUIZZES-APP.md](./DESIGN-QUIZZES-APP.md) | Design for the new `/[lang]/quizzes/` app (moves Snowflake quiz from games; real exam-simulation UI) |
| 6 | [DESIGN-LANGUAGES-APP.md](./DESIGN-LANGUAGES-APP.md) | Design for the new `/[lang]/languages/` hub (moves the 5 vocabulary games) |
| 7 | [PLAN.md](./PLAN.md) | The deep high-level plan: 9 phases, acceptance criteria, dependencies, decision log, Definition of Done |
| 8 | [PLAN-MODERNIZATION.md](./PLAN-MODERNIZATION.md) | Platform modernization on free tiers: 7 epics / 16 sprints — CI gates, PostHog, UptimeRobot, Web3Forms, Cloudflare Worker API, Clerk accounts, Neon progress sync (gates, quota ledger, troubleshooting, DoD) |

> Historical: `docs/assessment/ASSESSMENT.md` (Sep 6) tracked 25 issues; **23 remain open**
> at review time — each is cross-referenced in FIXES.md so nothing is lost.

## Top 15 headline findings

1. **No root page & default 404** — `output: 'export'` produces no `out/index.html`; site root hits an English-only Next default `404.html` with no site chrome (`app/not-found.tsx` missing).
2. **Locale middleware never runs in production** — `middleware.ts` redirects/cookies only work in `next dev`; nothing middleware-related ships in `out/`.
3. **No course landing page** — `courses/[courseSlug]/` has only `[lessonSlug]/`; links to `/{lang}/courses/{slug}` (emitted by `courses-client.tsx:234`, `FeaturedCourses.tsx:156`) 404 in the export.
4. **Library links point at domain roots, not resources** — of 59 items: **29 bare-domain URLs**, 18 single-segment, only 12 deep links; 5 duplicate URLs; 1 hard 404; **51/59 thumbnails dead** (404/403).
5. **Games & tools are not translated** — all 13 game clients and 9 of 10 tool components ignore `dict` entirely; `/pt` `/es` games/tools render English UI; game JSON `locales` exist for only 3/13 games.
6. **ES library is empty** — `content/library/es/` does not exist → `/es/library/` renders “0 resources”.
7. **12 ` ```interactive ` blocks render as raw JSON** — `MarkdownRenderer` has no `interactive` branch (exam-simulation lessons affected).
8. **No lesson progress of any kind** — no mark-complete, no resume, no score aggregation; the lesson progress bar is positional only.
9. **Zero real tests** — no `*.test.ts(x)` exists; `vitest` passes via `passWithNoTests`; docs still claim “13 tests passing”.
10. **Type/lint safety disabled** — `tsconfig` `strict:false` + `next.config.js` `ignoreBuildErrors`/`ignoreDuringBuilds`; CI enforces neither.
11. **Every subpage declares canonical = locale root** — `layout.tsx:41` alternates + duplicate hreflang/viewport tags; `og-image.png` referenced but missing; no sitemap.
12. **Header breaks between 768–1100px** — 8 nav links + badges + full language name + hamburger with no wrap strategy; mobile menu lives inside the sticky header.
13. **CI gates only 26 of 49 courses**; no lint step, no Python tests, no dictionary-parity/game/library validators in CI; node version three-way mismatch (20 / 22 / 24).
14. **Python harness is hollow** — `src/` contains only committed egg-info, coverage targets nonexistent `scripts/`/`hooks/`, pytest cannot collect `tests/`.
15. **No site-wide search, no gamification in learning paths, one roadmap only** — the big experience gaps the plan addresses.

## Scale snapshot

| Dimension | Count |
|---|---|
| Courses (dirs) | 49 (26 course:locale pairs CI-gated) |
| Lessons (en/pt/es) | ~1,000 across locales (translation loop complete for in-scope pairs: 20/20 pass) |
| Games | 13 (8 categories) |
| Tools | 10 (3 locales of frontmatter; 1/10 uses dictionaries) |
| Library resources | 59 (8 EN, 51 PT, 0 ES) |
| Roadmaps | 1 |
| Locales | en, pt, es (dictionary key parity complete — `dict-parity` 5/5, incl. `languages.*`) |

## Status of this review

This folder is documentation only — no application code was changed to produce it.
Execution happens phase-by-phase per [PLAN.md](./PLAN.md).

- **Phase 1 (Harness & CI): ✅ complete — 2026-10-20.** Evidence in [PLAN.md](./PLAN.md) Phase 1 status block,
  harness items closed in [FIXES.md](./FIXES.md) (Phase 1 closeout), gating scope in [GATE-WAIVERS.md](./GATE-WAIVERS.md).
  Changes are in the working tree, committed by the maintainer.
- **Phase 2 (Critical bugs): ✅ complete — 2026-10-21** (Phase 2 closeout in [FIXES.md](./FIXES.md)).
- **Phase 3 (i18n completeness): ✅ complete — 2026-10-22** (deep plan + status in [PLAN.md](./PLAN.md),
  closeout in [FIXES.md](./FIXES.md)).
- **Phase 4 (Quizzes app): ✅ complete — 2026-10-22** (deep plan in [PLAN-PHASE4.md](./PLAN-PHASE4.md),
  status in [PLAN.md](./PLAN.md), closeout in [FIXES.md](./FIXES.md)).
- **Phase 5 (Languages app): ✅ complete — 2026-10-23** (deep plan in [PLAN-PHASE5.md](./PLAN-PHASE5.md),
  status in [PLAN.md](./PLAN.md), closeout in [FIXES.md](./FIXES.md)).
- **Phase 6 (Learning experience): ✅ complete — 2026-10-24** (deep plan in [PLAN-PHASE6.md](./PLAN-PHASE6.md),
  status in [PLAN.md](./PLAN.md), closeout in [FIXES.md](./FIXES.md)).
- Phases 7–9: not started.
- **Platform modernization (free-tier backend stack): 📋 plan ready, execution not started —** deep
  epics-and-sprints plan in [PLAN-MODERNIZATION.md](./PLAN-MODERNIZATION.md) (gates G0–G4).
