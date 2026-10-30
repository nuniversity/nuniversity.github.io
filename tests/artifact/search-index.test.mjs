// Artifact suite — the shipped search index JSON must be valid, complete,
// and consistent with the emitted pages (the UI fetches these at runtime).
import { describe, expect, it } from 'vitest'
import {
  OUT,
  OUT_READY,
  LOCALES,
  exists,
  read,
  urlToOutFile,
} from './support/helpers.mjs'

const VALID_TYPES = [
  'course',
  'lesson',
  'quiz',
  'tool',
  'roadmap',
  'library',
  'game',
  'language',
  'analysis',
]

function loadIndex(locale) {
  const rel = `search-index/${locale}.json`
  if (!exists(rel)) return null
  try {
    return JSON.parse(read(rel))
  } catch {
    return null
  }
}

describe.skipIf(!OUT_READY)('search index integrity', () => {
  it('exports a parseable, non-empty index for every locale', () => {
    for (const locale of LOCALES) {
      const docs = loadIndex(locale)
      expect(docs, `search-index/${locale}.json parses`).not.toBeNull()
      expect(docs.length, `${locale} doc count`).toBeGreaterThan(100)
    }
  })

  it('has well-formed documents with resolvable URLs', () => {
    const broken = []
    for (const locale of LOCALES) {
      const docs = loadIndex(locale)
      for (const doc of docs) {
        if (!doc.id || !doc.title || !doc.type || !doc.url) {
          broken.push(`${locale}: doc missing base fields: ${JSON.stringify(doc).slice(0, 80)}`)
          continue
        }
        if (!VALID_TYPES.includes(doc.type)) {
          broken.push(`${locale}: unknown type "${doc.type}"`)
        }
        // Library entries point at external resources by design; only
        // same-origin URLs must resolve inside out/.
        if (/^https?:\/\//.test(doc.url)) {
          if (doc.url.startsWith('https://nuniversity.github.io')) {
            if (!urlToOutFile(doc.url)) broken.push(`${locale}: url does not resolve in out/: ${doc.url}`)
          }
          continue
        }
        if (!doc.url.startsWith(`/${locale}/`)) {
          broken.push(`${locale}: url not locale-scoped: ${doc.url}`)
        }
        if (!urlToOutFile(doc.url)) {
          broken.push(`${locale}: url does not resolve in out/: ${doc.url}`)
        }
      }
      if (broken.length > 20) break
    }
    expect(broken, broken.slice(0, 10).join(' | ')).toEqual([])
  })

  it('is localized: pt/es indexes differ from en', () => {
    const enTitles = new Set(loadIndex('en').map((d) => d.title))
    for (const locale of ['pt', 'es']) {
      const titles = loadIndex(locale).map((d) => d.title)
      const localized = titles.filter((t) => !enTitles.has(t)).length
      expect(localized, `${locale}-only titles vs en`).toBeGreaterThan(0)
    }
  })

  it('search entry counts stay within the documented band', () => {
    // verify_out.mjs documented 400–900 docs per locale; keep the guard rail.
    for (const locale of LOCALES) {
      const n = loadIndex(locale).length
      expect(n, `${locale}`).toBeGreaterThan(400)
      expect(n, `${locale}`).toBeLessThan(900)
    }
  })
})
