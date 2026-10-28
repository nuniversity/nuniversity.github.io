// Browser integration — the shipped pages must hydrate and respond.
// Asserts zero console errors on key surfaces and that client wiring works
// (theme toggle mutates <html>, the aria-label moves from the static
// "Toggle theme" to "Switch to … theme" after hydration).
//
// KNOWN ISSUE (waived): Next 14.2 static export emits RSC payloads as
// `{route}/index.txt` while the client prefetches `{route}.txt?_rsc=…`, so
// every router prefetch 404s (in production on GitHub Pages too). Next falls
// back to a full page load on click — degraded prefetch, working navigation.
// Those 404 console messages are whitelisted; every other error fails.
import { test, expect } from '../support/fixtures'
import { HomePage } from '../support/page-objects/HomePage'

const SURFACES = ['/', '/courses/', '/quizzes/', '/tools/', '/games/'] as const

test.describe('hydration smoke', () => {
  for (const surface of SURFACES) {
    test(`page hydrates without console errors: ${surface}`, async ({ page }) => {
      const consoleErrors: string[] = []
      const rscPrefetch404s: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })
      page.on('response', (res) => {
        if (res.status() === 404 && res.url().includes('_rsc=')) {
          rscPrefetch404s.push(res.url())
        }
      })
      page.on('pageerror', (err) => consoleErrors.push(String(err)))

      const home = new HomePage(page)
      await page.goto(surface === '/' ? '/en/' : `/en${surface}`)
      await home.expectHydrated()

      // The React runtime must be attached: clicking the theme button flips
      // the <html> theme attribute (CSS class swap, no hydration mismatch).
      const before = await page.locator('html').getAttribute('data-theme')
      await home.themeToggle.click()
      const after = await page.locator('html').getAttribute('data-theme')
      expect(after, 'theme attribute toggles').not.toBe(before)
      expect(['light', 'dark']).toContain(after as string)

      // Whitelist the known RSC-prefetch 404 console noise (message text does
      // not carry the URL, so gate on the observed 404 count).
      const realErrors = consoleErrors.filter(
        (text) =>
          !(
            rscPrefetch404s.length > 0 &&
            /^Failed to load resource: the server responded with a status of 404/.test(text)
          )
      )
      expect(realErrors, `console errors on ${surface}: ${realErrors.slice(0, 5).join(' | ')}`).toEqual([])
      // And log the known issue so the noise stays visible.
      if (rscPrefetch404s.length) {
        console.warn(`  ⚠ ${surface}: ${rscPrefetch404s.length} RSC prefetch 404s (Next 14.2 static-export quirk)`)
      }
    })
  }
})
