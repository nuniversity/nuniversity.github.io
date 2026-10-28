// Browser integration — theme persistence and system-preference honoring.
// lib/theme/theme.ts: <html> gets class "dark" + data-theme + colorScheme,
// stored under the `theme` key (raw string).
import { test, expect } from '../support/fixtures'
import { HomePage } from '../support/page-objects/HomePage'

test.describe('theme', () => {
  test('manual toggle persists across reload', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await home.expectHydrated()

    const before = await page.locator('html').getAttribute('data-theme')
    await home.themeToggle.click()
    const after = await page.locator('html').getAttribute('data-theme')
    expect(after).not.toBe(before)

    await page.reload()
    await home.expectHydrated()
    const persisted = await page.locator('html').getAttribute('data-theme')
    expect(persisted, 'theme survives reload via localStorage').toBe(after)
  })

  test('first visit honors prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    const home = new HomePage(page)
    await home.goto()
    await home.expectHydrated()
    // With a clean slate, the init script must resolve to the system scheme.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})
