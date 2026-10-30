# Determinism recipes

## Time

```ts
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date('2026-01-10T10:00:00Z') })
})
afterEach(() => {
  vi.useRealTimers()
})

// Async component: flush microtasks, then advance time.
await vi.advanceTimersByTimeAsync(1_000)
```

For a pure date utility, pass an explicit date instead of freezing the clock:

```ts
expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
```

## Randomness

Do not call `Math.random()` in a test. Prefer a property assertion:

```ts
const answer = pickAnswer(pool)
expect(pool).toContain(answer)
```

If exact output matters, inject a seeded RNG into the unit (preferred) or spy on
`Math.random` with a documented sequence:

```ts
vi.spyOn(Math, 'random').mockReturnValue(0) // always first item
```

## Network

Stub at the boundary and fail on unexpected URLs:

```ts
vi.stubGlobal('fetch', vi.fn(async (url: string) => {
  if (url === '/question-index/en/course.json') {
    return { ok: true, json: async () => fixture } as Response
  }
  throw new Error(`unexpected fetch: ${url}`)
}))
```

Never depend on a third-party URL. Never rely on the real Next data layer in a
component test.

## Storage and shared state

```ts
beforeEach(() => window.localStorage.clear())
afterEach(() => window.localStorage.clear())
```

Use the app's namespaced keys (`v1:*`); never seed unrelated browser state.
Module-level mutable variables are a test smell — prefer dependency injection.

## Promises and act()

- Await every user interaction (`await user.click(...)`).
- Use `findBy*` / `waitFor` for asynchronous UI.
- If a component updates after the test returns, the guard will fail with an
  `act()` warning. Fix the promise or unmount; do not suppress the guard.
- A mocked fetch that never resolves is useful to freeze a loading state:

```ts
vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
```

## Component queries

```ts
await user.click(screen.getByRole('button', { name: 'Start Learning' }))
expect(await screen.findByRole('heading', { name: 'Mixed practice' })).toBeVisible()
expect(screen.getByTestId('review-done')).toHaveTextContent('Session complete.')
```

- Prefer role + accessible name.
- `getByText` is fine in a unit test when the text is the contract; keep it
  specific and avoid strings that repeated chrome also renders.
- Avoid asserting generated class names; assert ARIA state or text.

## What NOT to test

- Third-party library internals.
- Exact animation timing.
- Internal function names or React internals.
- Snapshots of large HTML blobs (brittle, unreadable). Assert the few nodes that
  encode the contract.
