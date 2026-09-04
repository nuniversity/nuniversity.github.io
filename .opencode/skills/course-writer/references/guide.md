# Course Writer Reference Guide

## Reference Course

The `agent-memory-knowledge` course serves as the canonical reference for course structure:

```
content/courses/agent-memory-knowledge/
├── course.json          # Course metadata (area, difficulty, duration, i18n titles)
├── en/                  # English lessons
│   ├── 01-foundations-of-agent-memory.md
│   ├── 02-vector-stores-embeddings-and-rag-architecture.md
│   └── ...
├── pt/                  # Portuguese translations
└── es/                  # Spanish translations
```

## course.json Schema

```json
{
  "area": "Artificial Intelligence",
  "author": "NUniversity",
  "difficulty": "intermediate",
  "duration": "4 weeks",
  "icon": "database",
  "en": {
    "title": "Agent Knowledge Bases and Memory",
    "description": "Design persistent memory and knowledge systems...",
    "difficulty": "Intermediate",
    "duration": "4 Weeks"
  },
  "pt": { ... },
  "es": { ... }
}
```

## Lesson File Structure

1. YAML frontmatter (required fields: title, description, order, duration, difficulty)
2. H1 heading matching title
3. Major sections with `##`
4. Code blocks with language identifiers
5. Tables for comparisons
6. Mermaid diagrams where appropriate
7. Admonition boxes (`> [!WARNING]`, `> [!TIP]`, `> [!NOTE]`, `> [!IMPORTANT]`)
8. Interactive components (math, phet, plot, molecule, dragdrop, matching, fillblank)
9. Practice questions (minimum 5)
10. Key takeaways section

## Naming Convention

- Lesson files: `{order}-{slug}.md` (e.g., `01-foundations-of-agent-memory.md`)
- Course directory: kebab-case slug (e.g., `agent-memory-knowledge`)

---

## Interactive Components

The platform supports 7 interactive component types via fenced code blocks with JSON configs. STEM lessons (Math, Physics, Chemistry, Biology, Engineering) must include at least 2 interactive components.

### Math Equations (KaTeX)

