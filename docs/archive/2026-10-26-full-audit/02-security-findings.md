> **HISTORICAL — superseded.** Kept for decision provenance only. Do not follow as current guidance. See `docs/INDEX.md`.

# 02 — Security Findings

**Audit date:** 2026-10-26
**Threat model:** A fully static educational website. No backend, no database, no server-side authentication, no API routes. The attacker surface is: content authors, dependency supply chain, browser-side storage, embedded third-party origins, and the GitHub Actions pipeline.

---

## 1. Threat model

### 1.1 Assets worth protecting

| Asset | Where it lives | Sensitivity |
|-------|---------------|-------------|
| Student identity (full name) | `localStorage` — `v1:quizzes-cert-name` | **Personal data** |
| Learning progress, quiz scores, streaks | `localStorage` (18 keys) | Low — user-local, non-sensitive |
| Lesson/quiz content integrity | `content/**` (1,513 files), `public/search-index/*.json` | Medium — academic integrity |
| Deployment integrity | `.github/workflows/nextjs.yml`, `GITHUB_TOKEN` | **High** — can publish to Pages |
| Repository access | GitHub org permissions | **High** |
| Form submissions | Formspree → `project contact mailbox` | **Personal data** |

### 1.2 Entry points (sources)

| # | Source | Trust | Notes |
|---|--------|-------|-------|
| S1 | Markdown lesson files in `content/courses/**` | **Semi-trusted** — authored in-repo, but community-contributed per `docs/operations/CONTRIBUTING.md` | Rendered through `react-markdown` + `rehype-raw` → `rehype-sanitize` |
| S2 | JSON game/quiz/activity configs in `content/**` | Semi-trusted | Parsed with `JSON.parse` and passed to interactive components |
| S3 | Library frontmatter `url:` fields | Semi-trusted | Rendered as outbound links |
| S4 | `localStorage` / `document.cookie` | **Untrusted** | Writable by any same-origin script; user-modifiable |
| S5 | `?p=` query parameter on the 404 page | Untrusted | Reflected in `not-found-client.tsx:47` |
| S6 | URL path segments (`[lang]`, `[slug]`, `[courseSlug]`, `[lessonSlug]`, `[pair]`, `[activitySlug]`, `[roadmapSlug]`, `[quizSlug]`) | Untrusted | Validated against filesystem lookups / allowlists |
| S7 | `NEXT_LOCALE` cookie | Untrusted | Regex-constrained in both consumers |
| S8 | `Accept-Language` header | Untrusted | Dev-only middleware |
| S9 | `pdbId` / `slug` / `language` inside fenced ` ```molecule ` / ` ```phet ` / ` ```plot ` blocks | Semi-trusted | Interpolated into URLs |

### 1.3 Sinks

| # | Sink | Notes |
|---|------|-------|
| K1 | `dangerouslySetInnerHTML` | Exactly one site: `app/[lang]/layout.tsx:107` (static JSON-LD) |
| K2 | `element.innerHTML = ...` | `MarkdownRenderer.tsx:118` (KaTeX output), `:185` (Mermaid SVG) |
| K3 | `iframe src` | `PhETEmbed.tsx:69` |
| K4 | `window.open` / `router.push` | `CommandPalette.tsx:129`, `library-client.tsx:372-374` |
| K5 | `fetch()` | `CommandPalette.tsx:84` (same-origin), `MoleculeViewer.tsx:62` (RCSB) |
| K6 | `location.replace` | `public/index.html:14`, `postbuild.mjs:62` |
| K7 | `postMessage` | **None** — no `postMessage` listener anywhere in the app |
| K8 | `eval` / `new Function` | **None** in app code |
| K9 | Dynamic `import()` | 4 sites — all with static specifiers |
| K10 | `<script src>` | All same-origin `_next/static/chunks/*` |

### 1.4 Attack surface conclusion

There is **no** path from an untrusted source to a dangerous sink that produces script execution. The two `innerHTML` writes (K2) are the most interesting and are analysed in [SEC-10](#sec-10-innerhtml-sinks-reviewed-and-safe).

---

## 2. Findings register — security

---

### SEC-01 — No Content-Security-Policy or security headers

| | |
|---|---|
| **Category** | Security |
| **Severity** | Medium |
| **Status** | **Confirmed** (platform-constrained) |
| **Files** | `app/[lang]/layout.tsx` (no `<head>` CSP meta), `next.config.js`, `public/index.html` |

**Evidence**

Searched the entire repository for CSP or security-header configuration:

```
$ grep -rniE "content-security-policy|x-frame-options|referrer-policy|permissions-policy|strict-transport|x-content-type-options" app components lib public scripts next.config.js
(no matches)
```

Verified in the emitted artifact — the first `<head>` of a generated page contains only:

```html
<!-- out/en/index.html -->
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
```

`next.config.js` has no `headers()` function (and could not — `output: 'export'` does not support it), and `public/index.html` has no CSP meta tag.

**Why this matters**

The application is otherwise defensively built: sanitized Markdown, no `dangerouslySetInnerHTML` on user data, no third-party scripts. **CSP is precisely the layer that would contain the blast radius if any future injection were introduced.** Without it, any same-origin script execution has unrestricted access to the DOM, `localStorage` (which holds the student's name), and the network.

**Platform constraint**

GitHub Pages is served by a shared CDN that does not permit custom response headers. There is no `headers` file, worker, or proxy in front of it. Therefore **header-based CSP is impossible on the current host.**

**Impact**

- Any future XSS, or any compromised npm package, executes with full origin privileges.
- The `localStorage` PII (SEC-02) is readable by any injected script.
- Clickjacking is possible: `X-Frame-Options` / `frame-ancestors` cannot be set.
- No `Referrer-Policy`: the full referring URL (including any query strings) leaks to every third party the user follows out of the site.

**Remediation — staged**

**Stage 1 (deployable now, no hosting change):** a `<meta http-equiv="Content-Security-Policy">` in `app/[lang]/layout.tsx`.

`meta`-based CSP supports `default-src`, `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `child-src`, `media-src`, `object-src`, `base-uri`, `form-action`, `sandbox`, and `upgrade-insecure-requests`. It does **not** support `frame-ancestors`, `report-uri`, or `report-to`.

Next.js injects inline bootstrap scripts, so the policy needs either:
- `'unsafe-inline'` for `script-src` (weakens the policy), **or**
- a **hash-based** allowlist computed at build time for the known inline scripts (strong), **or**
- `'strict-dynamic'` with a valid nonce — **not usable with `meta`**, since nonces require a per-request response header.

Recommended Stage 1 policy:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' https://files.rcsb.org https://formspree.io;
frame-src https://phet.colorado.edu;
object-src 'none';
base-uri 'self';
form-action 'self' https://formspree.io;
sandbox allow-scripts allow-same-origin allow-forms allow-popups;
```

> `script-src 'unsafe-eval'` is required because Next.js 14's dev overlay and some runtime paths use `eval`. In a production static export the requirement can be dropped after verification — the plan in [08](./08-implementation-plan.md) includes a build-output scan to confirm.

> `connect-src` must include `https://formspree.io` (the contact form) and `https://files.rcsb.org` (the molecule viewer), and `frame-src https://phet.colorado.edu` (the PhET embed).

**Stage 2 (recommended, enables real headers):** migrate to **Cloudflare Pages** (free tier, same static output) or place a **Cloudflare Worker** in front of the Pages origin. This unlocks header-based CSP with per-response nonces, plus `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `frame-ancestors 'none'`.

**Effort:** Stage 1 ≈ 3 hours. Stage 2 ≈ 1 day (config only — the Next.js output is unchanged).

---

### SEC-02 — Student full name persisted in plaintext `localStorage`, written per keystroke

| | |
|---|---|
| **Category** | Security · Privacy |
| **Severity** | Medium |
| **Status** | **Confirmed** |
| **Files** | `lib/quizzes/storage.ts:22,146-153` · `components/quizzes/CertificateCard.tsx:32-35,50-57` |

**Evidence**

`lib/quizzes/storage.ts`:
```ts
22: export const QUIZ_CERT_NAME_KEY = 'v1:quizzes-cert-name'
...
146: export function getCertName(): string {
147:   return safeGet(QUIZ_CERT_NAME_KEY) ?? ''
148: }
149:
150: export function setCertName(name: string): void {
151:   if (name) safeSet(QUIZ_CERT_NAME_KEY, name)
152:   else safeRemove(QUIZ_CERT_NAME_KEY)
153: }
```

`components/quizzes/CertificateCard.tsx`:
```tsx
32:   function handleChange(value: string) {
33:     setName(value)
34:     setCertName(value)
35:   }
```

The `<input type="text">` at `CertificateCard.tsx:50-57` calls `handleChange` on every keystroke, which writes the raw full name to `localStorage` **synchronously, with no debounce and no length cap**.

**Impact**

- This is the **only true PII** persisted anywhere in the application. Every other storage key holds progress, scores, or preferences.
- The value is stored **in plaintext**, indefinitely, and is **never cleared** — there is no code path anywhere in the repository that removes `v1:quizzes-cert-name`. A user who "signs out" (there is no account system, so this is implicit) still has their name on disk.
- It is readable by **any script on the origin**. With no CSP (SEC-01), that includes any injected script.
- It is readable by **any other application served from `nuniversity.github.io`** — GitHub Pages serves all user sites from a single origin (`*.github.io`), so a compromise of *any* GitHub Pages site in that namespace shares this origin. **This is a materially elevated risk specific to the GitHub Pages hosting model.**
- Writes on every keystroke also mean a partially-typed name can be captured by a tab close or crash.

**Remediation**

1. **Debounce the write.** Persist on blur, or with a 400 ms debounce, rather than per keystroke.
2. **Cap the length.** `name.slice(0, 120)` — a name field has no legitimate use beyond that.
3. **Normalise on read.** `getCertName()` should `.trim()` and enforce the same cap, so a hand-edited `localStorage` value cannot inject a 10 MB string into the certificate SVG/HTML.
4. **Provide a "clear" affordance.** The certificates page (`app/[lang]/quizzes/certificates/page.tsx`) should offer an explicit "remove saved name" control, and it should be documented in the privacy note.
5. **Add a privacy notice** stating that the name is stored locally in the browser and never transmitted.
6. Optionally: store it under a dedicated namespace with a clear TTL so it self-expires.

> **Note on proportionality.** A certificate must show the learner's name, so *some* local persistence is functionally required. The correct fix is to make it deliberate, bounded, and documented — not to remove it.

**Effort:** ≈ 1 hour.

---

### SEC-03 — Formspree endpoint is an unauthenticated, uncaptcha'd, unlimited-rate relay

| | |
|---|---|
| **Category** | Security · Abuse |
| **Severity** | Medium |
| **Status** | **Confirmed** |
| **Files** | `components/contacts/Contact.tsx:17,176,199-285` |

**Evidence**

```tsx
17:   const [state, handleSubmit] = useForm("xandddko") // Replace with your Formspree form ID
```

Confirmed against the installed library — `node_modules/@formspree/core/dist/index.mjs` builds the endpoint as `` `${c}/f/${r}` `` where `c = "https://formspree.io"`. The shipped endpoint is therefore:

```
POST https://formspree.io/f/xandddko
```

The target mailbox is `project contact mailbox` (`Contact.tsx:176`).

**Assessment of the form ID itself**

The Formspree form ID is **not a credential**. Formspree form IDs are public by design — they are the POST target of a client-side form, equivalent to a webhook URL. Knowing the ID does **not** grant read access to submissions; that requires the Formspree account. **This is not a secret leak.**

**The real issues**

| Issue | Detail |
|-------|--------|
| **Open relay** | Anyone can `POST` arbitrary JSON to the endpoint. There is no CAPTCHA, no honeypot, no rate limit, and no client-side timestamp check. Verified: `grep -oiE "honeypot\|gotcha\|captcha\|recaptcha\|turnstile" node_modules/@formspree/react/dist/*` → no matches. |
| **Possible placeholder** | The trailing comment `// Replace with your Formspree form ID` strongly suggests `xandddko` may be a template/example ID rather than a deliberately provisioned production form. **This should be verified against the Formspree dashboard** — if it is a demo form, submissions may not be delivered at all. |
| **No input constraints** | The form uses HTML5 `required` only. There is no `minLength`, `maxLength`, or `pattern` on any of the four fields (`name` L205-214, `email` L221-230, `subject` L239-248, `message` L256-265). A 100 MB paste into `message` is POSTed. |
| **No privacy notice** | The form transmits name, email, subject, and message to a US third party with no consent checkbox and no link to a privacy policy. |
| **Dead code** | `resetForm()` at `:52` resets React state but never calls `state.reset()` from `useForm`, so Formspree's internal submission state is not reset. |

**Remediation**

1. **Add a honeypot field.** A visually-hidden input named e.g. `company_website`; if non-empty, do not submit. Formspree ignores unknown fields, so no extra configuration is needed. This removes the majority of automated spam with zero user friction and **no third-party dependency**.
2. **Add `maxLength` attributes** — `name` 120, `email` 254, `subject` 200, `message` 5000.
3. **Add a client-side submit debounce** (e.g. ignore a second submit within 3 s).
4. **Add an explicit privacy line** under the form stating what is sent, to whom, and that the submission is used only to reply.
5. **Verify the form ID** in the Formspree dashboard; replace it if it is the placeholder, and move the ID to an environment variable (`NEXT_PUBLIC_FORMSPREE_FORM_ID`) so it can be changed without a code edit.
6. Consider enabling Formspree's own dashboard-side protections (activation email, reCAPTCHA, spam filter) as the server-side complement.

**Effort:** ≈ 3 hours.

---

### SEC-04 — Local prototype manipulation in the language-activity migration path

| | |
|---|---|
| **Category** | Security |
| **Severity** | Medium |
| **Status** | **Confirmed** (local only — **not** global `Object.prototype` pollution) |
| **Files** | `lib/languages/storage.ts:74-105` |

**Evidence**

```ts
79:   const progress: FlashcardProgressMap = {}
80:   for (const [wordId, value] of Object.entries(data)) {
...
85:       progress[wordId] = {
86:         streak: reps >= LEARNED_THRESHOLD ? LEARNED_THRESHOLD : reps > 0 ? reps : 0,
```

`progress` is a plain `{}` literal. `Object.entries()` **does** surface an own `__proto__` property that `JSON.parse` created, and assigning to `progress['__proto__']` invokes the **`__proto__` setter** rather than creating an own property.

**Reproduced in Node:**

```js
const data = JSON.parse('{"__proto__":{"repetitions":5}}')
Object.entries(data)          // → [ [ '__proto__', { repetitions: 5 } ] ]
const progress = {}
progress['__proto__'] = { streak: 5 }
Object.keys(progress)        // → []          ← entry vanished
progress.streak               // → 5           ← inherited, attacker-controlled
Object.prototype.streak       // → undefined  ← NOT global pollution
```

**Impact**

Confined to the local `progress` map. The injected entry disappears from `Object.keys(progress)` (so the word shows as unlearned) while `progress.streak` and `progress.totalReviews` resolve to attacker-chosen numbers — which **can skew the learner's progress display and streak counters**.

**Precondition:** the attacker must already be able to write to `localStorage` for this origin — i.e. same-origin XSS or physical access to the device. So this is **not remotely exploitable** and is a defence-in-depth issue, not a live vulnerability.

**Note — the rest of the codebase gets this right.** `lib/gamification/profile.ts:45-50` assigns only **strings** to `badges[id]`, and assigning a non-object to `__proto__` is a silent no-op. `components/roadmaps/RoadmapTimeline.tsx:28` uses object spread, which uses `CreateDataProperty` and bypasses the setter entirely. Both were verified empirically as safe.

**Remediation**

```ts
const progress: FlashcardProgressMap = Object.create(null)
// and skip reserved keys:
if (wordId === '__proto__' || wordId === 'constructor' || wordId === 'prototype') continue
```

**Effort:** ≈ 15 minutes.

---

### SEC-05 — Storage access without error handling, and an unchecked type assertion

| | |
|---|---|
| **Category** | Security · Robustness |
| **Severity** | Medium |
| **Status** | **Confirmed** |
| **Files** | `components/providers/Providers.tsx:36-50` |

**Evidence**

```tsx
36:   useEffect(() => {
37:     const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
...
48:     localStorage.setItem('theme', theme)
```

This is the **only** storage access in the entire codebase with **no `try/catch`**. Every other site is guarded (see ARCH-01 for the full inventory).

Two distinct problems:

1. **Uncaught exceptions.** `localStorage.getItem` throws `SecurityError` when cookies/storage are blocked (Safari Intelligent Tracking Prevention in some configurations, Firefox `dom.storage.enabled=false`, any browser in strict private mode where `localStorage` throws on write). `localStorage.setItem` throws `QuotaExceededError` when the quota is exhausted. Neither is caught, so the exception propagates out of the `useEffect` and **prevents the theme from ever being applied** — the site renders in the default theme with a console error, and in the case of `setItem`, it throws on *every* render cycle.

2. **Unchecked assertion.** `as 'light' | 'dark' | null` is a *compile-time* claim with no runtime validation. Any arbitrary string in the key is accepted and cast to a valid theme. The downstream impact is limited to `classList.toggle('dark', theme === 'dark')` (`Providers.tsx:49`), so the consequence is cosmetic — but the pattern is wrong and the same assertion would be dangerous if reused elsewhere.

**Remediation**

Route through the new shared storage helper (ARCH-01) and validate the value:

```ts
const raw = safeGet('theme')
const theme: Theme = raw === 'dark' || raw === 'light' ? raw : 'system'
```

**Effort:** ≈ 30 minutes.

---

### SEC-06 — Secret scanning: clean

| | |
|---|---|
| **Category** | Security |
| **Severity** | **Informational — no finding** |
| **Status** | **Confirmed clean** |

**Evidence**

Scanned the working tree **and** the full git history (`git log --all --diff-filter=A`) for 12 high-signal credential classes:

`AKIA[0-9A-Z]{16}` · `ghp_/gho_/ghs_/github_pat_` · `sk-[A-Za-z0-9]{20,}` · `xox[baprs]-` · `AIza[0-9A-Za-z_-]{30,}` · `-----BEGIN [A-Z ]*PRIVATE KEY` · JWT (`eyJ...\....`) · `sk_live_` · `rk_live_` · `api[_-]?key\s*[:=]\s*['"][^'"]{20,}` · `password\s*[:=]\s*['"][^'"]{12,}`

**Result: zero matches.**

Filename scan for `.env*`, `.npmrc`, `.netrc`, `*.pem`, `*.key`, `*.p12`, `id_rsa*`, `*credential*`, `*.bak`, `*~`, `*.orig` → **zero matches** on disk and in history.

Keyword hits across `content/` and `docs/` were **all false positives** — educational prose and code samples, e.g. `api_key="test-key-123"` in `content/courses/guardrails-evaluation/en/04-testing-agentic-systems-unit-integration-and-e2e.md:289` (explicitly labelled a test key), and GitHub Actions expressions in documentation examples like `${{ secrets.TEST_API_KEY }}`.

The only credential-shaped string in the repository is the Formspree form ID — a public endpoint identifier, analysed in [SEC-03](#sec-03--formspree-endpoint-is-an-unauthenticated-uncaptcha-d-unlimited-rate-relay).

`.gitignore` correctly excludes `.env` / `.env.*` (lines 69-72), `public/search-index/` (83), `out` (80), `.next` (79), `.scratch/` (149), `.venv/` (154), and `_*/` (157).

**Conclusion:** no credential exposure. This should be maintained via a pre-commit secret scan — the repo already has `.pre-commit-config.yaml` and Husky set up, which makes adding `gitleaks` cheap.

---

### SEC-07 — `NEXT_LOCALE` cookie missing `Secure` and `SameSite`

| | |
|---|---|
| **Category** | Security |
| **Severity** | Medium |
| **Status** | **Confirmed** |
| **Files** | `components/language/LanguageSwitcher.tsx:40` · `middleware.ts:68` |

**Evidence**

```ts
// components/language/LanguageSwitcher.tsx:40
document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
```

**Impact**

- **No `Secure`** → the cookie is transmitted over plaintext HTTP if the user reaches `http://nuniversity.github.io`. GitHub Pages does serve HTTP (it redirects to HTTPS, but the plaintext request still leaves the device).
- **No `SameSite`** → modern browsers default to `Lax`, which is adequate here, but relying on the implicit default is fragile.
- **`HttpOnly` is impossible** from JavaScript — and it is not needed here, because the value must be readable by the redirect script in `public/index.html`.

