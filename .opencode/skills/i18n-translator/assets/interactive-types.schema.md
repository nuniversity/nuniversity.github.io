# Interactive JSON types — translation schema reference

Authoritative shapes. `validate_lesson.py` (course-writer) parses all of these
as JSON; `verify_translation.py` (i18n) enforces the marked invariants.
Renderer routes by **fence language**, never by the `type` field.

Legend: **[INV]** = invariant across locales (byte-identical or set-identical).
**[TR]** = translate the string value only.

## question (fence: ```question)

```json
{
  "id": "dbl-01-q1",              // [INV] id, identical
  "type": "multiple-choice",      // [INV] multiple-choice | true-false
  "question": "…",                // [TR]
  "options": ["…", "…"],          // [TR] strings; COUNT [INV]
  "correct": 1,                   // [INV] 0-based index
  "explanation": "…"              // [TR]
}
```
`true-false` uses `"options": ["True", "False"]` — **[INV]** (literal English booleans; the widget expects them).

## matching (fence: ```matching)

```json
{
  "id": "dbl-01-q2",              // [INV]
  "type": "matching",             // [INV]
  "question": "…",                // [TR]
  "pairs": [                      // count [INV]
    { "left": "…", "right": "…" } // [TR] both sides
  ],
  "explanation": "…"              // [TR]
}
```

## fillblank (fence: ```fillblank)

```json
{
  "id": "dbl-01-q3",              // [INV]
  "type": "fillblank",            // [INV]
  "question": "…",                // [TR]
  "template": "… {{1}} … {{2}} …",// placeholders {{N}} [INV] as a SET per template
  "answers": { "1": "…", "2": "…" }, // keys [INV] ("1","2"…), values [TR]
  "distractors": ["…", "…"],      // [TR]; MUST be a flat string array [INV shape]
  "explanation": "…"              // [TR]
}
```
**Never** write distractors as `{"1": [...]}` — crashes the site build.

## dragdrop (fence: ```dragdrop)

```json
{
  "id": "dbl-01-q4",              // [INV]
  "type": "dragdrop",             // [INV]
  "question": "…",                // [TR]
  "items": ["…", "…"],            // [TR] strings; COUNT [INV]
  "correctOrder": ["…", "…"],     // [TR] translated identically to items,
                                  // same logical order; length [INV];
                                  // must be a permutation of items
  "explanation": "…"              // [TR]
}
```

## plot (fence: ```plot)

```json
{
  "id": "dbl-01-q5",              // [INV]
  "type": "plot",                 // [INV] line|bar|scatter|pie
  "question": "…",                // [TR]
  "title": "…",                   // [TR]
  "xLabel": "…",                  // [TR]
  "yLabel": "…",                  // [TR]
  "data": [ { "x": "…", "y": 1 } ],  // [INV] byte-identical
  "dataKeys": ["y"],              // [INV]
  "xKey": "x",                    // [INV] if present; there is NO yKey
  "explanation": "…"              // [TR]
}
```

## Cross-cutting

- All closing fences BARE ` ``` ` [INV].
- Fence language must equal the component family [INV].
- JSON key set and nesting [INV] — only string values change.
- Numbers inside strings (limits, prices, "48 hours") stay digit-identical [INV].
