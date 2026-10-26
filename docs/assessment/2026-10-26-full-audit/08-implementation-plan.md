# 08 — Deep Implementation Plan

**Audit date:** 2026-10-26
**Baseline:** `next@14.2.33` · 1,253 tests passing · 1,633 generated pages · 25 npm advisories

---

## 0. Implementation status (as of 2026-10-26)

Work is proceeding through the phases below. This section tracks what has
landed and what is next.

### Landed — Phase 1 (security foundations)

| Task | Status | Notes |
|------|--------|-------|
| 1.1 `lib/storage/safe-storage.ts` | ✅ Done | New module. `safeGet`/`safeSet`/`safeRemove`/`readJson`/`writeJson`/`safeGetString`, plus `createSafeMap` and `isSafeKey`. `readJson` accepts a **validator**, and purges the key when the validator rejects the value. |
| 1.2–1.6 Storage module migration | ✅ Done | `lib/progress/storage.ts`, `lib/quizzes/storage.ts`, `lib/lessons/feedback.ts`, `lib/gamification/profile.ts`, `lib/languages/storage.ts` — the 5 byte-identical helper copies are gone. |
| 1.7 Raw-access component migration | ✅ Done | `Providers.tsx`, `FlashcardMaker.tsx`, `HabitTracker.tsx`, `PomodoroTimer.tsx`, `RoadmapTimeline.tsx`, `number-sequence-client.tsx` now use the shared helper **with shape validation**. |
| 1.8 Theme value validation | ✅ Done | `readStoredTheme()` accepts only `'light'`/`'dark'`; the unchecked `as` cast is gone. |
| 1.9 Cookie attributes | ✅ Done | `SameSite=Lax` + conditional `Secure` (HTTPS-only, so local previews still work). |
| 1.3 Certificate-name hardening | ✅ Done | 400 ms debounce, 120-char cap, trim/collapse on read, "Remove" button, `clearCertName()`. New dictionary keys in en/pt/es. |

### Landed — Phase 5 (design system + UX/UI), revised

| Task | Status | Notes |
|------|--------|-------|
| 5A.1–5A.3 Three-layer token architecture | ✅ Done | `app/globals.css` rewritten: primitives → semantic → component/section. **53 hardcoded hex → 0.** |
| 5A.4 daisyUI removed | ✅ Done | Only 2 usages existed. Global CSS **152 KB → ~101 KB**. |
| 5A.5 Hardcoded greys → tokens | ✅ Done | The Tailwind `gray` ramp is aliased to the slate values behind the tokens, so the 1,000-odd existing `gray-*` utilities sit in the same family as the semantic tokens. |
| 5A.7 Reading measure | ✅ Done | Lesson prose capped at 68ch via `.prose-measure`. |
| 5A.10 Colour map | ✅ Done | **New:** one colour per top-level section, in `lib/navigation/sections.ts` + `--section-*` tokens. Applied to the nav indicator, section headers, card tiles and search results. |
| 5A.11 Brand palette | ✅ Done | Blue → cyan, replacing the blue→violet gradient that read as Nubank. All brand surfaces now use `--brand-gradient`. |
| 5B.1 "NEW" badges removed | ✅ Done | They were on 7 of 8 nav items. |
| 5B.2–5B.5 Header/footer redesign | ✅ Done | Sticky header with scroll shadow, condensed to **2 items + Explore**, Explore mega-menu with colour-coded cards, accessible mobile menu. |
| 5C.1 Hero redesign | ✅ Done | Light editorial surface, ambient brand light, **real type-ahead search**, single primary CTA. |
| 5C.6 ContinueLearning repositioned | ✅ Done | Now floats over the foot of the hero; redesigned with a progress bar and `role="progressbar"`. |
| 5C.7 SectionMap | ✅ Done | New — the 8-tile colour map on the home page. |
| 5C.8 Stats | ✅ Done | Moved to a closing band with animated counters (`useCountUp`). |
| 5C.9 Search metadata | ✅ Done | The index now carries course title, position, area, difficulty, duration, category, certification, language pair. Rendered in both the hero type-ahead and the ⌘K palette. |
| 5C.10 Spotlight carousel | ⏸ Parked | `components/home/Spotlight.tsx` is **kept but not rendered** — it may return in a future iteration. |
| 5C.11 Topic marquee | ❌ Removed | The infinite scrolling subject strip was dropped at the user's request; the component and its CSS were deleted. |
| — | ✅ Extra | `scripts/verify-css.mjs` added to the build: fails if any Tailwind class used in source is missing from the compiled CSS (currently **373/373** resolve). It has already caught real bugs — see §9. |

### Landed — Phase 4 (accessibility), substantially

| Task | Status | Notes |
|------|--------|-------|
| 4.1 Skip link | ✅ Done | `app/[lang]/layout.tsx` + `<main id="main-content">`. |
| 4.2 Focus system | ✅ Done | Global `:focus-visible` baseline; bare `focus:outline-none` removed. |
| 4.3 `aria-current` | ✅ Done | On every nav link, with an `exact` flag for the locale root (which otherwise stayed active on every route). |
| 4.4 Command palette dialog | ✅ Done | Real close button, focus trap, focus restoration, `role="dialog"`, `aria-modal`. |
| 4.6 Reduced motion | ✅ Done | Global block; the carousel and counters honour it. |
| 4.11 Motion/stacking regression test | ✅ Done | `tests/ui/motion-stacking.test.ts` — entrance keyframes must end on `transform: none` so they leave no stacking context behind. |

