> **HISTORICAL — superseded.** Kept for decision provenance only. Do not follow as current guidance. See `docs/INDEX.md`.

# Improvements — Best Features & Upgrades

The improvement portfolio for the platform, ordered by user impact. Items marked
**🆕 new app** have dedicated design docs: [DESIGN-QUIZZES-APP.md](./DESIGN-QUIZZES-APP.md),
[DESIGN-LANGUAGES-APP.md](./DESIGN-LANGUAGES-APP.md). Phases refer to [PLAN.md](./PLAN.md).

---

## 1. Mapped user priorities (this review’s mandate)

### 1.1 Translate games & tools (currently EN-only)
- **Tools (Phase 3):** wire `dict.tools.*` into the 7 non-consuming components; migrate
  Eisenhower/SWOT private maps into dictionaries (one source of truth); fix category
  normalization across 30 frontmatter files (`Productivity` vs `Produtividade`, missing
  `study_&_learning` keys); localized `generateMetadata`.
- **Games (Phases 3/5):** localize the 6 EN-only clients + games index (categories,
  empty state, `<title>`); add `locales` blocks to the 10 untranslated game JSONs
  (titles/descriptions/chrome) using the established i18n gate pipeline
  (verify+quality gates); vocabulary clients move with the Languages app (Phase 5),
  conversation game stays in Games (Phase 3).
- **Result:** `/pt` and `/es` games/tools sections genuinely speak the visitor’s language.

### 1.2 Library overhaul (broken links → the resource)
- **Deep-URL curation (Phase 2):** every item gets the actual resource URL (deep link
  into the course/video/article), not the platform homepage; dedupe 5 duplicates;
  fix dead URLs; link-check script added to CI (Phase 1 validator).
- **Thumbnails (Phase 2/3):** 51/59 dead → verified per-item thumbnails + graceful
  placeholder + `loading="lazy"` + dimensions.
- **Coverage (Phase 3):** create `content/library/es/`; expand EN set; filter gains all
  7 types; result count localized.
- **Detail pages (Phase 8):** activate dead `getResourceById` — card → detail route with
  rendered MD body (description, tags, related), SEO metadata, working outbound CTA.
- **Curated collections (Phase 8):** type/track collections (“Data Engineering starter
  pack”), homepage library rail.

### 1.3 🆕 Quizzes / test / certification-simulation app
`/[lang]/quizzes/` — see full design in **DESIGN-QUIZZES-APP.md**:
hub for certification quizzes + practice sets; **Snowflake quiz moves from
`/games/quiz/`**; exam-simulation lessons get a real exam UI (timer, navigator, score
screen); results history + certificates in localStorage; new validator gates quiz JSON
in CI.

### 1.4 🆕 Languages app
`/[lang]/languages/` — see **DESIGN-LANGUAGES-APP.md**: full hub for the **5 vocabulary
games** (en↔pt, es↔en, es→pt, fr→pt): language-pair cards, flashcard/quiz practice
modes, progress tracking, localized UI, redirects from old `/games/vocabulary/*` URLs.

---

## 2. Learning experience (courses & lessons)

| Improvement | Description | Phase |
|---|---|---|
| **Course landing/syllabus pages** | Fulfills F-002: curriculum accordion, meta (author/difficulty/duration/lessons), start/resume CTA, breadcrumb target, SEO entry point per course | 2 |
| **Progress tracking** | `localStorage` per course: mark-lesson-complete, completed set, % on course list + landing; drives resume | 6 ✅ |
| **Resume / continue-learning** | “Continue where you left off” card on home + courses list (last visited lesson) | 6 ✅ |
| **Lesson outline & navigation** | Sticky sidebar (desktop) + drawer (mobile) resurrecting the dead `lesson-client.tsx` design; in-page TOC from headings with anchor links; scroll progress bar; keyboard ←/→ | 6 ✅ |
| **Lesson score aggregation** | Collect results from all question/matching/fillblank/dragdrop widgets in a lesson → “8/10 correct” summary + review of missed items; feeds lesson-complete | 6 ✅ |
| **Reading affordances** | Reading-time estimate, font-size control, copy-link on headings | 6 ⚠ partial (reading time ✅; font-size control + copy-link → Phase 7) |
| **Feedback widget** | “Was this helpful?” per lesson (localStorage + optional Formspree payload) | 6 ✅ |

