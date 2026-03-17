# 🧩 Components Reference

This document covers every reusable component in the NUniversity platform — its purpose, props, usage patterns, and where it fits in the application.

---

## Table of Contents

1. [Layout Components](#1-layout-components)
   - [Header](#header)
   - [Footer](#footer)
2. [Provider Components](#2-provider-components)
   - [Providers / ThemeProvider](#providers--themeprovider)
3. [Language Components](#3-language-components)
   - [LanguageSwitcher](#languageswitcher)
4. [Home Page Components](#4-home-page-components)
   - [Hero](#hero)
   - [Features](#features)
5. [Markdown Components](#5-markdown-components)
   - [MarkdownRenderer](#markdownrenderer)
   - [FixWrapper](#fixwrapper)
6. [Tool Components](#6-tool-components)
   - [EisenhowerMatrix](#eisenhowermatrix)
   - [LLMPromptBuilder](#llmpromptbuilder)
   - [SWOTMatrix](#swotmatrix)
   - [BrainWritingSession](#brainwritingsession)
7. [Contact Components](#7-contact-components)
   - [Contact](#contact)
   - [ContactForm](#contactform)
8. [Ads Components](#8-ads-components)
   - [AdsSpace](#adsspace)
9. [Component Props Conventions](#9-component-props-conventions)

---

## 1. Layout Components

### Header

**File:** `components/layout/Header.tsx`  
**Type:** Client Component (`'use client'`)  
**Role:** Sticky top navigation bar present on all pages.

#### Features
- NUniversity logo and brand name
- Desktop navigation links with icons
- "NEW" badge on recently added sections (Tools, Games, Library)
- Light/Dark theme toggle button
- Language switcher dropdown
- Responsive mobile hamburger menu with slide-in animation

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `lang` | `Locale` | Yes | Current locale (`'en'`, `'pt'`, `'es'`) |
| `dict` | `Dictionary` | Yes | Translation dictionary for navigation labels |

#### Navigation Items

```ts
const navigation = [
  { name: dict.navigation.home,    href: `/${lang}`,         icon: Home    },
  { name: dict.navigation.courses, href: `/${lang}/courses`, icon: BookOpen },
  { name: dict.navigation.tools,   href: `/${lang}/tools`,   icon: Calculator, isNew: true },
  { name: dict.navigation.games,   href: `/${lang}/games`,   icon: GamepadIcon, isNew: true },
  { name: dict.navigation.library, href: `/${lang}/library`, icon: Library, isNew: true },
  { name: dict.navigation.about,   href: `/${lang}/about`   },
  { name: dict.navigation.contact, href: `/${lang}/contact` },
]
```

#### Theme Toggle

Uses `useTheme()` from `Providers.tsx`. Renders a Moon icon in light mode and a Sun icon in dark mode.

#### Usage

```tsx
// app/[lang]/layout.tsx
<Header lang={params.lang} dict={dict} />
```

---

### Footer

**File:** `components/layout/Footer.tsx`  
**Type:** Server-compatible Component  
**Role:** Full-width site footer at the bottom of all pages.

#### Features
- Brand logo + mission description
- Social media links (YouTube, Instagram, GitHub, LinkedIn, Email)
- Platform links (Courses, Tools, Games, Library)
- Company links (About, Contact)
- Privacy Policy, Terms of Service, Cookies links
- Copyright notice with dynamic year
- "Made with ❤️ for learners worldwide" tagline

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `lang` | `Locale` | Yes | Current locale |
| `dict` | `Dictionary` | Yes | Translation dictionary |

#### Social Links

```ts
const socialLinks = [
  { name: "Youtube",   href: 'https://www.youtube.com/@nuniversity',          icon: Youtube },
  { name: "Instagram", href: 'https://www.instagram.com/thenuniversity/',      icon: Instagram },
  { name: "GitHub",    href: 'https://github.com/nuniversity',                 icon: Github },
  { name: "LinkedIn",  href: 'https://www.linkedin.com/company/nuniversity/',  icon: Linkedin },
  { name: "Email",     href: 'mailto:thenuniversitybr@gmail.com',              icon: Mail },
]
```

#### Usage

```tsx
// app/[lang]/layout.tsx
<Footer lang={params.lang} dict={dict} />
```

---

## 2. Provider Components

### Providers / ThemeProvider

**File:** `components/providers/Providers.tsx`  
**Type:** Client Component (`'use client'`)  
**Role:** Application-level context providers. Currently manages the theme system.

#### Exports

| Export | Type | Description |
|---|---|---|
| `Providers` | Component | Root provider wrapper — wrap the entire app |
| `useTheme` | Hook | Access `theme` state and `toggleTheme` function |

#### `useTheme()` Return Value

```ts
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}
```

#### Theme Behavior

1. On mount: reads `localStorage.getItem('theme')`
2. Fallback: checks `window.matchMedia('(prefers-color-scheme: dark)')`
3. On change: writes to `localStorage`, toggles `document.documentElement.classList.dark`, and sets `data-theme` attribute for DaisyUI

#### Usage

```tsx
// app/[lang]/layout.tsx
<Providers>
  <div className="min-h-screen flex flex-col">
    <Header lang={lang} dict={dict} />
    <main>{children}</main>
    <Footer lang={lang} dict={dict} />
  </div>
</Providers>
```

```tsx
// In any Client Component:
import { useTheme } from '@/components/providers/Providers'

const { theme, toggleTheme } = useTheme()
```

---

## 3. Language Components

### LanguageSwitcher

**File:** `components/language/LanguageSwitcher.tsx`  
**Type:** Client Component (`'use client'`)  
**Role:** Dropdown selector for switching the active locale.

#### Features
- Shows current locale flag + name
- Dropdown with all supported locales
- Checkmark on the active locale
- Sets `NEXT_LOCALE` cookie (1-year expiry) on selection
- Navigates to the same page path in the new locale
- Click-outside overlay to close

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `currentLocale` | `Locale` | Yes | The currently active locale |

#### Locale Switch Logic

```ts
const switchLanguage = (newLocale: Locale) => {
  const segments = pathname.split('/')
  segments[1] = newLocale           // replace locale segment
  const newPathname = segments.join('/')
  document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
  router.push(newPathname)
}
```

#### Usage

```tsx
// components/layout/Header.tsx
<LanguageSwitcher currentLocale={lang} />
```

---

## 4. Home Page Components

### Hero

**File:** `components/home/Hero.tsx`  
**Type:** Client Component (`'use client'`)  
**Role:** Full-viewport hero section on the home page.

#### Features
- Animated gradient background with pulsing blur circles
- Platform badge (animated)
- Main headline with highlighted gradient word
- Subheadline
- CTA button → courses page
- Feature pill badges (Coding, Tools, Courses)
- Animated scroll indicator

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `lang` | `Locale` | Yes | Current locale for link generation |
| `dict` | `Dictionary` | Yes | Translations for all text content |

#### Key Dictionary Keys Used

```
dict.hero.badge
dict.hero.title
dict.hero.titleHighlight
dict.hero.subtitle
dict.hero.cta.explore
dict.hero.features.coding
dict.hero.features.tools
dict.hero.features.courses
```

---

### Features

**File:** `components/home/Features.tsx`  
**Type:** Client Component (`'use client'`)  
**Role:** Feature cards grid displayed on the home page below the hero.

#### Features
- Section title with highlighted word
- Grid of 6 feature cards with icons
- "Discover all features" CTA button

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `lang` | `Locale` | Yes | Current locale |
| `dict` | `Dictionary` | Yes | Translations |

#### Feature Cards (from dictionary)

```
Interactive Courses | Coding Tools | Study Tools
Educational Games   | Video Integration | Community Driven
```

---

## 5. Markdown Components

### MarkdownRenderer

**File:** `components/markdown/MarkdownRenderer.tsx`  
**Type:** Client Component (`'use client'`)  
**Role:** Renders Markdown content with rich styling, code highlighting, diagrams, and interactive features.

#### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `content` | `string` | Yes | Raw Markdown string to render |

#### Supported Markdown Features

| Feature | Implementation |
|---|---|
| **GFM** (tables, task lists, strikethrough) | `remark-gfm` plugin |
| **Raw HTML** in Markdown | `rehype-raw` plugin |
| **Syntax highlighting** | `react-syntax-highlighter` (via `FixWrapper`) |
| **Mermaid diagrams** | Dynamic import of `mermaid` library |
| **Alert boxes** | Custom `blockquote` renderer (4 types) |
| **Copy button** on code blocks | `CopyButton` sub-component |
| **Responsive tables** | Wrapped in scrollable container |
| **External links** | Auto-open in new tab |

#### Language Aliases

The renderer normalizes language identifiers before passing to the highlighter:

```ts
const langMap = {
  psql: 'sql', postgresql: 'sql',
  py: 'python',
  rs: 'rust',
  sh: 'bash', shell: 'bash', zsh: 'bash',
  terraform: 'terraform', hcl: 'terraform', tf: 'terraform',
  diagram: 'mermaid',
}
```

#### Alert Box Syntax

```markdown
> [!NOTE]      → blue info box
> [!WARNING]   → yellow warning box
> [!DANGER]    → red error box
> [!SUCCESS]   → green success box
```

#### Mermaid Diagram Syntax

````markdown
```mermaid
flowchart TD
    A[Start] --> B[End]
```
````

Mermaid diagrams include:
- Zoom in/out controls (+/- buttons and Ctrl+Mouse Wheel)
- Reset zoom (1:1 button)
- Fullscreen toggle
- Error display with collapsible code

#### Usage

```tsx
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'

<MarkdownRenderer content={lesson.content} />
```

---

### FixWrapper

**File:** `components/markdown/FixWrapper.tsx`  
**Type:** Client Component  
**Role:** Compatibility wrapper around `react-syntax-highlighter` to prevent SSR hydration mismatches.

#### Props

Passes all props through to `SyntaxHighlighter` from `react-syntax-highlighter`.

#### Usage

Only used internally by `MarkdownRenderer`. Not intended for direct use.

---

## 6. Tool Components

All tool components follow this interface convention:

```ts
interface ToolProps {
  lang: Locale   // for built-in translations
  dict: any      // for dictionary-driven text
}
```

All tools are **Client Components** (`'use client'`).

---

### EisenhowerMatrix

**File:** `components/tools/EisenhowerMatrix.tsx`  
**Role:** Interactive priority management tool based on the Eisenhower Decision Matrix.

#### Features
- **4 Quadrants:** Do First (🔴), Schedule (🔵), Delegate (🟡), Eliminate (⚫)
- Add, edit, delete tasks within each quadrant
- Mark tasks as complete (with strikethrough and checkmark)
- **Matrix view** (2×2 grid) and **List view** toggle
- Show/hide completed tasks toggle
- Task completion statistics (total, completed, pending, completion rate)
- **Export tasks** as JSON or CSV
- **Import tasks** from JSON or CSV file (with drag-and-drop modal)
- Full multilingual support (EN, PT, ES — built-in translations in component)

#### State Shape

```ts
{
  tasks: {
    doFirst:  Task[]
    schedule: Task[]
    delegate: Task[]
    eliminate: Task[]
  },
  view: 'matrix' | 'list',
  showCompleted: boolean
}

interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: string  // ISO date
}
```

#### Import/Export Format

**JSON:**
```json
{
  "tasks": [
    { "quadrant": "doFirst", "task": "Fix critical bug", "completed": false, "createdAt": "..." }
  ],
  "exportedAt": "..."
}
```

**CSV:**
```csv
Quadrant,Task,Completed,Created At
"doFirst","Fix critical bug","false","2025-01-01T..."
```

---

### LLMPromptBuilder

**File:** `components/tools/LLMPromptBuilder.tsx`  
**Role:** Structured prompt generator for Large Language Models (ChatGPT, Claude, Gemini, etc.)

#### Features
- Form with 8 configurable fields:
  - **Agent Role** (optional) — sets the AI persona
  - **Objective** (required) — what the AI should do
  - **Context** (optional) — background information
  - **Target Audience** (optional) — who the response is for
  - **Tone** (dropdown) — Professional, Casual, Technical, Creative, Educational
  - **Constraints** (optional) — length limits, restrictions
  - **Output Format** (optional) — JSON, bullet points, etc.
  - **Examples** (optional) — sample outputs
- Live **generated prompt preview** panel
- **Copy to clipboard** button
- **Download as .txt** button
- Reset form button
- Tips section with prompt engineering best practices
- Full dictionary-driven translations

#### Generated Prompt Template

```
You are {role}.

**Objective:**
{objective}

**Context:**
{context}

**Target Audience:**
{target}

**Constraints:**
{constraints}

**Output Format:**
{outputFormat}

**Tone:**
{tone}

**Examples:**
{examples}

Please provide a comprehensive response following the guidelines above.
```

---

### SWOTMatrix

**File:** `components/tools/SWOTMatrix.tsx`  
**Role:** Strategic analysis tool using the SWOT (Strengths, Weaknesses, Opportunities, Threats) framework.

#### Features
- 4-quadrant editable grid
- Add/remove items in each quadrant
- Export functionality
- Multilingual support

---

### BrainWritingSession

**File:** `components/tools/BrainWritingSession.tsx`  
**Role:** Collaborative brainstorming tool based on the 6-3-5 BrainWriting method.

#### Features
- Timer-based idea generation sessions
- Multiple participant simulation
- Idea collection and display
- Export session results

---

## 7. Contact Components

### Contact

**File:** `components/contacts/Contact.tsx`  
**Role:** Displays contact information (email, location, social media links).

#### Props

| Prop | Type | Description |
|---|---|---|
| `lang` | `Locale` | Current locale |
| `dict` | `Dictionary` | Translation dictionary |

---

### ContactForm

**File:** `components/contacts/ContactForm.tsx`  
**Role:** Contact form powered by Formspree.

#### Features
- Fields: Full Name, Email Address, Subject, Message
- Client-side validation via React Hook Form
- Submits to Formspree endpoint
- Success/error feedback states
- Fully translated via dictionary

#### Dependencies
- `react-hook-form` — form state and validation
- `@formspree/react` — form submission service

---

## 8. Ads Components

### AdsSpace

**File:** `components/ads/AdsSpace.tsx`  
**Role:** Placeholder component for advertisement slots.

#### Usage
Can be placed anywhere in the layout. Renders an ad unit or empty space depending on configuration.

---

## 9. Component Props Conventions

All components throughout the codebase follow consistent prop naming conventions:

### Standard Props

| Prop Name | Type | Description |
|---|---|---|
| `lang` | `Locale` | The active locale (`'en' \| 'pt' \| 'es'`) |
| `dict` | `Dictionary` | The full translation dictionary object |
| `children` | `React.ReactNode` | Child elements (for wrapper components) |

### TypeScript Type Imports

Components always import types from centralized sources:

```ts
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
```

### Client vs Server

| Decorator | Rule |
|---|---|
| `'use client'` | Required when using `useState`, `useEffect`, `useRouter`, `usePathname`, browser APIs, or event handlers |
| *(none)* | Server Components — only for pure rendering and data display with no interactivity |

### Path Alias

All imports use the `@/` alias which resolves to the project root:

```ts
import Header from '@/components/layout/Header'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getAllCourses } from '@/lib/courses/get-course-content'
```