**Actual exploitability: very low.** The value is constrained to a three-value enum at every consumer:

```js
// public/index.html:9
var m = document.cookie.match(/NEXT_LOCALE=(en|pt|es)/)
// scripts/postbuild.mjs:60
var c = document.cookie.match(/NEXT_LOCALE=(en|pt|es)/)
```

and is used only to build a **path** (`location.replace('/' + locale + '/')`). There is no open redirect and no injection.

**Remediation**

```ts
document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax; Secure`
```

> `Secure` requires HTTPS. The site is HTTPS-only in practice, so this is safe. However, if the site is ever previewed over `http://localhost`, the cookie would be rejected — the value should still be applied via a fallback. The simplest correct approach: set `Secure` only when `location.protocol === 'https:'`.

**Effort:** ≈ 20 minutes.

---

### SEC-08 — Unvalidated identifiers in third-party embeds

| | |
|---|---|
| **Category** | Security |
| **Severity** | Medium |
| **Status** | **Confirmed as code smell; not remotely exploitable** |
| **Files** | `components/markdown/PhETEmbed.tsx:12-18,68-78` · `components/markdown/MoleculeViewer.tsx:40-41,62` |

**Evidence — PhET**

```tsx
12: const PHET_BASE = 'https://phet.colorado.edu/sims/html'
...
18:   const url = `${PHET_BASE}/${slug}/latest/${slug}_${language}.html`
```

