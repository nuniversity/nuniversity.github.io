# Archive — historical documentation

Everything under this folder is **kept for provenance only**. Each file carries a
`HISTORICAL — superseded` banner. Do not follow these documents as current guidance.

| Folder | What it contains | Superseded by |
|---|---|---|
| `2026-10-26-full-audit/` | First full audit (31 findings: security, architecture, performance, a11y, UX, content) | `docs/_private/security-2026-10-31/` (gitignored), `docs/milestone-m2/01-ASSESSMENT-M1.md` |
| `2026-app-review/` | Application/harness review, fix inventory, executed phase plans (3–6), improvement portfolio, `PLAN-MODERNIZATION.md` | `docs/milestone-m2/` (architecture decisions DR-01/02/09 supersede its Clerk/Neon/PostHog choices) |
| `ASSESSMENT-legacy-2026-09-06.md` | Legacy September audit | all later assessments |

Active documents that used to live with these sets:

- `docs/operations/GATE-WAIVERS.md` — still enforced by CI (the only file moved out of the archive).
- `docs/assessment/2026-10-28-courses-learning-engine/` — active: phases 0–3 implemented, 4–6 pending.

**Policy:** do not add new material here. New assessments go to `docs/assessment/<date>/`;
current architecture goes to `docs/architecture/` and `docs/milestone-m2/`.

**Security documents** (open findings, reproducible probes) are intentionally kept outside the
committed tree in the gitignored `docs/_private/` folder until the queued items are fixed and the
register is sanitized.
