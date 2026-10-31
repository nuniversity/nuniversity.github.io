# M2 Decision Records (ADR format)

> Status key: ACCEPTED (chosen, binding for M2) · DEFERRED (decided-not-to-decide) · SUPERSEDES.
> Numbered DR-01…DR-10. Cross-referenced from [02-TARGET-ARCHITECTURE.md](./02-TARGET-ARCHITECTURE.md)
> and [05-IMPLEMENTATION-PLAN.md](./05-IMPLEMENTATION-PLAN.md).

---

## DR-01 — Identity: Supabase Auth used as IdP only

- **Status:** ACCEPTED (2026-10-31) · **Deciders:** platform owner + agent review
- **Context.** M2 needs accounts and cross-device sync at $0. Constraints: no credit card; the
  IdP must support email (magic link) + at least one OAuth provider; M3 may re-bind to AWS/GCP
  (Cognito/Firebase); user data must not live inside the IdP product (keeps exit cheap).
- **Options considered (verified 2026-10):**

| Option | Free entitlement | Pros | Cons | Verdict |
|---|---|---|---|---|
| **Supabase Auth (IdP only)** | 50k MAU, email + OAuth + basic MFA, JWT/JWKS | best capacity; MFA included; sessions verifiable from CF Worker; zero coupling of data | 2-free-projects account rule; idle-pause (mitigated by auth traffic); no custom-domain auth page on free | **ACCEPTED** |
| Clerk | 50k monthly-retained users | generous limit; custom domain free; great React DX | brand-removal paid; deep component coupling; heavier M3 swap | rejected |
| Firebase Auth Spark | no-cost, 50k MAU w/ Identity Platform — but **3,000 DAU/day cap** + password-reset 150/day; Storage removed from Spark (Feb 2026) | GCP-native (M3 hint) | daily caps unacceptably small for auth UX | rejected for M2 |
| Amazon Cognito | 10k MAU (Lite/Essentials), unlimited duration | AWS-native (M3 primary candidate) | heavier setup; smaller cap | M3 alternative |
| Hand-rolled sessions in Workers (WebAuthn/D1) | unlimited, self-owned | no 3rd party | no magic-link email, high cost to build | rejected for M2 |
| WorkOS AuthKit | 1M MAU | huge capacity | SSO-flavored, overkill | rejected |

- **Decision.** Supabase Auth is used strictly as identity provider: issue JWTs (magic link /
  Google OAuth), publish JWKS; the Worker verifies tokens and owns **all** product data in D1.
  Implemented behind the `AuthAdapter` interface (`04-CONTRACT.md §6.1`).
- **Consequences.**
  1. `users.auth_sub` ↔ Supabase `sub`; verification = JWKS + `exp`/`aud`.
  2. Supabase outage degrades to read-only browsing; never data loss (D1 owns truth).
  3. Anonymous-first onboarding is a Worker feature (anonymous user rows + `merge_token`),
     independent of the IdP — upgrade path later without IdP support for anonymous users.
  4. Runbook includes a weekly keep-alive check on the Supabase project (idle-pause mitigation).
  5. M3 unbind = implement `AuthAdapter` against Cognito; no route changes.

---

## DR-02 — Dynamic data home: Cloudflare D1 + R2 (CF-native)

- **Status:** ACCEPTED
- **Context.** Where students' learning state and AI outputs live, with verified free-limit math:
  Workers free gives 100k req/day (which D1 supplies at zero-egress adjacency); candidates were
  CF D1/R2, Supabase Postgres (+pgvector), Firestore/Storage, Neon, DynamoDB.
- **Options:**

| Option | Wins | Fails on |
|---|---|---|
| **D1 + R2 (CF-native)** | co-located with the Worker (latency, no egress); generous write budget (100k/day); zero-egress R2; plain-SQL portability to Postgres | SQLite single-writer per DB (fine at our scale); 500 MB/db cap (fine) |
| Supabase Postgres (pgvector) everything | real vectors + RLS; SQL richness | off-edge RTT on every request; 500 MB cap; pause/2-projects risk compounds DR-01's, since same account |
| Firestore + GCS | GCP-native (M3 hint) | 20k writes/day too small; Storage left Spark plan (2026-02) |
| Neon Postgres | good free SQL | same external-dependency arguments |

