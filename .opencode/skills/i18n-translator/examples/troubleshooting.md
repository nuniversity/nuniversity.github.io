# Troubleshooting catalog (real failures from this repo)

## 1. `Fence count mismatch for 'question': source N vs target M`

**Symptom:** verify_translation exits 2 right after a translation wave.
**Root cause:** agent re-fenced an interactive block (e.g. turned a
```question into ```text, or dropped a plot).
**Fix:** diff fence openers between source and target
(`grep -c '^```question$'` per file, all languages); restore the source's
fence language per block. The lesson template in `../assets/` shows the five
interactive fences.

## 2. `Question id sequence differs`

**Symptom:** ids missing, renamed (e.g. `dbl-01-q1` → `dbl-01-p1`) or reordered.
**Root cause:** agent localized an id, or deleted a question to "shorten".
**Fix:** `diff <(grep -o 'dbl-[0-9][0-9]-q[0-9]*' en/X.md) <(grep -o … pt/X.md)`
— restore until identical. Ids are the join key for analytics; never change.

## 3. `fillblank … placeholder set differs`

**Symptom:** `{{2}}` missing or renumbered to `{{1}}` in the translated template.
**Root cause:** translator rewrote the sentence and dropped a blank.
**Fix:** restore the same NUMBER of blanks; reorder freely, renumber never.
Also check `answers` keys still match the placeholders.

## 4. `target correctOrder is not a permutation of target items`

**Symptom:** dragdrop self-quiz would be unsolvable in the target locale.
**Root cause:** items translated one way, correctOrder another (two different
wordings of the same string).
**Fix:** make `correctOrder` strings byte-equal to the matching `items`
strings (translate once, copy everywhere).

## 5. `Code fence #k in ```sql differs (must be identical)`

**Symptom:** a SQL/Python/YAML body changed.
**Root cause:** agent translated a comment or reformatted whitespace.
**Fix:** copy the source fence body byte-for-byte. Prose around the fence is
where the translation lives.

## 6. `URL set differs (missing …)`

**Symptom:** a docs link was localized (`docs.databricks.com` →
`docs.databricks.com.br`) or dropped from a callout.
**Fix:** URLs are identifiers; restore exactly, including trailing slashes
and UTM-less clean forms as in source.

## 7. `Target H1 does not equal target frontmatter title`

**Fix:** make them byte-equal (validator enforces). Translate once, use twice.

## 8. `Possible untranslated English prose (marker ratio …)` — WARNING only

**Root cause:** heavy locked terminology (kept per glossary) or an actually
untranslated paragraph.
**Action:** if the warning accompanies clean structure, it is usually the
glossary's English terms doing their job — accept rc 1. If entire paragraphs
are English, re-translate those sections.

## 9. validate_lesson: `Missing '## Practice Questions' section`

**Root cause:** translated the heading fully (`## Preguntas de Prática`) and
dropped the English literal.
**Fix:** dual-heading pattern — `## Preguntas de Prática (Practice Questions)`.

## 10. Task cancelled mid-wave (agent transport)

**Symptom:** `Task cancelled` for one or both agents of a wave.
**Action (per ops rules):** check whether the target files landed
(`ls -la <locale>/`); if a file exists, verify it yourself with both tools —
often complete despite the cancellation. Retry only the missing files, one
or two agents. Never assume loss without checking the filesystem first.

## 11. Whole-course check after a locale finishes

```bash
python3 .opencode/skills/i18n-translator/scripts/check_locale_course.py \
  --course content/courses/<slug> --locale pt
```
Exit 2 = fix before touching CI. Exit 0/1 = ready to add
`<course>:pt` to the CI loop in `.github/workflows/nextjs.yml`.

## 12. `quality_lint [english-quote]` — English quote left mid-paragraph

The most common shipped defect (204 pt + 330 es hits on first dbl audit;
56/89 real doc-quote spans). A translated paragraph still contains a verbatim
English excerpt: `se persisten «in a scalable key-value store (RocksDB)…»`.

Fix: translate the span, keep the citation tail and product names:
`se persistem "em um store chave-valor escalável (RocksDB) no checkpoint location"`
`(docs .../auto-loader, 2026-09-11)`. Never "fix" by deleting the quote.
The check: quoted span ≥6 English words, stopword ratio ≥0.33, outside code.

## 13. `quality_lint [case-studies-heading|updates-heading|did-you-know|verdict-heading]`

Recurring headings translated freely per lesson → 4 ES variants of the same
section (`Casos de la vida real`, `Casos de estudio del mundo real`, …) and
two ES stamp variants (`(a octubre…)` vs `(en octubre…)`). Root cause was the
template teaching `(a outubro de 2026)` — now locked. Fix mechanically with a
`str.replace` sweep over the locale dir, then re-run quality_lint until 0.
Canonical strings: glossary §Locked heading formulas.

## 14. `quality_lint [duration-format]`

Frontmatter `duration: "75 minutes"` is a **rendered UI string** — it must be
localized to `"75 min"` (both pt and es). The verifier only compares the
number. Sweep: `re.sub(r'^duration: "(\d+) minutes?"$', r'duration: "\1 min"',
text, flags=re.M)` across `*/pt/*.md` and `*/es/*.md`.

## 15. `quality_lint [vosotros-form]`

ES file uses Spain-register verbs (`acabaréis`, `vosotros`). Contract is
neutral tú: `acabarás`. Watch for the false positive `dieciséis` (ends in
`-éis`; the linter whitelists it).

## 16. Whole-course gate is now three tools per file

```bash
# per file: validate_lesson (rc 0) + verify_translation (rc 0/1) + quality_lint (rc 0)
# one command runs all three plus parity:
python3 .opencode/skills/i18n-translator/scripts/check_locale_course.py \
  --course content/courses/<slug> --locale es
```
`OK: … parity + gates green` (rc 0) is the only acceptable final state;
rc 1 only for documented verify warnings; rc 2 = fix before CI.

## 17. Legacy course fails every gate even when the translation is perfect

The 10 `intro-to-software-engineering` roadmap courses (and `processes-flowchart`)
predate the validator: their **EN sources** fail `validate_lesson` (0 practice
questions) and predate the dual-heading/duration rules. Do not "fix" the target
by inventing sections EN does not have — use parity mode:

```bash
# per file: verify (source-aware) + quality_lint (auto EN-parity) are hard gates;
# validate: diff LESSON ERROR lines vs the EN source — target ⊆ source
# whole course:
python3 .opencode/skills/i18n-translator/scripts/check_locale_course.py \
  --course content/courses/processes-flowchart --locale es --legacy
```

Symptoms of mode mismatch: `quality_lint [dual-headings]` on a file whose EN
source has no Practice Questions (source not derived → check the order-prefix
fallback), or `check_locale_course` failing `validate_lesson rc=2` for errors
the EN file also has (missing `--legacy`). ES targets use
`## Conclusiones Clave (Key Takeaways)` and `duration: "N min"` — the shipped
PT sibling's `## Principais Conclusões` / `"30 minutos"` predates the gates.
