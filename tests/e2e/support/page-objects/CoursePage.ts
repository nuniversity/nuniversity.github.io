// tests/e2e/support/page-objects/CoursePage.ts
//
// Locators for the courses hub (/en/courses/), a course detail page
// (/en/courses/{courseSlug}/) and a lesson page
// (/en/courses/{courseSlug}/{lessonSlug}/).
import { type Locator, type Page, expect } from '@playwright/test'

export class CoursePage {
  readonly page: Page
  readonly search: Locator
  readonly courseCards: Locator

  constructor(page: Page) {
    this.page = page
    this.search = page.getByPlaceholder('Search courses, authors...')
    this.courseCards = page.locator('a[href*="/courses/"] h3')
  }

  async goto(locale = 'en') {
    await this.page.goto(`/${locale}/courses/`)
  }

  /** Click the first course card and land on its detail page. */
  async openFirstCourse() {
    await this.courseCards.first().click()
    await this.page.waitForURL(/\/courses\/[^/]+\//)
  }
}

export class LessonPage {
  readonly page: Page
  readonly content: Locator
  readonly prevLink: Locator
  readonly nextLink: Locator

  constructor(page: Page) {
    this.page = page
    // The markdown body container (app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx).
    this.content = page.locator('[data-lesson-content]')
    this.prevLink = page.getByRole('link', { name: /previous/i }).first()
    this.nextLink = page.getByRole('link', { name: /^next/i }).first()
  }

  async expectContentLoaded() {
    await expect(this.content).toBeVisible()
  }

  /** Practice question embedded in lesson markdown (components/markdown/QuestionBlock.tsx). */
  questionBlock() {
    return {
      root: this.page.getByText('Practice Question', { exact: true }),
      option: (label: string) => this.page.getByRole('button', { name: new RegExp(label, 'i') }),
      check: this.page.getByRole('button', { name: /check answer/i }),
      feedback: this.page.getByText(/correct!|incorrect/i),
    }
  }
}
