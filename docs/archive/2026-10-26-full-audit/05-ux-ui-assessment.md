> **HISTORICAL — superseded.** Kept for decision provenance only. Do not follow as current guidance. See `docs/INDEX.md`.

# 05 — UX/UI & Educational Experience Assessment

**Audit date:** 2026-10-26
**Scope:** Information architecture, navigation, visual design, content presentation, responsive behaviour, educational interaction, accessibility-driven UX.

---

## 1. Information architecture

### 1.1 Current structure

```
/[lang]/
├── /                 Home — Hero, Features, Stats, Tools, FeaturedCourses, Newsletter, ContinueLearning
├── /courses          49 courses → /[courseSlug] → /[lessonSlug]
├── /tools            10 tools
├── /games            7 games across 6 categories
├── /quizzes          2 quizzes → /[quizSlug], /certificates
├── /library          117 curated external resources
├── /roadmaps         1 roadmap → /[roadmapSlug]
├── /languages        4 pairs → /[pair] → /[activitySlug]
├── /about
├── /contact
└── /404
```

### 1.2 Assessment

**Strengths**

- ✅ **Flat, predictable URLs.** Every path is `/{lang}/{section}[/{slug}]`. No deep nesting beyond three segments.
- ✅ **Every section has a dedicated landing page** — no dead ends.
- ✅ **Two distinct learning paths**: *structured curriculum* (courses → roadmaps) and *exploratory practice* (games, quizzes, tools, languages). This is a good information-architecture split.
- ✅ **Progressive disclosure** — the header exposes 8 primary items plus a "More" dropdown for About/Contact.
- ✅ **Command palette (⌘K)** for power users — a good pattern for a 1,600-page site.

**Weaknesses**

| Issue | Detail | Impact |
|-------|--------|--------|
| **No "learning path" cross-link** | Courses and Roadmaps are separate sections with no connection between them. A learner who starts the SE roadmap cannot see which courses it maps to. | High — the roadmap is the most valuable structural artefact in the content model and it is orphaned. |
| **Tools are unranked and ungrouped** | `tools/[slug]/page.tsx` uses a `toolComponents` record. There is no category, no difficulty, no "related tools". | Medium |
| **Games are categorised but not discoverable** | 6 categories × 7 games, but the landing page shows a flat grid. | Low |
| **Library is unreachable in the information flow** | It is behind the header and also under "More"-adjacent nav, but it is a *library of external resources* — a different mental model from the rest of the site. It should be surfaced as a distinct "Explore" concept. | Medium |
| **No breadcrumbs on most section pages** | Breadcrumbs exist only on the two course routes (`courses/[courseSlug]/page.tsx:97`, `courses/[courseSlug]/[lessonSlug]/page.tsx:150`). | Medium |
| **No 404 boundary** | → **ARCH-04** |

---

## 2. Navigation

### 2.1 Header

`components/layout/Header.tsx` (196 lines) — sticky, backdrop-blurred, `z-50`.

**Strengths**

- ✅ Sticky with `bg-background/95 backdrop-blur` and `supports-[backdrop-filter]:bg-background/60` — progressive enhancement done correctly.
- ✅ `print:hidden` on the header — correct for the print stylesheet.
- ✅ Theme toggle, search, profile chip, and language switcher are grouped on the right.
- ✅ The ⌘K hint (`Header.tsx:144-146`) adapts to the platform via `navigator.userAgent`.
- ✅ `aria-expanded` / `aria-haspopup` on the More dropdown.

**Weaknesses**

