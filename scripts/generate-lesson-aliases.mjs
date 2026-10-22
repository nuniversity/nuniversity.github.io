import fs from 'node:fs'
import path from 'node:path'

const COURSES_DIR = path.join(process.cwd(), 'content', 'courses')
const DIVERGENT_COURSES = [
  'ddd-software-architecture',
  'nonprofit-organization-fundamentals',
  'practical-ai',
  'processes-flowchart',
  'solid-principles-oop',
]
const LOCALES = ['en', 'pt', 'es']
const OUT_PATH = path.join(process.cwd(), 'lib', 'i18n', 'course-lesson-aliases.json')

const aliases = {}

for (const course of DIVERGENT_COURSES) {
  aliases[course] = {}
  for (const locale of LOCALES) {
    const dir = path.join(COURSES_DIR, course, locale)
    if (!fs.existsSync(dir)) continue
    const byNumber = {}
    for (const file of fs.readdirSync(dir)) {
      const match = /^(\d{2})-/.exec(file)
      if (!match) continue
      byNumber[match[1]] = file.replace(/\.md$/, '')
    }
    aliases[course][locale] = byNumber
  }
}

fs.writeFileSync(OUT_PATH, JSON.stringify(aliases, null, 2) + '\n')
console.log(`Wrote ${OUT_PATH} (${Object.keys(aliases).length} courses)`)
