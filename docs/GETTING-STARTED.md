# 🚀 Getting Started

This guide walks you through setting up the NUniversity development environment from scratch on any operating system.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install Node.js via FNM](#2-install-nodejs-via-fnm)
3. [Clone the Repository](#3-clone-the-repository)
4. [Install Dependencies](#4-install-dependencies)
5. [Run the Development Server](#5-run-the-development-server)
6. [Build for Production](#6-build-for-production)
7. [Available Scripts](#7-available-scripts)
8. [Environment Variables](#8-environment-variables)
9. [IDE Setup (VS Code)](#9-ide-setup-vs-code)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

| Tool | Required Version | Purpose |
|---|---|---|
| **Node.js** | See `.node-version` | JavaScript runtime |
| **npm** | Bundled with Node.js | Package manager |
| **Git** | Latest | Version control |
| **FNM** *(recommended)* | Latest | Node version manager |

> **Tip:** Check the `.node-version` file at the project root to find the exact Node.js version required.

---

## 2. Install Node.js via FNM

FNM (Fast Node Manager) is the recommended tool for managing Node.js versions.

### Linux / macOS / WSL

```bash
# Install system dependencies (Debian/Ubuntu)
sudo apt-get -y update && \
  apt-get -y install curl unzip && \
  apt-get -y clean && \
  apt-get -y autoremove

# Install FNM
curl -fsSL https://fnm.vercel.app/install | bash

# Reload your shell (or open a new terminal)
source ~/.bashrc   # or ~/.zshrc

# List available Node.js versions
fnm list-remote

# Install the version specified in .node-version
fnm install

# Verify
node --version
npm --version
```

### Windows (PowerShell)

```powershell
# Install FNM via winget
winget install Schniz.fnm

# Configure FNM for PowerShell (add to $PROFILE)
fnm env --use-on-cd --shell power-shell | Out-String | Invoke-Expression

# List available Node.js versions
fnm list-remote

# Install the version from .node-version
fnm install

# Verify
node --version
npm --version
```

> **Note:** FNM will automatically pick up the `.node-version` file when you `cd` into the project directory.

---

## 3. Clone the Repository

```bash
git clone https://github.com/nuniversity/nuniversity.github.io.git
cd nuniversity.github.io
```

---

## 4. Install Dependencies

### Install global tooling (one-time)

```bash
npm install -g typescript tsx @types/node
```

### Install project dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json`, including:

- **next** — The Next.js framework
- **react** / **react-dom** — React library
- **tailwindcss** / **daisyui** / **@heroui/react** — Styling
- **react-markdown** / **remark-gfm** / **rehype-raw** — Markdown rendering
- **mermaid** — Diagram support
- **gray-matter** — YAML frontmatter parsing
- **framer-motion** — Animations
- **react-hook-form** / **@formspree/react** — Contact form

---

## 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The server supports **Hot Module Replacement (HMR)** — changes to source files are reflected immediately without a full page reload.

### Navigating locally

| URL | Page |
|---|---|
| `http://localhost:3000` | Redirects to `/en` (default locale) |
| `http://localhost:3000/en` | Home (English) |
| `http://localhost:3000/pt` | Home (Portuguese) |
| `http://localhost:3000/es` | Home (Spanish) |
| `http://localhost:3000/en/courses` | Courses listing |
| `http://localhost:3000/en/tools` | Tools listing |
| `http://localhost:3000/en/games` | Games listing |
| `http://localhost:3000/en/library` | Library |

---

## 6. Build for Production

### Build the static site

```bash
npm run build
```

This generates a fully static site in the `/out` directory.

### Preview the production build locally

```bash
npm run start
```

> **Note:** For the production static export, `npm run start` serves the `/out` directory. The `assetPrefix` and `basePath` are set to empty string in development mode, so local preview may differ slightly from the live GitHub Pages deployment.

### Inspect the output

```bash
ls out/
```

You'll see a directory structure of pre-rendered HTML files for every locale, course, lesson, game, and tool.

---

## 7. Available Scripts

| Script | Command | Description |
|---|---|---|
| **dev** | `npm run dev` | Start development server with HMR |
| **build** | `npm run build` | Build static site to `/out` |
| **start** | `npm run start` | Serve the production build |
| **lint** | `npm run lint` | Run ESLint |
| **export** | `npm run export` | Legacy export command (same as build) |

---

## 8. Environment Variables

The project uses **no required environment variables** for basic development. All content is file-system based.

The only configuration that differs between environments is in `nextjs.config.js`:

```js
// nextjs.config.js
assetPrefix: process.env.NODE_ENV === 'production' ? '/nuniversity.github.io' : '',
basePath:    process.env.NODE_ENV === 'production' ? '/nuniversity.github.io' : '',
```

| Variable | Development | Production |
|---|---|---|
| `assetPrefix` | `''` (empty) | `/nuniversity.github.io` |
| `basePath` | `''` (empty) | `/nuniversity.github.io` |

> **Formspree:** The contact form uses [Formspree](https://formspree.io/). If you want to test the contact form, create a free account and update the form endpoint in `components/contacts/ContactForm.tsx`.

---

## 9. IDE Setup (VS Code)

### Recommended Extensions

| Extension | ID | Purpose |
|---|---|---|
| ES7+ React/Redux Snippets | `dsznajder.es7-react-js-snippets` | React boilerplate |
| Tailwind CSS IntelliSense | `bradlc.vscode-tailwindcss` | Autocomplete for Tailwind classes |
| TypeScript Hero | `rbbit.typescript-hero` | Import organizer |
| Prettier | `esbenp.prettier-vscode` | Code formatting |
| ESLint | `dbaeumer.vscode-eslint` | Linting |
| MDX | `unifiedjs.vscode-mdx` | Markdown editing |

### Recommended `settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## 10. Troubleshooting

### ❌ `node: command not found`

FNM is installed but not active in your shell. Add the following to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
eval "$(fnm env --use-on-cd)"
```

### ❌ Build fails with TypeScript errors

TypeScript errors are intentionally ignored during build (see `nextjs.config.js`):

```js
typescript: { ignoreBuildErrors: true }
```

For local type checking, run:

```bash
npx tsc --noEmit
```

### ❌ Middleware not working in static export

The `middleware.ts` file handles locale redirects during **development** and **on Vercel/edge**. In a pure GitHub Pages static export, the middleware does not run at request time. Locale detection relies on the pre-rendered paths and the user navigating to the correct URL. The cookie (`NEXT_LOCALE`) is set client-side via `LanguageSwitcher`.

### ❌ Images not loading in production

Ensure `images.unoptimized: true` is set in `nextjs.config.js`. The `<Image>` component from Next.js requires a server for optimization; static exports must use unoptimized images.

### ❌ `ENOENT: no such file or directory` during build

This typically means a course/game/tool JSON or Markdown file has a malformed path or syntax error. Check:
- Course directories follow the pattern `content/courses/{slug}/{lang}/`
- `course.json` exists for each course
- All Markdown files have valid YAML frontmatter

### ❌ Mermaid diagrams not rendering

Mermaid is dynamically imported on the client. Ensure:
1. The code block uses ` ```mermaid ` as the language identifier
2. The Mermaid syntax is valid — test at [mermaid.live](https://mermaid.live)
