#!/usr/bin/env node
/**
 * Builds the static vocab index used by the daily review page:
 *
 *   out/vocab-index/<pair>.json
 *     { pair, generatedAt, course, items: [{ key, source, target }] }
 *
 * The review page looks up `lang::<pair>::<vocabId>` keys here to render
 * recall cards for vocabulary scheduled by language lessons.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT_ROOT = path.join(ROOT, 'content', 'language-courses')
// Like question-index, the vocab index is generated into `public/` during
// prebuild so the static export copies it into the site.
const OUT_DIR = path.join(ROOT, 'public', 'vocab-index')

function main() {
  if (!fs.existsSync(CONTENT_ROOT)) return
  fs.mkdirSync(OUT_DIR, { recursive: true })
  let courses = 0
  let items = 0
  for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const courseDir = path.join(CONTENT_ROOT, entry.name)
    const courseFile = path.join(courseDir, 'course.json')
    const vocabFile = path.join(courseDir, 'vocab.json')
    if (!fs.existsSync(courseFile) || !fs.existsSync(vocabFile)) continue
    const course = JSON.parse(fs.readFileSync(courseFile, 'utf-8'))
    const vocab = JSON.parse(fs.readFileSync(vocabFile, 'utf-8'))
    if (!Array.isArray(course.units) || !Array.isArray(vocab)) continue

    const pair = `${course.source}-${course.target}`
    const payload = {
      pair,
      course: course.id,
      generatedAt: new Date().toISOString(),
      items: vocab.map((item) => ({
        key: `lang::${pair}::${item.id}`,
        source: item.source,
        target: item.target,
      })),
    }
    fs.writeFileSync(path.join(OUT_DIR, `${pair}.json`), JSON.stringify(payload))
    courses += 1
    items += payload.items.length
  }
  console.log(`build-vocab-index: ${courses} index file(s), ${items} items`)
}

main()
