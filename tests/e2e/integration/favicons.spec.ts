import { test, expect } from '../support/fixtures'

// The tab icon is easy to regress: a path typo or a stale file-convention
// override still renders a page, just without an icon. Resolve every declared
// icon against the deployed static server.
test('every declared icon and the manifest resolve', async ({ page, request }) => {
  await page.goto('/en/')
  await page.waitForSelector('html[data-hydrated="true"]')

  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')).map(
      (link) => link.getAttribute('href') ?? ''
    )
  )

  expect(links.length).toBeGreaterThanOrEqual(4)
  expect(links.some((href) => href.includes('favicon-32x32.png'))).toBe(true)
  expect(links.some((href) => href.includes('favicon.ico'))).toBe(true)
  expect(links.some((href) => href.includes('icon.svg'))).toBe(true)
  expect(links.some((href) => href.includes('manifest.webmanifest'))).toBe(true)

  for (const href of links) {
    const response = await request.get(href)
    expect(response.status(), href).toBe(200)
    expect((await response.body()).length, href).toBeGreaterThan(100)
  }
})
