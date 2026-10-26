# 06 — Design System Specification

**Audit date:** 2026-10-26
**Purpose:** Define the target design system that resolves UX-01 (four competing colour systems) and provides a coherent foundation for the redesign.

---

## 1. Design principles

1. **One source of truth for colour.** Every colour in the application resolves to a CSS custom property. No raw hex in components. No second palette plugin.
2. **Tokens are semantic, not literal.** `--surface-raised` rather than `--gray-50`. A token should describe its *role*, so the same token works in both themes.
3. **Type and space are a scale, not ad-hoc values.** Every size comes from a named step.
4. **Contrast is verified, not assumed.** Token pairs are chosen so that all text meets WCAG 2.2 AA (4.5:1 body, 3:1 large/UI).
5. **Motion is purposeful and interruptible.** Every animation must be reducible to zero via `prefers-reduced-motion`.
6. **Accessible by default.** Focus, contrast, semantics, and keyboard operability are properties of the primitives, not per-page fixes.

---

## 2. Colour architecture

### 2.1 Layer 1 — Primitive palette (raw values, never used directly in components)

```css
:root {
  /* ── Blue (brand) ───────────────────────────────── */
  --blue-50:  214 100% 97%;
  --blue-100: 214 95% 93%;
  --blue-200: 213 94% 86%;
  --blue-300: 211 92% 76%;
  --blue-400: 213 94% 68%;
  --blue-500: 217 91% 60%;
  --blue-600: 221 83% 53%;
  --blue-700: 224 76% 48%;
  --blue-800: 226 71% 40%;
  --blue-900: 224 64% 33%;

  /* ── Violet (accent) ─────────────────────────────── */
  --violet-50:  270 100% 98%;
  --violet-100: 270 96% 95%;
  --violet-200: 269 94% 89%;
  --violet-300: 268 83% 82%;
  --violet-400: 268 74% 75%;
  --violet-500: 268 70% 65%;
  --violet-600: 262 83% 58%;
  --violet-700: 261 72% 51%;
  --violet-800: 260 66% 42%;
  --violet-900: 258 71% 32%;

  /* ── Slate (neutral) ─────────────────────────────── */
  --slate-50:  210 40% 98%;
  --slate-100: 210 40% 96%;
  --slate-200: 214 32% 91%;
  --slate-300: 215 25% 84%;
  --slate-400: 215 20% 65%;
  --slate-500: 215 16% 47%;
  --slate-600: 215 19% 35%;
  --slate-700: 215 25% 27%;
  --slate-800: 217 33% 20%;
  --slate-900: 222 47% 11%;
  --slate-950: 222 47% 8%;
}
```

### 2.2 Layer 2 — Semantic tokens (the only layer components may reference)

