#!/usr/bin/env node
/**
 * Generates public/question-index/<lang>/<courseSlug>.json from lesson
 * markdown question fences. Mirrors the runtime locale fallback: when a
 * locale file is missing, the English content is indexed under that locale.
 * Idempotent; safe to re-run. Part of `npm run prebuild`.
 */
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { extractQuestionFences } from './lib/question-fences.mjs'

const ROOT = process.cwd()
const COURSES_DIR = path.join(ROOT, 'content', 'courses')
const OUT_DIR = path.join(ROOT, 'public', 'question-index')
const LOCALES = ['en', 'pt', 'es']

function listCourses() {
  return fs
    .readdirSync(COURSES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function readLessons(slug, locale) {
  const dir = path.join(COURSES_DIR, slug, locale)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const { content } = matter(fs.readFileSync(path.join(dir, file), 'utf8'))
      return { lessonSlug: file.replace(/\.md$/, ''), content }
    })
}

function readLessonsWithFallback(slug, locale) {
  const own = readLessons(slug, locale)
  if (own.length > 0) return own
  return locale === 'en' ? [] : readLessons(slug, 'en')
}

let total = 0
for (const locale of LOCALES) {
  const localeDir = path.join(OUT_DIR, locale)
  fs.mkdirSync(localeDir, { recursive: true })
  for (const slug of listCourses()) {
    const questions = []
    const usedIds = new Set()
    for (const { lessonSlug, content } of readLessonsWithFallback(slug, locale)) {
      for (const { index, data } of extractQuestionFences(content)) {
        const base =
          typeof data.id === 'string' && data.id.trim() !== ''
            ? data.id.trim()
            : `${lessonSlug}-${index}`
        // Course-prefixed: authored ids are unique per course, not globally.
        let id = `${slug}::${base}`
        while (usedIds.has(id)) id = `${id}#`
        usedIds.add(id)
        questions.push({
          id,
          lesson: lessonSlug,
          type: data.type === 'true-false' ? 'true-false' : 'multiple-choice',
          question: data.question,
          options: data.options.map(String),
          correct: data.correct,
          ...(typeof data.explanation === 'string' ? { explanation: data.explanation } : {}),
        })
      }
    }
    const payload = {
      course: slug,
      lang: locale,
      generatedAt: new Date().toISOString(),
      count: questions.length,
      questions,
    }
    fs.writeFileSync(path.join(localeDir, `${slug}.json`), JSON.stringify(payload))
    total += questions.length
  }
  console.log(`[question-index] ${locale}: ok`)
}
console.log(`[question-index] total questions: ${total}`)
