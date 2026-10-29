import { afterEach, beforeEach } from 'vitest'

/**
 * Global console guard for unit/component tests.
 *
 * A warning or error printed during a test is almost always a real signal:
 * an unhandled promise, a React `act()` violation, a failed fetch, or an
 * accessibility/HTML nesting mistake. Vitest keeps such tests green by
 * default; this guard turns them into failures.
 *
 * Intentional console output in a test can be allowlisted here with a narrow
 * pattern and a comment explaining why it is expected.
 */

const ALLOWED: RegExp[] = [
  // jsdom does not implement layout; libraries occasionally log about it.
  /Not implemented: window\.scrollTo/,
  // React DevTools suggestion, printed by React itself in development builds.
  /Download the React DevTools/,
]

let errors: string[] = []
let warnings: string[] = []
let originalError: typeof console.error
let originalWarn: typeof console.warn

function format(args: unknown[]): string {
  return args
    .map((value) => {
      if (value instanceof Error) return value.stack ?? value.message
      if (typeof value === 'string') return value
      try {
        return JSON.stringify(value)
      } catch {
        return String(value)
      }
    })
    .join(' ')
}

function isAllowed(message: string): boolean {
  return ALLOWED.some((pattern) => pattern.test(message))
}

function isActWarning(message: string): boolean {
  return /not wrapped in act|inside a test was not wrapped in act/i.test(message)
}

beforeEach(() => {
  errors = []
  warnings = []
  originalError = console.error
  originalWarn = console.warn

  console.error = (...args: unknown[]) => {
    errors.push(format(args))
    originalError(...args)
  }
  console.warn = (...args: unknown[]) => {
    warnings.push(format(args))
    originalWarn(...args)
  }
})

afterEach(() => {
  console.error = originalError
  console.warn = originalWarn

  const unexpectedErrors = errors.filter((message) => !isAllowed(message))
  const unexpectedWarnings = warnings.filter((message) => !isAllowed(message))

  if (unexpectedErrors.length > 0 || unexpectedWarnings.length > 0) {
    const actWarning = [...unexpectedErrors, ...unexpectedWarnings].some(isActWarning)
    const details = [
      ...unexpectedErrors.map((message) => `console.error: ${message}`),
      ...unexpectedWarnings.map((message) => `console.warn: ${message}`),
    ]
    throw new Error(
      `Unexpected console output${actWarning ? ' (React act() violation)' : ''}:\n${details.join('\n')}`
    )
  }
})
