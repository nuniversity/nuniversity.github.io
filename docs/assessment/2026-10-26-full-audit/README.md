# Full Security, Architecture & UX/UI Audit — Nuniversity Platform

**Audit date:** 2026-10-26
**Audit type:** Full-stack static-site assessment (cybersecurity, architecture, performance, accessibility, UX/UI)
**Target:** `nuniversity.github.io` — Next.js 14 (App Router), `output: 'export'`, deployed to GitHub Pages
**Auditor role:** Senior Frontend Architect · Application Security Engineer · UX/UI Designer
**Method:** Static analysis of the live repository, dependency audit (`npm audit`), bundle analysis of a production build, and runtime inspection of the exported `out/` artifact.

---

## Document index

| # | Document | Contents |
|---|----------|----------|
| 00 | This page | Scope, method, limitations, document map |
| 01 | [Executive Summary](./01-executive-summary.md) | Findings at a glance, risk posture, headline numbers |
| 02 | [Security Findings](./02-security-findings.md) | Full threat model, confirmed vs. potential findings, dependency audit |
| 03 | [Architecture & Code Quality](./03-architecture-findings.md) | Boundaries, duplication, static-export correctness, i18n |
| 04 | [Performance & Accessibility](./04-performance-accessibility.md) | Bundle analysis, page weight, WCAG 2.2 AA gap analysis |
| 05 | [UX/UI & Educational Experience](./05-ux-ui-assessment.md) | IA, navigation, content presentation, interaction design |
| 06 | [Design System Specification](./06-design-system.md) | Token architecture, component specs, motion, theming |
| 07 | [Prioritized Findings Register](./07-findings-register.md) | Every finding, ID, severity, evidence, effort, priority |
| 08 | [Deep Implementation Plan](./08-implementation-plan.md) | Phased plan, file-level change sets, verification gates, **current implementation status** |

---

## 0. Current implementation status

