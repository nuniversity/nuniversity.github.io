# 01 — Executive Summary

**Audit:** NUniversity Platform static educational site (`nuniversity.github.io`)
**Date:** 2026-10-26

---

## 1. Headline

NUniversity is a **mature, well-engineered static educational platform** with an unusually strong security posture for its class: no secrets, no tracking, no third-party scripts, correctly sanitized Markdown, and disciplined static-export mechanics.

The weaknesses are **not** in the attack surface. They are in **payload weight**, **design-system coherence**, and **defense-in-depth gaps that a static site can still close from the client side**.

| Dimension | Rating | Rationale |
|-----------|--------|-----------|
| **Cybersecurity** | **Good** | Zero confirmed exploitable vulnerabilities. All 25 npm advisories are build-time/dev-only or non-exploitable in a static context. Real findings are defense-in-depth (CSP absence, unvalidated embeds, plaintext PII at rest). |
| **Architecture** | **Fair–Good** | Clean App Router structure, correct export discipline, but **~180 lines of duplicated storage helpers**, 24 client components over 300 lines, and 3,000+ lines of unreachable/dead middleware. |
| **Performance** | **Poor** | **1.98 MB of JS on a lesson page** — 1.2 MB (59%) of it is 277 unused syntax-highlighting grammars. **192.6 KB of i18n dictionary** serialized into every page. A 2.5 MB unoptimised PNG is 68% of `public/`. |
| **Accessibility** | **Fair** | Semantic HTML is largely correct and there is good focus-visible handling, but **no skip link**, **no `aria-current`**, **no focus trap** in the command palette, **no live regions** for quiz feedback, and a `prefers-reduced-motion` gap. |
| **UX/UI** | **Fair** | Three competing colour systems (shadcn tokens, daisyUI, hardcoded hex), hardcoded `text-gray-700 dark:text-gray-300` in ~40 places that bypass the token layer, an **empty English Library (8 vs 58 resources)**, and a `NEW` badge on 7 of 8 nav items — which stops being a signal immediately. |

---

## 2. Findings at a glance

**31 findings** were recorded. Nothing was invented; each is traceable to a file and line.

| Severity | Count | IDs |
|----------|-------|-----|
| **Critical** | 0 | — |
| **High** | 6 | PERF-01, PERF-02, PERF-03, ARCH-01, ARCH-02, A11Y-01 |
| **Medium** | 16 | SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-07, SEC-08, PERF-04, PERF-05, ARCH-03, ARCH-04, ARCH-05, A11Y-02, A11Y-03, A11Y-04, UX-01 |
| **Low** | 9 | SEC-06, SEC-09, PERF-06, PERF-07, ARCH-06, ARCH-07, ARCH-08, A11Y-05, UX-02 |

> **Zero Critical findings.** For a static educational site, this is the correct outcome. A "Critical" rating requires a confirmed, remotely-exploitable path to code execution, credential theft, or mass data compromise. None exists.

---

## 3. The five things that matter most

### 3.1 PERF-01 — 1.2 MB of dead syntax-highlighting grammars (High)

`components/markdown/FixWrapper.tsx:4` imports `Prism` from `react-syntax-highlighter`. The `Prism` entry point registers **all 277 Prism grammars** via `refractor`. Measured chunk: `1729-bdf9797cf221ae8f.js` = **1,175.4 KB**.

The site actually uses **11** languages (`components/markdown/MarkdownRenderer.tsx:44-72`).

**Impact:** the lesson route ships **1.98 MB** of JS. On a 3G connection that is ~7 seconds of parse time before the lesson is interactive. The chunk is loaded eagerly on all 1,486 lesson pages.

**Remediation:** import the 7 language modules explicitly and register them via `Prism.registerLanguage`. Expected result: **1,175 KB → ~60 KB**.

---

### 3.2 PERF-02 — 192.6 KB of dictionary serialized into every page (High)

`lib/i18n/get-dictionary.ts:1-3` statically imports all three dictionaries (en 61 KB / pt 65 KB / es 66 KB). The full dictionary object is serialized as a prop into the RSC payload of **every** page. Measured: **612 of 637 (96%) of `en.json`'s string leaves appear verbatim in `out/en/index.html`** (262 KB).

**Impact:** every HTML document is inflated by ~60–190 KB of JSON that is mostly unused on that page. `out/en/courses/index.html` = 324 KB; `out/en/tools/index.html` = 180 KB. This hurts LCP on every route and is pure transfer waste.

**Remediation:** split dictionaries into per-namespace modules and import only the namespace each page needs. This is the single highest-leverage HTML-weight fix.

---

