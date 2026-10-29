import { test, expect } from '../support/fixtures'

test.describe('mixed practice navigation', () => {
  test('offers a way back to the course and to all courses', async ({ page }) => {
    await page.goto('/en/courses/aws-aif-c01/practice/')

    const main = page.locator('main')
    await expect(main.getByRole('link', { name: 'Back to course', exact: true })).toHaveAttribute(
      'href',
      '/en/courses/aws-aif-c01/'
    )
    await expect(main.getByRole('link', { name: 'Back to Courses', exact: true })).toHaveAttribute(
      'href',
      '/en/courses/'
    )

    // Run the session to the end. The done screen must keep both exits.
    const session = page.getByTestId('review-session')
    await expect(session).toBeVisible()
    for (let i = 0; i < 15; i++) {
      if (await page.getByTestId('review-done').isVisible().catch(() => false)) break
      const option = session.getByRole('button').filter({ hasNotText: /^(Next|Finish)$/ }).first()
      if (await option.isVisible().catch(() => false)) await option.click()
      const next = page.getByRole('button', { name: /^(Next|Finish)$/ })
      if (await next.isVisible().catch(() => false)) await next.click()
      else break
    }

    const done = page.getByTestId('review-done')
    await expect(done).toBeVisible()
    await expect(done.getByRole('link', { name: 'Back to course', exact: true })).toHaveAttribute(
      'href',
      '/en/courses/aws-aif-c01/'
    )
    await expect(done.getByRole('link', { name: 'Back to Courses', exact: true })).toHaveAttribute(
      'href',
      '/en/courses/'
    )
  })
})
