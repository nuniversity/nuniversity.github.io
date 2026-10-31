> **HISTORICAL — superseded.** Kept for decision provenance only. Do not follow as current guidance. See `docs/INDEX.md`.

# 07 — Prioritized Findings Register

**Audit date:** 2026-10-26
**Legend:** `Confirmed` = demonstrated by execution or direct code reading. `Potential` = requires a condition that does not currently exist. `Improvement` = quality opportunity, not a defect.

---

## 1. Master register

| ID | Finding | Category | Severity | Status | Effort | Priority |
|----|---------|----------|----------|--------|--------|----------|
| SEC-01 | No Content-Security-Policy or security headers | Security | Medium | Confirmed (platform-constrained) | 3 h | P1 |
| SEC-02 | Student full name in plaintext `localStorage`, written per keystroke | Security · Privacy | Medium | Confirmed | 1 h | P1 |
| SEC-03 | Formspree is an unauthenticated, uncaptcha'd, unlimited-rate relay | Security · Abuse | Medium | Confirmed | 3 h | P1 |
| SEC-04 | Local prototype manipulation via `__proto__` setter | Security | Medium | Confirmed | 0.25 h | P1 |
| SEC-05 | Storage access without error handling + unchecked type assertion | Security · Robustness | Medium | Confirmed | 0.5 h | P1 |
| SEC-06 | Secret scanning across tree and git history | Security | Informational | **Clean** | — | — |
| SEC-07 | `NEXT_LOCALE` cookie missing `Secure` / `SameSite` | Security | Medium | Confirmed | 0.25 h | P1 |
| SEC-08 | Unvalidated identifiers in third-party embeds | Security | Medium | Confirmed | 1 h | P1 |
| SEC-09 | Embedded iframe has no `sandbox` attribute | Security | Medium | **Potential** | 1 h | P1 |
| SEC-10 | `innerHTML` sinks (KaTeX, Mermaid) | Security | Informational | **Safe** | — | — |
| SEC-11 | 25 dependency advisories | Security · Supply Chain | Medium | Confirmed | 4 h | P2 |
| SEC-12 | CI/CD pipeline hardening gaps | Security · Supply Chain | Low | Confirmed | 3 h | P5 |
| SEC-13 | Privacy posture (referrer leakage, no privacy notice) | Security · Privacy | Low | Confirmed | 1 h | P1 |
| PERF-01 | 1.2 MB of unused Prism grammars on every lesson page | Performance · Security | **High** | Confirmed | 3 h | **P1** |
| PERF-02 | 192.6 KB dictionary serialised into every page | Performance | **High** | Confirmed | 6 h | **P1** |
| PERF-03 | `framer-motion` 113.7 KB shared chunk for animations only | Performance | **High** | Confirmed | 5 h | **P1** |
| PERF-04 | 2.4 MB unoptimised PNG = 68% of `public/` | Performance | Medium | Confirmed | 0.5 h | P2 |
| PERF-05 | 1.1 MB search index fetched in full | Performance | Medium | Confirmed | 5 h | P2 |
| PERF-06 | `katex.min.css` imported from JS | Performance | Low | Confirmed | 1 h | P3 |
| PERF-07 | Highlighter re-renders without memoisation | Performance | Low | Confirmed | 1 h | P3 |
| PERF-08 | `out/` at 782 MB — symptom of PERF-02 | Performance | Low | Confirmed | — | P3 |
| PERF-09 | Heavy deps correctly code-split | Performance | Informational | **Positive** | — | — |
| ARCH-01 | 5 byte-identical storage-helper copies + 6 raw-access files | Architecture | **High** | Confirmed | 4 h | **P1** |
| ARCH-02 | 24 client components > 300 lines | Architecture | **High** | Confirmed | 17 h | P3 |
| ARCH-03 | `MarkdownRenderer` statically bundles all interactive blocks | Architecture · Performance | Medium | Confirmed | 2 h | P2 |
| ARCH-04 | No `not-found.tsx` / `error.tsx` boundary for 27 routes | Architecture · UX | **High** | Confirmed | 2 h | **P1** |
| ARCH-05 | Canonicals patched by post-processing HTML; no per-page hreflang | Architecture · SEO | Medium | Confirmed | 4 h | P4 |
| ARCH-06 | `middleware.ts` dead code; 3 divergent locale-redirect implementations | Architecture | Low | Confirmed | 1 h | P5 |
| ARCH-07 | Hardcoded `['en','pt','es']` bypassing `i18n.locales` | Architecture | Low | Confirmed | 1 h | P5 |
| ARCH-08 | Monolithic 192.6 KB dictionary | Architecture · Performance | Medium | Confirmed | 6 h | P1 |
| ARCH-09 | 10 `lib/` loaders untested, incl. the one driving 1,486 pages | Architecture · Quality | Medium | Confirmed | 6 h | P4 |
| ARCH-10 | 100% `generateMetadata` but thin OG/hreflang/JSON-LD | Architecture · SEO | Medium | Confirmed | 4 h | P4 |
| ARCH-11 | ~250 lines of duplicated UI patterns | Architecture | Low | Confirmed | 5 h | P3 |
| ARCH-12 | `next/dynamic` used well — extend the pattern | Architecture | Informational | **Positive** | — | — |
| A11Y-01 | No skip-to-content link | Accessibility | **High** | Confirmed | 1 h | **P1** |
| A11Y-02 | Command palette: no focus trap / dialog role | Accessibility | Medium | Confirmed | 3 h | P2 |
| A11Y-03 | Quiz and game feedback not announced to screen readers | Accessibility | Medium | Confirmed | 3 h | P2 |
| A11Y-04 | `prefers-reduced-motion` not honoured | Accessibility | Medium | Confirmed | 1 h | P2 |
| A11Y-05 | No `aria-current`; `focus:outline-none` without replacement | Accessibility | Low–Medium | Confirmed | 2 h | P2 |
| A11Y-06 | Hardcoded palette may fail contrast | Accessibility | Low | **Potential** | 2 h | P3 |
| UX-01 | Four competing colour systems | UX/UI · Architecture | Medium | Confirmed | 6 h | **P1** |
| UX-02 | English Library has 8 resources vs 58 — page looks broken | UX/UI · Content | Medium | Confirmed | 3 h | P3 |
| UX-03 | "NEW" badge on 7 of 8 nav items | UX/UI | Low | Confirmed | 1 h | P3 |
| UX-04 | No maximum line length on lesson prose (~110 chars/line) | UX/UI · Educational | Medium | Confirmed | 2 h | **P1** |
| UX-05 | Six competing CTAs on the home page | UX/UI | Low | Confirmed | 4 h | P3 |
| UX-06 | Roadmap orphaned from the course catalogue | UX/UI · Educational | Medium | Confirmed | 5 h | P4 |
| UX-07 | Code copy button has no visible focus ring | Accessibility · UX/UI | Medium | Confirmed | 0.5 h | P1 |
| UX-08 | No designed empty states or disabled filter chips | UX/UI | Low | Confirmed | 3 h | P3 |
| UX-09 | `scale-105` hover causes layout shift | UX/UI | Low | Confirmed | 1 h | P3 |
| UX-10 | No motion duration scale | UX/UI | Low | Confirmed | 1 h | P3 |
| UX-11 | Drag-based interactions may be keyboard-inaccessible | Accessibility · Educational | Medium | Confirmed | 4 h | P2 |
| UX-12 | Visualisations have no text alternative | Accessibility · Educational | Medium | Confirmed | 3 h | P2 |

