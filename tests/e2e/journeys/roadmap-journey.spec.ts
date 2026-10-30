import { test, expect } from '../support/fixtures'
import { seedScript } from '../support/storage'

const ROADMAP = '/en/roadmaps/intro-to-software-engineering/'
const PROGRESS_KEY = 'v1:roadmap-progress-intro-to-software-engineering'

test.describe('roadmap journey', () => {
  test('opens from the hub, tracks progress and survives a reload', async ({ page }) => {
    await page.goto('/en/roadmaps/')

    const card = page.getByRole('link', { name: /Introduction to Software Engineering/ })
    await expect(card).toBeVisible()
    await card.click()

    await expect(page).toHaveURL(new RegExp(`${ROADMAP}$`))
    await expect(page.getByRole('heading', { name: 'Introduction to Software Engineering' })).toBeVisible()
    await expect(page.getByText(/0 of 10 steps completed/)).toBeVisible()

    const firstStep = page.locator('#step-processes')
    await firstStep.getByRole('button', { name: 'Mark as complete' }).first().click()

    await expect(page.getByText(/1 of 10 steps completed/)).toBeVisible()
    await expect(page.getByRole('progressbar').first()).toHaveAttribute('aria-valuenow', '10')

    await page.reload()
    await expect(page.getByText(/1 of 10 steps completed/)).toBeVisible()

    // The hub now resumes rather than offering "Start Learning".
    await page.goto('/en/roadmaps/')
    await expect(page.getByRole('link', { name: /Introduction to Software Engineering/ })).toContainText(
      'Continue'
    )
  })

  test('opens the step named in the share URL', async ({ page }) => {
    await page.goto(`${ROADMAP}?step=foundation-of-algorithms`)

    await expect(page.getByRole('region', { name: 'Foundation of Algorithms' })).toBeVisible()
    await expect(page).toHaveURL(/step=foundation-of-algorithms/)
  })

  test('completes a seeded roadmap and grants the reward', async ({ page, context }) => {
    await context.addInitScript(
      seedScript({
        [PROGRESS_KEY]: {
          roadmapId: 'intro-to-software-engineering',
          completedSteps: [
            'processes',
            'foundation-of-algorithms',
            'computing-imperative-algorithm',
            'clean-code-design-patterns',
            'solid-principles-oop',
            'clean-architecture',
            'functional-declarative-coding',
            'ddd-software-architecture',
            'tdd-code-quality',
          ],
          startedAt: '2026-01-01T00:00:00Z',
          lastAccessed: '2026-01-01T00:00:00Z',
        },
      })
    )

    await page.goto(ROADMAP)
    await expect(page.getByText(/9 of 10 steps completed/)).toBeVisible()

    await page
      .locator('#step-agentic-ai-development')
      .getByRole('button', { name: 'Mark as complete' })
      .first()
      .click()

    await expect(page.getByRole('heading', { name: /Congratulations/ })).toBeVisible()
    const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('v1:profile') ?? 'null'))
    expect(profile?.xp).toBe(100)
    expect(await page.evaluate(() => localStorage.getItem('v1:roadmap-reward-intro-to-software-engineering'))).toBe(
      'true'
    )
  })
})
