# Deep Assessment — Solution Harness

The harness = build/CI/test/lint pipelines, content-ops tooling (skills, scripts,
hooks), the Python package scaffold, config quality and the docs that describe them.

---

## 1. CI (`.github/workflows/nextjs.yml` — the only workflow)

### 1.1 Current pipeline (single build job + deploy job)

1. Checkout → detect package manager → `npm ci` (`:37-53,77-78`)
2. Node **"20"** setup (`:54-58`) while env forces `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` (`:28`)
3. `actions/configure-pages` + cache (`:59-76`)
4. **Validate course content (course-writer skill)** (`:79-113`): loops 26 hardcoded
   `course:locale` entries → `validate_course.py` (fails only on exit 2), then per-lesson
   `validate_lesson.py` (exit 0 required) — **except** a 10-course legacy list
   (`processes-flowchart … agentic-ai-development`) which is routed through
   `check_locale_course.py --legacy` (validate-error subset parity + verify + quality
   gates at rc 0). This legacy routing was added during the 2026 i18n program because
   legacy ES lessons mirror EN sources that intentionally fail `validate_lesson`
   (verified: raw `validate_lesson` on `processes-flowchart/es/01-what-are-processes.md`
   → rc 2; `check_locale_course --legacy` → rc 0).
5. `npx --no-install vitest run` (`:114-115`) → **0 test files**, passes via
   `passWithNoTests: true` (`vitest.config.ts:11`)
6. `npx next build` (`:116-117`) → **TS errors and ESLint both ignored**
7. Upload `./out` → deploy (`:118-133`)

Local simulation of stage 4 with the exact CI logic: **26/26 entries pass**, YAML valid.

### 1.2 Gaps

| Gap | Detail |
|---|---|
| No lint step | `npm run lint` exists (`package.json:9`) but CI never runs it; builds ignore lint anyway |
| No type gate | `typescript.ignoreBuildErrors: true` (`next.config.js:18-20`) |
| No Python tests | root `tests/` + 16 skill test files never run in CI |
| Partial course gating | **26 of 49** course dirs gated (opencode-*, python-*, rust-*, spark-*, sql-*, langgraph-*, etc. not gated) |
| No content-ops for non-course content | no validation of games JSON, library md, roadmaps, tools, dictionaries in CI (parity hook is editor-only) |
| No PR trigger | only `push: main` + `workflow_dispatch` (`:7-13`) |
| Node three-way mismatch | `.node-version` = `v22.20.0` vs workflow `"20"` vs action env Node 24 |
| Simulator drift | `cicd-pipeline/run_pipeline.py` simulates only install/tests/build — no content stage |

---

## 2. Python harness (`pyproject.toml`, `src/`, `tests/`)

| Item | State | Ref |
|---|---|---|
| Package metadata | `name = "nuniversity-harness"` “Deterministic AI agentic harness”, deps pyyaml+jsonschema | `pyproject.toml:1-9` |
| **Actual source** | **NONE** — `src/` holds only `nuniversity_harness.egg-info/` (5 files **committed to git**) + `src/test-setup.ts` (TS). `top_level.txt` is a lone newline; no `[build-system]` exists | `src/nuniversity_harness.egg-info/*` |
| Coverage config | `source = ["scripts","hooks"]` — **neither dir exists**; `fail_under = 90` | `pyproject.toml:54-60` |
| `.coverage` | SQLite coverage DB **committed** despite `.gitignore:22-23` | repo root |
| pytest availability | **not installed** in `.venv/bin`; system python has no pytest module | `.venv/bin` |
| `tests/test_opencode_courses.py` | passes as a plain script (462/462 checks, exit 0) but is **not pytest-collectable**: `test_*` functions take non-fixture params `(course_dir, result)` (`:63,121,229`), no conftest, `TestResult` class breaks collection | `tests/` |
| Coverage scope | validates only 3 of 49 courses (`opencode-*`) | `:28-32` |
| pre-commit | ruff + ruff-format + bandit + `uv run pytest` (`types:[python]`) — **would fail** (pytest absent, collection broken); never installed/run in CI | `.pre-commit-config.yaml:9-23` |
| Skill test suites | 16 files under `.opencode/skills/*/tests/` excluded by `testpaths = ["tests"]` and run by nothing | `pyproject.toml:47` |

---

## 3. JS/TS tests

- `vitest.config.ts`: jsdom, `@` alias, v8 coverage, excludes `.opencode`,
  `passWithNoTests: true` (`:11`).
- **Zero `*.test.ts(x)` files exist** outside `node_modules`/`.opencode` → `npm test`,
  CI stage 5, and the pre-commit `vitest related --run` hook are all vacuous.
- Husky: `.husky/pre-commit` → `npx lint-staged` → on `*.{ts,tsx}` runs
  `vitest related --run` (always empty) + `eslint --fix`. **No hooks for `.md`/`.json`** —
  content lands at commit time unvalidated.
- Doc drift: `docs/operations/TESTING.md:12` claims “13 initial tests … all passing” and
  a ~246-test plan; `docs/INDEX.md` repeats it. Reality: 0.

