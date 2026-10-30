// Artifact suite — hosting contract artifacts: the files GitHub Pages (and
// the test static server) need to behave like production.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { OUT, OUT_READY, ORIGIN, exists, read, htmlFiles } from './support/helpers.mjs'

describe.skipIf(!OUT_READY)('hosting artifacts', () => {
  it('ships .nojekyll in the export', () => {
    // postbuild writes the marker so a branch/directory deploy cannot run
    // Jekyll and drop `_next/`.
    expect(exists('.nojekyll')).toBe(true)
  })

  it('links the Nuniversity icon on every page', () => {
    const missing = htmlFiles()
      .filter((file) => !file.endsWith('code-sandbox.html'))
      .filter((file) => {
        const html = fs.readFileSync(file, 'utf8')
        return !/rel=["'](?:icon|apple-touch-icon)["']/.test(html)
      })
      .map((file) => path.relative(OUT, file))
    expect(missing).toEqual([])
  })

  it('ships a root locale-redirect index.html', () => {
    expect(exists('index.html')).toBe(true)
    const html = read('index.html')
    expect(html.includes('NEXT_LOCALE')).toBe(true)
    expect(html.includes("location.replace('/' + locale + '/')")).toBe(true)
    expect(html.includes('href="/en/"')).toBe(true) // noscript fallback
  })

  it('ships the 404 stub with locale + ?p= forwarding logic', () => {
    expect(exists('404.html')).toBe(true)
    const stub = read('404.html')
    expect(stub.includes('NEXT_LOCALE')).toBe(true)
    expect(stub.includes('/404/?p=')).toBe(true)
    expect(stub.includes('noindex')).toBe(true)
  })

  it('ships robots.txt with the sitemap line', () => {
    expect(exists('robots.txt')).toBe(true)
    expect(read('robots.txt')).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`)
  })

  it('ships ads.txt lowercase and no Ads.txt', () => {
    expect(exists('ads.txt')).toBe(true)
    expect(exists('Ads.txt')).toBe(false)
  })

  it('ships a 1200x630 og-image.png', () => {
    expect(exists('og-image.png')).toBe(true)
    const buf = fs.readFileSync(path.join(OUT, 'og-image.png'))
    // PNG: width at byte 16, height at byte 20 (big-endian IHDR).
    const w = buf.readUInt32BE(16)
    const h = buf.readUInt32BE(20)
    expect(`${w}x${h}`).toBe('1200x630')
  })

  it('ships the Cloudflare _headers file (harmless on Pages)', () => {
    expect(exists('_headers')).toBe(true)
  })
})