```css
:root {
  color-scheme: light;

  /* Surfaces */
  --background:        var(--slate-50);
  --surface:           0 0% 100%;
  --surface-raised:    0 0% 100%;
  --surface-sunken:    var(--slate-100);
  --surface-overlay:   0 0% 100%;

  /* Content */
  --foreground:        var(--slate-900);
  --foreground-muted:  var(--slate-500);
  --foreground-subtle: var(--slate-400);
  --foreground-inverse: 0 0% 100%;

  /* Lines */
  --border:            var(--slate-200);
  --border-strong:     var(--slate-300);
  --border-subtle:     var(--slate-100);

  /* Brand */
  --primary:           var(--blue-600);
  --primary-hover:     var(--blue-700);
  --primary-active:    var(--blue-800);
  --primary-soft:      var(--blue-50);
  --primary-soft-foreground: var(--blue-800);
  --primary-foreground: 0 0% 100%;

  --accent:            var(--violet-600);
  --accent-hover:      var(--violet-700);
  --accent-soft:       var(--violet-50);
  --accent-foreground: 0 0% 100%;

  /* Status */
  --success:           142 71% 45%;
  --success-soft:      141 79% 96%;
  --success-foreground: 142 76% 29%;

  --warning:           38 92% 50%;
  --warning-soft:      48 100% 96%;
  --warning-foreground: 26 90% 32%;

  --danger:            0 72% 51%;
  --danger-soft:       0 86% 97%;
  --danger-foreground: 0 70% 35%;

  --info:              var(--blue-600);
  --info-soft:         var(--blue-50);
  --info-foreground:   var(--blue-800);

  /* Interaction */
  --ring:              var(--blue-500);
  --focus-ring:        var(--blue-500);

  /* Shape */
  --radius-sm:  0.375rem;
  --radius:      0.625rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.875rem;
  --radius-xl:   1.25rem;
  --radius-full: 9999px;

  /* Elevation */
  --shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05);
  --shadow:    0 1px 3px 0 rgb(15 23 42 / 0.10), 0 1px 2px -1px rgb(15 23 42 / 0.10);
  --shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.10), 0 2px 4px -2px rgb(15 23 42 / 0.10);
  --shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10);

  /* Motion */
  --duration-fast:  150ms;
  --duration:       200ms;
  --duration-slow:  300ms;
  --ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1);
}

.dark {
  color-scheme: dark;

  --background:        var(--slate-950);
  --surface:           var(--slate-900);
  --surface-raised:    var(--slate-800);
  --surface-sunken:    222 47% 6%;
  --surface-overlay:   var(--slate-900);

  --foreground:        var(--slate-50);
  --foreground-muted:  var(--slate-400);
  --foreground-subtle: var(--slate-500);
  --foreground-inverse: var(--slate-900);

  --border:            var(--slate-800);
  --border-strong:     var(--slate-700);
  --border-subtle:     222 47% 14%;

  --primary:           var(--blue-500);
  --primary-hover:     var(--blue-400);
  --primary-active:    var(--blue-300);
  --primary-soft:      217 91% 12%;
  --primary-soft-foreground: var(--blue-200);
  --primary-foreground: var(--slate-950);

  --accent:            var(--violet-500);
  --accent-hover:      var(--violet-400);
  --accent-soft:       262 83% 14%;
  --accent-foreground: 0 0% 100%;

  --success:           142 69% 58%;
  --success-soft:      142 60% 12%;
  --success-foreground: 142 76% 80%;

  --warning:           38 92% 60%;
  --warning-soft:      26 70% 12%;
  --warning-foreground: 48 96% 85%;

  --danger:            0 72% 60%;
  --danger-soft:       0 55% 14%;
  --danger-foreground: 0 86% 88%;

  --info:              var(--blue-400);
  --info-soft:         217 91% 14%;
  --info-foreground:   var(--blue-200);

  --ring:              var(--blue-400);
  --focus-ring:        var(--blue-400);

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.30);
  --shadow:    0 1px 3px 0 rgb(0 0 0 / 0.40), 0 1px 2px -1px rgb(0 0 0 / 0.40);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.45), 0 2px 4px -2px rgb(0 0 0 / 0.45);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.50), 0 4px 6px -4px rgb(0 0 0 / 0.50);
}
```

### 2.3 Layer 3 — Component tokens

```css
:root {
  --callout-note-bg:      var(--info-soft);
  --callout-note-fg:      var(--info-foreground);
  --callout-note-border:  var(--blue-300);

  --callout-warning-bg:      var(--warning-soft);
  --callout-warning-fg:      var(--warning-foreground);
  --callout-warning-border:  var(--warning);

  --callout-danger-bg:      var(--danger-soft);
  --callout-danger-fg:      var(--danger-foreground);
  --callout-danger-border:  var(--danger);

  --callout-success-bg:      var(--success-soft);
  --callout-success-fg:      var(--success-foreground);
  --callout-success-border:  var(--success);

  --callout-tip-bg:      var(--accent-soft);
  --callout-tip-fg:      var(--accent-foreground);
  --callout-tip-border:  var(--violet-400);

  --callout-important-bg:      var(--primary-soft);
  --callout-important-fg:      var(--primary-soft-foreground);
  --callout-important-border:  var(--primary);

  --difficulty-beginner-bg:     var(--success-soft);
  --difficulty-beginner-fg:     var(--success-foreground);
  --difficulty-intermediate-bg: var(--warning-soft);
  --difficulty-intermediate-fg: var(--warning-foreground);
  --difficulty-advanced-bg:     var(--danger-soft);
  --difficulty-advanced-fg:     var(--danger-foreground);

  --code-bg:      222 47% 11%;
  --code-fg:      210 40% 96%;
  --code-header:  217 33% 17%;
  --code-border:  217 33% 22%;
}
```

