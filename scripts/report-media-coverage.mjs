#!/usr/bin/env node
/** Read-only report: how many lessons per course embed an image or video,
 *  and how many media files exist for that course. Used for the media rollout. */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const COURSES = path.join(ROOT, 'content', 'courses')
const MEDIA = path.join(ROOT, 'content', 'media')

function mediaFiles(slug) {
  const dir = path.join(MEDIA, slug)
  if (!fs.existsSync(dir)) return 0
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((file) => fs.statSync(path.join(dir, file)).isFile()).length
}

let total = 0
let withMedia = 0
const courses = fs
  .readdirSync(COURSES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

for (const slug of courses) {
  const localeDir = path.join(COURSES, slug, 'en')
  if (!fs.existsSync(localeDir)) continue
  const lessons = fs.readdirSync(localeDir).filter((file) => file.endsWith('.md'))
  let covered = 0
  for (const file of lessons) {
    const content = fs.readFileSync(path.join(localeDir, file), 'utf8')
    total += 1
    if (/!\[[^\]]*\]\([^)]+\)/.test(content) || /```video\b/.test(content)) {
      covered += 1
      withMedia += 1
    }
  }
  const files = mediaFiles(slug)
  if (lessons.length > 0) {
    const percent = Math.round((covered / lessons.length) * 100)
    const flag = percent < 50 ? '  <-- needs media' : ''
    console.log(
      `${slug.padEnd(42)} ${String(covered).padStart(3)}/${String(lessons.length).padStart(3)} lessons (${percent}%), ${files} file(s)${flag}`
    )
  }
}

console.log(`\nTotal lessons with embedded media: ${withMedia}/${total}`)