Development was paused after the **Phase 1 (security) foundations** landed. See [08 § 0](./08-implementation-plan.md#0-implementation-status-as-of-2026-10-26).

**Landed:** a shared defensive storage module (`lib/storage/safe-storage.ts`), the migration of all 11 storage call sites (removing 5 byte-identical helper copies and 6 unguarded raw-`localStorage` files), certificate-name hardening (debounce, length cap, trim, clear control), theme-value validation, and cookie `SameSite`/`Secure` attributes.

**Verified:** `tsc` clean · **1,253 tests passing** (no regression) · lint clean · static export unchanged (**1,632** prerendered routes, **1,633** HTML files, **1,606** sitemap URLs).

---

## 1. Scope

### 1.1 In scope

The application is a **fully static educational website**. The audit therefore covers only the surfaces that actually exist:

- Static HTML/CSS/JS bundles produced by `next build` and served from `out/`.
- Client-side TypeScript/React source in `app/`, `components/`, `lib/`, `scripts/`.
- Build-time content pipeline (`content/`, `scripts/generate-search-index.mjs`).
- npm dependency graph and lockfile.
- GitHub Actions workflow and GitHub Pages deployment configuration.
- Browser-side storage (`localStorage`, cookies).
- Static metadata, sitemap, robots, JSON-LD.
- Third-party embeds and outbound integrations.

### 1.2 Explicitly out of scope

The application uses **no** backend. The following were deliberately **not** assessed because they do not exist in this repository, and inventing findings for them would be misleading:

- Server-side authentication / authorization / session management.
- Databases, ORMs, data stores.
- Server-side input validation, rate limiting, or WAF configuration.
- Server-side rendering, API routes (`route.ts`), or middleware execution in production.
- Container, VM, or cloud infrastructure hardening.
- TLS termination and CDN edge configuration (managed by GitHub).

> **Important platform constraint:** GitHub Pages does **not** allow custom response headers. There is no `headers` file, no Cloudflare worker, and no reverse proxy in front of the origin. Therefore:
> - A server-enforced **Content-Security-Policy** is **not possible** on `nuniversity.github.io` without migrating hosting.
> - `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` **cannot** be set as HTTP headers either.
> - The only viable mitigations are **client-side** (`<meta http-equiv="Content-Security-Policy">`) and **defense-in-depth in code**.
>
> This constraint is itself recorded as a finding (**SEC-01**) with a documented migration path, rather than being silently ignored.

---

## 2. Method

| Phase | Technique | Coverage |
|-------|-----------|----------|
| 1. Repository reconnaissance | Directory tree, git history (`git log --all`), dependency manifests | 100% of tracked files |
| 2. Security review | Manual taint tracing from every input source to every sink | All 9 input sources, all 8 sinks |
| 3. Secret scanning | Pattern scan for 12 credential classes across working tree **and** git history | 0 hits (see [SEC-06](./02-security-findings.md#sec-06)) |
| 4. Dependency audit | `npm audit` against the live advisory DB | 25 advisories, 4 critical / 7 high |
| 5. Build & bundle analysis | `next build`, chunk size attribution via `.next/app-build-manifest.json` | 1,633 emitted pages, 27 routes |
| 6. Export verification | Grep of `out/**/*.html` for external origins, inline scripts, headers | 1,633 HTML files |
| 7. Architecture review | Component boundary graph, duplication mining, static-export contract check | 75 client components, 30 lib modules |
| 8. Accessibility audit | WCAG 2.2 AA criterion-by-criterion review of markup + interaction code | All interactive components |
| 9. UX/UI review | IA walkthrough, responsive breakpoint analysis, design-token audit | All 27 routes |
| 10. Test & CI review | Test inventory, coverage config analysis, CI workflow inspection | 36 vitest files, 6 pytest files, 1 workflow |

### 2.1 Tooling used

```
npm audit --json                    # advisory database, 25 advisories
next build                          # production static export
node --input-type=module -e '...'   # rehype-sanitize schema introspection
md5sum / awk                        # byte-identical duplication detection
grep -rn / git log --all --diff-filter=A   # secret + history scanning
.next/app-build-manifest.json       # per-route chunk attribution
```

### 2.2 Limitations

- **No dynamic testing** was performed against a live deployment; findings are derived from source and build artifacts. Where a finding requires a live request to confirm, it is explicitly labelled **potential** rather than **confirmed**.
- The `npm audit` result set reflects the advisory database **as of 2026-10-26**; it will drift.
- Link liveness testing (`tests/library/link-check.live.test.ts`) was **skipped** in this run (116 tests skipped by design — the file requires `RUN_LIVE=1`).
- Pixel-level visual regression testing was not performed; UX findings are based on code and computed styles.

---

## 3. Repository snapshot

| Metric | Value |
|--------|-------|
| Framework | Next.js `^14.2.33` (App Router), React `^18.2.0`, TypeScript `^5.3.3` |
| Rendering mode | `output: 'export'` → 1,633 static HTML files |
| Locales | `en` (default), `pt`, `es` |
| Content files | 1,513 (en 445 / pt 506 / es 464) |
| Courses | 49 course directories |
| Lessons | 1,298 Markdown files → **1,486 generated lesson pages** |
| Tools | 10 (× 3 locales) |
| Games | 7 (across 6 categories) |
| Quizzes | 2 |
| Roadmaps | 1 (× 3 locales) |
| Library resources | 117 (en 8 / pt 50 / es 58) |
| Language activities | 5 across 4 pairs |
| Source LOC | `app/` 6,732 · `components/` 14,446 · `lib/` 2,618 · `tests/` 4,617 |
| Client components | 75 (`'use client'`) |
| Tests | 36 vitest files (1,253 passing) + 6 pytest files |
| CI | 1 GitHub Actions workflow (`.github/workflows/nextjs.yml`) |
| npm advisories | **25** (4 critical, 7 high, 9 moderate, 5 low) |
| Secrets found | **0** |

---

## 4. What is genuinely good

This audit is evidence-based, and the evidence shows substantial existing strengths. These should be preserved:

1. **No secrets in code or git history.** A 12-pattern scan across the working tree and full history found zero credential material. No `.env`, `.npmrc`, `.pem`, or key files exist or ever existed.
2. **No analytics, no tracking, no third-party scripts.** No gtag, Plausible, Hotjar, Segment, or Mixpanel. No CDN `<script src>`. Every script tag in the 1,633 output HTML files is same-origin.
3. **Markdown is sanitized correctly.** `rehype-raw` → `rehype-sanitize` → `rehype-katex` is the correct plugin ordering; `rehype-sanitize`'s `defaultSchema` restricts protocols to `http/https/mailto/irc/ircs/xmpp` and clobbers `id`/`name` attributes with a `user-content-` prefix.
4. **No `dangerouslySetInnerHTML` on user input.** The single instance serializes a static dictionary object into JSON-LD.
5. **No `eval`, `new Function`, or `document.write`** in application code. The one `eval` in the tree is inside the vendored 3Dmol library's py3Dmol string-callback path, which this codebase never reaches.
6. **Fonts are self-hosted** at build time via `next/font/google` — no runtime Google Fonts request, no FOIT.
7. **Correct static-export discipline.** Every one of the 13 dynamic routes exports `generateStaticParams`; all 27 routes export `force-static`/`revalidate: false`; zero use of `cookies()`, `headers()`, `useSearchParams`, or `redirect()`.
8. **Mermaid runs with `securityLevel: 'strict'`**, enforced by a regression test (`tests/lessons/mermaid-security.test.tsx`).
9. **Storage helpers are defensive.** Four of five storage modules guard `JSON.parse` with `try/catch` *and* purge the corrupt key *and* validate the resulting shape.
10. **Search index URLs are constrained.** The generator hardcodes relative paths for all non-library content and requires `^https?://` for library entries, so a `javascript:` URL cannot enter the index.
11. **Strong test discipline where it exists.** 1,253 passing tests, including a dictionary-parity test that guarantees `en`/`pt`/`es` key parity, a grading-engine test, and a content-integrity test that enforces gap-free lesson numbering.
12. **CI has least-privilege token scoping**: `contents: read`, `pages: write`, `id-token: write` — no `write-all`.

---

## 5. Reading order

- If you are the **project owner**: read [01 Executive Summary](./01-executive-summary.md), then [07 Findings Register](./07-findings-register.md), then [08 Implementation Plan](./08-implementation-plan.md).
- If you are a **security engineer**: read [02 Security Findings](./02-security-findings.md).
- If you are a **frontend engineer**: read [03 Architecture](./03-architecture-findings.md) and [04 Performance & Accessibility](./04-performance-accessibility.md).
- If you are a **designer**: read [05 UX/UI](./05-ux-ui-assessment.md) and [06 Design System](./06-design-system.md).