### Next — by plan order

| Priority | Task | Finding | Effort |
|----------|------|---------|--------|
| 1 | **PERF-01** — replace the `Prism` bundle with per-language registration | High | 3 h |
| 2 | **PERF-04** — resize/convert the 2.5 MB team photo | Medium | 0.5 h |
| 3 | **ARCH-04** — add `not-found.tsx` / `error.tsx` boundaries | High | 2 h |
| 4 | **SEC-03** — contact form honeypot + limits | Medium | 3 h |
| 5 | **SEC-01** — CSP `<meta>` + verification script | Medium | 3 h |
| 6 | **SEC-08/09** — embed allowlists + iframe sandbox | Medium | 2 h |
| 7 | **PERF-02 / ARCH-08** — split the dictionary per namespace | High | 6 h |
| 8 | **Phase 0** — CI hardening, coverage thresholds, `middleware.ts` | Medium | 4 h |
| 9 | **Phase 6** — SEO (hreflang, JSON-LD), dependency upgrades | Medium | 26 h |

---

## 1. Strategy

### 1.1 Principles

1. **Incremental, never a rewrite.** Every phase is independently shippable and independently revertable. No phase depends on a later one.
2. **Behaviour-preserving by default.** Refactors must not change rendered output unless a finding explicitly calls for it. The test suite is the contract.
3. **Measure, then optimise.** Each performance change ships with the before/after number.
4. **Fix at the right layer.** A missing focus ring is fixed in the design system, not in 40 files. A missing `try/catch` is fixed in the shared storage helper, not in 11.
5. **Zero new dependencies.** Everything in this plan is achievable with the current stack. No UI framework, no state library, no CSS-in-JS.
6. **Static-export invariant preserved.** `output: 'export'` must keep working at every step. `npm run build` succeeding is a gate for every phase.

### 1.2 Ground rules for every change

```
✅ MUST pass:  npm test          (1,253 tests, non-regressing)
✅ MUST pass:  npm run lint      (0 new errors)
✅ MUST pass:  npx tsc --noEmit  (0 new errors)
✅ MUST pass:  npm run build     (static export succeeds, out/ complete)
✅ MUST keep:  1,632+ prerendered routes, 0 fallback entries
✅ MUST keep:  sitemap ≥ 1,600 URLs
✅ MUST NOT:   introduce a runtime dependency on the server
```

---

## 2. Phase plan

### Phase 0 — Baseline hardening (before anything else)

**Why first:** several later phases touch the same files. Establish a clean, verified baseline and fix the CI gaps so every subsequent change is automatically validated.

| # | Task | Finding | Files | Est. |
|---|------|---------|-------|-----:|
| 0.1 | Fix the malformed `actions/cache` key glob | SEC-12 | `.github/workflows/nextjs.yml` | 5 min |
| 0.2 | Align CI `node-version` with `engines` (`"22"`) | SEC-12 | `.github/workflows/nextjs.yml` | 5 min |
| 0.3 | Add `persist-credentials: false` to checkout | SEC-12 | `.github/workflows/nextjs.yml` | 5 min |
| 0.4 | Add the Python test suite to CI | SEC-12 | `.github/workflows/nextjs.yml` | 15 min |
| 0.5 | Add an `npm audit --audit-level=high` step | SEC-12 | `.github/workflows/nextjs.yml` | 10 min |
| 0.6 | Add a `pull_request` trigger (lint + test + build, no deploy) | SEC-12 | `.github/workflows/nextjs.yml` | 15 min |
| 0.7 | Enable `coverage.all` + set thresholds (70/70/60/70) | ARCH-01 §6.2 | `vitest.config.ts` | 15 min |
| 0.8 | Remove the stale Python `.coverage` DB from the repo root | ARCH-01 §6.2 | `.gitignore`, `git rm --cached .coverage` | 5 min |
| 0.9 | Delete the dead `middleware.ts` (or extract the shared locale resolver) | ARCH-06 | `middleware.ts` | 1 h |

**Gate:** all baseline checks green; `git status` clean; CI green on a test PR.

> **Decision on 0.9:** *delete*. The middleware never runs in production. Keeping it means three divergent implementations of the locale redirect (middleware, `public/index.html`, `postbuild.mjs`). Deleting it and making `public/index.html` the single dev+prod implementation removes the divergence. The `next dev` server will serve the static stub at `/`, which performs the same redirect.

---

### Phase 1 — Critical & High cybersecurity

**Goal:** close every confirmed security finding. No behaviour change for end users beyond the contact form hardening.

