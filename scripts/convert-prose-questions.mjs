#!/usr/bin/env node
/**
 * Converts prose practice questions (the legacy `**1.** ... - A) ... ✅` format)
 * into machine-readable `question` fences, so old lessons can join the review
 * engine without rewriting their content.
 *
 * Safety:
 * - Skips lessons that already contain `question` fences.
 * - Skips multi-select blocks ("Select all that apply" or more than one ✅).
 * - Requires at least 5 convertible questions before writing.
 * - Dry-run by default; pass --write to apply.
 *
 * Usage: node scripts/convert-prose-questions.mjs <courseSlug> [--write]
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const courseSlug = process.argv[2]
const write = process.argv.includes('--write')

if (!courseSlug) {
  console.error('usage: node scripts/convert-prose-questions.mjs <courseSlug> [--write]')
  process.exit(2)
}

const enDir = path.join(ROOT, 'content', 'courses', courseSlug, 'en')
if (!fs.existsSync(enDir)) {
  console.error(`course has no en/ directory: ${courseSlug}`)
  process.exit(2)
}

function convertBlock(block) {
  const lines = block.split('\n').map((line) => line.trimEnd())
  const questionLine = lines.find((line) => /^\*\*\d+\.\*\*/.test(line))
  if (!questionLine) return null
  const question = questionLine.replace(/^\*\*\d+\.\*\*\s*/, '').trim()
  if (!question || /select all that apply/i.test(question)) return null

  const options = []
  let correct = -1
  let note = ''
  for (const line of lines) {
    const match = line.match(/^-\s+([A-Z])\)\s+(.*)$/)
    if (!match) continue
    let text = match[2]
    const isCorrect = text.includes('✅')
    text = text
      .replace(/\s*✅\s*/g, '')
      .replace(/\*\*/g, '')
      .trim()
    const annotation = text.match(/\*\(([^)]*)\)\*$/)
    if (annotation) {
      note = annotation[1].trim()
      text = text.replace(/\s*\*\([^)]*\)\*$/, '').trim()
    }
    if (isCorrect) {
      if (correct !== -1) return null // multi-select: not representable
      correct = options.length
    }
    options.push(text)
  }

  if (correct === -1 || options.length < 2) return null
  return { question, options, correct, note }
}

let converted = 0
for (const file of fs.readdirSync(enDir).filter((name) => name.endsWith('.md'))) {
  const filePath = path.join(enDir, file)
  const content = fs.readFileSync(filePath, 'utf8')
  if (/```question\b/.test(content)) continue

  const headingIndex = content.indexOf('## Practice Questions')
  if (headingIndex === -1) continue

  const before = content.slice(0, headingIndex)
  const section = content.slice(headingIndex)
  const blockHeading = section.match(/^## Practice Questions[^\n]*\n/)?.[0] ?? '## Practice Questions\n'
  const body = section.slice(blockHeading.length)

  const blocks = body.split(/\n\s*---\s*\n/)
  const parsed = blocks.map(convertBlock).filter(Boolean)
  if (parsed.length < 5) {
    console.log(`skip ${file}: only ${parsed.length} convertible question(s)`)
    continue
  }

  const lessonNumber = (file.match(/^(\d+)/) || [])[1] || '00'
  const eol = content.includes('\r\n') ? '\r\n' : '\n'
  const fences = parsed.map((question, index) => {
    const payload = {
      id: `${courseSlug}-${lessonNumber}-q${index + 1}`,
      type: 'multiple-choice',
      question: question.question,
      options: question.options,
      correct: question.correct,
      ...(question.note ? { explanation: question.note } : {}),
    }
    return '```question' + eol + JSON.stringify(payload, null, 2).split('\n').join(eol) + eol + '```'
  })

  const next = before + blockHeading + eol + fences.join(eol + eol) + eol
  console.log(`${write ? 'convert' : '[dry]'} ${file}: ${parsed.length} question(s)`)
  if (write) {
    fs.writeFileSync(filePath, next)
    converted += 1
  }
}

console.log(`convert-prose-questions(${courseSlug}): ${write ? `${converted} file(s) written` : 'dry run'}`)
