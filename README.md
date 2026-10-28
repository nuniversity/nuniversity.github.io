# Nuniversity Platform

Multilingual educational platform built with **Next.js 14** (App Router), deployed as a static site on GitHub Pages.

[Website](https://nuniversity.github.io/en)

## Project Structure

```
nuniversity.github.io/
├── app/[lang]/              # Locale-based pages (en, pt, es)
│   ├── layout.tsx           # Root layout — Header, Footer, Providers
│   ├── page.tsx             # Home page
│   ├── about/               # About page
│   ├── contact/             # Contact page (Formspree form)
│   ├── courses/             # Course listing + lesson viewer
│   ├── games/               # Coding, conversation, logic, math, physics, puzzles
│   ├── languages/           # Vocabulary activities hub, pair & player pages
│   ├── library/             # Curated external resources
│   ├── quizzes/             # Certification quizzes & mock exams
│   ├── roadmaps/            # Structured learning paths
│   └── tools/               # Interactive tools
├── components/              # Reusable UI components
│   ├── home/                # Hero, Features, Stats, Newsletter, etc.
│   ├── layout/              # Header, Footer
│   ├── markdown/            # Markdown renderer, syntax highlighting
│   ├── providers/           # Theme provider (light/dark)
│   ├── language/            # Language switcher
│   ├── tools/               # Eisenhower Matrix, SWOT, LLMPromptBuilder, etc.
│   └── contacts/            # Contact form
├── content/                 # All static content (Markdown + JSON)
│   ├── courses/             # Course lessons per locale
│   ├── games/               # Game JSON (coding, conversation, logic, math, physics, puzzles)
│   ├── languages/           # Language activity JSON (vocabulary, 5 activities)
│   ├── library/             # External resource metadata
│   ├── quizzes/             # Quizzes app JSON
│   └── tools/               # Tool metadata per locale
├── dictionaries/            # UI translation strings (en.json, pt.json, es.json)
├── lib/                     # Data access / utility functions
│   ├── courses/
│   ├── games/
│   ├── languages/
│   ├── i18n/                # Locale config + dictionary loader
│   ├── library/
│   ├── quizzes/
│   └── tools/
├── public/                  # Static assets (favicon, robots.txt, team photos)
├── docs/                    # Full documentation (see below)
├── middleware.ts            # i18n locale redirect
├── nextjs.config.js         # Next.js config (static export)
├── tailwind.config.js       # Tailwind + DaisyUI
└── package.json
```

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the middleware will redirect you to your preferred locale (`/en`, `/pt`, or `/es`).

Python tooling (content validators, Bandit) lives in a virtualenv:

```bash
uv sync --extra dev
# or
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
```

`git commit` runs Husky + lint-staged: `vitest related --run` and `eslint --fix`
for TypeScript, and Bandit for Python. A MEDIUM or HIGH Bandit finding blocks the
commit; `SKIP_BANDIT=1 git commit ...` bypasses it once. See
[docs/operations/CONTRIBUTING.md](docs/operations/CONTRIBUTING.md#pre-commit-checks).

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Start development server with HMR |
| build | `npm run build` | Build static site to `/out` |
| start | `npm run start` | Serve the production build |
| lint | `npm run lint` | Run ESLint |
| security:bandit | `npm run security:bandit` | Static security scan of the Python (Bandit) |

## Build for Production

```bash
npm run build && npm run start
```

The build generates a fully static site in the `out/` directory. The site is deployed to GitHub Pages via GitHub Actions on every push to `main`.

## Features

- **Multi-language**: English, Portuguese, Spanish — with automatic locale detection and redirect
- **Courses**: 38 Markdown-driven learning paths with enhanced rendering (code highlighting, Mermaid diagrams, alert boxes)
- **Interactive Tools**: 10 tools — Eisenhower Matrix, SWOT, LLM Prompt Builder, Pomodoro Timer, Habit Tracker, Flashcards, Regex Tester, Unit Converter, Decision Matrix, Brain Writing
- **Games**: 7 games across 6 categories — coding, conversation, math, logic, physics, puzzles
- **Languages**: vocabulary activities at /[lang]/languages/ — matching quiz & flashcards with saved progress
- **Quizzes**: certification quizzes & mock exams at /[lang]/quizzes/
- **Library**: 59+ curated external educational resources (videos, ebooks, courses, blogs, repositories, podcasts, articles)
- **Roadmaps**: Structured learning paths with progress tracking
- **AI Agents**: Course Writer & Game Builder agents for automated content generation
- **Dark Mode**: System-aware theme with manual toggle
- **Responsive**: Mobile-first design with Tailwind CSS + DaisyUI
- **Fully Static**: Zero infrastructure cost, served via GitHub Pages CDN

## Documentation

Full documentation is available in the [`docs/`](./docs) directory:

### Architecture & Design
| Document | Description |
|---|---|
| [Architecture](./docs/architecture/ARCHITECTURE.md) | System design, C4 diagrams, data flow |
| [Components](./docs/architecture/COMPONENTS.md) | All UI components documented |

### Features
| Document | Description |
|---|---|
| [Content Management](./docs/features/CONTENT-MANAGEMENT.md) | Adding courses, tools, library resources, games, language activities |
| [Internationalization](./docs/features/INTERNATIONALIZATION.md) | Multi-language support, routing, dictionaries |
| [Roadmaps](./docs/features/ROADMAPS.md) | Structured learning paths architecture |
| [Games](./docs/features/GAMES.md) | Game system, lifecycle, content quality |
| [Languages App](./docs/assessment/2026-app-review/DESIGN-LANGUAGES-APP.md) | Languages app design — activity schema, routes, storage, i18n |
| [Quizzes Design](./docs/assessment/2026-app-review/DESIGN-QUIZZES-APP.md) | Quizzes app design — schema, routes, migration from games/quiz |
| [Markdown Renderer](./docs/features/MARKDOWN-RENDERER.md) | Enhanced Markdown features for course authors |

### Operations
| Document | Description |
|---|---|
| [Deployment](./docs/operations/DEPLOYMENT.md) | GitHub Pages static export and CI/CD pipeline |
| [Testing](./docs/operations/TESTING.md) | Test plan and strategy |
| [Contributing](./docs/operations/CONTRIBUTING.md) | How to contribute to the project |

### AI & Agents
| Document | Description |
|---|---|
| [Agents](./docs/ai/AGENTS.md) | Course Writer & Game Builder agent system |
| [OpenCode Harness](./docs/ai/OPENCODE-HARNESS.md) | Deterministic agentic development plan |

### Reference
| Document | Description |
|---|---|
| [Assessment](./docs/assessment/ASSESSMENT.md) | Codebase audit and improvement analysis |
| [Getting Started](./docs/getting-started/GETTING-STARTED.md) | Local dev setup, environment, scripts |
| [Remaining Courses](./docs/reference/remaining-courses-documentation.md) | Plans for courses 4-10 of SE roadmap |
| [Roadmap Status](./docs/reference/roadmap-implementation-status.md) | Roadmap progress tracker |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + DaisyUI + HeroUI |
| Markdown | react-markdown + remark-gfm + rehype-raw |
| Diagrams | Mermaid.js |
| Code Highlight | react-syntax-highlighter |
| Animations | Framer Motion |
| Forms | React Hook Form + Formspree |
| Deployment | GitHub Pages (static export) |

## Copyright

© 2026 Nuniversity. All Rights Reserved.