| # | Task | Finding | Files | Est. |
|---|------|---------|-------|-----:|
| 1.1 | **Create `lib/storage/safe-storage.ts`** — `safeGet`/`safeSet`/`safeRemove` with `try/catch`, corrupt-key purge, optional schema validator, `Object.create(null)` maps, `__proto__` key skipping | ARCH-01, SEC-04, SEC-05 | **new** | 1 h |
| 1.2 | Migrate `lib/progress/storage.ts` → shared helper | ARCH-01 | `lib/progress/storage.ts` | 15 min |
| 1.3 | Migrate `lib/quizzes/storage.ts` → shared helper; **debounce + cap + trim the certificate name** | ARCH-01, SEC-02 | `lib/quizzes/storage.ts` | 30 min |
| 1.4 | Migrate `lib/lessons/feedback.ts` → shared helper | ARCH-01 | `lib/lessons/feedback.ts` | 15 min |
| 1.5 | Migrate `lib/gamification/profile.ts` → shared helper | ARCH-01 | `lib/gamification/profile.ts` | 15 min |
| 1.6 | Migrate `lib/languages/storage.ts` → shared helper; **fix the `__proto__` setter** | ARCH-01, SEC-04 | `lib/languages/storage.ts` | 30 min |
| 1.7 | Migrate the 6 raw-`localStorage` components → shared helper with **shape validation** | ARCH-01, SEC-05 | `Providers.tsx`, `FlashcardMaker.tsx`, `HabitTracker.tsx`, `PomodoroTimer.tsx`, `RoadmapTimeline.tsx`, `number-sequence-client.tsx` | 1.5 h |
| 1.8 | Fix the `Providers.tsx` theme assertion (`raw === 'dark' \|\| 'light'`) | SEC-05 | `components/providers/Providers.tsx` | 15 min |
| 1.9 | Add `Secure` + `SameSite=Lax` to the `NEXT_LOCALE` cookie (HTTPS-guarded) | SEC-07 | `components/language/LanguageSwitcher.tsx` | 15 min |
| 1.10 | **Contact form hardening** — honeypot, `maxLength` on all fields, submit debounce, privacy notice, env-var form ID, `state.reset()` | SEC-03 | `components/contacts/Contact.tsx`, `app/[lang]/contact/page.tsx`, `.env.example` | 2 h |
| 1.11 | **Add a CSP `<meta>` to the root layout** + `<meta name="referrer">` | SEC-01, SEC-13 | `app/[lang]/layout.tsx` | 1 h |
| 1.12 | Validate the CSP against the built output (scan `out/**/*.html` for inline scripts and external origins) | SEC-01 | **new** `scripts/verify_csp.mjs` | 1 h |
| 1.13 | Allowlist `PhETEmbed` slug + language; `encodeURIComponent`; `sandbox` on the iframe; replace the unreachable `onError` with a load timeout | SEC-08, SEC-09 | `components/markdown/PhETEmbed.tsx` | 1.5 h |
| 1.14 | Allowlist `MoleculeViewer` PDB ID; add `AbortController`, `response.ok`, content-type and size checks to the RCSB fetch; guard the missing-`pdbId` crash | SEC-08 | `components/markdown/MoleculeViewer.tsx` | 1.5 h |
| 1.15 | Add a "remove saved name" control + a privacy note to the certificates page | SEC-02, SEC-13 | `components/quizzes/CertificateCard.tsx`, `components/quizzes/CertificatesClient.tsx` | 45 min |

**Files touched:** ~14 modified, 2 new.

**Verification gate**
```
npm test                                     # all green, no regression
npx tsc --noEmit                             # clean
npm run build                                # export succeeds
node scripts/verify_csp.mjs                  # no CSP violations in out/
grep -rn "localStorage" app components lib   # → only lib/storage/safe-storage.ts
grep -rn "document.cookie" app components    # → only LanguageSwitcher.tsx
```

**New tests to add**
- `tests/storage/safe-storage.test.ts` — quota errors, corrupt JSON, schema validation, `__proto__` key rejection, `Object.create(null)` semantics.
- `tests/components/certificate-name.test.tsx` — debounce, 120-char cap, trim on read, clear path.
- `tests/components/contact-form.test.tsx` — honeypot blocks submission, `maxLength` present, debounce blocks a double-submit.

---

### Phase 2 — Significant architectural problems

**Goal:** remove duplication, add the missing route boundaries, and fix the static-export fragility.

