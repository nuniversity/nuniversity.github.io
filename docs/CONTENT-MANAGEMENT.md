# 📝 Content Management

NUniversity uses a **file-system-based content model** — no CMS, no database, no external API. All content lives as Markdown files (`.md`) and JSON files (`.json`) inside the `content/` directory, co-located with the codebase and version-controlled with Git.

---

## Table of Contents

1. [Content Overview](#1-content-overview)
2. [Courses](#2-courses)
3. [Library Resources](#3-library-resources)
4. [Tools](#4-tools)
5. [Vocabulary Games](#5-vocabulary-games)
6. [Markdown Frontmatter Reference](#6-markdown-frontmatter-reference)
7. [Content Conventions & Best Practices](#7-content-conventions--best-practices)

---

## 1. Content Overview

```
content/
├── courses/       ← Structured learning paths (Markdown lessons)
├── games/         ← Vocabulary game word pairs (JSON)
├── library/       ← Curated external resources (Markdown metadata)
└── tools/         ← Tool metadata per locale (Markdown)
```

All content is **read at build time** by functions in `lib/`. Changes to content require a new build to take effect in production.

---

## 2. Courses

### Directory Structure

```
content/courses/
└── {course-slug}/
    ├── course.json          ← Course-level metadata (multilingual)
    └── {lang}/              ← 'en', 'pt', or 'es'
        ├── 01-lesson-name.md
        ├── 02-lesson-name.md
        └── 03-lesson-name.md
```

### Naming Conventions

| File | Convention | Example |
|---|---|---|
| Course folder | `kebab-case` | `intro-to-data-engineering` |
| Lesson files | `NN-description.md` (zero-padded number prefix) | `01-introduction.md`, `02-variables.md` |
| Language folders | ISO 639-1 code | `en`, `pt`, `es` |

The numeric prefix determines **lesson order** in the course sidebar. Files are sorted by `metadata.order` field, which should match the file number prefix.

---

### `course.json` — Course Metadata

Every course must have a `course.json` at the root of its folder:

```json
{
  "area": "Computer Science",
  "author": "Author Name",
  "difficulty": "beginner",
  "duration": "4 weeks",
  "icon": "code",
  "en": {
    "title": "Introduction to Programming",
    "description": "Learn the fundamentals of programming with hands-on exercises.",
    "difficulty": "Intermediate",
    "duration": "4 Weeks"
  },
  "pt": {
    "title": "Introdução à Programação",
    "description": "Aprenda os fundamentos da programação com exercícios práticos.",
    "difficulty": "Intermediário",
    "duration": "4 Semanas"
  },
  "es": {
    "title": "Introducción a la Programación",
    "description": "Aprende los fundamentos de la programación con ejercicios prácticos.",
    "difficulty": "Intermedio",
    "duration": "4 Semanas"
  }
}
```

#### `course.json` Fields Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `area` | `string` | Yes | Subject area (e.g., "Computer Science") |
| `author` | `string` | No | Course author name |
| `difficulty` | `string` | No | Global difficulty: `beginner`, `intermediate`, `advanced` |
| `duration` | `string` | No | Global duration estimate |
| `icon` | `string` | No | Icon identifier for UI display |
| `{lang}.title` | `string` | Yes (per locale) | Localized course title |
| `{lang}.description` | `string` | Yes (per locale) | Localized short description |
| `{lang}.difficulty` | `string` | No | Localized difficulty label |
| `{lang}.duration` | `string` | No | Localized duration string |

---

### Lesson Markdown Files

Each lesson is a Markdown file with **YAML frontmatter**:

```markdown
---
title: "Introduction to Programming"
description: "A beginner-friendly introduction to core programming concepts."
order: 1
difficulty: beginner
duration: "45 min"
---

# Introduction to Programming

Welcome to this course! In this lesson, we'll cover...

## What is Programming?

Programming is the process of giving instructions to a computer...

```python
print("Hello, World!")
```

> [!NOTE]
> This note uses the enhanced alert box feature.
```

#### Lesson Frontmatter Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Lesson title (shown in header and sidebar) |
| `description` | `string` | No | Short description shown under the title |
| `order` | `number` | Yes | Determines lesson sequence (1, 2, 3, ...) |
| `difficulty` | `string` | No | `beginner`, `intermediate`, or `advanced` |
| `duration` | `string` | No | Estimated reading/study time (e.g., `"45 min"`) |

---

### How to Add a New Course

#### 1. Create the course directory

```bash
mkdir -p content/courses/my-new-course/en
```

#### 2. Create `course.json`

```json
{
  "area": "Software Engineering",
  "difficulty": "beginner",
  "duration": "2 weeks",
  "en": {
    "title": "My New Course",
    "description": "A short description of the course.",
    "duration": "2 Weeks"
  }
}
```

#### 3. Create lesson files

```bash
# content/courses/my-new-course/en/01-introduction.md
---
title: "Introduction"
description: "Overview of what this course covers."
order: 1
difficulty: beginner
duration: "20 min"
---

# Introduction

Course content goes here...
```

#### 4. Build & verify

```bash
npm run dev
# Visit: http://localhost:3000/en/courses/my-new-course/01-introduction
```

---

### Existing Courses

| Slug | Area | Locales |
|---|---|---|
| `intro-to-programming` | Computer Science | en, pt, es |
| `intro-to-data-engineering` | Data Engineering | en |
| `practical-ai` | Artificial Intelligence | en, pt, es |
| `mermaid-diagram` | Computer Science | en |

---

## 3. Library Resources

The library is a curated collection of **external educational resources** — videos, ebooks, courses, blog posts, repositories, podcasts, and articles.

### Directory Structure

```
content/library/
└── {lang}/
    └── {type}/
        └── {resource-id}.md
```

**Supported types:**
- `video`
- `ebook`
- `course`
- `blog`
- `repository`
- `podcast`
- `article`

### Resource Markdown File

Library resource files contain **only frontmatter** (no body content is used at runtime):

```markdown
---
id: cs50-harvard
title: "CS50: Introduction to Computer Science"
description: "Harvard's introduction to computer science and programming."
url: "https://www.youtube.com/playlist?list=PLhQjrBD2T382..."
thumbnail: "https://i.ytimg.com/vi/YoXxevp1WRQ/maxresdefault.jpg"
author: "David J. Malan"
category: "Computer Science"
difficulty: "beginner"
duration: "24 hours"
publishDate: "2023-01-01"
lastUpdated: "2024-10-01"
tags: ["programming", "algorithms", "python", "c"]
language: "en"
isPaid: false
rating: 4.9
platform: "YouTube"
---
```

#### Library Resource Fields Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier (matches filename without `.md`) |
| `title` | `string` | Yes | Resource title |
| `description` | `string` | Yes | Short description |
| `url` | `string` | Yes | Link to the external resource |
| `thumbnail` | `string` | No | Image URL for the card thumbnail |
| `author` | `string` | Yes | Creator / author name |
| `category` | `string` | Yes | Subject category (see [Categories](#categories)) |
| `difficulty` | `string` | No | `beginner`, `intermediate`, `advanced` |
| `duration` | `string` | No | Time investment (e.g., `"24 hours"`) — for videos/courses |
| `pages` | `number` | No | Page count — for ebooks |
| `publishDate` | `string` | No | ISO date string (`YYYY-MM-DD`) |
| `lastUpdated` | `string` | No | ISO date string — used for sorting |
| `tags` | `string[]` | No | Searchable tags |
| `language` | `string` | No | Content language code (default: locale folder) |
| `isPaid` | `boolean` | Yes | `true` if resource costs money |
| `rating` | `number` | No | Rating score (0–5) |
| `platform` | `string` | No | Platform name (e.g., "YouTube", "Udemy", "GitHub") |

#### Categories

Valid category values:
```
Computer Science | Data Engineering | Software Engineering
Cloud Computing  | Artificial Intelligence | Mathematics
Physics | Web Development | Mobile Development
DevOps | Cybersecurity | Blockchain
```

### How to Add a Library Resource

```bash
# Example: add a new YouTube video in English
touch content/library/en/video/my-resource.md
```

```markdown
---
id: my-resource
title: "Amazing Tutorial Series"
description: "A comprehensive series covering X from scratch."
url: "https://youtube.com/..."
author: "Creator Name"
category: "Software Engineering"
difficulty: "intermediate"
duration: "10 hours"
lastUpdated: "2025-01-01"
tags: ["tutorial", "backend"]
language: "en"
isPaid: false
platform: "YouTube"
---
```

---

## 4. Tools

Interactive tools have **two parts**:
1. **Content metadata** — a Markdown file in `content/tools/` (what appears in the tools listing)
2. **React component** — the actual interactive tool in `components/tools/`

### Directory Structure

```
content/tools/
└── {tool-slug}/
    ├── en.md   ← English metadata
    ├── pt.md   ← Portuguese metadata
    └── es.md   ← Spanish metadata
```

### Tool Metadata File

```markdown
---
title: Eisenhower Matrix
description: Prioritize tasks effectively using the Eisenhower Matrix method.
category: Productivity
icon: grid-3x3
order: 4
---

# Eisenhower Matrix Tool

This section (the body) is used as help/documentation text displayed on the tool page.
It supports full Markdown including code blocks, lists, and tables.
```

#### Tool Metadata Frontmatter Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes | Tool display name |
| `description` | `string` | Yes | Short description for the listing card |
| `category` | `string` | Yes | Tool category (see dictionary `tools.categories`) |
| `icon` | `string` | No | Icon identifier (Lucide icon name) |
| `order` | `number` | No | Display order in the tools listing (lower = first) |

### Existing Tools

| Slug | Name | Category |
|---|---|---|
| `eisenhower-matrix` | Eisenhower Matrix | Productivity |
| `llm-prompt-builder` | LLM Prompt Builder | Artificial Intelligence |
| `swot-matrix` | SWOT Matrix | Business Strategy |
| `brain-writing-session` | Brain Writing Session | Collaboration |

### How to Add a New Tool

#### Step 1 — Create the metadata files

```bash
mkdir content/tools/my-new-tool
touch content/tools/my-new-tool/en.md
touch content/tools/my-new-tool/pt.md
touch content/tools/my-new-tool/es.md
```

```markdown
---
title: My New Tool
description: A brief description of what this tool does.
category: Productivity
icon: calculator
order: 5
---

# My New Tool

Documentation about how to use this tool...
```

#### Step 2 — Create the React component

```tsx
// components/tools/MyNewTool.tsx
'use client'

export default function MyNewTool({ lang, dict }) {
  return (
    <div>
      {/* Interactive tool UI */}
    </div>
  )
}
```

#### Step 3 — Register in the tool page router

```tsx
// app/[lang]/tools/[slug]/page.tsx
// Add a case for your new tool slug
```

---

## 5. Vocabulary Games

Games are stored as **JSON files** in `content/games/vocabulary/`.

### Game JSON Structure

```json
{
  "id": "en-to-pt",
  "title": "English to Portuguese - Basic Vocabulary",
  "description": "Match English words with their Portuguese translations",
  "difficulty": "beginner",
  "category": "vocabulary",
  "language_pair": {
    "source": "en",
    "target": "pt"
  },
  "words": [
    {
      "id": "1",
      "source": "Hello",
      "target": "Olá",
      "context": "greeting"
    },
    {
      "id": "2",
      "source": "Goodbye",
      "target": "Tchau",
      "context": "greeting"
    }
  ]
}
```

#### Game JSON Fields Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique identifier (matches filename without `.json`) |
| `title` | `string` | Yes | Display title |
| `description` | `string` | Yes | Short description |
| `difficulty` | `string` | Yes | `beginner`, `intermediate`, `advanced` |
| `category` | `string` | Yes | Game category (currently `vocabulary`) |
| `language_pair.source` | `string` | Yes | Source language ISO code |
| `language_pair.target` | `string` | Yes | Target language ISO code |
| `words[].id` | `string` | Yes | Unique word identifier |
| `words[].source` | `string` | Yes | Word in the source language |
| `words[].target` | `string` | Yes | Translation in the target language |
| `words[].context` | `string` | No | Semantic context (e.g., `"greeting"`, `"food"`) |

### Available Games

| File | Languages | Difficulty |
|---|---|---|
| `en-to-pt.json` | English → Portuguese | Beginner |
| `en-to-pt-advanced.json` | English → Portuguese | Advanced |
| `es-to-en.json` | Spanish → English | Beginner |
| `es-to-pt.json` | Spanish → Portuguese | Beginner |

### How to Add a New Vocabulary Game

```bash
touch content/games/vocabulary/fr-to-en.json
```

```json
{
  "id": "fr-to-en",
  "title": "French to English - Basic Vocabulary",
  "description": "Match French words with their English translations",
  "difficulty": "beginner",
  "category": "vocabulary",
  "language_pair": {
    "source": "fr",
    "target": "en"
  },
  "words": [
    { "id": "1", "source": "Bonjour", "target": "Hello", "context": "greeting" },
    { "id": "2", "source": "Merci", "target": "Thank you", "context": "courtesy" }
  ]
}
```

The game is automatically picked up on the next build — no code changes required.

---

## 6. Markdown Frontmatter Reference

### Quick Reference — All Frontmatter Fields

| Field | Used In | Type | Description |
|---|---|---|---|
| `title` | Courses, Tools, Library | `string` | Display title |
| `description` | Courses, Tools, Library | `string` | Short description |
| `order` | Courses, Tools | `number` | Sort order |
| `difficulty` | Courses, Library, Games | `string` | `beginner`/`intermediate`/`advanced` |
| `duration` | Courses, Library | `string` | Time estimate |
| `category` | Tools, Library | `string` | Subject category |
| `icon` | Tools | `string` | Lucide icon name |
| `author` | Library | `string` | Content creator |
| `url` | Library | `string` | External resource URL |
| `thumbnail` | Library | `string` | Image URL |
| `tags` | Library | `string[]` | Searchable tags |
| `isPaid` | Library | `boolean` | Paywall flag |
| `rating` | Library | `number` | Rating 0–5 |
| `platform` | Library | `string` | Platform name |
| `publishDate` | Library | `string` | ISO 8601 date |
| `lastUpdated` | Library | `string` | ISO 8601 date |
| `language` | Library | `string` | Content language code |
| `pages` | Library (ebooks) | `number` | Page count |

---

## 7. Content Conventions & Best Practices

### General

- ✅ Always use **kebab-case** for folder and file names
- ✅ Always include **required frontmatter fields**
- ✅ Write lesson files with a **numeric prefix** (`01-`, `02-`, ...) matching the `order` field
- ✅ Create the **English (`en`) version first** before adding other locales
- ✅ Use **relative paths** for images stored in the same content directory
- ✅ Use **ISO 8601** format for dates (`2025-01-15`)

### Courses

- Keep lessons **focused** — one concept per lesson
- Use `## ` headings (H2) for major sections within a lesson
- Add an `order` field starting at `1`, not `0`
- Include `difficulty` and `duration` to help learners plan
- Use the **enhanced alert box** syntax for important callouts (see [MARKDOWN-RENDERER.md](./MARKDOWN-RENDERER.md))

### Library

- Always provide a valid `url` pointing to the external resource
- Include `lastUpdated` so the library can be sorted chronologically
- Use accurate `isPaid` values — learners depend on this filter
- Choose the most specific `category` available

### Games

- Keep word pairs **contextually grouped** using the `context` field
- Use at least **20 word pairs** for a satisfying game experience
- Advanced games should contain less common vocabulary

### Images in Courses

Store images alongside lesson files:

```
content/courses/intro-to-data-engineering/en/media/
└── data-engineering-lifecycle.png
```

Reference in Markdown:
```markdown
![Data Engineering Lifecycle](./media/data-engineering-lifecycle.png)
```
