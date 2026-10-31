import { test, expect } from '../support/fixtures'

// CR-01 hardening (H1): GitHub Pages ignores `out/_headers` and the CSP spec
// ignores `frame-ancestors` inside a <meta> tag, so site pages ship a tiny
// inline frame guard. This probe embeds `/en/` inside a wrapper frame and
// asserts the guard navigates the top-level window away from the wrapper —
// i.e. the site cannot be camouflaged inside a third-party page.
test('frame guard breaks out of clickjacking wrappers', async ({ page, baseURL }) => {
  await page.route('**/nuniversity-frame-probe.html', async (route) => {
    await route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html><body><iframe src="${baseURL}/en/" style="width:800px;height:600px"></iframe></body></html>`,
    })
  })

  await page.goto(`${baseURL}/nuniversity-frame-probe.html`)

  // The frame guard navigates the top-level window away from the wrapper.
  await expect(page).toHaveURL(/\/en\/$/, { timeout: 15_000 })
})

test('root redirect page (public/index.html) also carries the frame guard', async ({ page }) => {
  await page.goto('/')
  const guardSeed = await page.evaluate(
    () => document.documentElement.innerHTML.includes('window.top !== window.self')
  )
  expect(guardSeed, 'frame guard script must be published inline').toBe(true)
})
