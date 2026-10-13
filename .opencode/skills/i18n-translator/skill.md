---
name: i18n-translator
description: Publication-grade technical translation of NUniversity course lessons (EN→PT, EN→ES) with deterministic verification. Activate when translating course content between locales, localizing course.json, or when asked to translate lessons/dictionaries.
triggers:
  - content/courses/**
  - dictionaries/**
  - "**/*.json" (when editing translation values)
  - content/localization
  - "translate course/lesson to portuguese/spanish/pt/es"
---

## Mission

Produce **publication-grade technical translations** of NUniversity course lessons from English (`en/`, the source of truth) into Portuguese (`pt/`) and Spanish (`es/`). These are engineering courses: a mistranslated identifier, a renamed question id, a mangled JSON payload or an untranslated code fence is a **build break or a silent content bug**, not a style issue. Translation quality here is enforced by **invariants** (things that must stay byte- or set-identical) plus a **deterministic verifier** — never by taste alone.

This skill supersedes the old dictionary-only guidance below the "Platform chrome" section. Dictionary rules are unchanged; lesson rules are now first-class and binding.

## Skill layout (platform standard)

| Path | Contents |
|---|---|
| `scripts/` | Deterministic tools: `verify_translation.py` (per-file invariant comparator), `quality_lint.py` (per-file quality gate: English leftovers, locked headings, register, duration), `check_locale_course.py` (per-course locale parity + gates aggregator). All exit 0/1/2. |
| `assets/` | Templates & schemas: `lesson-template.pt.md`, `lesson-template.es.md` (complete skeletons with all 5 interactive types), `interactive-types.schema.md` (authoritative JSON shapes with [INV]/[TR] legend), `course-locale.schema.json` (course.json locale-block contract). |
| `references/` | Documentation: `glossary.md` (locked terminology EN→PT/ES + locked heading formulas — binding). |
| `examples/` | `paired-excerpt.md` (annotated EN/PT/ES passage), `troubleshooting.md` (real failure catalog), `README.md` (when to use what). |

Every translation task: read the contract here, the glossary, the relevant template + paired excerpt; after writing, run **all three** scripts (see Workflow). Troubleshooting errors → the catalog first.

## Active scope (as of 2026-10-12)

- `databricks-lakehouse-aws`: **both pt and es complete** (17+17).
- `aws-*` courses (aif-c01, clf-c02, dea-c01, data-lakehouse): **pt only** for now — do not create or fill `es/` dirs for these until asked.
- `nonprofit-organization-fundamentals`: pt shipped (legacy); es incomplete with localized filenames — out of scope until explicitly requested.

---

## The translation contract (source ↔ target)

For every lesson file `content/courses/<slug>/en/NN-name.md` there is exactly one target `content/courses/<slug>/<locale>/NN-name.md` with the **same filename**. Never localize filenames (the pt pattern of the nonprofit course is the model; ignore the legacy es filenames there).

### MUST be identical between en and target (enforced by `scripts/verify_translation.py`)

| Item | Rule |
|---|---|
| Filename | byte-identical |
| Frontmatter `order`, `difficulty`, `duration` | `order` and `difficulty` byte-identical (`difficulty` stays lowercase English enum: beginner/intermediate/advanced — the renderer and validator require it). `duration` compares **number-only**: target must be localized to `"N min"` (EN `"75 minutes"` → `"75 min"`) — it is a rendered UI string |
| All question ids (`dbl-01-q1`, `npof-03-q7`, …) | identical, same order of appearance |
| Interactive JSON **keys** and structure | identical; only user-facing string **values** translate |
| `plot` blocks: `data`, `dataKeys`, `xKey`, `type` | byte-identical (only `title`, `xLabel`, `yLabel` translate) |
| `fillblank` templates: the `{{1}}`, `{{2}}` … placeholders | identical set per template (word positions may shift; placeholder numbering must not) |
| `dragdrop`: `correctOrder` | must remain the translated `items` in the same logical order (translate the strings in BOTH arrays identically) |
| `matching`: number of `pairs` | identical (left/right strings translate) |
| Code fences `sql`, `python`, `bash`, `yaml`, `hcl`, `json`, `math`, `javascript`, `typescript`, `rust`, `terraform` | **byte-identical bodies** — do not translate code or in-code identifiers; do not translate comments (safest, and what CI expects) |
| All `http(s)://…` URLs | identical set |
| Mermaid diagrams | same node/edge structure; node **labels** may translate (keep punctuation that mermaid parses: quotes, parens, `<br/>`) |
| Numbered lesson structure (same `## N.` sections in same order) | identical count and order — the lesson map does not change |
| Callout syntax | `> [!WARNING]` etc. stay exactly as-is (platform syntax, not prose) |

