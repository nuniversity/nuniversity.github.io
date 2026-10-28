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
 *   - read-aloud punctuation: em dashes, en dashes, `--` and spaced hyphens
 *   - parenthetical asides longer than 80 characters
 *
 * The lesson is read aloud by the browser's speech engine, which skips dashes
 * instead of voicing them. A sentence written with an em dash loses its pause
 * and runs the two clauses together, so authors are asked to use a comma,
 * semicolon, colon or full stop instead.
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

/** Fences whose content is rendered prose (quiz text), not source code. */
const INTERACTIVE_FENCES = new Set([
  'question',
  'matching',
  'fillblank',
  'dragdrop',
  'plot',
  'video',
  'phet',
  'molecule',
  'interactive',
])

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
const counts = { token: 0, separator: 0, dash: 0, 'double-hyphen': 0, 'spaced-hyphen': 0, parenthetical: 0 }
const NOTE = 20

/** Records a finding, keeping the report short but the totals exact. */
function note(kind, rel, line, detail) {
  counts[kind] += 1
  if (findings.length < NOTE) findings.push({ rel, line, kind, detail })
}

for (const file of walk(CONTENT)) {
  const rel = path.relative(ROOT, file)
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  let inFence = false
  let fenceMarker = ''
  let fenceLang = ''

  lines.forEach((line, index) => {
    const trimmed = line.trimStart()

    // Track fenced blocks so their contents are not linted, except the
    // interactive ones, whose JSON strings are rendered text.
    const fence = /^(`{3,}|~{3,})\s*([\w-]*)/.exec(trimmed)
    if (fence) {
      if (!inFence) {
        inFence = true
        fenceMarker = fence[1][0]
        fenceLang = (fence[2] ?? '').toLowerCase()
      } else if (trimmed.startsWith(fenceMarker.repeat(3))) {
        inFence = false
        fenceLang = ''
      }
      return
    }
    if (inFence && !INTERACTIVE_FENCES.has(fenceLang)) return

    // Strip inline code and inline math before looking at tokens.
    const withoutInlineCode = line
      .replace(/`[^`]*`/g, ' ')
      // Only strip maths-looking spans; currency also uses `$`.
      .replace(/\$[^$\n]{1,80}\$/g, match =>
        /[\\^_{}]/.test(match) || /^\$[A-Za-z\\]/.test(match) ? ' ' : match
      )

    // ASCII-art separators.
    if (/^[ \t]*[=*]{20,}[ \t]*$/.test(line)) {
      note('separator', rel, index + 1, `${line.trim().length} characters`)
    }

    // Read-aloud punctuation. Table separator rows (`| --- |`) are structure,
    // not prose, and are skipped.
    // HTML comments are not rendered, so their `--` is not prose.
    const isComment = line.includes('<!--') || line.includes('-->')
    const isTableRule = /^\s*\|?[\s:|-]{5,}\|?\s*$/.test(line)
    // Remove blockquote markers and the list bullet so `> - item` is not
    // mistaken for a dash.
    const proseOnly = withoutInlineCode
      .replace(/^\s*(?:>\s*)+/, '')
      .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
    if (!isTableRule && !isComment) {
      if (/[\u2014\u2013]/.test(withoutInlineCode)) {
        note('dash', rel, index + 1, 'em dash or en dash: use , ; : or a full stop')
      } else if (
        /(?<!-)--(?![\w-])/.test(proseOnly) &&
        !/\|\s*--\s*\|/.test(withoutInlineCode)
      ) {
        note('double-hyphen', rel, index + 1, '`--` used as a dash: use , ; : or a full stop')
      } else if (
        /\S\s+-\s+\S/.test(proseOnly) &&
        !/[A-ZÀ-Þ][\w.'’]*\s+-\s+[A-ZÀ-Þ]/.test(proseOnly)
      ) {
        note('spaced-hyphen', rel, index + 1, 'hyphen used as a dash: use a comma or semicolon')
      }
      const parenthetical = /\(([^()]{80,})\)/.exec(withoutInlineCode)
      if (parenthetical) {
        note('parenthetical', rel, index + 1, `${parenthetical[1].length} chars inside parentheses`)
      }
    }

    // Long unbroken tokens.
    const tokens = withoutInlineCode.match(/[^\s]+/g) ?? []
    for (const token of tokens) {
      // Ignore URLs in link targets, markdown syntax and HTML attributes.
      if (token.startsWith('http://') || token.startsWith('https://')) continue
      if (token.startsWith('|') || token.startsWith('<!--')) continue
      if (token.length > maxToken) {
        note('token', rel, index + 1, `${token.length} chars: ${token.slice(0, 50)}…`)
      }
    }
  })
}

const total = Object.values(counts).reduce((sum, n) => sum + n, 0)

if (total === 0) {
  console.log(`lint-prose: clean (max token ${maxToken})`)
  process.exit(0)
}

console.log(`lint-prose: ${total} advisory finding(s) — ${JSON.stringify(counts)}`)
for (const finding of findings) {
  console.log(`  ${finding.rel}:${finding.line}  [${finding.kind}]  ${finding.detail}`)
}
if (total > findings.length) console.log(`  … showing ${findings.length} of ${total}`)

console.log('\nRead-aloud punctuation:')
console.log('  ✗  A queue absorbs bursts — the worker drains it (and retries), e.g. slowly.')
console.log('  ✓  A queue absorbs bursts; the worker drains it and retries slowly.')
console.log('\nLong values read better in a code span or a code block:')
console.log('  ✗  The bucket is s3://my-company-production-data-lake/raw/events/2026/01/01/part-0001.parquet')
console.log('  ✓  The bucket path is shown below.')
console.log('')

process.exit(strict ? 1 : 0)
