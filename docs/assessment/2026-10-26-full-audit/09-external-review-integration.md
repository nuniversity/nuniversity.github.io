# 09 — External Review Integration (Claude Haiku 5.5, 27 Oct 2026)

**Source:** [`docs/claud-haiku-5.5-review-2026-10-27.md`](../../claud-haiku-5.5-review-2026-10-27.md)
**Reviewed against:** commit `b0fc298`, then re-verified against the working tree on 2026-10-27.
**Verdict: the review is accurate and materially better than the internal audit in three places.**

---

## 1. What the review got right, and what it changed

The external review measured the *deployed* artifact rather than reading source. That produced findings my internal audit structurally could not, because I verified by reading code and running local builds — never by asking "what does CI actually publish?"

| # | What the review caught that the internal audit missed | Why it mattered |
|---|---|---|
| 1 | **CI runs `next build`, not `npm run build`** (R-01) | Every gate I built — `postbuild`, `verify-css`, `verify-csp`, media publishing, search indexing — has **never run in production**. The deployed artifact differs from every local build I verified. |
| 2 | **Published size is 937 MB against a 1 GB limit** (R-03) | I measured `out/` once (793 MB) and never re-measured after my own changes. The site is close to being undeployable. |
| 3 | **`Math.random()` during render causes hydration errors** (R-04) | React error #425 on ~294 lesson pages. Invisible to source review and to jsdom tests; only a real browser surfaces it. |
| 4 | **Measured axe contrast failures** (R-08) | I asserted the token layer was "verified" against 12 hand-picked pairs. axe found **674 failing nodes**. My verification was not systematic. |
| 5 | **`spokenText` prop doubled every lesson payload** | A regression *I introduced* in the same session that flagged page weight as a concern. |
| 6 | **CSP blocks the video embeds I had just added** (R-06) | I shipped a feature the policy forbids. Latent only because no content uses it yet. |

### The lesson

> **Verification must run against the artifact CI publishes, not against a local build.**

Three of my own quality gates (`verify-css`, `verify-csp`, the postbuild CSP injection) gave me false confidence because CI bypassed them. I should have treated "does the deployed bytes match what I tested?" as a first-class question.

**Process change adopted:** the build is now a single command (`npm run build`) used identically by a developer, CI, and the size check. The CI workflow additionally asserts the published size.

---

## 2. Verification of the review's findings

Every finding was re-checked against the working tree. Results:

| ID | Review claim | Verified? | Evidence on 2026-10-27 |
|----|--------------|-----------|------------------------|
| R-01 | CI runs `next build` | ✅ **Confirmed** | `.github/workflows/nextjs.yml:82` ran `npx --no-install next build` |
| R-02 | Production serves the 26 Oct build | ⚠️ **Unverifiable here** | No Actions log access. Plausibly caused by R-01 + R-03 |
| R-03 | Published size 937 MB | ✅ **Confirmed, and worse** | `du -sh out` → **925 MB** after partial fixes (was 940 MB) |
| R-04 | Hydration mismatch on 294 pages | ✅ **Confirmed** | `useState(() => shuffle(...))` in 4 widgets |
| R-05 | CSP has `unsafe-eval` | ✅ **Confirmed** | present in the policy |
| R-06 | CSP omits video hosts | ✅ **Confirmed** | `frame-src` listed only PhET |
| R-07 | Bot protection is client-side only | ✅ **Confirmed** | honeypot + throttle are in `Contact.tsx` |
| R-08 | `--foreground-muted` fails AA | ✅ **Confirmed** | `#64748b` on `#f1f5f9` = **4.34:1** (measured) |
| R-09 | Unnamed controls, unfocusable KaTeX | ✅ **Confirmed** | SWOT: 15 buttons, 0 `aria-label`; Library `<select>` unnamed |
| R-10 | CI Node 20 vs engines 22; bad cache glob | ✅ **Confirmed** | `node-version: "20"`, glob `**.[jt]s` |
| R-11 | 23 npm advisories | ✅ **Confirmed** | `npm audit` → 23 |
| R-12 | Dictionaries bundled per page | ✅ **Confirmed** | unchanged |
| R-13 | hreflang points at locale home | ✅ **Confirmed — since fixed** | Per-page alternates landed after `b0fc298` |
| R-14 | Lesson pages download 2.19 MB JS | ✅ **Confirmed** | lazy chunks: mermaid 635 KB, 3dmol 564 KB, recharts 500 KB |
| R-15 | 110 of 138 course/locale pairs waived | ✅ **Confirmed** | `GATE-WAIVERS.md` |
| R-16 | 2,657 KaTeX strict warnings | ✅ **Confirmed** | build output |
| R-17 | Dead `middleware.ts` | ✅ **Confirmed** | 76 lines, never executes |
| R-18 | `daisyui` still a dependency | ✅ **Confirmed** | `package.json:25` |
| R-19 | Audit docs contradict each other | ✅ **Confirmed** | README said "paused after Phase 1" |

