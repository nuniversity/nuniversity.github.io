# 📚 NUniversity Platform — Documentation

> **NUniversity** is an open, multilingual educational platform built with **Next.js 14** and deployed as a static site on GitHub Pages.  
> Mission: *Empower learners worldwide through accessible, interactive, and high-quality education.*

---

## 📖 Documentation Index

| Document | Description |
|---|---|
| **[Architecture](./ARCHITECTURE.md)** | System design, folder structure, data flow |
| **[Getting Started](./GETTING-STARTED.md)** | Local dev setup, environment, scripts |
| **[Internationalization (i18n)](./INTERNATIONALIZATION.md)** | Multi-language support, routing, dictionaries |
| **[Content Management](./CONTENT-MANAGEMENT.md)** | How to add courses, tools, library resources, and games |
| **[Components Reference](./COMPONENTS.md)** | All UI components documented |
| **[Markdown Renderer](./MARKDOWN-RENDERER.md)** | Enhanced Markdown features for course authors |
| **[Deployment](./DEPLOYMENT.md)** | GitHub Pages static export and CI/CD pipeline |
| **[Contributing](./CONTRIBUTING.md)** | How to contribute to the project |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev

# 3. Open in browser
open http://localhost:3000
```

---

## 🏗️ Platform Overview

NUniversity is composed of **five main features**, all accessible via a locale-prefixed URL (e.g. `/en/`, `/pt/`, `/es/`):

| Feature | URL Pattern | Description |
|---|---|---|
| **Home** | `/{lang}` | Landing page with hero and features |
| **Courses** | `/{lang}/courses` | Markdown-driven learning paths |
| **Tools** | `/{lang}/tools` | Interactive productivity/study tools |
| **Games** | `/{lang}/games` | Vocabulary and learning games |
| **Library** | `/{lang}/library` | Curated external learning resources |

---

## 🌍 Supported Languages

| Code | Language | Flag |
|---|---|---|
| `en` | English | 🇺🇸 |
| `pt` | Português | 🇧🇷 |
| `es` | Español | 🇪🇸 |

---

## 🛠️ Tech Stack

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

---

## 📄 License

© 2025 NUniversity. All Rights Reserved.