- **Decision.** D1 for the learning plane; R2 for content packs / embeddings / media / AI cache /
  nightly DB exports. Supabase stays an *optional* backend for vector search only (DR-04, impl B).
- **Consequences.** Migrations are plain SQL files (M3-portable); every repo method documents a
  rows-read budget (contract §4.4); nightly cron exports D1 → R2 (Time Travel on free is only 7d).

---

## DR-03 — Runtime AI: budget-based `LlmRouter`

- **Status:** ACCEPTED
- **Context.** Workers AI free = 10k neurons/day and is too small to power generation alone;
  BYO keys put quota liability on users; a single vendor is a single point of failure.
- **Decision.** A `LlmRouter` inside the Worker: (1) classify request (kind, estimated tokens);
  (2) budget check against D1 `budget_ledger` (per-user + global day counters) → 429 on exhaust;
  (3) pick provider: cache → Workers AI (guard/embeddings/short text) → Gemini free → Groq free;
  (4) circuit-breaker failover + tombstone caching for failing providers; (5) every response →
  moderation → `ai_outputs(pending)`; (6) on exhaustion → **degrade to retrieval-only** (AP-3).
- **Consequences.** Provider keys = Worker secrets (runbook inventory + rotation); an eval suite
  (golden set 20 Q × 4 modes) gates any prompt/model change (07 §6); provider cost is measured in
  *tokens/day* budget entries, never a credit-card.

---

## DR-04 — Semantic index: R2 shards + Worker search; Vectorize deferred

- **Status:** ACCEPTED (impl A) with DEFERRED option (impl C)
- **Context.** Vectorize authoritative docs (Oct 2026) mark it paid-plan-only while marketing
  shows a free quota — not acceptable as a load-bearing dependency for a $0 platform.
- **Decision.**
  - **Impl A (default):** CI-generated embeddings → R2 shard files (`{ids[], vecs[][]}`) → Worker
    loads shard-per-space on demand, centroid shortlist + local cosine re-rank in ≤128 MB memory.
  - **Impl B (optional):** Supabase pgvector for heavier semantic workloads, same interface.
  - **Impl C (deferred):** Vectorize, if free status/large free quota becomes authoritative.
- **Consequences.** Where embeddings *run* (CI = GitHub Actions runners) keeps runtime neurons for
  cache-miss additions; interface `VectorIndex` makes migration a config flip; shard size cap
  enforced (≤ 8 MB gz per shard) to bound Worker memory.

---

## DR-05 — Hosting: dual deploy, Cloudflare Pages primary after GA

- **Status:** ACCEPTED
- **Context.** M1 = GH Pages (no real headers, 1 GB ceiling); target = CF Pages (headers, same-
  origin Functions, custom domain) — but migration must be reversible.
- **Decision.** Both origins deploy **the identical build artifact** from GitHub Actions. During
  migration, DNS/cutover selects origin; GH Pages remains warm until 30 days post-GA, then is
  archived (workflow kept for rollback documentation).
- **Consequences.** A `_headers` file provides full CSP + HSTS + immutable-cache rules (expands on
  meta-CSP limits); `verify-csp` gate gains a Pages mode; per-feature route cutovers (P3+) make the
  migration *incremental*, not a big bang.

---

## DR-06 — Repository shape: light monorepo in place

- **Status:** ACCEPTED
- **Context.** `packages/shared` + `workers/api` grow beside the existing static app rather than a
  full `apps/*` restructuring or a separate API repo.
- **Decision.** In-place layout (02 §4.3): web app untouched at root; `packages/shared` for
  contracts; `workers/api` for the API. CI extended, not replaced.
