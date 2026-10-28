// tests/e2e/support/page-objects/SearchPalette.ts
//
// Locators for the header command palette
// (components/search/CommandPalette.tsx — ⌘K / Ctrl+K or the header trigger).
import { type Locator, type Page, expect } from '@playwright/test'
import type { Page as PWPage } from '@playwright/test'

export class SearchPalette {
  readonly page: PWPage
  readonly overlay: Locator
  readonly input: Locator
  readonly results: Locator
  readonly resultCount: Locator
  readonly emptyState: Locator
  readonly closeButton: Locator

  constructor(page: PWPage) {
    this.page = page
    this.overlay = page.getByTestId('command-palette')
    this.input = page.getByTestId('search-input')
    this.results = page.getByTestId('search-result')
    this.resultCount = page.getByTestId('search-count')
    this.emptyState = page.getByTestId('search-empty')
    this.closeButton = page.getByTestId('search-close')
  }

  /** Open via the header trigger (works on every page, hydration required). */
  async openViaHeaderTrigger() {
    await this.page.getByTestId('search-trigger').click()
    await expect(this.overlay).toBeVisible()
  }

  /** Open via the global keyboard shortcut. The palette chunk loads after
   *  hydration, so retry briefly before giving up. */
  async openViaKeyboard() {
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.page.keyboard.press(`${mod}+KeyK`)
      const opened = await this.overlay
        .waitFor({ state: 'visible', timeout: 1_500 })
        .then(() => true)
        .catch(() => false)
      if (opened) return
    }
    // Final assertion produces the failure if the shortcut never worked.
    await expect(this.overlay).toBeVisible()
  }

  async search(query: string) {
    await this.input.fill(query)
  }

  /** Press Enter on the active result and wait for client-side navigation. */
  async activateActiveResult() {
    await expect(this.results.first()).toBeVisible()
    await this.page.keyboard.press('Enter')
    await expect(this.overlay).toBeHidden()
  }
}
