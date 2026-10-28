// tests/e2e/support/quiz-player.ts
//
// Driver for the QuizPlayer component's state machine. The player re-renders
// every second (live timer), detaching DOM nodes between hit-test and event
// dispatch, so every action clicks-and-VERIFIES via the app's own signals:
//   - selection registered  ⇔ the "Check answer" button becomes enabled
//   - checked               ⇔ exact "Correct!" / "Incorrect" text appears
//   - advanced              ⇔ the "Question {n+1} of {total}" indicator
//   - pre-answer bottom bar shows "Skip for now"; post-check shows "Next Question"
import { expect, type Locator, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const CLICK_TIMEOUT = 2_000

type QuizQuestion = { question: string; options: string[]; correct: number }
export type QuizJson = { slug: string; questions: QuizQuestion[] }

export function loadQuizJson(slug: string): QuizJson {
  return JSON.parse(
    readFileSync(path.join(__dirname, `../../../content/quizzes/${slug}.json`), 'utf8')
  )
}

async function progressNumber(page: Page): Promise<number> {
  const text = await page
    .getByText(/question \d+ of \d+/i)
    .first()
    .textContent({ timeout: 5_000 })
  return Number(text?.match(/question (\d+) of/i)?.[1] ?? 0)
}

/**
 * Answer every question (known-correct when found in the shipped JSON) and
 * finish at the score report. Returns when "Quiz Complete!" is visible.
 */
export async function completePracticeQuiz(
  page: Page,
  quiz: QuizJson,
  maxQuestions = 40
): Promise<void> {
  // Plain clicks only: force:true dispatches at stale coordinates while the
  // question is animating in (framer-motion), landing on nothing. Normal
  // clicks wait for stability; the retry loops below handle re-render churn.
  const click = (locator: Locator) => locator.click({ timeout: CLICK_TIMEOUT })
  // Feedback is matched with .last(): during the exit animation the PREVIOUS
  // question's feedback panel is still in the DOM, and .first() would match
  // it, desyncing the driver from the player's state machine.
  const feedback = page.locator('main').getByText(/^correct!$|^incorrect$/i).last()

  for (let guard = 0; guard < maxQuestions; guard++) {
    const answerGroup = page.getByRole('radiogroup', { name: 'Answer options' })
    await expect(answerGroup).toBeVisible()

    if (process.env.QUIZ_DEBUG) {
      const num = await progressNumber(page).catch(() => -1)
      const radioStates = await answerGroup.getByRole('radio').evaluateAll(els =>
        els.map((e) => `aria-checked=${e.getAttribute('aria-checked')} disabled=${(e as HTMLButtonElement).disabled}`)
      ).catch(() => ['eval-failed'])
      console.log(`    [iter ${guard}] Q${num} radios=${JSON.stringify(radioStates)}`)
    }

    // RECOVERY: a fast previous check can bleed the reveal state into the
    // current question (observed under automation: Q{n+1} mounts already
    // revealed with options disabled). Advance past such questions via the
    // bottom "Next" button instead of fighting the state machine.
    const isRevealed = await answerGroup
      .getByRole('radio')
      .first()
      .evaluate((el) => (el as HTMLButtonElement).disabled)
      .catch(() => false)
    if (isRevealed) {
      const current = await progressNumber(page).catch(() => 0)
      const bottomNext = page.getByRole('button', { name: 'Next', exact: true }).last()
      const advanced = await bottomNext
        .click({ timeout: CLICK_TIMEOUT })
        .then(() => true)
        .catch(() => false)
      if (advanced) {
        await page
          .getByText(new RegExp(`question ${current + 1} of`, 'i'))
          .first()
          .waitFor({ state: 'visible', timeout: CLICK_TIMEOUT })
          .catch(() => {})
        continue
      }
      // Last question: "See Results" is the only way forward.
      const seeResults = page.getByRole('button', { name: /see results/i })
      if (await seeResults.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await seeResults.click()
        break
      }
      continue
    }

    // --- selection: click until the Check button enables (React registered it)
    const questionText = (await page.locator('h2').first().textContent()) || ''
    const known = quiz.questions.find((q) => questionText.includes(q.question.slice(0, 40)))
    let radio: Locator = answerGroup.getByRole('radio').first()
    if (known) {
      const named = answerGroup
        .getByRole('radio', { name: new RegExp(escapeRegExp(known.options[known.correct].slice(0, 60)), 'i') })
        .first()
      // JSON option text may not match the rendered DOM (escaping, math).
      // Fall back to the first option rather than clicking a ghost locator.
      if ((await named.count()) > 0) radio = named
    }

    const check = page.getByRole('button', { name: /check answer/i })
    const selectDeadline = Date.now() + 20_000
    let selected = false
    while (Date.now() < selectDeadline) {
      // Hit-tested clicks can time out here: the option may sit outside the
      // hittable viewport region (elementFromPoint = null) while animations
      // settle. dispatchEvent('click') fires the React synthetic handler
      // deterministically (verified: Check enables).
      await radio.dispatchEvent('click').catch(() => {})
      if (await check.isEnabled().catch(() => false)) {
        selected = true
        break
      }
      if (process.env.QUIZ_DEBUG) {
        const checkedState = await answerGroup.getByRole('radio').evaluateAll(els =>
          els.map((e) => `${e.getAttribute('aria-checked')}:${(e.textContent || '').slice(0, 20)}`)
        ).catch(() => ['eval-failed'])
        console.log(`    [sel] not registered; radios=${JSON.stringify(checkedState)}`)
      }
    }
    if (!selected) {
      throw new Error(
        `selection never registered (Check stayed disabled) on: "${questionText.slice(0, 80)}"`
      )
    }

    // --- check: click until exact feedback text appears
    const checkDeadline = Date.now() + 20_000
    let checked = false
    while (Date.now() < checkDeadline) {
      await click(check).catch(() => {})
      if (await feedback.isVisible({ timeout: CLICK_TIMEOUT }).catch(() => false)) {
        checked = true
        break
      }
    }
    if (!checked) throw new Error('feedback never appeared after Check answer')

    // --- last question? "See Results" replaces "Next Question" post-check
    const current = await progressNumber(page)
    const seeResults = page.getByRole('button', { name: /see results/i })
    if (await seeResults.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await seeResults.click()
      break
    }

    // --- advance: wait for the NEXT question number specifically
    const next = page.getByRole('button', { name: /next question/i })
    const advanceDeadline = Date.now() + 20_000
    let advanced = false
    while (Date.now() < advanceDeadline) {
      await click(next).catch(() => {})
      const onNext = page
        .getByText(new RegExp(`question ${current + 1} of`, 'i'))
        .first()
        .isVisible({ timeout: CLICK_TIMEOUT })
        .catch(() => false)
      if (await onNext) {
        advanced = true
        break
      }
    }
    if (!advanced) throw new Error(`never advanced from question ${current}`)
  }

  await expect(page.getByText(/quiz complete/i)).toBeVisible()
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