- **Rejected:** two repositories (contract drift between UI/API, slower hexagonal evolution);
  full pnpm/turbo monorepo (tooling overhead exceeds value at current team size; revisit if
  `packages` grows past shared+api).

---

## DR-07 — Feature order: accounts/sync first, AI second

- **Status:** ACCEPTED
- **Rationale.** Sync (P3) has no AI dependency, is the largest retention unlock, and is testable
  deterministically (property fuzz). AI phases (P4/P5) compound on a *saved* learner state and a
  *pack* corpus. "AI visible first" (rejected) would demo well but produce demos over throwaway
  state and put the riskiest-but-unvalidated code first.
- **Consequences.** P1 debt removal unblocks P2 infra; `packages/shared` learner v3 lands in P1
  so sync (P3) and later teacher v1 (P5) extend the same contract.

---

## DR-08 — Agentic harness remains the promotion gate

- **Status:** ACCEPTED
- **Decision.** Runtime AI outputs live in the dynamic plane (`ai_outputs`, moderated, TTL'd).
  They reach the *static curriculum* only via the nightly collector → GitHub issue/PR-draft →
  existing `.opencode` validators + CI — the same gates as human content. No direct R2/D1→Pages
  path exists.
- **Consequences.** Provenance metadata becomes a first-class field on every AI output
  (`model_tag`, `prompt_version`, source chunk ids, eval score) because the harness will require
  it in PRs; a new `topic-researcher` skill writes research notes that seed RAG layer L1.

---

## DR-09 — Observability & analytics: CF Web Analytics + D1 product events
*(supersedes `PLAN-MODERNIZATION.md` PostHog choice; absorbing its intent for cohorts/retention)*

- **Status:** ACCEPTED
- **Context.** L7: no learning-behavior signals today. Need product analytics without 3rd-party cookies or
  heavyweight consent plumbing.
- **Decision.** CF Web Analytics (no cookies, free) for traffic; **own product events** written to
  D1 (`progress_events` kind taxonomy) for learning-product insights; Worker structured logs for
  ops. PostHog + uptime monitors remain a deferred option if session replay is genuinely needed.
- **Consequences.** Event taxonomy is defined in `04-CONTRACT.md §7`; no consent banner required
  (no cookies/trackers) — consistent with the audit's SEC posture; dashboards to be defined in P6.

---

## DR-10 — Normative degradation ladder (all M2 features)

- **Status:** ACCEPTED
- **Decision.** Every M2 capability declares an explicit ladder; the *lowest* rung is always
  M1-equivalent behavior. Normative table:

| Rung | Condition | Behavior |
|---|---|---|
| 0 | healthy | full M2 experience |
| 1 | budget 80% (warning) | longer AI cache TTLs; UI notices "AI may be unavailable later today" |
| 2 | user budget exhausted | generation 429 + retrieval-only answers; sync unaffected |
| 3 | global/LLM provider down | router failover → static recommendation of existing lessons |
| 4 | D1 unavailable/rate-limited | read-only site (static + cached packs), sync paused with clear banner |
| 5 | pack manifest unavailable | fall back to static-compiled data shipped with the site (P4 requirement) |

- **Consequences.** e2e outage-mode scenarios simulate rungs 2–5 (07 §5.4); every new endpoint PR
  must document which rungs it participates in (extends CONTRACT §4.5).

---

## Supersession note (read against prior planning)

`docs/archive/2026-app-review/PLAN-MODERNIZATION.md` chose **Clerk (auth) + Neon (Postgres)
+ PostHog (analytics) + Cloudflare Worker on workers.dev**. DR-01/DR-02/DR-09 supersede those
bindings with **Supabase Auth + D1/R2 + CF Web Analytics**, preserving its still-valid elements:
the full CI battery gates (E0), uptime/monitoring intent (folded into P6 observability),
contact-form hardening (unchanged, separate of M2), the "signed-out behavior unchanged" rule
(folded into AP-1), and its quota-ledger discipline (now `06-CAPACITY-AND-COSTS.md`).
