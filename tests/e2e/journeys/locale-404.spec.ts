// E2E journey — the 404 hosting contract + locale resolution chain.
// The postbuild 404.html stub resolves the locale in priority order:
// URL path prefix → NEXT_LOCALE cookie → navigator.language.
import { test, expect } from '../support/fixtures'

test.describe('404 journey', () => {
  test('missing path under /en/ lands on the localized 404 with the requested path', async ({ page }) => {
    await page.goto('/en/definitely-missing-page/')
    // The host serves 404.html (HTTP 404); its inline stub redirects to the
    // localized 404 route carrying the original path.
    await page.waitForURL(/\/en\/404\/\?p=/)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByText(/doesn't exist or has been moved/i)).toBeVisible()
    // The requested path is surfaced for user support.
    await expect(page.getByText(/definitely-missing-page/i)).toBeVisible()
  })

  test('missing root-level path uses the NEXT_LOCALE cookie', async ({ page }) => {
    // Simulate a user whose cookie says pt (set by the LanguageSwitcher).
    await page.addInitScript(() => {
      document.cookie = 'NEXT_LOCALE=pt; path=/; max-age=31536000; SameSite=Lax'
    })
    await page.goto('/no-such-thing/')
    await page.waitForURL(/\/pt\/404\/\?p=/)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  })

  test('missing root-level path falls back to navigator.language (es)', async ({ page }) => {
    await page.emulateMedia({ }) // no cookie
    await page.addInitScript(() => {
      // Playwright's default locale is en-US; force es for the fallback test.
      Object.defineProperty(navigator, 'language', { value: 'es-ES', configurable: true })
    })
    await page.goto('/another-missing-thing/')
    await page.waitForURL(/\/es\/404\/\?p=/)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
  })

  test('the 404 page recovers: Go to Home returns to the locale home', async ({ page }) => {
    await page.goto('/en/nope/')
    await page.waitForURL(/\/en\/404\//)
    await page.getByRole('link', { name: /go to home/i }).click()
    await expect(page).toHaveURL(/\/en\/$/)
    await expect(page.getByTestId('hero-search-input')).toBeVisible()
  })
})
