// tests/e2e/support/retry.ts
//
// The quiz player re-renders every second (live timer) which detaches DOM
// nodes between Playwright's hit-test and event dispatch — a plain click can
// land on a dead node. These helpers click and VERIFY the resulting state,
// retrying until it holds or the deadline passes.
import { expect, type Locator, type Page } from '@playwright/test'

const CLICK_TIMEOUT = 2_000

export async function clickUntilChecked(radio: Locator, deadlineMs = 20_000) {
  const deadline = Date.now() + deadlineMs
  let lastError: unknown = null
  while (Date.now() < deadline) {
    try {
      await radio.click({ force: true, timeout: CLICK_TIMEOUT })
      if ((await radio.getAttribute('aria-checked', { timeout: 1_000 })) === 'true') return
    } catch (err) {
      lastError = err
    }
  }
  throw new Error(`radio never became checked: ${String(lastError).slice(0, 200)}`)
}

export async function clickUntilVisible(
  page: Page,
  click: () => Promise<void>,
  target: Locator,
  deadlineMs = 20_000
) {
  const deadline = Date.now() + deadlineMs
  let lastError: unknown = null
  while (Date.now() < deadline) {
    try {
      await click()
      await target.waitFor({ state: 'visible', timeout: CLICK_TIMEOUT })
      return
    } catch (err) {
      lastError = err
    }
  }
  throw new Error(`target never became visible: ${String(lastError).slice(0, 200)}`)
}

export async function expectVisibleNow(locator: Locator, label: string) {
  await expect(locator, label).toBeVisible()
}
