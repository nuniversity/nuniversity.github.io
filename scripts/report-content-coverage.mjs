#!/usr/bin/env node
/**
 * Per-course coverage report: question/codeexercise/glossary/resources fences,
 * mermaid diagrams, media, and lessons missing `skills` frontmatter.
 * Read-only. Used to plan the content rollout waves.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const COURSES = path.join(ROOT, 'content', 'courses')
const FENCES = ['question', 'codeexercise', 'glossary', 'resources']

function frontmatterOf(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match ? match[1] : ''
}

const rows = []
let totalLessons = 0
let missingSkills = 0

for (const entry of fs
  .readdirSync(COURSES, { withFileTypes: true })
  .filter((item) => item.isDirectory())) {
  const slug = entry.name
  const enDir = path.join(COURSES, slug, 'en')
  if (!fs.existsSync(enDir)) continue

  const counts = Object.fromEntries(FENCES.map((fence) => [fence, 0]))
  let lessons = 0
  let mermaid = 0
  let media = 0
  let noSkills = 0

  for (const file of fs.readdirSync(enDir).filter((name) => name.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(enDir, file), 'utf8')
    lessons += 1
    totalLessons += 1
    for (const fence of FENCES) {
      counts[fence] += (text.match(new RegExp('```' + fence + '\\b', 'g')) || []).length
    }
    mermaid += (text.match(/```mermaid\b/g) || []).length
    if (/!\[[^\]]*\]\([^)]+\)/.test(text) || /```video\b/.test(text)) media += 1
    if (!/^skills:/m.test(frontmatterOf(text))) {
      noSkills += 1
      missingSkills += 1
    }  }

  rows.push({ slug, lessons, ...counts, mermaid, media, noSkills })
}

rows.sort((a, b) => a.slug.localeCompare(b.slug))
console.log(['course', 'lessons', ...FENCES, 'mermaid', 'media', 'noSkills'].join('\t'))
for (const row of rows) console.log(Object.values(row).join('\t'))
console.log(`\nLessons: ${totalLessons} · missing skills frontmatter: ${missingSkills}`)