**No finding was rejected.** Two were already fixed by work completed after the review's commit (R-13, and the per-page canonical half of R-01's symptom).

---

## 3. The decisive finding: why `out/` is 925 MB

The review named the symptom and the direction; this section adds the measurement.

A representative lesson — `aws-clf-c02/05-shared-responsibility`:

| Artifact | Size |
|---|---:|
| Source Markdown | **85 KB** |
| Emitted HTML | **529 KB** |
| Emitted RSC payload (`.txt`) | **221 KB** |
| **Total per lesson** | **750 KB** |

The lesson body appears **three times** in the published output:

1. **Rendered HTML** — the visible content.
2. **Inline flight data** (`self.__next_f.push`, 40 blocks in one page) — because `MarkdownRenderer` is a `'use client'` component, so its `content` prop is serialised into the React Server Component payload.
3. **The `.txt` RSC payload file** — the same data again, for client-side navigation.

Across 1,343 lesson pages that is roughly **600 MB of duplicated lesson text**.

### The fix

**Make `MarkdownRenderer` a server component.** The rendering already happens server-side; only three pieces genuinely need the client:

- `CopyButton`
- `MathBlock` (dynamic KaTeX)
- `MermaidDiagram` (dynamic Mermaid)

The interactive blocks (`QuestionBlock`, `MatchingQuestion`, …) are *already* client components, so Next.js keeps them as client islands automatically.

Expected result: the `content` prop stops crossing the boundary, the flight data shrinks to the interactive islands, and the `.txt` payload loses the prose.

| Metric | Now | Projected |
|---|---:|---:|
| Lesson HTML | 529 KB | ~180 KB |
| Lesson `.txt` | 221 KB | ~25 KB |
| `out/` total | 925 MB | **~350 MB** |
| Against the 1 GB limit | 92% | 35% |

This is now the **single highest-priority item** in the whole plan — it is a deployment blocker, not an optimisation.

### Secondary contributor: the dictionary prop

`dict` is passed from the server layout into `MarkdownRenderer` and from there into **every** interactive block. A full dictionary (~62 KB) is therefore attached to each of the 6,980 interactive blocks. Splitting the dictionary (R-12) shrinks this too.

---

## 4. Work completed in response to this review

| Review ID | Status | What changed |
|---|---|---|
| **R-01** | ✅ **Fixed** | CI now runs `npm run build` on Node 22. Added: type-check, lint, unit tests, **Python content validators**, advisory `npm audit`, a 1 GB size gate, `pull_request` trigger, `persist-credentials: false`, and the corrected cache glob `**/*.[jt]s`. |
| **R-03** | 🟡 **Partly** | Removed the `spokenText` prop (now extracted from the DOM client-side). 940 → 925 MB. The structural fix is §3, above. |
| **R-04** | ✅ **Fixed** | New `useMountShuffle` hook: source order on the server and first client render, shuffled once after mount. Applied to Matching, BucketDrop, DragOrder and FillBlank. 3 regression tests. |
| **R-05** | ✅ **Partial** | `unsafe-eval` removed from the policy. Hash-based `script-src` still pending. |
| **R-06** | ✅ **Fixed** | One shared policy in `lib/security/csp.mjs`, imported by the layout, the postbuild and the verifier. YouTube/Vimeo added to `frame-src`; `_headers` now generated from the same source so the copies cannot drift. |
| **R-08** | ✅ **Fixed** | `--foreground-muted` → `--slate-550` (5.07:1 on white, 4.62:1 on sunken). Section text colours darkened to ≥4.6:1 (`tools`, `games`, `quizzes`, `library`, `languages`). Footer muted text pinned to a fixed light value (6.96:1). |
| **R-09** | ✅ **Partly** | `aria-label` on the 4 SWOT icon buttons and the Library sort `<select>`. New `FocusableScrollers` component gives overflowing KaTeX blocks, tables, code blocks and Mermaid panes `tabindex="0"` + an accessible name. |
| **R-18** | ✅ **Partial** | `daisyui` removed from `package.json`. |
| R-07, R-10, R-12, R-14, R-15, R-16, R-17, R-19 | ⏳ **Planned** | See §5. |

