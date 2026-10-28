// Browser integration — i18n chrome + language switching.
// Nav labels come from dictionaries/*.json (loaded at test time, so the test
// tracks the real dictionaries). The switcher rewrites the path, sets the
// NEXT_LOCALE cookie, and client-navigates (LanguageSwitcher.tsx).
import { test, expect } from '../support/fixtures'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'

const DICT_DIR = path.join(__dirname, '../../../dictionaries')

type Dict = { navigation: Record<string, string> }

function dict(locale: string): Dict {
  return JSON.parse(readFileSync(path.join(DICT_DIR, `${locale}.json`), 'utf8'))
}

async function openLanguageMenu(page: Page) {
  await page.getByRole('button', { name: 'Change language' }).click()
  // Dropdown panel: one button per locale, flagged names.
  return page.getByRole('button', { name: /Português|Español|English/ })
}

test.describe('i18n chrome', () => {
  const ROUTE = '/courses/'

  for (const locale of ['en', 'pt', 'es']) {
    test(`chrome is localized: ${locale}`, async ({ page }) => {
      const d = dict(locale)
      await page.goto(`/${locale}${ROUTE}`)
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
      await expect(
        page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: d.navigation.courses })
      ).toBeVisible()
    })
  }

  test('switching locale keeps the route and sets the NEXT_LOCALE cookie', async ({ page }) => {
    await page.goto('/en/courses/')
    const options = await openLanguageMenu(page)
    await options.filter({ hasText: 'Português' }).first().click()

    await expect(page).toHaveURL(/\/pt\/courses\//)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt')
    const cookie = await page.context().cookies()
    expect(cookie.find((c) => c.name === 'NEXT_LOCALE')?.value).toBe('pt')

    // The cookie drives the 404-stub locale choice — covered in journeys.
  })
})
