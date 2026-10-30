# Good example — fixture-driven journey

```ts
import { test, expect } from '../support/fixtures'

test('mixed practice keeps a way back', async ({ page }) => {
  await page.goto('/en/courses/aws-aif-c01/practice/')

  const main = page.locator('main')
  await expect(main.getByRole('link', { name: 'Back to course', exact: true }))
    .toHaveAttribute('href', '/en/courses/aws-aif-c01/')

  const session = page.getByTestId('review-session')
  await expect(session).toBeVisible()

  // complete the session…
  const done = page.getByTestId('review-done')
  await expect(done).toBeVisible()
  await expect(done.getByRole('link', { name: 'Back to Courses', exact: true }))
    .toHaveAttribute('href', '/en/courses/')
})
```

Why it is good:

- `test`/`expect` come from the fixtures;
- `main` scoping avoids duplicated header text;
- web-first assertions, no sleeps;
- each expected text is unique/exact.
