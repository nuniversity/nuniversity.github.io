// Artifact suite — sitemap.xml ↔ emitted routes consistency.
// The sitemap is generated at build time from content; the export must match.
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import {
  OUT,
  OUT_READY,
  ORIGIN,
  LOCALES,
  exists,
  read,
  urlToOutFile,
  htmlFiles,
  routeFor,
} from './support/helpers.mjs'

function sitemapLocs() {
  const xml = read('sitemap.xml')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
}

describe.skipIf(!OUT_READY)('sitemap ↔ export consistency', () => {
  const locs = exists('sitemap.xml') ? sitemapLocs() : []

  it('sitemap exists and is substantial', () => {
    expect(exists('sitemap.xml')).toBe(true)
    expect(locs.length).toBeGreaterThan(1000)
  })

  it('every sitemap <loc> resolves to an emitted file', () => {
    const broken = locs.filter((loc) => !urlToOutFile(loc))
    expect(broken.slice(0, 10).join(' | ')).toEqual('')
    expect(broken).toEqual([])
  })

  it('key routes are listed (port of verify_out invariants)', () => {
    const mustHave = [
      `${ORIGIN}/en/tools/`,
      `${ORIGIN}/pt/`,
      `${ORIGIN}/en/quizzes/`,
      `${ORIGIN}/en/quizzes/snowpro-core-cof-c03/`,
      `${ORIGIN}/en/languages/`,
      `${ORIGIN}/en/languages/en-pt/en-to-pt/`,
      ...LOCALES.map((l) => `${ORIGIN}/${l}/quizzes/certificates/`),
    ]
    const missing = mustHave.filter((u) => !locs.includes(u))
    expect(missing.join(' | ')).toEqual('')
  })

  it('contains no legacy URLs (games/vocabulary, games/quiz)', () => {
    const xml = read('sitemap.xml')
    expect(xml.includes('/games/vocabulary/')).toBe(false)
    expect(xml.includes('/games/quiz/')).toBe(false)
  })

  it('every indexable locale page is present in the sitemap', () => {
    const locSet = new Set(locs)
    // Every emitted index.html under {locale}/ should be listed, except
    // noindex surfaces (localized 404, redirect stubs).
    const missing = []
    for (const file of htmlFiles()) {
      const rel = path.relative(OUT, file).split(path.sep).join('/')
      const m = rel.match(/^(en|pt|es)\/(.*)\/index\.html$/)
      if (!m) continue
      const route = '/' + rel.replace(/\/index\.html$/, '/')
      const html = read(rel)
      if (html.includes('noindex')) continue
      // KNOWN ISSUE (waived): course /practice/ pages canonicalize to the
      // locale root and are intentionally absent from the sitemap.
      if (/^\/(en|pt|es)\/courses\/[^/]+\/practice\/$/.test(route)) continue
      // Intentionally unlisted: /404/ (utility) and /review/ (personalized
      // daily-review hub; excluded by app/sitemap.ts staticPaths by design).
      if (/^\/(en|pt|es)\/(404|review)\/$/.test(route)) continue
      if (!locSet.has(ORIGIN + route)) missing.push(route)
      if (missing.length > 20) break
    }
    expect(missing.join(' | ')).toEqual('')
  })
})