### 3.3 SEC-01 — No Content-Security-Policy (Medium, platform-constrained)

GitHub Pages cannot set HTTP response headers. The site therefore ships **no CSP at all**, no `Referrer-Policy`, no `Permissions-Policy`, no `X-Content-Type-Options`, and no HSTS.

**Impact:** any single successful same-origin injection would have unrestricted script execution. The site is otherwise defensively built, which means CSP is the missing layer that would contain the blast radius of any future XSS.

**Remediation (staged):**
1. **Now** — a `<meta http-equiv="Content-Security-Policy">` in the root layout. `meta`-based CSP supports `default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `frame-src`, `base-uri`, `form-action`, and `object-src`. It does **not** support `frame-ancestors`, `report-uri`, or `sandbox` — but it does support `sandbox`, which is the key one for defence in depth. A nonce is unusable with `meta`, so use a **hash-based** policy or `'strict-dynamic'` with a `'self'` fallback for Next's inline bootstrap script.
2. **Recommended** — migrate to Cloudflare Pages (free tier) or add a Cloudflare Worker in front of the Pages origin, which unlocks real header-based CSP with nonces plus HSTS.

---

### 3.4 ARCH-01 — ~180 duplicated lines of storage helpers (High)

The `safeGet` / `safeSet` / `safeRemove` trio is **byte-identical** (md5 `7b3e7c80a37145767a23e38e40600687`) in **five** files:

```
lib/progress/storage.ts:25    lib/quizzes/storage.ts:39    lib/lessons/feedback.ts:10
lib/gamification/profile.ts:14 lib/languages/storage.ts:46
```

Plus **three** near-identical `readJson` implementations and **six** components using raw `localStorage` with no error handling at all.

**Impact:** the codebase already demonstrates the cost — `lib/languages/storage.ts` is the one copy that *fails* to purge a corrupt key, and `components/providers/Providers.tsx` is the one access path with no `try/catch` at all. Duplication has already produced drift.

**Remediation:** one `lib/storage/safe-storage.ts` exporting a namespaced, schema-validated API; migrate all 11 call-site files.

---

### 3.5 UX-01 — Three competing colour systems (Medium)

`app/globals.css` is 555 lines containing:
- A genuine shadcn-style **HSL token layer** (lines 5–50, 20 tokens) — correct and well-formed.
- A **151-line hardcoded-hex callout system** (lines 100–250) with **53 literal hex colours** and **zero** token references. A theme change cannot reach it.
- A **component utility layer** (lines 66–98) that hardcodes Tailwind's raw palette (`from-blue-600`, `bg-white text-gray-800`) and therefore **shadows** the token names.
- Plus the **daisyUI plugin** (`tailwind.config.js:85-104`) injecting a *fourth* palette where `primary` is `#3b82f6` while the token `--primary` resolves to `221.2 83.2% 53.3%` (`#2563eb`). **Two different "primary" blues are live in the same application.**

Evidence of the split is visible in a single file: `components/markdown/MarkdownRenderer.tsx:656` uses daisyUI (`table table-zebra`) while `:659` uses daisyUI (`bg-base-200`) and `:406` uses shadcn tokens (`text-foreground`).

**Remediation:** consolidate to a single token source of truth; convert every hardcoded hex to a token; remove the daisyUI palette conflict; enforce with a lint rule.

---

## 4. The dependency picture

`npm audit` reports **25 advisories**. After triage against the actual threat model of a static site:

