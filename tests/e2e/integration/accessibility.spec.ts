import { test, expect } from '../support/fixtures'

const SURFACES = [
  { name: 'home', path: '/en/' },
  { name: 'courses hub', path: '/en/courses/' },
  {
    name: 'lesson',
    path: '/en/courses/aws-aif-c01/04-ml-algorithms-evaluation/',
  },
  { name: 'mixed practice', path: '/en/courses/aws-aif-c01/practice/' },
  { name: 'language course', path: '/en/languages/courses/english-for-pt/' },
  { name: 'quiz hub', path: '/en/quizzes/' },
] as const

test.describe('accessibility', () => {
  for (const surface of SURFACES) {
    test(`${surface.name} has no serious or critical violations`, async (
      { page, makeAxeBuilder },
      testInfo
    ) => {
      await page.goto(surface.path)
      await expect(page.locator('main')).toBeVisible()

      const results = await makeAxeBuilder().analyze()
      await testInfo.attach(`axe-${surface.name}.json`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      })

      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical'
      )
      expect(
        serious.map((violation) => `${violation.impact} ${violation.id}: ${violation.help}`),
        `axe violations on ${surface.path}`
      ).toEqual([])
    })
  }
})