| # | Task | Finding | Files | Est. |
|---|------|---------|-------|-----:|
| 2.1 | Add `app/[lang]/not-found.tsx` (renders the existing `NotFoundClient`) and `app/not-found.tsx` | ARCH-04 | **new** × 2, `app/[lang]/404/not-found-client.tsx` | 1 h |
| 2.2 | Add `app/[lang]/error.tsx` — a client error boundary with a reset action and a branded fallback | ARCH-04 | **new** | 1 h |
| 2.3 | Add `app/[lang]/loading.tsx` — a skeleton for slow client transitions | ARCH-04 | **new** | 30 min |
| 2.4 | Extract the alert preprocessor to `lib/markdown/alerts.ts` and convert the 8 JSON-config branches into a **registry map** | ARCH-02 | `components/markdown/MarkdownRenderer.tsx`, **new** `lib/markdown/alerts.ts` | 3 h |
| 2.5 | Convert the 6 interactive block components to `next/dynamic` (removes dnd-kit from the lesson bundle) | ARCH-03 | `components/markdown/MarkdownRenderer.tsx` | 1 h |
| 2.6 | Extract the shared `<PageShell>`, `<ErrorBox>`, `<Spinner>`, `<Card>`, `<DifficultyBadge>`, `<GameResultHeader>` primitives | ARCH-11 | **new** `components/ui/*`, ~20 consumers | 4 h |
| 2.7 | Hoist the duplicated `shuffle<T>()` to `lib/utils/shuffle.ts` | ARCH-11 | **new**, 4 consumers | 30 min |
| 2.8 | Replace the hardcoded `['en','pt','es']` with `i18n.locales` | ARCH-07 | `app/[lang]/tools/[slug]/page.tsx` | 15 min |
| 2.9 | Harden the `notFound()` sites so a content addition cannot break the build (`games/coding`, `languages/[pair]/[activitySlug]`) | §5.1 | `app/[lang]/games/coding/[slug]/page.tsx`, `app/[lang]/languages/[pair]/[activitySlug]/page.tsx` | 1.5 h |
| 2.10 | Normalise the `languagePair` / `language_pair` field mismatch | §5.2 | `lib/languages/types.ts`, `lib/languages/get-language-content.ts` | 1 h |
| 2.11 | Split the dictionaries into namespaces and select per-route | ARCH-08, PERF-02 | `dictionaries/*`, `lib/i18n/get-dictionary.ts`, 27 pages | 6 h |
| 2.12 | Update `dict-parity` to compare the namespace union | ARCH-08 | `tests/i18n/dict-parity.test.ts` | 45 min |
| 2.13 | Extract `thirty-six-questions-client.tsx` into 4 phase components | ARCH-02 | `app/[lang]/games/conversation/[slug]/` | 3 h |
| 2.14 | Extract a shared `<MatrixGrid>` from `SWOTMatrix` / `EisenhowerMatrix` | ARCH-02 | `components/tools/SWOTMatrix.tsx`, `components/tools/EisenhowerMatrix.tsx` | 3 h |

**Files touched:** ~45 modified, ~12 new.

**Verification gate**
```
npm test                                     # 1,253+ green
npm run build                                # ≥ 1,632 prerendered routes
node -e "const m=require('./.next/prerender-manifest.json');
         console.log(Object.keys(m.routes).length, Object.keys(m.dynamicRoutes).length)"
# → both must match the pre-change baseline
node scripts/verify_out.mjs                  # output verification
```

**Risk notes**
- **2.11 is the highest-risk change** — it touches 27 pages and the dictionary format. Mitigation: keep the current single-file dictionaries as the *source*, generate the namespace files with a script, and run the parity test at every step. Land it as one PR with the parity test updated in the same commit.
- **2.9 / 2.10** change build-time behaviour. Mitigation: run a full build and diff the route list against the baseline.

---

### Phase 3 — Performance

**Goal:** cut the lesson route from 1.98 MB to under 400 KB and the home page HTML from 262 KB to under 120 KB.

| # | Task | Finding | Files | Est. | Expected delta |
|---|------|---------|-------|-----:|----------------|
| 3.1 | **Replace the `Prism` full bundle with per-language registration** (7 languages) | PERF-01 | `components/markdown/FixWrapper.tsx` | 3 h | **−1,115 KB** |
| 3.2 | Memoise the highlighter wrapper | PERF-07 | `components/markdown/FixWrapper.tsx` | 30 min | runtime |
| 3.3 | Replace `framer-motion` entrance animations with CSS keyframes in the 19 components that only animate on mount | PERF-03 | 19 files | 4 h | **−114 KB** on 14 routes |
| 3.4 | Keep `framer-motion` only where `AnimatePresence` / layout animation is genuinely needed (games, tools, quizzes) | PERF-03 | 6 files | 1 h | route-scoped |
| 3.5 | Resize + convert the team photo to WebP | PERF-04 | `public/team/leandro-alves.png` | 30 min | **−2.47 MB** |
| 3.6 | Move `katex.min.css` to a route-level CSS import | PERF-06 | `components/markdown/MarkdownRenderer.tsx` | 1 h | blocking improved |
| 3.7 | Shrink the search index (drop or compress the `text` field; compact shape) | PERF-05 | `scripts/generate-search-index.mjs` | 3 h | **−200 KB** per locale |
| 3.8 | Add `AbortController` + response validation to the palette fetch | PERF-05 | `components/search/CommandPalette.tsx` | 1 h | robustness |
| 3.9 | Verify the CSP still passes after the new external-request profile | SEC-01 | `scripts/verify_csp.mjs` | 30 min | — |
| 3.10 | Record before/after bundle sizes in the PR | — | — | 30 min | evidence |

**Files touched:** ~25 modified, 1 asset.

