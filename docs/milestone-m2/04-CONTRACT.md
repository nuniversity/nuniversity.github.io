# M2 Technical Contract — schemas, storage layout, API surface, interfaces

> Source of truth for shared types until `packages/shared` lands (Phase P1, task T1.4), after
> which **this document describes contracts implemented in TypeScript** and the code follows.
> Companion docs: decisions (03), plan (05), capacity (06), tests (07).

---

## Table of contents
1. [Learner state v3 + merge rules](#1-learner-state-v3--merge-rules)
2. [Cloudflare D1 schema](#2-cloudflare-d1-schema)
3. [R2 knowledge plane](#3-r2-knowledge-plane)
4. [Worker API surface](#4-worker-api-surface)
5. [Interface definitions](#5-interface-definitions)
6. [Client-side sync contract (SyncEngine)](#6-client-side-sync-contract-syncengine)
7. [Event taxonomy (product analytics)](#7-event-taxonomy-product-analytics)
8. [Environment variables & secrets inventory](#8-environment-variables--secrets-inventory)
9. [Error taxonomy & rate limits](#9-error-taxonomy--rate-limits)

---

## 1. Learner state v3 + merge rules

### 1.1 Defining types (`packages/shared/src/learner.ts`)

```ts
export type Locale = 'en' | 'pt' | 'es'

/** Sync metadata attached to every mutable learner object. */
export interface SyncMeta {
  /** monotonic per-key bump on every mutation */
  rev: number
  /** ISO-8601 UTC, last writer */
  updatedAt: string
  /** stable client device identifier (uuid v7, generated first run) */
  deviceId: string
}

export type Lww<T> = { data: T } & SyncMeta

/** Progress keys — one row per key merges LWW or rule-based. */
export type ProgressKey =
  | `course:${string}`                    // per-course progress object
  | `lesson:${string}:${string}:${Locale}`// courseSlug:lessonSlug:lang (completion, feedback)
  | `practice:${string}`                  // practice answers/mastery per course
  | `quiz:${string}`                      // quiz bests (attempts are events, below)
  | `review:cards`                        // FSRS card store
  | `review:xp-day`                       // daily review XP
  | `roadmap:${string}`                   // roadmap step progress
  | `roadmap:rewards`                     // roadmap rewards claimed (set-union)
  | `game:${string}`                      // game bests
  | `lang:${string}`                      // language-pair progress
  | `lang-best:${string}`
  | `language-course:${string}`
  | `profile`                             // profile/XP/level minimal object
  | `tool-state:${string}`                // tool persistent state (existing v1 keys)
  | `diagnostics:${string}`               // area diagnostics (server-assigned too)

/** Merge strategy per key family (server-enforced; §1.2). */
export type MergeStrategy =
  | 'lww'            // default: Highest updatedAt wins, tie-break deviceId
  | 'max-merge'      // monotonic counters (XP, stars, bests)
  | 'set-union'      // rewards, badges, completed sets
  | 'per-element-lww'// review:cards → per-card FSRS payload; lang-best per-activity
```

```ts
export const MERGE_BY_KEY: Record<keyof typeof STRATEGIES, MergeStrategy> = { /* §1.2 table */ }
```

### 1.2 Merge algorithm (server-side, deterministic)

```python
def merge(win: Row, incoming: Row) -> Row:   # pseudocode; tests = property fuzz (07 §4)
    if strategy == 'lww':
        winner = max([win, incoming], key=lambda r: (r.updatedAt, r.deviceId))
    elif strategy == 'max-merge':
        winner = row_with(data = elementwise_max(win.data, incoming.data),
                          meta = max([win, incoming], key=lambda r: (r.updatedAt,))['meta'])
    elif strategy == 'set-union':
        winner = row_with(data = sorted(set(win.data) | set(incoming.data)),
                          meta = max(...))
    elif strategy == 'per-element-lww':
        winner = row_with(data = { k: lww(win.data[k], incoming.data[k]) for k in keys })
    return winner
```

| Key family | Strategy |
|---|---|
| profile | max-merge (XP never regresses; level derived) |
| course, lesson, practice, quiz, lang, language-course, tool-state, diagnostics | lww |
| roadmap:* | lesson-level lww inside roadmap payload |
| review:cards | per-element-lww (per card id: FSRS state) |
| roadmap:rewards, lang-best:* | set-union / per-element max |
| lesson feedback | set-union of feedback marks |

Property tests lock this in (07 §4): for any three devices × interleavings, final state is
order-independent; merges are pure; `rev` strictly increases server-side.

### 1.3 Migration contract

- On first sync of a device, the client serializes its entire local `v1:*` surface (existing
  `lib/storage/safe-storage.ts` validators) as **one synthetic device proposal** (`deviceId =
  'bootstrap-<uuid>'`), then adopts server revs.
- Post-signin merges device-bound anonymous profile into account profile using the same merge
  rules with a `merge_token` (DR-01) — deterministic, testable, idempotent.

---

## 2. Cloudflare D1 schema

`workers/api/migrations/0001_init.sql` (multi-statement migrations via `wrangler d1 migrations`).

```sql
-- users: anonymous-first rows; auth link later
CREATE TABLE users (
  id            TEXT PRIMARY KEY,              -- uuid v7 (server-generated)
  auth_sub      TEXT UNIQUE,                   -- IdP subject when linked; NULL while anonymous
  locale        TEXT NOT NULL DEFAULT 'en',
  is_anonymous  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,                 -- ISO UTC
  last_seen_at  TEXT NOT NULL
);

CREATE TABLE learner_profiles (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  fsrs_params      TEXT NOT NULL,              -- ts-fsrs parameters JSON
  style_profile    TEXT,                       -- {explicit:{visual,verbal,practice}, implicit:{...}, version}
  diagnostics      TEXT,                       -- {area:{score, attempt, testedAt, version}}
  sync_rev         INTEGER NOT NULL DEFAULT 0,
  updated_at       TEXT NOT NULL
);

CREATE TABLE progress_state (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,                   -- ProgressKey
  data        TEXT NOT NULL,                   -- payload JSON
  rev         INTEGER NOT NULL,
  updated_at  TEXT NOT NULL,
  device_id   TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);
CREATE INDEX ix_progress_delta ON progress_state (user_id, updated_at);

CREATE TABLE progress_events (                 -- append-only: attempts, XP facts, AI usage facts
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  kind       TEXT NOT NULL,                    -- §7 taxonomy
  payload    TEXT NOT NULL,
  client_ts  TEXT NOT NULL,
  server_ts  TEXT NOT NULL
);
CREATE INDEX ix_events_user ON progress_events (user_id, id);

CREATE TABLE ai_outputs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT,                          -- NULL = shared/anonymous output
  locale        TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('explain','qa_rag','micro_lesson','extra_question')),
  inputs_hash   TEXT NOT NULL,                 -- cache key: sha256(kind|inputs|packVersion|promptVersion)
  content_md    TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending','moderated','published','rejected')),
  model_tag     TEXT,
  prompt_version TEXT,
  source_refs   TEXT,                          -- JSON: citation chunk ids → static URLs
  eval_score    REAL,
  tokens        INTEGER,
  ttl_expires_at TEXT,                         -- sweep cron deletes expired pending/rejected
  created_at    TEXT NOT NULL
);
CREATE INDEX ix_outputs_cache ON ai_outputs (inputs_hash, status, created_at DESC);
CREATE INDEX ix_outputs_promote ON ai_outputs (status, created_at DESC);

CREATE TABLE budget_ledger (
  scope     TEXT NOT NULL,                     -- 'user:<userId>' | 'global'
  day       TEXT NOT NULL,                     -- 'YYYY-MM-DD' (UTC)
  tokens    INTEGER NOT NULL DEFAULT 0,
  llm_calls INTEGER NOT NULL DEFAULT 0,
  ai_neuron INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, day)
);

CREATE TABLE sync_flags (key TEXT PRIMARY KEY, value TEXT);
-- rows: {'schema_version':'1','active_pack_version':'12','maintenance_mode':'null'}
```

**Index rationale.** Every endpoint's WHERE clause has a covering index (rows-read budget §4.4);
`progress_state` delta index serves `/api/sync/pull?since=`; output cache index serves KV-free
cache lookups; `ix_outputs_promote` serves the promotion collector cron.

**Row-size discipline.** D1 row limit 2 MB — payloads above 512 KB are rejected (`payload_too_large`)
and the logical payload is moved to R2 (`cache/large/{hash}`), key kept in the row.

---

## 3. R2 knowledge plane

### 3.1 Bucket layout (`r2-bucket: nuniversity-content`)

```txt
packs/v{N}/manifest.json                      # ETag-cached entry point (see §3.2)
packs/v{N}/courses/{slug}/{lang}.pack.json.gz  # compiled course packs (immutable)
packs/v{N}/topics/{topicId}.md                 # agent research notes (RAG layer L1)
packs/v{N}/embeddings/{space}/{lang}/shard-00NN.json.gz   # {ids[],vecs(b64),dim,model_tag}
media/v{N}/{courseSlug}/{hash}.{ext}           # sharp-optimized images
cache/ai/{inputsHash}.json.gz                  # moderated AI response artifacts (immutable)
cache/large/{hash}.json.gz                     # oversized D1 payloads
exports/d1-{YYYYMMDD}.sql.gz                   # nightly backup cron
```

Immutability + `max-age=31536000, immutable`; `manifest.json` uses ETag revalidation.

### 3.2 Manifest format (`pack@1`)

```jsonc
{
  "schema": "pack@1",
  "packVersion": 12,
  "builtAt": "2026-10-31T09:12:00Z",
  "buildCommit": "abc1234",
  "courses": {
    "intro-to-programming": {
      "langs": { "en": "sha256-…", "pt": "sha256-…", "es": "sha256-…" },
      "lessons": 14
    }
  },
  "embeddings": {
    "spaces": { "lessons": { "langs": { "en": { "shards": 3, "dim": 384, "model": "bge-small-en" } } } }
  },
  "topics": ["aws-clf-quotas", "fsrs-tuning"],
  "promptVersion": "gen@3"
}
```

### 3.3 Course pack (TS contract)

```ts
export interface ContentPack {
  schema: 'pack@1'
  courseSlug: string
  lang: Locale
  packVersion: number
  builtAt: string
  meta: CourseMeta                       // title, description, area, difficulty, durationMin, icon
  lessons: Array<{
    slug: string; order: number; title: string
    durationMin: number; difficulty: string; skills: string[]
    body: string                          // compiled markdown ready for MarkdownRenderer
    questions?: QuestionIface[]           // from the question pipeline (practice/exam)
    media: Array<{ id: string; hash: string; kind: 'image'|'video'; alt: string }>
    embeddingRef?: { shard: string; index: number }   // for section-level retrieval
  }>
  lineage: { sourceRepo: string; contentVersion: string; agentRun?: string }
}
```

### 3.4 Embeddings shard format

```jsonc
{ "space": "lessons", "lang": "en", "shard": "0001", "dim": 384, "model": "bge-small-en-v1.5",
  "ids": ["lesson:courseSlug/lessonSlug#section-03"],
  "vecs": ["<base64 float32 array>"],
  "anchors": { "centroid": "<base64 float32[384]>" } }   // centroid shortlist for re-rank
```

Shard bounding rule: **≤ 8 MB gz** per shard (memory budget, DR-04); chunk metadata joined from
ids → pack lookup at compose time.

---

## 4. Worker API surface

Base: same-origin `/api/*` (Pages Functions, Hono). All bodies zod-validated (`packages/shared`).

### 4.1 Endpoints

| Route | Method | Auth | Max CPU-ish | Purpose |
|---|---|---|---|---|
| `/api/health` | GET | none | minimal | liveness + schema/pack version + maintenance flag |
| `/api/auth/signup`, `/login`, `/oauth/google`, `/logout` | POST | adapter | low | AuthAdapter facade |
| `/api/auth/link-device` | POST | signed | low | anonymous → account merge via `merge_token` |
| `/api/auth/session` | GET | cookie | low | session check + profile echo |
| `/api/sync/push` | POST | signed | med | {deviceOps[]} → merge → {applied, conflicts, rev} |
| `/api/sync/pull` | POST | signed | med | {since: ts/rev} → changed keys only |
| `/api/profile` | GET | signed | low | learner profile |
| `/api/diagnostics/submit` | POST | signed | low | area placement results → profile |
| `/api/teacher/plan` | GET | signed | med | rules-based adaptive plan (02 §8.2) |
| `/api/packs/manifest` | GET | anon | minimal | latest manifest (ETag) |
| `/api/ask` | POST (SSE) | signed | async fetches | RAG v1 (02 §5.2) |
| `/api/generate/:kind` | POST (SSE) | signed | async fetches | 4 modes (02 §5.3); budget-gated |
| `/api/admin/*` | POST | admin claim | — | moderation queue, promotion trigger, budget overrides |

### 4.2 Example: `/api/sync/push`

```jsonc
// request
{ "deviceId": "7f3c…", "deviceOps": [
    { "key": "course:intro-to-programming", "data": { "completed": ["01-introduction"] },
      "rev": 42, "updatedAt": "2026-10-31T10:04:11Z" },
    { "key": "profile", "data": { "xp": 1200 }, "rev": 41, "updatedAt": "…" } ] }
// response
{ "applied": [ { "key": "course:intro-to-programming", "rev": 908, "merged": true } ],
  "conflicts": [ { "key": "…", "strategy": "lww", "winner": "server", "detail": {…} } ],
  "serverRev": 907, "serverTime": "…" }
```

### 4.3 Example: `/api/ask`

```jsonc
// request
{ "question": "How do I derive the trace of a matrix?", "courseSlug": "…", "lang": "en" }
// SSE frames
data: {"type":"sources","refs":[{"url":"/en/courses/linear-algebra/03-matrices","title":"Matrices","score":0.83}]}
data: {"type":"delta","text":"The trace is the sum of the main-diagonal entries…"}
data: {"type":"done","cached":false,"packVersion":12}
```

### 4.4 Per-endpoint budgets (normative)

| Endpoint | target rows-read | rows-written | notes |
|---|---|---|---|
| sync/push | ≤ deviceOps×2 (batch) | ≤ deviceOps | single `db.batch()` |
| sync/pull | ≤ 40 | 0 | index-driven delta |
| profile GET | ≤ 3 | 0 | |
| ask | ≤ 8 | ≤ 2 (cache artifact meta + output on first) | R2 dominates |
| generate/:kind | ≤ 10 | ≤ 4 (output, budget×2, events) | |
| teacher/plan | ≤ 6 | 0 | profile + diagnostics + progress sample |
| health | ≤ 3 | 0 | flags only |

Budget violations are contract-test failures (07 §3).

### 4.5 Rung participation (DR-10)

Each route declares supported degradation rungs in its route file header comment; `sync` rungs 0–4,
`ask`/`generate` rungs 0–3, `teacher/plan` rungs 0–4 (defaults when no profile), `health` always.

---

## 5. Interface definitions

### 5.1 `AuthAdapter`

```ts
export interface Session { token: string; expiresAt: string; userId: string; anonymous: boolean }
export interface UserClaims { sub: string; email?: string; picture?: string; locale?: Locale }

export interface AuthAdapter {
  signUpEmail(email: string, pw: string): Promise<Session>
  signInEmail(email: string, pw: string): Promise<Session>
  signInMagicLink(email: string, redirectTo: string): Promise<void>
  signInOAuth(provider: 'google'): Promise<Session>
  verifyJwt(token: string): Promise<UserClaims | null>   // JWKS + exp/aud checks
  refresh(token: string): Promise<Session | null>
  logout(token: string): Promise<void>
  /** device-bound anonymous state → account (uses merge_token; idempotent) */
  linkDevice(mergeToken: string, claims: UserClaims): Promise<Session>
}
```

### 5.2 `VectorIndex`

```ts
export interface RetrievedChunk {
  id: string; score: number
  packVersion: number; courseSlug: string; lessonSlug?: string; section?: string
  locale: Locale
  title: string; url: string   // static URL citation target
}

export interface VectorIndex {
  /** k-NN over owned corpus; shards fetched lazily + in-memory cached */
  search(input: { vector: Float32Array; space: string; lang: Locale; k: number; scopeCourse?: string }):
    Promise<RetrievedChunk[]>
  warm(space: string, lang: Locale): Promise<void>            // pre-load shards (CF Cache API)
  invalidate(space: string, lang: Locale, packVersion: number): Promise<void>
}
```

### 5.3 `LlmRouter`

```ts
export interface GenerationRequest {
  kind: 'explain' | 'qa_rag' | 'micro_lesson' | 'extra_question'
  locale: Locale
  inputs: Record<string, unknown>       // validated per kind zod schema
  contextChunks?: RetrievedChunk[]      // mandatory for qa_rag
}

export interface GenerationResult {
  text: string
  provider: 'workers-ai' | 'gemini' | 'groq'
  modelTag: string
  tokensUsed: number
  degraded: boolean
  provenance: { promptVersion: string; sourceRefs?: Array<{ url: string; title: string }> }
}

export interface LlmRouter {
  run(req: GenerationRequest, budgetCheck: BudgetContext): Promise<GenerationResult>
  /** health probes used by circuit breaker + tombstone cache */
  probe(): Promise<Record<'gemini' | 'groq' | 'workers-ai', 'up' | 'degraded' | 'down'>>
}
```

### 5.4 `PackStore` (M3 seam: R2 ↔ S3/GCS)

```ts
export interface PackStore {
  manifest(): Promise<{ manifest: PackManifest; etag: string }>
  get<T>(path: string, ifNoneMatch?: string): Promise<{ data?: T; notModified: boolean; etag: string }>
  put(path: string, body: ReadableStream | ArrayBuffer, contentType: string, immutable: true): Promise<void>
}
```

### 5.5 `BudgetService`

```ts
export interface BudgetDecision { allowed: boolean; reason?: 'user' | 'global'; remaining: number }
export interface BudgetService {
  check(scope: 'user' /* id */ | 'global', need: BudgetRequest): Promise<BudgetDecision>
  consume(scope: string, usage: { tokens?: number; calls?: number; neurons?: number }): Promise<void>
  resetYesterday(): Promise<void>          // cron
}
```

---

## 6. Client-side sync contract (`SyncEngine`)

```ts
interface SyncEngine {
  /** online-detect + rehydrate: pull → merge into localStorage (safe-storage validators reused) */
  hydrate(): Promise<void>
  /** queues a local mutation (rev++, updatedAt=now, deviceId) and debounces push */
  mutate(key: ProgressKey, fn: (data: unknown) => unknown): void
  /** pushes queued ops; exponential backoff (0.5s,1s,2s,5s,15s,60s cap); offline-tolerant */
  flush(): Promise<void>
  health(): { pending: number; lastError?: string; connected: boolean }
}
```

Rules:
- localStorage stays read-path instant; server is source of truth; conflict → merge rules §1.2,
  never user-visible except telemetry (and profile XP truly monotonic so "lost XP" impossible).
- Blocking ops: never; sync failure never blocks a lesson interaction (AP-3 rung 0 behavior).
- Tests: multi-context journeys + fuzz (07 §4–5).

---

## 7. Event taxonomy (product analytics — `progress_events.kind`)

| kind | payload schema (zod) | consumer |
|---|---|---|
| `attempt.recorded` | {courseSlug, lesson/quiz slug, correct, ms} | mastery/teacher |
| `xp.gained` | {source: lesson\|review\|quiz\|game, amount} | dashboard |
| `review.scheduled` / `review.done` | {cardId, grade} | FSRS tuning |
| `diagnostics.submitted` | {area, score, version} | teacher |
| `ask.query` | {courseSlug?, lang, cacheHit, latencyMs, tokens, budgetLeft} | pack/RAG tuning |
| `generate.requested` | {kind, provider, tokens, labelShown} | budget + quality |
| `pack.fetched` | {courseSlug?, lang, packVersion, bytes} | cache tuning |
| `diagnostics.style` | {explicit, implicitHints} | teacher |

Retention: 180 days, aggregates in Web Analytics dashboards; no PII beyond profile (DR-09).

---

## 8. Environment variables & secrets inventory

| Name | Kind | Scope | Notes |
|---|---|---|---|
| `CF_API_TOKEN` | GH secret | CI: wrangler OIDC deploys | `Pages: edit`, `D1: edit`, `R2: edit`, `KV: edit` scopes |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | binding/text | staging/prod | public values |
| `SUPABASE_JWKS_URL` | binding | both | verified in `verifyJwt` |
| `GEMINI_API_KEY` *(BYO)* | secret | prod (rotating) | optional; absent → router skips |
| `GROQ_API_KEY` *(BYO)* | secret | prod | optional |
| `GH_PROMOTION_TOKEN` | secret | prod | fine-grained, read-only + issues/PR create |
| `ADMIN_USER_IDS` | text | both | comma list of user ids with admin claim |
| `MODERATION_KEY` | secret | both | HMAC for moderation admin ops |

Secrets handling: created via `wrangler secret put --env <stage>`; never in repo; rotation
calendar in `08-RUNBOOK.md §6`; gitleaks extended to `workers/**` in CI.

---

## 9. Error taxonomy & rate limits

**Error envelope:** `{ "error": { "code": "<code>", "message": "<msg>", "scope": "<route>" } }`

| Code | HTTP | Meaning | Client behavior |
|---|---|---|---|
| `auth_required` | 401 | no/expired session | refresh → anon bootstrap → retry once |
| `forbidden` | 403 | acl/admin missing | local-only mode |
| `rate_limited` | 429 | KV/D1 limit hit | backoff per header `Retry-After` |
| `budget_exhausted` | 429 | DR-10 rung 2 | hide generate/ask CTAs; sync unaffected |
| `payload_too_large` | 413 | > 512 KB progress payload | pack the payload to R2 (transparent) |
| `merge_conflict` | 200(warn) | deduped conflict info in response body | telemetry only |
| `pack_stale` | 409 | manifest changed mid-request | refetch manifest, retry once |
| `internal` | 5xx | structured logged id | banner + retry |

**Rate limits (KV counters unless noted):** per-IP 60/min API-wide burst; per-user 600/h; ask 30/h;
generate 20/h; sync push 180/min (debounced); login 10/h/IP. Authoritative table lives in
`workers/api/src/lib/rate-limit.ts` and is tested (07 §3).
