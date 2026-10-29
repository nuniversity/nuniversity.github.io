// tests/e2e/support/fixtures.ts
//
// Base fixtures for the E2E suite. Every test gets:
//   - a clean `v1:*` + `theme` localStorage slate (see storage.ts)
//   - a console/pageerror guard that fails on unexpected errors
//   - helpers for locale-aware navigation and the root locale redirect
//   - optional deterministic speech and axe fixtures
//
// Import `test`/`expect` from this module, never from @playwright/test
// directly, so the isolation and guards apply everywhere.
import { test as base, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { wipeScript } from './storage'
import { installFakeSpeech } from './speech'

/** Errors that are browser/extension noise, not application failures. */
const KNOWN_CONSOLE_NOISE: RegExp[] = [
  /Download the React DevTools/,
  /ResizeObserver loop completed with undelivered notifications/,
]

interface Fixtures {
  consoleGuard: void
  speech: void
  makeAxeBuilder: () => AxeBuilder
  /** Console errors a test deliberately provokes (404 page, mocked 400, …). */
  allowedConsoleErrors: RegExp[]
}

export const test = base.extend<Fixtures>({
  allowedConsoleErrors: [[], { option: true }],

  consoleGuard: [
    async ({ page, allowedConsoleErrors }, use) => {
      const problems: string[] = []
      const failedResponses: string[] = []
      page.on('response', (response) => {
        if (response.status() >= 400) {
          failedResponses.push(`${response.status()} ${response.url()}`)
        }
      })
      page.on('pageerror', (error) => {
        problems.push(`pageerror: ${error.message}`)
      })
      page.on('console', (message) => {
        if (message.type() !== 'error') return
        const text = message.text()
        if (KNOWN_CONSOLE_NOISE.some((pattern) => pattern.test(text))) return
        const failed = failedResponses.at(-1)
        // Static export: `router.push()` asks for an RSC `.txt` payload that
        // is intentionally pruned; Next falls back to a document navigation.
        if (failed && /\.txt\?_rsc=/.test(failed)) return
        const entry = failed ? `console.error: ${text} (${failed})` : `console.error: ${text}`
        if (allowedConsoleErrors.some((pattern) => pattern.test(entry))) return
        problems.push(entry)
      })

      // Third-party thumbnails must not make the suite flaky or depend on
      // network access. Local assets are untouched; external images get a
      // 1x1 GIF.
      const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        'base64'
      )
      await page.route('**/*', (route) => {
        const request = route.request()
        if (request.resourceType() !== 'image') return route.continue()
        const host = new URL(request.url()).hostname
        if (host === '127.0.0.1' || host === 'localhost') return route.continue()
        return route.fulfill({ status: 200, contentType: 'image/gif', body: pixel })
      })

      await use()

      expect(
        problems,
        `Unexpected browser errors:\n${problems.join('\n')}`
      ).toEqual([])
    },
    { auto: true },
  ],

  // Opt in with `async ({ page, speech }) => …`; no real voices required.
  speech: async ({ context }, use) => {
    await context.addInitScript(installFakeSpeech)
    await use()
  },

  makeAxeBuilder: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    )
  },
})

export { expect }

test.beforeEach(async ({ context }) => {
  await context.addInitScript(wipeScript())
})

/**
 * Navigate to a locale-scoped route. Paths must already be the canonical
 * trailing-slash form (trailingSlash: true), e.g. gotoLocale(page, '/courses/').
 */
export async function gotoLocale(page: Page, path: string, locale = 'en') {
  await page.goto(`/${locale}${path}`)
}

/**
 * Visit the site root and assert the inline locale-redirect lands on the
 * expected locale home (the root index.html is a postbuild redirect stub).
 */
export async function expectRootRedirect(page: Page, locale = 'en') {
  await page.goto('/')
  await page.waitForURL(new RegExp(`/${locale}/`))
  await expect(page).toHaveURL(new RegExp(`/${locale}/`))
}