**Totals:** 55 findings · **0 Critical** · 6 High · 26 Medium · 20 Low · 3 Informational

---

## 2. Findings by severity

### 2.1 High (6)

| ID | One-line | Evidence |
|----|----------|----------|
| PERF-01 | 1.2 MB unused syntax grammars | `FixWrapper.tsx:4` → chunk `1729-…js` = 1,175.4 KB |
| PERF-02 | 192.6 KB dictionary in every page | `get-dictionary.ts:1-3`; 612/637 leaves in `out/en/index.html` |
| PERF-03 | 113.7 KB framer-motion for animations only | 26 imports in 25 files → chunk `440-…js` |
| ARCH-01 | 5 duplicated storage-helper copies | md5 `7b3e7c80…` in 5 files; 6 raw-access files |
| ARCH-02 | 24 client components > 300 lines | `thirty-six-questions-client.tsx` 698, `MarkdownRenderer.tsx` 679 |
| ARCH-04 | No not-found/error boundary for 27 routes | `find` → 0 results; 18 `notFound()` calls |
| A11Y-01 | No skip-to-content link | `layout.tsx:124-135` — `<main>` has no `id` |

*(7 rows — A11Y-01 is included in the High tier by WCAG Level A.)*

### 2.2 Critical (0)

**No finding was rated Critical.** A Critical rating requires a **confirmed, remotely-exploitable** path to code execution, credential theft, or mass data compromise.

