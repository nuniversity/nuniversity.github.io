# Bad example — blocked E2E patterns

```ts
import { test, expect } from '@playwright/test' // bare-test-import

test.only('journey', async ({ page }) => {       // skip-only
  await page.goto('/en/')
  await page.waitForTimeout(2000)                 // wait-timeout
  await page.waitForLoadState('networkidle')      // networkidle
  await page.click('.cta')                        // legacy-page-api
  await page.locator('//button').click()          // xpath
  console.log('clicked')                          // console-log
  await page.pause()                              // page-pause
  await expect(page.getByText('Courses')).toBeVisible() // ambiguous strict-mode risk
})
```

| Pattern | Harm |
|---|---|
| bare `@playwright/test` import | loses storage isolation and console guard |
| `.only` / `.skip` | removes coverage without notice |
| fixed sleep / networkidle | flake, unrelated request waits |
| `page.click` / `$` | bypasses locator auto-wait and tracing |
| XPath | brittle, unreadable |
| `console.log` | leaks debug output into reports |
| `page.pause()` | hangs the commit hook |
| unscoped `getByText` | strict-mode violation on repeated UI strings |
