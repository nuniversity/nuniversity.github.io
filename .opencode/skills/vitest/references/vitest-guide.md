# Vitest Quick Reference

## Installation

```bash
npm install -D vitest @vitest/coverage-v8 @vitest/ui
```

## Running Tests

```bash
# Run all tests
npx vitest run

# Watch mode
npx vitest

# With coverage
npx vitest run --coverage

# Specific file
npx vitest run tests/example.test.ts

# By test name
npx vitest run -t "test name"

# UI mode
npx vitest --ui

# Reporter
npx vitest run --reporter=verbose
```

## Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
```

## Test Structure

```typescript
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

describe('suite', () => {
  beforeAll(() => { /* once */ });
  beforeEach(() => { /* each test */ });

  it('test', () => {
    expect(true).toBe(true);
  });
});
```

## Matchers

```typescript
// Equality
expect(a).toBe(b)
expect(a).toEqual(b)
expect(a).toStrictEqual(b)

// Truthiness
expect(a).toBeTruthy()
expect(a).toBeFalsy()
expect(a).toBeNull()
expect(a).toBeUndefined()
expect(a).toBeDefined()

// Numbers
expect(a).toBeGreaterThan(b)
expect(a).toBeGreaterThanOrEqual(b)
expect(a).toBeLessThan(b)
expect(a).toBeCloseTo(b, digits)

// Strings
expect(a).toContain(b)
expect(a).toMatch(/regex/)

// Arrays
expect(a).toContain(b)
expect(a).toHaveLength(n)

// Objects
expect(a).toHaveProperty('key')
expect(a).toHaveProperty('key', value)

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow(Error)
expect(async fn()).rejects.toThrow()

// Snapshots
expect(a).toMatchSnapshot()
expect(a).toMatchInlineSnapshot('"inline"')
```

## Mocking

```typescript
// Mock function
const mockFn = vi.fn()
mockFn.mockReturnValue(42)
mockFn.mockResolvedValue(42)
mockFn.mockRejectedValue(new Error())

// Spy on method
const spy = vi.spyOn(obj, 'method')
spy.mockReturnValue('mocked')

// Mock module
vi.mock('./module', () => ({
  fn: vi.fn(),
}))

// Mock timer
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.useRealTimers()

// Clear mocks
vi.clearAllMocks()
vi.resetAllMocks()
vi.restoreAllMocks()
```

## Lifecycle

```typescript
beforeAll(() => { /* suite start */ })
afterAll(() => { /* suite end */ })
beforeEach(() => { /* before each test */ })
afterEach(() => { /* after each test */ })
```

## Parametrize

```typescript
// it.each
it.each([
  [1, 1, 2],
  [2, 3, 5],
])('adds %i + %i = %i', (a, b, expected) => {
  expect(a + b).toBe(expected);
});

// describe.each
describe.each([
  { a: 1, b: 1, expected: 2 },
  { a: 2, b: 3, expected: 5 },
])('addition', ({ a, b, expected }) => {
  it(`${a} + ${b} = ${expected}`, () => {
    expect(a + b).toBe(expected);
  });
});
```

## Coverage

```bash
# Generate report
npx vitest run --coverage

# Providers
npx vitest run --coverage --provider=v8
npx vitest run --coverage --provider=istanbul
```

## Common Commands

```bash
# Typecheck
npx vitest typecheck

# Benchmark
npx vitest bench

# Inspect
npx vitest --inspect
npx vitest --inspect-brk
```
