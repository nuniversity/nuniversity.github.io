# 06 — Deep Assessment: The Courses App, Media & Interactive Learning

**Audit date:** 2026-10-27
**Scope:** The course/lesson experience end to end — content pipeline, markdown rendering, media handling, diagram capability, authoring tooling, and the prose layout.
**Baseline:** 1,299 lesson Markdown files · 49 courses · 2,738 Mermaid blocks · 5,783 interactive question blocks · 1 media asset on disk.

---

## 1. Executive summary

The Courses app is **structurally strong and visually starved**.

The platform has an unusually rich interactive vocabulary — `question` (5,783), `matching` (403), `fillblank` (320), `dragdrop` (293), `plot` (144), plus Mermaid (2,738) and a real charting library. That is a genuine competitive advantage over a typical documentation site.

But the **media layer is effectively absent**:

| Capability | Built? | Used in content? |
|---|---|---|
| Mermaid diagrams | ✅ | ✅ 2,738 (81% of lessons) |
| Interactive charts | ✅ | ✅ 144 |
| Interactive question blocks | ✅ | ✅ 6,980 |
| **Images** | ⚠️ renderer supports `<img>` | ❌ **1 asset on disk, 0 published, 0 referenced** |
| **Video embeds** | ❌ not built | ❌ **0** |
| **Text-to-audio** | ❌ not built | ❌ **0** |
| **Lightbox / image zoom** | ❌ not built (docs claim it) | ❌ |
| **Richer diagrams** | ✅ mermaid-js supports ~15 types | ⚠️ content uses 9; the authoring skill teaches only 5 |

And the **prose layout is fragile**: there is no `overflow-wrap` control anywhere in the stylesheet, and code blocks use `overflow-visible`, so long lines push the whole page wide.

**Five concrete root causes**, each with a fix:

1. **Media is never published.** `content/courses/**/media/` is not copied into the build output, and the one PNG that exists is referenced by no lesson. Even if an author added an image, it would 404.
2. **The renderer has no media components.** No video, no lightbox, no audio.
3. **The authoring skill has no media vocabulary.** `course-writer/skill.md` never mentions images or video — so the agent never produces them.
4. **The authoring skill teaches 5 of the ~15 Mermaid types** the platform's own `mermaid-js` skill documents in detail.
5. **No prose overflow control**, so long identifiers and URLs break the layout.

---

## 2. Evidence

### 2.1 Media: built ≠ published ≠ used

```
lessons referencing any media : 76 / 1,299   (5.9%)
external video links          : 0
media files on disk           : 1  (content/courses/intro-to-data-engineering/en/media/data-engineering-lifecycle.png)
media files in out/          : 0  ← never published
lessons referencing that file : 0
```

The single PNG is **orphaned**: it exists on disk, no lesson references it, and the build does not copy it. The published media count for the entire platform is therefore **zero**.

**Root cause** — the content pipeline has no media step:

```
scripts/generate-search-index.mjs   index only
scripts/postbuild.mjs               canonicals + 404 stub + sitemap
scripts/verify_out.mjs              output verification
```

Nothing copies `content/**/media/` into `public/`, and `next.config.js` sets `images.unoptimized: true` (required for static export), so `next/image` cannot optimise them either.

### 2.2 The renderer has no media components

`components/markdown/MarkdownRenderer.tsx` component overrides:

| Element | Present |
|---|---|
| `h1`–`h4`, `p`, `ul`, `ol`, `li`, `pre`, `code`, `blockquote`, `table`, `thead`, `th`, `td`, `hr`, `img`, `strong`, `em` | ✅ |
| Video / iframe / YouTube | ❌ |
| Audio / text-to-speech | ❌ |
| Lightbox (image zoom) | ❌ |
| Figure / figcaption | ❌ |

The `img` override is minimal and has two defects:

```tsx
701:  img: ({ src, alt }) => (
702:    <div className="my-6">
703:      <img src={src} alt={alt || ''} className="rounded-lg max-w-full h-auto shadow-lg" />
704:      {alt && <p className="text-center text-sm text-muted-foreground mt-2">{alt}</p>}
705:    </div>
706:  ),
```