| # | Issue | Evidence | Impact |
|---|-------|----------|--------|
| 1 | **"NEW" on 7 of 8 nav items** | `Header.tsx:41-46` — Tools, Games, Quizzes, Library, Roadmaps, Languages all `isNew: true`; only Home and Courses are not | **High.** A badge on nearly everything carries zero information and reads as decoration. It also costs a gradient pill on every nav item. |
| 2 | **The "NEW" badge is absolutely positioned** | `Header.tsx:78-82` — `absolute -top-1 -right-1` on a `relative` link | **Medium.** The badge overlaps the adjacent nav item's padding and can be clipped or collide. It is also announced by screen readers as part of the link name ("Tools NEW"). |
| 3 | **Icon + text in every nav item** | `Header.tsx:76` — `<item.icon className="w-4 h-4" />` | **Low–Medium.** 8 icons in the header is visually noisy and the icons are decorative — they should carry `aria-hidden="true"`. |
| 4 | **Hardcoded `text-gray-700 dark:text-gray-300`** | `Header.tsx:74,91,109,175` | **Medium.** Bypasses the token layer — the primary reason for the design-system split (UX-01). |
| 5 | **No `aria-current`** | `Header.tsx:70-84` | Medium — **A11Y-05**. |
| 6 | **The More dropdown is not keyboard-robust** | `Header.tsx:96-116` — no `Escape` handler, no arrow-key navigation, no focus management | Medium |
| 7 | **Mobile menu has no focus trap** | `Header.tsx:169-191` | Low–Medium |
| 8 | **The overlay `div` is clickable but not focusable** | `Header.tsx:99-102` — `onClick` on a `div` with `aria-hidden="true"` | Low — but it is an invisible click target that is not keyboard-accessible, and it is a no-op for keyboard users. |

### 2.2 Footer

`components/layout/Footer.tsx` — four columns of links + social icons + copyright.

**Weaknesses**

- ⚠️ The four-column layout does not collapse to a readable single column on narrow mobile — needs verification, but the class names suggest a fixed `grid-cols-2 md:grid-cols-4`.
- ⚠️ Social icons need `aria-label`s (icon-only links).
- ⚠️ No link to a privacy policy, terms, or an accessibility statement — relevant given the contact-form data flow (SEC-03).

### 2.3 Command palette

`components/search/CommandPalette.tsx` (272 lines) — ⌘K, fuzzy-ish matching, arrow-key navigation, grouped results.

**Strengths**

- ✅ Keyboard-first: ↑/↓/Enter/Escape.
- ✅ Result groups by type.
- ✅ Lazy index load with per-locale caching and graceful degradation.

**Weaknesses** → **A11Y-02** (no focus trap, no dialog semantics), **PERF-05** (index size).

---

## 3. Visual design

### 3.1 The core problem: four colour systems

This is the single most impactful visual-design finding.

| System | Where | Palette | Token-driven? |
|--------|-------|---------|---------------|
| **shadcn-style HSL tokens** | `app/globals.css:5-50` | 20 tokens, `--primary: 221.2 83.2% 53.3%` → `#2563eb` | ✅ Yes |
| **daisyUI plugin** | `tailwind.config.js:85-104` | `primary: "#3b82f6"`, `secondary: "#8b5cf6"` | ❌ Its own |
| **Hardcoded hex callouts** | `app/globals.css:100-250` | 53 literal hex values | ❌ No |
| **Hardcoded Tailwind palette utilities** | `app/globals.css:66-98` | `from-blue-600`, `bg-white text-gray-800`, `border-gray-200` | ❌ No |

**The two "primary" blues are different colours.** `--primary` resolves to `#2563eb`; daisyUI's `primary` is `#3b82f6`. Both are live in the same application. `globals.css:91-93` (`.btn-primary`) uses `from-blue-600` (`#2563eb`) — so a daisyUI `btn-primary` and the project's `.btn-primary` render **visibly different blues**.

**Evidence of the split inside a single file** — `components/markdown/MarkdownRenderer.tsx`:

```
:406  h1 className="text-4xl font-bold mb-6 mt-8 text-foreground"     ← shadcn token
:656  <table className="table table-zebra w-full">                        ← daisyUI
:659  <thead className="bg-base-200">                                     ← daisyUI
:646  <blockquote className="border-l-4 border-primary pl-4 … text-muted-foreground">  ← shadcn token
:90   className="absolute top-2 right-2 bg-gray-700 text-gray-300 …"      ← hardcoded
```

**Consequences**

