# M2 Testing & QA Strategy

> Extends the repo's existing strategy (`docs/operations/TESTING.md` — 1,209 vitest / 566 pytest)
> to cover the M2 dynamic plane. The CI battery remains the merge gate; M2 adds worker-level and
> AI-level quality gates.

---

## 1. Test pyramid for M2

| Layer | Scope | Tooling | Where run |
|---|---|---|---|
| L0 contract | shared types/zod schemas compile + round-trip | vitest + typecheck | every commit |
| L1 unit | routers, repos, merge logic, budget, moderation deterministic parts | vitest (pure fns) | every commit |
| L2 property | **sync merge fuzz** (3 devices), pack immutability hashing | vitest-check style generators | every commit |
| L3 integration | D1 local via `wrangler dev`, R2-local, KV maintainers, Supabase fake JWKS | vitest + wrangler | every commit (CI service) |
| L4 e2e | full journeys incl. multi-context sync + outage modes | Playwright against staging | pre-merge (re-enabled in CI) |
| L5 AI eval | golden set ~20 Q × modes, rubric scoring | CI eval job | on prompt/model change |
| L6 security | JWKS/JWT vectors, rate-limit bypass, moderation adversarial set | vitest + manual round | pre-GA |
| L7 capacity | synthetic 1k-DAU replay vs budgets | k6-style script (or Playwright loop) | P6 |

---

## 2. Local development & test infrastructure

```bash
npm run api:dev          # wrangler dev → workers/api; D1 local, R2 local (miniflare), KV local
npm run test:api         # vitest config for workers/api
npm run test:e2e:staging # Playwright against https://staging.<domain> (flag RUNTIME=staging)
```

- **D1 local**: migrations applied via `wrangler d1 migrations apply —local` in pretest; seed
  fixtures `workers/api/tests/fixtures/*.sql`.
- **R2 local**: miniflare-local bucket; `packs.yml` emits a `packs/vTest/manifest.json` fixture.
- **Supabase fake**: stub JWKS endpoint + build-token helper signing test keys (never real project
  in unit tests); the real one appears only in staging e2e with throwaway accounts.
- Node/jest conventions from the repo apply (see standing constraints in 05 §0), minus specifics
  already covered (`no vi.unstubAllGlobals`, `act()` wrapping…).

---

## 3. Contract & integration test catalog (acceptance mapping)

| Feature (task id in 05) | Test catalog |
|---|---|
| AuthAdapter (T3.1) | JWT verify happy/expired/wrong-aud/malformed; rate-limited login; magic-link flow via staging |
| Repos (T3.2) | per-method rows-read budget assertion — intercept miniflare SQL; exact budget table (04 §4.4) |
| Anonymous bootstrap (T3.3) | zero-wall journey; double-link idempotency; orphan-device cleanup |
| Sync (T3.4–3.5) | push/pull contract; conflict envelope; schema of v3; storage validators reused |
| Rate limits/budget (T3.6) | bucket math; per-IP vs per-user; `Retry-After` semantics |
| Privacy (T3.7) | export = complete JSON diff vs DB; delete = cascade + flag |
| Packs/manifest (T4.1, T4.6) | pack parity vs static render (5 courses × 3 locales sampled); atomic manifest swap |
| Embeddings (T4.2) | dedup by hash; shard size cap; dimension/model stamping |
| VectorIndex (T4.3) | top-k sanity vs brute force on small fixture; Cache warm/invalidate |
| Ask (T4.4) | SSE frames; cache hit path; citations resolve to static URLs; refusal on off-corpus question |
| LlmRouter (T5.1) | provider rotation, circuit/tombstones, budget consume/rollback on failure |
| Moderation (T5.2) | adversarial set (prompt-injection, PII, off-topic, self-harm) — blocked with reports |
| Modes (T5.4–5.7) | per-mode contract; TTL sweep; provenance labels always present |
| Teacher plan (T5.9–5.11) | snapshot tests with fixture profiles; no-LLM determinism |
| Crons (T6.2) | promotion collector dry-run valid GitHub issue payload; TTL sweep |

