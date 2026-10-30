import { test, expect } from '../support/fixtures'

// Reduced motion keeps entrance animations from racing the axe scan.
test.use({ reducedMotion: 'reduce' })

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
  { name: 'library', path: '/en/library/' },
  { name: 'library analysis', path: '/en/library/analysis/cs50-fast-start/' },
  { name: 'roadmaps hub', path: '/en/roadmaps/' },
  { name: 'roadmap detail', path: '/en/roadmaps/intro-to-software-engineering/' },
  { name: 'tools hub', path: '/en/tools/' },
  { name: 'pomodoro tool', path: '/en/tools/pomodoro-timer/' },
  { name: 'decision matrix tool', path: '/en/tools/decision-matrix/' },
  { name: 'flashcard tool', path: '/en/tools/flashcard-maker/' },
] as const

test.describe('accessibility', () => {
  for (const surface of SURFACES) {
    test(`${surface.name} has no serious or critical violations`, async (
      { page, makeAxeBuilder },
      testInfo
    ) => {
      await page.goto(surface.path)
      await page.waitForSelector('html[data-hydrated="true"]')
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
        serious.map(
          (violation) =>
            `${violation.impact} ${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join('; ')}`
        ),
        `axe violations on ${surface.path}`
      ).toEqual([])
    })
  }
})

test.describe('section palette in dark mode', () => {
  for (const surface of [
    { name: 'quizzes', path: '/en/quizzes/' },
    { name: 'library', path: '/en/library/' },
  { name: 'library analysis', path: '/en/library/analysis/cs50-fast-start/' },
    { name: 'eisenhower tool', path: '/en/tools/eisenhower-matrix/' },
    { name: 'swot tool', path: '/en/tools/swot-matrix/' },
  ]) {
    test(`${surface.name} keeps axe contrast in dark mode`, async ({ page, makeAxeBuilder }, testInfo) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(surface.path)
      await page.waitForSelector('html[data-hydrated="true"]')
      await expect(page.locator('main')).toBeVisible()

      const results = await makeAxeBuilder().analyze()
      await testInfo.attach(`axe-dark-${surface.name}.json`, {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      })
      const serious = results.violations.filter(
        (violation) => violation.impact === 'serious' || violation.impact === 'critical'
      )
      expect(
        serious.map(
          (violation) =>
            `${violation.impact} ${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join('; ')}`
        ),
        `axe dark violations on ${surface.path}`
      ).toEqual([])
    })
  }
})