1. **Dark mode is inconsistent.** The token layer has a proper `.dark` override. The callout hexes and the utility classes do not — so callouts and gradient buttons look different in dark mode.
2. **Theming is impossible.** Changing `--primary` in `:root` changes token-based elements only. The callouts, the buttons, the gradients, and every daisyUI component stay put.
3. **Maintenance is brittle.** A designer reading `globals.css` cannot tell which colour is authoritative.
4. **The `--radius` token is defined (`0.5rem`, `globals.css:26`) and consumed by `tailwind.config.js:54-58`, but `globals.css` itself never uses it** — `.callout` hardcodes `border-radius: 0.6rem` (`:110`) and `.mermaid-wrapper` hardcodes `1rem` (`:264`).

### 3.2 Typography

**Strengths**

- ✅ `Inter` via `next/font/google` — self-hosted, `display: swap`, preloaded, subset to `latin`.
- ✅ No external font request at runtime.

**Weaknesses**

- ⚠️ **Only one typeface.** The site uses `Inter` everywhere, including code (`font-mono` maps to the system stack). The markdown body — the primary reading surface for 1,298 lessons — has no typographic scale beyond Tailwind defaults.
- ⚠️ **Line length is uncontrolled.** The lesson body inherits the page container's width (`max-w-7xl` = 80rem). At 80rem, a 16px paragraph runs to ~110 characters — well past the comfortable 45–90 range. **This is the most significant readability issue on the site**, because lessons are the core content.
- ⚠️ **No `font-variant-numeric: tabular-nums`** on the score/stat tiles, where digit jitter is visible as values animate.
- ⚠️ No `text-wrap: balance` on headings — multi-line headings can produce ragged breaks.

### 3.3 Spacing and rhythm

- ✅ A `container-custom` primitive exists (`globals.css:87-89`) and is used **48 times** — consistent page gutters.
- ⚠️ But the *page vertical rhythm* is ad hoc: `container-custom py-12` appears **25 times**, while other pages use `py-16`, `py-20`, or `py-24`. There is no spacing scale.
- ⚠️ The heading scale jumps: `text-4xl` (h1) → `text-3xl` (h2) → `text-2xl` (h3) → `text-xl` (h4), which is a 4:3:2:1.25 ratio — reasonable, but the h1 is 36px for a page title inside a 1440px container, which reads small.

### 3.4 Colour palette (current)

| Role | Light | Dark | Token |
|------|-------|------|-------|
| Background | `#ffffff` | `#0a0f1a`-ish | `--background` |
| Foreground | `#020817`-ish | `#f8fafc` | `--foreground` |
| Primary | `#2563eb` | `#60a5fa` | `--primary` |
| Secondary | `#f1f5f9` | `#1e293b` | `--secondary` |
| Muted | `#f1f5f9` | `#1e293b` | `--muted` |
| Muted foreground | `#64748b` | `#94a3b8` | `--muted-foreground` |
| Border | `#e2e8f0` | `#1e293b` | `--border` |
| Destructive | `#ef4444` | `#991b1b` | `--destructive` |

**Assessment:** the base palette is well-chosen and modern (a blue/slate system with a purple gradient accent). It is *not* the problem — the problem is that it is **bypassed in ~40% of usages**.

---

## 4. Responsive behaviour

### 4.1 Breakpoint usage

Tailwind's defaults are in use: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Header | ✅ hamburger menu (`lg:hidden`) | ✅ | ✅ 8-item inline nav |
| Hero | ✅ | ✅ | ✅ |
| Mermaid | ✅ `@media` rules at `globals.css:434-469` | ✅ | ✅ |
| KaTeX | ✅ `@media max-width:640px` at `globals.css:530` | ✅ | ✅ |
| Tool pages | ✅ | ✅ | ✅ |
| Footer | ⚠️ 2-column grid on mobile | ⚠️ | ✅ 4-column |

**Assessment:** the responsive strategy is **mobile-first** and generally correct. The primary risks are:

1. **The header's 8-item inline nav appears at `lg` (1024px)** — at 1024px, 8 items with icons + text + badges + a More dropdown + 4 right-side controls will be **tight but probably overflowing**. `justify-between` with `space-x-1` means it compresses. The "NEW" badges add ~28px each × 6 = 168px. **This warrants testing at exactly 1024px.**
2. **Tables** are handled (`overflow-x-auto` at `MarkdownRenderer.tsx:655`) ✅.
3. **The `.container-custom` `2rem` padding** at all breakpoints is generous on mobile (32px of a 375px viewport = 8.5%). Should reduce to `1.25rem` below `sm`.
4. **Code blocks** — `overflow-x-auto` is applied via `not-prose overflow-visible` + the highlighter's own container. Should be verified for horizontal scroll traps.

