#!/usr/bin/env node
/**
 * Publishes the lesson media assets.
 *
 * Authors drop images and other files into `content/media/<course-slug>/`.
 * This copies them to `public/media/<course-slug>/` so the static export
 * serves them at `/media/<course-slug>/<file>`.
 *
 * Authors reference media by **absolute path** — `/media/<course-slug>/<file>` —
 * which needs no rewriting of the Markdown and cannot resolve to the wrong
 * lesson.
 *
 * Runs as a prebuild step, so `public/media/` is a generated directory and is
 * gitignored (like `public/search-index/`).
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SOURCE = path.join(ROOT, 'content', 'media')
const TARGET = path.join(ROOT, 'public', 'media')

/** File types that are safe to publish as static assets. */
const ALLOWED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
  '.webm',
  '.mp4',
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
])

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true })
  let count = 0
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    const destination = path.join(to, entry.name)
    if (entry.isDirectory()) {
      count += copyDir(source, destination)
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        console.error(`publish-media: skipped ${path.relative(ROOT, source)} (unsupported type)`)
        continue
      }
      fs.copyFileSync(source, destination)
      count += 1
    }
  }
  return count
}

// Always start from a clean directory so removed assets do not linger.
fs.rmSync(TARGET, { recursive: true, force: true })

if (!fs.existsSync(SOURCE)) {
  console.log('publish-media: no content/media directory — nothing to publish')
  process.exit(0)
}

const count = copyDir(SOURCE, TARGET)

if (count === 0) {
  console.log('publish-media: no media assets found')
} else {
  const bytes = fs
    .readdirSync(TARGET, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .reduce((sum, entry) => sum + fs.statSync(path.join(entry.parentPath ?? TARGET, entry.name)).size, 0)
  console.log(
    `publish-media: ${count} asset(s), ${(bytes / 1024).toFixed(0)} KB → public/media/`
  )
}