| Advisory | Reported | Real-world impact here | Action |
|----------|---------|----------------------|--------|
| `next` (×3) | **critical** | None exploitable. `output: 'export'` means there is no server, no image optimizer, no ISR, no middleware execution. The advisory requires `next start` + `remotePatterns`. | **Upgrade anyway** — `^14.2.33` is the last 14.x line; plan a Next 15/16 migration. Low effort, removes the noise. |
| `vitest` / `tinypool` / `vite` | **critical** | None. Dev-only. `tinypool` RCE requires an attacker-controlled `workerOptions`; `vitest` UI RCE requires running `vitest --ui` bound to a public interface. CI runs `vitest run` (no UI). | Upgrade `vitest` to ≥5 when convenient. |
| `dompurify` | **critical** | None reachable. `dompurify` is a transitive dep of `react-syntax-highlighter`; the advisory concerns the `IN_PLACE: false` + `afterSanitize` hook pattern, which this codebase never uses. | Transitive — resolved by the `react-syntax-highlighter` upgrade. |
| `katex` (×2) | low | Prototype pollution that **bypasses `trust` restrictions**. `rehype-katex` is used here; KaTeX is also rendered manually in `MarkdownRenderer.tsx:112`. KaTeX's `trust` option defaults to `false`, so `\href`/`\url` command injection is **not** enabled. | Upgrade `katex` to ≥0.19 (low effort, removes a real class of bug). |
| `postcss` (XSS) | high | Build-time only. The advisory requires a build step that stringifies attacker-controlled CSS — no untrusted CSS input exists. | Transitive — resolved by the Tailwind/Next upgrade. |
| `minimatch` / `brace-expansion` / `source-map-js` (ReDoS) | high | Build/test-time only. No user-controlled glob or source-map offset. | Transitive. |
| `prismjs` (DOM clobbering) | moderate | **The one with genuine relevance.** `prismjs` reaches the browser via `react-syntax-highlighter`'s Prism build. DOM clobbering can shadow globals by element `id`/`name`. | Fixed by the **PERF-01** rewrite (drop `react-syntax-highlighter` for the per-language modules, or replace with `shiki`/`highlight.js` core). |
| `react-syntax-highlighter` | moderate | The 1.2 MB bundle (**PERF-01**) + the `prismjs` transitive advisory. | **Replace** as part of PERF-01. |
| `tailwindcss` / `@tailwindcss/typography` / `postcss-nested` / `postcss-selector-parser` | moderate | Build-time only. | Transitive. |

**Net conclusion:** there is **no exploitable dependency vulnerability** in the deployed artifact. Every "critical" is either dev-only, build-only, or requires a server runtime this site does not have. The advisories are still worth clearing because they are noise that hides real issues — and `katex` + `prismjs` are the two with genuine browser-side relevance.

---

## 5. Security posture: what is confirmed vs. what is potential

The audit explicitly separates these, as required.

### Confirmed (demonstrated by execution or by direct code reading)

| ID | Confirmed statement | Proof |
|----|--------------------|-------|
| SEC-02 | The student's **full name** is written to `localStorage` in plaintext on **every keystroke**, never cleared, with no length cap. | `lib/quizzes/storage.ts:22,150-152` + `components/quizzes/CertificateCard.tsx:32-35` — `setCertName(value)` inside `handleChange`. |
| SEC-03 | The Formspree endpoint is an **unauthenticated, uncaptcha'd, unlimited-rate** relay into a live mailbox. | `components/contacts/Contact.tsx:17` — `useForm("xandddko")`. Anyone can POST arbitrary JSON to `https://formspree.io/f/xandddko`. |
| SEC-04 | `lib/languages/storage.ts` assigns `progress['__proto__'] = {...}` on a plain object literal, invoking the `__proto__` setter. | Reproduced in Node: the entry vanishes from `Object.keys()` but `progress.streak` resolves to an attacker-chosen number. **Local-only**, not global `Object.prototype` pollution. |
| SEC-05 | `components/providers/Providers.tsx:37,48` is the **only** storage access in the codebase with no `try/catch`, and it casts an arbitrary string with `as 'light' \| 'dark'`. | Direct read. |
| SEC-07 | The `NEXT_LOCALE` cookie is set without `Secure` and without `SameSite`. | `components/language/LanguageSwitcher.tsx:40` — `document.cookie = \`NEXT_LOCALE=${newLocale}; path=/; max-age=31536000\``. |
| SEC-08 | `PhETEmbed` and `MoleculeViewer` interpolate content-supplied identifiers into URLs with **no allowlist** and **no encoding**. | `components/markdown/PhETEmbed.tsx:18`, `components/markdown/MoleculeViewer.tsx:41,62`. |
| SEC-06 | **Zero** secrets, keys, tokens, or credentials in the working tree or git history. | 12-pattern scan over `git log --all --diff-filter=A` and the full tree. |

### Potential (requires a condition that does not currently exist)

| ID | Potential risk | Why it is only "potential" |
|----|----------------|---------------------------|
| SEC-01 | CSP absence amplifies any future injection | No injection currently exists. |
| SEC-09 | `PhETEmbed` iframe has no `sandbox` attribute | The PhET origin receives a script channel. Mitigated by `referrerPolicy="no-referrer"`. Also: **zero** ` ```phet ` fences exist in `content/`, so the component is currently unreachable from published content. |
| SEC-08 | Unvalidated embed identifiers | The base URL is a fixed literal, so a hostile slug **cannot escape the origin** — `slug = "https://evil.com"` yields `https://phet.colorado.edu/sims/html/https://evil.com/...`. No open redirect, no cross-origin escape. |

---

## 6. Content and SEO: the biggest missed opportunity

