#!/usr/bin/env node
/**
 * Rewrites em dashes, en dashes and dash-like hyphens in lesson prose into
 * punctuation the read-aloud engine can voice: comma, semicolon, colon, or
 * "to" for numeric ranges.
 *
 * Why not a blind find and replace: "the guide — published in 2026 — is
 * authoritative" needs commas, "… at once — it tells you …" needs a semicolon,
 * and "### Case D — Edmunds.com" needs a colon. The rules below choose per
 * context.
 *
 * Rules:
 *   1. `10–20`, `2020–2025`              -> `10 to 20`       (numeric range)
 *   2. two dashes on one line             -> commas           (parenthetical)
 *   3. heading / table cell / list label  -> colon            (`### A — B`)
 *      a heading that already has a colon -> comma
 *   4. single dash before it/they/which…  -> semicolon        (two clauses)
 *   5. single dash before and/but/so…     -> comma            (coordinated)
 *   6. any other single dash              -> colon            (explanation)
 *   7. ` - ` or ` -- ` between words      -> rules 4–6        (dash, not minus)
 *   8. frontmatter                        -> comma            (a colon would
 *                                        break unquoted YAML scalars)
 *
 * Never touched: fenced code, inline code, table separator rows, `---` rules,
 * CLI flags (`--flag`), subtraction (`10 - 5`), compound hyphens
 * (`read-only`), product names (`ML Engineer - Associate`), and a dash at the
 * very start or end of a line (quote markers, wrapped lines).
 *
 * Usage:
 *   node scripts/normalise-prose.mjs                  # dry run + samples
 *   node scripts/normalise-prose.mjs --write          # apply
 *   node scripts/normalise-prose.mjs --sample=5       # samples per context
 *   node scripts/normalise-prose.mjs --only='PATTERN' # review one shape
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CONTENT = path.join(ROOT, 'content', 'courses')
const write = process.argv.includes('--write')
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

const perKind = Number((process.argv.find(a => a.startsWith('--sample=')) ?? '--sample=3').split('=')[1])
const onlyArg = process.argv.find(a => a.startsWith('--only='))
const only = onlyArg ? new RegExp(onlyArg.slice('--only='.length)) : null
const pathArg = process.argv.find(a => a.startsWith('--path='))
const pathFilter = pathArg ? pathArg.slice('--path='.length) : null

/** Coordinating conjunctions: a comma joins them, not a semicolon. */
const CONJUNCTION = /^(and|but|so|or|nor|yet|then|mas|e|y|pero|o|sino|nem|então|entao)$/i

/** Words that open a new independent clause: a semicolon joins them. */
const CLAUSE_START =
  /^(it|they|this|that|these|those|there|we|you|he|she|i|which|who|whom|whose|because|while|whereas|porém|porem|contudo|entretanto|sin|embargo|este|esta|esto|estos|estas|isso|isto|aquilo|ellos|ellas|nosotros|vocês|voces)$/i

function walk(dir, acc = [], extension = '.md') {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc, extension)
    else if (entry.name.endsWith(extension)) acc.push(full)
  }
  return acc
}

/** UI copy and course metadata live in JSON, not Markdown. */
function jsonFiles() {
  const courseFiles = walk(CONTENT, [], 'course.json')
  const dictionaries = fs.existsSync(path.join(ROOT, 'dictionaries'))
    ? walk(path.join(ROOT, 'dictionaries'), [], '.json')
    : []
  return [...courseFiles, ...dictionaries]
}

function tidy(text) {
  // Preserve leading indentation: nested lists, blockquotes and JSON all rely
  // on it, and collapsing it silently breaks structure.
  const leading = /^[ \t]*/.exec(text)[0]
  const body = text
    .slice(leading.length)
    .replace(/[ \t]+([,;:.])/g, '$1')
    .replace(/([,;:])(?:\s*[,;:])+/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+$/, '')
  return leading + body
}

