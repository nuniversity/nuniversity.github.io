#!/usr/bin/env node
/**
 * Verifies that every Tailwind class used in the source actually made it into
 * the compiled stylesheet.
 *
 * Tailwind silently drops a class when it cannot resolve it — most often
 * because a colour was defined without the `<alpha-value>` placeholder (which
 * makes every `/opacity` variant invalid), or because the class only ever
 * appears in a file outside the `content` globs.
 *
 * Those failures are invisible in the HTML but remove the styling at runtime,
 * so they are checked here rather than left to a manual review.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'out')
const SCAN_DIRS = ['app', 'components', 'lib', 'src']

if (!fs.existsSync(OUT)) {
  console.error('verify-css: out/ not found — run `next build` first')
  process.exit(1)
}

/** Recursively list files with the given extensions. */
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

/** Collect the compiled CSS. */
const cssDir = path.join(OUT, '_next', 'static', 'css')
const cssFiles = fs.existsSync(cssDir) ? fs.readdirSync(cssDir).filter(f => f.endsWith('.css')) : []
if (cssFiles.length === 0) {
  console.error('verify-css: no compiled CSS found in out/_next/static/css')
  process.exit(1)
}
const css = cssFiles.map(f => fs.readFileSync(path.join(cssDir, f), 'utf8')).join('\n')

/** Classes we know cannot be statically resolved, or that are not utilities. */
const IGNORED = new Set([
  'container-custom',
  'section-padding',
  'gradient-bg',
  'glass-effect',
  'card-hover',
  'text-gradient',
  'btn',
  'btn-primary',
  'btn-secondary',
  'btn-ghost',
  'btn-accent',
  'btn-danger',
  'btn-sm',
  'btn-lg',
  'card',
  'badge',
  'input',
  'select',
  'textarea',
  'skip-link',
  'empty-state',
  'callout',
  'callout-header',
  'callout-icon',
  'callout-label',
  'callout-body',
  'prose-measure',
  'prose-wide',
  'page-shell',
  'section',
  'stagger',
  'animate-fade-in-up',
  'animate-fade-in',
  'animate-scale-in',
  'animate-slide-down',
  'not-prose',
  'mermaid-wrapper',
  'mermaid-content',
  'mermaid-scroll-container',
  'zoom-controls-toolbar',
  'zoom-btn',
  'zoom-level',
  'zoom-divider',
  'mermaid-error-container',
  'zoom-hint',
  'katex-display',
  'katex-error',
  // Test ids and score-widget ids that live in the same string as class names.
  'outline-check',
  'outline-resizer',
  'fill-blank-items',
  'fill-blank-template',
])

/**
 * Candidate utility classes: a token prefix, an optional variant prefix,
 * and an optional `/opacity` modifier.
 */
const UTILITY_RE =
  /(?<![\w:-])((?:(?:hover|focus|focus-visible|active|disabled|group-hover|peer-hover|dark|sm|md|lg|xl|2xl|first|last|odd|even|before|after|placeholder)-)*(?:bg|text|border|ring|shadow|outline|divide|from|to|via|fill|stroke|decoration|accent|caret)-(?!--)[a-z0-9-]+(?:\/[0-9]{1,3})?)(?![\w-])/g

const used = new Map()

/** Drop comments so prose inside them is not mistaken for a class name. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const src = stripComments(fs.readFileSync(file, 'utf8'))
    let match
    while ((match = UTILITY_RE.exec(src)) !== null) {
      const cls = match[1]
      const base = cls.replace(/^(?:[a-z0-9-]+-)*?(bg|text|border|ring|shadow|outline|divide|from|to|via|fill|stroke|decoration|accent|caret)-/, '$1-')
      if (IGNORED.has(base) || IGNORED.has(cls)) continue
      if (!used.has(cls)) used.set(cls, path.relative(ROOT, file))
    }
  }
}

/** Escape a class name the way Tailwind does, for a CSS selector lookup. */
function escaped(cls) {
  return cls.replace(/([:/.])/g, '\\$1')
}

const missing = []
for (const [cls, file] of used) {
  // A class may be emitted with variants, so look for the escaped base.
  const needle = `.${escaped(cls)}`
  if (!css.includes(needle)) {
    missing.push({ cls, file })
  }
}

if (missing.length > 0) {
  console.error(`\nverify-css: ${missing.length} class(es) used in source but missing from the compiled CSS:\n`)
  for (const { cls, file } of missing.slice(0, 40)) {
    console.error(`  ${cls.padEnd(42)} ${file}`)
  }
  if (missing.length > 40) console.error(`  … and ${missing.length - 40} more`)
  console.error('\nCommon causes:')
  console.error('  · the colour is defined without the <alpha-value> placeholder, so /opacity variants are dropped')
  console.error('  · the class only appears in a file outside the Tailwind `content` globs')
  console.error('  · the class name is constructed dynamically and cannot be detected by the scanner')
  console.error('')
  process.exit(1)
}

console.log(`verify-css: all ${used.size} utility classes resolved`)