---

## 4. Content-ops tooling map (`.opencode/skills/*/scripts`)

| Script | Purpose | CI? |
|---|---|---|
| course-writer `validate_course.py` | course.json + dir structure (exit 0/1/2) | ✅ |
| course-writer `validate_lesson.py` | lesson frontmatter/body/questions/takeaways/fences/JSON | ✅ |
| course-writer `generate_lesson.py` | template generator | manual |
| i18n-translator `verify_translation.py` | EN↔target structural parity | via check_locale_course |
| i18n-translator `quality_lint.py` | 18 quality rules | via check_locale_course only |
| i18n-translator `check_locale_course.py` | course-level locale gates; `--legacy` subset mode | ✅ |
| cicd-pipeline `run_pipeline.py` | local CI simulator (3 stages only) | manual |
| mermaid-js `validate_mermaid.py` | diagram syntax | ❌ |
| tailwind-css `validate_tailwind.py` | class usage (non-blocking) | ❌ |
| pytest/vitest/skill-builder runners | various | ❌ |
| platform-engineer | prompt-only (states “No `any`” — unenforced) | — |
| game-builder | prompt-only, **no validator** | — |

### Hooks (editor-time, not CI)

| Hook | Blocking? | Problem |
|---|---|---|
| check-i18n-parity (dict writes) | no | never in CI/pre-commit |
| guard-env-read | yes | good |
| validate-course-json / validate-frontmatter | yes | course-only |
| validate-game-json | yes | **`VALID_CATEGORIES = {"quiz","vocabulary"}` only** (`validate_game_json.py:22`) — 6 of 8 game categories (coding, conversation, logic, math, physics, puzzles) unvalidated |

### Unvalidated content types (no script at all)

`content/library/**`, `content/roadmaps/**`, `content/tools/**`, `content/games` for 6
categories, and the new apps planned in this review (quizzes, languages).

---

## 5. Config quality

| Defect | Ref |
|---|---|
| `strict:false`, `noImplicitAny:false`, `strictNullChecks:false` | `tsconfig.json:16-18` |
| `ignoreBuildErrors` + `ignoreDuringBuilds` | `next.config.js:18-23` |
| 72 `any`s across 31 files (masked by the above) | app/components/lib |
| ESLint never enforced; `eslint-config-next 14.0.4` vs `next ^14.2.33` | `package.json:64-65` |
| Next 14 while ecosystem is on 16.x (Oct 2026) — 2 majors behind; security advisories apply to upstream | `package.json:36` |
| Unused deps (import-verified): `axios`, `monaco-editor`, `@monaco-editor/react`, `react-youtube`, `react-hook-form`, `clsx`, `tailwind-merge`, `class-variance-authority`, `sharp` (images unoptimized), `next-themes` (commented out), `@heroui/react` (only a tailwind glob) | `package.json` |
| `export` script uses removed `next export` (Next 14) | `package.json:10` |
| Tailwind scans nonexistent `./pages`, `./src/**/*.{ts,tsx}` | `tailwind.config.js:5,8` |
| `.node-version` 22 vs CI 20; no `engines` field | repo / `package.json` |
| tsc/eslint actually clean **today** (`tsc --noEmit` 0 diagnostics; eslint 0 errors/7 warnings) → strict mode is *achievable* | verification run |

---

## 6. Public assets & deploy

- **`og-image.png` missing** (referenced `layout.tsx:57,68`).
- **No sitemap**; robots.txt lacks `Sitemap:` line.
- **`Ads.txt` capital A** — should be `ads.txt`.
- Favicon duplicated 4×; `public/team/leandro-alves.png` = 2.5 MB (unoptimized).
- `.nojekyll` at repo root but **not in `out/`** (workflow uploads `./out`; GH Pages
  Jekyll processing risk for `_`-prefixed paths — currently none, but keep parity).
- Docs drift: `docs/INDEX.md` stale line counts (ASSESSMENT 730 vs 738, harness doc
  1276 vs 2019), stale course count (38 vs 49), claims tests that don’t exist.

---

## 7. Harness strengths

- Translation gate stack (`validate_lesson` → `verify_translation` → `quality_lint` →
  `check_locale_course [--legacy]`) is mature, deterministic, exit-code clean, and now
  CI-wired with legacy parity handling.
- Husky + lint-staged + pre-commit + bandit/ruff are all *configured* — they need
  content, not invention.
- Skill framework (10 registered skills) gives a natural home for new validators
  (games, library, quizzes, languages).

---

## 8. Summary matrix

| Area | Grade | Headline |
|---|---|---|
| Content validation CI | B+ | 26 pairs + legacy parity; needs all 49 + non-course content |
| Type/lint safety | D | disabled everywhere; currently clean → fixable |
| JS/TS tests | F | zero files behind `passWithNoTests` |
| Python harness | F | hollow package, broken collection, committed artifacts |
| Hooks/editor gates | C | good ideas, partial coverage, not CI-wired |
| Config/deps hygiene | C− | unused deps, version drift, 2 majors behind |
| Docs | C | rich but stale/overstated |
