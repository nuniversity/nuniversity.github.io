# NUniversity Platform

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
│   ├── games/               # Vocabulary games
│   ├── library/             # Curated external resources
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
│   ├── games/               # Vocabulary game word pairs
│   ├── library/             # External resource metadata
│   └── tools/               # Tool metadata per locale
├── dictionaries/            # UI translation strings (en.json, pt.json, es.json)
├── lib/                     # Data access / utility functions
│   ├── courses/
│   ├── games/
│   ├── i18n/                # Locale config + dictionary loader
│   ├── library/
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

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Start development server with HMR |
| build | `npm run build` | Build static site to `/out` |
| start | `npm run start` | Serve the production build |
| lint | `npm run lint` | Run ESLint |

## Build for Production

```bash
npm run build && npm run start
```

The build generates a fully static site in the `out/` directory. The site is deployed to GitHub Pages via GitHub Actions on every push to `main`.

## Features

- **Multi-language**: English, Portuguese, Spanish — with automatic locale detection and redirect
- **Courses**: Markdown-driven learning paths with enhanced rendering (code highlighting, Mermaid diagrams, alert boxes)
- **Interactive Tools**: Eisenhower Matrix, SWOT Analysis, LLM Prompt Builder, Brain Writing Session
- **Vocabulary Games**: Flashcard matching games for language learning
- **Library**: Curated collection of external educational resources (videos, ebooks, courses, etc.)
- **Dark Mode**: System-aware theme with manual toggle
- **Responsive**: Mobile-first design with Tailwind CSS + DaisyUI
- **Fully Static**: Zero infrastructure cost, served via GitHub Pages CDN

## Documentation

Full documentation is available in the [`docs/`](./docs) directory:

| Document | Description |
|---|---|
| [Architecture](./docs/ARCHITECTURE.md) | System design, folder structure, data flow |
| [Getting Started](./docs/GETTING-STARTED.md) | Local dev setup, environment, scripts |
| [Internationalization](./docs/INTERNATIONALIZATION.md) | Multi-language support, routing, dictionaries |
| [Content Management](./docs/CONTENT-MANAGEMENT.md) | Adding courses, tools, library resources, games |
| [Components Reference](./docs/COMPONENTS.md) | All UI components documented |
| [Markdown Renderer](./docs/MARKDOWN-RENDERER.md) | Enhanced Markdown features for course authors |
| [Deployment](./docs/DEPLOYMENT.md) | GitHub Pages static export and CI/CD pipeline |
| [Contributing](./docs/CONTRIBUTING.md) | How to contribute to the project |

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

© 2026 NUniversity. All Rights Reserved.
