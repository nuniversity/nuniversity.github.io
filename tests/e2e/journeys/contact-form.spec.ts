// E2E journey — contact form with Formspree intercepted.
// THE single sanctioned network mock in the suite: the form posts to a real
// third-party endpoint (formspree.io/f/...) and must never be hit by CI.
// Success and error paths are both exercised (components/contacts/Contact.tsx).
import { test, expect } from '../support/fixtures'
import { ContactPage } from '../support/page-objects/ContactPage'
import type { Page } from '@playwright/test'

// One case mocks a 400 response; the browser logs the failed request.
test.use({ allowedConsoleErrors: [/400 \(Bad Request\)/] })

test.describe('contact form (Formspree mocked)', () => {
  /**
   * The contact component hydrates later than the header (separate chunk +
   * framer-motion), so a click right after the header hydrates can be
   * swallowed. Retry the submit until the intercepted request actually fires.
   */
  async function submitUntilSent(page: Page, contact: ContactPage) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = page.waitForResponse(
        (r) => r.url().includes('formspree.io'),
        { timeout: 5_000 }
      )
      await contact.submit.click()
      const res = await response.catch(() => null)
      if (res) return res
    }
    throw new Error('formspree request never fired after 3 submit attempts')
  }

  test('successful submission shows the thank-you panel', async ({ page }) => {
    await page.route('**/formspree.io/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        // @formspree/core requires `next` (a string) to treat it as success;
        // `{ok: true}` alone parses as "Unexpected response format".
        body: JSON.stringify({ ok: true, next: 'https://formspree.io/f/xandddko/thanks' }),
      })
    )

    const contact = new ContactPage(page)
    await contact.goto()
    await page.getByRole('button', { name: /switch to (dark|light) theme/i }).waitFor()
    await contact.fillValid()
    await submitUntilSent(page, contact)

    await expect(contact.successHeading).toBeVisible()
    await expect(contact.sendAnother).toBeVisible()
  })

  test('error response keeps the form and shows validation errors', async ({ page }) => {
    await page.route('**/formspree.io/**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        // Error discriminator: `error` string or `errors: [{message}]`.
        body: JSON.stringify({ ok: false, error: 'Unable to submit the form.' }),
      })
    )

    const contact = new ContactPage(page)
    await contact.goto()
    await page.getByRole('button', { name: /switch to (dark|light) theme/i }).waitFor()
    await contact.fillValid()
    await submitUntilSent(page, contact)

    // No thank-you panel; the form stays on screen.
    await expect(contact.successHeading).toBeHidden()
    await expect(contact.name).toBeVisible()
  })

  test('client-side required validation blocks empty submits', async ({ page }) => {
    let networkHit = false
    await page.route('**/formspree.io/**', (route) => {
      networkHit = true
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    const contact = new ContactPage(page)
    await contact.goto()
    // All fields empty → HTML5 required validation stops submission.
    await contact.submit.click()
    await expect(contact.successHeading).toBeHidden()
    expect(networkHit, 'no network call on invalid submit').toBe(false)
  })
})
