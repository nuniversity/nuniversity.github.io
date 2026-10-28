# PLAN-MODERNIZATION — Platform Modernization (Epics & Sprints)

> **Goal:** extend `nuniversity.github.io` from a pure static site into a static-site + free-tier
> backend platform — observability, working contact form, edge API, accounts, cross-device progress
> sync — using **only free tiers ($0/month, no credit cards)**, without ever breaking the green
> Phase-6 battery (1,209 vitest / 566 pytest / build / verify_out / ci_sim).
>
> **Status:** ready for execution · **Date:** Oct 2026 · **Extends:** `PLAN.md` (9-phase review plan)
> **Research basis:** ~20 deep/fast web searches + official pricing/docs pages verified Oct 2026
> (Cloudflare, Neon, Clerk, PostHog, UptimeRobot, Web3Forms, Resend, Brevo, Better Auth, Next.js).

---

## 0. How to use this document

| Section | Answers |
|---|---|
| §1–2 | What changes, on what architecture |
| §3 | Every decision with alternatives considered (read before objecting) |
| §4 | The roadmap: 7 epics, 16 sprints, gates G0–G4 |
| §5 | Sprint detail: tasks with exact files, acceptance criteria, risks/troubleshooting |
| §6–9 | Quota ledger, security/privacy checklist, troubleshooting playbook, risk register |
| §10 | Definition of Done + battery |
| §11 | Open decisions (defaults chosen) |
| §12 | Appendices: accounts, secrets, commands, deps, i18n surface |

**Standing constraints (apply to every sprint):**

1. Never `git commit` — the user commits manually ("up" style).
2. No code comments in shipped code; no `eslint-disable`; no `rg` (grep only).
3. **No new dependencies without explicit approval** — the full list needing approval is in §12.4.
4. Scratch work in `.scratch/` (gitignored); never modify `_backup/`.
5. Every sprint ends with the **battery** (§10) green before the next sprint starts.
6. Any new UI string must be added to `dictionaries/en.json` **and** `es.json` **and** `pt.json`
   (dict-parity tests enforce 5/5 — three-locale atomic edits).
7. TS target is ES5 — no `Set`/`Map` spreads, use `Array.from`; vitest 1.6.1 quirks apply
   (no `vi.unstubAllGlobals()`, wrap state updates in `act(...)`); jsdom `next/link` strips
   trailing slashes; `scrollIntoView` as `?.scrollIntoView?.()`.
8. Site code stays compatible with `output: 'export'` — no API routes, no server actions,
   no production middleware, no `window` at module scope.

---

## 1. Executive summary

**Today:** static Next.js export on GitHub Pages; progress/gamification in `localStorage` only;
build-time JSON search index; a contact form wired to a Formspree ID of unknown liveness; no
analytics, no uptime monitoring, no backend, no accounts; CI runs only `vitest` + `next build` on
Node 20 while `engines` demands Node 22, and skips `tsc`/ESLint/`pytest`/`verify_out` entirely.

**After this plan:**

- CI runs the **full battery** as merge gates (tsc, lint, vitest, pytest ≥80%, verify_out, build).
- **PostHog** product analytics + session replay (consent-gated) + error tracking + feature flags.
- **UptimeRobot** monitors site + API with a public status page.
- Contact form on **Web3Forms** (250/mo) — closes SEC-03/F-015.
- A **Cloudflare Worker** (`workers.dev`) serving a versioned JSON API with CORS, rate limiting,
  and health monitoring.
- **Clerk** accounts (50k MAU free) with Worker-side JWT verification.
- **Neon** Postgres (1GB free) with **cross-device progress sync** — signed-in users back up their
  `localStorage` progress; signed-out behavior is 100% unchanged.
- **Zero production cost, zero credit cards**, commercial-use-clean (AdSense `ads.txt` respected).

**Shape:** 7 epics → 16 sprints → ~15–20 working days, sequentially gated. Epics E0–E2 are
independent wins (weeks 1–2); E3–E5 build the backend (weeks 2–5); E6 closes out.

---

## 2. Ground truth (verified this session)

### 2.1 Repository facts

| Fact | Evidence | Consequence |
|---|---|---|
| Deploy = GitHub Actions → GH Pages | `.github/workflows/nextjs.yml` (vitest + build + `actions/deploy-pages`) | keep as production pipeline; extend with gates |
| CI Node 20 vs `engines: >=22 <23` | workflow line 57 vs `package.json:67` | must fix (E0-S1) |
| Build = prebuild index → `next build` → postbuild | `package.json:5-9` | local build **>5 min**; CI budget ~6–9 min |
| `out/` = **3,457 files / 772 MB** (en 237M, es 249M, pt 275M; `_next` only 9M) | `find`/`du` this session | per-page weight audit needed; GH Pages 1 GB soft limit approached |
| `output: 'export'` in prod, `trailingSlash: true` | `next.config.js` | static-only: no middleware/API routes in prod |
| `middleware.ts` = dev-only i18n (prod redirect via `public/index.html` + postbuild 404) | `middleware.ts:1-3` | do not touch for auth (Clerk middleware impossible here) |
| Site = `nuniversity.github.io`, **no CNAME** | `git remote`, no CNAME file | GitHub owns DNS → production host can never move; no custom-domain services that need DNS |
| `ads.txt` = AdSense `pub-6042638700707862` | `out/ads.txt` | commercial use required → Vercel Hobby excluded permanently |
| Contact = `useForm("xandddko")` in `Contact.tsx:17` (`@formspree/react`) | file read | real-looking Formspree ID, account liveness unknown → probe, then migrate (E2) |
| Progress write path = single `safeSet()` (`storage.ts:37`) | file read | one hook point for sync timestamps (E5-S2) |
| `components/providers/Providers.tsx` wraps app via `app/[lang]/layout.tsx:125` | file read | mount point for PostHog + Clerk providers |
| Dicts = `dictionaries/{en,es,pt}.json` with parity tests | repo convention | every new string ×3 locales |
| Python harness deps: pyyaml, jsonschema; dev: pytest, pytest-cov, pytest-mock, ruff | `pyproject.toml` | CI Python job needs `pip install -e ".[dev]"` |
| `out/` and `.scratch/` gitignored | `.gitignore` | safe scratch; never commit build output |

### 2.2 Vendor free-tier facts (verified Oct 2026, official where possible)

| Vendor | Free | Critical caveats |
|---|---|---|
| GitHub Pages + Actions | free public repos, unlimited minutes | 1 GB soft repo limit; 100 GB/mo bandwidth soft |
| Cloudflare Workers | 100k req/day, **10 ms CPU**, 50 external subrequests/req, 128 MB, 64 env vars, 64 MiB script, `workers.dev` subdomains ✅ | exceeding daily cap = **Error 1027**; KV free = 1k writes/day, 1 GB |
| Cloudflare Hyperdrive | 100k DB queries/day (free) | future alternative to Neon HTTP driver |
| Cloudflare Pages | 500 builds/mo, 20k files/deploy, 20-min build, unlimited static requests | **unusable for production** (github.io DNS not delegable) — only candidate if a domain is bought (E7) |
| Neon Free | 1 GB/project, 20 GB account, 100 CU-hrs, 100 projects, 10 branches, scale-to-zero ~5 min idle; **extras: 60k MAU auth, 5 GB storage, 1M functions** | compute cold start ~0.5 s; no 1-week project pause (unlike Supabase) |
| Clerk Hobby | **50,000 MRU/app**, 3 social connections, no card | `Secured by Clerk` branding; **MFA/passkeys = paid**; Clerk's own FAQ warns per-MRU suits free/ad-supported apps poorly |
| PostHog | 1M events, 5k replays, 1M flag requests, 100k exceptions/mo, no card | set billing limits at 80%; EU host available |
| UptimeRobot | **50 monitors, 5-min, 1 status page, API included (10 req/min)**, commercial use **re-allowed** (ToS updated May 26, 2026) | in-app non-commercial banner may still show (stale) |
| Web3Forms | 250 submissions/mo, unlimited forms/domains, hCaptcha/honeypot, 30-day history, no card | access key is public by design |
| Resend | 3,000/mo, 1 domain | **DNS verification required → blocked** until a domain is owned (E7) |
| Brevo | 300 emails/day (~9k/mo), 100k contacts stored | can verify a plain mailbox as sender (no DNS) — newsletter path |
| Formspree (current) | ~50 submissions/mo | migration target anyway (E2) |

