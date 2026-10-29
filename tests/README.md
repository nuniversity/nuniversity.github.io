# Test suite conventions

Five layers, each with a different job:

| Layer | Command | Runs in |
|---|---|---|
| Unit / component (jsdom) | `npm test` | local, pre-commit (related files), CI |
| Coverage gate | `npm run test:coverage` | CI |
| Built-artifact contract | `npm run test:artifact` | pre-commit, local |
| Browser E2E | `npm run test:e2e` | pre-commit, local |
| Content validators (pytest) | `npm run validate:courses` / pytest | CI |

## Rules

- **Determinism first.** No real clock, no real randomness, no real network.
  Use `tests/support/` helpers and `vi.useFakeTimers`.
- **Console output is a failure.** `tests/setup/guards.ts` fails a test on any
  unexpected `console.error`/`console.warn`, including React `act()` warnings.
  Allowlist only with a narrow pattern and a comment.
- **No skipped tests without a reason.** Conditional skips are reserved for
  environment-only suites (live external links). The artifact suites fail hard
  in CI when `out/` is missing.
- **E2E imports** `test`/`expect` from `tests/e2e/support/fixtures.ts`, never
  from `@playwright/test`, so storage isolation and the console guard apply.
- **Locators:** prefer `getByRole` or `getByTestId`. If `getByText` is
  unavoidable, use `exact: true` and ensure the string is unique.
- **No `waitForTimeout`.** Wait on the user-visible state (Playwright web-first
  assertions or `expect.poll`).
- **Speech:** opt into the `speech` fixture. Headless browsers have no voices;
  real synthesis must never be required for a test to pass.
- **External assets:** the fixture replaces non-local images with a 1x1 GIF;
  tests must not depend on third-party availability.
- **Accessibility:** serious/critical axe violations are zero-budget on the
  covered surfaces (`tests/e2e/integration/accessibility.spec.ts`).

## Adding a test

1. Unit/component → `tests/<area>/<name>.test.tsx`.
2. Built output → `tests/artifact/<name>.test.mjs` (derive expectations from
   `content/` or `out/`, never hardcode counts that content growth changes).
3. User journey → `tests/e2e/journeys/`; cross-page wiring →
   `tests/e2e/integration/`.

Run the narrowest layer while iterating; run `npm run verify:full` before
committing changes that touch production code (the pre-commit hook also runs
artifact + E2E when a build exists).
