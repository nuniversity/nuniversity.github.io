# 🚀 Deployment

NUniversity is deployed as a **fully static website** on **GitHub Pages**, using a **GitHub Actions** CI/CD pipeline that automatically builds and publishes the site on every push to the `main` branch.

---

## Table of Contents

1. [Deployment Overview](#1-deployment-overview)
2. [GitHub Pages Configuration](#2-github-pages-configuration)
3. [Next.js Static Export Configuration](#3-nextjs-static-export-configuration)
4. [GitHub Actions CI/CD Pipeline](#4-github-actions-cicd-pipeline)
5. [Build Output](#5-build-output)
6. [Live URL & Base Path](#6-live-url--base-path)
7. [Deployment Process Step-by-Step](#7-deployment-process-step-by-step)
8. [Static Export Constraints](#8-static-export-constraints)
9. [Performance & Caching](#9-performance--caching)
10. [Manual Deployment](#10-manual-deployment)

---

## 1. Deployment Overview

```
Developer pushes to main branch
           │
           ▼
GitHub Actions triggers workflow
           │
           ▼
┌──────────────────────────────────┐
│  Build Step                      │
│  1. Checkout repository          │
│  2. Setup Node.js (from .node-version) │
│  3. npm ci                       │
│  4. npm run build                │
│     └─ Next.js generates /out/   │
└──────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Deploy Step                     │
│  Upload /out/ to GitHub Pages    │
│  (actions/upload-pages-artifact) │
│  (actions/deploy-pages)          │
└──────────────────────────────────┘
           │
           ▼
https://nuniversity.github.io/
```

**Zero infrastructure cost** — GitHub Pages hosts static files for free with a global CDN.

---

## 2. GitHub Pages Configuration

### Repository Settings

To enable GitHub Pages from GitHub Actions:

1. Go to **Settings → Pages**
2. Set **Source** to `GitHub Actions`
3. No branch selection needed (the workflow handles deployment)

### Custom Domain (optional)

To use a custom domain (e.g., `nuniversity.com`):

1. Go to **Settings → Pages → Custom domain**
2. Enter your domain
3. Create a `CNAME` file in the `public/` directory:
   ```
   nuniversity.com
   ```
4. Configure your DNS provider with the appropriate `CNAME` or `A` records pointing to GitHub Pages

---

## 3. Next.js Static Export Configuration

```js
// nextjs.config.js

const nextConfig = {
  output: 'export',                   // ← Static HTML export
  trailingSlash: true,                // /en/ not /en (required for static hosts)
  skipTrailingSlashRedirect: true,
  distDir: 'out',                     // Output directory

  // GitHub Pages serves from a subdirectory /nuniversity.github.io/
  assetPrefix: process.env.NODE_ENV === 'production' ? '/nuniversity.github.io' : '',
  basePath:    process.env.NODE_ENV === 'production' ? '/nuniversity.github.io' : '',

  images: {
    unoptimized: true,                // No server-side image optimization
  },
  typescript: {
    ignoreBuildErrors: true,          // Skip TS errors during CI build
  },
  eslint: {
    ignoreDuringBuilds: true,         // Skip ESLint during CI build
  },
}
```

### Why `trailingSlash: true`?

GitHub Pages (and most static file servers) serve files based on directory paths. With `trailingSlash: true`, Next.js generates:
- `/en/courses/` → `out/en/courses/index.html`

Without it, navigating directly to `/en/courses` on GitHub Pages would return a 404.

### Why `assetPrefix` and `basePath`?

The repository is named `nuniversity.github.io`, so GitHub Pages serves it at:
```
https://nuniversity.github.io/
```

However, if the repo were named differently (e.g., `platform`), the site would be at:
```
https://nuniversity.github.io/platform/
```

In that case, `basePath` and `assetPrefix` would need to match `/platform`.

---

## 4. GitHub Actions CI/CD Pipeline

The workflow file lives at `.github/workflows/nextjs.yml`.

### Workflow Triggers

```yaml
on:
  push:
    branches: ["main"]      # Deploy on every push to main
  workflow_dispatch:         # Allow manual trigger from GitHub UI
```

### Workflow Jobs

#### Job 1: `build`

```yaml
- uses: actions/checkout@v4

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: '.node-version'   # Uses the version in .node-version
    cache: 'npm'

- name: Install dependencies
  run: npm ci                            # Clean install from package-lock.json

- name: Build with Next.js
  run: npm run build                     # Generates /out/ directory

- name: Upload static files
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./out                          # Upload the /out/ folder
```

#### Job 2: `deploy`

```yaml
- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4          # Deploy the uploaded artifact
```

### Required GitHub Permissions

The workflow requires these repository permissions (set automatically by GitHub Actions):

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

### Concurrency Control

Only one deployment runs at a time. If a new push comes in while a deployment is in progress, the in-progress deployment is cancelled:

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

---

## 5. Build Output

After `npm run build`, the `/out/` directory contains:

```
out/
├── en/
│   ├── index.html                    ← /en/ home page
│   ├── courses/
│   │   ├── index.html                ← /en/courses/ listing
│   │   └── intro-to-programming/
│   │       └── 01-introduction/
│   │           └── index.html        ← /en/courses/.../01-introduction/
│   ├── tools/
│   │   ├── index.html
│   │   └── eisenhower-matrix/
│   │       └── index.html
│   ├── games/
│   │   ├── index.html
│   │   └── vocabulary/
│   │       └── en-to-pt/
│   │           └── index.html
│   ├── library/
│   │   └── index.html
│   ├── about/
│   │   └── index.html
│   └── contact/
│       └── index.html
├── pt/                               ← Same structure for Portuguese
├── es/                               ← Same structure for Spanish
├── _next/                            ← JS/CSS chunks, fonts
│   ├── static/
│   │   ├── chunks/
│   │   └── css/
│   └── ...
├── favicon.ico
├── favicon.svg
└── robots.txt
```

The total number of HTML files = `locales × (pages + courses × lessons + tools + games)`

---

## 6. Live URL & Base Path

| Environment | Base URL | Base Path |
|---|---|---|
| **Production** | `https://nuniversity.github.io/` | `/nuniversity.github.io` |
| **Development** | `http://localhost:3000/` | *(empty)* |

### Internal Links

All internal `<Link>` components use locale-prefixed paths:

```tsx
<Link href={`/${lang}/courses`}>...</Link>
// Renders as: /en/courses (dev) or /nuniversity.github.io/en/courses (prod)
```

The `basePath` in `nextjs.config.js` automatically prepends the base path to all internal Next.js links.

---

## 7. Deployment Process Step-by-Step

### Automatic Deployment (recommended)

```bash
# 1. Make your changes
git add .
git commit -m "feat: add new course on data engineering"

# 2. Push to main
git push origin main

# 3. GitHub Actions automatically:
#    - Installs dependencies
#    - Builds the static site
#    - Deploys to GitHub Pages
#    → Live in ~2-3 minutes
```

Monitor the deployment at:
```
https://github.com/nuniversity/nuniversity.github.io/actions
```

### Verify Deployment

After deployment, visit:
```
https://nuniversity.github.io/en/
```

---

## 8. Static Export Constraints

Because NUniversity is a static export, the following **Next.js features are NOT available**:

| Feature | Status | Reason |
|---|---|---|
| **API Routes** (`/api/*`) | ❌ Not supported | Requires Node.js server |
| **Server-Side Rendering (SSR)** | ❌ Not supported | Requires Node.js server |
| **Incremental Static Regeneration (ISR)** | ❌ Not supported | Requires Node.js server |
| **Server Actions** | ❌ Not supported | Requires Node.js server |
| **Middleware** (at runtime) | ⚠️ Dev only | Works in dev; no runtime in static export |
| **Image Optimization** | ⚠️ Disabled | `unoptimized: true` required |
| **Dynamic routes without `generateStaticParams`** | ❌ Not supported | All dynamic routes must be pre-generated |

### Workarounds in Place

| Problem | Solution |
|---|---|
| No API routes | All data is file-system based, read at build time |
| No server-side auth | Platform is fully public (no authentication) |
| No runtime i18n redirect | Locale cookie + client-side navigation in `LanguageSwitcher` |
| No image optimization | `unoptimized: true` + external image CDNs for thumbnails |

---

## 9. Performance & Caching

### GitHub Pages Caching Behavior

GitHub Pages serves static files with default HTTP caching:
- **HTML files**: `Cache-Control: max-age=600` (10 minutes)
- **Static assets** (`/_next/static/`): Long-term caching with content hashes in filenames

### Next.js Optimization Applied at Build Time

| Optimization | Behavior |
|---|---|
| **Code splitting** | Each page gets its own JS bundle |
| **Tree shaking** | Unused code removed from bundles |
| **CSS purging** | Tailwind removes unused CSS classes |
| **Static asset hashing** | `/_next/static/chunks/[hash].js` — cache-busted on change |
| **Font preloading** | Inter font preloaded via Google Fonts CDN |

### Lighthouse Performance Tips

- All routes are pre-rendered HTML — no client-side data fetching
- Mermaid.js is **dynamically imported** only when needed
- `react-syntax-highlighter` is loaded only on pages with code blocks
- Images should be served from CDN URLs (for library thumbnails)

---

## 10. Manual Deployment

If you need to deploy manually (without GitHub Actions):

### Build locally

```bash
# Set production environment
NODE_ENV=production npm run build
```

### Deploy using gh-pages CLI

```bash
# Install gh-pages tool
npm install -g gh-pages

# Deploy /out/ to the gh-pages branch
gh-pages -d out
```

### Or using Git directly

```bash
cd out

git init
git add .
git commit -m "Deploy"

git remote add origin https://github.com/nuniversity/nuniversity.github.io.git
git push --force origin main:gh-pages
```

> **Note:** Manual deployment is not recommended. Use the GitHub Actions workflow for consistent, reproducible deployments.

---

## Deployment Checklist

Before pushing to `main`, verify:

- [ ] `npm run build` succeeds locally with no errors
- [ ] New courses/tools appear at the expected URLs
- [ ] All locale versions (`/en/`, `/pt/`, `/es/`) render correctly
- [ ] No broken links in navigation
- [ ] `course.json` exists for any new courses
- [ ] Markdown frontmatter is valid YAML (no missing required fields)
- [ ] Images are accessible via correct paths