---

## 4. Property-based sync fuzz (the correctness core)

Generators: devices {3}, op streams with clamped time skew {±90 s}, per-key strategies.
Invariants asserted:
1. order-independence: any per-device ordering of the same ops → identical final state
2. monotonicity: XP/level never regress; rev strictly increases; rewards ∪ only grows
3. idempotence: pushing the same op twice == once
4. crash-safety: simulated mid-flush interruption → next flush converges (no dup, no loss)

Fuzz runs 2,000 cases per commit in CI (~< 60 s) and 100,000 nightly (scheduled e2e workflow).

---

## 5. E2E journeys (Playwright, staging)

| J | Journey | Assertions |
|---|---|---|
| J1 | anonymous learner: learn lesson, XP, review | no signup-wall; banner "progress saved on this device" |
| J2 | magic-link sign-in merge: local state → account | merge_token consumed; XP monotonic |
| J3 | **cross-device**: context A does lesson → context B sees within 2 s; both edit X offline, reconnect | merge per §1.2; conflict telemetry |
| J4 | ask flow: question → cited answer; cached repeat < 500 ms; off-corpus question → refusal + sources-only |
| J5 | generate modes ×4 under normal budget; then forced exhausted budget → degrade path (unable in rungs 2/3) |
| J6 | teacher: diagnostics → plan differs from default; FSRS queue reflects plan |
| J7 | outage matrix: (a) API down → static site fine; (b) manifest stale → fallback data; (c) 429s → banner; (d) provider down → failover |
| J8 | privacy: export/download; delete-account → server rows gone, device re-bootstraps anonymous |
| J9 | pack update: staging repack → new lesson appears without site redeploy (client refetch manifest) |

Mobile matrix: chrome-mobile/firefox/webkit projects existing; new journeys added to the
`mobile-chrome` project as first-class.

---

## 6. AI evaluation pipeline

```txt
evals/
├── golden/ask/*.json          # question + expected-coverage rubric + source refs
├── golden/explain/*.json      # input lesson + style + rubric (similarity, correctness, tone)
├── golden/micro_lesson/*.json # topical coverage + citation density rubric
├── golden/extra_question/*.json
└── scoring/llm-judge.ts       # judge provider pinned by digest; fixed seed
```

- Gate: prompt/model/pack change → eval job runs; per-mode score ≥ threshold (default 0.8) and
  latency P95 < 8 s else fail.
- Judge cost: free-tier model or local heuristics (BLEU/overlap + video rubric checks); judge
  pinned, changes to the judge themselves are eval'd once.
- Every production output carries `{model_tag, prompt_version, eval?}` provenance (contract §2)
  so sampled human review can spot-check weekly (nota: 30-min regime in P6).

---

## 7. Load & capacity replay

- Script: 1,000 synthetic DAU mix (§2 of 06) across ~10 min against staging + *staging-only*
  D1; assertions = capacity ledger thresholds (06 §5 alarms) and per-endpoint latency budgets.
- Result artifact: markdown table committed to `docs/milestone-m2/reports/load-{date}.md`.

---

## 8. CI integration (`api.yml` sketch)

```yaml
jobs:
  shared:       typecheck + lint + vitest (packages/shared)
  workers:      vitest L1–L3 with miniflare services; budget contract tests
  web:          existing nextjs battery unchanged
  e2e:          Playwright (re-enabled) → J1–J9 against staging
  eval:         (paths: workers/api/src/lib/prompts/**, evals/**) → rubric gates
  docs-lint:    capacity ledger freshness check (06 §1)
```

Definitions of done across M2 enforce: new endpoint ⇒ budget annotations + rung declaration +
contract test + rate-limit test + e2e journey (or documented exception).
