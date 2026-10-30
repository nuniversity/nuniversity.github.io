// Artifact suite — every content-derived route must exist in the export.
// Derives expected routes from content/ (not hardcoded counts) so content
// additions fail here if the build drops them.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  OUT,
  OUT_READY,
  LOCALES,
  exists,
  read,
} from './support/helpers.mjs'

describe.skipIf(!OUT_READY)('emitted routes cover content', () => {
  it('exports the core static routes for every locale', () => {
    const core = [
      'index.html',
      'about/index.html',
      'contact/index.html',
      'library/index.html',
      'partners/index.html',
      'review/index.html',
      'tools/index.html',
      'games/index.html',
      'quizzes/index.html',
      'quizzes/certificates/index.html',
      'roadmaps/index.html',
      'languages/index.html',
      '404/index.html',
    ]
    for (const locale of LOCALES) {
      for (const rel of core) {
        expect(exists(`${locale}/${rel}`), `${locale}/${rel}`).toBe(true)
      }
    }
  })

  it('exports every game page for every game JSON', () => {
    // Note: game categories have no index pages by design (the hub links
    // straight to game pages); only the detail routes are asserted.
    const gamesDir = path.join(OUT, '..', 'content', 'games')
    const categories = fs
      .readdirSync(gamesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    for (const locale of LOCALES) {
      for (const cat of categories) {
        for (const file of fs.readdirSync(path.join(gamesDir, cat))) {
          if (!file.endsWith('.json')) continue
          const slug = file.replace(/\.json$/, '')
          expect(
            exists(`${locale}/games/${cat}/${slug}/index.html`),
            `${locale}/games/${cat}/${slug}/`
          ).toBe(true)
        }
      }
    }
  })

  it('exports every tool page for every tool × locale', () => {
    const toolsDir = path.join(OUT, '..', 'content', 'tools')
    const slugs = fs
      .readdirSync(toolsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    expect(slugs.length).toBeGreaterThanOrEqual(10)
    for (const locale of LOCALES) {
      for (const slug of slugs) {
        expect(
          exists(`${locale}/tools/${slug}/index.html`),
          `${locale}/tools/${slug}/`
        ).toBe(true)
      }
    }
  })

  it('exports every quiz detail page for every quiz JSON', () => {
    const quizzesDir = path.join(OUT, '..', 'content', 'quizzes')
    const slugs = fs
      .readdirSync(quizzesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
    expect(slugs.length).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      for (const slug of slugs) {
        expect(
          exists(`${locale}/quizzes/${slug}/index.html`),
          `${locale}/quizzes/${slug}/`
        ).toBe(true)
      }
    }
  })


  it('exports every library analysis page', () => {
    for (const locale of LOCALES) {
      const analysisDir = path.join(OUT, '..', 'content', 'library', locale, 'analysis')
      if (!fs.existsSync(analysisDir)) continue
      for (const file of fs.readdirSync(analysisDir)) {
        if (!file.endsWith('.md')) continue
        const id = file.replace(/\.md$/, '')
        expect(
          exists(`${locale}/library/analysis/${id}/index.html`),
          `${locale}/library/analysis/${id}/`
        ).toBe(true)
      }
    }
  })

  it('exports every roadmap page', () => {
    const roadmapsDir = path.join(OUT, '..', 'content', 'roadmaps')
    const slugs = fs
      .readdirSync(roadmapsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    expect(slugs.length).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      for (const slug of slugs) {
        expect(
          exists(`${locale}/roadmaps/${slug}/index.html`),
          `${locale}/roadmaps/${slug}/`
        ).toBe(true)
      }
    }
  })

  it('exports every language pair hub and activity player', () => {
    const vocabDir = path.join(
      OUT,
      '..',
      'content',
      'languages',
      'vocabulary'
    )
    const activities = fs
      .readdirSync(vocabDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
    expect(activities.length).toBeGreaterThanOrEqual(5)
    for (const locale of LOCALES) {
      expect(exists(`${locale}/languages/index.html`)).toBe(true)
      for (const slug of activities) {
        // Activity slug `en-to-pt` lives under its language_pair route segment
        // (language_pair is { source, target } → "en-pt").
        const doc = JSON.parse(
          fs.readFileSync(path.join(vocabDir, `${slug}.json`), 'utf8')
        )
        const pair = `${doc.language_pair.source}-${doc.language_pair.target}`
        expect(
          exists(`${locale}/languages/${pair}/${slug}/index.html`),
          `${locale}/languages/${pair}/${slug}/`
        ).toBe(true)
      }
    }
  })

  it('exports a landing page for every course that has lessons in that locale (or EN fallback)', () => {
    const coursesDir = path.join(OUT, '..', 'content', 'courses')
    const missing = []
    let checked = 0
    for (const locale of LOCALES) {
      for (const course of fs.readdirSync(coursesDir)) {
        const courseDir = path.join(coursesDir, course)
        if (!fs.statSync(courseDir).isDirectory()) continue
        const localeDir = path.join(courseDir, locale)
        const enDir = path.join(courseDir, 'en')
        const targetDir = fs.existsSync(localeDir)
          ? localeDir
          : fs.existsSync(enDir)
            ? enDir
            : null
        if (!targetDir) continue
        const hasLessons = fs
          .readdirSync(targetDir)
          .some((f) => f.endsWith('.md'))
        if (!hasLessons) continue
        checked++
        if (!exists(`${locale}/courses/${course}/index.html`)) {
          missing.push(`${locale}/courses/${course}`)
        }
      }
    }
    expect(checked).toBeGreaterThan(40)
    expect(missing, `missing course landings: ${missing.slice(0, 5).join(', ')}`).toEqual([])
  })

  it('exports every lesson page for every course lesson', () => {
    const coursesDir = path.join(OUT, '..', 'content', 'courses')
    const missing = []
    let checked = 0
    for (const locale of LOCALES) {
      for (const course of fs.readdirSync(coursesDir)) {
        const courseDir = path.join(coursesDir, course)
        if (!fs.statSync(courseDir).isDirectory()) continue
        const localeDir = path.join(courseDir, locale)
        const enDir = path.join(courseDir, 'en')
        const targetDir = fs.existsSync(localeDir)
          ? localeDir
          : fs.existsSync(enDir)
            ? enDir
            : null
        if (!targetDir) continue
        const lessons = fs
          .readdirSync(targetDir)
          .filter((f) => f.endsWith('.md'))
          .map((f) => f.replace(/\.md$/, ''))
        for (const lesson of lessons) {
          checked++
          if (!exists(`${locale}/courses/${course}/${lesson}/index.html`)) {
            missing.push(`${locale}/courses/${course}/${lesson}`)
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000)
    expect(missing, `missing lessons: ${missing.slice(0, 5).join(', ')}`).toEqual([])
  })

  it('renders localized exam-simulation callouts (EN + PT spot check)', () => {
    const en = 'en/courses/aws-clf-c02/15-exam-simulation-a/index.html'
    const pt = 'pt/courses/aws-clf-c02/15-exam-simulation-a/index.html'
    expect(exists(en)).toBe(true)
    expect(read(en)).toContain('Start Exam')
    expect(exists(pt)).toBe(true)
    expect(read(pt)).toContain('Iniciar Exame')
  })
})