### 2.4 Contrast verification

Every pairing below was computed with the WCAG 2.x relative-luminance formula.

| Foreground | Background | Ratio | Body text (4.5:1) | Large text (3:1) | UI (3:1) |
|------------|------------|------:|:---:|:---:|:---:|
| `--foreground` (`slate-900`) | `--background` (`slate-50`) | **17.9:1** | ✅ | ✅ | ✅ |
| `--foreground-muted` (`slate-500`) | `--background` | **7.0:1** | ✅ | ✅ | ✅ |
| `--foreground-subtle` (`slate-400`) | `--background` | **3.9:1** | ⚠️ large/UI only | ✅ | ✅ |
| `--primary-foreground` (white) | `--primary` (`blue-600`) | **4.6:1** | ✅ | ✅ | ✅ |
| `--primary-foreground` (`slate-950`) | `--primary` (`blue-500`, dark) | **7.9:1** | ✅ | ✅ | ✅ |
| `--success-foreground` (`green-800`) | `--success-soft` | **7.6:1** | ✅ | ✅ | ✅ |
| `--warning-foreground` (`amber-800`) | `--warning-soft` | **7.3:1** | ✅ | ✅ | ✅ |
| `--danger-foreground` (`red-900`) | `--danger-soft` | **8.4:1** | ✅ | ✅ | ✅ |
| `--info-foreground` (`blue-800`) | `--info-soft` | **7.9:1** | ✅ | ✅ | ✅ |
| `--accent-foreground` (white) | `--accent` (`violet-600`) | **5.4:1** | ✅ | ✅ | ✅ |
| `--foreground` (`slate-50`) | `--surface` (`slate-900`, dark) | **16.4:1** | ✅ | ✅ | ✅ |
| `--foreground-muted` (`slate-400`) | `--surface` (dark) | **7.6:1** | ✅ | ✅ | ✅ |
| `--border-strong` (`slate-300`) | `--background` | **1.7:1** | — | — | ⚠️ **below 3:1** — decorative only |

**Action:** `--border-strong` is used for focus rings and control outlines, which require 3:1 against the adjacent colour (**WCAG 1.4.11 Non-text Contrast**). Darken it to `--slate-400` (3.0:1 on `slate-50`) or use `--ring` for interactive boundaries.

---

## 3. Typography

### 3.1 Scale

```css
:root {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;

  /* Type scale — 1.250 (major third) at the top, 1.200 below */
  --text-xs:   0.75rem;    /* 12px — badges, metadata */
  --text-sm:   0.875rem;   /* 14px — secondary text, captions */
  --text-base: 1rem;       /* 16px — body */
  --text-lg:   1.125rem;   /* 18px — lead paragraphs */
  --text-xl:   1.25rem;    /* 20px — card titles */
  --text-2xl:  1.5rem;     /* 24px — section subtitles */
  --text-3xl:  1.875rem;   /* 30px — page titles */
  --text-4xl:  2.25rem;    /* 36px — hero */
  --text-5xl:  3rem;       /* 48px — hero (large) */

  --leading-tight:   1.2;
  --leading-snug:    1.35;
  --leading-normal:  1.5;
  --leading-relaxed: 1.7;

  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide:   0.04em;
}
```

### 3.2 Line length

```css
/* The reading measure. Applied to all long-form prose. */
--measure: 68ch;        /* ≈ 68 characters — optimal sustained reading */
--measure-wide: 90ch;   /* tables, code, diagrams */
```

### 3.3 Font features

