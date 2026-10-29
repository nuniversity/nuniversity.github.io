// tests/e2e/support/page-objects/HomePage.ts
//
// Locators for the locale home page. Selectors are role/testid-first per the
// repo's conventions (see components/layout/Header.tsx, components/home/).
import { type Locator, type Page, expect } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly heroSearch: Locator
  readonly searchTrigger: Locator
  readonly themeToggle: Locator
  readonly languageSwitcher: Locator
  readonly navCourses: Locator
  readonly mobileMenuButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heroSearch = page.getByTestId('hero-search-input')
    this.searchTrigger = page.getByTestId('search-trigger')
    this.themeToggle = page.getByRole('button', { name: /toggle theme|switch to (dark|light) theme/i })
    this.languageSwitcher = page.getByRole('button', { name: /Change language/ })
    this.navCourses = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Courses' })
    this.mobileMenuButton = page.getByRole('button', { name: /open menu|close menu/i })
  }

  async goto(locale = 'en') {
    await this.page.goto(`/${locale}/`)
  }

  /** Post-hydration, the theme button announces the theme it switches TO. */
  async expectHydrated() {
    await expect(this.themeToggle).toBeVisible()
    await expect(this.searchTrigger).toBeVisible()
  }
}