## 3. Search, gamification, engagement

| Improvement | Description | Phase |
|---|---|---|
| **Site-wide search (⌘K)** | Command-palette over courses, lessons, tools, games, library, roadmaps, quizzes — build-time JSON index (pagefind/flexsearch); header entry point | 6 ✅ (custom matcher + `prebuild` JSON index) |
| **XP, levels & streaks** | Earn XP for lessons/quizzes; daily streak; visible profile chip (all localStorage — static-export safe) | 6 ✅ |
| **Badges & achievements** | First lesson, course complete, perfect quiz, roadmap 100%, language streak… | 6 ✅ (5 badges shipped: first-lesson/quiz-pass/perfect-quiz/course-complete/streak-7; roadmap + language badges → v2) |
| **Certificates** | Printable certificate on passing mock exams (quizzes app) and course completion — PDF/print layout with slug verification code | 4/6 ✅ (mock-exam certs + `/quizzes/certificates/` hub shipped; course-completion certificate → v2) |
| **Home upgrades** | Roadmaps section, Games rail, “Continue learning” rail, real stats (fix F-024/F-042), search hero CTA | 8 |

## 4. Roadmaps

- **More roadmaps** (Data Engineering, Python, Cloud…) — content phase, but the parser
  already supports steps/relationships/prereqs.
- **Auto-completion sync:** visiting/completing a roadmap-linked lesson checks the step.
- **Render `conditionals`** (parsed today, never shown) and use `resolveContentUrl`
  (F-103) safely against course landing pages.
- **Dashboard:** all roadmaps’ progress in one place; cross-links roadmap ↔ course progress.

## 5. Quizzes embedded in lessons (independent of the app)

- Per-lesson **score summary** (§2), partial credit in matching/fillblank, `aria-live`
  everywhere (F-073), widget chrome localized (F-032).
- `interactive` fence fixed (F-005) enabling richer exam-simulation content.

## 6. Platform polish

### Responsive (Phase 7 — F-060…F-068)
Header redesign (breakpoint collapse, drawer menu) — also unblocks the Quizzes+
Languages nav links; flag-only switcher on mobile; responsive grid variants across
game/tool stat rows; HabitTracker scroll; avatar fix; global overflow guard.

### Accessibility (Phase 7 — F-070…F-074)
Skip link, reduced-motion, focus-visible styles, aria-live/aria-current/aria-label
completions.

### SEO (Phases 2–3 — F-007/F-008/F-055…F-057)
Self-referential canonicals, one hreflang set, sitemap, og-image, localized page
metadata (roadmaps/games/contact/about titles).

### Performance & hygiene (Phase 7)
Unused-dep prune, lazy thumbnails, remove double `min-h-screen`, mobile-safe media
components, dynamic-import loading states (F-100).

## 7. Harness-driven improvements (Phase 1 — details in ASSESSMENT-HARNESS)

- CI gains: lint step, gradual TS strict (then remove `ignoreBuildErrors`), first real
  vitest suites (i18n parity, data integrity, link-check, component smoke), Python
  pytest fixed & run, dict-parity + games/library/roadmap/tools validators, all 49
  courses gated, PR trigger, node version unified.
- Outcome: **every later phase lands verified**; regressions become CI failures, not
  user reports.

## 8. Explicitly out of scope (for now)

- Accounts/auth/server persistence (site is static-export by design — all progress in
  localStorage).
- Content creation (resumes in Phase 9): new courses, language tracks, roadmap content,
  library items, extra quizzes beyond Snowflake + exam-simulation extraction.
- Monetization/ads (AdsSpace decision deferred; `ads.txt` casing fixed as hygiene).