---

## 3. Decision register

| # | Decision | Pick | Alternatives rejected (why) | Gate |
|---|---|---|---|---|
| **D1** | Production hosting | **stay on GitHub Pages** | Cloudflare Pages / Netlify / Vercel — impossible without a domain; Vercel also bans commercial on Hobby | — |
| **D2** | Backend compute | **Cloudflare Worker on `workers.dev`** | Netlify Functions (extra vendor, no gain); Render/VPS (sleeps, cost); Pages Functions (needs site on CF) | G1 |
| **D3** | Database | **Neon (Postgres) via `@neondatabase/serverless` HTTP driver** | Supabase (1-week project pause kills low-traffic site); D1 (fine, but weaker auth story, 100k reads/day) — kept as fallback; Xata/Turso/PlanetScale (no fitting free tier) | G3 |
| **D4** | Auth | **Clerk via `@clerk/clerk-react` (client-only) + Worker JWT verify (`jose`, JWKS, `azp` check)** | Neon Auth/Better Auth — official docs confirm **cross-origin cookies break in Safari**; same-origin proxy needs a domain we lack; Supabase Auth (pause risk, but valid fallback); self-hosted Better Auth (much more work); Auth0/Lokkin (weaker static story) | **G2** |
| **D5** | Analytics/flags/errors | **PostHog (`posthog-js` only — no `@posthog/next`, it needs middleware/proxy)** | Umami (pageviews only), GA4 (privacy), Plausible (no free tier) | G4 |
| **D6** | Contact form | **Web3Forms via plain `fetch` — zero new deps** | Formspree (50/mo + unknown account), keep-as-is (SEC-03 open) | — |
| **D7** | Email | inbound = Web3Forms; newsletter later = Brevo | Resend (blocked: no DNS control), Mailchimp (250 contacts) | — |
| **D8** | Search | keep self-built index (515/596/563) | Algolia (10k searches/mo — no need), Meilisearch Cloud (no free tier), Typesense (needs a server) | — |
| **D9** | Uptime | UptimeRobot free | Better Stack (10 monitors vs 50; features nicer but fewer monitors) | — |
| **D10** | API auth transport | **Bearer JWT only, never cookies** | cookie sessions — cross-origin `SameSite`/ITP minefield on github.io (§2.2, Better Auth docs) | — |
| **D11** | API rate limiting | try Workers `[[ratelimits]]` binding (free-plan status unconfirmed) → fallback in-memory token bucket per isolate (best-effort) | KV counters (1k writes/day free = too little); Durable Objects (paid) | — |
| **D12** | PostHog anti-adblock proxy (`/ingest`) | **defer to E7** | requires same-origin server → needs a domain | — |
| **D13** | Worker testing | **own vitest 4 + `@cloudflare/vitest-plugin` inside `workers/api/`** | site vitest is 1.6.1 — plugin needs 3.x/4.x; **isolating per package avoids touching the site's vitest** | G1 |
| **D14** | Worker framework | **`hono`** (small, Workers-native) | raw `fetch` router (zero-dep but reinvents routing/middleware); express (too heavy for 10 ms CPU) | G1 |

**Target architecture**

```
                 ┌───────────────────────────────────────────────────────────┐
 Browser ────────▶  GitHub Pages  nuniversity.github.io   (unchanged, static) │
   │              └───────────────────────────────────────────────────────────┘
   │  posthog-js (consent-gated, E1) ──────────────▶ PostHog cloud (US/EU)
   │  fetch (E2) ─────────────────────────────────▶ api.web3forms.com
   │  clerk-js via @clerk/clerk-react (E4) ───────▶ Clerk frontend API ── JWT
   │  fetch + Authorization: Bearer <JWT> (E5) ───▶ nu-api.<sub>.workers.dev
   │                                                  │  hono router, CORS allowlist
   │                                                  │  jose verify (JWKS+azp)
   │                                                  │  ratelimit / in-memory bucket
   │                                                  └─@neondatabase/serverless (HTTP)─▶ Neon Postgres
   │
 UptimeRobot (E1) ──▶ https://nuniversity.github.io{/,/en/,/es/,/pt/} + /v1/health + status page
 GitHub Actions (E0/E3) ──▶ Pages deploy (gated) + wrangler-action Worker deploys (PR previews)
```

---

## 4. Roadmap — epics, sprints, gates

| Epic | Sprint | Title | Est | Depends on | Gate after |
|---|---|---|---|---|---|
| **E0 Foundations & CI** | E0-S1 | CI full-battery gates + Node 22 | M | — | **G0** |
| | E0-S2 | Build-size audit + docs skeleton | S | E0-S1 | — |
| **E1 Observability** | E1-S1 | UptimeRobot + status page | S | G0 | — |
| | E1-S2 | PostHog + consent banner + events | L | G0, **G4** | — |
| **E2 Contact form** | E2-S1 | Web3Forms migration, close SEC-03 | M | G0 | — |
| **E3 Edge API** | E3-S1 | Worker scaffold: health, CORS, tests | M | **G1** | — |
| | E3-S2 | Deploy pipeline, secrets, previews, monitor | M | E3-S1 | — |
| **E4 Identity** | E4-S1 | Clerk spike + provider install | S | E3-S2 | **G2** |
| | E4-S2 | Account UI (sign-in, header, i18n) | M | G2 pass | — |
| | E4-S3 | Worker JWT verification + `requireUser` | M | E4-S1 | — |
| **E5 Data & sync** | E5-S1 | Neon project + schema + migrations | M | G3, E4-S3 | — |
| | E5-S2 | Progress timestamps + merge library | M | E5-S1 | — |
| | E5-S3 | Worker push/pull endpoints + limits | M | E5-S2 | — |
| | E5-S4 | Sync client + UX + 2-device test | L | E5-S3 | — |
| **E6 Hardening & closure** | E6-S1 | Security/quota review + dashboards | M | E5-S4 | — |
| | E6-S2 | Docs sync + closeout + battery proof | S | E6-S1 | final |
| **E7 Backlog** | — | domain, newsletter, R2, images, CMS, backups | — | optional | — |

Legend: S ≤ 0.5 day · M ≈ 1 day · L ≈ 2 days. Sprints are sequential (single owner).

**Gates**

| Gate | Question | Default if unanswered |
|---|---|---|
| **G0** | Battery green with new CI gates, two consecutive runs? | block E1–E5 |
| **G1** | Approve worker deps (`wrangler`, `hono`, `jose`, `@neondatabase/serverless`, `@cloudflare/vitest-plugin` + vitest 4)? | use §12.4 list as approved |
| **G2** | Clerk spike: `getToken()` → Worker verifies (2 h timebox in `.scratch/`)? | fall back to Supabase Auth (client SDK, static-proven) |
| **G3** | Neon (default) vs Cloudflare D1? | Neon |
| **G4** | PostHog host: `us.i.posthog.com` vs `eu.i.posthog.com` (audience/privacy)? | EU host |

---

## 5. Epics & sprints (detailed)

> Task IDs are stable references (`E0-S1-T1`). “Files” lists the exact touch points.

---

### Epic E0 — Foundations & CI

#### E0-S1 — CI full-battery gates + Node 22 (M)

**Goal:** CI enforces exactly what the local battery enforces; Node versions consistent.

