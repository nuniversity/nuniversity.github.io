// Artifact suite — favicon/manifest wiring must survive the static export.
// Regression guard for: tab icon missing because file-convention icons
// shadowed `metadata.icons`, and because the icon URLs were cached forever.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { OUT, OUT_READY, LOCALES, exists, read } from './support/helpers.mjs'

const ICON_LINK = /<link[^>]+rel=["'](?:icon|apple-touch-icon|manifest)["'][^>]*>/gi
const HREF = /href=["']([^"']+)["']/i

function stripQuery(href) {
  return href.split('?')[0]
}

describe.skipIf(!OUT_READY)('favicons and web manifest', () => {
  it('declares icons and a manifest on every localised page', () => {
    for (const locale of LOCALES) {
      const html = read(`${locale}/index.html`)
      const links = html.match(ICON_LINK) ?? []
      const hrefs = links.map((link) => stripQuery(link.match(HREF)?.[1] ?? ''))

      expect(hrefs, `${locale}: icon links`).toContain('/favicon.ico')
      expect(hrefs, `${locale}: PNG favicon`).toContain('/icons/favicon-32x32.png')
      expect(hrefs, `${locale}: SVG favicon`).toContain('/icon.svg')
      expect(hrefs, `${locale}: Apple icon`).toContain('/apple-icon.png')
      expect(hrefs, `${locale}: manifest`).toContain('/manifest.webmanifest')
    }
  })

  it('serves every referenced icon file', () => {
    for (const relative of [
      'favicon.ico',
      'icon.svg',
      'apple-icon.png',
      'icons/favicon-16x16.png',
      'icons/favicon-32x32.png',
      'icons/favicon-48x48.png',
      'icons/favicon-96x96.png',
      'icons/icon-192.png',
      'icons/icon-512.png',
      'icons/icon-maskable-512.png',
    ]) {
      expect(exists(relative), relative).toBe(true)
      expect(fs.statSync(path.join(OUT, relative)).size, relative).toBeGreaterThan(100)
    }
  })

  it('ships a valid multi-resolution ICO with PNG payloads', () => {
    const ico = fs.readFileSync(path.join(OUT, 'favicon.ico'))
    expect(ico.readUInt16LE(2)).toBe(1) // type: icon
    const count = ico.readUInt16LE(4)
    expect(count).toBeGreaterThanOrEqual(3)
    for (let index = 0; index < count; index += 1) {
      const entry = 6 + index * 16
      const offset = ico.readUInt32LE(entry + 12)
      // PNG signature inside the ICO container.
      expect(ico.subarray(offset, offset + 8).toString('hex')).toBe('89504e470d0a1a0a')
    }
  })

  it('ships a manifest whose icons exist', () => {
    const manifestPath = path.join(OUT, 'manifest.webmanifest')
    expect(fs.existsSync(manifestPath), 'manifest.webmanifest').toBe(true)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

    expect(manifest.name).toBe('Nuniversity')
    expect(manifest.theme_color).toBe('#1d4ed8')
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)

    for (const icon of manifest.icons) {
      const relative = stripQuery(icon.src).replace(/^\//, '')
      expect(exists(relative), icon.src).toBe(true)
    }
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
  })
})
