// tests/e2e/support/fixtures.ts
//
// Base fixtures for the E2E suite. Every test gets:
//   - a clean `v1:*` + `theme` localStorage slate (see storage.ts)
//   - helpers for locale-aware navigation and the root locale redirect
//
// Import `test`/`expect` from this module, never from @playwright/test
// directly, so the storage isolation applies everywhere.
import { test as base, expect, type Page } from '@playwright/test'
import { wipeScript } from './storage'

export const test = base
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
