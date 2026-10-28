// E2E journey — quiz persistence across reload (the core retention loop):
// complete a practice run → see score → return to detail → best score
// persists via the v1:quizzes-best-* storage.
import { test, expect } from '../support/fixtures'
import { completePracticeQuiz, loadQuizJson } from '../support/quiz-player'

const QUIZ_SLUG = 'snowpro-core-cof-c03'

test.setTimeout(120_000)

test.describe('quiz persistence journey', () => {
  test('practice run survives reload; detail page shows best score', async ({ page }) => {
    const quiz = loadQuizJson(QUIZ_SLUG)

    await page.goto(`/en/quizzes/${QUIZ_SLUG}/`)
    await page.getByRole('button', { name: /start practice/i }).click()

    await completePracticeQuiz(page, quiz)
    await expect(page.getByText(/quiz complete/i)).toBeVisible()

    const bestInStorage = await page.evaluate(
      (slug) => localStorage.getItem(`v1:quizzes-best-${slug}`),
      QUIZ_SLUG
    )
    expect(bestInStorage, 'best written to storage').toBeTruthy()
    const best = JSON.parse(bestInStorage as string)
    expect(best.percent).toBeGreaterThan(0)

    // RELOAD: the quiz detail page must now surface the persisted best score.
    await page.goto(`/en/quizzes/${QUIZ_SLUG}/`)
    await expect(page.getByText(new RegExp(`best score:\\s*${best.percent}%`, 'i'))).toBeVisible()
  })
})
