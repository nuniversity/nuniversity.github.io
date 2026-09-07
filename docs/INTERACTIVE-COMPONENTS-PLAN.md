# Implementation Plan: Interactive Course Components

> Extending NUniversity's course platform to support Math, Science, and Interactive content.

---

## Table of Contents

### Wave 2: p5.js Creative Coding - Molecule Orbit (Lesson 6 of 11, Python Fundamentals)

**Root Cause**: p5.js `setup()` and `draw()` must be **global** functions, but the IIFE wrapper `(() => { ... })()` made them local, causing p5.js to fail silently.

**Fixes Applied**:

1. **Remove IIFE wrapper** from `<script>` blocks in markdown files
   - `function setup()` and `function draw()` must be top-level globals
   - p5.js auto-detects globals on page load and enters "global mode"

2. **Fix Next.js hydration mismatch**
   - Server-rendered `'` vs client-rendered `'` in `canvas.parent('molecule-orbit')`
   - **Solution**: Added `script` component to `MarkdownRenderer.tsx` using `dangerouslySetInnerHTML={{ __html: String(children) }}`
   - Added null guard: `if (children == null) return null`

3. **Add explicit canvas container styling**
   - `<div id="molecule-orbit" style="min-height: 400px; background: #f0f0f0;">`
   - Without explicit height, the 400×400 p5.js canvas is invisible

**p5.js Sketch Structure** (what the markdown should contain):
```markdown
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script>
    let circles = [];
    
    function setup() {
      const canvas = createCanvas(400, 400);
      canvas.parent('molecule-orbit');
      background(240);
      // initialize variables, create objects
    }
    
    function draw() {
      background(240, 10); // subtle trail effect
      // animate, update positions, redraw
      ellipse(circle.x, circle.y, circle.radius);
    }
</script>

**Markdown Syntax**:
````
```p5js
{orbit sketch code here}
```
````

**Dependencies**: None (p5.js loaded via CDN)

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Math Equations (KaTeX)](#phase-1-math-equations-katex)
3. [Phase 2: PhET Simulation Embeds](#phase-2-phet-simulation-embeds)
4. [Phase 3: Molecular Viewer (3Dmol.js)](#phase-3-molecular-viewer-3dmoljs)
5. [Phase 4: Interactive Charts (Plotly.js)](#phase-4-interactive-charts-plotlyjs)
6. [Phase 5: Advanced Quiz Types](#phase-5-advanced-quiz-types)
7. [File Change Summary](#file-change-summary)
### Wave 1: Parabola Explorer - Math Foundations Course (Lesson 4 of 11)

**Visualization Modes**: Two options supported:
1. **Desmos Interactive** - iframe embed `https://www.desmos.com/calculator`
2. **Canvas Visualizer** - Pure vanilla JS, no external dependencies

**Key Learning**: Always provide a fallback. The Desmos embed works online but requires internet; the canvas visualizer works offline (100% client-side).

**Markdown Syntax** (in wave-1 lessons):
- Desmos: `<iframe src="https://www.desmos.com/calculator/...">`
- Canvas: HTML `<canvas>` with embedded vanilla JS
- Tabs component to switch between modes: `<tabs><tab>Desmos Interactive</tab><tab>Canvas Visualizer</tab></tabs>`

**Comparison Table** (built into lesson content):
| Feature | Desmos Embed | Canvas Visualizer |
|---------|-------------|-------------------|
| **Login required** | No (public) | No (pure client-side) |
| **External dependencies** | desmos.com | None (vanilla JS) |
| **Features** | Full graphing calculator | Basic parabola drawing |
| **Offline works** | No | Yes |
| **Bundle size impact** | 0 KB (external) | ~0 KB (inline script) |
| **Customization** | Extensive (sliders, tables) | Limited (coefficients only) |

**Quality Checklist** (wave-1 specific):
- [ ] Desmos iframe loads correctly
- [ ] Canvas visualizer draws parabola with coefficient inputs
- [ ] Both modes produce identical graph for same coefficients
- [ ] Mobile: tabs switch properly, iframes responsive
- [ ] Dark mode: canvas background adapts


8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Current State

The course rendering pipeline is a single file:

```
components/markdown/MarkdownRenderer.tsx
```

