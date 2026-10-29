#!/usr/bin/env node
/**
 * Validates language-course content under `content/language-courses/`.
 *
 * Usage: node scripts/validate-language-course.mjs [--course <id>]
 * Exit codes: 0 = valid, 2 = validation errors found.
 *
 * Checks (per the LanguageCourse schema in lib/language-courses/types.ts):
 *  - course.json: manifest shape, unit slugs/orders, grammar registry.
 *  - vocab.json: unique stable ids, non-empty pairs, level/topics.
 *  - lessons: step payload shapes, reference integrity (vocab + grammar),
 *    option/correct bounds, word banks, step-id uniqueness, prose-safety
 *    (browser TTS skips em/en dashes and `--`, so they are banned in spoken
 *    and visible strings).
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT_ROOT = path.join(ROOT, 'content', 'language-courses')

const DASH_CHARS = /—|–|\s--\s|\s--$|^--\s/
const SEPARATOR_CHARS = /===|\*\*\*/

const args = process.argv.slice(2)
const courseFilter = args.includes('--course') ? args[args.indexOf('--course') + 1] : null

let errorCount = 0
const errors = []

function fail(file, message) {
  errorCount += 1
  errors.push(`${path.relative(ROOT, file)}: ${message}`)
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch (error) {
    fail(file, `invalid JSON: ${error.message}`)
    return null
  }
}

/** LocalizedText: en+pt required, es optional; all values prose-safe. */
function checkLocalizedText(file, where, value, { requireBoth = true } = {}) {
  if (typeof value !== 'object' || value === null) {
    fail(file, `${where}: expected an object with en/pt text`)
    return
  }
  if (typeof value.en !== 'string' || value.en.trim() === '') {
    fail(file, `${where}.en is missing`)
  }
  if (requireBoth && (typeof value.pt !== 'string' || value.pt.trim() === '')) {
    fail(file, `${where}.pt is missing`)
  }
  for (const key of ['en', 'pt', 'es']) {
    const text = value[key]
    if (typeof text !== 'string') continue
    if (DASH_CHARS.test(text) || SEPARATOR_CHARS.test(text)) {
      fail(file, `${where}.${key} contains a dash character that browser TTS skips ("${text.slice(0, 60)}")`)
    }
  }
}

function checkProseString(file, where, text) {
  if (typeof text !== 'string') return
  if (DASH_CHARS.test(text) || SEPARATOR_CHARS.test(text)) {
    fail(file, `${where} contains a dash character that browser TTS skips ("${text.slice(0, 60)}")`)
  }
}

function checkChoice(file, where, options, correct, { min = 2, max = 6 } = {}) {
  if (!Array.isArray(options) || options.length < min || options.length > max) {
    fail(file, `${where}: options must be an array of ${min}-${max} items`)
    return
  }
  if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
    fail(file, `${where}: correct index ${correct} is out of range`)
  }
}

const COURSE_IDS = new Set()

