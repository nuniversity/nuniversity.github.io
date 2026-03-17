# 🤝 Contributing

Thank you for your interest in contributing to NUniversity! This document outlines how you can help improve the platform — whether through content, code, bug fixes, or translations.

---

## Table of Contents

1. [Ways to Contribute](#1-ways-to-contribute)
2. [Getting Started](#2-getting-started)
3. [Branching Strategy](#3-branching-strategy)
4. [Commit Message Convention](#4-commit-message-convention)
5. [Contributing Content](#5-contributing-content)
6. [Contributing Code](#6-contributing-code)
7. [Contributing Translations](#7-contributing-translations)
8. [Pull Request Process](#8-pull-request-process)
9. [Code Style Guidelines](#9-code-style-guidelines)
10. [Reporting Issues](#10-reporting-issues)

---

## 1. Ways to Contribute

| Type | Examples |
|---|---|
| 📚 **Content** | Add a new course, lesson, library resource, or vocabulary game |
| 🌍 **Translations** | Translate courses, tools, or UI strings to Portuguese or Spanish |
| 🐛 **Bug Fixes** | Fix rendering issues, broken links, typos, or incorrect behavior |
| ✨ **Features** | Implement new tools, game types, or UI improvements |
| 🏗️ **Refactoring** | Improve code quality, performance, or maintainability |
| 📖 **Documentation** | Improve or expand the `/docs` documentation |

---

## 2. Getting Started

### 1. Fork the repository

Click **Fork** on the GitHub repository page to create your own copy.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/nuniversity.github.io.git
cd nuniversity.github.io
```

### 3. Add the upstream remote

```bash
git remote add upstream https://github.com/nuniversity/nuniversity.github.io.git
```

### 4. Set up the development environment

Follow the full setup guide: **[GETTING-STARTED.md](./GETTING-STARTED.md)**

```bash
npm install
npm run dev
```

### 5. Sync with upstream before starting work

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## 3. Branching Strategy

Always create a new branch for your contribution. Never commit directly to `main`.

### Branch Naming Convention

```
{type}/{short-description}
```

| Type | When to Use | Example |
|---|---|---|
| `feat/` | New feature or content | `feat/python-course` |
| `fix/` | Bug fix | `fix/mermaid-render-error` |
| `content/` | New or updated content only | `content/data-engineering-lesson-3` |
| `i18n/` | Translation work | `i18n/pt-tools-dictionary` |
| `docs/` | Documentation changes | `docs/update-architecture` |
| `refactor/` | Code refactoring | `refactor/library-component` |
| `style/` | CSS/UI-only changes | `style/header-mobile-fix` |

### Create a branch

```bash
git checkout -b feat/my-new-feature
```

---

## 4. Commit Message Convention

We use **Conventional Commits** format:

```
{type}({scope}): {short description}

{optional body}
```

### Types

| Type | Description |
|---|---|
| `feat` | New feature or content |
| `fix` | Bug fix |
| `content` | Adding or updating Markdown/JSON content |
| `i18n` | Translation changes |
| `docs` | Documentation changes |
| `refactor` | Code change that neither adds a feature nor fixes a bug |
| `style` | Formatting/styling changes |
| `chore` | Build system or tooling changes |

### Scope (optional)

The scope provides additional context:

```
feat(courses): add intro-to-python course
fix(markdown): resolve mermaid zoom on mobile
content(library): add clean-code ebook resource
i18n(pt): translate tools dictionary
```

### Examples

```bash
git commit -m "content(courses): add lesson 4 to data-engineering course"
git commit -m "feat(tools): add Pomodoro timer tool"
git commit -m "fix(header): fix mobile menu not closing on navigation"
git commit -m "i18n(es): translate games section in dictionary"
git commit -m "docs: add CONTRIBUTING guide"
```

---

## 5. Contributing Content

Content contributions are the most impactful way to help NUniversity grow. You can add new courses, library resources, or vocabulary games **without writing any code**.

### Adding a New Course

See the full guide: **[CONTENT-MANAGEMENT.md — Courses](./CONTENT-MANAGEMENT.md#2-courses)**

Quick checklist:
- [ ] Create `content/courses/{slug}/course.json` with multilingual metadata
- [ ] Create `content/courses/{slug}/en/01-lesson.md` (at minimum)
- [ ] Each lesson has `title`, `order`, and `description` in frontmatter
- [ ] Verify locally: `npm run dev` → visit `/en/courses/{slug}/01-lesson`

### Adding a Library Resource

See: **[CONTENT-MANAGEMENT.md — Library](./CONTENT-MANAGEMENT.md#3-library-resources)**

Quick checklist:
- [ ] Create `content/library/en/{type}/{id}.md`
- [ ] All required frontmatter fields present (`id`, `title`, `description`, `url`, `author`, `category`, `isPaid`)
- [ ] `url` is valid and accessible
- [ ] `lastUpdated` is set (used for sorting)

### Adding a Vocabulary Game

See: **[CONTENT-MANAGEMENT.md — Games](./CONTENT-MANAGEMENT.md#5-vocabulary-games)**

Quick checklist:
- [ ] Create `content/games/vocabulary/{source}-to-{target}.json`
- [ ] Minimum 20 word pairs
- [ ] Each word pair has `id`, `source`, `target`

---

## 6. Contributing Code

### Before Writing Code

1. Check [open issues](https://github.com/nuniversity/nuniversity.github.io/issues) to avoid duplicate work
2. For significant features, open an issue first to discuss the approach
3. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design

### Component Guidelines

- Follow the **Server / Client split** pattern:
  - `page.tsx` — data fetching only, passes data as props
  - `*-client.tsx` — interactive UI, uses React hooks
- Use `'use client'` only when necessary
- Import types from centralized sources (`@/lib/i18n/config`, `@/lib/i18n/get-dictionary`)
- Always accept `lang: Locale` and `dict: Dictionary` as props for localizable text

### Adding a New Page

```tsx
// app/[lang]/new-page/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { Metadata } from 'next'

export async function generateMetadata({ params }) {
  const dict = await getDictionary(params.lang)
  return {
    title: dict.newPage?.title || 'New Page',
    description: dict.newPage?.subtitle || '...',
  }
}

export default async function NewPage({ params }) {
  const dict = await getDictionary(params.lang)
  return <div>{/* Server-rendered content */}</div>
}
```

### Adding a New Interactive Tool

1. **Create the React component** in `components/tools/MyTool.tsx`
2. **Create content metadata** in `content/tools/my-tool/{lang}.md`
3. **Register in the tool router** at `app/[lang]/tools/[slug]/page.tsx`
4. **Add dictionary strings** to `dictionaries/en.json` (and `pt.json`, `es.json`)

### Adding a New Data Function

```ts
// lib/my-feature/get-my-data.ts
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { type Locale } from '@/lib/i18n/config'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'my-feature')

export async function getMyData(locale: Locale) {
  // Always handle missing files gracefully
  if (!fs.existsSync(CONTENT_DIR)) return []

  // Always implement locale fallback to 'en'
  // Always use try/catch and return empty arrays on error
}
```

---

## 7. Contributing Translations

Translations make NUniversity accessible to more people. There are two levels of translation:

### Level 1 — UI Strings (Dictionaries)

Translate the JSON dictionary files:

```bash
# Edit an existing language
nano dictionaries/pt.json

# Or copy English as a starting point for a new language
cp dictionaries/en.json dictionaries/fr.json
```

Keep all JSON **keys identical** across all language files. Only translate the **values**.

```json
// en.json
"navigation": { "courses": "Courses" }

// pt.json
"navigation": { "courses": "Cursos" }

// es.json
"navigation": { "courses": "Cursos" }
```

### Level 2 — Course Content

Translate course lesson files:

```bash
# Create a translated lesson file
mkdir -p content/courses/intro-to-programming/pt
cp content/courses/intro-to-programming/en/01-introduction.md \
   content/courses/intro-to-programming/pt/01-introduction.md
# Then translate the content
```

### Level 3 — Tool Metadata

```bash
cp content/tools/eisenhower-matrix/en.md content/tools/eisenhower-matrix/pt.md
# Translate title and description in frontmatter
```

### Translation Quality Guidelines

- Translate **meaning**, not just words — educational content requires clear language
- Keep **technical terms** in their commonly accepted form in the target language
- Preserve all **Markdown formatting** (headings, lists, code blocks, alert boxes)
- Keep **code blocks** in English (code is universal)
- Verify the translated page renders correctly: `npm run dev`

---

## 8. Pull Request Process

### Before Opening a PR

- [ ] Your branch is up-to-date with `upstream/main`
- [ ] `npm run build` completes without errors
- [ ] New content appears correctly at `http://localhost:3000/en/...`
- [ ] All locale versions work (if applicable)
- [ ] Commit messages follow the convention

### Opening the PR

1. Push your branch to your fork:
   ```bash
   git push origin feat/my-contribution
   ```
2. Open a Pull Request on GitHub from your fork to `nuniversity/nuniversity.github.io:main`
3. Fill out the PR description:

```markdown
## Summary
Brief description of what this PR does.

## Type of Change
- [ ] New content (course / library resource / game)
- [ ] New feature (tool / page / component)
- [ ] Bug fix
- [ ] Translation
- [ ] Documentation
- [ ] Refactoring

## Testing
How was this tested? (e.g., "Ran npm run dev, verified at /en/courses/...")

## Screenshots (if applicable)

## Checklist
- [ ] Build passes (`npm run build`)
- [ ] All locale versions work
- [ ] Frontmatter is complete and valid
- [ ] No hardcoded text (uses dictionary keys)
```

### Review Process

- PRs are reviewed by maintainers
- Automated: `npm run build` is run on every PR (via GitHub Actions)
- Feedback is provided as inline PR comments
- Once approved, the PR is merged by a maintainer

---

## 9. Code Style Guidelines

### TypeScript

- Use **explicit types** for function parameters and return values
- Prefer `interface` over `type` for object shapes
- Use `type` imports: `import { type Locale } from '@/lib/i18n/config'`
- No `any` types except in legacy tool components (accepted for now)
- Use optional chaining (`?.`) and nullish coalescing (`??`) over `||` for nullable values

### React / Next.js

- Use **functional components** with TypeScript
- Extract complex logic into custom hooks
- Avoid deeply nested conditional rendering — extract sub-components
- Use `const` for component declarations: `const MyComponent = () => {}`
- All Client Components that use `useRouter` must be `'use client'`

### CSS / Tailwind

- Use **Tailwind utility classes** as the primary styling method
- Use **DaisyUI component classes** for common UI patterns (`btn`, `alert`, `table`, etc.)
- Use `dark:` variants for dark mode styles
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Avoid inline styles except for dynamic values (e.g., progress bar widths)
- Custom animations are defined in `tailwind.config.js`

### File & Folder Naming

| Item | Convention | Example |
|---|---|---|
| Components | `PascalCase.tsx` | `MarkdownRenderer.tsx` |
| Pages | `page.tsx`, `layout.tsx` (Next.js standard) | `page.tsx` |
| Client pages | `kebab-case-client.tsx` | `courses-client.tsx` |
| Lib functions | `kebab-case.ts` | `get-course-content.ts` |
| Content files | `kebab-case.md` / `kebab-case.json` | `01-introduction.md` |
| Content folders | `kebab-case` | `intro-to-programming` |

---

## 10. Reporting Issues

### Bug Reports

Open a [GitHub Issue](https://github.com/nuniversity/nuniversity.github.io/issues) with:

```markdown
## Bug Description
Clear description of the problem.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots (if applicable)

## Environment
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Firefox 121]
- Language: [e.g., en, pt]
```

### Feature Requests

Open a GitHub Issue with:

```markdown
## Feature Request
Clear description of the feature.

## Problem it Solves
Why is this feature needed? What problem does it solve?

## Proposed Solution
How would you implement this?

## Alternatives Considered
What alternatives did you consider?
```

### Content Issues

For content errors (typos, outdated information, broken links in library), you can:
- Open an issue with the exact URL and description of the error
- Or submit a PR directly fixing the Markdown/JSON file

---

## Code of Conduct

NUniversity is committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be **respectful** and constructive in discussions
- Be **welcoming** to newcomers and people of all backgrounds
- Focus on **what is best for the community and learners**
- Show **empathy** towards other community members

Contributions that violate these principles will not be accepted.

---

## Questions?

- Open a [GitHub Discussion](https://github.com/nuniversity/nuniversity.github.io/discussions)
- Email: thenuniversitybr@gmail.com
- LinkedIn: [NUniversity](https://www.linkedin.com/company/nuniversity/)

Thank you for helping make education more accessible! 🎓