No allowlist, no regex, no `encodeURIComponent`. The `slug` and `language` come from a fenced ` ```phet ` JSON block parsed at `components/markdown/MarkdownRenderer.tsx:435-451`.

**Evidence — Molecule**

```tsx
40:   const displayName = label || `Protein: ${pdbId.toUpperCase()}`
41:   const pdbUrl = `https://www.rcsb.org/structure/${pdbId.toUpperCase()}`
...
62:         const response = await fetch(`https://files.rcsb.org/download/${pdbId.toUpperCase()}.pdb`)
```

**Why this is *not* an open redirect or cross-origin escape**

The base is a **fixed literal**. A hostile slug cannot escape the origin:

```
slug = "https://evil.com"
  → https://phet.colorado.edu/sims/html/https://evil.com/latest/https://evil.com_en.html
     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ still phet.colorado.edu

slug = "../../../admin"
  → https://phet.colorado.edu/sims/html/../../../admin/latest/...  (path traversal within the origin only)
```

React sets `src` as a DOM property, so there is no HTML-attribute injection either.

**Impact**

- **Low direct impact.** The origin is fixed; there is no open redirect and no XSS.
- **Real impact:** an arbitrary PDB ID lets the page request **any** file from `files.rcsb.org/download/` — the site becomes a 1:1 proxy for RCSB's file store. That is a content-author-controlled amplification toward a trusted third party, and it is unnecessary.
- **Defence-in-depth:** an allowlist makes the intent explicit and prevents future refactors from introducing a genuine escape.

**Reachability note**

Both components are currently **unreachable from published content**:

```
$ grep -rn '```phet' content/     → (none)
$ grep -rn '```molecule' content/ → (none)
```

They exist only in authoring templates (`.opencode/skills/course-writer/references/guide.md`, `agents/COURSE-WRITER-AGENT-PROMPT.md`). `SciencePlot` (the ` ```plot ` block), by contrast, **is** live — 25+ fences across `content/courses/aws-data-lakehouse/{pt,es}/`.