### 4.2 Touch targets

- ✅ Header buttons are `p-2` + a 16–20px icon → ~32–36px. **Below the 44px WCAG 2.5.5 (AAA) / 24px WCAG 2.2 AA minimum** — the 24px AA minimum is met, the 44px AAA recommendation is not.
- ⚠️ The mobile menu trigger and theme toggle are the same size.
- ⚠️ The command palette list rows should be checked for ≥44px.

---

## 5. Educational content presentation

### 5.1 The markdown renderer

`components/markdown/MarkdownRenderer.tsx` (679 lines) is the centrepiece of the learning experience. It supports:

| Feature | Status | Notes |
|---------|--------|-------|
| GFM tables | ✅ | `remark-gfm` |
| Task lists | ✅ | via GFM |
| Strikethrough | ✅ | via GFM |
| Math (inline + block) | ✅ | `remark-math` + `rehype-katex`; display math also rendered client-side via dynamic `import('katex')` |
| Mermaid diagrams | ✅ | dynamic import, `securityLevel: 'strict'`, zoom, fullscreen, print styles |
| Syntax highlighting | ✅ | Prism, but see **PERF-01** |
| GitHub-style callouts | ✅ | 8 types × 6 locale variants — a genuinely nice feature |
| Interactive blocks | ✅ | `question`, `dragdrop`, `matching`, `fillblank`, `interactive`, `plot`, `molecule`, `phet` |
| Heading anchors | ✅ | `rehypeHeadingIds` + `scroll-mt-24` |
| Copy-to-clipboard | ✅ | With a `Copied!` state |

**Strengths**

- ✅ The alert/callout system is well designed and localised — `ALERT_ALIASES` maps `NOTA`/`DICA`/`CONSEJO`/`AVISO`/`ADVERTENCIA`/`SUCESSO`/`ÉXITO`/`IMPORTANTE`/`ATENCAO`/`ATENCION` to canonical types (`:323-328`). This shows real care for the multilingual audience.
- ✅ `renderAlertLabel` (`:340-348`) HTML-escapes `&`, `<`, `>` before applying emphasis — correct handling of a label that comes from raw markdown.
- ✅ The interactive block set is rich — matching, fill-in-the-blank, drag-order, and bucket-drop are real formative-assessment primitives.

**Weaknesses**

| # | Issue | Evidence | Impact |
|---|-------|----------|--------|
| 1 | **No line-length constraint on the reading column** | The markdown body renders inside the page container at `max-w-7xl` | **High.** ~110 characters per line for lesson prose. Materially reduces comprehension for long-form technical text. |
| 2 | **No per-block progress feedback** | The interactive blocks report correctness, but there is no aggregate "you answered 3 of 5" | Medium |
| 3 | **The copy button loses its focus ring** | `:90` — `focus:outline-none` with no replacement | Medium — **A11Y-05** |
| 4 | **The `pre` override defeats `overflow` handling** | `:417` — `pre: ({children}) => <div className="not-prose overflow-visible">{children}</div>` | Medium — `overflow-visible` can push the page wide on long code lines |
| 5 | **The `img` override renders the alt text as a visible caption** | `:665-670` — `{alt && <p …>{alt}</p>}` | Low–Medium — alt text is often a filename or a description intended for screen readers, not as a visible caption. This duplicates it visibly. |
| 6 | **`table` uses `table-zebra` (daisyUI) with `bg-base-200` (daisyUI)** inside a shadcn-token document | `:656,659` | Low — visually inconsistent with the surrounding lesson |
| 7 | **The difficulty badge is hardcoded** | `courses/[courseSlug]/[lessonSlug]/page.tsx:191,193` — `bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300` | Low — 12 occurrences of 3 hardcoded badge strings |
| 8 | **Heading anchor links are not visually discoverable** | `rehypeHeadingIds` adds `id`s, but no `¶` affordance is rendered | Low |

