// Browser integration — search against the REAL shipped index JSON.
// The hero type-ahead and the ⌘K command palette both fetch
// /search-index/{lang}.json at runtime; nothing here is mocked.
import { test, expect } from '../support/fixtures'
import { SearchPalette } from '../support/page-objects/SearchPalette'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type Doc = { id: string; title: string; url: string; type: string }

/** Load the shipped index and pick a real, unambiguous search term. */
function pickRealDoc(): Doc {
  const index = JSON.parse(
    readFileSync(path.join(__dirname, '../../../out/search-index/en.json'), 'utf8')
  ) as Doc[]
  // Prefer a course doc — its title renders as a heading on the target page.
  const course = index.find((d) => d.type === 'course' && d.title.includes('Agent Knowledge'))
  if (course) return course
  const internal = index.find((d) => d.url.startsWith('/en/'))
  if (!internal) throw new Error('no internal docs in search index')
  return internal
}

test.describe('hero search (type-ahead)', () => {
  test('fetches the real index and navigates on Enter', async ({ page }) => {
    const doc = pickRealDoc()
    const term = doc.title.split(' ').slice(0, 3).join(' ')

    await page.goto('/en/')
    const input = page.getByTestId('hero-search-input')
    await input.click()
    await input.fill(term)

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()
    await expect(page.locator('[role="option"]').first()).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(doc.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })
})

test.describe('command palette (⌘K)', () => {
  test('opens via header trigger, searches, keyboard-navigates, activates', async ({ page }) => {
    const doc = pickRealDoc()
    const palette = new SearchPalette(page)

    await page.goto('/en/')
    await palette.openViaHeaderTrigger()
    await palette.search(doc.title.split(' ').slice(0, 2).join(' '))

    await expect(palette.resultCount).toContainText(/results/i)
    await expect(palette.results.first()).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(doc.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  test('opens via keyboard shortcut and shows empty state for garbage input', async ({ page }) => {
    const palette = new SearchPalette(page)

    await page.goto('/en/')
    await palette.openViaKeyboard()
    await palette.search('zzqxj-no-such-term-xyz')

    await expect(palette.emptyState).toBeVisible()
    await palette.closeButton.click()
    await expect(palette.overlay).toBeHidden()
  })
})
