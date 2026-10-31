# M2 Operations Runbook

> Operational procedures for the M2 platform (Cloudflare + Supabase). Owner-facing.
> Companion: contract (04) for env/secrets, capacity (06) for alarms, testing (07) for drills.

---

## Table of contents
1. [Environments, accounts & providers](#1-environments-accounts--providers)
2. [Secrets inventory & rotation calendar](#2-secrets-inventory--rotation-calendar)
3. [Deploy procedures](#3-deploy-procedures)
4. [Database operations (D1)](#4-database-operations-d1)
5. [Scheduled jobs (Cron)](#5-scheduled-jobs-cron)
6. [Monitoring & dashboards](#6-monitoring--dashboards)
7. [Incident playbook](#7-incident-playbook)
8. [Rollback procedures](#8-rollback-procedures)
9. [Weekly ops checklist](#9-weekly-ops-checklist)

---

## 1. Environments, accounts & providers

### 1.1 Accounts checklist (one-time, P0)

| Provider | Setup |
|---|---|
| Cloudflare | account + zone for the platform domain; Pages project (`nuniversity-prod`, `nuniversity-staging`); Workers plan (free); buckets `nuniversity-content-{env}`; D1 DBs `nuniversity-{env}`; KV namespace `sessions-{env}` |
| Supabase (IdP) | project per env (2 free projects max — staging shares where possible); auth providers: email magic-link, Google OAuth (redirect origins registered); JWT secret/JWKS noted |
| GitHub | OIDC app approved; fine-grained token for promotion collector (issues + PR create, repo-scoped read) |
| BYO LLM | Gemini API key (AI Studio), Groq API key — stored as Worker secrets |

### 1.2 Environments

| Env | Origin | Wrangler env | Data |
|---|---|---|---|
| production | `nuniversity.<domain>` (CF Pages) | `--env production` | real users; alarms; backup crons |
| staging | `staging.<domain>` | `--env staging` | e2e target; fixtures; synthetic load |
| local | `localhost:8787` (API) + `:3000` (web) | local | miniflare D1/R2/KV |

## 2. Secrets inventory & rotation calendar

Implemented inventory lives in `04-CONTRACT.md §8`. Ops rules:

- Created/updated **only** via `wrangler secret put <NAME> --env <stage>` — never in repo, never in dashboards text.
- **Rotation calendar (admin task, reminder in issue tracker):**

| Secret | Cadence |
|---|---|
| `CF_API_TOKEN` (CI deploy) | 180 days; revoke immediately on staff change |
| `GEMINI_API_KEY` / `GROQ_API_KEY` | 90 days, or on provider alert |
| `GH_PROMOTION_TOKEN` | 90 days; scoped minimal |
| `MODERATION_KEY` | 180 days |
| Supabase JWT keys | rotate via Supabase dashboard if needed (JWKS auto) |

Verified access review: quarterly check of Cloudflare members, Supabase members, repo write access.

## 3. Deploy procedures

### 3.1 Web (static, both origins)

```bash
npm run build                 # prebuild indexes + next build + postbuild + verify gates
npx wrangler pages deploy out --project-name nuniversity-prod   # CF Pages (primary)
# GH Pages: unchanged workflow .github/workflows/nextjs.yml on push to main
```

Deploy = single artifact to both origins (DR-05). Sizes gates: 900 MB warn (unchanged).

### 3.2 API (workers)

```bash
npx wrangler d1 migrations apply nuniversity-staging --env staging   # MIGRATIONS FIRST
cd workers/api && npx wrangler deploy --env staging                  # then API
# prod: same two commands with --env production after staging e2e green
```

Order rule: never deploy API before its migrations exist (startup check asserts schema_version).

### 3.3 Packs (content DB layer)

```bash
node scripts/packs/emit-content-packs.mjs --env staging   # emits packs/v{N} + manifest
npx wrangler d1 execute nuniversity-staging --command \
  "UPDATE sync_flags SET value='{N}' WHERE key='active_pack_version'"
# prod: same with production env (version = N+1; old versions retained until pruning)
```

Pack publish does **not** redeploy the site (the whole point — 04 §3).

## 4. Database operations (D1)

- **Schema change flow:** new migration file → PR → staging apply → contract tests → prod apply.
- **Backup:** nightly cron writes `exports/d1-{date}.sql.gz` to R2; retention 90 days (06 §5).
- **Restore drill (quarterly):** restore staging from latest export:
  ```bash
  gunzip -c r2:exports/d1-latest.sql.gz | npx wrangler d1 execute --local --file -
  ```
  Verify row counts + a sync journey against the restored staging.
- **Time Travel:** for last-7-day disasters, prefer `wrangler d1 time-travel <db>` over export.
- **Storage watch:** `progress_events` archive to R2 when table > 150 MB (06 §5).

## 5. Scheduled jobs (Cron)

| Cron (Workers) | Schedule | Job | Failure handling |
|---|---|---|---|
| export-backup | `15 3 * * *` | D1 → R2 gzip dump | alert if missing 2 nights |
| budget-reset | `0 0 * * *` | roll yesterday's ledger; open new day | idempotent (upserts) |
| ttl-sweep | `30 * * * *` | delete expired `ai_outputs` + empty cache artifacts | idempotent |
| promotion-collector | `0 4 * * *` | collect `published` outputs → GitHub issue/PR-draft | retention on already-opened issues |
| pack-manifest-watch | `*/10 * * * *` | verify manifest↔D1 flags coherence | flips `maintenance_mode` on divergence |

## 6. Monitoring & dashboards

| Signal | Panel/alert | Source |
|---|---|---|
| API health | uptime monitor on `/api/health` 1-min cadence; alert 3× | UptimeRobot-class monitor (free) |
| error rate / latency | p95 per route > budget (04 §4.4) | Workers analytics + logs |
| capacity burn | `GET /api/admin/usage` table vs 06 §5 thresholds | `budget_ledger` |
| security events | rate-limit spikes; auth failures; moderation blocks > 5% | logs query |
| Supabase keep-alive | weekly login smoke | ops checklist §9 |
| CI | `api.yml`/`packs.yml` red > 1 day | GitHub → email |

## 7. Incident playbook

### I-1 — Provider quota exhausted (rung 2/3)
Symptom: `429 budget_exhausted` rise; neurons/circuits degraded. 
Action: normally *no action* — degradation is designed-in. Verify `admin/usage` matches; if a bug
(e.g. a client loop) — freeze the offending client (KV block), patch, refund budgets as needed.

### I-2 — IdP outage (Supabase)
Action: verify actual impact first; anonymous sessions (JWT valid until expiry) continue to
work. If refresh is failing: switch the login UI to an "offline mode" copy; no data loss; post a
status note. DR-01 keeps D1 authoritative — nothing to restore.

### I-3 — D1 unreachable/latency spike (rung 4)
Action: confirm `health` banner auto-switches; investigate. No code changes needed for UX.
Check quota (`503 from D1` vs incident); consider Time Travel only for corruption.

### I-4 — Bad pack published (wrong content)
Action: repoint `sync_flags.active_pack_version` to N−1 (§4 flow) — clients refetch manifest
within 2 min; static site unaffected. Root-cause via pack parity test before re-publish.

### I-5 — Moderation escape (harmful AI output published)
Action: takedown `ai_outputs.status='rejected'` via admin route and purge R2 cache artifact;
raise severity in findings register; tighten moderation rules; re-run eval set. Add to
`07-TESTING-QA.md` adversarial set.

### I-6 — Secret leak
Action: rotate per §2 immediately; gitleaks full-scan; verify suspicious usage logs; postmortem.

## 8. Rollback procedures

| What | How | Recovery time |
|---|---|---|
| Static site | DNS → GH Pages origin (deployed identical artifact; DR-05) | minutes |
| API | `wrangler deploy` of previous git tag (`--env production`) | minutes |
| Packs | manifest version pointer rollback (I-4) | ≤ 2 min propagation |
| D1 | Time Travel (≤7d) or nightly export restore (drill-proven) | ≤ 30 min |
| Full M2 retreat | disable Worker routes (maintenance_mode), DNS→GH Pages; M1 intact by design | hours |

## 9. Weekly ops checklist (30–45 min)

- [ ] `admin/usage` vs 06 §5 thresholds; note anomalies
- [ ] Cron logs: 5 jobs succeeded each night
- [ ] Moderation sample: 10 recent `pending`→`moderated` outputs spot-reviewed
- [ ] Supabase keep-alive smoke (weekly login) + project not paused
- [ ] Uptime monitors green; error budget remaining
- [ ] Backup restored *to throwaway* monthly (drill), quarterly to staging
- [ ] Secrets rotation ledger updated if within 30 days of a due date
- [ ] Docs: any provider-limit change → update 06 §1 ledger (CI docs-lint also enforces date)