**Remediation**

```ts
const PHET_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PDB_ID_RE = /^[0-9A-Z]{4}$/

const safeSlug = PHET_SLUG_RE.test(slug) ? slug : null
if (!safeSlug) return <ErrorBox>Invalid simulation identifier</ErrorBox>
```

Also add `encodeURIComponent` on the interpolated segments, and a `response.ok` + content-type + size-cap check on the RCSB fetch.

**Effort:** ≈ 1 hour.

---

### SEC-09 — Embedded iframe has no `sandbox` attribute

| | |
|---|---|
| **Category** | Security |
| **Severity** | Medium |
| **Status** | **Potential** |
| **Files** | `components/markdown/PhETEmbed.tsx:68-78` |

**Evidence**

```tsx
68:         <iframe
69:           src={url}
70:           title={displayName}
71:           className="w-full h-full border-0"
72:           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
73:           allowFullScreen
74:           loading="lazy"
75:           referrerPolicy="no-referrer"
76:           onLoad={() => setLoaded(true)}
77:           onError={() => setError(true)}
78:         />
```

**Analysis**

- The `allow` attribute at `:72` is a **Permissions-Policy feature list** (camera, microphone, clipboard, gyroscope). It is frequently mistaken for a cross-origin restriction — it is **not** one. It does not limit which origins may embed this frame, nor does it restrict what the framed document may do.
- There is **no `sandbox` attribute**, so the framed document runs with full script execution and no sandbox restrictions.
- ✅ `referrerPolicy="no-referrer"` is present — this correctly prevents leaking the referring page URL to PhET. Good practice.
- ✅ `loading="lazy"` — good for performance.
- ⚠️ `onError` on an `<iframe>` **does not fire** for HTTP failures. A 404 from PhET yields a blank frame and the "Failed to load simulation" fallback at `:21-43` is effectively unreachable.

