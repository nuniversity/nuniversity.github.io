# Unit test harness — invariants

## Files

| File | Role |
|---|---|
| `vitest.config.ts` | jsdom project; automatic JSX; mocks/globals restored; guards; coverage |
| `vitest.artifact.config.ts` | Node project for `tests/artifact/**` against `out/` |
| `tests/setup/guards.ts` | fails on unexpected console error/warn and React `act()` warnings |
| `src/test-setup.ts` | browser API stubs, RTL cleanup, reduced-motion default |
| `.coverage/coverage-summary.json` | produced by `npm run test:coverage`; floor gate input |
| `.opencode/skills/unit-tests/references/coverage-floor.json` | the ratchet |

## Config contract

`vitest.config.ts` guarantees:

- `environment: 'jsdom'`, `globals: true`.
- `esbuild.jsx: 'automatic'` — tests must not import React just for JSX.
- `restoreMocks`, `clearMocks`, `unstubGlobals`, `unstubEnvs` — do not repeat
  this in every file; do assert that a stub was applied.
- `setupFiles: src/test-setup.ts, tests/setup/guards.ts`.
- `exclude` includes `tests/e2e` (browser suite is Playwright-only).
- coverage provider v8 with `lines/statements/functions/branches` thresholds.

`vitest.artifact.config.ts`:

- Node environment, no jsdom, include `tests/artifact/**/*.test.mjs`.
- Every artifact suite declares `describe.skipIf(!OUT_READY)`; the helper throws
  in CI/`EXPECT_ARTIFACT=1` when `out/` is missing, so CI cannot silently skip.

## Command reference

```bash
npx vitest run tests/path/file.test.tsx -t "name"   # one behaviour
npx vitest run tests/path/file.test.tsx             # one file
npm test                                            # all unit/component tests
npm run test:coverage                               # coverage + threshold gate
npm run test:artifact                               # built export contract
npm run test:ci                                     # typechecks + coverage + artifact
npm run verify:full                                 # artifact + browser E2E
```

Expected shape today: ~74 test files, ~1,500 passing, 116 live-link skips.

## Console / act guard

`tests/setup/guards.ts` throws after a test if `console.error` or `console.warn`
was called with anything not in its allowlist. This deliberately includes
React's `Warning: An update to … was not wrapped in act(...)`.

Legitimate allowance (rare):

```ts
// tests/setup/guards.ts
const ALLOWED: RegExp[] = [
  // jsdom has no layout engine; a third-party widget logs once on install.
  /Not implemented: window\.scrollTo/,
]
```

Rules:

- Add the **narrowest** pattern that matches the message.
- Add a comment naming the source.
- Never allowlist a whole category.
- Prefer fixing the async source; the guard exists to catch leaked promise/state.

## Browser API stubs

`src/test-setup.ts` provides: `matchMedia` (reduced-motion = true, colour scheme =
light), `scrollIntoView`, `scrollTo`, `IntersectionObserver`, `ResizeObserver`, and
explicit `afterEach(cleanup)`. Components depending on those behave deterministically.

## Coverage ratchet

```json
// references/coverage-floor.json
{ "lines": 56, "statements": 56, "functions": 71, "branches": 72 }
```

```bash
npm run test:coverage
.venv/bin/python .opencode/skills/unit-tests/scripts/coverage_gate.py
```

- Missing summary → exit 2.
- Any metric below floor → exit 2 with actual/floor deltas.
- All metrics above → exit 0, prints how many points are available.
- When coverage improves deliberately, edit `coverage-floor.json` **upward** in the
  same change. Never lower a number to make a build pass.
