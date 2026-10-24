import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const LOCALES = ['en', 'pt', 'es']

interface RawEntry {
  id: string
  type: string
  title: string
  description: string
  url: string
  text?: string
  courseSlug?: string
}

const load = (lang: string): RawEntry[] =>
  JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'search-index', `${lang}.json`), 'utf8'))

const indexes: Record<string, RawEntry[]> = {}

beforeAll(() => {
  execFileSync('node', ['scripts/generate-search-index.mjs'], { encoding: 'utf8', timeout: 60_000 })
  for (const lang of LOCALES) indexes[lang] = load(lang)
}, 60_000)

describe('search index generator', () => {
  it('emits 400-900 entries for every locale', () => {
    for (const lang of LOCALES) {
      expect(indexes[lang].length).toBeGreaterThanOrEqual(400)
      expect(indexes[lang].length).toBeLessThanOrEqual(900)
    }
  })

  it('covers all eight entry types in en', () => {
    const types = new Set(indexes.en.map(entry => entry.type))
    expect(Array.from(types).sort()).toEqual(
      ['course', 'game', 'language', 'lesson', 'library', 'quiz', 'roadmap', 'tool'].sort()
    )
  })

  it('produces unique ids and non-empty titles per locale', () => {
    for (const lang of LOCALES) {
      const ids = new Set(indexes[lang].map(entry => entry.id))
      expect(ids.size).toBe(indexes[lang].length)
      expect(indexes[lang].every(entry => entry.title.trim().length > 0)).toBe(true)
      expect(indexes[lang].every(entry => entry.id.startsWith(`${lang}:`))).toBe(true)
    }
  })

  it('emits internal urls with leading and trailing slashes', () => {
    for (const entry of indexes.en) {
      if (entry.url.startsWith('http')) continue
      expect(entry.url.startsWith('/')).toBe(true)
      expect(entry.url.endsWith('/')).toBe(true)
      expect(entry.url.startsWith(`/${entry.id.split(':')[0]}/`)).toBe(true)
    }
  })

  it('carries courseSlug on course and lesson entries', () => {
    const courseEntries = indexes.en.filter((entry) => entry.type === 'course' || entry.type === 'lesson')
    expect(courseEntries.length).toBeGreaterThan(0)
    for (const entry of courseEntries) {
      expect(entry.courseSlug).toBeTruthy()
      expect(entry.url).toContain(`/courses/${entry.courseSlug}/`)
    }
  })

  it('keeps library entries external', () => {
    const library = indexes.en.filter(entry => entry.type === 'library')
    expect(library.length).toBeGreaterThan(0)
    expect(library.every(entry => /^https?:\/\//.test(entry.url))).toBe(true)
  })

  it('localizes titles: pt differs from en on shared lessons', () => {
    const enByUrl = new Map(indexes.en.map(entry => [entry.url, entry]))
    let compared = 0
    let differing = 0
    for (const entry of indexes.pt) {
      const enEntry = enByUrl.get(entry.url.replace('/pt/', '/en/'))
      if (!enEntry || enEntry.type !== 'lesson') continue
      compared += 1
      if (enEntry.title !== entry.title) differing += 1
    }
    expect(compared).toBeGreaterThan(50)
    expect(differing).toBeGreaterThan(50)
  })

  it('indexes lesson urls under the course tree', () => {
    const lessons = indexes.en.filter(entry => entry.type === 'lesson')
    expect(lessons.length).toBeGreaterThan(300)
    expect(lessons.every(entry => /^\/en\/courses\/[^/]+\/[^/]+\/$/.test(entry.url))).toBe(true)
  })
})