**Verification gate**
```
npm run build
node -e "
const m = require('./.next/app-build-manifest.json');
const fs = require('fs');
const route = m.pages['/app/[lang]/courses/[courseSlug]/[lessonSlug]/page'];
const total = route.filter(f=>f.endsWith('.js')||f.endsWith('.css'))
  .reduce((s,f)=>s+fs.statSync('.next/'+f).size,0);
console.log('lesson route:', (total/1024).toFixed(1), 'KB');"
# → must be < 400 KB (from 1,980.6 KB)

ls -la out/en/index.html        # → < 120 KB (from 262 KB)
du -sh public/                   # → < 1.2 MB (from 3.7 MB)
du -sh out/                      # → < 350 MB (from 782 MB)
```

**Risk notes**
- **3.1** — if the per-language modules are imported incorrectly, syntax highlighting silently breaks. The existing markdown tests cover rendering; add a test asserting that each of the 7 supported languages renders with token spans.
- **3.3** — visual parity must be checked. The CSS keyframes should reproduce the existing `framer-motion` entrance (`fade-in` is already defined at `tailwind.config.js:68-70`).
- **3.7** — the search index format change must keep `tests/search/generator.test.ts` and `tests/components/command-palette.test.tsx` passing.

---

### Phase 4 — Accessibility

**Goal:** meet WCAG 2.2 AA on the platform's core learning surfaces.

| # | Task | Finding | Criterion | Files | Est. |
|---|------|---------|-----------|-------|-----:|
| 4.1 | Add a skip-to-content link + `id`/`tabIndex` on `<main>` | A11Y-01 | 2.4.1 (A) | `app/[lang]/layout.tsx`, 3 dictionaries | 1 h |
| 4.2 | Add a global `:focus-visible` baseline; remove every bare `focus:outline-none` | A11Y-05, UX-07 | 2.4.7 (AA) | `app/globals.css`, ~8 components | 1.5 h |
| 4.3 | Add `aria-current="page"` to header and mobile nav links | A11Y-05 | 1.3.1 (A) | `components/layout/Header.tsx` | 45 min |
| 4.4 | Add `role="dialog"`, `aria-modal`, focus trap, focus restoration, `aria-live` result count to the command palette | A11Y-02 | 4.1.2 (A), 2.4.3 (A) | `components/search/CommandPalette.tsx` | 3 h |
| 4.5 | Add `role="status"` / `aria-live="polite"` live regions to quiz + game feedback | A11Y-03 | 4.1.3 (AA) | `ExamRunner.tsx`, `QuizPlayer.tsx`, `ScoreReport.tsx`, 7 game clients | 3 h |
| 4.6 | Add the global `prefers-reduced-motion: reduce` block | A11Y-04 | 2.2.2 (A) | `app/globals.css` | 30 min |
| 4.7 | Register `KeyboardSensor` in all dnd-kit components + add non-drag move up/down controls | UX-11 | 2.1.1 (A) | `MatchingQuestion.tsx`, `FillBlankQuestion.tsx`, `DragOrderQuestion.tsx`, `BucketDropQuestion.tsx` | 3 h |
| 4.8 | Add text alternatives to `SciencePlot`, `MoleculeViewer`, `PhETEmbed` | UX-12 | 1.1.1 (A) | 3 components | 2 h |
| 4.9 | Add `aria-live` to the Formspree error output | A11Y-03 | 4.1.3 (AA) | `components/contacts/Contact.tsx` | 30 min |
| 4.10 | Add a keyboard-accessible "More" dropdown (Escape, arrows, focus management) | UX-11 | 2.1.1 (A) | `components/layout/Header.tsx` | 1.5 h |
| 4.11 | Add an axe-core regression test over key routes | A11Y-01..05 | — | **new** `tests/a11y/axe.test.tsx` | 2 h |

**Files touched:** ~25 modified, 1 new.

**Verification gate**
```
npm test                                        # + axe tests green
npx tsc --noEmit
npm run build
# manual keyboard walkthrough of: /, /courses, a lesson, /quizzes, a quiz, /tools, the ⌘K palette
```

---

### Phase 5 — Modern UX/UI redesign

**Goal:** one design system, a modern responsive shell, and meaningful educational interactions.

#### 5A — Design system foundation

| # | Task | Finding | Files | Est. |
|---|------|---------|-------|-----:|
| 5A.1 | Replace the 20-token layer with the **3-layer token architecture** (primitives → semantic → component) from [06](./06-design-system.md) | UX-01 | `app/globals.css` | 2 h |
| 5A.2 | Convert all **53 hardcoded hex** callout colours to component tokens | UX-01 | `app/globals.css` | 1.5 h |
| 5A.3 | Rewrite `.gradient-bg`, `.text-gradient`, `.glass-effect`, `.btn-primary`, `.btn-secondary` to use tokens | UX-01 | `app/globals.css` | 1 h |
| 5A.4 | **Remove the daisyUI plugin**; replace `table table-zebra` / `bg-base-200` / other daisyUI classes with token-based equivalents | UX-01 | `tailwind.config.js`, `MarkdownRenderer.tsx`, ~15 files | 2 h |
| 5A.5 | Replace `text-gray-700 dark:text-gray-300` etc. with `text-foreground` / `text-muted-foreground` across the codebase | UX-01 | ~40 files | 2 h |
| 5A.6 | Add the typography, spacing, radius, shadow, and motion scales | UX-01 | `app/globals.css`, `tailwind.config.js` | 1.5 h |
| 5A.7 | Add `--measure` / `.prose-measure` / `.prose-wide` and apply the reading measure to lesson prose | UX-04 | `app/globals.css`, `MarkdownRenderer.tsx` | 1 h |
| 5A.8 | Add a CI check that rejects raw hex and hardcoded grey utilities | UX-01 | **new** `scripts/check-design-tokens.mjs` | 1 h |
| 5A.9 | Verify all token contrast pairs meet WCAG AA | A11Y-06 | `app/globals.css` + a test | 1.5 h |

