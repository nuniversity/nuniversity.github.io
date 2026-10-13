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
