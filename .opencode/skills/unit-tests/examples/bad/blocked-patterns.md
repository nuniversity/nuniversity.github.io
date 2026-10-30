# Bad example — patterns blocked by the hygiene gate

```tsx
it.only('shows results', () => {          // skip-only: hides the rest of the suite
  vi.spyOn(Math, 'random')                 // randomness: undocumented
  const before = Date.now()                // nondeterministic-clock
  fetch('/real-api')                       // network: not stubbed
  render(<Widget />)
  screen.debug()                           // screen-debug
  console.log('state', document.body)      // console-log
  await page.waitForTimeout(500)           // wait-timeout
  expect(new Date().toISOString()).toMatch(/2026/) // nondeterministic-clock
})
```

Why each is blocked:

| Pattern | Harm |
|---|---|
| `.only` / `.skip` / `.todo` | silently removes coverage in CI |
| unseeded randomness | different result on every run |
| `Date.now()` / `new Date()` | test changes with the wall clock |
| real network | flaky, slow, environment-dependent |
| `screen.debug()` | leaked debug output |
| `console.log` | noise hides real failures |
| fixed sleep | flake under load; use web-first/fake-time waits |
