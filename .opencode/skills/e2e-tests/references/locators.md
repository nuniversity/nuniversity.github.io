# Locator policy

## Order of preference

1. `getByRole(role, { name })` — user-facing semantics.
2. `getByLabel`, `getByPlaceholder` — form controls.
3. `getByTestId` — stable hooks for complex widgets.
4. `getByText(text, { exact: true })` — only when the text itself is the contract
   and it is unique.
5. CSS locator — only for an attribute contract (e.g. `a[href$="/practice/"]`).
6. XPath — never.

## Duplicate text is a signal

`getByText('Back to Courses')` once matched the header, the page action and a
lesson subtitle. Fix by scoping:

```ts
const main = page.locator('main')
await expect(main.getByRole('link', { name: 'Back to Courses', exact: true }))
  .toHaveAttribute('href', '/en/courses/')
```

Do **not** add `.first()` to silence strict mode. `.first()` picks the DOM order,
not the intent, and will silently pass on the wrong element.

## Wait on state, not time

```ts
// ❌ flake
await page.waitForTimeout(2000)
expect(await timer.textContent()).not.toBe(before)

// ✅ web-first
const before = await timer.textContent()
await expect.poll(() => timer.textContent(), { timeout: 5_000 }).not.toBe(before)
```

Playwright locators auto-wait. Manual `isVisible()` checks do not.

## Interaction

```ts
await page.getByRole('button', { name: 'Start' }).click()
await page.getByLabel('Subject').selectOption('02-people-routines')
await expect(page.getByTestId('lesson-player')).toBeVisible()
```

- Prefer `getByRole`/`getByLabel` for controls.
- Use `keyboard` for keyboard-only contracts.
- For hover-only menus, hover the trigger and assert the panel relationship.

## Assertions

```ts
await expect(page).toHaveURL(/\/en\/courses\/$/)
await expect(locator).toHaveAttribute('href', '/en/courses/')
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).toContainText('A1')
```

Use `toHaveCount` for lists; avoid reading `allTextContents()` and asserting in
JavaScript unless the content itself is the contract.

## Console guard and locators

A console error fails the fixture, so a broken locator often appears as an
unexpected 404/console error first. The guard appends the failed URL:

```
console.error: Failed to load resource: 404 (404 http://127.0.0.1:4310/...)
```

Read the URL before adding an allowlist entry.
