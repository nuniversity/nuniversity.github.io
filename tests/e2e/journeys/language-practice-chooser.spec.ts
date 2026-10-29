import { test, expect } from '../support/fixtures'

const COURSE = '/en/languages/courses/english-for-pt/'

test.describe('language practice chooser', () => {
  test('filters exercises by level, subject and skill', async ({ page }) => {
    await page.goto(COURSE)

    const chooser = page.getByTestId('language-practice-chooser')
    await expect(chooser).toBeVisible()
    await expect(chooser.getByRole('heading', { name: 'Practice by level and subject' })).toBeVisible()

    const level = chooser.getByLabel('Level')
    const subject = chooser.getByLabel('Subject')
    const skill = chooser.getByLabel('Skill')

    await expect(level.locator('option')).toContainText(['All levels', 'A1'])
    await expect(subject.locator('option')).toContainText([
      'All subjects',
      'First Steps',
      'People and Routines',
    ])

    const allLinks = await chooser.getByRole('link').count()
    expect(allLinks).toBeGreaterThan(0)

    await skill.selectOption('reading')
    expect(await chooser.getByRole('link').count()).toBeGreaterThan(0)

    await skill.selectOption('all')
    await subject.selectOption('02-people-routines')
    const subjectLinks = chooser.getByRole('link')
    expect(await subjectLinks.count()).toBeGreaterThan(0)
    for (const href of await subjectLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    )) {
      expect(href).toContain('/02-people-routines/')
    }

    await subject.selectOption('all')
    await level.selectOption('A1')
    expect(await chooser.getByRole('link').count()).toBe(allLinks)

    // The chooser is a navigation surface, not a dead list.
    await chooser.getByRole('link').first().click()
    await expect(page).toHaveURL(/\/en\/languages\/courses\/english-for-pt\/0\d-[^/]+\/[^/]+\/$/)
    await expect(page.getByTestId('lesson-player')).toBeVisible()
  })
})
