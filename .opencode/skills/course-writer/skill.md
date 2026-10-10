---
name: course-writer
description: Generates and validates publication-ready Markdown course lesson files for the NUniversity platform with deterministic quality checks
triggers:
  - content/courses/**
---

## Activation Context

Activate when the user requests creation or editing of course lesson files under `content/courses/`. This skill is the single source of truth for (1) lesson file format and platform rendering capabilities, and (2) the loop-engineering playbook that produced the four completed courses: `nonprofit-organization-fundamentals` (PT), `aws-aif-c01`, `aws-clf-c02`, `aws-dea-c01` (EN). Follow both halves: **format rules** for any single-file edit, **playbook** for a full multi-lesson course build.

---

## Instructions

When activated:

1. **Identify the course context** — course slug + locale under `content/courses/`.
2. **Validate existing content**:
   ```bash
   OPENCODE_FILE_PATH=<path-to-lesson.md> python3 scripts/validate_lesson.py
   OPENCODE_SKILL_DIR=<path-to-course-dir> python3 scripts/validate_course.py
   ```
3. **Generate scaffolds** (optional):
   ```bash
   OPENCODE_LESSON_TITLE="Lesson Title" OPENCODE_LESSON_ORDER=1 OPENCODE_LESSON_PATH=<output-path> python3 scripts/generate_lesson.py
   ```
4. **Follow the lesson structure and quality bars** below.
5. **Validate before saving** — iterate per file until exit 0.
6. **For a full course build**, run the Loop-Engineering Playbook (P0–P6) at the end of this file.

---

## Platform Resource Inventory (Richness Mandate)

The NUniversity renderer (`components/markdown/MarkdownRenderer.tsx`) is far richer than plain Markdown. **Publication-grade lessons must use these capabilities — a lesson that is "all prose + 5 questions" is too simple for this platform.** Mandate for every non-trivial lesson:

- **≥4 mermaid diagrams** — architecture, data-flow, pipeline topology, state machines. Mermaid is first-class: rendered as SVG with zoom (0.25×–4×), Ctrl+wheel zoom, and fullscreen.
- **≥2 interactive blocks** (see schemas below) — quizzes, charts, simulations.
- **≥5 worked examples** with real numbers, real SQL/CLI/config snippets using highlighted languages.
- **≥1 KaTeX formula** where the domain has math (cost formulas, probability, rates).
- **Callout variety** — not just WARNING; use TIP, IMPORTANT, NOTE as appropriate.
- **Interactive charts (`plot`)** for any quantitative comparison — domain weights, cost curves, latency numbers.

### Rendered languages (syntax-highlighted with copy button)

`sql` (aliases psql/postgresql), `javascript` (js), `typescript` (ts), `python` (py), `rust`, `bash` (sh/shell/zz), `terraform` (hcl/tf), `json`, plus anything else passed through. Use real, runnable-looking snippets — not pseudo-code placeholders.

### Callout types (exactly these eight)

`> [!NOTE]` · `> [!INFO]` · `> [!WARNING]` · `> [!DANGER]` · `> [!ERROR]` · `> [!SUCCESS]` · `> [!TIP]` · `> [!IMPORTANT]`

`> [!SUCCESS]` blocks containing the literal string `Key Takeaways` are REQUIRED as the last content of every lesson (validator rule).

### KaTeX math (two supported forms)

1. **Inline/display delimiters** (remark-math + rehype-katex): `$a^2+b^2=c^2$` inline; `$$\frac{a}{b}$$` display. Single backslashes.
2. **` ```math ` fence** with **raw LaTeX** (NOT JSON) — rendered by MathBlock:
   ````
   ```math
   P(\text{pass}) = \frac{k}{n}
   ```
   ````

### Mermaid

Always bare ` ```mermaid ` open + bare ` ``` ` close. Keep diagrams ≤ ~40 nodes; prefer `flowchart TD`, `sequenceDiagram`, `stateDiagram-v2`, `architecture-beta`, `gantt` where natural.

---

## Output Format Rules

Every lesson is one Markdown file with YAML frontmatter in this order:

### 1. YAML Frontmatter (required)

```yaml
---
title: "Lesson Title"
description: "Concise SEO description (1-2 sentences)"
order: 1
duration: "45 minutes"
difficulty: "beginner" | "intermediate" | "advanced"
---
```

### 2. Body

- H1 (`#`) must equal frontmatter `title` exactly.
- `##` major sections, `###` subsections. Numbered teaching sections (`## 1. …`) are encouraged.

### 3. Code Fence Rules (CRITICAL)

- **Opening fences:** language identifier (`python`, `mermaid`, `question`, `matching`, …).
- **Closing fences:** BARE ` ``` ` — never ` ```text ` or any other text. A non-bare closer is the #1 cause of "Invalid … config" JSON errors because the interactive JSON parser reads until the first bare fence.

### 4. Filename Convention

Filenames must match `^(\d+)-([a-z0-9]+(-[a-z0-9]+)*)\.md$` — NN plus kebab slug (e.g. 02-data-ingestion-patterns.md).

---

## Quality Bars (publication-grade — learned across four builds)

Per lesson (minimum; exam-grade courses used higher):

| Bar | Minimum | Exam-course target |
|---|---|---|
| Lines | 800 | 800–1,100 |
| ` ```question ` blocks | 5 (validator) | ≥10 (sim lessons ≥20) |
| Interactive blocks | 1 (validator warns if 0) | ≥2, varied types |
| Mermaid diagrams | 0 | ≥4 |
| Worked examples with real numbers | — | ≥5 |
| `📚 Did you know?` curiosities | — | ≥3 |
| ⚠️ WARNING / IMPORTANT box | — | ≥1 |
| Named real-world cases | — | ≥1 (`## Real-World Case Studies`) |
| `### 2026 Updates (as of October 2026)` | — | ≥1 sourced bullet box |
| `> **Comparative Verdict`** | — | × alternative × self-managed × other-service |
| Last block | `> [!SUCCESS]` + literal `Key Takeaways` | numbered list, LAST content |

Question ids: unique per course, pattern `<prefix>-NN-qN` (e.g. `dea-01-q1`). `correct` is 0-based int in range; 4–5 options; explanation says why correct AND why the top distractor traps.

---

## Interactive Components

Six JSON-configured quiz/sim types + math. Full field schemas live in `references/guide.md` (authoritative — verified against the React components). Quick reference:

| Tag | Component | Key fields |
|---|---|---|
| `question` | MCQ / T-F quiz | `id`, `type` (`multiple-choice`\|`true-false`), `question`, `options`, `correct`, `explanation` |
| `matching` | drag-to-match | `question`, `pairs` `[{left,right}]`, `explanation` |
| `fillblank` | word-bank blanks | `question`, `template` with `{{N}}` placeholders, `answers` `{"N":"word"}`, `distractors?`, `explanation` |
| `dragdrop` | order-the-steps | `question`, `items`, `correctOrder`, `explanation` |
| `plot` | Recharts chart | `type` (`line`\|`bar`\|`scatter`\|`pie`), `data`, `xKey?`, `dataKeys?`, `title?`, `xLabel?`, `yLabel?`, `colors?`, `height?` |
| `phet` | PhET sim iframe | `slug`, `title?`, `language?` |
| `molecule` | 3Dmol protein | `pdbId`, `style?` (`cartoon`\|`stick`\|`sphere`\|`line`\|`cartoon+stick`), `color?`, `height?`, `label?`, `background?` |

Rules:

- Place each interactive immediately after the text that explains its concept.
- Vary types across consecutive lessons; across a course use every type at least once.
- Always include `explanation` on matching/fillblank/dragdrop.
- Chart data and PDB ids must be real/verifiable — never invented.

Example (matching):

````
```matching
{
  "question": "Match the pipeline stage to the service.",
  "pairs": [
    {"left": "Ingest stream", "right": "Kinesis Data Streams"},
    {"left": "Catalog schema", "right": "AWS Glue Data Catalog"},
    {"left": "Query lake", "right": "Amazon Athena"}
  ],
  "explanation": "Streams land first, the catalog registers schema, Athena queries in place."
}
```
````

---

## Validation & Exit Codes

- validate_lesson rules: frontmatter `title`+`order`; `difficulty` ∈ beginner/intermediate/advanced; H1 == title; heading matching `^## .*Practice Questions`; ≥5 ` ```question `; `> [!SUCCESS]` containing literal `Key Takeaways`; ≥1 interactive of type `math|phet|plot|molecule|dragdrop|matching|fillblank` (else rc 1); filename pattern above; all interactive JSON valid; bare closers.
- validate_course rules: course.json with `area`, `en.title`, `en.description`; root `difficulty` lowercase; `en.difficulty` capitalized; sequential orders; naming pattern.
- **Exit codes: 0 clean · 1 warnings only · 2 error.** EN-only courses get rc 1 (missing pt/es) — expected; never block on rc 1. CI fails only on rc 2. Every lesson must be rc 0.

Skill self-test:

```bash
OPENCODE_SKILL_DIR=$(pwd)/.opencode/skills/course-writer python3 .opencode/skills/course-writer/tests/skill_tester.py
```

---

## Loop-Engineering Playbook (full course builds)

Production recipe used for `aws-aif-c01` → `aws-clf-c02` → `aws-dea-c01`. Definition of done for a 16-lesson exam course: digests on disk; every lesson rc 0; course rc 1 (EN-only ok); totals ≈15k+ lines / ≥200 questions / ≥50 interactive / ≥80 mermaid / 0 duplicate ids; docs page; `npm ci` + vitest + `next build` green with 16 output pages; CI loop entry added and locally simulated; **no git commit unless the user asks**.

### P0 — Setup

1. `mkdir -p .scratch/<slug> content/courses/<slug>/en`
2. Write course.json (area, author, difficulty, duration, icon, en block).
3. Write .scratch/<slug>/SPEC.md — condensed digest spec + bars + ops rules (~3 KB) so agent prompts stay <2,500 chars.
4. Write the build master prompt into .scratch/<slug>/MASTER-PROMPT.md (scratch outside the repo is wiped by reboots; `.scratch/` is gitignored).

### P1 — Deep-research digests (waves of ≤3 task agents)

- Path: .scratch/<slug>/NN-<slug>.md, 18–30 KB each, sections exactly:
  `## A. Official / primary sources` (URLs + access date; exact quotes for exam facts) · `## B. Core facts & concepts` · `## C. Numbers, prices, limits` (each with source + date) · `## D. Real-world examples / case material` · `## E. In-scope services/topics` · `## F. Exam traps & common confusions` · `## G. Could NOT verify` (**never state as fact in lessons**) · `## H. Suggested worked examples & diagram ideas`.
- Verify each wave: `wc -c` ≥ 18000, `grep -c '^## '` = 8, tail not truncated.
- Prefer `docs.aws.amazon.com` / official vendor pages over blogs; date-stamp prices "as of Oct 2026"; conflicts go to section G.

### P2 — Lessons (waves of ≤3 writers)

- Writer prompt pattern: "READ .scratch/<slug>/SPEC.md, then gold lesson X **for tone only**, then digests Y…, then WRITE file Z, then run scripts/validate_lesson.py in a loop until exit 0, reply ONE line."
- Gold lessons = tone/structure only — **never copy facts** from another course's lessons.
- After each wave, verify yourself: line counts, question/interactive/mermaid counts, unique ids — **never trust the agent's reply alone**.

### P3 — Enhancement (additive pass)

First-write waves in prior builds were systematically missing `### 2026 Updates` boxes and `## Real-World Case Studies`. Audit table first (lines/q/int/mermaid/cases/updates), then per lesson: add missing case sections and update boxes from digests, +2 questions, +1 interactive, +2 curiosities, grow to bar. **Never delete validated content**; re-validate to rc 0 after edits.

### P4 — Docs

One docs page per course (e.g. docs/aws-courses/<id>.md, 900–1,400 lines): metadata · grep-verified stats table · validation results · description · outcomes · methodology + digest inventory · real-world examples · story · per-lesson structure.

### P5 — Verification (run yourself, not via agents)

```bash
# per-lesson gate
for f in content/courses/<slug>/en/*.md; do OPENCODE_FILE_PATH=$f python3 .opencode/skills/course-writer/scripts/validate_lesson.py || echo FAIL $f; done
# course gate (expect rc=1 for EN-only)
OPENCODE_SKILL_DIR=content/courses/<slug> python3 .opencode/skills/course-writer/scripts/validate_course.py; echo rc=$?
# integrity: unique ids, correct in range, options>=4, H1==title, bare-fence parity, JSON parse of every interactive block
# skill self-test + pipeline
OPENCODE_SKILL_DIR=$(pwd)/.opencode/skills/course-writer python3 .opencode/skills/course-writer/tests/skill_tester.py
npm ci && npx --no-install vitest run && npx --no-install next build
find out -path '*<slug>*' -name index.html | grep -c '/en/'
```

### P6 — CI

`.github/workflows/nextjs.yml` step "Validate course content (course-writer skill)" loops course:locale entries (`"aws-dea-c01:en"` style). Add one entry per course; rc 2 fails, rc 1 tolerated, every lesson must be rc 0. Simulate the exact step locally with a bash for-loop before finishing.

### Hard operational rules (these broke real runs when violated)

1. **≤3 task agents per message** — more triggers provider rate limits and mid-flight cancellations. After a rate-limit failure: grep-verify files for partial writes, then retry at **2 per message**.
2. **Agent prompts < 2,500 chars** — put reusable rules in the per-course SPEC.md; have agents READ it.
3. **Digested/lesson content travels as files** — agents write directly to the target path and reply one line; you verify with `wc`/`grep`/validators.
4. **All scratch lives in `.scratch/<slug>/`** (gitignored) — `/tmp` is wiped by reboots.
5. **Facts only from digests/official sources** — section G items never appear as fact; every price/limit date-stamped.
6. **Iterate each file to exit 0** before closing a wave; re-run the full gate after every wave.

### Failure-mode playbook

| Symptom | Cause | Fix |
|---|---|---|
| Tasks cancelled / rate limited | >3 agents or bursty retries | verify files, re-run at ≤2/wave |
| Agent claims success, file empty | agent aborted | always `wc`/`grep` yourself |
| Lesson stuck rc 1 | missing "Key Takeaways" literal, missing interactive, non-bare closer, H1≠title | read validator output; fix the specific rule |
| validate_course rc 1 | missing pt/es — expected for EN-only | tolerate; only rc 2 blocks |
| `/tmp` files vanished | nightly wipe | keep everything under `.scratch/` |
| Price/limit mismatch across digests | vendor pricing drift | prefer official+dated; conflict → section G, teach qualitatively |

### Anti-patterns (never)

- Inventing stats/prices/limits/metrics; stating section-G items as fact
- Copying facts from a previous course (tone-only reuse)
- Non-bare fences inside interactive blocks; duplicate question ids; `correct` ≥ options length
- >3 agents in one message; trusting agent replies without local verification
- Committing, or touching `_backup/`, `.scratch/`, or stray user files
- Skipping the enhancement audit (updates boxes and case sections were missing on every first-write wave)
- Declaring done without full P5 verification + CI simulation

---

## Locale Handling

- Content per locale: `content/courses/{course-slug}/{lang}/` — supported `en`, `pt`, `es`.
- A course needs an `en/` directory OR a locale-specific directory to appear in listings.
- When translating: translate prose + frontmatter `title`/`description` values; keep code and technical identifiers in English.

## GitHub Pages Deployment

1. `.nojekyll` at repo root.
2. Pages source = GitHub Actions.
3. Jinja/Liquid syntax in content (e.g. dbt courses): wrap in `{% raw %}...{% endendraw %}`.

---

## Reference

Internal references (all paths relative to this skill directory):

- `references/guide.md` — authoritative interactive-component JSON schemas and course structure guide
- `references/course-json-schema.md` — course.json schema documentation
- `references/lesson-template.md` — lesson file template
- `scripts/validate_lesson.py` · `scripts/validate_course.py` · `scripts/generate_lesson.py`
- `tests/skill_tester.py` — skill self-test (exit 0 required)
- `assets/skill.json` — skill manifest
- `examples/valid-lesson.md` · `examples/invalid-lesson.md` · `examples/valid-course.json`

Production reference courses in-repo: `content/courses/aws-dea-c01/` (exam-grade EN, richest use of the resource inventory), `content/courses/nonprofit-organization-fundamentals/` (PT complete with translations + CI).