**Tag:** ` ```math `

Renders mathematical expressions using KaTeX. Also supports inline `$...$` and display `$$...$$` via remark-math plugin.

**Config:**
```json
{
  "expression": "LaTeX string",
  "display": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expression` | string | Yes | LaTeX math expression |
| `display` | boolean | No | Display mode (default: true). false = inline |

**Example:**
```markdown
The quadratic formula is:

\```math
{ "expression": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", "display": true }
\```
```

**LaTeX escape rules:** Use double backslashes (`\\`) for LaTeX commands in JSON strings. Common commands: `\\frac{a}{b}`, `\\sqrt{x}`, `\\int`, `\\sum`, `\\vec{F}`, `\\alpha`, `\\beta`.

---

### PhET Simulation Embeds

**Tag:** ` ```phet `

Embeds interactive simulations from PhET Interactive Simulations (University of Colorado Boulder). Renders as a responsive iframe with loading spinner and attribution.

**Config:**
```json
{
  "slug": "simulation-slug",
  "title": "Display Title",
  "language": "en"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | PhET simulation slug (from phet.colorado.edu URL) |
| `title` | string | No | Display title shown above iframe |
| `language` | string | No | Interface language (default: en) |

**Example:**
```markdown
\```phet
{ "slug": "forces-and-motion-basics", "title": "Forces and Motion Basics", "language": "en" }
\```
```

**Finding slugs:** Visit https://phet.colorado.edu, open a simulation, and copy the slug from the URL (e.g., `/en/simulations/forces-and-motion-basics` → slug is `forces-and-motion-basics`).

---

### Interactive Charts (Recharts)

**Tag:** ` ```plot `

Embeds interactive charts using Recharts. Supports line, bar, scatter, and pie chart types. Charts are responsive and have dark-mode compatible tooltips.

**Config:**
```json
{
  "type": "line",
  "title": "Chart Title",
  "data": [
    {"x": 0, "y": 0},
    {"x": 1, "y": 9.8}
  ],
  "xKey": "x",
  "yKey": "y",
  "xLabel": "Time (s)",
  "yLabel": "Velocity (m/s)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | `line`, `bar`, `scatter`, or `pie` |
| `title` | string | No | Chart title |
| `data` | array | Yes | Array of data objects |
| `xKey` | string | Yes | Key for x-axis (not needed for pie) |
| `yKey` | string | Yes | Key for y-axis (not needed for pie) |
| `xLabel` | string | No | X-axis label |
| `yLabel` | string | No | Y-axis label |

**Pie chart config:** For pie charts, use `data` with `name` and `value` keys:
```json
{
  "type": "pie",
  "title": "Energy Distribution",
  "data": [
    {"name": "Kinetic", "value": 40},
    {"name": "Potential", "value": 35},
    {"name": "Thermal", "value": 25}
  ],
  "xKey": "name",
  "yKey": "value"
}
```

**Example (line chart):**
```markdown
\```plot
{
  "type": "line",
  "title": "Velocity vs Time",
  "data": [
    {"time": 0, "v": 0},
    {"time": 1, "v": 9.8},
    {"time": 2, "v": 19.6}
  ],
  "xKey": "time",
  "yKey": "v",
  "xLabel": "Time (s)",
  "yLabel": "Velocity (m/s)"
}
\```
```

---

### 3D Molecular Viewer (3Dmol.js)

**Tag:** ` ```molecule `

Renders 3D molecular structures from RCSB Protein Data Bank using 3Dmol.js. Users can drag to rotate and scroll to zoom.

**Config:**
```json
{
  "pdbId": "1CRN",
  "style": "cartoon",
  "color": "spectrum",
  "height": "400px"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pdbId` | string | Yes | 4-character PDB identifier (e.g., 1CRN, 4HHB) |
| `style` | string | No | `cartoon`, `sphere`, `stick`, `line`, or `surface` (default: cartoon) |
| `color` | string | No | `spectrum`, `chain`, `element`, or hex color (default: spectrum) |
| `height` | string | No | CSS height (default: 400px) |

**Example:**
```markdown
\```molecule
{ "pdbId": "1CRN", "style": "cartoon", "color": "spectrum" }
\```
```

**Finding PDB IDs:** Visit https://www.rcsb.org and search for a molecule. The 4-character ID is in the URL (e.g., `rcsb.org/structure/1CRN`).

---

### Drag-and-Drop Ordering

**Tag:** ` ```dragdrop `

Students drag items into the correct order. Uses @dnd-kit with keyboard support (Space/Enter to grab, Arrow keys to move, Escape to cancel).

**Config:**
```json
{
  "question": "Order these steps:",
  "items": ["Step 1", "Step 2", "Step 3"],
  "correctOrder": ["Step 1", "Step 2", "Step 3"],
  "explanation": "Explanation of the correct order."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | Question text |
| `items` | string[] | Yes | Items to order (displayed in random order) |
| `correctOrder` | string[] | Yes | Correct order (must contain all items) |
| `explanation` | string | No | Feedback shown after checking |

**Example:**
```markdown
\```dragdrop
{
  "question": "Order these steps for solving a kinematics problem:",
  "items": [
    "Identify knowns and unknowns",
    "Choose the correct kinematic equation",
    "Plug in values and solve",
    "Check units and reasonableness"
  ],
  "correctOrder": [
    "Identify knowns and unknowns",
    "Choose the correct kinematic equation",
    "Plug in values and solve",
    "Check units and reasonableness"
  ],
  "explanation": "Always start by listing what you know, then pick the equation that connects your knowns to your unknowns."
}
\```
```

---

### Matching Pairs

**Tag:** ` ```matching `

Students drag answer chips to match with question slots. Uses @dnd-kit with DragOverlay for visual feedback.

**Config:**
```json
{
  "question": "Match each concept:",
  "pairs": [
    {"left": "Concept A", "right": "Definition A"},
    {"left": "Concept B", "right": "Definition B"}
  ],
  "explanation": "Explanation of the matches."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | Question text |
| `pairs` | array | Yes | Array of `{left, right}` objects |
| `explanation` | string | No | Feedback shown after checking |

**Example:**
```markdown
\```matching
{
  "question": "Match each law of motion with its statement:",
  "pairs": [
    {"left": "First Law", "right": "An object at rest stays at rest unless acted upon"},
    {"left": "Second Law", "right": "F = ma"},
    {"left": "Third Law", "right": "For every action there is an equal and opposite reaction"}
  ],
  "explanation": "Newton's three laws form the foundation of classical mechanics."
}
\```
```

---

### Fill-in-the-Blank

**Tag:** ` ```fillblank `

Students drag words from a word bank into blank slots within a template text. Supports distractors (wrong options).

**Config:**
```json
{
  "question": "Complete the formula:",
  "template": "The force equals {{1}} times {{2}}.",
  "answers": {"1": "mass", "2": "acceleration"},
  "distractors": ["velocity", "distance", "time"],
  "explanation": "Explanation of the answer."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | Question text |
| `template` | string | Yes | Text with `{{N}}` placeholders for blanks |
| `answers` | object | Yes | Map of placeholder number to correct answer |
| `distractors` | string[] | No | Wrong options to include in word bank |
| `explanation` | string | No | Feedback shown after checking |

**Example:**
```markdown
\```fillblank
{
  "question": "Complete the conservation of energy equation:",
  "template": "The total {{1}} energy equals the total {{2}} energy: KE_i + PE_i = KE_f + PE_f. Kinetic energy is {{3}}mv² and gravitational potential energy is {{4}}.",
  "answers": {
    "1": "mechanical",
    "2": "final",
    "3": "½",
    "4": "mgh"
  },
  "distractors": ["thermal", "initial", "mv", "gh²"],
  "explanation": "In the absence of non-conservative forces, total mechanical energy is conserved."
}
\```
```

---

## Rules for Interactive Components

1. **STEM lessons:** Minimum 2 interactive components, maximum 3
2. **Non-STEM lessons:** Interactive components are optional
3. **Variety:** Don't repeat the same component type in consecutive lessons
4. **Placement:** Always place interactive components after the text that explains the concept
5. **Explanations:** Always include an `explanation` field in quiz configs (dragdrop, matching, fillblank)
6. **JSON validity:** All config JSON must be valid — the validation script checks this
7. **Data accuracy:** Chart data and molecule PDB IDs must be scientifically accurate
8. **Accessibility:** All interactive components support keyboard navigation
