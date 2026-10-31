# M2 Capacity Model & Free-Tier Ledger

> All figures verified against official provider documentation — **2026-10-31**.
> Purpose: prove the platform fits $0 under expected traffic, define burn alarms, and
> normatively enforce the degradation ladder (DR-10).

---

## 1. Verified entitlements ledger

| Service | Component | Free limit (verified) | Source page | Verified |
|---|---|---|---|---|
| Cloudflare | Workers requests | 100,000/day (all scripts, UTC reset) | developers.cloudflare.com/workers/platform/pricing | 2026-10-31 |
| Cloudflare | Worker CPU time | 10 ms/invocation (free) | …/limits | 2026-10-31 |
| Cloudflare | Subrequests | 50/invocation (free) | …/limits | 2026-10-31 |
| Cloudflare | D1 rows read | 5,000,000/day | …/workers/platform/pricing | 2026-10-31 |
| Cloudflare | D1 rows written | 100,000/day | …/pricing | 2026-10-31 |
| Cloudflare | D1 storage | 5 GB total / 500 MB per DB | …/d1/platform/limits | 2026-10-31 |
| Cloudflare | D1 Time Travel | 7 days point-in-time (free) | …/d1/platform/limits | 2026-10-31 |
| Cloudflare | R2 storage | 10 GB-month/month | …/pricing | 2026-10-31 |
| Cloudflare | R2 Class A ops | 1,000,000/month | …/pricing | 2026-10-31 |
| Cloudflare | R2 Class B ops | 10,000,000/month | …/pricing | 2026-10-31 |
| Cloudflare | R2 egress | $0 | …/pricing | 2026-10-31 |
| Cloudflare | KV reads / writes | 100,000/day / **1,000/day** | …/plans/developer-platform-pricing | 2026-10-31 |
| Cloudflare | Cron Triggers | 5/account (free) | …/limits | 2026-10-31 |
| Cloudflare | Vectorize | **docs: paid-plan-only** (marketing shows a free quota — not relied upon) | …/workers/platform/limits | 2026-10-31 |
| Cloudflare | Workers AI | 10,000 neurons/day; text-gen 300 RPM | …/workers-ai/platform/pricing + limits | 2026-10-31 |
| Cloudflare | Pages builds | ~500/month (avoided via wrangler deploys in CI) | cf plans | 2026-10-31 |
| Supabase | Auth MAU | 50,000/month; email + OAuth + basic MFA | supabase.com/pricing (+ zeroraised cross-check 2026-10-22) | 2026-10-31 |
| Supabase | Free plan | 2 active projects; pause after 1 week idle; 500 MB DB; 1 GB storage; 500k edge-fn invocations | supabase.com/pricing | 2026-10-31 |
| AWS (M3) | Cognito | 10,000 MAU (Lite/Essentials), no expiry | aws.amazon.com/cognito/pricing | 2026-10-31 |
| GCP (M3) | Firebase Auth | Spark no-cost; Identity-Platform cap 3,000 DAU/day; reset-email 150/day (why rejected for M2) | firebase.google/docs/auth/limits | 2026-10-31 |

Ledger rule: **when a provider changes a number materially (>25%), update this file and re-run
§3 math** before relying on it. CI guard: a docs-lint job asserts this table has a `Verified`
date within 45 days.

---

## 2. Traffic model (assumptions)

| Parameter | Baseline | Notes |
|---|---|---|
| DAU | 1,000 (design point), stress-tested to 3,000 | sessions: static pages do **not** count as Worker requests |
| sync pushes / DAU | 15 | debounced flush; offline users push less |
| sync pulls / DAU | 8 | on app open + stale segment |
| ask queries / DAU | 5 (2 unique after cache) | PK-wide; cache hit ~60% at steady state |
| generation requests / DAU | 0.05 (5%) | only retrieval misses trigger |
| rows-read per sync push | ~2× ops (batched) | §3 math |
| LLM tokens / generation | ~2,400 in+out avg | 4 modes average |

---

## 3. Consumption math (baseline 1,000 DAU)

### 3.1 Workers requests (limit 100k/day)

| Flow | req/day |
|---|---|
| sync push | 15,000 |
| sync pull | 8,000 |
| ask | 5,000 (+ prefetch ~500) |
| generate | 50 |
| health/manifest/plan/misc | ~1,500 |
| **total** | **~30,000 → 30% of cap** |

Break-even: ~3,300 DAU at identical behavior mix. Header shows warning if `workers-usage` > 35%.

### 3.2 D1 (read 5M rows/day, write 100k/day)