---

## 5. Updated priority order

| # | Item | Review ID | Why now | Effort |
|---|------|-----------|---------|--------|
| **1** | **`MarkdownRenderer` → server component** | R-03 | **Deployment blocker.** 925 MB of a 1 GB limit. Expected to remove ~575 MB. | 6 h |
| **2** | **Verify CI actually deployed** | R-02 | Open the Actions run for the latest commit; the size gate now fails loudly if R-03 trips it. | 0.5 h |
| **3** | **Split the dictionary per namespace** | R-12 | 267 KB home page; also shrinks the per-block `dict` prop. | 6 h |
| **4** | **Lazy-load Mermaid / KaTeX / 3Dmol** | R-14 | 2.19 MB downloaded on a lesson page. KaTeX (~258 KB) is needed only where maths exists. | 4 h |
| **5** | **Finish the CSP hardening** | R-05 | Hash the inline bootstrap script; drop `unsafe-inline` from `script-src`; narrow `img-src`. Smoke-test Mermaid, 3Dmol, Recharts under the new policy. | 4 h |
| **6** | **Retire content-gate waivers** | R-15 | 110 of 138 pairs are exempt; Spanish is 30 lessons behind English. | ongoing |
| **7** | **Delete `middleware.ts`** | R-17 | 76 dead lines and a third copy of the locale list. | 1 h |
| **8** | **Formspree-side bot protection** | R-07 | Config, not code: enable CAPTCHA + domain allow-list in the Formspree dashboard. | 1 h |
| **9** | **Dependency upgrades** | R-11 | 23 advisories; `katex`, `prismjs`, `react-syntax-highlighter` reach browsers; `next` is a major upgrade. | 4 h + 1 day |
| **10** | **KaTeX strict warnings** | R-16 | 2,657 build warnings. Add a prose-lint rule for dashes inside `$…$`. | 2 h |
| **11** | **Repository hygiene** | R-18 | LICENSE, SECURITY.md, CODEOWNERS, Dependabot config; resolve `ads.txt`. | 1 h |
| **12** | **Audit doc consistency** | R-19 | This document; the README status block. | done |

### Dependencies

```
R-03 (server component)  ──►  R-14 (lazy chunks)   [both touch the markdown layer]
R-12 (dictionary split)  ──►  R-03's secondary win  [dict prop per block]
R-03                     ──►  deploy safety        [1 GB gate]
R-02                     ──►  confirms R-01 worked
```

---

## 6. Additions to the verification standard

These are permanent changes to how this project is validated, derived from the review:

1. **Build through the real command.** `npm run build` everywhere. CI and developers run the same thing.
2. **Assert the published size in CI.** Hard-fail above 1 GB; warn above 900 MB.
3. **Measure the artifact, not the intention.** Page-weight and bundle claims must cite a number from `out/`, not from the Next.js summary table.
4. **Systematic contrast scanning.** Hand-checking a dozen token pairs missed 674 real failures. Use axe (or an equivalent) across a page sample in both themes.
5. **Browser-driven checks for hydration.** jsdom cannot see a hydration mismatch. Any component using `Math.random()`, `Date.now()` or `crypto` during render needs a browser check or a deterministic-render test.
6. **One policy, one source.** Security configuration imported by every consumer, plus a verifier that fails the build on drift.
7. **Re-measure after every performance change.** I reduced JavaScript by 34% and simultaneously grew the published output by 18%. Both were true; I only measured the first.

---

## 7. What this review says about the internal audit

The internal audit (documents 01–08) was strong on **source-level reasoning** — taint tracing, duplication mining, static-export contract verification, dependency triage — and it correctly found the things that source review is good at.

It was weak on **artifact-level measurement**:

- It reported bundle sizes from the Next summary, not from `out/`.
- It measured `out/` once and never again.
- It trusted its own gates without checking that CI ran them.
- It verified contrast by spot-check rather than systematically.