- **Line 704 duplicates the alt text visibly.** The `alt` attribute is *already* exposed to assistive technology; rendering it again as a visible caption repeats it for screen-reader users and produces redundant visual text for sighted users (alt text is usually written for screen readers, not as a caption).
- No `loading="lazy"`, no `decoding="async"`.
- No click-to-zoom, despite `docs/features/MARKDOWN-RENDERER.md:119` promising *"Click to zoom functionality"*.

### 2.3 Prose layout has no overflow control

```
$ grep -n "overflow-wrap|word-break|break-words|break-all|hyphens" app/globals.css
(no matches)
```

And the paragraph/list overrides carry no wrapping class:

```tsx
411:  p: ({ children }) => <p className="mb-4 leading-7 text-foreground/90">{children}</p>,
415:  li: ({ children }) => <li className="leading-7 text-foreground/90">{children}</li>,
```

**290 unbreakable strings** of ≥70 characters exist in the content (ARNs, absolute paths, long identifiers). Any that land in prose — rather than inside a code block — will overflow their container and force horizontal page scroll.

The code-block override makes this worse:

```tsx
447:  pre: ({ children }) => <div className="not-prose overflow-visible">{children}</div>,
```

`overflow-visible` means a long code line is **not** clipped or scrolled — it expands its container, widening the entire page. A code block should scroll *within itself*.

### 2.4 The authoring skill has no media vocabulary

```
$ grep -niE "image|video|asset" .opencode/skills/course-writer/skill.md
(no matches)
```

`course-writer/skill.md` teaches (lines 38–43):

- ≥4 Mermaid diagrams
- ≥2 interactive blocks
- interactive charts (`plot`)

It **never mentions images, screenshots, video, or any binary asset**. The agent therefore never produces them — the platform's media capability is absent because the *instruction* is absent, not because the agent ignored it.

The lesson template (`.opencode/skills/course-writer/references/lesson-template.md:114`) likewise only sketches a section as *"concept + table + mermaid diagram"*.

### 2.5 The authoring skill teaches 5 of ~15 Mermaid types

`course-writer/skill.md:67`:

> Keep diagrams ≤ ~40 nodes; prefer `flowchart TD`, `sequenceDiagram`, `stateDiagram-v2`, `architecture-beta`, `gantt` where natural.

Meanwhile the platform's own `.opencode/skills/mermaid-js/` is **exhaustive** — 1,135-line `skill.md` plus 15 reference files documenting:

`quadrantChart` · `sankey-beta` · `xychart-beta` · `block-beta` · `timeline` · `architecture` / C4 · `gitgraph` · `journey` · `mindmap` · `erDiagram` · `classDiagram` · `stateDiagram` · `sequenceDiagram` · `gantt` · `flowchart` · `styling-configuration`

The capability exists and is well documented — **the course-writer skill simply does not point at it.** Content usage confirms the gap:

| Type | Blocks in content |
|------|------------------:|
| flowchart | 2,226 |
| sequenceDiagram | 228 |
| graph | 89 |
| classDiagram | 84 |
| stateDiagram | 39 |
| pie | 27 |
| timeline | 24 |
| mindmap | 9 |
| erDiagram | 9 |
| gantt | 3 |

`quadrantChart`, `sankey`, `xychart`, `block`, `architecture`, `gitgraph`, `journey` → **0 uses**.

### 2.6 No text-to-audio

```
$ grep -rn "speechSynthesis|SpeechSynthesisUtterance" app components lib
(no matches)
```

The Web Speech API is available in every target browser and needs no dependency, but nothing uses it.

---

## 3. Findings register

