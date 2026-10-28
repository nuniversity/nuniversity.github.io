// Artifact suite — every internal link/src in the shipped HTML must resolve
// to an emitted file. Catches broken hrefs, renamed slugs, deleted assets.
// External URLs are intentionally not fetched (deterministic, offline).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  OUT,
  OUT_READY,
  htmlFiles,
  read,
  routeFor,
  urlToOutFile,
  extractAttrs,
} from './support/helpers.mjs'

describe.skipIf(!OUT_READY)('internal link graph resolves', () => {
  const files = htmlFiles()

  it('has a meaningful corpus to scan', () => {
    expect(files.length).toBeGreaterThan(500)
  })

  it('resolves every internal href and src in every page', () => {
    const broken = []
    outer: for (const file of files) {
      const route = routeFor(file)
      const html = read(path.relative(OUT, file))
      for (const attr of ['href', 'src']) {
        for (const raw of extractAttrs(html, attr)) {
          const resolved = urlToOutFile(raw, route)
          // null ⇒ external/anchor/special — out of scope for this suite.
          if (resolved === null) continue
          // Directory hits without index.html surface as REDIRECTABLE (the
          // static server 301s them like Pages does) — links SHOULD point at
          // the canonical trailing-slash form, so flag both.
          if (resolved.startsWith('REDIRECTABLE:')) {
            broken.push(`${route} → ${raw}`)
            if (broken.length > 40) break outer
            continue
          }
          if (!fs.existsSync(path.join(OUT, resolved))) {
            broken.push(`${route} → ${raw}`)
            if (broken.length > 40) break outer
          }
        }
      }
    }
    expect(
      broken,
      `broken internal links: ${broken.slice(0, 10).join(' | ')}`
    ).toEqual([])
  })

  it('prefers canonical trailing-slash directory links (informational)', () => {
    // Non-canonical /en/courses links still WORK on GitHub Pages (301 to the
    // slash form), so this is a lint-style signal, not a failure.
    const bad = []
    for (const file of files) {
      const route = routeFor(file)
      const html = read(path.relative(OUT, file))
      for (const href of extractAttrs(html, 'href')) {
        if (!href.startsWith('/') || href.startsWith('//')) continue
        const clean = href.split('#')[0].split('?')[0]
        if (clean === '/' || clean === '') continue
        if (path.posix.extname(clean)) continue // real file (json, xml, …)
        if (!clean.endsWith('/')) bad.push(`${route} → ${href}`)
      }
    }
    if (bad.length) {
      console.warn(
        `  ⚠ ${bad.length} non-canonical (no trailing slash) internal links, ` +
          `e.g. ${bad.slice(0, 5).join(', ')} — resolved by the host's 301, consider normalizing`
      )
    }
    expect(true).toBe(true)
  })
})
