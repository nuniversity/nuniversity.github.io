// tests/e2e/support/page-objects/ContactPage.ts
//
// Locators for the contact page (components/contacts/Contact.tsx — Formspree).
import { type Locator, type Page, expect } from '@playwright/test'

export class ContactPage {
  readonly page: Page
  readonly name: Locator
  readonly email: Locator
  readonly subject: Locator
  readonly message: Locator
  readonly submit: Locator
  readonly successHeading: Locator
  readonly sendAnother: Locator

  constructor(page: Page) {
    this.page = page
    this.name = page.locator('#name')
    this.email = page.locator('#email')
    this.subject = page.locator('#subject')
    this.message = page.locator('#message')
    this.submit = page.getByRole('button', { name: /send message/i })
    this.successHeading = page.getByRole('heading', { name: /thank you!/i })
    this.sendAnother = page.getByRole('button', { name: /send another message/i })
  }

  async goto(locale = 'en') {
    await this.page.goto(`/${locale}/contact/`)
  }

  async fillValid() {
    await this.name.fill('E2E Test')
    await this.email.fill('e2e@example.com')
    await this.subject.fill('Automated test message')
    await this.message.fill('This message was sent by the automated E2E suite.')
  }
}