| ID | Finding | Severity | Category | Evidence | Effort |
|----|---------|----------|----------|----------|--------|
| **CRS-01** | Content media is never published — images always 404 | **High** | Architecture | no media step in `scripts/`; `find out -name "*lifecycle*"` → 0 | 2 h |
| **CRS-02** | Prose has no `overflow-wrap`; 290 long strings break the layout | **High** | UX/UI · Accessibility | `grep overflow-wrap app/globals.css` → 0 | 1 h |
| **CRS-03** | Code blocks use `overflow-visible`, widening the whole page | **High** | UX/UI | `MarkdownRenderer.tsx:447` | 0.5 h |
| **CRS-04** | No video embed support | **High** | Educational | 0 video links in 1,299 lessons | 3 h |
| **CRS-05** | The authoring skill never mentions images or video | **High** | Content pipeline | `grep -iE "image\|video" course-writer/skill.md` → 0 | 1 h |
| **CRS-06** | The authoring skill teaches 5 of ~15 Mermaid types | Medium | Content pipeline | `course-writer/skill.md:67` vs `mermaid-js/references/` (15 files) | 1 h |
| **CRS-07** | No text-to-audio | Medium | Educational · Accessibility | `grep speechSynthesis` → 0 | 2 h |
| **CRS-08** | `img` renders the alt text twice (attribute + visible caption) | Medium | Accessibility · UX/UI | `MarkdownRenderer.tsx:703-704` | 0.5 h |
| **CRS-09** | No image zoom / lightbox (docs promise it) | Medium | UX/UI | `docs/features/MARKDOWN-RENDERER.md:119`; no implementation | 2 h |
| **CRS-10** | Mermaid has no design system — default theme only | Medium | UX/UI | `MarkdownRenderer.tsx:166-176` `theme: 'default'` | 2 h |
| **CRS-11** | `docs/features/MARKDOWN-RENDERER.md` describes features that do not exist | Low | Documentation | "Click to zoom"; "Blue-to-purple gradient header" | 1 h |
| **CRS-12** | No `figure`/`figcaption` semantics for media | Low | Accessibility | renderer has no `figure` override | 0.5 h |

**Zero Critical.** The platform's *security* posture remains strong; these are capability and quality gaps.

---

## 4. Remediation plan

### Phase A — Prose & layout robustness *(CRS-02, CRS-03, CRS-08, CRS-12)*

1. Add a `overflow-wrap` baseline to the prose layer:
   ```css
   .prose-measure :where(p, li, td, th, h1, h2, h3, h4, blockquote) {
     overflow-wrap: anywhere;
     hyphens: auto;
   }
   ```
   `anywhere` (not `break-word`) also breaks inside long URLs, which `break-word` does not.
2. Change the `pre` override from `overflow-visible` to `overflow-x-auto` so code scrolls within its own block.
3. Give the `img` override real `<figure>` / `<figcaption>` semantics, `loading="lazy"`, `decoding="async"`, and stop rendering the alt text as a visible caption.
4. Add `min-w-0` to flex children that hold long text.

### Phase B — Media pipeline *(CRS-01, CRS-04)*

5. **Publish content media.** A prebuild step copies `content/media/**` → `public/media/**`. Authors reference media by **absolute path** (`/media/<course>/<file>.png`), which needs no rewriting and cannot break.
6. **Video embeds.** Add a `video` fence with a JSON config (`provider`, `id`, `title`, `start`) and a renderer component that emits a privacy-preserving, cookie-less YouTube embed (`youtube-nocookie.com`) or a native `<video>` for local files. Support `start`/`end` timestamps.
7. **Auto-embed bare links.** A bare YouTube/Vimeo URL in prose becomes an embedded player; the original link stays as a fallback.

### Phase C — Interactivity & accessibility *(CRS-07, CRS-09)*

8. **Text-to-audio.** A lesson-level "Listen" control using `window.speechSynthesis`, speaking the lesson title and body in the page's locale, with play/pause/stop and a rate control. Voice selection prefers a matching-locale voice.
9. **Image lightbox.** Clicking an image opens a full-screen viewer with keyboard navigation (Esc to close, arrows to move) and focus restoration.

### Phase D — Diagram capability *(CRS-10)*

10. Give Mermaid a **brand-aligned theme** — a `themeVariables` block derived from the site tokens, plus `fontFamily` matching the UI font. Diagrams then look designed rather than default.
11. Add a **`mermaid` block option** for a "focus" layout (the diagram fills the reading measure and supports the existing zoom).

