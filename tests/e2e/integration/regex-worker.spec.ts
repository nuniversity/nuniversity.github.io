import { test, expect } from '../support/fixtures'

// The Regex Tester evaluates patterns inside a web worker. A catastrophic
// backtracking pattern must be terminated by the watchdog instead of freezing
// the main thread, and the normal path must still return results.
test.describe('regex tester worker', () => {
  test('renders match results for the default pattern', async ({ page }) => {
    await page.goto('/en/tools/regex-tester/')
    await page.waitForSelector('html[data-hydrated="true"]')

    await page.getByLabel(/Regular Expression/i).fill('\\d+')
    await page.getByLabel(/Test String/i).fill('a1 b22 c333')

    await expect(page.getByText('3 matches')).toBeVisible()
    await expect(page.getByTestId('regex-highlighted')).toContainText('333')
  })

  test('times out a catastrophic pattern instead of hanging the page', async ({ page }) => {
    await page.goto('/en/tools/regex-tester/')
    await page.waitForSelector('html[data-hydrated="true"]')

    await page.getByLabel(/Regular Expression/i).fill('(a+)+$')
    await page.getByLabel(/Test String/i).fill(`${'a'.repeat(34)}!`)

    // The worker is terminated after ~2s; the UI must report it and stay usable.
    await expect(page.locator('#regex-error')).toContainText(/timed out|tiempo|tempo/i, {
      timeout: 10_000,
    })

    // The rest of the tool is still interactive.
    await page.getByLabel(/Regular Expression/i).fill('\\d+')
    await page.getByLabel(/Test String/i).fill('7')
    await expect(page.getByText('1 matches')).toBeVisible()
  })
})
