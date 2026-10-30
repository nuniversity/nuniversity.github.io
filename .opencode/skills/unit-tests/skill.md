---
name: unit-tests
description: Plans, writes, hardens and gates Vitest unit, component and built-artifact tests with deterministic clocks, storage isolation, console guards and coverage floors
triggers:
  - tests/**
  - vitest.config.ts
  - vitest.artifact.config.ts
  - src/test-setup.ts
  - tests/setup/**
  - package.json
---

# Unit Tests — Deterministic Vitest Harness

## Activation Context

Use this skill for any work on the **non-browser test layers** of this repo:

- writing or changing tests under `tests/**` except `tests/e2e/**`;
- component tests with React Testing Library in jsdom;
- integration-style tests that render several components together;
- built-artifact tests under `tests/artifact/**`;
- the harness itself: `vitest.config.ts`, `vitest.artifact.config.ts`,
  `tests/setup/guards.ts`, `src/test-setup.ts`, coverage floors;
- triaging `act()` warnings, console errors, leaked storage, flaky time/RNG.

Not in scope:

- Playwright/browser tests and their fixtures → use the **`e2e-tests`** skill.
- Python validators → use the **`pytest`** skill.
- Generic Vitest API questions that do not touch this repo → the **`vitest`** skill.

Standing repo rules: never `git commit`; use `grep` not `rg`; Python entry point is
`.venv/bin/python` (or `uv run --no-sync`); deterministic scripts exit **0 pass / 2 block**;
scratch work belongs in `.scratch/`.

---

## Instructions

### Phase 0 — Route the request to the correct layer

| The question is… | Layer | Where | Command |
|---|---|---|---|
| Does this function/component behave correctly? | unit/component | `tests/<area>/*.test.tsx` | `npx vitest run <file>` |
| Do several components/pages cooperate in jsdom? | component integration | `tests/components/`, `tests/practice/`, … | same |
| Does the built export honour its hosting contract? | artifact | `tests/artifact/*.test.mjs` | `npm run test:artifact` |
| Does a real browser journey work? | E2E | `tests/e2e/**` | `e2e-tests` skill |
| Is coverage slipping? | coverage | `.coverage/coverage-summary.json` | `npm run test:coverage` |

Choose the **lowest layer that can catch the regression**. Do not add a browser test
for logic a jsdom test can prove; do not add a unit test for a hosting/URL contract
that the artifact suite already owns.

### Phase 1 — Load the harness contract (never re-derive it)

Read `references/harness.md` before touching config. The invariants it records:

- `vitest.config.ts` uses jsdom, automatic JSX, and restores/clears mocks, stubs and
  env automatically. Do not add per-file boilerplate that the config already does.
- `tests/setup/guards.ts` fails a test on unexpected `console.error` / `console.warn`,
  including React `act()` warnings. Allowed noise is a narrow regex plus a comment.
- `src/test-setup.ts` installs `matchMedia`, `scrollIntoView`, `scrollTo`,
  `IntersectionObserver`, `ResizeObserver`, explicit RTL cleanup, and a
  **reduced-motion default**. Tests behave as if `prefers-reduced-motion: reduce`.
- Coverage thresholds in `vitest.config.ts` are a ratchet (currently 56/56/71/72 for
  lines/statements/functions/branches). Raise them; never lower them.

### Phase 2 — Write the test

1. Find the nearest existing suite first (`tests/components`, `tests/lessons`,
   `tests/language-courses`, `tests/quizzes`, `tests/practice`, `tests/review`,
   `tests/gamification`, `tests/progress`, `tests/search`, `tests/seo`,
   `tests/speech`, `tests/library`, `tests/ui`, `tests/courses`,
   `tests/artifact`). Extending a suite is preferred to creating a parallel one.
2. Name the file after the unit under test, e.g. `lesson-audio.test.tsx`.
3. Arrange → act → assert. Use typed inline fixtures; avoid snapshots and
   `as any` (use a factory or a precise type).
4. Query like a user: `getByRole(..., { name })`, `getByLabelText`,
   `getByTestId`; use `findBy*`/`waitFor` for asynchronous UI. Avoid raw
   `querySelector` unless the DOM itself is the contract.
5. Assert the contract, not the implementation: visible text, ARIA state, emitted
   callbacks, stored values, computed output. Do not assert utility class names
   unless the class is the only observable signal.
6. For a bug: write the failing regression test **first**, then fix the code.
7. If the test provokes expected console noise, do **not** silence it globally.
   Add a narrow pattern to `tests/setup/guards.ts` only when unavoidable, with a
   comment naming the real source.

Full recipes: `references/determinism.md` and the `examples/` folder.

### Phase 3 — Determinism checklist (blocking)

- **Clock:** never `Date.now()` or `new Date()` in a test. Use
  `vi.useFakeTimers({ now })` + `vi.setSystemTime`, or pass an explicit date.
- **RNG:** never `Math.random()` in a test. Seed/inject the source, or assert a
  property (length, membership) instead of exact output.
- **Network:** no real `fetch`. Stub at the boundary with a hardcoded response;
  no live URL, no remote asset.
- **Storage:** start from an empty, namespaced store; restore in `afterEach`.
  Do not share module-level mutable state between tests.
- **Motion/time:** the harness reports reduced motion; do not wait for animation
  durations. Advance fake timers instead.
- **Async:** await user events and `findBy*`/`waitFor`; never leave a floating
  promise that can update state after the test ends (that is an `act()` failure).
- **Platform stubs:** speech, observers, storage, locale and media are stubbed
  centrally. Do not add per-test `window` monkey-patching if the setup covers it.

Run the deterministic hygiene gate after editing:

```bash
.venv/bin/python .opencode/skills/unit-tests/scripts/check_unit_hygiene.py
```

Exit `2` means a banned pattern (skips, `console.log`, nondeterministic
clock/randomness, `@ts-ignore`, `screen.debug`, `waitForTimeout`). Use
`--report-only` only to inspect an existing tree; never commit with violations.

### Phase 4 — Run and triage

```bash
# narrow iteration
npx vitest run tests/components/foo.test.tsx -t "behaviour"

# affected file, then full suite
npx vitest run tests/components/foo.test.tsx
npm test

# coverage + floor
npm run test:coverage
.venv/bin/python .opencode/skills/unit-tests/scripts/coverage_gate.py

# artifact contract (after a build exists)
npm run test:artifact
```

Triage order for a red test:

1. Read the first failure only; later failures are usually cascade.
2. Console/`act()` guard failure → find the unresolved promise or state update,
   not the assertion.
3. `Not implemented: window.*` → add a harmless stub in `src/test-setup.ts`;
   never suppress the guard.
4. Storage leakage → clear the namespace and assert the fresh state.
5. Time/RNG flake → replace the source with an injected/fake value.
6. If the production contract changed, update the test deliberately; never
   loosen an assertion just to go green.

### Phase 5 — Gates and wrapup

Run, in this order, and report the exact results:

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
.venv/bin/python .opencode/skills/unit-tests/scripts/coverage_gate.py
npm run test:artifact        # only when out/ is fresh
```

Stop when all of these pass. Report:

- test files/tests added or changed;
- pass/skip counts;
- coverage percentages vs the recorded floor;
- any console guard allowlist added and why;
- whether the artifact suite ran or was skipped for a missing build.

---

## Hard Rules

| Rule | Reason |
|---|---|
| No `.only`, `.skip`, `.todo` in committed tests | silently removes coverage |
| No `console.log` / `screen.debug()` | leaked debug output |
| No `@ts-ignore` | hides a real contract break; use `@ts-expect-error` + reason |
| No `waitForTimeout` | fixed sleeps are the main source of flake |
| No real clock/RNG/network | reproducibility |
| No lowering coverage floors | ratchet only moves up |
| Do not touch `tests/e2e/**` here | owned by `e2e-tests` |
| Do not weaken the console/act guard | it is the suite's smoke detector |

## Reference Map

| File | Use |
|---|---|
| `references/harness.md` | config, guards, setup, artifact layer, exact invariants |
| `references/determinism.md` | recipes for fake time/RNG/storage/network/async |
| `examples/good/` | canonical component + integration test patterns |
| `examples/bad/` | the exact anti-patterns the hygiene gate blocks |
| `scripts/check_unit_hygiene.py` | deterministic repo hygiene gate |
| `scripts/coverage_gate.py` | coverage floor comparison (read-only) |
