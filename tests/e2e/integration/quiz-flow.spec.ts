// Browser integration — the real quiz player against the real question bank.
// Loads the shipped quiz JSON to find correct answers; no network mocking.
import { test, expect } from '../support/fixtures'
import { completePracticeQuiz, loadQuizJson } from '../support/quiz-player'

const QUIZ_SLUG = 'snowpro-core-cof-c03'

test.setTimeout(120_000)

test.describe('quiz practice flow', () => {
  test('grade answers, reach the score report, persist best score', async ({ page }) => {
    const quiz = loadQuizJson(QUIZ_SLUG)

    await page.goto(`/en/quizzes/${QUIZ_SLUG}/`)
    // The practice player is CLIENT STATE on this URL (QuizDetail mode:'practice').
    await page.getByRole('button', { name: /start practice/i }).click()

    await completePracticeQuiz(page, quiz)
    await expect(page.getByText(/quiz complete/i)).toBeVisible()

    // The attempt is persisted in the v1: namespace.
    const storage = await page.evaluate(() => Object.fromEntries(
      Object.keys(localStorage)
        .filter((k) => k.startsWith('v1:quizzes'))
        .map((k) => [k, localStorage.getItem(k)])
    ))
    const bestKey = Object.keys(storage).find((k) => k.startsWith('v1:quizzes-best-'))
    expect(bestKey, 'best-score key written').toBeTruthy()
    const best = JSON.parse(storage[bestKey as string] as string)
    expect(best).toHaveProperty('percent')
    const historyKey = Object.keys(storage).find((k) => k.startsWith('v1:quizzes-history-'))
    expect(historyKey, 'history key written').toBeTruthy()
  })
})
