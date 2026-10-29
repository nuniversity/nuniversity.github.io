import { test, expect } from '../support/fixtures'

const LESSON = '/en/courses/aws-aif-c01/04-ml-algorithms-evaluation/'

test.describe('lesson read-aloud', () => {
  test('plays, changes speed, pauses, resumes and stops', async ({ page, speech }) => {
    void speech
    await page.goto(LESSON)

    const audio = page.locator('[data-lesson-audio]')
    await audio.getByRole('button', { name: 'Listen to this lesson' }).click()
    await expect(audio.getByText(/^Reading/)).toBeVisible()

    const first = await page.evaluate(() => window.__speech.spoken)
    expect(first.length).toBeGreaterThan(1)
    expect(first.every((entry) => entry.rate === 1)).toBe(true)

    await audio.getByRole('button', { name: 'Slower' }).click()
    await expect
      .poll(async () => (await page.evaluate(() => window.__speech.spoken)).at(-1)?.rate)
      .toBe(0.75)

    await audio.getByRole('button', { name: 'Faster' }).click()
    await expect
      .poll(async () => (await page.evaluate(() => window.__speech.spoken)).at(-1)?.rate)
      .toBe(1.25)

    await audio.getByRole('button', { name: 'Pause reading aloud' }).click()
    await expect(audio.getByText('Paused')).toBeVisible()
    expect(await page.evaluate(() => window.__speech.paused)).toBe(true)

    await audio.getByRole('button', { name: 'Listen to this lesson' }).click()
    await expect(audio.getByText(/^Reading/)).toBeVisible()
    expect(await page.evaluate(() => window.__speech.resumed)).toBeGreaterThan(0)

    await audio.getByRole('button', { name: 'Stop', exact: true }).click()
    await expect(audio.getByText('Listen to this lesson')).toBeVisible()
    expect(await page.evaluate(() => window.__speech.cancelled)).toBeGreaterThan(0)
  })

  test('the section picker reads only the chosen section', async ({ page, speech }) => {
    void speech
    await page.goto(LESSON)

    const audio = page.locator('[data-lesson-audio]')
    const picker = audio.getByRole('combobox')
    await expect(picker.locator('option')).not.toHaveCount(2)

    const target = picker.locator('option').nth(2)
    const targetText = (await target.textContent())?.trim() ?? ''
    const targetValue = await target.getAttribute('value')
    expect(targetValue).toBeTruthy()
    await picker.selectOption(targetValue as string)

    await audio.getByRole('button', { name: 'Listen to this lesson' }).click()
    await expect(audio.getByText(/^Reading:/)).toBeVisible()

    await expect
      .poll(async () =>
        (await page.evaluate(() => window.__speech.spoken)).some((entry) =>
          entry.text.includes(targetText.slice(0, 20))
        )
      )
      .toBe(true)
  })
})
