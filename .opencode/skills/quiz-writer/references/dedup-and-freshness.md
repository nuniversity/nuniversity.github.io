# Dedup methodology and freshness hazards

Reference for `quiz-writer`. The gate script implements the mechanics; this file records the
*why*, the measured history and the hazards that are not obvious from the code.

## Jaccard methodology (exact)

1. Build text = `question + " " + join(options)` (prompts count too for matching).
2. Tokenize with `[a-z0-9]+` on the lowercased text.
3. Drop stopwords and single-character tokens:

```
a an the of to and or in on for with is are as at by from that this be been it its their there
which what when where who how not no do does did can could should would may might will shall
into than then also more most such only other some any each both all
```

4. Score = `|A ∩ B| / |A ∪ B|`; ceiling **0.30** against bank, siblings and intra-batch.

Why options are included: near-duplicate questions usually differ in wording but reuse the
same option list (or vice versa); option tokens catch that. Why stopwords are dropped: without
them every English question shares ~40% of its tokens and the ceiling would be meaningless.

### Measured results of the 350 → 500 run (all passed)

| Batch | Items | intra max | cross-batch max |
|---|---|---|---|
| c1 | 30 | 0.226 | ≤ 0.155 |
| c2 | 36 | 0.271 | ≤ 0.216 |
| c3 | 22 | 0.235 | ≤ 0.286 (vs c4) |
| c4 | 20 | 0.231 | ≤ 0.286 |
| c5 | 21 | 0.159 | ≤ 0.167 |
| c6 | 21 | 0.224 | ≤ 0.167 |

Exact-stem duplicates across all 500: **0**.

## Collision history — topics that were killed by the scan

A topic is *saturated* when the stem or the option list is already doing the teaching somewhere
else. From the 500-question run, do not re-propose these without a genuinely new angle:

- `cfgScale` image adherence (c3 already owns it), input-mode thresholds as an mcq (c3 multi
  owns them), SageMaker job states ordering, Spot-reclaim ordering, model-parallelism mcq.
- Delimiter/output-extraction mcq — bank q207 covers it; CWO remediation ordering — q354;
  knowledge-base ingestion ordering — q173; training-job lifecycle ordering — c3 owns it.
- Distillation statistics mcq — three items (q167, q215, q226) already reuse the numbers.
- Few-shot "three to five examples" count — appears in the options of four items already.
- Built-in evaluation datasets: one item may hold Real Toxicity as the answer with Gigaword /
  BoolQ / WikiText-2 as distractors; a second item on the same list needs a different frame
  (e.g. task-to-dataset mapping rather than "which dataset for toxicity").

Cross-batch caveat: the Jaccard union includes options, so **option-name overlap between two
different topics is tolerated** — only near-identical stems trip the ceiling. Scan with
`grep -in` over question *and* option text before committing to a topic.

## Freshness hazards (AIF-C01)

Do not build a *correct* answer on these; if mentioned at all, keep them as distractors or
phrase them as historical. Each entry was a real risk during the 500-question run:

| Hazard | Why |
|---|---|
| Amazon Q | Product line churn; exam guide mentions it only in passing |
| Fraud Detector | Long deprecated as a headline service |
| Amazon Kendra | Not part of the current GenAI blueprint emphasis |
| "Amazon Quick" | Truncated/renamed brand — never assert it |
| PartyRock, Bedrock Data Automation | Consumer/experimental surfaces, not exam-stable |
| MemoryDB | Not in scope for this exam's data-store list |
| AUC | Dropped from 1.3.6 metrics — usable only as a wrong option |
| Clarify / Model Monitor / Ground Truth availability claims | Capabilities move release to release; describe what the lesson says, nothing more |
| Provisioned-throughput-only claims for fine-tuned models | Priority tier and other options exist; avoid absolutes |
| Hyperparameter tuning | Explicitly **out of scope** in the exam guide (lesson 01 scope table) — distractor material only |

Legacy content quirks to know about:

- **70-char matching strings** apply to *new* items only. The committed bank carries 73
  over-length strings across 24 legacy items (up to 132 chars); the official validator
  `validate_quiz_json.py` has no length rule at all. Never "fix" legacy items without asking.
- Ordering answers: 12 legacy items shipped with ascending `correct` values (the presented
  order *was* the answer). All 12 were de-rotated on 2026-10-29; the gate now rejects any
  ascending answer in new items. If you find one, fix it by moving the first presented option
  to the end and remapping `correct` (`n-1` for a former `0`, `x-1` otherwise).
- `id` placement was mixed before the first skill-driven merge; `merge_batches.py` now emits
  canonical id-first order for every item it writes.

## Exit-code contract

All quiz-writer scripts exit **0 (pass) or 2 (blocking)** — never 1, because repo tooling
treats rc 1 as "warnings tolerated" (see `validate_lesson.py` and the CI comment
"rc 1 is tolerated; rc 2 fails the build"). A gate that needs attention must exit 2.

## Version changelog

### 1.1.0 — bootstrap + verification toolchain

- `scripts/build_grid.py` — spec JSON (subdomain counts + type mix/constraints + batch
  plan) to an exact `subdomain:type` quota grid, sliced per batch. Largest-remainder
  distribution with canonical type-order tie-break (mcq, multi, ordering, matching), so
  a 50/20/15/15 mix of 130 items resolves to 65/26/20/19 deterministically.
- `scripts/verify_quiz.py` — final whole-bank verifier: totals, id sequence, duplicate
  stems, giveaway ordering, allocations (sum 100, two-way key match), charset/`$`,
  grid conformance, `--baseline` drift detection, `--strict-length` for matching
  strings. Replaces the session-scratch `verify_500.py` pattern.
- `scripts/init_quiz.py` — new-quiz bootstrap: spec to canonical skeleton with
  `allocations` computed from official domain weights split across subdomains by
  largest remainder; enforces `id` == `slug` == filename stem.
- `skill.md` rewritten: Phase 0 branches (new quiz vs expand), allocations-vs-counts
  doctrine (allocations drive the mock-exam draw scaled to `mockQuestionCount`),
  price-symbol doctrine, AIF lesson map demoted to a worked example.
- Tests grew 65 → 150.