### MUST be translated

| Item | Rule |
|---|---|
| Frontmatter `title`, `description` | translate; `title` must equal the new H1 |
| H1 | equals translated `title` (validator enforces equality) |
| All prose: paragraphs, headings, list items, blockquotes, table cells, callout **bodies**, mermaid label text, plot `title`/`xLabel`/`yLabel`, text-card contents | translate, preserving markdown syntax and inline `code` spans |
| Interactive JSON user-facing strings | `question`, `options`, `explanation`, `pairs[].left/right`, `template` words around `{{N}}`, `answers` values, `distractors`, `items`, `correctOrder` strings, plot labels |
| Case-study narratives, "Did you know?" boxes, Comparative Verdict boxes, Key Takeaways bullets | translate; keep company/product names untranslated |
| Date/price stamps | keep numbers identical, translate the stamp words: "as of October 2026" → "em outubro de 2026" (pt) / "en octubre de 2026" (es) |
| **Quoted documentation excerpts inside prose** (`"…"`, `«…»`, `“…”` spans ≥ ~6 English words outside code) | **translate the span**; keep citation tails `(docs …/path, 2026-09-11)`, product names and `**bold**` markers inside the span. A verbatim English quote mid-paragraph is a defect (`quality_lint.py` errors on it). Very short locked phrases (`"exactly once"`, `"unlimited concurrency"`) may stay English when the English term IS the professional term |

### NEVER translate

- Product/service/feature names: Databricks, Unity Catalog, Delta Lake, Auto Loader, Lakeflow, Lakeview, Photon, MLflow, DBU, AWS service names (Amazon S3, Kinesis, MSK, Glue, Athena, Redshift, Lake Formation, QuickSight/Quick Suite), GitHub Actions, Terraform, Apache Airflow, Kafka, dbt, Python, SQL keywords.
- Industry terms where the English term IS the professional term in pt/es engineering usage: data lakehouse, bronze/silver/gold (gloss on first use: "camada bronze (raw)" is fine), checkpoint, cluster, notebook, pipeline, dashboard, job, repo, commit, pull request, workload, token, endpoint.
- Identifiers inside code, paths, CLI commands, API names,ARNs,ARN-like strings, filenames.
- The validator literals inside headings (see Dual-Heading Pattern).

---

## Locked heading formulas (exact strings — `quality_lint.py` errors on variants)

| Context | PT | ES |
|---|---|---|
| Case-studies H2 | `## Casos Reais` | `## Casos Reales` |
| Updates box H3 | `### Atualizações de 2026 (em outubro de 2026)` | `### Actualizaciones de 2026 (en octubre de 2026)` |
| Did-you-know | `📚 Você sabia?` | `📚 ¿Sabías que…?` |
| Comparative verdict box | `> **Veredito Comparativo — ` | `> **Veredicto comparativo — ` |
| Dual practice heading | `## Perguntas de Prática (Practice Questions)` | `## Preguntas de Práctica (Practice Questions)` |
| Dual takeaways | `**Pontos Principais (Key Takeaways):**` | `**Conclusiones Clave (Key Takeaways):**` |

Casing matters (`Veredito Comparativo` in PT with capital C; `Veredicto comparativo` lowercase in ES). Real shipped defects this caught: `Casos de la vida real` / `Casos de estudio del mundo real` (4 ES variants), `Actualizaciones 2026 (a octubre de 2026)`, PT `Veredito comparativo` lowercase in 7 files.

## Register rules (locale voice)

- **PT-BR**: second person is **você** (never `tu`-forms, never pt-PT choices where pt-BR is natural: `cobrar` not `facturar`, `apagar` not `eliminar`). Bookish calques → idiomatic rewrite ("forma de produção" → "em formato de produção").
- **ES**: neutral international **tú**; never vosotros forms (`acabaréis`, `vosotros`, `-áis`) — `quality_lint.py` flags `-éis/-áis` verb endings (it whitelists `dieciséis`). Use `¿…?`/`¡…!`. Never mix stamp variants inside one file (`a octubre` vs `en octubre` — locked form uses `en octubre`).
- Both: never soften a WARNING/DANGER callout; keep its severity. Never leave an English sentence (or quoted doc excerpt) mid-paragraph.