| ID | Files | Task |
|---|---|---|
| E0-S1-T1 | `.github/workflows/nextjs.yml:57` | bump `node-version` 20 → **22** (match `engines`) |
| E0-S1-T2 | `.github/workflows/nextjs.yml` | split into two parallel jobs joined before deploy: **gate** job = `npx tsc --noEmit` → `npm run lint` → `npx vitest run` → Python job (T3) → `node scripts/verify_out.mjs` (needs build output → see T4); **build** job = `npm ci` → `prebuild` → `next build` → `postbuild` → `verify_out` → upload `./out` |
| E0-S1-T3 | same workflow, new `python` job | `actions/setup-python@v5` with `python-version: "3.12"`, `cache: "pip"`, `cache-dependency-path: pyproject.toml`; `pip install -e ".[dev]"`; run `.venv`-less: `python -m pytest -q` **and** enforce `--cov` ≥ 80 (match local: `python -m pytest -q --cov-fail-under=80` if configured, else keep parity with local command) |
| E0-S1-T4 | workflow | restructure: `gate` (tsc+lint+vitest+pytest) ∥ `build` (build+verify_out) → `deploy` needs **both**; keep `concurrency: pages`, keep `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` |
| E0-S1-T5 | workflow | cache: `.next/cache` (existing) + npm cache via `setup-node cache: npm`; ensure `npm ci` (lockfile) not `npm install` |
| E0-S1-T6 | `docs/operations/DEPLOYMENT.md` | document the new pipeline stages + required branch protection suggestion |

**Acceptance criteria**
- Two consecutive pushes: gate + build both green, deploy runs only after both.
- Workflow uses Node 22; no `npm install` warnings about engines.
- pytest runs in CI and fails if coverage < 80%.
- Local battery (§10) unchanged-green.

**Risks & troubleshooting**
- *CI slower than before* → parallel jobs keep wall time ≈ max(gate, build) ≈ 6–9 min; if >12 min, add `npm ci` caching & pytest pip cache (T3).
- *pytest needs system deps* → pyyaml/jsonschema pure-python; no system packages expected.
- *verify_out must run after build* → keep it inside the build job (it reads `out/`).

---

#### E0-S2 — Build-size audit + plan skeleton (S)

**Goal:** know where 772 MB comes from; leave a decision note; register this plan.

| ID | Files | Task |
|---|---|---|
| E0-S2-T1 | `.scratch/size-audit.mjs` (scratch) | script: top-20 largest files under `out/`, largest 30 pages by raw HTML bytes, sourcemap count/size, third-party asset attribution (katex/mermaid/3dmol) |
| E0-S2-T2 | `docs/assessment/2026-app-review/PLAN-MODERNIZATION.md` (this file) | add audit findings table + chosen remediations as E7 backlog items (do **not** change build behavior in E0 — risk control) |
| E0-S2-T3 | `docs/INDEX.md`, assessment `README.md` | register this plan in the reading guide |

**Acceptance criteria:** findings table filled (worst offenders + candidate fixes + expected savings); docs linked; battery green.

**Troubleshooting:** if audit shows >1 file > 10 MB → flag immediately (GH Pages soft limits); sourcemaps in prod → candidate `productionBrowserSourceMaps: false` (default) — verify they are not emitted.

---

### Epic E1 — Observability

#### E1-S1 — UptimeRobot + status page (S)

**Goal:** know when the site or API is down, within 5 minutes, for free, commercially-legally.

| ID | Files | Task |
|---|---|---|
| E1-S1-T1 | vendor (external) | create UptimeRobot account (email `thenuniversitybr@gmail.com`); add **4 HTTP monitors**: `https://nuniversity.github.io/`, `/en/`, `/es/`, `/pt/` (**trailing slashes** — site uses `trailingSlash: true`; root monitor keyword-checks `Nuniversity` to catch the redirect page rendering) |
| E1-S1-T2 | vendor | alert contact = owner email, threshold 3–5 retries (avoid flapping); note API key location in §12.1 (rate limit free = 10 req/min) |
| E1-S1-T3 | vendor | create **free status page** (1 allowed, UptimeRobot-branded) selecting the 4 monitors; record public URL |
| E1-S1-T4 | `docs/operations/DEPLOYMENT.md` | add “Monitoring” section: monitors list, status page URL, alert routing |
| E1-S1-T5 | (deferred to E3-S2) | 5th monitor = Worker `/v1/health` |

**Acceptance criteria:** all 4 monitors green for 24 h; status page reachable; docs updated; battery untouched (docs-only).

**Troubleshooting:** root `/` may 302→`/en/` — set monitor to follow redirects (default); false-down from GitHub Pages incidents → rely on keyword check; banner claiming “non-commercial” is stale (ToS May 26, 2026 allows commercial).

---

#### E1-S2 — PostHog analytics + consent + events (L)

**Goal:** product analytics, replays (opt-in), error tracking, feature flags — 1M events/mo free, privacy-respectful, static-export-safe.

**Gate G4 first:** pick host (`eu.i.posthog.com` recommended if audience includes EU students; otherwise `us.i.posthog.com`).