The closest candidates and why they do not qualify:

| Candidate | Why not Critical |
|-----------|-----------------|
| SEC-03 — Formspree open relay | Remotely abuseable, but the impact is spam in a mailbox, not code execution or data breach. **Medium** is correct. |
| SEC-01 — No CSP | A missing defence layer, not a vulnerability. |
| SEC-11 — 4 "critical" npm advisories | All are dev-only, build-only, or require a server runtime this site does not have. **Not exploitable.** |

---

## 3. Findings by category

### 3.1 Security (13)

| ID | Title | Severity | Exploitable remotely? |
|----|-------|----------|:---:|
| SEC-01 | No CSP / security headers | Medium | N/A |
| SEC-02 | Student name in plaintext localStorage | Medium | No |
| SEC-03 | Formspree open relay | Medium | **Yes** |
| SEC-04 | Local prototype manipulation | Medium | No |
| SEC-05 | Unguarded storage access | Medium | No |
| SEC-06 | Secret scanning | **Clean** | — |
| SEC-07 | Cookie missing Secure/SameSite | Medium | No |
| SEC-08 | Unvalidated embed identifiers | Medium | No |
| SEC-09 | Iframe without sandbox | Medium | No (Potential) |
| SEC-10 | innerHTML sinks | **Safe** | — |
| SEC-11 | Dependency advisories | Medium | No |
| SEC-12 | CI hardening gaps | Low | No |
| SEC-13 | Privacy posture | Low | No |

### 3.2 Architecture (12)

ARCH-01 (**High**), ARCH-02 (**High**), ARCH-03, ARCH-04 (**High**), ARCH-05, ARCH-06, ARCH-07, ARCH-08, ARCH-09, ARCH-10, ARCH-11, ARCH-12 (positive)

### 3.3 Performance (9)

PERF-01 (**High**), PERF-02 (**High**), PERF-03 (**High**), PERF-04, PERF-05, PERF-06, PERF-07, PERF-08, PERF-09 (positive)

### 3.4 Accessibility (6)

A11Y-01 (**High**), A11Y-02, A11Y-03, A11Y-04, A11Y-05, A11Y-06

### 3.5 UX/UI (12)

UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, UX-08, UX-09, UX-10, UX-11, UX-12

---

## 4. Findings by fix cost vs. impact

### 4.1 High impact, low cost — do first