function validateCourse(dir) {
  const courseId = path.basename(dir)
  if (courseFilter && courseId !== courseFilter) return
  COURSE_IDS.add(courseId)

  const courseFile = path.join(dir, 'course.json')
  const course = readJson(courseFile)
  if (!course) return

  if (typeof course.id !== 'string' || course.id !== courseId) {
    fail(courseFile, `id must match the directory name ("${courseId}")`)
  }
  checkLocalizedText(courseFile, 'name', course.name)
  checkLocalizedText(courseFile, 'description', course.description)
  if (typeof course.source !== 'string' || course.source.length < 2) fail(courseFile, 'source (L1) is required')
  if (typeof course.target !== 'string' || course.target.length < 2) fail(courseFile, 'target (L2) is required')
  if (course.source === course.target) fail(courseFile, 'source and target must differ')
  if (course.flags !== undefined) {
    const flags = course.flags
    if (typeof flags !== 'object' || flags === null) fail(courseFile, 'flags must be an object')
    else {
      for (const side of ['source', 'target']) {
        const code = flags[side]
        if (typeof code !== 'string' || !/^[a-z]{2}$/.test(code)) {
          fail(courseFile, `flags.${side} must be a 2-letter flag file code (e.g. br, gb)`)
        }
      }
    }
  }
  if (!['A1', 'A2', 'B1'].includes(course.cefrTarget)) fail(courseFile, 'cefrTarget must be A1, A2 or B1')
  if (!['beginner', 'intermediate', 'advanced'].includes(course.difficulty)) fail(courseFile, 'invalid difficulty')

  const unitSlugs = new Set()
  const lessonSlugsByUnit = new Map()
  if (!Array.isArray(course.units) || course.units.length === 0) {
    fail(courseFile, 'units must be a non-empty array')
  } else {
    course.units.forEach((unit, index) => {
      const where = `units[${index}]`
      if (typeof unit.slug !== 'string' || !/^[a-z0-9-]+$/.test(unit.slug)) {
        fail(courseFile, `${where}.slug must be kebab-case`)
        return
      }
      if (unitSlugs.has(unit.slug)) fail(courseFile, `${where}: duplicate unit slug ${unit.slug}`)
      unitSlugs.add(unit.slug)
      checkLocalizedText(courseFile, `${where}.title`, unit.title)
      checkLocalizedText(courseFile, `${where}.description`, unit.description)
      if (!['A1', 'A2', 'B1'].includes(unit.cefr)) fail(courseFile, `${where}.cefr must be A1, A2 or B1`)
      if (!Array.isArray(unit.lessons) || unit.lessons.length === 0) {
        fail(courseFile, `${where}.lessons must be a non-empty array`)
      } else {
        const lessonSlugs = new Set()
        for (const lesson of unit.lessons) {
          if (typeof lesson.slug !== 'string' || !/^[a-z0-9-]+$/.test(lesson.slug)) {
            fail(courseFile, `${where}.lessons: invalid slug ${JSON.stringify(lesson.slug)}`)
            continue
          }
          if (lessonSlugs.has(lesson.slug)) fail(courseFile, `${where}: duplicate lesson slug ${lesson.slug}`)
          lessonSlugs.add(lesson.slug)
          checkLocalizedText(courseFile, `${where}.lessons[${lesson.slug}].title`, lesson.title)
        }
        lessonSlugsByUnit.set(unit.slug, lessonSlugs)
      }
    })
  }

  const grammarIds = new Set()
  if (!Array.isArray(course.grammar) || course.grammar.length === 0) {
    fail(courseFile, 'grammar must be a non-empty array')
  } else {
    course.grammar.forEach((point, index) => {
      const where = `grammar[${index}]`
      if (typeof point.id !== 'string' || !/^g-[a-z0-9-]+$/.test(point.id)) {
        fail(courseFile, `${where}.id must match g-<kebab-case>`)
      } else if (grammarIds.has(point.id)) {
        fail(courseFile, `${where}: duplicate grammar id ${point.id}`)
      }
      grammarIds.add(point.id)
      checkLocalizedText(courseFile, `${where}.title`, point.title)
      checkProseString(courseFile, `${where}.pattern`, point.pattern)
      checkLocalizedText(courseFile, `${where}.tip`, point.tip)
      if (point.compare) {
        checkProseString(courseFile, `${where}.compare.pt`, point.compare.pt)
        checkProseString(courseFile, `${where}.compare.en`, point.compare.en)
        checkLocalizedText(courseFile, `${where}.compare.note`, point.compare.note)
      }
      if (!Array.isArray(point.examples)) {
        fail(courseFile, `${where}.examples must be an array`)
      } else {
        point.examples.forEach((example, i) => {
          checkProseString(courseFile, `${where}.examples[${i}].en`, example.en)
          checkProseString(courseFile, `${where}.examples[${i}].pt`, example.pt)
        })
      }
    })
  }

  // ---- vocab.json ----
  const vocabFile = path.join(dir, 'vocab.json')
  const vocab = readJson(vocabFile)
  const vocabIds = new Set()
  if (!Array.isArray(vocab) || vocab.length === 0) {
    fail(vocabFile, 'vocab must be a non-empty array')
  } else {
    const sources = new Map()
    vocab.forEach((item, index) => {
      const where = `vocab[${index}]`
      if (typeof item.id !== 'string' || !/^w\d{3,}$/.test(item.id)) {
        fail(vocabFile, `${where}.id must match wNNN (e.g. w001), got ${JSON.stringify(item.id)}`)
      } else if (vocabIds.has(item.id)) {
        fail(vocabFile, `${where}: duplicate vocab id ${item.id}`)
      }
      vocabIds.add(item.id)
      if (typeof item.source !== 'string' || item.source.trim() === '') fail(vocabFile, `${where}.source is required`)
      if (typeof item.target !== 'string' || item.target.trim() === '') fail(vocabFile, `${where}.target is required`)
      if (item.source && item.target && item.source.trim().toLowerCase() === item.target.trim().toLowerCase()) {
        fail(vocabFile, `${where}: source and target are identical`)
      }
      const sourceKey = item.source?.trim().toLowerCase()
      if (sourceKey) {
        if (sources.has(sourceKey)) {
          fail(vocabFile, `${where}: duplicate source word "${item.source}" (also ${sources.get(sourceKey)}); matching exercises become ambiguous`)
        } else {
          sources.set(sourceKey, item.id)
        }
      }
      if (!['A1', 'A2', 'B1'].includes(item.level)) fail(vocabFile, `${where}.level must be A1, A2 or B1`)
      if (!Array.isArray(item.topics) || item.topics.length === 0) fail(vocabFile, `${where}.topics must be a non-empty array`)
      checkProseString(vocabFile, `${where}.source`, item.source)
      if (item.example) checkProseString(vocabFile, `${where}.example`, item.example)
    })
  }

  // ---- lessons ----
  const unitsDir = path.join(dir, 'units')
  if (!fs.existsSync(unitsDir)) {
    fail(dir, 'units directory is missing')
    return
  }
  for (const unitEntry of fs.readdirSync(unitsDir, { withFileTypes: true })) {
    if (!unitEntry.isDirectory()) continue
    if (!unitSlugs.has(unitEntry.name)) {
      fail(path.join(unitsDir, unitEntry.name), `unit directory is not declared in course.json`)
      continue
    }
    const lessonsDir = path.join(unitsDir, unitEntry.name, 'lessons')
    if (!fs.existsSync(lessonsDir)) {
      fail(lessonsDir, 'lessons directory is missing')
      continue
    }
    const manifestSlugs = lessonSlugsByUnit.get(unitEntry.name) ?? new Set()
    const files = fs.readdirSync(lessonsDir).filter((f) => f.endsWith('.json')).sort()
    const fileSlugs = files.map((f) => f.replace(/\.json$/, '').replace(/^\d{2}-/, ''))
    for (const file of files) {
      const slug = file.replace(/\.json$/, '').replace(/^\d{2}-/, '')
      if (!manifestSlugs.has(slug)) {
        fail(path.join(lessonsDir, file), `lesson file is not declared in course.json units (expected one of: ${[...manifestSlugs].join(', ')})`)
      }
      validateLesson(path.join(lessonsDir, file), courseId, unitEntry.name, slug, vocabIds, grammarIds)
    }
    // Slugs must stay unique after stripping the numeric prefix.
    const seenSlugs = new Set()
    for (const slug of fileSlugs) {
      if (seenSlugs.has(slug)) fail(lessonsDir, `duplicate lesson slug after prefix strip: ${slug}`)
      seenSlugs.add(slug)
    }
    for (const slug of manifestSlugs) {
      if (!fileSlugs.includes(slug)) {
        fail(path.join(lessonsDir), `declared lesson ${slug} has no file`)
      }
    }
  }
}

