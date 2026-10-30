import { test, expect } from '../support/fixtures'

const COURSE = '/en/courses/agent-memory-knowledge/'
const LESSON = `${COURSE}01-foundations-of-agent-memory/`

test.describe('PDF export', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __printed: number }).__printed = 0
      window.print = () => {
        ;(window as unknown as { __printed: number }).__printed += 1
      }
    })
  })

  test('exports the current lesson through the print sheet', async ({ page }) => {
    await page.goto(LESSON)

    await page.getByTestId('print-lesson-pdf').click()

    const sheet = page.getByTestId('pdf-sheet')
    await expect(sheet).toBeAttached()
    await expect(sheet).toContainText('Foundations of Agent Memory')
    await expect(sheet.locator('.pdf-lesson-content')).toContainText('memory')
    await expect(page.locator('html')).toHaveClass(/pdf-export-mode/)
    expect(await page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1)

    // The print stylesheet must show only the sheet and hide the app chrome.
    await page.emulateMedia({ media: 'print' })
    await expect(sheet).toBeVisible()
    await expect(page.getByRole('banner')).toBeHidden()
    await page.emulateMedia({ media: 'screen' })
  })

  test('collects every lesson into the course print sheet', async ({ page }) => {
    await page.goto(COURSE)

    await page.getByTestId('print-course-pdf').click()

    const sheet = page.getByTestId('pdf-sheet')
    await expect(sheet).toBeAttached()
    await expect(sheet.locator('.pdf-lesson')).toHaveCount(5)
    await expect(sheet).toContainText('Foundations of Agent Memory')
    await expect(sheet).toContainText('Advanced Retrieval Strategies')
    expect(await page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1)

    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    await expect(page.getByTestId('pdf-sheet')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveClass(/pdf-export-mode/)
  })
})