It uses `react-markdown` with this plugin chain:

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}        // GitHub Flavored Markdown
  rehypePlugins={[rehypeRaw]}        // Allow raw HTML
  components={{
    code: ({ node, className, children }) => {
      // Dispatches to different renderers based on language tag:
      //   ```mermaid  → MermaidDiagram
      //   ```question → QuestionBlock
      //   other       → SyntaxHighlighterWrapper
    }
  }}
>
```

### Design Pattern: Extend the Code Block Dispatch

We follow the **exact same pattern** already established by `mermaid` and `question`:

| Language Tag | Component | Rendering |
|-------------|-----------|-----------|
| `mermaid` | `MermaidDiagram` | Dynamic import of mermaid lib |
| `question` | `QuestionBlock` | JSON parse → interactive quiz |
| `math` | `MathBlock` | KaTeX render (rehype plugin) |
| `phet` | `PhETEmbed` | Iframe embed |
| `molecule` | `MoleculeViewer` | Dynamic import of 3Dmol.js |
| `plot` | `SciencePlot` | Dynamic import of Plotly |
| `dragdrop` | `DragOrderQuestion` | @dnd-kit sortable |
| `matching` | `MatchingQuestion` | @dnd-kit core |
| `fillblank` | `FillBlankQuestion` | Custom with @dnd-kit |

### Math: Dual Rendering Path

Math has **two** rendering paths (unlike other components):

1. **Inline/Block math** (`$...$` / `$$...$$`): Processed by `remark-math` → `rehype-katex` plugin chain. No code component involved.
2. **Fenced math** (``` ```math ```): Goes through the `code` component dispatch, rendered by KaTeX client-side.

This is necessary because `$` delimiters are parsed at the remark level, not as code blocks.

---

## Phase 1: Math Equations (KaTeX)

### 1.1 Packages

```bash
npm install remark-math@6 rehype-katex@7 katex@0.16
```

| Package | Version | Purpose | Bundle |
|---------|---------|---------|--------|
| `remark-math` | ^6.0.0 | Parse `$` and `$$` delimiters into mdast math nodes | ~3 KB |
| `rehype-katex` | ^7.0.1 | Transform math nodes into KaTeX HTML | ~5 KB |
| `katex` | ^0.16.x | The rendering engine + CSS | ~227 KB (CSS + fonts) |

Peer dependency chain: `react-markdown@9` requires `react@>=18` ✅ (already satisfied)

### 1.2 File Changes

#### `components/markdown/MarkdownRenderer.tsx`

**Add imports (after line 5):**
```tsx
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
```

**Modify remarkPlugins (line 288):**
```tsx
// BEFORE
remarkPlugins={[remarkGfm]}

// AFTER
remarkPlugins={[remarkGfm, remarkMath]}
```

**Modify rehypePlugins (line 289):**
```tsx
// BEFORE
rehypePlugins={[rehypeRaw]}

// AFTER
rehypePlugins={[rehypeRaw, rehypeKatex]}
```

**Add to langMap (after line 20):**
```tsx
math: 'math',
```

**Add dispatch in code component (after line 327, before line 329):**
```tsx
if (language === 'math') {
  try {
    // For fenced ```math blocks, render KaTeX client-side
    const katex = await import('katex')
    const html = katex.default.renderToString(codeString, {
      displayMode: true,
      throwOnError: false,
      trust: true,
    })
    return (
      <div
        className="my-6 text-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  } catch (e) {
    return (
      <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
        Math rendering error: {(e as Error).message}
      </div>
    )
  }
}
```

#### `app/globals.css`

**Add after mermaid styles (after line 497):**
```css
/* ========================================
   KATEX / MATH STYLES
   ======================================== */

/* Ensure KaTeX blocks render with proper spacing */
.katex-display {
  margin: 1.5rem 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.5rem 0;
}

/* Inline math should not wrap mid-equation */
.katex-display > .katex {
  white-space: nowrap;
}