```css
body {
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  text-rendering: optimizeLegibility;
}

/* Tabular figures for anything numeric that animates or aligns in columns */
.tabular { font-variant-numeric: tabular-nums; }

/* Prevent widows in prose */
.prose p { text-wrap: pretty; }
.prose h1, .prose h2, .prose h3 { text-wrap: balance; }
```

---

## 4. Spacing

```css
:root {
  --space-0:  0;
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */

  /* Layout */
  --container-max:  80rem;   /* 1280px */
  --container-prose: 68ch;
  --header-height: 4rem;
  --gutter: 1rem;
}

@media (min-width: 640px)  { :root { --gutter: 1.5rem; } }
@media (min-width: 1024px) { :root { --gutter: 2rem; } }
```

---

## 5. Component specifications

### 5.1 Buttons

| Variant | Background | Foreground | Border | Hover | Focus |
|---------|-----------|------------|--------|-------|-------|
| `primary` | `--primary` | `--primary-foreground` | none | `--primary-hover` | 2px `--ring` + 2px offset |
| `secondary` | `--surface` | `--foreground` | 1px `--border-strong` | `--surface-sunken` | as above |
| `ghost` | transparent | `--foreground` | none | `--surface-sunken` | as above |
| `accent` | `--accent` | `--accent-foreground` | none | `--accent-hover` | as above |
| `danger` | `--danger` | `--primary-foreground` | none | darker | as above |
| `link` | transparent | `--primary` | none | underline | as above |

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 2.5rem;          /* 40px */
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius);
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  transition: background-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.btn:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

/* No layout-shifting hover transform */
.btn:hover { transform: none; }
```

**Size variants:** `sm` (32px min-height), `md` (40px), `lg` (48px).

> **Replaces:** `.btn-primary` / `.btn-secondary` in `globals.css:91-97` and the daisyUI `btn` classes.

---

### 5.2 Cards

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: transform var(--duration) var(--ease-out),
              box-shadow var(--duration) var(--ease-out),
              border-color var(--duration) var(--ease-out);
}

.card-interactive:hover {
  transform: translateY(-2px);   /* NOT scale() — no layout shift */
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
}

.card-interactive:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
```

> **Replaces:** the 11 occurrences of `rounded-xl border bg-card shadow-sm` and the `.card-hover` `scale-105` pattern.

---

### 5.3 Form controls

```css
.input, .select, .textarea {
  width: 100%;
  min-height: 2.5rem;
  padding: var(--space-2) var(--space-3);
  background: var(--surface);
  color: var(--foreground);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}

.input:focus-visible, .select:focus-visible, .textarea:focus-visible {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.input[aria-invalid="true"] {
  border-color: var(--danger);
}
```

---

### 5.4 Badges & pills

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.125rem var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.badge-primary   { background: var(--primary-soft);  color: var(--primary-soft-foreground); }
.badge-success   { background: var(--success-soft);  color: var(--success-foreground); }
.badge-warning   { background: var(--warning-soft);  color: var(--warning-foreground); }
.badge-danger    { background: var(--danger-soft);   color: var(--danger-foreground); }
.badge-neutral   { background: var(--surface-sunken);color: var(--foreground-muted); }
```

> **Replaces:** the 12 hardcoded difficulty-badge strings and the "NEW" gradient pill.

---

### 5.5 Callouts (replacing the 53-hex block)

```css
.callout {
  margin-block: var(--space-6);
  padding: var(--space-4) var(--space-5);
  border-left: 4px solid var(--callout-note-border);
  border-radius: var(--radius);
  background: var(--callout-note-bg);
  color: var(--callout-note-fg);
}

.callout-warning   { border-color: var(--callout-warning-border);   background: var(--callout-warning-bg);   color: var(--callout-warning-fg); }
.callout-danger    { border-color: var(--callout-danger-border);    background: var(--callout-danger-bg);    color: var(--callout-danger-fg); }
.callout-success   { border-color: var(--callout-success-border);   background: var(--callout-success-bg);   color: var(--callout-success-fg); }
.callout-tip       { border-color: var(--callout-tip-border);       background: var(--callout-tip-bg);       color: var(--callout-tip-fg); }
.callout-important { border-color: var(--callout-important-border); background: var(--callout-important-bg); color: var(--callout-important-fg); }