The external review is the better document for those dimensions. Both are retained: 01–08 for remediation detail and design rationale, 09 for the prioritisation that follows from measurement.

---

## 8. Course reading component — formatting review (2026-10-27)

Reported from reading real lessons: blocks that did not line up, words split
with a hyphen, numbers like `4.1` breaking across lines, and wide content with
no way to see it on a phone. This section records what was wrong and the rules
the reading component now follows, so the same defects are not reintroduced.

The component chain under review:

| Piece | File |
|---|---|
| Lesson page shell (breadcrumb, header, card, CTA, nav) | `app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx` |
| Sidebar / split | `components/lessons/LessonOutline.tsx` |
| Content renderer | `components/markdown/MarkdownRenderer.tsx` |
| Prose typography and layout | `app/globals.css` (`@layer components`) |
| Embedded widgets | `components/markdown/*.tsx` |

### 8.1 One column, one left edge

The prose used to be capped at `68ch` and centred **inside** the card, while the
breadcrumb, title, CTA, feedback form, progress bar and previous/next links all
started at the card's left edge. That is a ~175 px stagger between the title and
its own body text, and it is what "not aligned" meant in practice.

An intermediate revision moved tables and code to the full card width while
leaving the text centred — which replaced one stagger with two.

**Rule now:** the card *is* the column. `.prose-measure` has no separate
`max-width`, so prose, lists, tables, code, diagrams, callouts and widgets all
begin at the same x and share the same width. Measured in Chromium at 1440 px:
`h1` 464, card 464, prose/table/code/diagram 497 (the card's 32 px padding).

Hiding the outline hands its width to the lesson: `--lesson-content-max` moves
from 56 rem to 62 rem. The step is deliberately modest — the earlier 56 → 74 rem
jump made the page feel unstable.

### 8.2 Words are never hyphenated, and `4.1` stays on one line

Two declarations were doing damage:

```css
overflow-wrap: anywhere;   /* a break opportunity between every character */
hyphens: auto;             /* visible "-" inside words                  */
```

`anywhere` is what split `4.1` across lines; `hyphens: auto` is what produced
`infor-mação`-style breaks (and `hyphens-auto` was also set on quiz options in
`QuestionBlock.tsx`).

**Rule now:** `overflow-wrap: break-word` + `hyphens: manual` +
`word-break: normal`. `break-word` only breaks a token that cannot fit on a line
of its own — the ARN/URL case — and leaves ordinary words and numbers alone.
`tests/ui/prose-overflow.test.ts` fails the build if `anywhere` or
`hyphens: auto` comes back.

### 8.3 Oversized content scrolls inside itself

| Content | Behaviour |
|---|---|
| Tables | `width: max-content` + `min-width: 100%`; the wrapper scrolls horizontally. Cells hold a 26 rem reading measure (`.prose-cell`), and a table taller than the viewport scrolls vertically with a pinned header. |
| Code | `pre` scrolls horizontally; lines never wrap. `min-width: max-content` keeps long lines intact. |
| Mermaid | Rendered at its natural size, scaled to fit only to 75% — below that the labels stop being readable, so the box pans instead. Zoom (25–400%) and fullscreen remain. |
| KaTeX | Display blocks scroll horizontally. |

Scrollbars are drawn explicitly (`.table-scroll`, `pre`) because overlay
scrollbars stay invisible until the reader has already discovered the gesture.

Every scroll container is focusable and labelled (`role="region"`, `tabindex=0`,
`aria-label`), so the content is reachable without a pointer (WCAG 2.1.1).

### 8.4 Lists, blockquotes and figures share the column

- Lists moved from `list-inside` + `ml-4` to `list-disc` + `pl-6`: bullets hang
  on the column edge and wrapped lines align under the item text instead of
  under the bullet.
- Plain `>` blockquotes had no styling, so they inherited the browser default
  `margin: 1em 40px` and sat 40 px inside the column. They now use a left rule
  on the column edge.
- `figure` had the same 40 px default margin and is reset.
- Raw HTML lists inside callouts get the same 1.5 rem indent as rendered ones.

### 8.5 The title is rendered once

1,267 of 1,298 lessons open with `# <title>` while the page template also
renders that title as its `h1`. Every lesson therefore had two `h1` elements and
showed the title twice. `MarkdownRenderer` takes `pageTitle` and drops a leading
heading that matches it (case and whitespace insensitive).

### 8.6 Currency is not LaTeX

`remark-math` treats two `$` on one line as inline math, so `US$ 499.999` and
`US$ 400` in the same sentence were typeset by KaTeX — and the bold markers
around them leaked out as literal `*`. One AWS table row could render as four
broken formulas. Before the fix: **1,630 mangled math spans across the output**.

`escapeCurrency()` pairs the dollars the way `remark-math` does (per paragraph,
not per line) and classifies each pair. A pair is currency when it contains
markdown emphasis, ends in a dangling operator (`$0.50-$1.00`), contains words,
or is a bare amount. A genuine formula keeps its `$`: it contains `\`, `^`,
`_`, braces or a comparison. Fenced code, inline code, already-escaped `\$`
and `$$` display math are skipped.

After the fix: **22** mangled spans remain, and the math lessons keep their
formulas (verified page by page against a pre-change snapshot).

### 8.7 How this was verified

Reasoning alone produced one wrong answer in this review (the "full-bleed"
layout above), so the layout checks are now measured in a real browser:

- left edges of `h1`, prose, tables, code and diagrams compared at 1440 px and
  390 px;
- `getComputedStyle` asserted for `hyphens`, `overflow-wrap`, `word-break`;
- `document.scrollWidth === innerWidth` asserted (no page-level sideways
  scroll) at both widths;
- `.katex` counts compared before/after the currency change, per page.

The scripts live outside the repository (`/tmp/opencode/measure.mjs`,
`verify.mjs`); the durable guards are the unit tests in `tests/ui/` and
`tests/lessons/`.

### 8.8 Read-aloud: sections, not the whole document

`LessonAudio` collects text from `[data-lesson-content]` and hands it to the
Web Speech API. Three problems followed from that:

1. the control sits *inside* that container, so its own copy — "Listen to this
   lesson", the hint, "Reading aloud…" — was collected and spoken first;
2. it always read the entire lesson, which for a long lesson is 30k+
   characters of audio;
3. when the browser had no voice for the lesson language, it silently used
   another one and pronounced everything wrong.

**Rules now:**

- the control is marked `data-lesson-audio` and `collectSpokenText()` skips that
  subtree; the score summary is marked `data-audio-skip` for the same reason;
- playback queues two utterances: a one-line confirmation
  (`lesson.listen_intro`, localised) and then the selected text;
- a picker offers **the section being read**, **the whole lesson**, or any
  specific `h2`/`h3` in the lesson. The section list is built from the same
  selector the outline uses (`h2[id], h3[id]`), so the two always agree;
- a section runs from its heading to the next heading of the same or a higher
  level, so an `h2` includes its `h3` subsections and picking an `h3` reads only
  that subsection;
- choosing another section while listening restarts playback with it;
- when the browser reports voices but none for the lesson language (for
  example Portuguese and English installed, Spanish lesson), an amber note
  explains why the pronunciation is wrong and where to install a voice.
  `lesson.listen_voice_missing` is localised.

Verified end-to-end in Chromium by intercepting `speechSynthesis.speak`:

```
es page, voices pt-BR + en-US   -> note visible (Spanish text)
es page, voices es-ES + en-US   -> note hidden
pt page, 53 picker options      -> ["A seção que estou lendo", "A lição inteira", "1. …", "1.1 …"]
choose "1.1 O candidato alvo"   -> intro + 395 chars, starts with that heading
                                (whole lesson = 38,595 chars)
```

**Controls.** Play/pause, restart (↺) and stop (■) are always mounted; restart
and stop are disabled while nothing is playing, so they are discoverable rather
than appearing out of nowhere. Restart re-queues the current selection from its
first word. Status text is localised (`listen_reading`, `listen_paused`).

**One CSS interaction found on the way:** `.prose-measure p { text-wrap: pretty }`
outranks Tailwind's `.truncate` utility (same property, higher specificity), so
the single-line labels inside the lesson wrapped to three lines on a phone.
`globals.css` now restores `nowrap` for `.prose-measure .truncate`; the mobile
widget went from 161 px to 89 px tall.

`tests/lessons/lesson-audio.test.tsx` covers text collection, the picker
options, section boundaries (including nesting), current-section resolution, the
voice note and the stop/restart states. Known limitation, unchanged: Chrome
stops very long utterances after roughly 15 seconds on some versions —
per-section playback makes that far less likely to matter.
