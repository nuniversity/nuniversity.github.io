# Debugging, traces and environments

## Before running

1. `out/index.html` must exist and be current. Rebuild with `npm run build` if
   source changed. The static server never reuses a stale server by default.
2. On this workstation Chromium needs user-owned shared libraries:

```bash
bash scripts/with-playwright-libs.sh npx playwright test tests/e2e/...
```

The npm scripts already use the wrapper; use it directly only for ad-hoc runs.

## Narrow → full

```bash
npx playwright test tests/e2e/journeys/foo.spec.ts -t "case"
npx playwright test tests/e2e/journeys/foo.spec.ts
npm run test:e2e
```

## Visual/debug runs (local only)

```bash
npx playwright test tests/e2e/journeys/foo.spec.ts --headed
npx playwright test tests/e2e/journeys/foo.spec.ts --debug
npm run test:e2e -- --ui
```

Never commit `page.pause()`, `--headed`, or debug-only console logging.

## Traces

On failure the fixture keeps a trace under `test-results/<case>/trace.zip`:

```bash
npx playwright show-trace test-results/<case>/trace.zip
```

Read the snapshot, console, network and source timeline before changing code.

## Flake triage

```bash
npx playwright test <file> --repeat-each=10
```

| Symptom | Likely cause | Fix |
|---|---|---|
| passes alone, fails in suite | shared storage/context | use fixture seeding; do not disable parallelism |
| fails only on slow CI | fixed sleep or `networkidle` | wait on state |
| locator strict-mode violation | duplicate text | scope to `main`/test id |
| console guard failure | real 404/JS error or expected HTTP error | fix source or narrow per-file allowlist |
| trace shows old page | stale `out/` | `npm run build` |
| browser launch error | missing system libs | wrapper or `playwright install --with-deps` |

## Cross-browser

`firefox` and `webkit` are opt-in projects and require their binaries. When they
are unavailable, say so explicitly instead of altering the test. Run:

```bash
npm run test:e2e:matrix
```

## Current CI policy

The GitHub Actions integration/E2E steps are intentionally commented out. The
browser suite runs in **pre-commit** while it stabilises. Do not move it back to
CI without an explicit user request.