---

## Dual-Heading Pattern (required — validator literals)

The course validator regexes require the English literals **`Practice Questions`** (in a `## ` heading) and **`Key Takeaways`** (in a `## ` heading OR near `> [!SUCCESS]`). The shipped nonprofit PT course proves the accepted pattern — keep the English literal in parentheses:

```markdown
> [!SUCCESS]
> **Pontos Principais (Key Takeaways):**
> 1. …
…
## Perguntas de Prática (Practice Questions)
```

Spanish: `## Preguntas de Práctica (Practice Questions)`, `**Conclusiones Clave (Key Takeaways):**`.

Every other `## ` section heading translates fully (no English parentheses needed) **except** that section numbering must be preserved (`## 3. …` stays `## 3. …`).

---

## Legacy/parity mode (courses that predate the validator)

Some shipped EN sources predate this skill: they fail `validate_lesson` themselves (no Practice Questions, fewer than 5 questions) and predate the dual-heading/duration rules (e.g. `processes-flowchart`, the 10 `intro-to-software-engineering` roadmap courses). Translate them **as-is, structure mirrored**, with parity gates:

- **`validate_lesson`**: target `LESSON ERROR:` messages must be a **subset of the EN source's** (no new errors; identical messages like `Insufficient practice questions: 0 found…` are fine). `check_locale_course.py --legacy` enforces this; per-file, diff the error lines between source and target.
- **`verify_translation.py`**: dual-heading / `> [!SUCCESS]` presence checks are **source-aware** — enforced only when the EN source has them. Everything else (frontmatter, fences, URLs, question ids, placeholders, register) stays fully enforced.
- **`quality_lint.py`**: automatically derives the EN source (same filename, else same order prefix) and gates *presence* checks (Practice Questions / Key Takeaways / SUCCESS / verdict box) on the source having them. Quote, register, duration, locked-formula, and stamp checks always run in full.
- **Structure**: mirror EN section-by-section — add no sections the EN lacks, remove none.
- **Key Takeaways**: when EN has `## Key Takeaways`, the target heading must still contain the `Key Takeaways` literal: `## Conclusiones Clave (Key Takeaways)` (es) / `## Pontos Principais (Key Takeaways)` (pt). The shipped PT of `processes-flowchart` used `## Principais Conclusões` + `duration: "30 minutos"` — it predates these gates; do **not** copy it.
- **duration**: `"N min"` exactly (`"30 min"`, never `"30 minutos"` / `"30 minutes"`).

---

## Workflow (per lesson — the loop)