| Flow | rows read/day | rows written/day |
|---|---|---|
| sync push (2 rows/op ×key reads + 1 write/op) | ~30,000 | ~15,000 |
| sync pull | 320,000 (40 rows/req) | — |
| profile/plan/diagnostics | ~15,000 | ~2,000 |
| ask/generate bookkeeping | ~40,000 | ~3,000 |
| events append | — | ~20,000 |
| **total** | **~0.4M → 8% of cap** | **~40,000 → 40% of cap** |

D1 write is the tighter constraint: it breaks even at ~2,500 DAU. Mitigation priority:
coalesce XP/day updates into profile merge (already max-merge), and keep progress_events
append-only but batched client-side (max 20 events/push).

### 3.3 R2 ops (Class A 1M/mo write-ish, Class B 10M/mo read-ish)

| Flow | Class A/day | Class B/day |
|---|---|---|
| pack fetches (immutable, client-cached) | — | ~25,000 |
| AI response cache writes/reads | 250 / 2,500 | 2,500 |
| embeddings shard loads | — | ~6,000 |
| backup export (nightly) | 1 | 1 |
| **monthly** | ~8k (0.8% cap) | ~1.0M (10% cap) |

### 3.4 KV writes — the ⚠ constraint (1,000/day)

| Counter (per user) | writes/day |
|---|---|
| rate-limit burst/decrement tokens (bucketed: 1 write / 5 min active user) | ~300 |
| session revocation markers | ~10 |
| **total** | **< 400 → 40% of cap** |

Rule: anything but byte-counters is D1, never KV. Alarm at > 50%.

### 3.5 Workers AI neurons (10k/day) and LLMs

| Use | Neurons/day (est.) |
|---|---|
| runtime question embeddings (~2k queries × ~50 neurons) | ~2,000 |
| moderation classifier calls | ~3,000 |
| fallback short-form text | ~2,000 |
| **total** | **~7,000 → 70% of cap; bulk training *embeddings* run in CI (free GH runners) instead** |

LLM providers (BYO free tiers): Gemini ~15 RPM and daily quotas, Groq ~30–60 RPM class. At 50
generations/day × 2.4k tokens the demand is tiny; provider circuits exist because bursty cohorts
(demo/classroom) can spike 100×. Budget ledger caps user tokens/day and global/day independently.

---

## 4. Degradation ladder (normative — from DR-10)

| Rung | Trigger | Consequence | User-visible UX |
|---|---|---|---|
| 0 | healthy | full experience | — |
| 1 | any ledger > 80% | cache TTLs up; ask sampling down 25% | subtle "AI may be quiet later today" note |
| 2 | user budget exhausted | generation/ask 429 (`budget_exhausted`) | CTA hidden; sync + everything else normal |
| 3 | global/LLM down | router failover → retrieval-only answers | "Sources from our courses" answer mode |
| 4 | D1 unavailable | static + cached packs only; sync paused | banner "sync paused — progress kept locally" |
| 5 | pack manifest stale/unavailable | static-compiled data fallback | identical M1 UX |

Every endpoint in `04-CONTRACT.md §4.5` declares supported rungs; e2e suite runs 2–5 as
outage scenarios (`07-TESTING-QA.md §5.4`).

---

## 5. Burn alarms & tooling

| Signal | Alarm threshold | Response |
|---|---|---|
| Workers requests | > 35% weekly avg | investigate client flush cadence; cache more |
| D1 writes | > 50% for 3 days | coalesce counters; batch events |
| KV writes | > 50% | nothing goes to KV (audit) |
| Workers AI neurons | > 70% | move embeddings fully to CI; shrink guards |
| LLM daily spend (free quotas) | provider circuit 'degraded' 2 days | rotate provider / raise cache TTL |
| R2 storage | > 8 GB | prune old pack versions (keep N-2), sweep exports older than 90d |
| D1 storage | > 350 MB per DB | archive progress_events to R2 |

Tooling: `budget_ledger` is both the enforcement mechanism and the metering source; a tiny
`GET /api/admin/usage` (admin-scoped) renders the current-day table for the runbook check-in.

---

## 6. Cost ceiling statement

Under the assumptions of §2, **M2 runs at $0/month with ≥ 2× headroom on every constraint
except KV writes (40%) and Workers AI (70%)**, both of which have named mitigations.
Failure of the $0 constraint is defined as (a) any required paid service, or (b) burn alarms
over threshold for 14 consecutive days — at which point the decision is *degrade features*
(DR-10) rather than pay, per the platform's mission.
