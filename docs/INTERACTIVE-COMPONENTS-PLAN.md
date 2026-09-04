# Implementation Plan: Interactive Course Components

> Extending NUniversity's course platform to support Math, Science, and Interactive content.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Math Equations (KaTeX)](#phase-1-math-equations-katex)
3. [Phase 2: PhET Simulation Embeds](#phase-2-phet-simulation-embeds)
4. [Phase 3: Molecular Viewer (3Dmol.js)](#phase-3-molecular-viewer-3dmoljs)
5. [Phase 4: Interactive Charts (Plotly.js)](#phase-4-interactive-charts-plotlyjs)
6. [Phase 5: Advanced Quiz Types](#phase-5-advanced-quiz-types)
7. [File Change Summary](#file-change-summary)
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

## Phase 5: Advanced Quiz Types

### 5.1 Packages

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

| Package | Purpose | Bundle |
|---------|---------|--------|
| `@dnd-kit/core` | DnD primitives | ~15 KB |
| `@dnd-kit/sortable` | Sortable preset | ~10 KB |
| `@dnd-kit/utilities` | CSS transform helpers | ~5 KB |

### 5.2 New Components

#### `components/markdown/DragOrderQuestion.tsx`

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, CheckCircle2, XCircle, ListOrdered } from 'lucide-react'

function SortableItem({ id, index, isCorrect, answered }: { 
  id: string; index: number; isCorrect?: boolean; answered?: boolean 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  let variant = 'border-border bg-card'
  if (answered) {
    variant = isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-red-500 bg-red-50 dark:bg-red-950/30'
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing ${variant}`}>
      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
        {index + 1}
      </span>
      <span className="text-foreground">{id}</span>
      {answered && (
        isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" /> : <XCircle className="w-4 h-4 text-red-600 ml-auto" />
      )}
    </div>
  )
}

interface DragOrderData {
  id: string
  question: string
  items: string[]
  correctOrder: string[]
  explanation?: string
}

export default function DragOrderQuestion({ data }: { data: DragOrderData }) {
  const [items, setItems] = useState(() => [...data.items].sort(() => Math.random() - 0.5))
  const [answered, setAnswered] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems(prev => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const isCorrect = answered && JSON.stringify(items) === JSON.stringify(data.correctOrder)

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <ListOrdered className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Ordering Question</span>
      </div>
      <div className="p-4 sm:p-6">
        <p className="font-medium mb-4">{data.question}</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item, index) => (
                <SortableItem key={item} id={item} index={index} isCorrect={item === data.correctOrder[index]} answered={answered} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {answered && (
          <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950/30 border border-green-200' : 'bg-red-50 dark:bg-red-950/30 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
              <span className="font-semibold text-sm">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
            </div>
            {data.explanation && <p className="text-sm mt-1">{data.explanation}</p>}
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          {!answered ? (
            <button onClick={() => setAnswered(true)} className="px-6 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              Check Order
            </button>
          ) : (
            <button onClick={() => { setItems([...data.items].sort(() => Math.random() - 0.5)); setAnswered(false) }} className="px-6 py-2 text-sm font-medium rounded-lg bg-muted text-foreground hover:bg-accent">
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

#### `components/markdown/MatchingQuestion.tsx`

Similar pattern with left/right pairs and drag-to-connect lines.

#### `components/markdown/FillBlankQuestion.tsx`

Similar pattern with word bank and drop targets.

### 5.3 Markdown Syntax

**Drag-and-drop ordering:**
````
```dragdrop
{
  "id": "order-planets",
  "question": "Order these planets from closest to farthest from the Sun",
  "items": ["Venus", "Mercury", "Earth", "Mars"],
  "correctOrder": ["Mercury", "Venus", "Earth", "Mars"],
  "explanation": "Mercury is closest, then Venus, Earth, and Mars."
}
```
````

**Matching pairs:**
````
```matching
{
  "id": "match-elements",
  "question": "Match each element with its symbol",
  "pairs": [
    {"left": "Hydrogen", "right": "H"},
    {"left": "Oxygen", "right": "O"},
    {"left": "Carbon", "right": "C"}
  ],
  "explanation": "H, O, C are the chemical symbols."
}
```
````

**Fill-in-the-blank:**
````
```fillblank
{
  "id": "fill-cell",
  "question": "The ___ is the powerhouse of the cell.",
  "blanks": ["mitochondria"],
  "options": ["mitochondria", "nucleus", "ribosome", "membrane"],
  "explanation": "Mitochondria produce ATP through cellular respiration."
}
```
````

### 5.4 Testing Checklist

- [ ] Drag-and-drop reorders items
- [ ] Touch drag works on mobile
- [ ] Check answer validates order
- [ ] Correct/incorrect feedback displays
- [ ] Try Again resets
- [ ] Matching: pairs connect correctly
- [ ] Fill-blank: word bank works

---

## File Change Summary

### New Files (6)

```
components/markdown/
├── PhETEmbed.tsx              (NEW - ~80 lines)
├── MoleculeViewer.tsx         (NEW - ~90 lines)
├── SciencePlot.tsx            (NEW - ~90 lines)
├── DragOrderQuestion.tsx      (NEW - ~120 lines)
├── MatchingQuestion.tsx       (NEW - ~100 lines)
└── FillBlankQuestion.tsx      (NEW - ~100 lines)
```

### Modified Files (2)

```
components/markdown/MarkdownRenderer.tsx  (MODIFY - add imports, plugins, langMap, dispatch)
app/globals.css                          (MODIFY - add KaTeX dark mode styles)
```

### New Packages (9)

| Phase | Package | Command |
|-------|---------|---------|
| 1 | `remark-math` | `npm install remark-math@6` |
| 1 | `rehype-katex` | `npm install rehype-katex@7` |
| 1 | `katex` | `npm install katex@0.16` |
| 2 | (none) | — |
| 3 | `molecule-3d-for-react` | `npm install molecule-3d-for-react` |
| 4 | `react-plotly.js` | `npm install react-plotly.js` |
| 4 | `plotly.js-basic-dist-min` | `npm install plotly.js-basic-dist-min` |
| 5 | `@dnd-kit/core` | `npm install @dnd-kit/core` |
| 5 | `@dnd-kit/sortable` | `npm install @dnd-kit/sortable` |
| 5 | `@dnd-kit/utilities` | `npm install @dnd-kit/utilities` |

---

## Testing Strategy

### Per-Phase Testing

After each phase:

```bash
# 1. Install new packages
npm install

# 2. Run dev server
npm run dev

# 3. Test in browser with sample markdown

# 4. Run build to verify static export works
npm run build

# 5. Run existing tests
npm test
```

### Integration Testing

After all phases:

1. Create a test course `content/courses/test-interactive/` with all component types
2. Verify all 3 locales (en, pt, es) render correctly
3. Test dark mode
4. Test mobile viewport
5. Test with `npm run build` (static export)

### Regression Testing

- Existing `opencode-*` courses still render correctly
- Mermaid diagrams still work
- Question blocks still work
- Code syntax highlighting still works
- Alert boxes still work

---

## Implementation Order

| Order | Phase | Estimated Time | Dependencies |
|-------|-------|---------------|--------------|
| 1 | KaTeX (Math) | 30 min | remark-math, rehype-katex, katex |
| 2 | PhET (Sims) | 20 min | None |
| 3 | Plotly (Charts) | 20 min | react-plotly.js, plotly.js-basic-dist-min |
| 4 | DnD Quizzes | 40 min | @dnd-kit/* |
| 5 | Molecular Viewer | 20 min | molecule-3d-for-react |

**Total estimated time: ~2 hours**