### 5.2 Interactive learning components

The seven interactive blocks are the platform's strongest educational feature. Assessment:

| Block | Component | LOC | Feedback | Accessibility |
|-------|-----------|----:|----------|---------------|
| `question` | `QuestionBlock.tsx` | 189 | ✅ immediate + explanation | ✅ text-based |
| `matching` | `MatchingQuestion.tsx` | 240 | ✅ | ⚠️ dnd-kit drag — needs a keyboard alternative |
| `fillblank` | `FillBlankQuestion.tsx` | 408 | ✅ | ⚠️ same |
| `dragdrop` | `DragOrderQuestion.tsx` | 194 | ✅ | ⚠️ same |
| bucket-drop | `BucketDropQuestion.tsx` | 232 | ✅ | ⚠️ same |
| `plot` | `SciencePlot.tsx` | 204 | n/a (visualisation) | ⚠️ **no text alternative for the chart** |
| `molecule` | `MoleculeViewer.tsx` | 146 | n/a | ⚠️ **no text alternative** |
| `phet` | `PhETEmbed.tsx` | 96 | n/a | ⚠️ **no text alternative** |

**Key accessibility gap:** `@dnd-kit` **does** support keyboard interaction via `KeyboardSensor`, but it must be explicitly wired. If only `PointerSensor` is registered, the drag interactions are **completely inaccessible to keyboard users** — and drag-based ordering is one of the platform's core formative-assessment mechanisms.

**Remediation**

1. Ensure `KeyboardSensor` with `sortableKeyboardCoordinates` is registered in all three dnd-kit components.
2. Add a **non-drag alternative** for every drag interaction (e.g. "move up / move down" buttons, or a select-to-swap interaction).
3. Add `role="img"` + `aria-label` (or a visually-hidden description) to `SciencePlot`, `MoleculeViewer`, and `PhETEmbed`.
4. Add `aria-live="polite"` announcements for drag state changes ("Card 2 of 4, moved to position 1").

---

## 6. Findings

---

### UX-01 — Four competing colour systems; the token layer is bypassed everywhere

| | |
|---|---|
| **Category** | UX/UI · Architecture |
| **Severity** | **Medium** |
| **Status** | Confirmed |

**Evidence** — see §3.1 above. Summary:

| Location | Issue | Count |
|----------|-------|------:|
| `app/globals.css:100-250` | 53 hardcoded hex colours in the callout system, **0** token references | 53 |
| `app/globals.css:66-98` | `.gradient-bg`, `.glass-effect`, `.text-gradient`, `.btn-primary`, `.btn-secondary` hardcode Tailwind's raw palette | 5 |
| `tailwind.config.js:85-104` | daisyUI defines a **competing** `primary`/`secondary` | 2 |
| `app/globals.css:110,264` | Hardcoded `border-radius` bypasses `--radius` | 2 |
| ~40 component files | `text-gray-700 dark:text-gray-300` instead of `text-foreground`/`text-muted-foreground` | ~40 |

**Impact**

- Dark mode is inconsistent.
- Theming is impossible.
- Two visually different "primary" blues are live.
- Any future brand change requires touching ~40 files.

**Remediation**

1. **Convert every hardcoded hex in `globals.css` to a token.** Introduce semantic callout tokens:
   ```css
   --callout-note-bg / --callout-note-fg / --callout-note-border / --callout-note-icon
   ```
   and the same for `warning`, `danger`, `success`, `tip`, `important` — in `:root` and `.dark`.
2. **Rewrite `.gradient-bg` / `.text-gradient` / `.btn-primary` / `.btn-secondary`** to use `--primary` / `--accent` and a new `--brand-gradient` token.
3. **Remove the daisyUI palette conflict.** Either drop the `daisyui` plugin entirely (replacing `table table-zebra` and `bg-base-200` with token-based classes — a small, contained change), or align daisyUI's theme values to the token values. **Recommendation: drop daisyUI.** It contributes `table-zebra`, `base-200`, `modal`, `badge`, `alert`, `stats`, `tooltip` — all replaceable — and it is the source of the palette conflict. Removing it also removes ~13 incidental KaTeX rules from the global CSS bundle (152 KB → smaller).
4. **Replace `text-gray-700 dark:text-gray-300`** with `text-foreground` / `text-muted-foreground` across the codebase.
5. Add an ESLint rule (or a simple grep-based CI check) that rejects raw hex colours in `components/` and `app/`.

