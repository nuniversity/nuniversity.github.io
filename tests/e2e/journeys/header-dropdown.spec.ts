// E2E — header Explore dropdown: the mega-panel must stay fully inside the
// viewport at the smallest desktop width (it used to be right-anchored and
// clipped off the left edge at 1024px), and Languages leads the resources.
import { test, expect } from '../support/fixtures'

test.describe('header explore dropdown', () => {
  test('panel fits the viewport and lists Languages first', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/pt/')

    await page.getByRole('button', { name: /explorar/i }).click()
    const panel = page.locator('nav[aria-label="Main"] ul.grid.grid-cols-2')
    await expect(panel).toBeVisible()

    const box = await panel.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(1024)

    // Languages (the language courses) is the first resource in the panel.
    const firstItem = panel.locator('li').first()
    await expect(firstItem).toContainText(/idiomas/i)
  })

  test('panel also fits at a wide desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 })
    await page.goto('/pt/')

    await page.getByRole('button', { name: /explorar/i }).click()
    const panel = page.locator('nav[aria-label="Main"] ul.grid.grid-cols-2')
    await expect(panel).toBeVisible()

    const box = await panel.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(1920)
  })
})