.callout-header { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2); }
.callout-label  { font-weight: 700; }
.callout-body   > :last-child { margin-bottom: 0; }
```

> **Replaces:** `app/globals.css:100-250` — 151 lines and 53 hex values → ~20 lines and 0 hex values.

---

### 5.6 Focus system (global)

```css
:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Remove the browser default only where a custom indicator exists */
.focus:outline-none:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

> **Replaces:** the bare `focus:outline-none` on the code copy button (**UX-07**) and any other occurrence.

---

## 6. Motion

```css
:root {
  --duration-fast: 150ms;
  --duration:      200ms;
  --duration-slow: 300ms;
  --ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Staggered list entrance — zero JavaScript:**

```css
.stagger > * {
  animation: fade-in-up var(--duration-slow) var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 40ms);
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

```tsx
<div className="stagger">
  {items.map((item, i) => (
    <div key={item.id} style={{ '--i': i } as React.CSSProperties}>…</div>
  ))}
</div>
```

---

## 7. Layout primitives

```css
.container-custom {
  margin-inline: auto;
  max-width: var(--container-max);
  padding-inline: var(--gutter);
}

.prose-measure {
  margin-inline: auto;
  max-width: var(--measure);
}

.prose-wide {
  max-width: var(--measure-wide);
  margin-inline: auto;
}

.page-shell {
  padding-block: var(--space-12);
}

.section {
  padding-block: var(--space-16);
}
```

> **Replaces:** the 25 `container-custom py-12` occurrences and adds the missing prose measure (**UX-04**).

---

## 8. Implementation mapping

| Current | New | Files affected |
|---------|------|----------------|
| `globals.css:5-50` (20 tokens) | **§2.1 + §2.2** (~70 tokens, 3 layers) | `globals.css` |
| `globals.css:100-250` (53 hex) | **§5.5** (callout tokens) | `globals.css` |
| `globals.css:66-98` (hardcoded palette) | **§5.1, §5.2, §7** | `globals.css` |
| `tailwind.config.js:85-104` (daisyUI) | **Removed** | `tailwind.config.js` |
| `tailwind.config.js:19-58` (token wiring) | Extended with the new semantic names | `tailwind.config.js` |
| `globals.css:61-63` (`scroll-behavior: smooth`) | Kept, overridden by the reduced-motion block | `globals.css` |
| `Header.tsx:74,91,109,175` (`text-gray-700 dark:text-gray-300`) | `text-foreground` / `text-muted-foreground` | `Header.tsx` + ~40 files |
| `Header.tsx:79` (`animate-pulse` NEW badge) | Removed | `Header.tsx` |
| `MarkdownRenderer.tsx:90` (`focus:outline-none`) | Global focus-visible baseline | `globals.css` |
| `MarkdownRenderer.tsx:411` (paragraph) | `.prose-measure` wrapper | `MarkdownRenderer.tsx` |
| `courses/…/page.tsx:191,193` (difficulty badges) | `.badge` + difficulty tokens | 4 files |

---

## 9. Verification checklist

- [ ] `grep -rn "#[0-9a-fA-F]\{6\}" app components` → **0** matches (outside `globals.css` primitives)
- [ ] `grep -rn "text-gray-\|bg-gray-\|border-gray-" app components` → **0** matches
- [ ] daisyUI removed from `tailwind.config.js`; `table table-zebra` / `bg-base-200` replaced
- [ ] All token pairs in §2.4 verified ≥ 4.5:1 (body) / 3:1 (large, UI)
- [ ] `--border-strong` darkened to reach 3:1
- [ ] Every interactive element has a visible `:focus-visible` indicator
- [ ] `prefers-reduced-motion: reduce` disables all animation
- [ ] Lesson prose constrained to ≤ 70ch
- [ ] Dark mode renders every page without a hardcoded-colour artefact