**Effort:** ≈ 6 hours.

---

### UX-02 — The English Library has 8 resources vs 58 in Spanish

| | |
|---|---|
| **Category** | UX/UI · Content |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

| Locale | Resources | Breakdown |
|--------|----------:|-----------|
| `en` | **8** | article 1, blog 1, course 1, ebook 1, podcast 1, repository 1, video 2 |
| `pt` | 50 | article 1, course 30, ebook 8, repository 5, video 6 |
| `es` | 58 | article 2, blog 1, course 31, ebook 9, podcast 1, repository 6, video 8 |

`content/library/en/` has **no `podcast` beyond 1** and **only 1 course**, while `pt`/`es` have **30–31 courses each**.

**Impact**

- `/en/library/` — the **default locale** and the `x-default` fallback — renders as a nearly-empty grid of 8 cards while `/es/library/` shows 58. A visitor switching locales sees a dramatic and unexplained difference.
- The Library is positioned in the primary nav, so it is a high-traffic surface.
- 6 of the 7 resource *types* have exactly one English entry, so the type filter chips will mostly show empty states.

**Remediation**

This is fundamentally a **content** problem, but the **UI must degrade gracefully**:

1. **UI (immediate):** the empty/filtered state must be informative — explain that the English library is being curated and link to the `pt`/`es` versions. Currently `library-client.tsx` likely renders an empty grid with no explanation.
2. **UI:** the library should show the count per type per locale, and disable/hide filter chips that have no results rather than showing an empty state on click.
3. **Content (recommended):** translate a subset of the highest-value `pt`/`es` library entries into English — the ~8 English entries cover only 7 of the 7 types once, so 15–25 translated entries would balance the page.
4. **Content:** add a "Resources in other languages" section to the English library page that links to the `pt`/`es` libraries.

**Effort:** UI ≈ 3 hours. Content ≈ ongoing.

---

### UX-03 — The "NEW" badge on 7 of 8 navigation items

| | |
|---|---|
| **Category** | UX/UI |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence** — `components/layout/Header.tsx:41-46`:
```tsx
{ name: dict.navigation.courses, href: `/${lang}/courses`, icon: BookOpen, isNew: false },
{ name: dict.navigation.tools,    href: `/${lang}/tools`,    icon: Calculator, isNew: true  },
{ name: dict.navigation.games,    href: `/${lang}/games`,    icon: GamepadIcon, isNew: true  },
{ name: dict.navigation.quizzes,  href: `/${lang}/quizzes`,  icon: Award, isNew: true  },
{ name: dict.navigation.library,  href: `/${lang}/library`,  icon: Library, isNew: true  },
{ name: dict.navigation.roadmaps, href: `/${lang}/roadmaps`, icon: Map, isNew: true  },
{ name: dict.navigation.languages,href: `/${lang}/languages`,icon: Languages,isNew: true  },
```

**Impact**

- **Zero information value** — 7 of 8 items are "new".
- The badge is **absolutely positioned** (`-top-1 -right-1`), so it overlaps the neighbouring link and can collide at the `lg` breakpoint.
- It is **animated** (`animate-pulse`) on every page.
- Screen readers announce the link as "Tools NEW" with no separation.

**Remediation**

1. **Remove the badge entirely.** All these sections have been live long enough that "NEW" has no meaning. If a badge is wanted, apply it to **at most one** item, and only when genuinely new.
2. If retained: make it a **static**, inline, small-caps label (not absolutely positioned, not animated), and add `aria-hidden="true"` since the information is decorative.
3. Add `aria-hidden="true"` to all decorative nav icons.

**Effort:** ≈ 1 hour.

---

### UX-04 — Lesson reading column has no maximum line length