#### 5B — Shell redesign (header, footer, navigation)

| # | Task | Finding | Files | Est. |
|---|------|---------|-------|-----:|
| 5B.1 | Remove the "NEW" badges (or apply to at most one item, static + `aria-hidden`) | UX-03 | `components/layout/Header.tsx` | 20 min |
| 5B.2 | Redesign the header: gradient logo → token-based mark; token colours; `aria-current`; larger tap targets (40px); refined desktop spacing | UX-01, A11Y-05 | `components/layout/Header.tsx` | 2 h |
| 5B.3 | Redesign the mobile menu with a slide-over panel, focus trap, and Escape | UX-11 | `components/layout/Header.tsx` | 2 h |
| 5B.4 | Redesign the footer: 4 → 3 columns, token colours, social link `aria-label`s, privacy/legal links | UX-01 | `components/layout/Footer.tsx` | 1.5 h |
| 5B.5 | Add a "More" dropdown with keyboard navigation | UX-11 | `components/layout/Header.tsx` | 1 h |

#### 5C — Educational experience

| # | Task | Finding | Files | Est. |
|---|------|---------|-------|-----:|
| 5C.1 | Redesign the hero with a single dominant primary CTA and a clearer type hierarchy | UX-05 | `components/home/Hero.tsx` | 2 h |
| 5C.2 | Add the staggered list entrance (CSS-only, `--i` custom property) to the course/tool/game grids | UX-10 | 3-4 grid components | 1.5 h |
| 5C.3 | Add a **roadmap strip** to the home page | UX-06 | `components/home/` | 2 h |
| 5C.4 | Link courses → the roadmap steps that include them | UX-06 | `lib/roadmaps/resolve-content-url.ts`, course pages | 2 h |
| 5C.5 | Add a "Continue learning" card on the course catalogue when roadmap progress exists | UX-06 | `app/[lang]/courses/courses-client.tsx` | 1.5 h |
| 5C.6 | Design the shared `<EmptyState>` and apply it to the library + course filters; disable zero-result chips | UX-08 | `components/ui/EmptyState.tsx`, `library-client.tsx`, `courses-client.tsx` | 2.5 h |
| 5C.7 | Improve the library empty/filtered state; show counts; add a "resources in other languages" link for `en` | UX-02 | `app/[lang]/library/library-client.tsx` | 2 h |
| 5C.8 | Replace the `scale-105` hover transforms with `translateY` | UX-09 | `app/globals.css` + consumers | 1 h |
| 5C.9 | Redesign the certificate card with a proper token-based layout | UX-01 | `components/quizzes/CertificateCard.tsx` | 1.5 h |
| 5C.10 | Redesign the quiz score report with token-based stat tiles | UX-01 | `components/quizzes/ScoreReport.tsx` | 2 h |

**Files touched:** ~60 modified, ~8 new.

**Verification gate**
```
node scripts/check-design-tokens.mjs     # 0 raw hex, 0 hardcoded grey utilities
npm test
npm run build
# visual QA: light + dark, 375 / 768 / 1024 / 1440 px, all 27 routes
```

---

### Phase 6 — Enhancements (SEO, content, CI, polish)

| # | Task | Finding | Files | Est. |
|---|------|---------|-------|-----:|
| 6.1 | Build a shared `alternates` helper; add per-page canonical + **hreflang** to all 27 pages | ARCH-05 | **new** `lib/seo/alternates.ts`, 27 pages | 4 h |
| 6.2 | Remove `fixCanonicals()` from `scripts/postbuild.mjs` | ARCH-05 | `scripts/postbuild.mjs` | 30 min |
| 6.3 | Add `Course` + `LearningResource` JSON-LD to course and lesson pages | ARCH-10 | `app/[lang]/courses/**` | 3 h |
| 6.4 | Add `BreadcrumbList` JSON-LD (marking up the existing breadcrumb UI) | ARCH-10 | lesson + course pages | 1.5 h |
| 6.5 | Add `Quiz` JSON-LD to the quiz pages | ARCH-10 | `app/[lang]/quizzes/**` | 1 h |
| 6.6 | Fill the empty `sameAs` array; add `ContactPoint` details | ARCH-10 | `app/[lang]/layout.tsx` | 20 min |
| 6.7 | Add `app/robots.ts` with proper per-locale rules; keep `public/robots.txt` in sync | ARCH-10 | **new** `app/robots.ts` | 45 min |
| 6.8 | Add `openGraph`/`twitter` to the 20 pages that lack them | ARCH-10 | 20 pages | 2 h |
| 6.9 | Make `metadataBase` respect `basePath` | ARCH-10 | `app/[lang]/layout.tsx` | 15 min |
| 6.10 | Add loader unit tests (courses, quizzes, tools, languages, library) | ARCH-09 | **new** `tests/lib/*` | 6 h |
| 6.11 | Add `coverage.thresholds` enforcement to CI (already in Phase 0) | ARCH-09 | `.github/workflows/nextjs.yml` | 15 min |
| 6.12 | Upgrade `katex` → `^0.19` | SEC-11 | `package.json` | 30 min |
| 6.13 | Upgrade `vitest` → `^5` | SEC-11 | `package.json`, `vitest.config.ts` | 1 h |
| 6.14 | Upgrade `next` → `^15` (or `^16`), with a full export verification | SEC-11 | `package.json`, `next.config.js`, migration | 1 day |
| 6.15 | Add a `gitleaks` pre-commit hook | SEC-06 | `.pre-commit-config.yaml` | 30 min |
| 6.16 | Fix the one `http://` library link | SEC-13 | `content/library/{pt,es}/course/efisica-usp.md` | 10 min |
| 6.17 | Verify the `ads.txt` publisher relationship is intentional | SEC-13 | `public/ads.txt` | 5 min |

