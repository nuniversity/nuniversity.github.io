---
name: vitest
description: Runs and writes JavaScript/TypeScript tests using Vitest, including mocking, coverage, and snapshot testing
triggers:
  - "**/*.test.{js,ts,jsx,tsx}"
  - "**/*.spec.{js,ts,jsx,tsx}"
  - "**/__tests__/**"
  - "**/vitest.config.*"
  - "**/vite.config.*"
  - "**/package.json"
---

# Vitest Skill

## Activation Context

Activate when the user requests running, writing, or debugging JavaScript/TypeScript tests using Vitest.

---

## Instructions

### Step 1: Discover Project Configuration

```bash
# Check for vitest config
ls vitest.config.* vite.config.* 2>/dev/null

# Check for test directories
find . -type d -name "__tests__" -o -name "tests" 2>/dev/null

# Check package.json for vitest
cat package.json | grep vitest
```

### Step 2: Run Tests

```bash
# Run all tests
npx vitest run

# Watch mode
npx vitest

# With coverage
npx vitest run --coverage

# Specific file
npx vitest run tests/example.test.ts

# Specific test
npx vitest run -t "test name"

# UI mode
npx vitest --ui
```

### Step 3: Write Tests

Follow Vitest conventions:
- Test files: `*.test.ts` or `*.spec.ts`
- Test functions: `it()` or `test()`
- Describe blocks: `describe()`
- Setup in `beforeEach`/`beforeAll`

### Step 4: Use Matchers

```typescript
import { describe, it, expect } from 'vitest'

describe('example', () => {
  it(' equality', () => {
    expect(1 + 1).toBe(2)
  })

  it('deep equality', () => {
    expect({ a: 1 }).toEqual({ a: 1 })
  })

  it('truthiness', () => {
    expect(true).toBeTruthy()
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
  })

  it('numbers', () => {
    expect(5).toBeGreaterThan(3)
    expect(0.1 + 0.2).toBeCloseTo(0.3)
  })

  it('strings', () => {
    expect('hello').toContain('ell')
    expect('Hello').toMatch(/^H/)
  })

  it('arrays', () => {
    expect([1, 2, 3]).toContain(2)
    expect([1, 2, 3]).toHaveLength(3)
  })

  it('exceptions', () => {
    expect(() => throw Error()).toThrow()
  })
})
```

### Step 5: Mocking

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock module
vi.mock('./api', () => ({
  fetchData: vi.fn(),
}))

import { fetchData } from './api'

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches data', async () => {
    vi.mocked(fetchData).mockResolvedValue({ data: 'test' })
    const result = await fetchData()
    expect(result).toEqual({ data: 'test' })
    expect(fetchData).toHaveBeenCalledOnce()
  })
})
```

### Step 6: Snapshots

```typescript
it('matches snapshot', () => {
  const obj = { name: 'test', value: 42 }
  expect(obj).toMatchSnapshot()
})

it('matches inline snapshot', () => {
  expect(formatDate(new Date('2024-01-01'))).toMatchInlineSnapshot('"2024-01-01"')
})
```

### Step 7: Coverage

```bash
# Generate coverage
npx vitest run --coverage

# With reporter
npx vitest run --coverage --reporter=text --reporter=html

# Coverage thresholds in vitest.config.ts
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
  }
}
```

---

## Output Format

Vitest output follows standard format:

```
 ✓ tests/example.test.ts (2 tests) 5ms
   ✓ add > should add two numbers
   ✓ add > should handle negatives

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  10:30:00
   Duration  200ms
```

---

## Quality Rules

- Rule 1: All tests must be deterministic
- Rule 2: Tests must not depend on execution order
- Rule 3: Mocks must be cleared between tests
- Rule 4: Snapshots must be reviewed on update
- Rule 5: Coverage threshold must be met

---

## Reference

See `references/vitest-guide.md` for more details.
