// Artifact suite — hosting contract artifacts: the files GitHub Pages (and
// the test static server) need to behave like production.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { OUT, OUT_READY, ORIGIN, exists, read } from './support/helpers.mjs'

describe.skipIf(!OUT_READY)('hosting artifacts', () => {
  it('ships .nojekyll (or the Pages action injects it into the artifact)', () => {
    // actions/upload-pages-artifact adds .nojekyll to the deployed tarball
    // automatically; the repo-root copy is the durable source of truth.
    expect(exists('.nojekyll') || fs.existsSync(path.join(OUT, '..', '.nojekyll'))).toBe(true)
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