| ID | Cost | Impact |
|----|-----:|--------|
| SEC-04 | 0.25 h | Closes the only prototype-handling issue |
| SEC-07 | 0.25 h | Correct cookie attributes |
| UX-07 | 0.5 h | Restores keyboard focus visibility on a primary action |
| PERF-04 | 0.5 h | Removes 2.4 MB from `public/` |
| SEC-02 | 1 h | Bounds and documents the only PII at rest |
| A11Y-01 | 1 h | Level A criterion |
| A11Y-04 | 1 h | Motion accessibility |
| SEC-13 | 1 h | Referrer policy + privacy notice |
| SEC-05 | 0.5 h | Eliminates an uncaught-exception path |
| UX-03 | 1 h | Removes visual noise from every page |
| ARCH-06 | 1 h | Removes 77 dead lines |
| ARCH-07 | 1 h | Removes a silent-failure footgun |
| SEC-08 | 1 h | Input validation on embeds |
| SEC-09 | 1 h | Iframe sandboxing |

### 4.2 High impact, high cost — plan and sequence

| ID | Cost | Impact |
|----|-----:|--------|
| PERF-02 / ARCH-08 | 6 h | −150 KB on every one of 1,633 pages |
| ARCH-02 | 17 h | Long-term maintainability of 24 large components |
| UX-01 | 6 h | Unlocks theming; removes 53 hex values |
| PERF-03 | 5 h | −114 KB on 14 routes |
| PERF-05 | 5 h | −200 KB on first palette open |
| UX-06 | 5 h | Connects the roadmap to the catalogue |

---

## 5. Dependencies between findings

```
PERF-01 ──► reduces lesson JS ──► makes ARCH-03 (lazy interactive blocks) measurable
ARCH-08 ──► smaller HTML ──► shrinks out/ (PERF-08) ──► faster crawl of 1,606 URLs
ARCH-01 ──► shared storage helper ──► used by SEC-02, SEC-04, SEC-05 fixes
ARCH-04 ──► not-found.tsx ──► reuses the existing NotFoundClient
ARCH-11 ──► shared UI primitives ──► vehicles for UX-01 token adoption
UX-01  ──► tokens ──► required by A11Y-06 contrast verification
A11Y-01 + A11Y-05 ──► shared focus system ──► fixes UX-07
PERF-03 ──► CSS motion ──► requires A11Y-04 reduced-motion block
```

**Critical path:** `ARCH-08` → `PERF-02` → `PERF-08` is the longest chain and should start early because it touches the dictionary files, which many other components import.

---

## 6. Items explicitly verified as clean

Recorded so they are not re-investigated and so the assessment is not read as more negative than it is.

| Item | Verification |
|------|--------------|
| Secrets in code or history | 12-pattern scan over tree + `git log --all --diff-filter=A` → **0** |
| `sessionStorage` | **0** occurrences |
| IndexedDB | **0** occurrences |
| `postMessage` listeners | **0** |
| `eval` / `new Function` / `document.write` in app code | **0** (1 in vendored 3Dmol, unreachable) |
| `dangerouslySetInnerHTML` on user input | **0** (1 site, static JSON-LD) |
| Analytics / tracking scripts | **0** |
| Third-party CDN `<script src>` | **0** |
| Runtime Google Fonts | **0** (self-hosted via `next/font/google`) |
| `javascript:` / `data:` URLs in the search index | **0** across 1,677 documents |
| Markdown XSS | Not reachable — `rehype-raw` → `rehype-sanitize`, protocol-restricted |
| Open redirect | None — all redirects use fixed literals or enum-constrained values |
| Global prototype pollution | Not reachable — `JSON.parse` never mutates `Object.prototype` |
| `useSearchParams` without Suspense | **0** |
| `cookies()` / `headers()` in app code | **0** |
| `generateStaticParams` coverage | **13 / 13** dynamic routes |
| Static export completeness | **1,632** prerendered routes, all `fallback: null` |
| Sitemap correctness | **1,606** URLs, 0 references to `/404/` |
| CI token scoping | Least privilege — `contents: read`, `pages: write`, `id-token: write` |
| Mermaid XSS | `securityLevel: 'strict'`, regression-tested |
| Dictionary key parity | Regression-tested across en/pt/es |
| Lesson numbering integrity | Regression-tested (gap-free 1..N) |