**Impact**

The PhET origin receives a script channel into the embedder. Since PhET is a trusted first-party academic partner and the simulation genuinely requires scripts, the practical risk is low — but `sandbox` with an explicit allowlist would let PhET keep working while removing most of the capability:

```html
sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
```

> `allow-same-origin` is required here — PhET's simulation reads its own storage and the sandboxed origin must remain `phet.colorado.edu` for the app to function. Note that `allow-scripts` + `allow-same-origin` together do **not** allow the framed content to escape the sandbox (that requires the framed content to be same-origin with the *embedder*, which it is not).

**Remediation**

1. Add the `sandbox` attribute with an explicit allowlist.
2. Replace the unreachable `onError` with a load-timeout check (`onLoad` + a `setTimeout` that flips to the error state if `onLoad` has not fired).
3. Add a visible "Open simulation in a new tab" link as a manual fallback — this also improves the experience when the embed is blocked.

**Effort:** ≈ 1 hour.

---

### SEC-10 — `innerHTML` sinks: reviewed and safe

| | |
|---|---|
| **Category** | Security |
| **Severity** | **Informational — no finding** |
| **Status** | **Confirmed safe** |

Two `innerHTML` writes exist in the application. Both were traced.

**KaTeX — `components/markdown/MarkdownRenderer.tsx:112-118`**

