#!/usr/bin/env node
/**
 * Lints lesson prose for content that breaks the layout on narrow screens.
 *
 * The rule: a long unbroken token cannot wrap, so on a phone it pushes the
 * whole page sideways. Such values belong in a code span or a code block,
 * never in a sentence.
 *
 * Checks:
 *   - unbroken tokens longer than 60 characters in prose
 *   - ASCII-art separators made of repeated `=` or `*`
 *
 * Table cells are not checked: tables scroll horizontally inside their own
 * wrapper, so a wide cell cannot widen the page.
 *
 * The CSS now wraps long tokens (`overflow-wrap: anywhere`), so this is an
 * **advisory** report about authoring style, not a build failure. Pass
 * `--strict` to make findings exit non-zero.
 *
 * Usage:  node scripts/lint-prose.mjs [--max=N] [--strict]
 * Exit:   0 by default, 1 with --strict and findings
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT = path.join(ROOT, 'content', 'courses')
const MAX_TOKEN = 60

const args = process.argv.slice(2)
const maxArg = args.find(a => a.startsWith('--max='))
const maxToken = maxArg ? Number(maxArg.split('=')[1]) : MAX_TOKEN
const strict = args.includes('--strict')

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (entry.name.endsWith('.md')) acc.push(full)
  }
  return acc
}

const findings = []

for (const file of walk(CONTENT)) {
  const rel = path.relative(ROOT, file)
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  let inFence = false
  let fenceMarker = ''

  lines.forEach((line, index) => {
    const trimmed = line.trimStart()

    // Track fenced blocks so their contents are not linted.
    const fence = /^(`{3,}|~{3,})/.exec(trimmed)
    if (fence) {
      if (!inFence) {
        inFence = true
        fenceMarker = fence[1][0]
      } else if (trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false
      }
      return
    }
    if (inFence) return

    // Strip inline code before looking at tokens.
    const withoutInlineCode = line.replace(/`[^`]*`/g, ' ')

    // ASCII-art separators.
    if (/^[ \t]*[=*]{20,}[ \t]*$/.test(line)) {
      findings.push({ rel, line: index + 1, kind: 'separator', detail: `${line.trim().length} characters` })
    }

    // Long unbroken tokens.
    const tokens = withoutInlineCode.match(/[^\s]+/g) ?? []
    for (const token of tokens) {
      // Ignore URLs in link targets, markdown syntax and HTML attributes.
      if (token.startsWith('http://') || token.startsWith('https://')) continue
      if (token.startsWith('|') || token.startsWith('<!--')) continue
      if (token.length > maxToken) {
        findings.push({
          rel,
          line: index + 1,
          kind: 'token',
          detail: `${token.length} chars: ${token.slice(0, 50)}…`,
        })
      }
    }
  })
}

const byKind = findings.reduce((acc, f) => {
  acc[f.kind] = (acc[f.kind] ?? 0) + 1
  return acc
}, {})

if (findings.length === 0) {
  console.log(`lint-prose: clean (max token ${maxToken})`)
  process.exit(0)
}

console.log(`lint-prose: ${findings.length} advisory finding(s) — ${JSON.stringify(byKind)}`)
for (const finding of findings.slice(0, 20)) {
  console.log(`  ${finding.rel}:${finding.line}  [${finding.kind}]  ${finding.detail}`)
}
if (findings.length > 20) console.log(`  … and ${findings.length - 20} more`)

console.log('\nLong values read better in a code span or a code block:')
console.log('  ✗  The bucket is s3://my-company-production-data-lake/raw/events/2026/01/01/part-0001.parquet')
console.log('  ✓  The bucket path is shown below.')
console.log('')

process.exit(strict ? 1 : 0)