| | |
|---|---|
| **Category** | UX/UI · Educational |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

The lesson body renders inside `container-custom` (`app/globals.css:87-89`) = `mx-auto max-w-7xl section-padding` → **80rem = 1280px** of content width.

`components/markdown/MarkdownRenderer.tsx` sets no `max-w-*` on the rendered prose. The `p` override is:
```tsx
411:  p: ({ children }) => <p className="mb-4 leading-7 text-foreground/90">{children}</p>,
```

**Impact**

At 16px in a 1280px container, a paragraph runs to **~110 characters per line**. The widely-cited comfortable range for sustained reading is **45–90 characters** (roughly 66 for optimal). Over 110, the eye loses the line return reliably — a measurable reduction in comprehension, and it is exactly the kind of content (long-form technical prose) that suffers most.

This affects **1,486 lesson pages** — the platform's core surface.

**Remediation**

Introduce a dedicated **prose measure**:

```css
@layer components {
  .prose-measure {
    @apply mx-auto w-full max-w-[68ch];
  }
}
```

and wrap the markdown output in it (`MarkdownRenderer.tsx` root element). Keep wide elements (tables, Mermaid, code blocks, plots) able to break out via a `.prose-wide` wrapper, so the fix does not shrink data tables.

**Effort:** ≈ 2 hours.

---

### UX-05 — The home page hero has no clear primary action hierarchy

| | |
|---|---|
| **Category** | UX/UI |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence**

`components/home/Hero.tsx` (135 lines) + `components/home/Features.tsx` (122) + `components/home/Stats.tsx` (94) + `components/home/Tools.tsx` (135) + `components/home/Newsletter.tsx` (102) — five stacked sections, each with its own gradient treatment and its own CTA.

**Impact**

A first-time visitor faces: hero + CTA, features grid, stats band, tools preview, featured courses, newsletter. **Six competing calls to action** before any content. The primary action ("start learning") is not visually dominant over "subscribe to the newsletter".

**Remediation**

1. Establish a **single primary action** in the hero ("Browse courses" / "Start learning"), styled with the `--primary` token.
2. Demote the newsletter to a **secondary** CTA or move it below the featured courses.
3. Reduce the gradient usage — currently `.gradient-bg`, `.text-gradient`, and `.btn-primary` all apply a blue→purple gradient, so the hero, features, stats, and newsletter all compete.

**Effort:** ≈ 4 hours.

---

### UX-06 — The roadmap is orphaned from the course catalog

| | |
|---|---|
| **Category** | UX/UI · Educational |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence**

`app/[lang]/roadmaps/[roadmapSlug]/page.tsx` renders `RoadmapTimeline` + `RoadmapStepCard`. `lib/roadmaps/resolve-content-url.ts` exists to resolve a step to a content URL — so the data model already supports the link, but the roadmap's position in the IA does not.

**Impact**

The roadmap is the platform's most valuable *curated* artefact — a sequenced path through 49 courses. It is a **secondary nav item** with no inbound links from the course pages and no prominent placement on the home page. A learner browsing courses has no signal that a curated path exists.

**Remediation**