The site has **1,298 lessons**, **49 courses**, **2 quizzes**, and **117 library resources** — and ships exactly **one** JSON-LD block: a single `EducationalOrganization` with `"sameAs": []` (empty).

Missing structured data that would materially improve search presentation:

- `Course` + `LearningResource` / `LearningSyllabus` for the 49 courses and 1,298 lessons.
- `BreadcrumbList` on every lesson (there is already a breadcrumb UI element at `app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx:150` — it is simply not marked up).
- `Quiz` / `Question` for the certification quizzes.
- `ItemList` for library and tool listings.
- Per-page `hreflang` (`alternates.languages`) — currently only the layout defines it, and it always points at the **locale homepages**, never the equivalent page in the other locale. For 1,486 lesson pages across 3 locales, this is a significant international-SEO gap.

Related: `alternates.canonical` on the layout points at `/${lang}` (the homepage), and Next.js does **not** inherit `alternates.canonical` to children — so most pages ship **no canonical at all**. `scripts/postbuild.mjs:28-48` exists solely to patch this by mutating the emitted HTML after the fact. That is a fragile mechanism: it is a regex over 1,633 files, and it skips `index.html`, `404.html`, and `404/index.html`.

---

## 7. The UX/UI reality

### 7.1 The English Library is effectively empty

| Locale | Resources |
|--------|-----------|
| `en` | **8** |
| `pt` | 50 |
| `es` | 58 |

A 6–7× disparity means the **default locale's** library page renders as a nearly-empty grid while `es` looks full. Since `/en/` is the `x-default` and the fallback for every missing translation, this is the first thing a new visitor sees if they explore the Library. This is a **content gap**, but the UI should degrade gracefully rather than looking broken.

### 7.2 The "NEW" badge is on 7 of 8 navigation items

`components/layout/Header.tsx:41-46` marks Tools, Games, Quizzes, Library, Roadmaps, and Languages as `isNew: true` — only Home and Courses are not. A badge on nearly everything carries **zero** information. It also uses `animate-pulse` (see §8.2 on motion).

### 7.3 Accessibility gaps that matter for a learning platform

| Gap | Where | WCAG |
|-----|-------|------|
| No skip-to-content link | `app/[lang]/layout.tsx` — `<main>` at line 128 is the first landmark | 2.4.1 Bypass Blocks (A) |
| No `aria-current="page"` on the active nav item | `components/layout/Header.tsx:70-84` | 1.3.1 Info & Relationships (A) |
| Command palette has **no focus trap** and no `role="dialog"` | `components/search/CommandPalette.tsx` | 2.1.2 No Keyboard Trap / 4.1.2 Name, Role, Value (A) |
| Quiz results are announced visually but not via a live region | `components/quizzes/ScoreReport.tsx`, `ExamRunner.tsx` | 4.1.3 Status Messages (AA) |
| `prefers-reduced-motion` is not honoured | `app/globals.css` — `scroll-behavior: smooth` at line 62 and `animate-pulse` at `Header.tsx:79` | 2.3.3 Animation from Interactions (AAA) / 2.2.2 Pause, Stop, Hide (A) |
| Focus indicators inconsistent | `components/markdown/MarkdownRenderer.tsx:90` — `focus:outline-none` with no replacement | 2.4.7 Focus Visible (AA) |

---

## 8. Recommended sequencing

```
PHASE 1 — Security hardening              (SEC-01,02,03,04,05,07,08,09)   ~2 days
PHASE 2 — Performance                      (PERF-01,02,03,04,05)          ~3 days
PHASE 3 — Architecture                     (ARCH-01,02,03,04,05,06,07,08) ~3 days
PHASE 4 — Accessibility                    (A11Y-01..05)                   ~2 days
PHASE 5 — Design system + UX/UI redesign  (UX-01, UX-02, DS-*)            ~5 days
PHASE 6 — SEO, content, CI, polish        (SEO-*, CI-*)                   ~2 days
```

The full, file-level plan is in **[08 — Deep Implementation Plan](./08-implementation-plan.md)**.

### Expected measurable outcomes

| Metric | Before | After (target) |
|--------|--------|----------------|
| Lesson route JS | 1,980.6 KB | **< 400 KB** |
| `out/en/index.html` | 262 KB | **< 120 KB** |
| `public/` total | 3.7 MB | **< 1.2 MB** |
| Colour systems | 4 | **1** |
| Hardcoded hex colours in `globals.css` | 53 | **0** |
| Storage helper copies | 5 + 6 raw | **1** |
| npm advisories | 25 | **< 5** (all build/dev-only) |
| Routes with a not-found boundary | 0 / 27 | **27 / 27** |
| Skip link / aria-current / focus trap | absent | **present** |