---

## 3. Dependency graph

```
Phase 0  ──► Phase 1  ──► Phase 2  ──► Phase 3  ──► Phase 4  ──► Phase 5  ──► Phase 6
  CI        storage      boundaries    bundle      a11y        design      SEO
  gates     CSP          dedup         shrink      focus       system     content
            cookies      dictionary    images      live        tokens     deps
            form         not-found     motion      regions     components
            embeds       splits        search      keyboard    IA/UX
```

**Parallelisable tracks** (after Phase 1 lands):
- **Track A** — Phase 2.4→2.10 (architecture) ‖ Phase 3.1, 3.3, 3.5 (bundle) ‖ Phase 4 (a11y)
- **Track B** — Phase 5A (tokens) ‖ Phase 6.1→6.9 (SEO) ‖ Phase 6.10 (tests)

---

## 4. Effort summary

| Phase | Scope | Est. hours | Est. days (1 dev) |
|-------|-------|-----------:|------------------:|
| 0 | Baseline hardening | 4 | 0.5 |
| 1 | Critical & High security | 17 | 2 |
| 2 | Architecture | 22 | 3 |
| 3 | Performance | 17 | 2 |
| 4 | Accessibility | 19 | 2.5 |
| 5 | UX/UI redesign | 43 | 5 |
| 6 | Enhancements | 26 | 3 |
| **Total** | | **148** | **~18 days** |

**Plus 20% contingency for the dictionary split (2.11), the Next major upgrade (6.14), and visual-regression surprises in Phase 5** → **~22 days**.

---

## 5. Expected outcomes

### 5.1 Metrics

| Metric | Baseline | Target | Finding |
|--------|---------:|-------:|---------|
| Lesson route JS | 1,980.6 KB | **< 400 KB** | PERF-01, PERF-03, ARCH-03 |
| `out/en/index.html` | 262 KB | **< 120 KB** | PERF-02 |
| `out/en/courses/index.html` | 324 KB | **< 150 KB** | PERF-02 |
| `out/` total | 782 MB | **< 350 MB** | PERF-02 |
| `public/` total | 3.7 MB | **< 1.2 MB** | PERF-04 |
| Search index per locale | 330–412 KB | **< 150 KB** | PERF-05 |
| Shared layout chunk | 113.7 KB | **~0 KB** | PERF-03 |
| Colour systems | 4 | **1** | UX-01 |
| Raw hex in `globals.css` | 53 | **0** | UX-01 |
| Hardcoded grey utilities | ~40 files | **0** | UX-01 |
| Storage-helper copies | 5 + 6 raw | **1** | ARCH-01 |
| Duplicated UI patterns | ~250 lines | **< 50** | ARCH-11 |
| Client components > 300 lines | 24 | **< 12** | ARCH-02 |
| Routes with a not-found boundary | 0 / 27 | **27 / 27** | ARCH-04 |
| npm advisories | 25 | **< 5** (build/dev only) | SEC-11 |
| Confirmed security findings open | 10 | **0** | SEC-01..13 |
| Lesson prose line length | ~110 ch | **≤ 70 ch** | UX-04 |
| Skip link / aria-current / focus trap | absent | **present** | A11Y-01..02 |

### 5.2 Cumulative effect

A learner opening a lesson currently downloads **1.98 MB of JS + 262 KB of HTML**. After the plan: **~380 KB of JS + ~100 KB of HTML** — a **~78% reduction** in transferred bytes, with **no loss of functionality**, a **hardened** security posture, a **coherent** design system, and **WCAG 2.2 AA** coverage on the core learning surfaces.

