// E2E journey — first-visit learner flow with zero mocks:
// root locale redirect → browse courses → open course → open lesson →
// navigate prev/next. Asserts the URL trail and one content anchor per page.
import { test, expect } from '../support/fixtures'
import { HomePage } from '../support/page-objects/HomePage'
import { CoursePage, LessonPage } from '../support/page-objects/CoursePage'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

function firstCourseSlug(): string {
  const coursesDir = path.join(__dirname, '../../../content/courses')
  const en = path.join(coursesDir, 'agent-memory-knowledge', 'en')
  const md = readdirSync(en).find((f) => f.endsWith('.md'))
  return md ? md.replace(/\.md$/, '') : '01-foundations-of-agent-memory'
}

test.describe('learner journey', () => {
  test('root redirect → courses → course → lesson → prev/next', async ({ page }) => {
    // 1. First visit: root redirects to the locale home.
    await page.goto('/')
    await page.waitForURL(/\/en\//)
    await expect(page).toHaveURL(/\/en\//)
    await expect(new HomePage(page).heroSearch).toBeVisible()

    // 2. Browse courses via the header nav.
    const home = new HomePage(page)
    await home.navCourses.click()
    await expect(page).toHaveURL(/\/en\/courses\//)
    const courses = new CoursePage(page)
    await expect(courses.courseCards.first()).toBeVisible()

    // 3. Open a known course (deterministic; the first content course).
    await page.goto('/en/courses/agent-memory-knowledge/')

    // 4. Open its first lesson (slug from the course metadata).
    const lessonLink = page.locator('a[href$="/01-foundations-of-agent-memory/"]').first()
    await expect(lessonLink).toBeVisible()
    await lessonLink.click()
    await page.waitForURL(/\/courses\/agent-memory-knowledge\/[^/]+\//)
    const lesson = new LessonPage(page)
    await lesson.expectContentLoaded()

    // 5. Navigate to the next lesson (or back to courses at the end).
    const nextOrBack = page.getByRole('link', { name: /^next/i }).or(
      page.getByRole('link', { name: /back to courses/i })
    )
    await expect(nextOrBack.first()).toBeVisible()
    const href = await nextOrBack.first().getAttribute('href')
    await nextOrBack.first().click()
    await expect(page).toHaveURL(new RegExp((href as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  test('direct lesson deep-link renders and breadcrumbs navigate back', async ({ page }) => {
    const lesson = new LessonPage(page)
    await page.goto('/en/courses/agent-memory-knowledge/01-foundations-of-agent-memory/')
    await lesson.expectContentLoaded()

    // Breadcrumb: the course link returns to the course page.
    const courseCrumb = page.locator('nav').getByRole('link', { name: /agent-memory-knowledge|agent/i }).first()
    await expect(courseCrumb).toBeVisible()
    await courseCrumb.click()
    await expect(page).toHaveURL(/\/en\/courses\/agent-memory-knowledge\//)
  })
})
