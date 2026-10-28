#!/usr/bin/env node
/**
 * Converts the generated lesson question index into Quizzes-app JSON, so
 * lesson fences stay the single source of truth.
 *
 * Writes to .scratch/question-bank/ by default. Pass --write to also write
 * content/quizzes/<course>.json; existing files are only replaced with --force.
 *
 * Requires: node scripts/build-question-index.mjs (run first).
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const INDEX_DIR = path.join(ROOT, 'public', 'question-index', 'en')
const OUT_DIR = path.join(ROOT, '.scratch', 'question-bank')
const QUIZ_DIR = path.join(ROOT, 'content', 'quizzes')
const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')

if (!fs.existsSync(INDEX_DIR)) {
  console.error('question index missing — run: node scripts/build-question-index.mjs')
  process.exit(2)
}

fs.mkdirSync(OUT_DIR, { recursive: true })
let exported = 0

for (const file of fs.readdirSync(INDEX_DIR).filter((name) => name.endsWith('.json'))) {
  const index = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, file), 'utf8'))
  if (index.count === 0) continue

  const lessons = [...new Set(index.questions.map((question) => question.lesson))].sort()
  const perLesson = Math.floor(100 / lessons.length)
  const domains = [{ id: '1.0', name: index.course, color: 'blue', subdomains: lessons }]
  const allocations = {}
  lessons.forEach((lesson, position) => {
    allocations[lesson] =
      position === lessons.length - 1 ? 100 - perLesson * (lessons.length - 1) : perLesson
  })

  const payload = {
    id: index.course,
    slug: index.course,
    kind: 'practice',
    category: 'course-practice',
    title: index.course,
    description: `Practice questions extracted from the ${index.course} course lessons.`,
    difficulty: 'intermediate',
    topic: 'Course',
    certification: '',
    durationSeconds: 1800,
    passingScore: 70,
    mockQuestionCount: Math.min(20, index.count),
    domains,
    allocations,
    questions: index.questions.map((question) => ({
      id: question.id,
      subdomain: question.lesson,
      type: 'mcq',
      question: question.question,
      options: question.options,
      correct: question.correct,
      explanation: question.explanation ?? '',
    })),
  }

  fs.writeFileSync(path.join(OUT_DIR, `${index.course}.json`), JSON.stringify(payload, null, 2))
  exported += 1

  if (WRITE) {
    const destination = path.join(QUIZ_DIR, `${index.course}.json`)
    if (fs.existsSync(destination) && !FORCE) {
      console.log(`skip (exists): content/quizzes/${index.course}.json`)
    } else {
      fs.writeFileSync(destination, JSON.stringify(payload, null, 2))
      console.log(`wrote: content/quizzes/${index.course}.json`)
    }
  }
}

console.log(`export-quiz-bank: ${exported} course(s) → ${path.relative(ROOT, OUT_DIR)}`)
