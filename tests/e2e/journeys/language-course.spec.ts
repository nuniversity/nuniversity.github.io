// E2E journey — LanguageCourse app: hub → course overview → lesson player →
// finish. Zero mocks: the built site prerenders all language-course content,
// and the browser speech engine is simply absent in headless runs (the app
// degrades to buttons that do nothing harmful — speak() no-ops safely).
import { test, expect } from '../support/fixtures'
import { readFileSync } from 'node:fs'

const COURSE = 'english-for-pt'
const UNIT = '01-first-steps'
const LESSON = 'greetings-1'

function lessonTitle(lang: string): string {
  const file = `content/language-courses/${COURSE}/units/${UNIT}/lessons/01-${LESSON}.json`
  const lesson = JSON.parse(readFileSync(file, 'utf-8'))
  return lesson.title[lang] || lesson.title.en
}

test.describe('language course journey', () => {
  test('hub lists the course and the overview shows units', async ({ page }) => {
    await page.goto('/pt/languages/')
    const card = page.getByTestId(`language-course-${COURSE}`)
    await expect(card).toBeVisible()
    await expect(card).toContainText('Inglês para Falantes de Português')

    await card.click()
    await expect(page).toHaveURL(new RegExp(`/pt/languages/courses/${COURSE}/$`))
    await expect(page.getByTestId('language-course-overview')).toBeVisible()
    await expect(page.getByText('Primeiros Passos')).toBeVisible()
    await expect(page.getByText('Pessoas e Rotinas')).toBeVisible()
    await expect(page.getByTestId('daily-goal')).toBeVisible()
  })

  test('lesson player runs the full arc and reaches the finish screen', async ({ page }) => {
    await page.goto(`/pt/languages/courses/${COURSE}/${UNIT}/${LESSON}/`)
    await expect(page.getByTestId('lesson-player')).toBeVisible()

    // Step 1: knowledge card ("Você sabia?").
    await expect(page.getByTestId('step-knowledge')).toBeVisible()
    await page.getByRole('button', { name: /continuar/i }).click()

    // Step 2: dialogue.
    await expect(page.getByTestId('step-input')).toBeVisible()
    await page.getByRole('button', { name: /continuar/i }).click()

    // Step 3: vocab intro — five cards.
    await expect(page.getByTestId('step-vocab')).toBeVisible()
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /continuar/i }).first().click()
    }

    // Step 4: matching — click each source then its pair.
    await expect(page.getByTestId('step-match')).toBeVisible()
    for (const [a, b] of [['match-s-0', 'match-t-0'], ['match-s-1', 'match-t-1'], ['match-s-2', 'match-t-2'], ['match-s-3', 'match-t-3']]) {
      await page.getByTestId(a).click()
      await page.getByTestId(b).click()
    }
    await page.getByRole('button', { name: /continuar/i }).click()

    // Step 5: tip card.
    await expect(page.getByTestId('step-tip')).toBeVisible()
    await page.getByRole('button', { name: /continuar/i }).click()

    // Steps 6-7: two structured-input grammar items.
    await expect(page.getByTestId('step-grammar').first()).toBeVisible()
    await page.getByTestId('option-0').click()
    await page.getByRole('button', { name: /continuar/i }).click()
    await expect(page.getByTestId('step-grammar')).toBeVisible()
    await page.getByTestId('option-0').click()
    await page.getByRole('button', { name: /continuar/i }).click()

    // Step 8: listening.
    await expect(page.getByTestId('step-listen')).toBeVisible()
    await page.getByTestId('option-0').click()
    await page.getByRole('button', { name: /continuar/i }).click()

    // Step 9: sentence building.
    await expect(page.getByTestId('step-build')).toBeVisible()
    for (const token of ['I', 'am', 'from', 'Brazil']) {
      await page.getByTestId('build-bank').getByRole('button', { name: token, exact: true }).click()
    }
    await page.getByTestId('build-check').click()
    await page.getByRole('button', { name: /continuar/i }).click()

    // Step 10: speaking (self-check works without a microphone).
    await expect(page.getByTestId('step-speak')).toBeVisible()
    await page.getByTestId('said-it').click()
    await page.getByTestId('said-it').click()

    // Step 11: review step is skipped when nothing is due → finish screen.
    await expect(page.getByTestId('lesson-finish')).toBeVisible()
    await expect(page.getByTestId('next-lesson')).toBeVisible()
  })

  test('prerenders every locale variant of the lesson with the localized title', async ({ page }) => {
    for (const lang of ['en', 'pt', 'es'] as const) {
      await page.goto(`/${lang}/languages/courses/${COURSE}/${UNIT}/${LESSON}/`)
      await expect(page.getByTestId('lesson-player')).toBeVisible()
      if (lang !== 'es') {
        await expect(page.getByText(lessonTitle(lang))).toBeVisible()
      }
    }
  })
})
