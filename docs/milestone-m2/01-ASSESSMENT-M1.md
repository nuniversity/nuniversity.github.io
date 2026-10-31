# M1 Deep Assessment — the current solution (as-is, 2026-10-31)

> Object of this assessment: the deployed static platform on GitHub Pages, its content
> factory, and everything that stands between it and the agentic-AI education vision.
> Companion: [02-TARGET-ARCHITECTURE.md](./02-TARGET-ARCHITECTURE.md) answers *what we do about it*.

---

## Table of contents
1. [Executive verdict](#1-executive-verdict)
2. [Asset inventory (verified counts)](#2-asset-inventory-verified-counts)
3. [Technical stack detail](#3-technical-stack-detail)
4. [Learning engine inventory](#4-learning-engine-inventory)
5. [The agentic content pipeline (the differentiator)](#5-the-agentic-content-pipeline-the-differentiator)
6. [Security & quality posture](#6-security--quality-posture)
7. [Payload & deployment reality](#7-payload--deployment-reality)
8. [Debt register (from completed audits, status-checked)](#8-debt-register)
9. [Fundamental limitations vs the vision (L1–L7)](#9-fundamental-limitations-l1l7)
10. [What must be preserved verbatim in any redesign](#10-what-must-be-preserved)
11. [Conclusion → M2 mandate](#11-conclusion--m2-mandate)

---

## 1. Executive verdict

**The M1 platform is unusually good at exactly three things, and structurally incapable of exactly three things.**

Good at:
1. **Content at scale, quality-gated** — 49 courses / 1,299 lessons produced and validated by a deterministic agentic harness with Python-validated schemas, twice enforced (pre-commit hooks + CI pytest).
2. **Client-side learning mechanics** — a real FSRS spaced-repetition engine, Beta-posterior mastery, blueprint-driven exam sampling, gamification event bus, all tested.
3. **Zero-cost, secure static delivery** — CSP on all 1,633 pages (meta-tag form), no secrets, no trackers, audit gates (gitleaks/bandit/audit), i18n done properly with URL locales and EN fallback.

Incapable of (the vision's requirements):
1. **Any user identity** — "teach *each* learner" requires a longitudinal learner model; today every trace a learner produces dies in that browser's `localStorage`.
2. **Any runtime AI** — "agents research and generate on demand" requires compute at request time; today all AI work happens at authoring time, gated by a human git commit (days, not seconds).
3. **Any dynamic content surface** — adding one new course forces a full export of 3,457 files (~772 MB measured), heading toward the GitHub Pages 1 GB limit and multi-minute rebuilds.

**Verdict: M2 must add a dynamic plane (identity + state + runtime retrieval/generation) while freezing the static plane's architecture — not redesigning it.** The wrong move would be to convert the site into an app-platform first and rewrite the learning engine; the audits show those layers are the strongest part of the codebase.

---

## 2. Asset inventory (verified counts)

| Asset | Volume | Location | Notes |
|---|---|---|---|
| Courses | **49** | `content/courses/{slug}/course.json` + `{slug}/{en,es,pt}/NN-*.md` | Mostly SE (14), AI (7), Data (4), SQL (3), Rust (3), Python (3), LangGraph (3), Data Eng (3), Spark (3) |
| Lessons | **1,299** markdown files (en 436 / pt 456 / es 406) | `content/courses/**` | YAML frontmatter: title, order, difficulty, duration, skills |
| Quiz banks | **4** (~1.7 MB total) | `content/quizzes/*.json` | AWS AIF-C01, CLF-C02, DEA-C01, Snowflake C03; blueprint with subdomain allocation |
| Games | **7** | `content/games/{coding,logic,math,conversation,physics,puzzles}/*.json` | schema-validated (`validate-game-json` hook) |
| Roadmaps | **2** | `content/roadmaps/{slug}/{en,es,pt}.md` | prerequisite graph + `contentRef` links into courses |
| Tools | **10** | `content/tools/{slug}/{lang}.md` + `components/tools/*` | Matrix pack, prompt builder, flashcards, pomodoro … |
| Language activities | **5 pairs** + 1 mini course | `content/languages/vocabulary/*.json`, `content/language-courses/english-for-pt/` | vocab index shipped to `public/vocab-index/` |
| Library resources | **118** (en ≈ 10, pt 50, es 58) | `content/library/*` | **Known gap: EN library nearly empty** |
| UI dictionaries | 3 × ~80 KB | `dictionaries/{en,pt,es}.json` | one blob per page (see PERF-02) |
| Build indexes | search 1.3 MB, questions 5.7 MB, vocab 80 KB | `public/search-index|question-index|vocab-index` | generated at prebuild |
| Static output | **3,457 files / 772 MB** | `out/` (measured 2026-10) | GH Pages hard ceiling 1 GB, soft target 900 MB in CI check |

---

## 3. Technical stack detail

| Layer | Technology | Version | Health notes |
|---|---|---|---|
| Framework | Next.js (App Router) | **15.5** (`^15.5.28`) | Docs refreshed in the 2026-10-31 cleanup (were still saying Next 14) |
| Runtime | React | **19.3** | Fine; deps aligned |
| Language | TypeScript | 5.3 | Separate `tsconfig.e2e.json` |
| Styling | Tailwind **v3.4** + typography | daisyUI **removed** in Phase-5 redesign | 3-layer token system in `app/globals.css`; `verify-css` gate enforces token usage |
| Markdown | react-markdown + remark-gfm/math + rehype-raw/sanitize + KaTeX | — | `MarkdownRenderer.tsx` grown to **1,268 lines** (was 679 at audit) — needs the advertised registry split |
| Highlight | react-syntax-highlighter (PrismLight) | — | PERF-01 partially fixed: 1,980→1,294 KB route JS, dead grammars dropped |
| Visualization | recharts 3, Mermaid 11 (lazy), 3dmol | — | Mermaid lazy-loading is a working pattern to replicate for KaTeX |
| SRS | **ts-fsrs 4.5.0 (pinned)** | sole importer `lib/practice/fsrs.ts` | keep pinned; engine is correctness-critical |
| Drag&Drop | @dnd-kit core/sortable/utilities | — | bundled into oversized components (ARCH-02 family) |
| Forms | @formspree/react | — | only third-party runtime dependency of the site |
| Test | Vitest 4 (+coverage-v8), Testing Library, Playwright 1.64 | 1,209 vitest / 566 pytest | artifact/e2e config split; Playwright CI currently **disabled**, runs locally |
| Tooling | ESLint 8 + security plugins, husky + lint-staged, gitleaks, bandit, dependabot | — | strong pre-commit hygiene |
| Node | engines `>=22 <23`, Node 22 in CI | — | matches `.node-version` 22 |
| Deploy | **GitHub Pages** | single workflow `.github/workflows/nextjs.yml` | build = provenance+audit gates → typecheck → lint → vitest+coverage → pytest → validate:courses → `npm run build` (full chain incl. CSP injection) → size gate → deploy-pages |

**Static export settings that define the platform's ceiling** (`next.config.js`): `output:'export'` in prod, `trailingSlash:true`, `images.unoptimized`, locale redirect for production served by a static stub in `public/index.html` + postbuild 404 stub (production middleware deleted per ARCH-06).

---

## 4. Learning engine inventory

| Capability | Implementation | State |
|---|---|---|
| Spaced repetition | `lib/practice/fsrs.ts` (ts-fsrs 4.5.0), cards in `lib/practice/cards.ts`, page `app/[lang]/review/page.tsx` + `components/review/ReviewClient.tsx` | Working; card store capped in localStorage |
| Mastery model | Beta posterior per answer node — `lib/practice/record.ts`, types in `lib/practice/types.ts` (learner-model schema **v2**, localStorage only) | Working; needs sync contract (v3) |
| Exam engine | blueprint allocation (largest-remainder, proportional domains) — `lib/quizzes/draw.ts`; grading `lib/quizzes/grade.ts`; `ExamRunner` (449 L), `ScoreReport` (575 L) | Working |
| Gamification | event bus + XP profiles — `lib/gamification/{bus,profile,types}.ts`, award toasters | Working |
| Practice generation | lesson-question pipeline — `scripts/convert-prose-questions.mjs`, `export-quiz-bank.mjs`, `lib/markdown/exam-questions.ts` | Working |
| Search | build-time index (`scripts/generate-search-index.mjs`, `build-question-index.mjs`, `build-vocab-index.mjs`) + client matcher `lib/search/matcher.ts` + `CommandPalette.tsx` (⌘K) | Working; 5.7 MB payload problem (PERF family) |
| Runtime personalization | **does not exist** — nothing beyond per-browser counters | The M1→M2 bridge: diagnostics, style profile, teacher planner are all greenfield |

**Persistence surface (all client-only):** `lib/storage/safe-storage.ts` centralizes ~20 `v1:*` namespaced keys (course progress, review cards, XP log, quiz bests/history, roadmap progress, game bests, language-course progress, profile…). Schema validators + corrupt-key purge already exist — the sync layer can reuse them verbatim as the offline-cache contract.

---

## 5. The agentic content pipeline (the differentiator)

Documented in `docs/ai/AGENTS.md` + `docs/ai/OPENCODE-HARNESS.md`; operational in `.opencode/`.

| Element | Detail |
|---|---|
| Skills | `course-writer`, `quiz-writer` (bootstrap → quota grid → dedup → merge), `game-builder`, `i18n-translator`, `platform-engineer`, `mermaid-js`, `tailwind-css`, test/ci skills |
| Validator hooks | one Python validator per content type — `validate-course-json`, `validate-frontmatter`, `validate-game-json`, `validate-quiz-json`, `validate-roadmap`, `validate-tools`, `validate-library`, `validate-languages`, `check-i18n-parity`, `guard-env-read` — each with JSON schema references |
| Double enforcement | hooks gate agent output **and** CI re-runs them via pytest (`tests/test_opencode_*.py`) |
| Design principles | 6 mandatory (TDD ≥90% coverage, DDD, Clean Architecture, SOLID, Clean Code, SDD); LLM config guidance (temp 0.2–0.5) |

**Assessment:** this is the single most valuable asset in the repo. M2 must extend it (runtime generation mode + promotion loop), never bypass it.

---

## 6. Security & quality posture

| Control | State |
|---|---|
| CSP | meta-tag injected on **1,633/1,633** pages by `scripts/postbuild.mjs` + `verify-csp.mjs` gate — *meta-CSP weaknesses (certain directives ignored) are a real but bounded gap* |
| Embed allowlists | PhET (`PhETEmbed.tsx`), RCSB PDB fetch (`MoleculeViewer.tsx`, 8 MB cap) — sandboxed iframe where possible |
| Secrets | **zero** in repo; contact form ID via env var; gitleaks + bandit + lockfile audit in CI |
| Cookies | only `NEXT_LOCALE` — SameSite=Lax/Secure |
| A11y | Phase-4 of the audit: skip link, aria-current, focus trap, reduced motion, axe in Playwright |
| SEO | canonical + hreflang on 1,630 pages; JSON-LD (Course/LearningResource/Quiz/BreadcrumbList); new `lib/seo/*` |
| Error boundaries | `app/[lang]/error.tsx`, `not-found.tsx` exist |
| Known gap | browser e2e suite disabled in CI (commented out) — pre-commit-only |

---

## 7. Payload & deployment reality

| Metric | Value | Consequence |
|---|---|---|
| Export size | 3,457 files / **772 MB** | CI gates at 900 MB warn / 1,000 MB fail: ~23% headroom left |
| Lesson route JS | ~1.3 MB (from 1.98 MB post-PERF-01) | better, still heavy for 3G-mobile India/SA learners |
| Dictionaries | 78.6–85.1 KB **on every page** (PERF-02, unresolved) | highest-value perf fix remaining |
| Question index | **5.7 MB** in `public/` | shipped to all users only when needed — should move to packs |
| Build time | > 5 min locally; CI 6–9 min | linear in content; scales as O(courses) on every edit |
| Rebuild trigger | any content change rebuilds **everything** | incompatible with on-demand/agent-authored content (L3 below) |
| Platform constraints | no real HTTP headers (Pages), no `_redirects`, 1 GB cap, org-level policy dependency | real headers strictly better for a product with sessions |

---

## 8. Debt register

Consolidated from the 2026-10-26 full audit and its implementation plan (`08-implementation-plan.md`), status-check against the current tree:

| ID | Debt | Status (2026-10-31) | M2 disposition |
|---|---|---|---|
| PERF-01 | Dead Prism grammars / route weight | **Partially landed** (1,980→1,294 KB) | Finish in P1 (lazy KaTeX, renderer split) |
| PERF-02 | 78–85 KB dictionary blob per page | **Open** | **P1 — top item** |
| ARCH-01 | Duplicated storage helpers (5 copies) | **Fixed** (`lib/storage/safe-storage.ts`) | none |
| ARCH-02 | 24 client components > 300 L; mismatched plugin pack | **Open**; `MarkdownRenderer.tsx` grew 679→1,268 L | P1 registry + code-split |
| SEC-06 family | secrets/tracking | clean | keep clean; new Worker secrets follow `08-RUNBOOK.md` inventory |
| A11y-01 | contrast/labels | **Landed** | none; keep axe in CI when Playwright enabled |
| SEO gaps | canonical/hreflang/JSON-LD | **Landed** (1,630 pages) | extend JSON-LD to pack-derived pages later |
| Stale docs | ARCHITECTURE.md/TESTING/GETTING-STARTED said Next 14/daisyUI/middleware | **Resolved 2026-10-31** (docs cleanup + refresh) | — |
| e2e in CI disabled | Playwright local-only | **Open** | P2 (new API e2e stage) + P6 (re-enable) |
| EN library nearly empty (en 10 vs pt 50/es 58) | content debt | **Open** | registered as content-work topic, not M2-blocking |

---

## 9. Fundamental limitations (L1–L7)

Each limitation is stated as: **observation → why it blocks the vision → design pressure it creates for M2.**

### L1 — No identity, no server-owned state
All learner data lives in browser `localStorage` (`v1:*` keys). Clearing storage, a new device, or a second browser resets the learner.
*Blocks:* longitudinal learner modeling; adaptive teaching; retention. 
*Pressure:* identity must be **optional and anonymous-first** (no signup wall); sync must be deterministic and offline-tolerant; localStorage remains the offline cache (contract `04-CONTRACT.md §1`).

### L2 — No runtime compute; AI exists only at authoring time
Every AI capability requires a git cycle (agent writes → validators → commit → CI build → deploy). "On-demand" generation is structurally impossible; the paper pipeline is hours at best.
*Blocks:* on-demand research/generation; question answering; adaptive content assembly.
*Pressure:* an edge runtime with tight budget control, moderation, caching, and a **retrieval-first** rule (LLM calls are the exception, not the default).

### L3 — Content changes require full site rebuild
1,299 lessons → every content PR re-renders 1,633+ pages (3,457 files / 772 MB). This scales linearly and is already ±23% from the Pages ceiling.
*Blocks:* agent-authored content velocity; freshness; ecosystem growth.
*Pressure:* decouple **data packs** (R2, hash-addressed, replaceable in minutes) from **HTML shell** (Pages, changes only when code changes).

### L4 — GitHub Pages platform constraints
No custom HTTP headers (CSP only via `<meta>`; several directives inert there), no redirects, 1 GB limit, and org-level Pages dependency.
*Pressure:* a host that supports real headers + same-origin functions; **dual deploy** so the migration is reversible (DR-05).

### L5 — Build-time-only retrieval at weight cost
The 5.7 MB `question-index` and per-page dictionary blobs implement "intelligence" by shipping data to browsers indiscriminately.
*Pressure:* runtime semantic retrieval (RAG over own content) replaces bulk payload; packs + embeddings shards are fetched on demand, hashed, and cached.

### L6 — Learning logic has no server contract
Learner model schema v2 lives privately in `lib/practice/types.ts`; nothing outside a single browser session can extend it.
*Pressure:* learner state v3 as a shared, versioned contract (`packages/shared`) with explicit merge rules — the personalization engine's substrate.

### L7 — Zero observability of learners and platform
No analytics, no error telemetry, no usage signals — content investment decisions are blind.
*Pressure:* privacy-first analytics (CF Web Analytics + own D1 product events), consent-free (no cookies required), plus structured Worker logs.

---

## 10. What must be preserved

| Preserve | Why | How protected |
|---|---|---|
| Static-first consumption (Pages/CSS/MD, no login for reading) | cost, SEO, reach (low-bandwidth markets) | Invariant #1; dynamic layer is additive |
| Agentic harness + per-type validators | the platform's quality moat | DR-08; promotion loop routes **through** it |
| Learning engine primitives (FSRS, Beta mastery, blueprint draw) | correctness-critical, tested | reused by teacher planner; v3 extension only |
| i18n tri-locale model, `[lang]` URLs, EN fallback | SEO and resilience | untouched by M2 infra work |
| Safe-storage utilities | already validated for schema + corruption | reused as the offline queue contract |
| CI/quality battery | regression shield | P2 extends it to workers; P6 re-enables e2e |

---

## 11. Conclusion → M2 mandate

The assessment converges on a narrow, surgical mandate:

> **Do not rewrite the university. Build the campus network around it.**

1. Keep the static plane exactly as it is (P1 performance debt only).
2. Add identity + sync (P3) → the learner model becomes real.
3. Add packs + retrieval (P4) → content becomes dynamic without rebuilds.
4. Add budgeted generation + teacher v1 (P5) → the "agentic" part becomes real, safely.
5. Harden, observe, and document (P6) → M1 behavior is the floor, never below it.

Sequencing rationale and full task breakdown: [05-IMPLEMENTATION-PLAN.md](./05-IMPLEMENTATION-PLAN.md).
