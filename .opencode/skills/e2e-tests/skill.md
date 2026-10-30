---
name: e2e-tests
description: Plans, writes, hardens and runs Playwright browser journeys with deterministic fixtures, role-first locators, console guards and axe accessibility gates
triggers:
  - tests/e2e/**
  - playwright.config.ts
  - tests/support/static-server.mjs
  - tests/e2e/support/**
---

# E2E Tests — Deterministic Playwright Harness

## Activation Context

Use this skill for work on the **browser layer**:

- adding or changing specs under `tests/e2e/**` (journeys and integrations);
- `playwright.config.ts`, `tests/e2e/support/**`, the static test server;
- triaging flaky browser tests, ambiguous locators, console/page errors;
- accessibility checks with axe;
- cross-browser/mobile runs and Playwright environment issues.

Not in scope:

- Vitest/jsdom unit, component or artifact tests → **`unit-tests`** skill.
- CI pipeline shape → the E2E steps are currently **pre-commit only** and the
  GitHub Actions versions are intentionally commented out. Do not re-enable CI
  without the user asking.

Standing repo rules: never `git commit`; use `grep` not `rg`; Python entry point
is `.venv/bin/python`; deterministic scripts exit **0 pass / 2 block**.

---

## Instructions

### Phase 0 — Choose the right spec type

| Goal | Folder | Pattern |
|---|---|---|
| A complete user journey (hub → detail → action) | `tests/e2e/journeys/` | few, high-value flows |
| Cross-page wiring, hydration, locale, theme, search | `tests/e2e/integration/` | one contract per file |
| Route sweep / regression net | `tests/e2e/journeys/smoke-all-routes.spec.ts` | data-driven from content |

Prefer one **journey** plus focused integration checks over many shallow specs.
Do not duplicate an artifact assertion (sitemap, CSP, file size) in the browser.

### Phase 1 — Harness contract

Read `references/harness.md` before editing config. Invariants:

- `playwright.config.ts` starts a **fresh** static server on port **4310**
  (`E2E_PORT`), `reuseExistingServer` only with `E2E_REUSE_SERVER=1`.
  `E2E_BASE_URL` points the suite at an external server and disables the
  launcher.
- Tests always run against the **built export** in `out/`; run `npm run build`
  first unless the user has confirmed a fresh build.
- Import `test`/`expect` from `../support/fixtures` — never bare
  `@playwright/test` in a spec.
- The fixture gives every test:
  - clean `localStorage` (`v1:*` + `theme`) via `storage.ts`;
  - a console/pageerror guard (`allowedConsoleErrors` is per-file opt-in);
  - external images replaced with a 1×1 GIF;
  - optional deterministic `speech` synthesis;
  - optional `makeAxeBuilder`.
- Projects: `chromium` is default; `mobile-chrome`, `firefox`, `webkit` are
  opt-in. Mobile smoke is a dedicated script.

### Phase 2 — Write the spec

1. Put the user-visible contract in the test title: `[pt] course practice shows both exits`.
2. Navigate with a canonical trailing-slash URL (`/en/courses/x/practice/`).
3. Use role/test-id locators; scope to `main` when header/footer duplicates text.
4. Assert with web-first matchers (`toBeVisible`, `toHaveURL`, `toHaveAttribute`,
   `toContainText`) or `expect.poll` for custom predicates.
5. Seed state with the storage fixture, not by visiting setup pages.
6. Stub external services at the boundary (`page.route`), never depend on the
   network. Speech must use the `speech` fixture.
7. Add `test.use({ allowedConsoleErrors: [/404/] })` only when the test
   deliberately provokes that response (404 journey, mocked 400). The pattern
   must be narrow and justified in a comment.
8. For axe surfaces, use `makeAxeBuilder()` and fail on serious/critical
   violations. Do not remove a surface to make the suite green.

### Phase 3 — Determinism checklist (blocking)

- **No `waitForTimeout` and no `networkidle`.** Wait for a concrete signal.
- **No `page.pause()`**, no committed `console.log`; debug output must be
  guarded by an env flag *and* allowlisted.
- **No `.only` / `.skip` / `.todo`.**
- **No XPath, no legacy `page.click`/`page.$`.**
- **No shared state between tests**; each test gets a fresh context and storage.
- **No third-party asset dependency**; the fixture stubs external images.
- **No real speech engine**; use `speech` fixture and assert what the app sent.
- **Never reuse a stale server**; a fresh static server is part of the contract.
- When a test is genuinely flaky, reproduce and fix the cause. `--repeat-each`
  is a diagnostic, not a fix.

Run the hygiene gate after editing:

```bash
.venv/bin/python .opencode/skills/e2e-tests/scripts/check_e2e_hygiene.py
```

### Phase 4 — Run and triage

```bash
# one file / one test
npx playwright test tests/e2e/journeys/mixed-practice.spec.ts
npx playwright test tests/e2e/journeys/language-course.spec.ts -t "hub lists"

# full Chromium suite (about 90 seconds)
npm run test:e2e

# mobile project (only the mobile smoke spec)
npm run test:e2e:mobile-smoke

# repeat a suspect spec
npx playwright test tests/e2e/... --repeat-each=10
```

On this workstation Chromium needs the local shared-library bootstrap:

```bash
bash scripts/with-playwright-libs.sh npx playwright test ...
```

`npm run test:e2e` already wraps this. Headed/debug runs are allowed manually;
never leave debugging changes in a spec.

Triage order:

1. Read the first failing assertion and its locator log.
2. Ambiguous locator → scope to `main`/a test id, do not add `.first()` blindly.
3. Console guard → the message includes the failed URL; fix the source or add a
   narrow per-test allowed pattern.
4. Timeout → replace any fixed wait with a web-first assertion.
5. Stale `out/` → run `npm run build`; the server refuses to reuse.
6. Trace: `npx playwright show-trace test-results/<case>/trace.zip`.
7. Browser missing libs → use `scripts/with-playwright-libs.sh` or
   `npx playwright install --with-deps chromium`.

### Phase 5 — Gates and wrapup

Run, in order:

```bash
npm run lint
npm run typecheck:e2e
npm run test:e2e                 # Chromium
npm run test:e2e:mobile-smoke    # when touching mobile/nav
.venv/bin/python .opencode/skills/e2e-tests/scripts/check_e2e_hygiene.py
```

Report:

- specs/tests added or changed;
- pass/fail/skip counts;
- accessibility surfaces run;
- any console allowlist entry and why;
- whether a fresh build was used.

---

## Hard Rules

| Rule | Reason |
|---|---|
| Import `test` from `support/fixtures` only | storage isolation + console guard |
| No `waitForTimeout` / `networkidle` | main source of flake |
| No `.only` / `.skip` / `.todo` | silently removes coverage |
| No `page.pause()` in committed code | hangs CI/pre-commit |
| No XPath / legacy page API | brittle, bypasses auto-waiting |
| Role/test-id locators first | user-facing, resilient |
| No third-party network dependency | deterministic and offline-safe |
| No `.first()` to paper over ambiguity | fix the locator scope |
| Do not simplify the axe budget | accessibility is a product contract |
| Do not re-enable CI E2E without the user | current policy is pre-commit only |

## Reference Map

| File | Use |
|---|---|
| `references/harness.md` | config, fresh server, fixtures, projects, commands |
| `references/locators.md` | locator policy, strict-mode fixes, examples |
| `references/debugging.md` | flake triage, traces, browser libs, repeat runs |
| `references/a11y.md` | axe fixture, surface list, regression policy |
| `examples/good/` / `examples/bad/` | canonical and blocked patterns |
| `scripts/check_e2e_hygiene.py` | deterministic hygiene gate |
