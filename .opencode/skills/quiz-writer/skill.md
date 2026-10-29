---
name: quiz-writer
description: Creates and expands exam-blueprint quiz JSON files in content/quizzes, with quota grids, dedup gating and a deterministic merge
triggers:
  - content/quizzes/**
---

## Activation Context

Use this skill when the task is to **create a new quiz file or add, expand or rebalance
questions inside an existing `content/quizzes/*.json` file**. Two proven runs ground it:
`aws-aif-c01.json` grew from 350 to exactly 500 questions, and `aws-clf-c02.json` was
bootstrapped from a spec (130 items, 2x the 65-question exam) with the same toolchain.

The skill owns the full loop: blueprint planning, skeleton bootstrap, quota grids,
course-grounded authoring, per-batch validation, merge/renumber, final verification and
the wrapup battery.

Not in scope: quiz UI/components (TypeScript), editing lessons, or translating quiz
content (locales blocks).

Standing repo rules that always apply while working:

- **Never `git commit`** — the user commits (message `up`). Report state, leave the tree dirty.
- **No `rg`** — use `grep` only.
- Scratch files live in `.scratch/<quiz>-questions/`; never touch `mockQuestionCount`,
  `durationSeconds`, `passingScore` or any other top-level field unless the user asked to.
- Python entry point for repo checks: `.venv/bin/python` (or `uv run --no-sync ...`).
- Every script exits **0 (pass) or 2 (blocking), never 1** — repo tooling treats rc 1 as
  tolerated warnings; a gate that needs attention must exit 2.

---

## Instructions

### Phase 0 — Derive the plan before writing anything

**Branch A — the quiz file does not exist yet (bootstrap):**

1. Read the exam-guide lesson (`content/courses/<course>/en/01-exam-guide-*.md`): domain
   weights, task statements / topic areas, question count and timing of the real exam.
   Extract subdomain strings verbatim — never invent or abbreviate them. Convention:
   `"<prefix> - <official title>"`, e.g. `"1.1 - Benefits of the AWS Cloud"`.
2. Write a **spec JSON** with: identity (`id` = kebab-case filename stem, `kind`,
   `category`, `title`, `description`, `difficulty`, `topic`, `certification`), logistics
   (`durationSeconds`, `passingScore`, `mockQuestionCount` = real exam count), `total`,
   and `domains[]` where each domain carries `id, name, color, percent` (official weight)
   and `subdomains[]` of `{prefix, title, count}`.
3. Split `total` across subdomains by largest remainder of the domain weights (exact
   integers, sum = total). Type mix defaults to 50/20/15/15 resolved the same way.
4. Bootstrap and grid:

```bash
.venv/bin/python .opencode/skills/quiz-writer/scripts/init_quiz.py \
  --spec .scratch/<quiz>-questions/spec.json \
  --out content/quizzes/<id>.json
.venv/bin/python .opencode/skills/quiz-writer/scripts/build_grid.py \
  --spec .scratch/<quiz>-questions/spec.json \
  --out .scratch/<quiz>-questions/grid.json \
  --batches-dir .scratch/<quiz>-questions/
```

`init_quiz.py` refuses any spec whose `id` != output stem, whose domain percents do not
sum to 100, or whose counts miss `total`; it writes the canonical skeleton with an empty
bank. The official hook validator requires non-empty `questions`, so until batch 1
merges, the skeleton is validated by these skill scripts, not the hook.

**Branch B — the quiz file exists (expand):** read `domains[].subdomains[]` from the
quiz itself (they are the source of truth), decide the *new* total, and run
`build_grid.py` with counts covering old + new items. Skip `init_quiz.py`.

**Batch plan:** `build_grid.py --batches-dir` slices the grid into per-batch files
(`grid-<name>.json`) from a `batches[]` list in the spec; batches must partition the
subdomains exactly. Size batches at 16–36 items, ideally aligned to domains/lessons.

**The three numbers, never conflate them (they answer different questions):**

| Concept | Unit | Consumer |
|---|---|---|
| `allocations` | percent, sums to **100** | hook validator + mock-exam draw (`lib/quizzes/draw.ts` scales them to `mockQuestionCount` per subdomain) |
| spec `counts` / grid | absolute item counts, sum to **total** | authoring quotas and `validate_batch --grid` |
| domain `percent` | official exam weight, sums to 100 | split into allocations by largest remainder |

Consequence to check: every subdomain's mock-draw target must stay **below** its pool
size (draw takes `slice(0, target)`), so counts should run comfortably above
`total × allocation%` — a 2x margin is healthy and falls out of proportional planning.

**Schema contract for every item** (enforced by the gate, so write to it from the start):

| Rule | Value |
|---|---|
| Item fields | `subdomain, type, question, [prompts], options, correct, explanation` in that order; **no `id`** (merge assigns `qNNN`) |
| Text | ASCII only; no `$` anywhere; question at least 25 chars; non-empty explanation |
| Banned phrases | "Select all that apply", "Choose the correct option", "All of the above", "None of the above" |
| mcq | exactly 4 options, `correct` int 0–3; across a batch of 4+ mcqs all four indices used and spread ≤ 2 |
| multi | ≥ 5 options, ≥ 2 correct, unique in-range indexes |
| ordering | 3–6 options, correct lists 3–5 steps, unique in range, **never presented in ascending order** (that gives the answer away) |
| matching | 3–7 pairs; prompts before options; `correct` is a permutation; every prompt/option ≤ 70 chars (new items only) |
| Batch files | JSON array, items without `id`, written to `.scratch/<quiz>-questions/batch-<name>.json` |

### Phase 1 — Ground every fact in the course

Map each subdomain to its authoritative lesson files before drafting
(`content/courses/<course>/en/`). Build a per-domain **fact dossier** in
`.scratch/<quiz>-questions/facts/`: every number, quota, threshold and list you may
quiz, with its lesson and section — then author only from the dossier.

Freshness hazards are per-exam: derive them from the course's dated update boxes, the
"out of scope" lists and naming-trap sections. Two structural rules everywhere:
out-of-scope services appear **only as wrong options**, and dated counts (regions, AZs,
service limits) are quotable **only as the dated lesson states them**.

Worked example — the AIF-C01 map used in the first run (adapt, do not copy):

| Subdomain range | Grounding |
|---|---|
| 1.1–1.3 | `01-exam-guide` scope table, `02-ml-lifecycle` |
| 2.1–2.3 | `08-generative-ai`, `09-bedrock-foundations` |
| 3.1–3.4 | `08`–`10` per topic, `05-training-tuning` |
| 4.1–4.2 | `12-genai-safety-guardrails`, `14-security-iam-compliance` |
| 5.1–5.2 | `13-mlops-scaling`, `15-cost-governance-optimization` |

The AIF-specific hazard list (Amazon Q, PartyRock, AUC, hyperparameter tuning out of
scope, ...) lives in `references/dedup-and-freshness.md` as a worked example.

**Price-symbol doctrine** (critical for billing/pricing domains): content bans `$` in
any string. Write prices as words ("one cent per GB-month"), or avoid absolute prices
entirely — prefer structural comparisons (On-Demand vs Reserved vs Spot) and lesson-
dated figures only. `validate_batch` and `verify_quiz` both block on the symbol.

### Phase 2 — Author in quota-verified batches of 16–36 items

- Keep a running counter per (subdomain, type); every batch must match its
  `grid-<name>.json` slice exactly (the gate enforces it).
- Balance mcq correct indices inside each batch as you go (roughly even 0/1/2/3).
- Before settling on a topic, scan for collisions:
  `grep -in "<key term>" content/quizzes/<quiz>.json | head` — check question **and** option
  text. Metric names, service quotas and option lists recur across items; a topic already
  used as a *correct answer* in a sibling item is usually saturated (see the reference for
  the exact collision list from the 500-question run).
- Ordering items: shuffle presented options so `correct` is not ascending; put the
  distractor somewhere other than last by habit.

### Phase 3 — Gate every batch (exit 0 or exit 2, never 1)

```bash
.venv/bin/python .opencode/skills/quiz-writer/scripts/validate_batch.py \
  --quiz content/quizzes/<quiz>.json \
  --batch .scratch/<quiz>-questions/batch-<name>.json \
  --sibling .scratch/<quiz>-questions/batch-<earlier>.json \
  --grid .scratch/<quiz>-questions/grid-<name>.json
```

The gate runs: schema/field order/ASCII/`$`/banned phrases → per-type bounds → mcq
balance → grid slice → exact-stem dedup vs bank and siblings → stopword-filtered
Jaccard ≤ 0.30 vs bank, vs siblings and **within** the batch. Fix and re-run until it
prints `validate-batch: PASS`.

- Pass `--sibling` for every batch that is not yet merged (the sibling chain); merged
  batches are already covered by the bank itself.
- `--skip-dedup` exists only for re-validating a batch that is **already merged**;
  intra-batch checks still run.
- Do not relax `--threshold` / `--char-limit` to force a pass — rewrite the item instead.

### Phase 4 — Merge, then verify

```bash
.venv/bin/python .opencode/skills/quiz-writer/scripts/merge_batches.py \
  --quiz content/quizzes/<quiz>.json \
  --batch .scratch/<quiz>-questions/batch-<name>.json
```

The merge re-checks exact stems and subdomain membership (blocking on either), groups
questions in the quiz's canonical subdomain order, renumbers `q001..qNNN` with id-first
canonical field order, and preserves every top-level field. `--dry-run` previews;
`--out /tmp/x.json` rehearses; in-place is the default.

After every batch and once at the end:

```bash
.venv/bin/python .opencode/skills/quiz-writer/scripts/verify_quiz.py \
  --quiz content/quizzes/<quiz>.json \
  --target <total> \
  --grid .scratch/<quiz>-questions/grid.json \
  --baseline .scratch/<quiz>-questions/skeleton.json \
  --strict-length
```

`verify_quiz` blocks on: totals, `q001..qNNN` sequence, duplicate stems, giveaway
ordering, allocations (positive, sum 100, exact two-way match with subdomains), charset
and `$`, grid cell conformance, baseline drift of every top-level field, and (under
`--strict-length`) over-70-char matching strings. Save a copy of the pristine skeleton
as `--baseline` right after `init_quiz`.

Then the official validator must be green too:

```bash
OPENCODE_FILE_PATH=content/quizzes/<quiz>.json \
  python3 .opencode/hooks/validate-quiz-json/scripts/validate_quiz_json.py   # exit 0
```

New quiz files are auto-discovered by `lib/quizzes/get-quiz-content.ts` (and the
sitemap) — no registration step exists or is needed.

### Phase 5 — Wrapup battery, then report (never commit)

`npx tsc --noEmit` → `npm run lint` → `npx vitest run` → `.venv/bin/python -m pytest -q` →
`npm run build` → `node scripts/verify_out.mjs` → `bash .scratch/ci_sim.sh` (if present).

Exit-code policy for repo tooling: **rc 1 = warnings tolerated, rc 2 = blocking** — that
is how the real CI treats the lesson/course validators; `ci_sim.sh` mirrors it. The
quiz-writer scripts themselves only emit 0 or 2.

Report: final counts, quota table, gate results, battery results. Leave committing to the user.

---

## Quality Rules

- One item teaches exactly one thing; the explanation says why the distractors fail.
- Numbers (quotas, percentages, thresholds) come from the lesson text, never from memory.
- A batch that fails the gate gets **rewritten**, not patched to slip under a threshold.
- Batch stems must be scenarios, not restatements of the stem they duplicate — re-read the
  gate's reported closest match before rewriting.

## Output Format Rules

- Spec, grid, batch and fact files: JSON, `indent=2`, ASCII, no trailing junk.
- Quiz file after merge: `indent=2`, `ensure_ascii=False`, exactly one trailing newline
  (the merge script writes this style atomically).

See `references/dedup-and-freshness.md` for the stopword list, Jaccard methodology, the
collision history of the 500-question run, the freshness worked example, and the
version changelog.