```tsx
112:         const katex = await import('katex')
...
114:         const html = katex.default.renderToString(tex, {
115:           displayMode: true,
116:           throwOnError: false,
117:         })
118:         containerRef.current.innerHTML = html
```

`tex` comes from a fenced ` ```math ` block, i.e. content-authored. KaTeX's `trust` option defaults to `false`, which disables the dangerous commands (`\href`, `\url`, `\includegraphics`, `\htmlClass`, `\htmlId`, `\htmlStyle`) that would otherwise allow HTML injection into the output. The `trust` option is **not** set here, so it is `false`. **Safe.**

> Defence-in-depth: set `trust: false` explicitly so a future edit cannot accidentally enable it, and consider `strict: 'error'` for `throwOnError`.

**Mermaid — `components/markdown/MarkdownRenderer.tsx:181-185`**

```tsx
181:         const { svg } = await mermaidRef.current.render(id, code)
...
185:         containerRef.current.innerHTML = svg
```

Mermaid is initialised with **`securityLevel: 'strict'`** (`:169`), which sanitizes the generated SVG and disables HTML labels. This is enforced by a regression test — `tests/lessons/mermaid-security.test.tsx` asserts both the `securityLevel` value and that the rendered output contains no `<script>`.

**Safe.**

**Recommendation:** keep both behaviours under test. Add an assertion that KaTeX is invoked with `trust: false`.

---

### SEC-11 — Dependency audit: 25 advisories, no exploitable runtime vulnerability

| | |
|---|---|
| **Category** | Security · Supply Chain |
| **Severity** | Medium (aggregate) |
| **Status** | **Confirmed** |

**Raw `npm audit` result**

```
critical: 4   high: 7   moderate: 9   low: 5   total: 25
```

**Triage against the actual threat model**

| Package | Severity | Direct? | Runtime relevance | Verdict |
|---------|----------|---------|-------------------|---------|
| `next` | critical | ✅ | **None** | The advisories (GHSA-9g9p-9gw9-jx7f image optimizer DoS, plus 2 others) require a **running Next.js server** with `remotePatterns` configured. `output: 'export'` produces static files; there is no server, no image optimizer, and no middleware execution. **Not exploitable.** Upgrade for hygiene. |
| `vitest` | critical | ✅ | **None** | GHSA-5xrq-8626-4rwp requires `vitest --ui` bound to a public interface. CI runs `vitest run`. **Not exploitable.** |
| `tinypool` | critical | ❌ | **None** | GHSA-5gmw-xhrv-c9v3 requires attacker-controlled `workerOptions` in a `tinypool` worker. **Not exploitable.** |
| `dompurify` | critical | ❌ | **None** | GHSA-p98j-92pf-mc4p concerns the `IN_PLACE: false` + `afterSanitize` hook pattern. Transitive via `react-syntax-highlighter`; not used in that configuration anywhere. **Not exploitable.** |
| `postcss` | high | ❌ | **None** | GHSA-qx2v-qp2m-jg93 requires untrusted CSS input to a build-time stringifier. No such input exists. **Not exploitable.** |
| `minimatch` | high | ❌ | **None** | ReDoS via attacker-controlled glob patterns. No runtime globbing of user input. **Not exploitable.** |
| `source-map-js` | high | ❌ | **None** | Event-loop DoS via crafted source-map offsets. Build-time only. **Not exploitable.** |
| `brace-expansion` | high | ❌ | **None** | Quadratic-time expansion. Build-time only. **Not exploitable.** |
| `prismjs` | moderate | ❌ | **⚠️ Relevant** | GHSA-x7hr-w5r2-h6wg — DOM clobbering via crafted code blocks. **This reaches the browser** via `react-syntax-highlighter`'s Prism build. | 
| `react-syntax-highlighter` | moderate | ✅ | **⚠️ Relevant** | Carries the 1.2 MB bundle (**PERF-01**) and the `prismjs` transitive advisory. | 
| `katex` | low | ✅ | **⚠️ Relevant** | GHSA-238p-pmpm-9mq7 — prototype pollution that can **bypass `trust` restrictions**. `trust` is `false` here, so the bypass path is closed, but it is the right dependency to update. |
| `rehype-katex` | low | ✅ | Low | Depends on `katex`; resolves with the `katex` upgrade. |
| `remark-math` | low | ✅ | Low | Depends on `katex`. |
| `mermaid` | low | ✅ | Low | Depends on `katex`. |
| `tailwindcss`, `@tailwindcss/typography`, `postcss-nested`, `postcss-selector-parser` | moderate | ✅/❌ | **None** | Build-time only. |
| `vite`, `vite-node`, `esbuild` | high/moderate | ❌ | **None** | Dev-server only. CI does not run a dev server. |
| `@typescript-eslint/*` | high | ❌ | **None** | Lint-time only. |

**Conclusion**

> **There is no exploitable dependency vulnerability in the deployed artifact.** Every "critical" and "high" is dev-only, build-only, or requires a server runtime this site does not have.

That said, the advisories are worth clearing because (a) two of them — `prismjs` and `katex` — genuinely reach the browser, and (b) leaving 25 open advisories trains reviewers to ignore the output.

**Remediation plan**

| Action | Package | New version | Risk |
|--------|---------|-------------|------|
| Replace `react-syntax-highlighter` | — | remove entirely, or swap to `shiki` | Medium — see PERF-01 |
| Upgrade | `katex` | `^0.19.1` | Low |
| Upgrade | `next` | `^15` or `^16` | Medium — App Router changes; requires a full build + export verification |
| Upgrade | `vitest` | `^5` | Low — config API is stable |
| `npm audit fix` | transitive | — | Low — but review each bump |

**Effort:** `katex` + `vitest` ≈ 1 hour. `next` major upgrade ≈ 1 day including full export verification.

---

### SEC-12 — CI/CD pipeline review

| | |
|---|---|
| **Category** | Security · Supply Chain |
| **Severity** | Low |
| **Status** | **Confirmed — mostly sound** |

**Evidence — `.github/workflows/nextjs.yml`**

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

✅ **Least-privilege token scoping** — no `write-all`, no `packages: write`, no `actions: write`.

✅ **Actions are pinned to major versions** (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`). Pinning to a **full commit SHA** would be stronger against tag mutation, but major-version pinning is the common and acceptable baseline.

✅ **Concurrency control** — `group: "pages"`, `cancel-in-progress: false`. Correct for Pages deployments.

✅ **No `secrets.*` usage** — the workflow relies solely on the auto-provisioned `GITHUB_TOKEN`.

⚠️ **No `npm audit` step** — a vulnerable dependency merges silently.

⚠️ **Tests are run, but only `vitest`** — `.github/workflows/nextjs.yml` runs `npx --no-install vitest run` but **never the Python test suite** (`tests/test_validate_quiz_json.py`, `test_validate_languages.py`, `test_opencode_courses.py`, `test_interactive_blocks.py`, `test_validator_coverage.py`, `tests/library/test_link_exceptions.py`). The Python validators guard quiz JSON schema and language activity schemas — content that ships to users.

⚠️ **`node-version: "20"` vs `engines: "node": ">=22 <23"`** — `package.json:66-68` declares Node 22, but CI uses Node 20. The build therefore runs on a **different Node version than the project declares**. `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` is also set in `env`, which forces Node 24 for *JavaScript actions* — but not for the `run` steps.

⚠️ **`actions/cache` key includes `hashFiles('**.[jt]s', '**.[jt]sx')`** — this glob pattern is malformed. The correct form is `hashFiles('**/*.[jt]s', '**/*.[jt]sx')`. As written, `**.[jt]s` matches very little, so the cache key barely changes when source files change — meaning **stale `.next/cache` entries can be restored across unrelated source changes**, producing incorrect incremental builds.

⚠️ **No `pull_request` trigger** — only `push` to `main` and `workflow_dispatch`. There is no pre-merge verification workflow, so a broken build only surfaces *after* merge, when the deploy job has already begun.

⚠️ **No `actions/checkout` `persist-credentials: false`** — the checkout token remains in `.git/config` for the rest of the job. Minor in a single-job workflow, but best practice is to disable it.

**Remediation**

1. Fix the cache key glob → `hashFiles('**/*.[jt]s', '**/*.[jt]sx')`.
2. Align `node-version` with `engines` (`"22"`).
3. Add `npm audit --audit-level=high --omit=dev` as a gating step (or at minimum a non-blocking report).
4. Add the Python test suite to CI.
5. Add a `pull_request` trigger running lint + tests + build (no deploy).
6. Pin third-party actions to commit SHAs.
7. Set `persist-credentials: false` on checkout.

**Effort:** ≈ 3 hours.

---

### SEC-13 — Privacy posture

| | |
|---|---|
| **Category** | Security · Privacy |
| **Severity** | Low |
| **Status** | **Confirmed** |

**Assessment**

| Aspect | Status |
|--------|--------|
| Analytics / tracking scripts | ✅ **None.** No gtag, Plausible, Hotjar, Segment, Mixpanel, or any third-party script. |
| Cookies | One functional cookie (`NEXT_LOCALE`), enum-valued, no PII. No advertising or profiling cookie. |
| `public/ads.txt` | Present: `google.com, pub-6042638700707862, DIRECT, f08c47fec0942fa0`. This is the **IAB ads.txt standard** — a public record of authorised sellers for a Google AdSense publisher ID. It is **not a secret**. However, **no ad script is loaded anywhere in the codebase**, so this file advertises a monetisation relationship that the site does not currently exercise. Worth confirming this is intentional. |
| PII transmission | Only via the contact form → Formspree (US third party). No privacy notice. → **SEC-03** |
| PII at rest | Student name in `localStorage` (plaintext). → **SEC-02** |
| Student progress | All local. Never transmitted. ✅ Good. |
| Third-party embeds | PhET (iframe, `referrerPolicy="no-referrer"`), RCSB (fetch), Google Images / Google Translate (outbound links only, not embedded). |
| Referrer leakage to third parties | ⚠️ Without a `Referrer-Policy` header (blocked by GitHub Pages — SEC-01), the **full referring URL** is sent to PhET, RCSB, Formspree, and every outbound library link. GitHub Pages does serve a default `Referrer-Policy` for some paths, but this cannot be relied upon. |

**Remediation**

1. Add a `Referrer-Policy: strict-origin-when-cross-origin` meta tag (works under `meta` CSP headers via the `referrer` directive? **No** — `Referrer-Policy` is a header-only directive. However, `<meta name="referrer" content="strict-origin-when-cross-origin">` **is** supported by all modern browsers and does not require a CSP. Add it to the root layout.)
2. Add a privacy section to the contact page and the certificates page.
3. Confirm the `ads.txt` publisher relationship is intentional.

**Effort:** ≈ 1 hour.

---

## 3. Confirmed vs. potential — summary table

| ID | Finding | Severity | Status | Remotely exploitable? |
|----|---------|----------|--------|-----------------------|
| SEC-01 | No CSP / security headers | Medium | Confirmed (platform-constrained) | N/A — missing defence layer |
| SEC-02 | Student name in plaintext `localStorage` | Medium | Confirmed | No — requires same-origin script access |
| SEC-03 | Formspree open relay, no spam control | Medium | Confirmed | **Yes** — any internet user can abuse the endpoint |
| SEC-04 | `__proto__` setter in migration | Medium | Confirmed | No — requires localStorage write access |
| SEC-05 | Unguarded storage access + bad assertion | Medium | Confirmed | No |
| SEC-06 | Secret scanning | Info | **Clean** | — |
| SEC-07 | Cookie missing `Secure`/`SameSite` | Medium | Confirmed | No — value is enum-constrained |
| SEC-08 | Unvalidated embed identifiers | Medium | Confirmed | No — origin is fixed |
| SEC-09 | Iframe without `sandbox` | Medium | **Potential** | No — requires content authoring control |
| SEC-10 | `innerHTML` sinks | Info | **Safe** | — |
| SEC-11 | 25 dependency advisories | Medium | Confirmed | No — all build/dev-only or non-exploitable |
| SEC-12 | CI pipeline hardening gaps | Low | Confirmed | No |
| SEC-13 | Privacy posture | Low | Confirmed | No |

---

## 4. Verified clean

For completeness, these were checked and found to be **non-issues** — recorded so they are not re-investigated:

| Check | Result |
|-------|--------|
| `sessionStorage` usage | **0** occurrences |
| IndexedDB usage | **0** occurrences (`indexedDB`, `idb-keyval`, `openDatabase`, `dexie` all absent) |
| `postMessage` listeners | **0** — no `postMessage` in `app/`, `components/`, `lib/` |
| `eval` / `new Function` / `document.write` | **0** in application code (1 in vendored 3Dmol's py3Dmol path, unreachable) |
| `dangerouslySetInnerHTML` | **1** site, static JSON-LD only |
| Runtime Google Fonts | **None** — self-hosted via `next/font/google` |
| CDN `<script src>` | **None** — all scripts same-origin |
| `javascript:` / `data:` URLs in the search index | **0** across all 1,677 index documents |
| `localStorage` prototype pollution (global) | **Not reachable** — `JSON.parse` never mutates `Object.prototype`; verified empirically |
| Open redirect | **None** — all redirects use fixed literals or enum-constrained values |
| Path traversal in file reads | **None** — all content access goes through `path.join` with slug segments validated against directory listings |
| XSS via search index | **Not reachable** — all index fields rendered as React text children (auto-escaped) |
| XSS via Markdown | **Not reachable** — `rehype-raw` → `rehype-sanitize` in the correct order, protocol-restricted |
| HTTP (non-TLS) external resources | **1** — `http://efisica.if.usp.br/` in `content/library/{pt,es}/course/efisica-usp.md:5`, already tracked in `content/library/link-exceptions.tsv:8,40`. Low — a link to a third party, not a subresource load. |
| Path traversal in `not-found-client.tsx` | **Not reachable** — `?p=` is rendered as a React text child |
