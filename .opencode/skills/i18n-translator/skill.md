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
| `scripts/` | Deterministic tools: `verify_translation.py` (per-file invariant comparator), `check_locale_course.py` (per-course locale parity + gates aggregator). Both exit 0/1/2. |
| `assets/` | Templates & schemas: `lesson-template.pt.md`, `lesson-template.es.md` (complete skeletons with all 5 interactive types), `interactive-types.schema.md` (authoritative JSON shapes with [INV]/[TR] legend), `course-locale.schema.json` (course.json locale-block contract). |
| `references/` | Documentation: `glossary.md` (locked terminology EN→PT/ES — binding). |
| `examples/` | `paired-excerpt.md` (annotated EN/PT/ES passage), `troubleshooting.md` (real failure catalog), `README.md` (when to use what). |

Every translation task: read the contract here, the glossary, the relevant template + paired excerpt; after writing, run the two scripts. Troubleshooting errors → the catalog first.

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
| Frontmatter `order`, `difficulty`, `duration` | byte-identical (`difficulty` stays lowercase English enum: beginner/intermediate/advanced — the renderer and validator require it) |
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

### NEVER translate

- Product/service/feature names: Databricks, Unity Catalog, Delta Lake, Auto Loader, Lakeflow, Lakeview, Photon, MLflow, DBU, AWS service names (Amazon S3, Kinesis, MSK, Glue, Athena, Redshift, Lake Formation, QuickSight/Quick Suite), GitHub Actions, Terraform, Apache Airflow, Kafka, dbt, Python, SQL keywords.
- Industry terms where the English term IS the professional term in pt/es engineering usage: data lakehouse, bronze/silver/gold (gloss on first use: "camada bronze (raw)" is fine), checkpoint, cluster, notebook, pipeline, dashboard, job, repo, commit, pull request, workload, token, endpoint.
- Identifiers inside code, paths, CLI commands, API names,ARNs,ARN-like strings, filenames.
- The validator literals inside headings (see Dual-Heading Pattern).

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

## Workflow (per lesson — the loop)

1. **Read the source fully** (`en/NN-name.md`), plus this skill and `references/glossary.md`.
2. **Translate in one pass** to `<locale>/NN-name.md`, honoring every invariant above. Translate meaning, not words: this is a technical audience; prefer the established pt-BR / es technical register over literal calques. Keep the didactic voice of the source (direct, second person where the source uses it, explicit about failure modes).
3. **Self-check** before reporting done:
   - `OPENCODE_FILE_PATH=<target> python3 .opencode/skills/course-writer/scripts/validate_lesson.py` → **must be exit 0**
   - `python3 .opencode/skills/i18n-translator/scripts/verify_translation.py --source <en-file> --target <target-file>` → **must be exit 0**
   - fix everything both tools report; re-run until clean
4. **Report one line**: path, lines, verify rc, validator rc.

Agents doing translation work: write the file directly, run both tools yourself, fix, then reply with the single status line. Never report success with a non-zero rc.

---

## Course-level workflow (whole course × locale)

1. Ensure `course.json` has a full `<locale>` block (title, description, difficulty capitalized, duration) — see `references/guide.md` §course.json.
2. Translate lesson files in waves of ≤2 agents (rate-limit rule inherited from course-writer ops: 3 parallel agents → task cancellations).
3. After each wave: run both tools per file yourself; do not trust agent self-reports alone.
4. When all lessons of a locale are green: `OPENCODE_SKILL_DIR=content/courses/<slug> python3 .opencode/skills/course-writer/scripts/validate_course.py` → expect exit 1 with **zero non-locale warnings**.
5. Add the course:locale pair to the CI loop in `.github/workflows/nextjs.yml`, and run the multi-course simulation (see course-writer skill ops section).
6. A course locale is done only when: every lesson validator rc 0, every verify_translation rc 0, course validator rc 1 with locale warnings gone (for the gated locale), CI simulation exit 0.

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
