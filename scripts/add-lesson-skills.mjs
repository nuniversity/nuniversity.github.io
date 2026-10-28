#!/usr/bin/env node
/**
 * Inserts `skills` (and optional `objectives`) into lesson frontmatter across
 * en/pt/es from a reviewable map file. Idempotent: lessons that already declare
 * `skills` are skipped. Dry-run by default; pass --write to apply.
 *
 * Map file format:
 * { "01-lesson-slug": { "skills": ["tag"], "objectives": ["...", "..."] } }
 *
 * Usage:
 *   node scripts/add-lesson-skills.mjs <courseSlug> <skills-map.json> [--write]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const courseSlug = process.argv[2]
const mapPath = process.argv[3]
const write = process.argv.includes('--write')

if (!courseSlug || !mapPath) {
  console.error('usage: node scripts/add-lesson-skills.mjs <courseSlug> <skills-map.json> [--write]')
  process.exit(2)
}

const courseDir = path.join(ROOT, 'content', 'courses', courseSlug)
const courseFile = path.join(courseDir, 'course.json')
if (!fs.existsSync(courseFile)) {
  console.error(`course not found: ${courseSlug}`)
  process.exit(2)
}

const course = JSON.parse(fs.readFileSync(courseFile, 'utf8'))
const taxonomy = Array.isArray(course.skills) ? new Set(course.skills) : null
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'))

let changed = 0
let skipped = 0
let malformed = 0

for (const [lessonSlug, entry] of Object.entries(map)) {
  const skills = entry?.skills
  if (!Array.isArray(skills) || skills.length === 0 || skills.length > 3) {
    console.error(`MAP ERROR ${lessonSlug}: skills must be a list of 1-3 tags`)
    process.exit(2)
  }
  if (taxonomy && !skills.every((tag) => taxonomy.has(tag))) {
    console.error(`MAP ERROR ${lessonSlug}: ${skills.join(', ')} outside course taxonomy`)
    process.exit(2)
  }
  const objectives = Array.isArray(entry?.objectives) && entry.objectives.length > 0
    ? entry.objectives
    : null

  for (const locale of ['en', 'pt', 'es']) {
    const filePath = path.join(courseDir, locale, `${lessonSlug}.md`)
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf8')
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/)
    if (!match) {
      console.error(`SKIP ${locale}/${lessonSlug}: no frontmatter`)
      malformed += 1
      continue
    }
    if (/^skills:/m.test(match[1])) {
      skipped += 1
      continue
    }
    if (!write) {
      console.log(`[dry] ${locale}/${lessonSlug}: +skills(${skills.length})${objectives ? ' +objectives' : ''}`)
      continue
    }
    const eol = content.includes('\r\n') ? '\r\n' : '\n'
    const lines = ['skills:', ...skills.map((tag) => `  - ${tag}`)]
    if (objectives) {
      lines.push('objectives:', ...objectives.map((objective) => `  - ${JSON.stringify(objective)}`))
    }
    const updated =
      '---' + eol + match[1] + eol + lines.join(eol) + eol + '---' + eol + content.slice(match[0].length)
    fs.writeFileSync(filePath, updated)
    changed += 1
  }
}

console.log(
  `add-lesson-skills(${courseSlug}): ${write ? `${changed} file(s) written` : 'dry run'} · ` +
    `${skipped} already tagged · ${malformed} malformed`
)