function separatorFor(after, context) {
  if (context === 'frontmatter') return ', '
  // A heading that already carries a colon (`Case 1 — Name: detail`) would end
  // up with two, so it gets a comma instead.
  if (context === 'heading' && after.includes(':')) return ', '
  const firstWord = /^[*_]*([A-Za-zÀ-ÿ]+)/.exec(after.trimStart())?.[1] ?? ''
  if (firstWord && CONJUNCTION.test(firstWord)) return ', '
  if (firstWord && CLAUSE_START.test(firstWord)) return '; '
  return ': '
}

/** Character ranges covered by inline code, which must never be rewritten. */
function codeRanges(line) {
  const ranges = []
  const push = re => {
    let match
    while ((match = re.exec(line)) !== null) {
      ranges.push([match.index, match.index + match[0].length])
    }
  }
  push(/`[^`]*`/g)
  // Only maths-looking `$...$` spans. Currency also uses `$`, and treating
  // `$0.03 ... $1.25` as a maths span would hide everything between them.
  const mathRe = /\$[^$\n]{1,80}\$/g
  let match
  while ((match = mathRe.exec(line)) !== null) {
    const body = match[0]
    // Maths starts with a letter/backslash or contains LaTeX syntax. A pair of
    // prices ("$0,024/GB ... = $983") must not be treated as a maths span, or
    // everything between them, including dashes, is skipped.
    if (/[\\^_{}]/.test(body) || /^\$[A-Za-z\\]/.test(body)) {
      ranges.push([match.index, match.index + body.length])
    }
  }
  return ranges
}

const inRanges = (ranges, index) => ranges.some(([start, end]) => index >= start && index < end)

function transformProse(text, context, ranges, stats) {
  // 1. Numeric ranges. No spaces around the dash is the range spelling:
  //    10–20, $0.0025–$0.02, 4,5%–13%, 5—12. With spaces, only an en dash
  //    counts, so "2026 — 20 TB" (a label separator) is left alone.
  let out = text.replace(/(\$?\d[\d.,]*%?)[–—](\$?\d[\d.,]*%?)/g, (match, from, to, offset) =>
    inRanges(ranges, offset) ? match : `${from} to ${to}`
  )
  out = out.replace(/(\$?\d[\d.,]*%?)\s*–\s*(\$?\d[\d.,]*%?)/g, (match, from, to, offset) =>
    inRanges(ranges, offset) ? match : `${from} to ${to}`
  )
  // A table cell is a value, not a sentence: "$5 — $10" is a range there.
  if (context === 'table') {
    out = out.replace(/(\$?\d[\d.,]*%?)\s*—\s*(\$?\d[\d.,]*%?)/g, (match, from, to, offset) =>
      inRanges(ranges, offset) ? match : `${from} to ${to}`
    )
  }

  // Collect the dashes that are outside code, with their replacement span.
  const dashes = []
  const dashRe = /\s*[—–]\s*/g
  let match
  while ((match = dashRe.exec(out)) !== null) {
    if (inRanges(ranges, match.index)) continue
    const start = match.index
    const end = start + match[0].length
    dashes.push({
      start,
      end,
      match: match[0],
      atStart: !out.slice(0, start).trim(),
      atEnd: !out.slice(end).trim(),
      after: out.slice(end),
    })
  }

  if (dashes.length > 0) {
    // 2. A pair on one line is a parenthetical aside.
    const pairable =
      dashes.length >= 2 &&
      dashes.length % 2 === 0 &&
      dashes.every(dash => !dash.atStart && !dash.atEnd)

    let cursor = 0
    let rebuilt = ''
    for (const dash of dashes) {
      rebuilt += out.slice(cursor, dash.start)
      if (pairable) {
        rebuilt += ', '
      } else if (dash.atStart || dash.atEnd) {
        rebuilt += dash.match
        stats.skipped += 1
      } else {
        rebuilt += separatorFor(dash.after, context)
      }
      cursor = dash.end
    }
    out = rebuilt + out.slice(cursor)
  }

  // 7a. Spaced double hyphens are dashes. Two on a line are a parenthetical
  //     aside, the same as a pair of em dashes.
  const doubleHyphens = out.match(/\s--\s/g) ?? []
  const pairDouble = doubleHyphens.length >= 2 && doubleHyphens.length % 2 === 0
  out = out.replace(/\s+--\s+/g, (match, offset) => {
    if (inRanges(ranges, offset)) return match
    // A table cell that is only dashes means "no value", not a dash.
    if (context === 'table') {
      const cellStart = out.lastIndexOf('|', offset)
      const cellEnd = out.indexOf('|', offset + match.length)
      if (cellStart !== -1 && cellEnd !== -1 && /^[-–—\s]+$/.test(out.slice(cellStart + 1, cellEnd))) {
        return match
      }
    }
    if (pairDouble) return ', '
    return separatorFor(out.slice(offset + match.length), context)
  })

  // 7b. A spaced single hyphen is a dash unless it joins a proper name.
  //     "ML Engineer - Associate" is a product name and stays as it is;
  //     "it is right - and why" is a dash.
  // The left side may be a number ("Dominio 4 - Directrices"); the right side
  // must be a word, so subtraction ("10 - 5") is never touched.
  out = out.replace(
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.'’]*|\d+)\s+-\s+([A-Za-zÀ-ÿ*_][A-Za-zÀ-ÿ.'’]*)/g,
    (match, before, first, offset) => {
      if (inRanges(ranges, offset)) return match
      // "ML Engineer - Associate" is a product name, not a dash. Headings and
      // labels are separators, so the name test does not apply there.
      const nameContext = context === 'prose' || context === 'table'
      // A single capital letter is a label ("A - Audiência"), not a name.
      const isProperName =
        nameContext &&
        /^[A-ZÀ-Þ]/.test(before) &&
        !/^[A-ZÀ-Þ]$/.test(before) &&
        /^[A-ZÀ-Þ]/.test(first)
      if (isProperName) return match
      const after = out.slice(offset + match.length)
      return `${before}${separatorFor(after, context)}${first}`
    }
  )

  return tidy(out)
}

function contextOf(line) {
  if (/^\s*#{1,6}\s/.test(line)) return 'heading'
  if (/^\s*\|/.test(line)) return 'table'
  // `- **Term** — description` and `> **Term** - description`
  if (/^\s*(?:>\s*)?(?:[-*+]\s+|\d+[.)]\s+)?\*\*[^*]+\*\*\s*[—–-]/.test(line)) return 'label'
  return 'prose'
}

const stats = { files: 0, changedFiles: 0, dashes: 0, skipped: 0, byKind: {} }
const samples = {}

for (const file of walk(CONTENT)) {
  const rel = path.relative(ROOT, file)
  if (pathFilter && !rel.includes(pathFilter)) continue
  const original = fs.readFileSync(file, 'utf8')
  const lines = original.split('\n')

  let inFence = false
  let fenceLang = ''
  let inFrontmatter = false
  let inDisplayMath = false
  let firstLine = true

  const next = lines.map(line => {
    const fenceMatch = /^\s*(?:```|~~~)\s*([\w-]*)/.exec(line)
    if (fenceMatch) {
      if (!inFence) {
        inFence = true
        fenceLang = fenceMatch[1].toLowerCase()
      } else {
        inFence = false
        fenceLang = ''
      }
      return line
    }
    if (inFence) {
      // Quiz and widget JSON is rendered text, so its strings are prose too.
      // Source code, diagrams and config samples are left alone.
      if (!INTERACTIVE_FENCES.has(fenceLang)) return line
      if (only && !only.test(line)) return line
      if (!/[—–]/.test(line) && !/\s--?\s/.test(line)) return line
      const ranges = codeRanges(line)
      const replaced = transformProse(line, 'prose', ranges, stats)
      if (replaced === line) return line
      stats.dashes += (line.match(/[—–]/g) ?? []).length
      stats.byKind.interactive = (stats.byKind.interactive ?? 0) + 1
      collectSample('interactive', rel, line, replaced)
      return replaced
    }

    // `$$ ... $$` is LaTeX; a colon inside a formula breaks KaTeX.
    if (inDisplayMath) {
      if (line.trim().endsWith('$$')) inDisplayMath = false
      return line
    }
    if (line.trim().startsWith('$$')) {
      const singleLine = line.trim().length > 4 && line.trim().endsWith('$$')
      if (!singleLine) inDisplayMath = true
      return line
    }

    if (only && !only.test(line)) {
      // Keep frontmatter detection in sync even when filtering.
      if (firstLine && line.trim() === '---') {
        inFrontmatter = true
        firstLine = false
      } else if (inFrontmatter && line.trim() === '---') {
        inFrontmatter = false
      }
      return line
    }

    // YAML frontmatter: only the opening block, before the first body line.
    if (firstLine && line.trim() === '---') {
      inFrontmatter = true
      firstLine = false
      return line
    }
    if (inFrontmatter) {
      if (line.trim() === '---') {
        inFrontmatter = false
        return line
      }
      if (!/[—–]/.test(line)) return line
      const ranges = codeRanges(line)
      const replaced = transformProse(line, 'frontmatter', ranges, stats)
      stats.dashes += (line.match(/[—–]/g) ?? []).length
      collectSample('frontmatter', rel, line, replaced)
      return replaced
    }
    firstLine = false

    if (/^\s*\|?[\s:|-]{5,}\|?\s*$/.test(line) || /^\s*-{3,}\s*$/.test(line)) return line
    const withoutCode = line.replace(/`[^`]*`/g, ' ')
    if (!/[—–]/.test(withoutCode) && !/\s--?\s/.test(withoutCode)) {
      return line
    }

    const context = contextOf(line)
    const ranges = codeRanges(line)
    const replaced = transformProse(line, context, ranges, stats)
    if (replaced === line) return line

    stats.dashes += (line.match(/[—–]/g) ?? []).length
    stats.byKind[context] = (stats.byKind[context] ?? 0) + 1
    collectSample(context, rel, line, replaced)
    return replaced
  })

  stats.files += 1
  const result = next.join('\n')
  if (result !== original) {
    stats.changedFiles += 1
    if (write) fs.writeFileSync(file, result)
  }
}

// JSON copy (course descriptions, dictionaries): same rules, comma separator,
// because a colon is fine inside a JSON string but a comma reads better in a
// subtitle.
for (const file of jsonFiles()) {
  const rel = path.relative(ROOT, file)
  if (pathFilter && !rel.includes(pathFilter)) continue
  const original = fs.readFileSync(file, 'utf8')
  const lines = original.split('\n')
  const next = lines.map(line => {
    if (!/[—–]/.test(line)) return line
    if (only && !only.test(line)) return line
    const ranges = codeRanges(line)
    const replaced = transformProse(line, 'frontmatter', ranges, stats)
    stats.dashes += (line.match(/[—–]/g) ?? []).length
    collectSample('json', rel, line, replaced)
    return replaced
  })
  stats.files += 1
  const result = next.join('\n')
  if (result !== original) {
    stats.changedFiles += 1
    if (write) fs.writeFileSync(file, result)
  }
}

function collectSample(kind, rel, before, after) {
  if (before === after) return
  const bucket = (samples[kind] ??= [])
  if (bucket.length < perKind) bucket.push({ rel, before, after })
}

const rewritten = Object.values(stats.byKind).reduce((sum, n) => sum + n, 0)
console.log(`normalise-prose: ${write ? 'applied' : 'dry run'}`)
console.log(`  files scanned  : ${stats.files}`)
console.log(`  files changed  : ${stats.changedFiles}`)
console.log(`  lines rewritten: ${rewritten}`)
console.log(`  dashes found   : ${stats.dashes} (${stats.skipped} left as markers/wrapped lines)`)
console.log(`  by context     : ${JSON.stringify(stats.byKind)}`)

if (!write) {
  console.log('\nSample rewrites by context:')
  for (const [kind, bucket] of Object.entries(samples)) {
    console.log(`\n[${kind}]`)
    for (const { rel, before, after } of bucket) {
      let start = 0
      while (start < before.length && before[start] === after[start]) start += 1
      const from = Math.max(0, start - 55)
      console.log(`  ${rel}`)
      console.log(`  - …${before.slice(from, from + 150).trim()}`)
      console.log(`  + …${after.slice(from, from + 150).trim()}`)
    }
  }
  console.log('\nNothing written. Re-run with --write to apply.')
}