1. **Read the source fully** (`en/NN-name.md`), plus this skill and `references/glossary.md`.
2. **Translate in one pass** to `<locale>/NN-name.md`, honoring every invariant above. Translate meaning, not words: this is a technical audience; prefer the established pt-BR / es technical register over literal calques. Keep the didactic voice of the source (direct, second person where the source uses it, explicit about failure modes).
3. **Self-check** before reporting done — all three tools, in this order:
   - `OPENCODE_FILE_PATH=<target> python3 .opencode/skills/course-writer/scripts/validate_lesson.py` → **must be exit 0** (legacy courses: error set must equal/be-subset of the EN source's — see Legacy/parity mode)
   - `python3 .opencode/skills/i18n-translator/scripts/verify_translation.py --source <en-file> --target <target-file>` → **must be exit 0** (1 acceptable only for documented warnings; 2 forbidden)
   - `python3 .opencode/skills/i18n-translator/scripts/quality_lint.py --target <target-file>` → **must be exit 0**
   - fix everything any tool reports; re-run until all are clean
4. **Report one line**: path, lines, validate rc, verify rc, lint rc.

Agents doing translation work: write the file directly, run all three tools yourself, fix, then reply with the single status line. Never report success with a non-zero rc.

---

## Course-level workflow (whole course × locale)

1. Ensure `course.json` has a full `<locale>` block (title, description, difficulty capitalized, duration) — see `references/guide.md` §course.json.
2. Translate lesson files in waves of ≤2 agents (rate-limit rule inherited from course-writer ops: 3 parallel agents → task cancellations).
3. After each wave: run all three tools per file yourself; do not trust agent self-reports alone.
4. When all lessons of a locale are green: `OPENCODE_SKILL_DIR=content/courses/<slug> python3 .opencode/skills/course-writer/scripts/validate_course.py` → expect exit 1 with **zero non-locale warnings**, then `python3 .opencode/skills/i18n-translator/scripts/check_locale_course.py --course content/courses/<slug> --locale <loc>` → `OK` line (it runs parity + validator + all three per-file tools). For legacy courses append `--legacy` (validate parity instead of rc 0; the other two tools are unchanged).
5. Add the course:locale pair to the CI loop in `.github/workflows/nextjs.yml`, and run the multi-course simulation (see course-writer skill ops section).
6. A course locale is done only when: every verify_translation rc 0, every quality_lint rc 0, every validate_lesson rc 0 (legacy: no new errors vs EN), course validator rc 1 with locale warnings gone (for the gated locale), check_locale_course `OK`, CI simulation exit 0.

---

## Failure modes (real, seen in this repo)

| Failure | Cause | Prevention |
|---|---|---|
| Prerender crash `data.options.map` | interactive JSON fenced with the wrong fence language | translation must not touch fence languages; verifier compares fence counts per language |
| Silent English leakage | agent translated only headings | verifier flags high English-word ratio in translated prose sections; human spot-check still required per course |
| Broken `{{1}}` placeholders | translator renumbered or deleted blanks | verifier compares placeholder sets per fillblank template |
| Untranslatable code drift | agent "helpfully" translated a SQL comment | code-fence byte-compare in verifier |
| Question id renames | agent localized ids | id set comparison in verifier |
| H1 ≠ title | translated one but not the other | course validator equality check |
| `correctOrder`/`items` divergence in dragdrop | translated the two arrays differently | verifier set-compares them |
| Filename localization | translated `02-aws-foundation…` to `02-fundacion-aws…` | filename comparison in verifier |
| English doc quotes left mid-paragraph | translator treated quoted spans as "citations" | `quality_lint.py` english-quote check (≥6 EN words, ratio ≥0.33) — translate the span, keep the citation tail |
| Heading formula drift across files | each lesson translated the recurring headings independently | locked-formula table in `quality_lint.py` + this skill; normalize mechanically when count > 1 variant |
| `duration: "75 minutes"` shipped in locale | "byte-identical frontmatter" over-applied to a UI string | verifier compares duration **number only**; `quality_lint.py` requires `"N min"` |
| Vosotros forms in ES (`acabaréis`) | register drift (Spain voseo/tuteo mix) | `quality_lint.py` vosotros-form check; contract: neutral tú |
| Frontmatter/heading caseload variants (`Actualizaciones 2026` vs `Actualizaciones de 2026`) | no canonical string in prompt | locked-formula table (skill + glossary + lint) |

---

## Platform chrome (dictionaries — unchanged rules)

Dictionaries live at `dictionaries/{locale}.json` and are flat-keyed JSON objects.

- **Keep all keys identical** across locale files — never add, remove, or rename keys.
- **Only translate string values** — numbers, booleans, and `null` remain unchanged.
- Preserve the exact JSON structure (nesting, arrays, object order).
- Do not add comments or trailing commas.
- If a key does not exist in the target locale, it falls back to `en` at runtime (`lib/i18n/get-dictionary.ts`).

Validation checklist for dictionary changes: `npx tsc --noEmit`; all three files parse as JSON; key structures match; no en-only keys.

---

## Ops rules (inherited, non-negotiable)

- **≤2 task agents per message** (3 rate-limits → cancellations; after a failure, grep-verify files exist, then retry ≤2).
- Agents write files directly and reply ONE line; **you always re-verify yourself** with the two tools.
- Scratch space only under `.scratch/<topic>/` (gitignored); `/tmp` is wiped overnight.
- **NEVER git commit unless the user asks.**
- Exclude `_backup/`, parabola-explorer.md files, investment-topics-advanced.md from any repo-wide operation.
- EN source is never edited by translation work. If a source bug is found, fix the source, rebuild, THEN re-translate the affected lesson.
