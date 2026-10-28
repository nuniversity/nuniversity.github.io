// Artifact suite — the shipped question index (per-course question banks
// consumed by practice/revision features) must be structurally valid and
// consistent with the emitted lesson pages.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { OUT, OUT_READY, LOCALES, exists, read } from './support/helpers.mjs'

function courseQuestionFiles(locale) {
  const dir = path.join(OUT, 'question-index', locale)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      course: f.replace(/\.json$/, ''),
      data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')),
    }))
}

describe.skipIf(!OUT_READY)('question index integrity', () => {
  it('exports a per-course question bank for every locale', () => {
    for (const locale of LOCALES) {
      const banks = courseQuestionFiles(locale)
      expect(banks.length, `${locale} banks`).toBeGreaterThan(40)
    }
  })

  it('every question is well-formed and count matches the payload', () => {
    const bad = []
    for (const locale of LOCALES) {
      for (const { course, data } of courseQuestionFiles(locale)) {
        if (data.lang !== locale || data.course !== course) {
          bad.push(`${locale}/${course}: metadata mismatch`)
        }
        if (!Array.isArray(data.questions)) {
          bad.push(`${locale}/${course}: questions is not an array`)
          continue
        }
        if (data.count !== data.questions.length) {
          bad.push(`${locale}/${course}: count ${data.count} != ${data.questions.length} questions`)
        }
        for (const q of data.questions) {
          if (!q.id || !q.question || !q.type) {
            bad.push(`${locale}/${course}/${q.id}: missing base fields`)
            continue
          }
          if (q.type === 'multiple-choice') {
            if (!Array.isArray(q.options) || q.options.length < 2) {
              bad.push(`${locale}/${course}/${q.id}: MCQ needs >=2 options`)
            } else if (
              typeof q.correct !== 'number' ||
              q.correct < 0 ||
              q.correct >= q.options.length
            ) {
              bad.push(`${locale}/${course}/${q.id}: correct index out of range`)
            }
          }
          // The referenced lesson page must exist in the export.
          if (q.lesson && !exists(`${locale}/courses/${course}/${q.lesson}/index.html`)) {
            bad.push(`${locale}/${course}/${q.id}: lesson page missing: ${q.lesson}`)
          }
        }
        if (bad.length > 20) break
      }
    }
    expect(bad, bad.slice(0, 10).join(' | ')).toEqual([])
  })

  it('question ids are unique within each bank', () => {
    for (const locale of LOCALES) {
      for (const { course, data } of courseQuestionFiles(locale)) {
        const ids = data.questions.map((q) => q.id)
        expect(new Set(ids).size, `${locale}/${course}`).toBe(ids.length)
      }
    }
  })
})
