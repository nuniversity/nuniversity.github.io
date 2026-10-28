#!/usr/bin/env node
/**
 * Runs the course-writer validators over every course.
 *
 * Migration mode (default): lessons that declare `skills` frontmatter are
 * "engine-adopted" and must pass rc 2 strictly. Legacy lessons without
 * `skills` report rc 2 as a migration warning so CI is not blocked by the
 * pre-existing backlog; the rollout waves flip courses to strict one by one.
 * Pass --strict to enforce rc 2 for every lesson (the eventual target).
 *
 * NOTE: validate_course.py takes OPENCODE_SKILL_DIR = the course directory,
 * while validate_lesson.py takes OPENCODE_FILE_PATH = the lesson file.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = process.cwd()
const COURSES = path.join(ROOT, 'content', 'courses')
const SKILL = path.join(ROOT, '.opencode', 'skills', 'course-writer', 'scripts')
const PY = process.env.PYTHON || 'python3'
const STRICT = process.argv.includes('--strict')

function hasSkills(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8')
    const match = text.match(/^---\n([\s\S]*?)\n---/)
    return Boolean(match && /^skills:/m.test(match[1]))
  } catch {
    return false
  }
}

let failed = 0
let adoptedFailures = 0
let legacyFailures = 0
let warned = 0

for (const entry of fs
  .readdirSync(COURSES, { withFileTypes: true })
  .filter((item) => item.isDirectory())) {
  const courseDir = path.join(COURSES, entry.name)
  if (!fs.existsSync(path.join(courseDir, 'course.json'))) continue

  const courseRun = spawnSync(PY, [path.join(SKILL, 'validate_course.py')], {
    env: { ...process.env, OPENCODE_SKILL_DIR: courseDir },
    encoding: 'utf8',
  })
  if (courseRun.status === 2) {
    failed += 1
    console.error(`[course] ${entry.name}: FAIL\n${courseRun.stderr}`)
  } else if (courseRun.status === 1) {
    warned += 1
  }

  const enDir = path.join(courseDir, 'en')
  if (!fs.existsSync(enDir)) continue
  for (const file of fs.readdirSync(enDir).filter((name) => name.endsWith('.md'))) {
    const lessonPath = path.join(enDir, file)
    const run = spawnSync(PY, [path.join(SKILL, 'validate_lesson.py')], {
      env: { ...process.env, OPENCODE_FILE_PATH: lessonPath },
      encoding: 'utf8',
    })
    if (run.status === 2) {
      if (STRICT || hasSkills(lessonPath)) {
        failed += 1
        adoptedFailures += 1
        console.error(`[lesson] ${entry.name}/${file}: FAIL\n${run.stderr}`)
      } else {
        legacyFailures += 1
      }
    } else if (run.status === 1) {
      warned += 1
    }
  }
}

console.log(
  `validate-courses: ${failed} blocking failure(s) ` +
    `(${adoptedFailures} in engine-adopted lessons), ${warned} warning file(s), ` +
    `${legacyFailures} legacy lesson(s) awaiting rollout` +
    (STRICT ? ' [strict]' : ' [migration mode]')
)
process.exit(failed > 0 ? 2 : 0)