---

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|:----------:|:------:|------------|
| The dictionary split (2.11) breaks a page's translations | Medium | High | Generate namespace files from the existing source; the parity test gates the change; visual QA of all 27 routes × 3 locales |
| Removing daisyUI breaks an unlocated component | Medium | Medium | `grep -rn "daisyui\|btn-\|badge-\|modal\|tooltip\|stats\|table-zebra\|base-200\|base-100" app components` before starting; visual QA |
| The Next.js major upgrade (6.14) changes build behaviour | Medium | High | Land in isolation; verify the route count and sitemap before/after; keep `14.2.33` in `package-lock.json` until verified |
| The CSP meta blocks a required inline script | Medium | Medium | `scripts/verify_csp.mjs` scans `out/**/*.html`; deploy to a branch preview first; keep a documented fallback to `'unsafe-inline'` |
| Replacing `framer-motion` changes the visual feel | Low | Low | CSS keyframes reproduce the existing motion; visual comparison on the 6 affected surfaces |
| The dnd-kit keyboard support changes drag behaviour | Medium | Medium | Feature-flag the non-drag controls; keep the pointer path untouched; test with a screen reader |
| The content-team workflow breaks with the new dictionary format | Medium | Low | The `course-writer` skill writes Markdown only, not dictionaries — no impact; document the new format in `docs/features/INTERNATIONALIZATION.md` |
| Scope creep in Phase 5 | High | Medium | Phase 5 is split into 5A/5B/5C; each ships independently; 5A alone delivers most of the value |

---

## 7. Definition of Done

Every phase is complete when:

- [ ] `npm test` passes with **no regression** (and new tests added for the change)
- [ ] `npm run lint` → 0 errors
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` succeeds; `out/` is complete
- [ ] The prerendered route count is **≥ the pre-change baseline**
- [ ] `out/sitemap.xml` still contains **≥ 1,600** URLs
- [ ] No new raw hex or hardcoded grey utilities (Phase 5 onward)
- [ ] `prefers-reduced-motion` and keyboard navigation verified
- [ ] Light + dark mode verified on all touched routes
- [ ] Responsive verified at 375 / 768 / 1024 / 1440 px
- [ ] `scripts/verify_out.mjs` and `scripts/verify_csp.mjs` pass
- [ ] The relevant `docs/` page is updated
- [ ] Before/after metrics are recorded in the PR description

---

## 8. Appendix — Finding → task mapping

| Finding | Phase | Tasks |
|---------|:-----:|-------|
| SEC-01 | 1 | 1.11, 1.12, 3.9, 6.14 (hosting migration) |
| SEC-02 | 1 | 1.3, 1.15 |
| SEC-03 | 1 | 1.10 |
| SEC-04 | 1 | 1.1, 1.6 |
| SEC-05 | 1 | 1.1, 1.7, 1.8 |
| SEC-06 | 6 | 6.15 |
| SEC-07 | 1 | 1.9 |
| SEC-08 | 1 | 1.13, 1.14 |
| SEC-09 | 1 | 1.13 |
| SEC-11 | 6 | 6.12, 6.13, 6.14 |
| SEC-12 | 0 | 0.1–0.6 |
| SEC-13 | 1, 6 | 1.11, 1.15, 6.16, 6.17 |
| PERF-01 | 3 | 3.1 |
| PERF-02 | 2, 3 | 2.11, 2.12 |
| PERF-03 | 3 | 3.3, 3.4 |
| PERF-04 | 3 | 3.5 |
| PERF-05 | 3 | 3.7, 3.8 |
| PERF-06 | 3 | 3.6 |
| PERF-07 | 3 | 3.2 |
| PERF-08 | 3 | (via 2.11, 3.1) |
| ARCH-01 | 1, 2 | 1.1–1.7, 0.7 |
| ARCH-02 | 2 | 2.4, 2.13, 2.14 |
| ARCH-03 | 2 | 2.5 |
| ARCH-04 | 2 | 2.1, 2.2, 2.3 |
| ARCH-05 | 6 | 6.1, 6.2 |
| ARCH-06 | 0 | 0.9 |
| ARCH-07 | 2 | 2.8 |
| ARCH-08 | 2 | 2.11, 2.12 |
| ARCH-09 | 6 | 6.10, 6.11 |
| ARCH-10 | 6 | 6.3–6.9 |
| ARCH-11 | 2 | 2.6, 2.7 |
| A11Y-01 | 4 | 4.1 |
| A11Y-02 | 4 | 4.4 |
| A11Y-03 | 4 | 4.5, 4.9 |
| A11Y-04 | 4 | 4.6 |
| A11Y-05 | 4, 5 | 4.2, 4.3, 5B.2 |
| A11Y-06 | 5 | 5A.9 |
| UX-01 | 5 | 5A.1–5A.9, 5B, 5C.9, 5C.10 |
| UX-02 | 5 | 5C.7 |
| UX-03 | 5 | 5B.1 |
| UX-04 | 5 | 5A.7 |
| UX-05 | 5 | 5C.1 |
| UX-06 | 5 | 5C.3, 5C.4, 5C.5 |
| UX-07 | 4 | 4.2 |
| UX-08 | 5 | 5C.6 |
| UX-09 | 5 | 5C.8 |
| UX-10 | 5 | 5A.6, 5C.2 |
| UX-11 | 4 | 4.7, 4.10 |
| UX-12 | 4 | 4.8 |

**Every finding maps to at least one task. Every task maps to at least one finding.** No orphans.