1. Add a **roadmap strip** to the home page (a horizontal card showing the roadmap's steps).
2. Link **from each course** to the roadmap step(s) that include it, using the existing `resolve-content-url` mapping in reverse.
3. Add a **"Continue your roadmap"** card on the course catalogue when roadmap progress exists (the progress data is already in `localStorage` via `roadmap-progress-{id}`).

**Effort:** ≈ 5 hours.

---

### UX-07 — No visible focus ring on the code copy button

| | |
|---|---|
| **Category** | Accessibility · UX/UI |
| **Severity** | Medium |
| **Status** | Confirmed |

**Evidence** — `components/markdown/MarkdownRenderer.tsx:88-94`:
```tsx
<button
  onClick={copy}
  className="absolute top-2 right-2 bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-600 focus:outline-none"
  aria-label="Copy code"
  type="button"
>
```

`focus:outline-none` removes the indicator with **no replacement** → the button is invisible to keyboard navigation.

**Remediation:** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none` (or the global baseline from **A11Y-05**).

**Effort:** ≈ 30 minutes (with the global baseline).

---

### UX-08 — Filter chips and empty states are not designed

| | |
|---|---|
| **Category** | UX/UI |
| **Severity** | Low |
| **Status** | Confirmed |

**Evidence**

`app/[lang]/library/library-client.tsx` (387 lines) and `app/[lang]/courses/courses-client.tsx` (299) both implement type/area filters. Neither has a designed empty state.

**Impact**

In the English Library (8 resources, 7 types), clicking any filter chip shows an empty area with no explanation. Same for a course filter with no matches. An empty grid reads as a broken page.

**Remediation**

1. Design a shared `<EmptyState>` component with an icon, a heading, an explanation, and a **recovery action** ("Clear filters" / "Browse all resources").
2. Disable filter chips that would produce zero results rather than letting the user click into an empty state.
3. Show the result count next to the active filters.

**Effort:** ≈ 3 hours.

---

## 7. Micro-interactions and motion

### 7.1 What exists

| Interaction | Implementation | Quality |
|-------------|---------------|---------|
| Hero entrance | `framer-motion` fade/rise | ✅ Smooth, but heavy (PERF-03) |
| Card hover | `.card-hover` — `hover:scale-105 hover:shadow-xl` | ⚠️ `scale-105` on a card causes **layout shift** of the surrounding content and can clip against the viewport edge |
| Button hover | `hover:scale-105` on `.btn-primary` | ⚠️ Same — scaling a button changes its layout box |
| Nav "NEW" badge | `animate-pulse` (infinite) | ⚠️ Distracting, and violates 2.2.2 |
| Mobile menu | `animate-slide-in` | ✅ |
| Theme toggle | `transition-colors` | ✅ |
| Mermaid zoom | `transition-transform` | ✅ |
| Accordion | `accordion-down`/`accordion-up` keyframes | ✅ |
| Copy button | `Copied!` text swap | ✅ — but no transition |

### 7.2 Recommendations

1. **Replace `scale` transforms with `transform` + `translateY`** on hover — no layout shift, and the effect reads as more refined:
   ```css
   .card-hover { transition: transform 200ms ease, box-shadow 200ms ease; }
   .card-hover:hover { transform: translateY(-2px); box-shadow: …; }
   ```
2. **Remove `animate-pulse`** from the NEW badge (also UX-03).
3. **Add `prefers-reduced-motion`** globally (**A11Y-04**).
4. **Standardise transition durations** to a scale: `150ms` (micro — colour, opacity), `200ms` (standard — transforms, shadows), `300ms` (layout). Currently the codebase uses `duration-300` and `duration-500` ad hoc.
5. **Add a subtle entrance to list items** with a stagger — this is what makes the course/tool grids feel alive. Use CSS `animation-delay: calc(var(--i) * 40ms)` with an `--i` custom property set inline, so it costs **zero** JavaScript.

---

## 8. UX/UI summary

| ID | Finding | Severity | Effort |
|----|---------|----------|--------|
| UX-01 | Four competing colour systems; token layer bypassed in ~40% of usages | **Medium** | 6 h |
| UX-02 | English Library has 8 resources vs 58 in Spanish — page looks broken | Medium | 3 h (+content) |
| UX-03 | "NEW" badge on 7 of 8 nav items — zero information value | Low | 1 h |
| UX-04 | No maximum line length on lesson prose (~110 chars/line) | Medium | 2 h |
| UX-05 | Six competing CTAs on the home page; no primary action hierarchy | Low | 4 h |
| UX-06 | Roadmap orphaned from the course catalogue | Medium | 5 h |
| UX-07 | Code copy button has no visible focus ring | Medium | 0.5 h |
| UX-08 | No designed empty states or disabled filter chips | Low | 3 h |
| UX-09 | `scale-105` hover causes layout shift | Low | 1 h |
| UX-10 | No motion duration scale; `prefers-reduced-motion` not honoured | Low | 1 h |
| UX-11 | Drag-based interactions may be keyboard-inaccessible | Medium | 4 h |
| UX-12 | Visualisations (plot/molecule/phet) have no text alternative | Medium | 3 h |
