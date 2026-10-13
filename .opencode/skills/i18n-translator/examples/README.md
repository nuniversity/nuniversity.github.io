# Examples — how to use them

| File | What it is | When to read |
|---|---|---|
| `paired-excerpt.md` | Annotated EN / PT / ES excerpts of the same passage, showing every invariant class handled correctly (dual heading, callout, code fence, question JSON, mermaid, date stamp) | Before your first translation; when unsure about a construct |
| `troubleshooting.md` | Catalog of real failures seen in this repo, their exact symptom, root cause and fix | When a tool reports an error you don't understand; before retrying a failed wave |

Related deterministic tools:

- `../scripts/verify_translation.py` — per-file invariant comparator
- `../scripts/check_locale_course.py` — per-course locale parity + gates aggregator

Related templates/schemas: `../assets/lesson-template.{pt,es}.md`,
`../assets/interactive-types.schema.md`, `../assets/course-locale.schema.json`.

Rule of thumb: **if a construct is not shown in the template or the paired
excerpt, and it contains an identifier, a number, a URL or code — keep it
byte-identical and ask.** Guessing is how builds break.
