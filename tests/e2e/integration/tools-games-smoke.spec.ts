// Browser integration — every interactive tool page loads, hydrates and
// answers a minimal interaction; one game per category loads clean.
// Smoke-level: deep logic lives in the vitest component suites; here we
// catch route/hydration/build regressions.
import { test, expect } from '../support/fixtures'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const TOOLS = [
  'eisenhower-matrix',
  'swot-matrix',
  'llm-prompt-builder',
  'pomodoro-timer',
  'habit-tracker',
  'flashcard-maker',
  'regex-tester',
  'unit-converter',
  'decision-matrix',
  'brain-writing-session',
] as const

// Games with real interactive pages (quiz/* redirects to /quizzes/,
// vocabulary/* moved to /languages/ — see components/quizzes/RedirectToQuizzes).
const GAME_CATEGORIES = [
  'coding',
  'conversation',
  'logic',
  'math',
  'physics',
  'puzzles',
] as const

const GAMES_ROOT = path.join(__dirname, '../../../content/games')

function firstGameSlug(category: string): string {
  const dir = path.join(GAMES_ROOT, category)
  const json = readdirSync(dir).find((f) => f.endsWith('.json'))
  if (!json) throw new Error(`no game JSON in content/games/${category}`)
  return json.replace(/\.json$/, '')
}

test.describe('tools smoke (all 10)', () => {
  for (const slug of TOOLS) {
    test(`tool loads and hydrates: ${slug}`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))

      await page.goto(`/en/tools/${slug}/`)
      await expect(page.locator('h1')).toBeVisible()
      // Something interactive must exist (buttons/inputs/controls).
      const interactive = page.getByRole('button').or(page.getByRole('textbox'))
      await expect(interactive.first()).toBeVisible()
      expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
    })
  }

  test('pomodoro timer starts ticking', async ({ page }) => {
    await page.goto('/en/tools/pomodoro-timer/')
    const start = page.getByRole('button', { name: /start/i }).first()
    await expect(start).toBeVisible()
    await start.click()
    // The displayed time must change within a few seconds.
    const timerText = page.getByText(/\d{1,2}:\d{2}/).first()
    await expect(timerText).toBeVisible()
    const t1 = await timerText.textContent()
    await page.waitForTimeout(2100)
    const t2 = await timerText.textContent()
    expect(t2, 'timer ticks').not.toBe(t1)
  })
})

test.describe('games smoke', () => {
  test('games hub links every category', async ({ page }) => {
    await page.goto('/en/games/')
    for (const cat of GAME_CATEGORIES) {
      await expect(
        page.locator(`a[href*="/games/${cat}/"]`).first(),
        `hub link for ${cat}`
      ).toBeVisible()
    }
  })

  for (const cat of GAME_CATEGORIES) {
    test(`first game of category "${cat}" loads without errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(String(err)))

      const slug = firstGameSlug(cat)
      await page.goto(`/en/games/${cat}/${slug}/`)
      await expect(page.locator('h1')).toBeVisible()
      expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
    })
  }

  test('legacy games/quiz URL redirects to the quizzes section', async ({ page }) => {
    // components/quizzes/RedirectToQuizzes — client-side window.location.replace.
    await page.goto('/en/games/quiz/snowpro-core-cof-c03/')
    await page.waitForURL(/\/en\/quizzes\/snowpro-core-cof-c03\//)
    await expect(page).toHaveURL(/\/en\/quizzes\/snowpro-core-cof-c03\//)
  })
})