/* Responsive: allow horizontal scroll on small screens */
@media (max-width: 640px) {
  .katex-display {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* Dark mode: adjust KaTeX colors for visibility */
.dark .katex {
  color: hsl(var(--foreground));
}

.dark .katex .mord,
.dark .katex .mbin,
.dark .katex .mrel,
.dark .katex .mopen,
.dark .katex .mclose,
.dark .katex .mpunct,
.dark .katex .minner {
  color: hsl(var(--foreground));
}

/* KaTeX error styling */
.katex-error {
  color: #ef4444;
  font-family: monospace;
  font-size: 0.875rem;
}
```

### 1.3 Markdown Syntax Supported

**Inline math (via remark-math plugin):**
```markdown
The equation $E = mc^2$ describes mass-energy equivalence.
```

**Block math (via remark-math plugin):**
```markdown
$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
```

**Fenced math block (via code component):**
````
```math
\frac{1}{2} + \frac{1}{3} = \frac{5}{6}
```
````

### 1.4 Plugin Order (Critical)

The plugin order matters:

```
remarkGfm → remarkMath     (GFM first, then math)
rehypeRaw → rehypeKatex     (Raw HTML first, then KaTeX)
```

If reversed, GFM may consume `$` delimiters before remark-math can parse them.

### 1.5 Coexistence with Mermaid

**Zero conflict.** Math and mermaid operate at different layers:

| Feature | Syntax | Layer | Conflict? |
|---------|--------|-------|-----------|
| Math | `$...$` / `$$...$$` | remark plugin | No |
| Math (fenced) | ` ```math ` | code component | No (processed before code component) |
| Mermaid | ` ```mermaid ` | code component | No |

The `rehype-katex` plugin processes math nodes at the rehype level, before the `code` component sees them. Fenced ` ```math ` blocks go through the code component but are rendered separately from mermaid.

### 1.6 Dark Mode

KaTeX renders HTML with inline styles. The dark mode CSS overrides ensure math remains readable:

- `.dark .katex` → sets `color: hsl(var(--foreground))`
- Individual KaTeX element classes (`.mord`, `.mbin`, etc.) → inherit foreground color

### 1.7 Testing Checklist

- [ ] Install packages without errors
- [ ] `$E = mc^2$` renders inline
- [ ] `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$` renders as block
- [ ] ` ```math ` fenced block renders
- [ ] Existing mermaid diagrams still work
- [ ] Existing question blocks still work
- [ ] Dark mode renders math correctly
- [ ] Mobile: math scrolls horizontally if too wide
- [ ] No hydration mismatches

---

## Phase 2: PhET Simulation Embeds

### 2.1 Packages

No new npm packages needed. Uses iframe embedding.

### 2.2 New Component

#### `components/markdown/PhETEmbed.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'

interface PhETEmbedProps {
  simulation: string
  height?: string
  label?: string
}

const PHET_BASE = 'https://phet.colorado.edu/sims/html'

export default function PhETEmbed({ 
  simulation, 
  height = '500px', 
  label = 'PhET Simulation' 
}: PhETEmbedProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const url = `${PHET_BASE}/${simulation}/latest/${simulation}_en.html`

  if (error) {
    return (
      <div className="my-6 p-6 border border-red-300 rounded-xl bg-red-50 dark:bg-red-950/30 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3">
          Failed to load simulation: {simulation}
        </p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          Open in new tab <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    )
  }

  return (
    <div className="my-6 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <Play className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-auto text-xs text-muted-foreground hover:text-primary"
        >
          Open fullscreen ↗
        </a>
      </div>
      <div className="relative" style={{ paddingBottom: '0', height }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading simulation...</span>
            </div>
          </div>
        )}
        <iframe
          src={url}
          title={label}
          className="w-full h-full border-0"
          style={{ height }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    </div>
  )
}
```

### 2.3 File Changes

#### `components/markdown/MarkdownRenderer.tsx`

**Add import (after line 10):**
```tsx
import PhETEmbed from './PhETEmbed'
```

**Add to langMap (after `math: 'math'`):**
```tsx
phet: 'phet',
```

**Add dispatch in code component (after math block):**
```tsx
if (language === 'phet') {
  try {
    const config = JSON.parse(codeString)
    return (
      <PhETEmbed
        simulation={config.simulation}
        height={config.height}
        label={config.label}
      />
    )
  } catch (e) {
    return (
      <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
        Invalid PhET config: {(e as Error).message}
      </div>
    )
  }
}
```

### 2.4 Markdown Syntax

````
```phet
{
  "simulation": "force-and-motion-basics",
  "height": "500px",
  "label": "Force and Motion Basics"
}
```
````

### 2.5 PhET Simulation Catalog

Common simulations for STEM courses:

| Simulation | URL Name | Subject |
|-----------|----------|---------|
| Force and Motion | `force-and-motion-basics` | Physics |
| Gravity and Orbits | `gravity-and-orbits` | Physics |
| Wave on a String | `wave-on-a-string` | Physics |
| Circuit Construction | `circuit-construction-kit-dc` | Physics/Engineering |
| Balancing Act | `balancing-act` | Physics |
| Molecule Shapes | `molecule-shapes` | Chemistry |
| Acid-Base Solutions | `acid-base-solutions` | Chemistry |
| Gene Expression | `gene-expression-essentials` | Biology |
| Natural Selection | `natural-selection` | Biology |

### 2.6 Testing Checklist

- [ ] PhET embed loads in iframe
- [ ] Loading spinner shows while loading
- [ ] Fallback link works when simulation fails
- [ ] "Open fullscreen" link works
- [ ] Height config is respected
- [ ] Mobile: iframe is responsive

---

## Phase 3: Molecular Viewer (3Dmol.js)

### 3.1 Packages

```bash
npm install molecule-3d-for-react
```

| Package | Purpose | Bundle |
|---------|---------|--------|
| `molecule-3d-for-react` | React wrapper for 3Dmol.js | ~50 KB |

### 3.2 New Component

#### `components/markdown/MoleculeViewer.tsx`

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Atom, ExternalLink } from 'lucide-react'

const Molecule3d = dynamic(
  () => import('molecule-3d-for-react').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px] bg-muted/30 rounded-lg">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
)

interface MoleculeViewerProps {
  format: string
  data: string
  style?: string
  color?: string
  height?: string
  label?: string
}

const PDB_URL = 'https://files.rcsb.org/download'

export default function MoleculeViewer({
  format,
  data,
  style = 'cartoon',
  color = 'spectrum',
  height = '400px',
  label = 'Molecular Structure'
}: MoleculeViewerProps) {
  const [error, setError] = useState(false)

  // Build model data - if data looks like a PDB ID, fetch from RCSB
  const isPdbId = /^[0-9][A-Za-z0-9]{3}$/.test(data.trim())
  const pdbUrl = isPdbId ? `${PDB_URL}/${data.trim().toUpperCase()}.pdb` : null

  if (error) {
    return (
      <div className="my-6 p-6 border border-red-300 rounded-xl bg-red-50 dark:bg-red-950/30 text-center">
        <p className="text-red-600 dark:text-red-400 mb-3">
          Failed to load molecule: {data}
        </p>
        {pdbUrl && (
          <a 
            href={pdbUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            View on RCSB PDB <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="my-6 rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <Atom className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {format.toUpperCase()} • Drag to rotate, Scroll to zoom
        </span>
      </div>
      <div style={{ height }}>
        <Molecule3d
          modelData={pdbUrl ? undefined : { atoms: [], bonds: [] }}
          url={pdbUrl || undefined}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
```

### 3.3 File Changes

#### `components/markdown/MarkdownRenderer.tsx`

**Add import:**
```tsx
import MoleculeViewer from './MoleculeViewer'
```

**Add to langMap:**
```tsx
molecule: 'molecule',
```

**Add dispatch:**
```tsx
if (language === 'molecule') {
  try {
    const config = JSON.parse(codeString)
    return (
      <MoleculeViewer
        format={config.format || 'pdb'}
        data={config.data}
        style={config.style}
        color={config.color}
        height={config.height}
        label={config.label}
      />
    )
  } catch (e) {
    return (
      <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
        Invalid molecule config: {(e as Error).message}
      </div>
    )
  }
}
```

### 3.4 Markdown Syntax

````
```molecule
{
  "format": "pdb",
  "data": "1CRN",
  "style": "cartoon",
  "color": "spectrum",
  "height": "400px",
  "label": "Crambin (1CRN)"
}
```
````

### 3.5 Testing Checklist

- [ ] Dynamic import works (no SSR)
- [ ] PDB ID loads from RCSB
- [ ] Molecule renders in 3D viewer
- [ ] Drag to rotate works
- [ ] Scroll to zoom works
- [ ] Error state shows fallback link

---

## Phase 4: Interactive Charts (Plotly.js)

### 4.1 Packages

```bash
npm install react-plotly.js plotly.js-basic-dist-min
```

| Package | Purpose | Bundle |
|---------|---------|--------|
| `react-plotly.js` | React wrapper for Plotly | ~50 KB |
| `plotly.js-basic-dist-min` | Partial Plotly bundle (not full) | ~800 KB |

**Important:** Use `plotly.js-basic-dist-min` (not `plotly.js`) to reduce bundle from ~3MB to ~800KB. The basic bundle includes: scatter, bar, pie, line charts — sufficient for educational use.

### 4.2 New Component

#### `components/markdown/SciencePlot.tsx`

```tsx
'use client'

import dynamic from 'next/dynamic'
import { BarChart3 } from 'lucide-react'

const Plot = dynamic(
  () => import('react-plotly.js').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] bg-muted/30 rounded-lg">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
)

interface SciencePlotProps {
  type: string
  title?: string
  xLabel?: string
  yLabel?: string
  data: Record<string, any>
  config?: Record<string, any>
  height?: number
}

export default function SciencePlot({
  type,
  title,
  xLabel,
  yLabel,
  data,
  config = {},
  height = 350
}: SciencePlotProps) {
  const plotData = [{
    x: data.x,
    y: data.y,
    type: type || 'scatter',
    mode: config.mode || 'lines+markers',
    name: config.name || title || '',
    marker: { color: config.lineColor || config.color || '#3b82f6' },
    line: config.lineWidth ? { width: config.lineWidth } : undefined,
  }]

  const layout = {
    title: title ? { text: title } : undefined,
    xaxis: xLabel ? { title: { text: xLabel } } : undefined,
    yaxis: yLabel ? { title: { text: yLabel } } : undefined,
    height,
    margin: { t: title ? 50 : 20, r: 20, b: xLabel ? 60 : 40, l: yLabel ? 60 : 40 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: 'currentColor' },
  }

  const plotConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    scrollZoom: true,
  }

  return (
    <div className="my-6 rounded-xl border bg-card shadow-sm overflow-hidden">
      {(title || type) && (
        <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {title || `${type} chart`}
          </span>
        </div>
      )}
      <div className="p-4">
        <Plot
          data={plotData}
          layout={layout}
          config={plotConfig}
          style={{ width: '100%', height: `${height}px` }}
          useResizeHandler
        />
      </div>
    </div>
  )
}
```

### 4.3 File Changes

#### `components/markdown/MarkdownRenderer.tsx`

**Add import:**
```tsx
import SciencePlot from './SciencePlot'
```

**Add to langMap:**
```tsx
plot: 'plot',
```

**Add dispatch:**
```tsx
if (language === 'plot') {
  try {
    const config = JSON.parse(codeString)
    return (
      <SciencePlot
        type={config.type}
        title={config.title}
        xLabel={config.xLabel}
        yLabel={config.yLabel}
        data={config.data}
        config={config.config}
        height={config.height}
      />
    )
  } catch (e) {
    return (
      <div className="my-6 p-4 border border-red-500 rounded-lg text-red-600 bg-red-50">
        Invalid plot config: {(e as Error).message}
      </div>
    )
  }
}
```

### 4.4 Markdown Syntax

````
```plot
{
  "type": "scatter",
  "title": "Projectile Motion",
  "xLabel": "Time (s)",
  "yLabel": "Distance (m)",
  "data": {
    "x": [0, 1, 2, 3, 4, 5],
    "y": [0, 4.9, 19.6, 44.1, 78.4, 122.5]
  },
  "config": {
    "mode": "lines+markers",
    "lineColor": "#3b82f6"
  },
  "height": 350
}
```
````

### 4.5 Testing Checklist

- [ ] Dynamic import works (no SSR)
- [ ] Scatter plot renders
- [ ] Axes labels display
- [ ] Title displays
- [ ] Zoom/pan works
- [ ] Responsive resize works
- [ ] Dark mode: font color adapts

---