### Phase E — Authoring & documentation *(CRS-05, CRS-06, CRS-11)*

12. Extend `course-writer/skill.md` with a **media section**: when to include an image, how to reference it (`/media/<course>/<file>`), when to embed a video, and the video config schema.
13. Extend `course-writer/skill.md` to point at the full `mermaid-js` type list, with a table of which type fits which concept, and explicitly require *variety* (not four flowcharts).
14. Rewrite `docs/features/MARKDOWN-RENDERER.md` so it describes what the renderer actually does.

---

## 5. Expected outcomes

| Metric | Before | After |
|--------|-------:|------:|
| Lessons with any media | 76 (5.9%) | 100% of new content; pipeline unblocked for all |
| Published media assets | 0 | every file in `content/media/` |
| Video embeds | 0 | supported, with a per-lesson recipe |
| Long-string layout overflows | 290 strings unguarded | 0 |
| Code blocks widening the page | yes | no |
| Mermaid types the authoring skill teaches | 5 | 15 |
| Text-to-audio | none | lesson-level, locale-aware |
| Image zoom | documented, absent | implemented, keyboard-accessible |

---

## 6. Risks

| Risk | Mitigation |
|------|------------|
| Copying media into `public/` bloats the repository | `public/media/` is gitignored and generated at prebuild, exactly like `public/search-index/` |
| Video embeds hurt privacy / performance | Use `youtube-nocookie.com`, `loading="lazy"`, and a click-to-load facade so no third-party request happens until the learner asks |
| Text-to-audio is jarring or unwanted | Off by default, one explicit control per lesson, respects `prefers-reduced-motion` |
| Mermaid theming breaks existing diagrams | Ship the theme behind a token-driven config and keep `securityLevel: 'strict'` |
| The authoring skill produces too many assets | Set explicit per-lesson budgets and validate asset counts in the lesson validator |

---

## 7. Appendix — current fence vocabulary

| Fence | Component | Count | Notes |
|-------|-----------|------:|-------|
| `question` | `QuestionBlock` | 5,783 | multiple-choice / true-false |
| `python` | Syntax highlighter | 5,199 | |
| `mermaid` | `MermaidDiagram` | 2,738 | zoom + fullscreen, `securityLevel: 'strict'` |
| `sql` | Syntax highlighter | 2,054 | |
| `text` | plain | 1,613 | |
| `rust` | Syntax highlighter | 1,002 | |
| `bash` | Syntax highlighter | 610 | |
| `json` | Syntax highlighter | 465 | |
| `matching` | `MatchingQuestion` | 403 | dnd-kit |
| `yaml` | Syntax highlighter | 335 | |
| `fillblank` | `FillBlankQuestion` | 320 | dnd-kit |
| `dragdrop` | `DragOrderQuestion` | 293 | dnd-kit |
| `plot` | `SciencePlot` | 144 | Recharts, dynamic import |
| `javascript` | Syntax highlighter | 130 | |
| `toml` | Syntax highlighter | 73 | |
| `typescript` | Syntax highlighter | 48 | |
| `ini` | Syntax highlighter | 36 | |
| `markdown` | Syntax highlighter | 27 | |
| `hcl` | Syntax highlighter | 16 | |
| `interactive` | dispatch | 12 | |
| `diagram` | plain | 12 | |
| `java` | Syntax highlighter | 9 | |
| `dockerfile` | Syntax highlighter | 8 | |
| `makefile` | Syntax highlighter | 6 | |
| `gitignore` | Syntax highlighter | 6 | |
| `properties` | Syntax highlighter | 4 | |
| `xml` | Syntax highlighter | 3 | |
| `text`/`txt` | plain | 6 | |

**Not yet in use but available:** `quadrantChart`, `sankey-beta`, `xychart-beta`, `block-beta`, `timeline`, `architecture`/C4, `gitgraph`, `journey` — all documented in `.opencode/skills/mermaid-js/references/advanced-diagrams-syntax.md`.
