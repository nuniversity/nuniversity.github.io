import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const LOCALES = ['en', 'pt', 'es'] as const

function load(locale: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'dictionaries', `${locale}.json`), 'utf8'))
}

function flatten(value: unknown, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>()
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const next = prefix ? `${prefix}.${key}` : key
      if (child && typeof child === 'object') {
        for (const [path, leaf] of Array.from(flatten(child, next).entries())) out.set(path, leaf)
      } else {
        out.set(next, child)
      }
    }
  }
  return out
}

function placeholders(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return Array.from(value.matchAll(/\{(\w+)\}/g)).map((match) => match[1]).sort()
}

describe('dictionaries', () => {
  const en = flatten(load('en'))
  const locales = Object.fromEntries(LOCALES.map((locale) => [locale, flatten(load(locale))]))

  it.each(LOCALES)('%s has exactly the English key set', (locale) => {
    const keys = locales[locale]
    const missing = Array.from(en.keys()).filter((key) => !keys.has(key))
    const extra = Array.from(keys.keys()).filter((key) => !en.has(key))

    expect(missing, `${locale} is missing keys`).toEqual([])
    expect(extra, `${locale} has keys that English does not`).toEqual([])
  })

  it.each(LOCALES.filter((locale) => locale !== 'en'))(
    '%s keeps the same {placeholders} as English',
    (locale) => {
      const translations = locales[locale]
      const broken: string[] = []

      for (const [key, english] of Array.from(en.entries())) {
        const translated = translations.get(key)
        const a = placeholders(english)
        const b = placeholders(translated)
        if (a.length === 0 && b.length === 0) continue
        if (a.join(',') !== b.join(',')) {
          broken.push(`${key}: en=[${a.join(',')}] ${locale}=[${b.join(',')}]`)
        }
      }

      expect(broken).toEqual([])
    }
  )

  it.each(LOCALES)('%s has no empty UI strings', (locale) => {
    const empty = Array.from(locales[locale].entries())
      .filter(([, value]) => typeof value === 'string' && value.trim() === '')
      .map(([key]) => key)

    expect(empty).toEqual([])
  })
})
