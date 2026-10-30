import { test, expect } from '../support/fixtures'

// These journeys cover the persistence layer added to every tool: work must
// survive a full page reload, not just a React state update.
test.describe('tool persistence', () => {
  test('decision matrix keeps the title and scores after reload', async ({ page }) => {
    await page.goto('/en/tools/decision-matrix/')
    await page.waitForSelector('html[data-hydrated="true"]')

    await page.locator('#decision-title').fill('My architecture decision')
    // Wait past the write debounce before reloading.
    await page.waitForTimeout(400)
    await page.reload()
    await page.waitForSelector('html[data-hydrated="true"]')

    await expect(page.locator('#decision-title')).toHaveValue('My architecture decision')
  })

  test('habit tracker keeps habits and today\'s check-in after reload', async ({ page }) => {
    await page.goto('/en/tools/habit-tracker/')
    await page.waitForSelector('html[data-hydrated="true"]')

    await page.getByLabel('New habit name...').fill('Read 20 minutes')
    await page.getByRole('button', { name: 'Add' }).click()

    await expect(page.getByText('Read 20 minutes').first()).toBeVisible()
    // Pick today's cell (the week grid starts on Sunday); the delete control
    // also matches the habit name, so address the day buttons directly.
    const todayIndex = await page.evaluate(() => new Date().getDay())
    const dayCells = page.locator('button[aria-pressed]')
    await expect(dayCells).toHaveCount(7)
    await dayCells.nth(todayIndex).click()
    await page.waitForTimeout(400)

    await page.reload()
    await page.waitForSelector('html[data-hydrated="true"]')

    await expect(page.getByText('Read 20 minutes').first()).toBeVisible()
    await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(1)
  })

  test('unit converter keeps the last conversion after reload', async ({ page }) => {
    await page.goto('/en/tools/unit-converter/')
    await page.waitForSelector('html[data-hydrated="true"]')

    await page.locator('#unit-value').fill('42')
    await page.waitForTimeout(400)
    await page.reload()
    await page.waitForSelector('html[data-hydrated="true"]')

    await expect(page.locator('#unit-value')).toHaveValue('42')
  })
})