const VOCAB_STEP_MIN = 3
const VOCAB_STEP_MAX = 8

function validateLesson(file, courseId, unitSlug, slug, vocabIds, grammarIds) {
  const lesson = readJson(file)
  if (!lesson) return

  const expectedId = `${courseId}::${unitSlug}::${slug}`
  if (lesson.id !== expectedId) fail(file, `id must be "${expectedId}", got "${lesson.id}"`)
  if (lesson.unit !== unitSlug) fail(file, `unit must be "${unitSlug}"`)
  if (!Number.isInteger(lesson.order) || lesson.order < 1) fail(file, 'order must be a positive integer')
  checkLocalizedText(file, 'title', lesson.title)
  checkLocalizedText(file, 'goal', lesson.goal)
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length === 0) fail(file, 'objectives must be a non-empty array')
  if (!Array.isArray(lesson.vocabIds)) fail(file, 'vocabIds must be an array')
  if (!Number.isInteger(lesson.xp) || lesson.xp < 0) fail(file, 'xp must be a non-negative integer')

  if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) {
    fail(file, 'steps must be a non-empty array')
    return
  }
  if (lesson.steps.length > 16) fail(file, `too many steps (${lesson.steps.length}); keep lessons within 16 steps`)

  const stepIds = new Set()
  lesson.steps.forEach((step, index) => {
    const where = `steps[${index}](${step.id ?? 'missing-id'})`
    if (typeof step.id !== 'string' || !/^s\d{2,}$/.test(step.id)) {
      fail(file, `${where}: step id must match sNN`)
    } else if (stepIds.has(step.id)) {
      fail(file, `${where}: duplicate step id`)
    }
    stepIds.add(step.id)
    if (step.skill && !['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary'].includes(step.skill)) {
      fail(file, `${where}: invalid skill ${step.skill}`)
    }

    switch (step.type) {
      case 'knowledge':
        checkLocalizedText(file, `${where}.title`, step.title)
        checkProseString(file, `${where}.text`, step.text)
        if (typeof step.text !== 'string' || step.text.trim().length < 20) fail(file, `${where}.text is too short for a knowledge card`)
        checkLocalizedText(file, `${where}.translation`, step.translation)
        break
      case 'input': {
        if (!Array.isArray(step.lines) || step.lines.length < 3 || step.lines.length > 12) {
          fail(file, `${where}.lines must have 3-12 entries`)
          break
        }
        step.lines.forEach((line, i) => {
          checkProseString(file, `${where}.lines[${i}].text`, line.text)
          checkProseString(file, `${where}.lines[${i}].translation`, line.translation)
          if (!line.text || !line.translation) fail(file, `${where}.lines[${i}] needs text and translation`)
          if (line.gender !== undefined && !['male', 'female'].includes(line.gender)) {
            fail(file, `${where}.lines[${i}].gender must be "male" or "female"`)
          }
          if (line.enhance !== undefined) {
            if (!Array.isArray(line.enhance) || line.enhance.length === 0 || line.enhance.length > 3) {
              fail(file, `${where}.lines[${i}].enhance must have 1-3 forms`)
            } else {
              for (const form of line.enhance) {
                if (typeof form !== 'string' || form.trim() === '') {
                  fail(file, `${where}.lines[${i}].enhance entries must be non-empty strings`)
                } else if (typeof line.text === 'string' && !line.text.includes(form)) {
                  fail(file, `${where}.lines[${i}].enhance form "${form}" does not appear in the line text`)
                }
              }
            }
          }
        })
        break
      }
      case 'vocab': {
        if (!Array.isArray(step.vocabIds) || step.vocabIds.length < VOCAB_STEP_MIN || step.vocabIds.length > VOCAB_STEP_MAX) {
          fail(file, `${where}.vocabIds must have ${VOCAB_STEP_MIN}-${VOCAB_STEP_MAX} items`)
          break
        }
        for (const id of step.vocabIds) {
          if (!vocabIds.has(id)) fail(file, `${where}: unknown vocab id "${id}"`)
        }
        break
      }
      case 'tip':
        if (!grammarIds.has(step.grammarId)) fail(file, `${where}: unknown grammarId "${step.grammarId}"`)
        break
      case 'select':
        checkLocalizedText(file, `${where}.prompt`, step.prompt)
        checkChoice(file, `${where}`, step.options, step.correct, { min: 3, max: 4 })
        checkProseString(file, `${where}.question`, step.question)
        if (typeof step.question !== 'string' || step.question.trim() === '') fail(file, `${where}.question is required`)
        break
      case 'match':
        checkLocalizedText(file, `${where}.prompt`, step.prompt)
        if (!Array.isArray(step.pairs) || step.pairs.length < 3 || step.pairs.length > 6) {
          fail(file, `${where}.pairs must have 3-6 pairs`)
        }
        break
      case 'listen':
        checkLocalizedText(file, `${where}.prompt`, step.prompt)
        checkChoice(file, `${where}`, step.options, step.correct, { min: 3, max: 4 })
        checkProseString(file, `${where}.audio`, step.audio)
        if (typeof step.audio !== 'string' || step.audio.trim() === '') fail(file, `${where}.audio is required`)
        break
      case 'dictation':
        checkProseString(file, `${where}.audio`, step.audio)
        checkProseString(file, `${where}.answer`, step.answer)
        if (typeof step.answer !== 'string' || step.answer.trim().length < 3) fail(file, `${where}.answer is required`)
        if (step.answer && /—|–/.test(step.answer)) fail(file, `${where}.answer must not contain dashes`)
        break
      case 'build': {
        checkLocalizedText(file, `${where}.prompt`, step.prompt)
        checkProseString(file, `${where}.source`, step.source)
        checkProseString(file, `${where}.answer`, step.answer)
        if (!Array.isArray(step.bank) || step.bank.length < 3) {
          fail(file, `${where}.bank must have at least 3 tokens`)
          break
        }
        if (typeof step.answer === 'string' && Array.isArray(step.bank)) {
          const answerWords = step.answer.toLowerCase().replace(/[.,!?;:'"]/g, '').split(/\s+/).filter(Boolean)
          const bankWords = step.bank.map((w) => String(w).toLowerCase().replace(/[.,!?;:'"]/g, ''))
          const pool = [...bankWords]
          for (const word of answerWords) {
            const at = pool.indexOf(word)
            if (at === -1) {
              fail(file, `${where}: answer word "${word}" is missing from the bank`)
              break
            }
            pool.splice(at, 1)
          }
          const distractors = pool.filter((w) => !answerWords.includes(w)).length
          if (distractors < 1) fail(file, `${where}: bank needs at least one distractor beyond the answer words`)
        }
        break
      }
      case 'fillblank':
        if (typeof step.sentence !== 'string' || !step.sentence.includes('___')) {
          fail(file, `${where}.sentence must contain ___ for the blank`)
        }
        checkProseString(file, `${where}.sentence`, step.sentence)
        checkChoice(file, `${where}`, step.options, step.correct, { min: 3, max: 4 })
        break
      case 'grammar': {
        checkLocalizedText(file, `${where}.prompt`, step.prompt)
        checkProseString(file, `${where}.question`, step.question)
        if (typeof step.question !== 'string' || step.question.trim() === '') fail(file, `${where}.question is required`)
        if (!Array.isArray(step.options) || step.options.length < 2 || step.options.length > 4) {
          fail(file, `${where}.options must have 2-4 interpretations`)
        } else {
          step.options.forEach((option, i) => checkLocalizedText(file, `${where}.options[${i}]`, option, { requireBoth: false }))
        }
        if (!Number.isInteger(step.correct) || step.correct < 0 || (step.options && step.correct >= step.options.length)) {
          fail(file, `${where}: correct index is out of range`)
        }
        break
      }
      case 'pairs':
        checkLocalizedText(file, `${where}.prompt`, step.prompt)
        if (!Array.isArray(step.trials) || step.trials.length < 2) {
          fail(file, `${where}.trials must have at least 2 trials`)
        } else {
          step.trials.forEach((trial, i) => {
            checkProseString(file, `${where}.trials[${i}].audio`, trial.audio)
            if (trial.correct !== 'a' && trial.correct !== 'b') fail(file, `${where}.trials[${i}].correct must be "a" or "b"`)
            if (!trial.choiceA || !trial.choiceB) fail(file, `${where}.trials[${i}] needs both choices`)
          })
        }
        break
      case 'speak':
        checkLocalizedText(file, `${where}.prompt`, step.prompt)
        if (!Array.isArray(step.lines) || step.lines.length < 1 || step.lines.length > 3) {
          fail(file, `${where}.lines must have 1-3 lines`)
        } else {
          step.lines.forEach((line, i) => {
            checkProseString(file, `${where}.lines[${i}].text`, line.text)
            if (!line.text || !line.translation) fail(file, `${where}.lines[${i}] needs text and translation`)
          })
        }
        if (step.mode !== 'shadow' && step.mode !== 'read') fail(file, `${where}.mode must be "shadow" or "read"`)
        break
      case 'review':
        if (step.count !== undefined && (!Number.isInteger(step.count) || step.count < 1 || step.count > 5)) {
          fail(file, `${where}.count must be 1-5`)
        }
        break
      case 'quiz':
        checkLocalizedText(file, `${where}.question`, step.question)
        checkChoice(file, `${where}`, step.options, step.correct, { min: 3, max: 4 })
        break
      default:
        fail(file, `${where}: unknown step type "${step.type}"`)
    }
  })

  // A lesson must train at least two different skills and end with production.
  const skills = new Set(lesson.steps.map((s) => s.skill).filter(Boolean))
  if (skills.size < 2) fail(file, `lesson trains fewer than 2 skills (${[...skills].join(', ') || 'none declared'})`)
  const hasProduction = lesson.steps.some((s) => ['dictation', 'build', 'speak'].includes(s.type))
  if (!hasProduction) fail(file, 'lesson has no production step (dictation, build or speak)')
}

function main() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    console.log('validate-language-course: no content/language-courses directory; nothing to validate.')
    return
  }
  for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
    if (entry.isDirectory()) validateCourse(path.join(CONTENT_ROOT, entry.name))
  }
  if (errorCount > 0) {
    console.error(`validate-language-course: ${errorCount} error(s)`)
    for (const message of errors) console.error(`  - ${message}`)
    process.exit(2)
  }
  console.log('validate-language-course: all language courses are valid.')
}

main()
