import { test, expect } from '../support/fixtures'

test.describe('library journey', () => {
  test('searches, filters and reads a study companion', async ({ page }) => {
    await page.goto('/en/library/')

    const search = page.getByRole('searchbox', { name: /Search resources/i })
    await search.fill('cs50')
    await expect(page.getByRole('heading', { name: 'CS50: Computational Thinking — Fast Start' })).toBeVisible()

    await search.fill('')
    await page.getByRole('button', { name: 'Analyses' }).click()
    await expect(page.getByRole('heading', { name: 'Clean Code: A Field Guide for the Rest of Us' })).toBeVisible()

    await page.getByRole('link', { name: /Read analysis: CS50/ }).click()
    await expect(page).toHaveURL(/\/en\/library\/analysis\/cs50-fast-start\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('CS50')
    await expect(page.getByRole('heading', { name: 'Key takeaways' })).toBeVisible()

    await page.getByLabel('State the inputs, outputs and constraints precisely').check()
    await page.getByLabel('A sequence of unambiguous steps that transforms inputs into outputs').check()
    await page.getByLabel('A correct but slow algorithm and a fast but wrong algorithm fail in different ways').check()
    await page.getByRole('button', { name: 'Check answers' }).click()

    await expect(page.getByText('Your score: 3/3')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Best score: 3/3')).toBeVisible()
  })

  test('opens a Nuniversity course from the library', async ({ page }) => {
    await page.goto('/en/library/')

    await page.getByRole('searchbox', { name: /Search resources/i }).fill('agent knowledge')
    await expect(
      page.getByRole('heading', { name: 'Agent Knowledge Bases and Memory' })
    ).toBeVisible()

    await page.getByRole('link', { name: /Open course: Agent Knowledge Bases and Memory/ }).click()
    await expect(page).toHaveURL(/\/en\/courses\/agent-memory-knowledge\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Agent Knowledge Bases and Memory'
    )
  })
})