| ID | Files | Task |
|---|---|---|
| E1-S2-T1 | vendor | PostHog account (host per G4); create project; **set billing limit** to 80% of each free quota; copy project API key |
| E1-S2-T2 | `package.json` | add dependency **`posthog-js`** (site dep #1 — approval per §12.4) |
| E1-S2-T3 | `components/providers/PostHogProvider.tsx` (new) | `'use client'`; `posthog.init(NEXT_PUBLIC_POSTHOG_KEY, { api_host, defaults, opt_out_capturing_by_default: true, capture_pageview: false })` **inside `useEffect`** (jsdom/static-export safe); manual `$pageview` on `usePathname()` change with a `pathname` ref to dedupe locale switches; expose `opt_in/opt_out` via context |
| E1-S2-T4 | `components/providers/Providers.tsx` or `app/[lang]/layout.tsx` | mount `PostHogProvider` inside existing `Providers` |
| E1-S2-T5 | `components/providers/ConsentBanner.tsx` (new) + `dictionaries/{en,es,pt}.json` | consent banner shown until decision stored at `v1:consent` (`granted`/`denied`); Accept → `opt_in()` (+ enable replays), Decline → `opt_out()`; three-locale strings `consent.*` (notice, accept, decline, policy-link placeholder) |
| E1-S2-T6 | CI env (`nextjs.yml`) + `docs/getting-started/GETTING-STARTED.md` | inject `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` as **build-time** env from GitHub Actions vars (public by design); document “rotation ⇒ rebuild” |
| E1-S2-T7 | `lib/gamification/bus.ts` subscribers or emit points | capture custom events **without PII or content**: `lesson_complete` `{courseSlug, lessonSlug, lang}`, `quiz_result` `{quizSlug, score, lang}`, `sign_in`/`sign_up` (E4). Keep payload ≤ 5 fields. Verify existing test suite mocks |
| E1-S2-T8 | tests | `vi.mock('posthog-js')` in a shared test setup if E1-S2-T7 events fire in existing tests; new provider smoke test (init called once, no crash when key absent); consent-banner dict parity |
| E1-S2-T9 | `scripts/verify_out.mjs` | new probe: built HTML does **not** contain a hardcoded PostHog key when env absent; consent strings present in all 3 locales’ bundles |
| E1-S2-T10 | `docs/operations/TESTING.md` | record mock strategy for `posthog-js` |

**Acceptance criteria**
- Prod: pageviews appear in PostHog within 1 min; no events before consent Accept; replays only after Accept.
- Decline → zero capture calls (assert via network tab + a unit test).
- Local dev with no env key: provider no-ops (no crash, no console noise).
- Battery green; dict parity 5/5; `verify_out` includes new probes.

**Risks & troubleshooting**
- *No events in prod* → (a) ad blocker/ITP (accept gap — anti-adblock proxy is E7/D12); (b) key not baked → rebuild; (c) consent default-off → expected until Accept.
- *Double pageviews on locale switch* → dedupe with pathname ref (T3).
- *`usePathname` at prerender* → guard `typeof window`.
- *Bundle impact* → lazy-load PostHog only when consent granted (dynamic `import('posthog-js')` inside Accept handler) — preferred implementation, keeps cold bundle clean.
- *Students/minors* → replays off by default; EU host; no form-field capture (PostHog default masks inputs — verify `mask_all_text` defaults stay on).

---

### Epic E2 — Contact form (SEC-03 closure)

#### E2-S1 — Web3Forms migration (M)

**Goal:** working, higher-limit (250/mo), account-backed contact form; close SEC-03/F-015.

| ID | Files | Task |
|---|---|---|
| E2-S1-T1 | probe | submit a test message to Formspree `xandddko` → record liveness (matters for docs, not for the migration decision) |
| E2-S1-T2 | vendor | create Web3Forms account (verify email) → access key (public-safe); set subject prefix `Nuniversity contact`; note in §12.1 |
| E2-S1-T3 | `components/contacts/Contact.tsx` | replace `useForm("xandddko")` + `ValidationError` with plain state machine (`idle/submitting/succeeded/error`) posting `fetch("https://api.web3forms.com/submit", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ access_key, name, email, subject, message, from_name: "Nuniversity", botcheck: "" }) })`; map network/`success:false` → localized error state (new `dict.contact.form.error*` strings ×3) |
| E2-S1-T4 | `Contact.tsx` | add hidden honeypot checkbox `name="botcheck"` (styled `hidden`); keep existing success UI (uses `state.succeeded` → local `status === 'succeeded'`) |
| E2-S1-T5 | `package.json` | **remove `@formspree/react`** (+ lockfile via `npm install`) |
| E2-S1-T6 | tests | update contact tests: drop `vi.mock('@formspree/react')` (see `docs/operations/TESTING.md:174`), mock `global.fetch` (resolve `{success:true}` / reject / `{success:false}`), assert payload contains access key + fields; cover submitting→success and error paths |
| E2-S1-T7 | docs | `GETTING-STARTED.md:219`, `COMPONENTS.md:1111`, `TESTING.md` mock table, `INDEX.md` contact row (“Formspree” → “Web3Forms”), assessment `FIXES.md` → **SEC-03 CLOSED**, `ASSESSMENT-APP.md` note |
| E2-S1-T8 | manual | one real production submission post-deploy → inbox (check spam); confirm dashboard counts |

**Acceptance criteria:** real message received; failure state localized ×3; `@formspree/react` gone from tree; battery green; SEC-03 marked CLOSED with evidence note.

**Risks & troubleshooting**
- *401/429* → wrong access key / 250-mo cap (check Web3Forms dashboard).
- *Lands in spam* → enable Web3Forms’ free shared hCaptcha sitekey `50b2fe65-b00b-4b9e-ad62-3ba471098be2` (T4 upgrade path).
- *CORS* → Web3Forms allows browser POST by design (JSON), no proxy needed.
- *Rollback* → keep old Formspree call in git history; migration is one file.

---

### Epic E3 — Edge API foundation

**Gate G1:** approve worker deps: `wrangler` (dev), `hono`, `@cloudflare/vitest-plugin` + `vitest@^4` (dev), `jose`, `@neondatabase/serverless` (arrives in E5 but install together then).

#### E3-S1 — Worker scaffold: health, CORS, tests (M)

| ID | Files | Task |
|---|---|---|
| E3-S1-T1 | `workers/api/package.json`, `tsconfig.json`, `wrangler.jsonc` (new) | independent package (own `package.json` — **site package.json untouched**): `name: "nu-api"`, `main: src/index.ts`, `compatibility_date`, `workers_dev: true`, `vars: { ALLOWED_ORIGINS: "https://nuniversity.github.io,http://localhost:3000", API_VERSION: "v1" }` |
| E3-S1-T2 | `workers/api/src/index.ts` | Hono app: `GET /v1/health` → `{ ok:true, version, ts }` (`Cache-Control: no-store`); global `onError` → JSON `{error:"internal"}` (no stack leaks); 404 JSON |
| E3-S1-T3 | `workers/api/src/middleware/cors.ts` | exact-origin allowlist (split `ALLOWED_ORIGINS`), `Vary: Origin`, `OPTIONS` → 204 with `Access-Control-Allow-Origin` (echo, not `*`), `Allow-Methods: GET,POST,OPTIONS`, `Allow-Headers: Content-Type,Authorization`, `Max-Age: 86400`; disallowed origin → no ACAO header (browser blocks) |
| E3-S1-T4 | `workers/api/src/middleware/ratelimit.ts` | D11: attempt `[[ratelimits]]` binding in `wrangler.jsonc` (`limit: 60, period: 60` keyed by IP via `cf.client.ip`); if binding rejected on free plan → in-memory token bucket per isolate keyed by IP (20 req/min, best-effort) behind one function so swapping is trivial |
| E3-S1-T5 | `workers/api/vitest.config.ts` + `test/` | own vitest 4 + `cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })`; tests: health 200 shape, CORS preflight allowed-origin echo / disallowed-origin absent, 404 shape, rate limiter trips |
| E3-S1-T6 | `.gitignore` | add `workers/api/.dev.vars`, `workers/api/.wrangler/` |
| E3-S1-T7 | `workers/api/README.md` | local dev (`npm run dev` → wrangler dev), test, deploy commands |

**Acceptance criteria:** `npm test` in `workers/api/` green locally; `wrangler dev` serves health; site battery untouched (site tree changes = `.gitignore` only).

**Troubleshooting:** vitest plugin version mismatch → pin `vitest@^4` per official plugin docs; `wrangler.jsonc` path wrong in plugin config → tests silently skip bindings (assert env present in a test); free-plan ratelimit binding unsupported → fall back (T4).

---

#### E3-S2 — Deploy pipeline + secrets + previews + monitor (M)

| ID | Files | Task |
|---|---|---|
| E3-S2-T1 | GitHub repo settings | create **scoped** Cloudflare API token: `Account → Workers Scripts: Edit` (+ `Workers KV: Edit` if binding used); store `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` as Actions secrets (§12.2) |
| E3-S2-T2 | `.github/workflows/worker.yml` (new) | `on: push (main, paths: workers/**), pull_request (paths: workers/**), workflow_dispatch`; PR → preview deploy, main → production; use `cloudflare/wrangler-action@v4` with `wranglerVersion` ≥ **4.136.3** (previews requirement), `gitHubToken` for deployment records; `permissions: contents: read, deployments: write` |
| E3-S2-T3 | workflow | job steps: checkout → `npm ci` (in `workers/api`) → `npm test` → deploy; deploy **blocked if tests fail** |
| E3-S2-T4 | UptimeRobot (E1-S1 follow-up) | add 5th monitor `https://nu-api.<sub>.workers.dev/v1/health` (keyword `\"ok\":true`) |
| E3-S2-T5 | `docs/operations/DEPLOYMENT.md` | Worker section: secrets, preview URLs, rollback (`wrangler rollback`), daily-cap monitoring (Error 1027) |
| E3-S2-T6 | smoke | curl health from prod origin; curl with `-H "Origin: https://evil.example"` → no ACAO; `-H "Origin: https://nuniversity.github.io"` → ACAO present |

**Acceptance criteria:** PR shows preview deployment URL in checks; main deploy green; both CORS smoke cases pass; monitor green.

**Troubleshooting:** token too broad/narrow → error 10000 (recreate with exact permissions); preview requires Wrangler ≥4.136.3 (see official action README); **never** put `DATABASE_URL`/`CLERK_*` in workflow env — use `wrangler secret put` (E5) or `wrangler-action` `secrets:` input bound to Actions secrets.

---

### Epic E4 — Identity (Clerk)

**Gate G2 (spike, 2 h, `.scratch/clerk-spike/`):** create Clerk dev instance → load `clerk-js` via CDN in a static HTML opened from `npx serve out` → `await Clerk.session.getToken()` → POST to deployed Worker with `Authorization: Bearer` → Worker decodes with JWKS (`https://api.clerk.com/v1/jwks`, RS256) and logs claims → verify `azp`, `iss`, `sub`. **Pass criteria:** token issued for localhost + accepted by signature verify. Fail → fallback = Supabase Auth (documented switch: same Bearer pattern, JWKS via Supabase JWT secret).

#### E4-S1 — Clerk account + provider (S)

| ID | Files | Task |
|---|---|---|
| E4-S1-T1 | vendor | Clerk dashboard: create app (development + production instances); **allowed origins/redirect URLs**: `https://nuniversity.github.io`, `http://localhost:3000`; enable email + Google/GitHub social (≤3 free) |
| E4-S1-T2 | `package.json` | add **`@clerk/clerk-react`** (site dep #2, §12.4) |
| E4-S1-T3 | `components/providers/AuthProvider.tsx` (new) | `'use client'` `<ClerkProvider publishableKey={NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>` wrapper; **no** `@clerk/nextjs`, **no** `clerkMiddleware` (static export); guard: provider no-ops when key absent (tests/dev without key) |
| E4-S1-T4 | `components/providers/Providers.tsx` / `app/[lang]/layout.tsx` | mount AuthProvider (outermost) |
| E4-S1-T5 | CI env + docs | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` build-time env; `CLERK_SECRET_KEY` **never in site** (Worker only uses public JWKS — secret key not needed for verification) |

**Acceptance criteria:** signed-out site identical to before (byte-level route diff empty apart from provider script); battery green with key absent in tests.

#### E4-S2 — Account UI + i18n (M)

| ID | Files | Task |
|---|---|---|
| E4-S2-T1 | `app/[lang]/account/page.tsx` (new) | static route rendering `<SignIn>` / `<SignedIn>` profile card (user email, sign-out) client-side; consistent layout with existing pages (container, i18n `dict` props pattern like other pages) |
| E4-S2-T2 | header component (`components/layout/`) | signed-out: “Sign in” button → `/account/`; signed-in: avatar/menu (initials) + sign-out; mobile menu parity (768–1100px known-fragile zone — retest that breakpoint) |
| E4-S2-T3 | `dictionaries/{en,es,pt}.json` | `account.*` + header strings ×3 locales (sign in/out, welcome, profile, sync-coming-soon note) |
| E4-S2-T4 | tests | header renders both states (mock Clerk context), account page smoke, dict parity, `verify_out` probe: `/en/account/`, `/es/account/`, `/pt/account/` exist in `out/` |
| E4-S2-T5 | events | fire PostHog `sign_in`/`sign_up` on Clerk `setActive` callbacks (E1-S2-T7 pattern) |

**Acceptance criteria:** sign-up + sign-in + sign-out flows work on localhost and prod for all 3 locales; no CLS regression in header at 768–1100 px; battery green.

**Troubleshooting:** Clerk script blocked by ad blockers → catch `window.Clerk` undefined, render static “Sign in” that retries once on click (graceful local-only mode); redirect after sign-in must stay on current locale path (configure Clerk `signInFallbackRedirectUrl` per locale or use `router.push` after session active).

#### E4-S3 — Worker JWT verification + `requireUser` (M)

| ID | Files | Task |
|---|---|---|
| E4-S3-T1 | `workers/api/package.json` | add **`jose`** |
| E4-S3-T2 | `workers/api/src/middleware/auth.ts` | module-scope `createRemoteJWKSet(new URL(env.CLERK_JWKS_URL))` (default `https://api.clerk.com/v1/jwks`); `jwtVerify(token, jwks, { algorithms:["RS256"], clockTolerance:5, issuer: env.CLERK_ISSUER })`; **`azp` claim must equal** `env.CLERK_ALLOWED_AZP` (the `pk_live_…` publishable key) → else 403; export `requireUser(req, env) → { sub, azp } \| Response` |
| E4-S3-T3 | `workers/api/src/index.ts` | add `GET /v1/me` behind `requireUser` returning `{ userId }` (proof endpoint for spike + tests) |
| E4-S3-T4 | secrets | `wrangler secret put CLERK_JWKS_URL`, `CLERK_ISSUER`, `CLERK_ALLOWED_AZP` (or plain `vars` for non-secrets — JWKS URL & issuer are public; only mark secret what must be) |
| E4-S3-T5 | tests | unit: valid token (mocked JWKS via plugin’s request mocking), expired token (401), wrong issuer (403), wrong `azp` (403), missing header (401) |

**Acceptance criteria:** 5 auth test cases green; real token from E4-S1 app passes against prod Worker; battery green.

**Troubleshooting:** JWKS network call eats 10 ms CPU budget → module-scope cache + `jose` fetch is outside CPU-time only when cold (network time ≠ CPU time on Workers — but keep JWKS cached anyway); `issuer` mismatch (clerk.<domain> vs frontend API host) → log full claims during spike and pin exact value; clock skew → `clockTolerance: 5`.

---

### Epic E5 — Data & cross-device progress sync

**Gate G3:** confirm Neon (default) vs D1. Sections below assume Neon; D1 swap notes inline.

#### E5-S1 — Neon project + schema + migrations (M)

| ID | Files | Task |
|---|---|---|
| E5-S1-T1 | vendor | Neon account → project `nuniversity`, free tier; region near audience; disable unnecessary features; record connection string (§12.2 as secret); note scale-to-zero setting (free default: off/on — verify) |
| E5-S1-T2 | `workers/api/migrations/0001_init.sql` | `CREATE TABLE user_progress (user_id TEXT NOT NULL, key TEXT NOT NULL, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL, PRIMARY KEY (user_id, key)); CREATE INDEX idx_user_progress_updated ON user_progress (user_id, updated_at); CREATE TABLE attempts (id UUID PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, payload JSONB NOT NULL, ts TIMESTAMPTZ NOT NULL); CREATE INDEX idx_attempts_user ON attempts (user_id, ts);` |
| E5-S1-T3 | `workers/api/scripts/migrate.mjs` (or wrangler d1-style runner) | applies `migrations/*.sql` via `@neondatabase/serverless` `neon()` HTTP driver using `DATABASE_URL`; idempotent (track applied in `schema_migrations` table) |
| E5-S1-T4 | Worker secret | `wrangler secret put DATABASE_URL` |
| E5-S1-T5 | tests | migration runner dry-run against Neon **branch** (free branches = safe sandbox) |
| E5-S1-T6 | D1 fallback note | if G3 = D1: `wrangler d1 migrations apply` + `migrations/*.sql` unchanged |

**Acceptance criteria:** tables exist on Neon dev branch; runner idempotent (runs twice cleanly); secret set; battery green.

**Troubleshooting:** HTTP driver needs **no** `neonConfig` for Neon (`host => https://host/sql` default); pool/WebSocket modes unsuitable in Workers (sockets must not outlive request) → always use `neon()` tagged-template (single roundtrip) or `transaction()` batch; connection string pooler variants (`-pooler` host) irrelevant for HTTP driver but keep the URL the dashboard suggests.

#### E5-S2 — Progress timestamps + merge library (M)

**Design (data contract):**
- Scalar/record progress lives under keys `v1:course-progress-<slug>`, `v1:last-visited`, gamification keys → **LWW per key** by client wall-clock `updatedAt` (sidecar map).
- Quiz/attempt-like records (if synced) → append-only with client `crypto.randomUUID()` ids → **set-union**.
- Conflict policy: per-key last-write-wins; union by id for lists; server never deletes (deletes = tombstones with ts, optional; v1: no deletes of progress).

| ID | Files | Task |
|---|---|---|
| E5-S2-T1 | `lib/progress/storage.ts` | extend `safeSet()` (single write path, `storage.ts:37`) + `safeRemove()` to also maintain sidecar `v1:meta:timestamps` = `{ [key]: updatedAtMs }` (write-on-write; tolerate missing → `0`); do **not** change existing value shapes |
| E5-S2-T2 | `lib/sync/merge.ts` (new) | pure functions: `mergeProgress(local, remote, now) → { merged, winners }` (LWW per key, ties → remote), `mergeAttempts(a, b)` (union by id), `toSyncPayload(entries)` / `fromSyncPayload()` (≤ 64 KB guard, reject oversized with typed error) |
| E5-S2-T3 | `lib/sync/merge.test.ts` (new) | exhaustive unit matrix: local-newer, remote-newer, tie, missing sidecar (ts=0 adopts remote), clock skew (remote 10 min ahead clamps to `now` — reject future ts > 5 min), partial batches, corrupt JSON quarantine, 64 KB cap |
| E5-S2-T4 | `lib/sync/keys.ts` (new) | which localStorage keys sync (allowlist: `v1:course-progress-*`, `v1:last-visited`, gamification keys — enumerate from `lib/gamification/profile.ts` + `storage.ts`); denylist: consent, UI prefs (theme), flags |
| E5-S2-T5 | tests | integration: seed localStorage → payload → merge → storage round-trip; ES5-safe (`Array.from`, no spreads) |

**Acceptance criteria:** merge matrix green; no writes occur during merge dry-runs (spy on `safeSet`); battery green; dict untouched.

**Troubleshooting:** future timestamps (device clock skew) → clamp/reject (T3); JSON corruption → quarantine to `v1:corrupt:<key>` and continue; sidecar growth → one object ≤ few KB (keys count ~40) — fine for localStorage.

#### E5-S3 — Worker push/pull endpoints + limits (M)

| ID | Files | Task |
|---|---|---|
| E5-S3-T1 | `workers/api/src/index.ts` | `POST /v1/progress/push` (Bearer): body `{ entries: [{key, value, updatedAt}] }` ≤ 64 KB, ≤ 200 entries → per-entry `INSERT … ON CONFLICT (user_id,key) DO UPDATE SET value=EXCLUDED.value, updated_at=EXCLUDED.updated_at WHERE EXCLUDED.updated_at > user_progress.updated_at` (returns per-key `applied:boolean`); `GET /v1/progress/pull?since=<ms>` → entries with `updated_at > since`; `POST /v1/attempts` (union insert `ON CONFLICT (id) DO NOTHING`); `GET /v1/attempts?since=` |
| E5-S3-T2 | `workers/api/src/db.ts` | `neon(env.DATABASE_URL)` helper; **all queries parameterized**; per-request single roundtrip where possible (`transaction()` batch for push); typed `sql` errors → 500 generic |
| E5-S3-T3 | limits | payload 64 KB / 200 entries enforced **before** SQL; rate limit reuse (E3-S1-T4) with tighter bucket for `POST` (20/min/IP); CPU check: JSON parse + upsert batch must stay ≪10 ms — benchmark in `wrangler dev` |
| E5-S3-T4 | tests | mocked-DB unit tests for handlers (plugin request mocking) + contract tests: shape validation 400s, LWW conditional update logic (assert SQL WHERE semantics via a local Postgres if available, else logic-tested with a fake `sql` stub), auth 401/403 paths |
| E5-S3-T5 | quota | add Worker health monitor note: Neon usage dashboard alert at 80% of 1 GB / 100 CU-hrs |

**Acceptance criteria:** contract tests green; manual curl (Bearer token) push→pull round-trip on prod returns applied entries; oversized payload → 400; battery green.

**Troubleshooting:** `Error 1027` = daily 100k cap (upgrade or shed load — sync is debounced client-side so unlikely); Neon cold start ~0.5 s → client timeout budget 10 s + retry-once; JSONB size → enforce 64 KB early; injection → only parameterized queries (`neon` template tags).

#### E5-S4 — Sync client + UX + 2-device verification (L)

| ID | Files | Task |
|---|---|---|
| E5-S4-T1 | `lib/sync/client.ts` (new) | `pushPending()`, `pullAndMerge()`: debounce **30 s** after mutations (hook into `lib/gamification/bus.ts` + `storage.ts` write hook), flush on `visibilitychange`→hidden & `pagehide` via `fetch(..., { keepalive: true })`; exponential backoff (1 s→60 s), max 3 tries; offline-safe queue in memory (persist queue in `v1:sync:queue`) |
| E5-S4-T2 | `lib/sync/useSync.ts` + `components/providers/SyncProvider.tsx` (new) | React context: `status: 'off'|'idle'|'syncing'|'error'|'offline'`, `lastSyncedAt`; only active when Clerk session exists; token via `useAuth().getToken()` **immediately before each flush** (60 s session-token lifetime) |
| E5-S4-T3 | sign-in flow | on first sign-in: show one-time notice “Back up your progress?” → `pullAndMerge()` then `pushPending()`; write `v1:sync:onboarded` |
| E5-S4-T4 | UI | header/profile: sync status dot + `lastSynced` (relative time, ×3 locales); error state retries silently, never blocks lessons/quizzes |
| E5-S4-T5 | tests | client tests with mocked fetch + fake timers (debounce, backoff, keepalive flag), merge already covered; component test for status states; dict parity |
| E5-S4-T6 | **manual E2E matrix** | device A signed-in completes lessons → sign-in device B (different browser) → progress appears ≤ 30 s; device A offline edits → reconnect → pushes; both edit same key → LWW winner = later ts (document actual result in `docs/assessment/.../PLAN-MODERNIZATION.md` “Evidence” footer) |
| E5-S4-T7 | `verify_out` | probe `/en/account/` + consent strings still present; no sync endpoints hardcoded into static HTML without env (client must read `NEXT_PUBLIC_API_BASE` — new build-time env var, documented) |

**Acceptance criteria:** E2E matrix passes and is recorded; battery green; signed-out behavior byte-identical (no provider calls without session); no unhandled promise rejections in console during offline test.

**Risks & troubleshooting**
- *getToken() null* → wait for `Clerk.loaded`, retry once; if still null → skip flush (schedule retry), never error UI.
- *Two tabs same device* → both flush; LWW by ts makes it convergent; listen to `storage` events to avoid ping-pong (optional).
- *Data loss fear* → pull-merge-push is additive; first-ever sync takes union; add “Export my data” (JSON download) as E7 nicety.
- *Replay privacy* → ensure PostHog replays (if consented) don’t capture account page inputs (masking default on — verify).

---

### Epic E6 — Hardening, dashboards, closure

#### E6-S1 — Security & quota review + dashboards (M)

| ID | Task |
|---|---|
| E6-S1-T1 | **Security pass** (checklist §9 executed & recorded): CORS origins exact; `azp`+issuer enforced; payload caps; secrets only in wrangler/Actions secrets (grep repo for `sk_`, `pk_live`, `DATABASE_URL` → zero hits); `npm audit --omit=dev` clean or documented; Worker error handler leaks nothing; rate limiter active |
| E6-S1-T2 | **Quota ledger** (§6) filled with live values + alert thresholds set (PostHog billing limit 80%, Neon usage alert, GH Actions minutes dashboard note); calendar reminder (monthly quota review) noted in DEPLOYMENT.md |
| E6-S1-T3 | **PostHog dashboards**: insight board “Platform health” (pageviews by locale, top courses, `lesson_complete` funnel, JS exceptions, replay count); “Sync health” (custom event `sync_success/failure` if E5-S4 emits them) |
| E6-S1-T4 | **Status page** updated to include API monitor; link it from `/{lang}/about` footer? (optional dict ×3 — decide: skip to avoid scope creep unless trivial) |
| E6-S1-T5 | Performance sanity: Lighthouse spot-check homepage + one lesson (perf ≥ previous baseline ±5); document any PostHog/Clerk script cost |

#### E6-S2 — Docs sync + closeout + evidence (S)

| ID | Task |
|---|---|
| E6-S2-T1 | docs updates (all in repo): `GETTING-STARTED.md` (env vars table: `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_BASE` + rotation note), `TESTING.md` (new mocks: posthog-js, fetch/Web3Forms, Clerk context, worker vitest package section), `COMPONENTS.md` (ConsentBanner, AuthProvider, SyncProvider, account page), `DEPLOYMENT.md` (pipeline + monitoring + worker), `docs/INDEX.md` (new rows), assessment `README.md` (reading-guide row 8 → this file), `FIXES.md` (SEC-03 closed; any new F-items found), `IMPROVEMENTS.md` (modernization items marked), `.opencode/memory/MEMORY.md` (one-line: modernization plan executed E0–E6) |
| E6-S2-T2 | this file: append **Evidence footer** — CI run URLs, monitor URLs, PostHog project note, E2E matrix results, final battery numbers |
| E6-S2-T3 | final full battery + 2 consecutive green CI runs; user commits (“up”) |

---

### Epic E7 — Backlog (explicitly out of scope; pick later)

| Item | Trigger | Notes (researched) |
|---|---|---|
| Custom domain (~$10/yr) | wanting same-origin everything | unlocks: CF Pages production, `/ingest` PostHog proxy, same-origin auth proxy (reopens Neon Auth), `_headers` security headers (GH Pages cannot set headers), **Resend** real transactional email |
| Newsletter | audience demand | Brevo free 300/day, verify plain mailbox as sender (no DNS) |
| R2 media storage | self-hosted assets | 10 GB, free egress; B2 alternative has 3× egress |
| Image CDN for library thumbnails | dead thumbnails (51/59 from assessment) | Cloudinary 25 credits/mo (fetch-mode proxy of remote URLs); ImageKit 20 GB free |
| Automated DB backup | >first real users | Neon branches (10 free) + weekly branch; or Worker cron → R2 dump (cron triggers free) |
| Newsletter+CMS | multi-author | Sveltia (MIT, GH Pages-compatible) / Keystatic |
| Size remediation | audit from E0-S2 | trim course-page payloads, sourcemap check, per-locale code-splitting review |
| Data export UI | user request | JSON download of progress (from merge lib) |
| Rate limiting upgrade | abuse | confirm `[[ratelimits]]` free status; else KV/HO in-memory stays |
| Umami as privacy-first fallback | if PostHog rejected by policy | 100k events/mo, 1 site |

---

## 6. Free-tier quota ledger (alert at 80%)

| Service | Quota | Usage drivers | Alert mechanism |
|---|---|---|---|
| Workers | 100k req/day, 10 ms CPU | sync push/pull (debounced), `/v1/health`, `/me` | CF dashboard (manual monthly); Error 1027 = breach |
| Neon | 1 GB storage, 100 CU-hrs/mo | `user_progress` (≤ few MB), `attempts` | Neon usage email alerts (enable) |
| Clerk | 50k MAU/mo | sign-ins | Clerk dashboard usage tab |
| PostHog | 1M events, 5k replays, 1M flags, 100k exceptions | pageviews (~per session), custom events, exceptions | **billing limit hard-cap at 80%** |
| Web3Forms | 250 submissions/mo | contact form | dashboard count (low volume expected) |
| UptimeRobot | 50 monitors, 10 API req/min | 5 monitors used | n/a |
| GH Actions | unlimited (public) / 2k min (private) | ~2 runs/push × ~8 min | billing/usage page if private |
| GH Pages | 1 GB repo soft, 100 GB/mo soft | 772 MB out/ (artifact, not repo) | size audit (E0-S2) |

---

## 7. Security & privacy checklist (execute at E6-S1, verify at each epic)

**Security**
- [ ] No secret in repo: `grep -rE "sk_live|sk_test|DATABASE_URL|api_key\s*=\s*\"[a-z0-9]" --include="*.{ts,tsx,js,json,mjs}"` → 0 hits (access keys for Web3Forms/PostHog are public-by-design; Clerk *secret* key never enters the site).
- [ ] CORS: exact origin strings; `Vary: Origin`; no `*` on credentialed endpoints.
- [ ] Auth: RS256-only, issuer + `azp` checks, 401 vs 403 semantics documented, JWKS cached.
- [ ] Input: 64 KB / 200-entry caps; parameterized SQL only; JSON parse failures → 400.
- [ ] Rate limiting active (binding or in-memory); tighter bucket on POST.
- [ ] Worker logs: no PII (user ids OK, emails/tokens never logged).
- [ ] Dependencies: `npm audit` site + worker; pin action versions to SHAs if policy tightens later.
- [ ] Ad blockers/CSP: no inline secrets; all `NEXT_PUBLIC_*` public by design.

**Privacy (education context)**
- [ ] Consent banner before any capture (default `opt_out_capturing_by_default: true`).
- [ ] Replays only after explicit Accept; input masking on; `account` page excluded from replay if mask settings leak.
- [ ] Host choice recorded (G4: EU default); retention defaults documented.
- [ ] Custom events: no names, emails, free text, or payment data — slug/numeric only.
- [ ] Sign-in identity: Clerk is the processor; document in future privacy page (E7 if needed).

---

## 8. Troubleshooting playbook (by service)

| Symptom | Service | Likely cause | Fix |
|---|---|---|---|
| No pageviews | PostHog | consent default-off; ad blocker; key not baked (rebuild); init at module scope (SSR crash) | Accept flow; document blocked-user gap; rebuild; init in `useEffect` |
| Duplicate pageviews | PostHog | locale switch fires twice | pathname ref dedupe |
| Replays missing | PostHog | not consented / quota 5k hit | Accept; check quota ledger |
| Form 401/429/0 | Web3Forms | wrong key; 250 cap; spam folder; JS blocked | dashboard; hCaptcha path; check inbox spam |
| CORS failure from prod | Worker | origin string mismatch (trailing slash/www); OPTIONS missing `Allow-Headers: Authorization` | exact allowlist + preflight test (E3-S2-T6) |
| 401 vs 403 on API | Worker | 401 = missing/expired/bad-sig token; 403 = wrong `azp`/issuer | read claim logs during spike; pin issuer |
| `getToken()` null | Clerk | Clerk JS blocked; session not loaded; provider mounted after flush | retry on `Clerk.loaded`; graceful skip |
| Sync never fires | sync client | no session; debounce never flushed; `keepalive` fetch rejected | flush on visibilitychange; manual retry backoff |
| Pull slow first time | Neon | scale-to-zero cold start (~0.5 s) | expected; spinner + 10 s timeout |
| Error 1027 | Workers | daily 100k cap | inspect CF dashboard; reduce poll frequency (already debounced) |
| CI engines warning | GH Actions | node ≠ 22 | E0-S1-T1 |
| CI red on dict parity | i18n | new string missing in es/pt | atomic ×3 edit |
| Vitest `act` warnings | site tests | async state update outside act | wrap in `act(...)` (Phase-6 convention) |
| Plugin vitest conflict | worker tests | plugin needs vitest 3/4, site is 1.6.1 | keep packages isolated (D13) |
| Preview deploy fails | wrangler-action | Wrangler < 4.136.3 | pin `wranglerVersion` |
| Stale “non-commercial” banner | UptimeRobot | banner lags ToS (May 26, 2026 allows commercial) | ignore; cite ToS in docs |

---

## 9. Risk register

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R1 | Vendor TOS/tier change (UptimeRobot flipped once in 2024→2026) | M | M | multi-vendor shortlist in §3; monthly quota/TOS review (E6-S1-T2); exit costs low (all data exportable) |
| R2 | Clerk pricing shift for free/ad-supported apps (their own FAQ warns) | M | H | G2 fallback = Supabase Auth path documented; auth is late (E4) so switching cost is one spike + provider swap |
| R3 | Merge bug corrupts user progress | L | H | LWW pure-lib + tests; pull-merge is additive; sidecar timestamps; quarantine corrupt values; E5-S4-T6 matrix |
| R4 | 10 ms CPU budget blown (JSON/JWT/SQL) | M | M | module-scope JWKS; batch SQL; benchmark in `wrangler dev` (E5-S3-T3); payload caps |
| R5 | CI wall-time / minutes creep (private-repo case) | M | M | parallel jobs, pip+next caches (E0-S1) |
| R6 | 772 MB artifact → GH Pages soft-limit | M | M | E0-S2 audit first; remediation in E7; no repo bloat (`out/` gitignored) |
| R7 | Ad blockers skew analytics | H | L | accept + document; `/ingest` proxy deferred to E7 (needs domain) |
| R8 | Cross-origin cookie traps | L | H | **architected out** (D10: Bearer-only) |
| R9 | Free-tier quota exhaustion mid-launch | L | M | 80% alerts everywhere (§6); sync debounced caps request volume (~2/user/day) |
| R10 | Scope creep into content/feature work | M | M | E7 parking lot; sprints have hard AC lists; battery before each merge |
| R11 | Static-export incompatibility (someone adds API route/middleware) | M | H | §0.8 rule; `verify_out` route probes; review note in CONTRIBUTING |

---

## 10. Definition of Done

**Global battery (every sprint, local):**
```bash
npx tsc --noEmit
npm run lint
npx vitest run
.venv/bin/python -m pytest -q
npm run build
node scripts/verify_out.mjs
bash .scratch/ci_sim.sh
```

**Per-sprint DoD:** AC list checked · dict parity 5/5 (if strings touched) · battery green ·
no new deps beyond §12.4 approved list · docs touched in the same change · user commits.

**Program done (end of E6-S2):**
- [ ] CI = battery gates, 2 consecutive green runs on `main`
- [ ] 4 site monitors + 1 API monitor green; status page live
- [ ] PostHog receiving consented events from all 3 locales; billing limits set
- [ ] Real contact-form message delivered; `@formspree/react` removed; SEC-03 CLOSED
- [ ] Worker deployed via CI with PR previews; auth endpoints enforce JWT+`azp`
- [ ] Sign-up/sign-in/out works ×3 locales; header verified at 768–1100 px
- [ ] Progress sync passes 2-device matrix (recorded in Evidence footer)
- [ ] §6 ledger live with alerts; §7 checklist all checked
- [ ] Docs: GETTING-STARTED/TESTING/COMPONENTS/DEPLOYMENT/INDEX/README/FIXES/MEMORY synced
- [ ] Evidence footer appended to this file

---

## 11. Open decisions (defaults active until changed)

1. **G1 deps** — approve `wrangler`, `hono`, `jose`, `@neondatabase/serverless`, `@cloudflare/vitest-plugin`+`vitest@4` (worker pkg) and site deps `posthog-js`, `@clerk/clerk-react`. *(No Web3Forms SDK — plain fetch.)*
2. **G2** Clerk vs Supabase Auth fallback — spike decides; default Clerk.
3. **G3** Neon (default) vs D1.
4. **G4** PostHog host — default `eu.i.posthog.com`.
5. **E1-S2-T7** custom event set — default `lesson_complete`, `quiz_result`, `sign_in`, `sign_up`, `sync_success`, `sync_failure` (slugs/numbers only).
6. **Scope guard:** do we add a sync-status UI to mobile header too? Default: yes, but compact dot only.

---

## 12. Appendices

### 12.1 Vendor account inventory (create during sprints; store credentials in password manager, **never in repo**)

| Vendor | Created at | Email | Key/ID stored | Used by |
|---|---|---|---|---|
| UptimeRobot | E1-S1 | thenuniversitybr@gmail.com | main API key (10 req/min) | monitors, status page |
| PostHog | E1-S2 | same | project API key (public), host | site (build env) |
| Web3Forms | E2-S1 | same | access key (public-safe) | `Contact.tsx` (build env or const) |
| Cloudflare | E3-S2 | same | Account ID; API token → Actions secrets | Worker deploys |
| Clerk | E4-S1 | same | publishable key (build env); instance (secret key **not needed**) | site + Worker azp pinning |
| Neon | E5-S1 | same | `DATABASE_URL` → `wrangler secret` | Worker |

### 12.2 Secrets & env vars

| Name | Where | Scope | Rotating |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | GitHub Actions secret | Workers Scripts: Edit (account-scoped) | CF dashboard |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Actions secret | — | static |
| `DATABASE_URL` | `wrangler secret put` | Worker only | Neon dashboard |
| `CLERK_JWKS_URL`, `CLERK_ISSUER`, `CLERK_ALLOWED_AZP` | wrangler vars/secrets | Worker (public values — vars OK) | Clerk dashboard |
| `NEXT_PUBLIC_POSTHOG_KEY/_HOST` | Actions env (build) | site (public by design) | rebuild |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Actions env (build) | site (public) | rebuild |
| `NEXT_PUBLIC_API_BASE` | Actions env (build) | site → `https://nu-api.<sub>.workers.dev` | rebuild |

### 12.3 Commands

```bash
# site battery
npx tsc --noEmit && npm run lint && npx vitest run
.venv/bin/python -m pytest -q
npm run build && node scripts/verify_out.mjs
bash .scratch/ci_sim.sh

# worker (from workers/api/)
npm install
npm run dev              # wrangler dev
npm test                 # vitest 4 + cloudflare plugin
npx wrangler secret put DATABASE_URL
npx wrangler rollback    # deploy history rollback

# migration runner
node scripts/migrate.mjs  # from workers/api, needs DATABASE_URL
```

### 12.4 New dependencies requiring approval (G1)

| Package | Where | Why | Alternative rejected |
|---|---|---|---|
| `posthog-js` | site | analytics/flags/errors | none viable (Plausible no free tier) |
| `@clerk/clerk-react` | site | accounts (client-only, static-safe) | Supabase Auth (fallback), clerk-js script (worse DX than React pkg) |
| `hono` | worker | router/middleware for 10 ms CPU | raw fetch router (reinventing) |
| `jose` | worker | RS256 JWKS verify (Web Crypto native) | hand-rolled crypto (no) |
| `@neondatabase/serverless` | worker | HTTP Postgres driver | Hyperdrive+pg (more moving parts; E7 option) |
| `wrangler` (dev) | worker | local dev/deploy CLI | — |
| `@cloudflare/vitest-plugin` + `vitest@^4` (dev) | worker | tests in Workers runtime | testing via fetch-only (loses bindings) |

Site-side **forbidden additions** without re-plan: `@posthog/next` (needs proxy/middleware), `@clerk/nextjs` (needs middleware), `@formspree/*` (being removed).

### 12.5 i18n string surface (all ×3 locales: en/es/pt)

| Namespace | Keys (planned) | Sprint |
|---|---|---|
| `consent.*` | notice, accept, decline, learnMore | E1-S2 |
| `contact.form.error*` | submitFailed, retry | E2-S1 |
| `account.*` | signIn, signOut, welcome, profileTitle, guestNote | E4-S2 |
| `sync.*` | statusOn, statusIdle, statusError, lastSynced, backupNotice, backupConfirm | E5-S4 |

### 12.6 Verification probes added (`scripts/verify_out.mjs`)

| Probe | Sprint |
|---|---|
| no hardcoded PostHog key in HTML when env absent; consent strings in 3 locales | E1-S2 |
| `/en/account/`, `/es/account/`, `/pt/account/` exist | E4-S2 |
| contact page contains Web3Forms endpoint, no `formspree` string | E2-S1 |
| `NEXT_PUBLIC_API_BASE` referenced only via baked env (no localhost strings in prod HTML) | E5-S4 |

---

*End of plan. Evidence footer is appended at E6-S2 closeout.*
