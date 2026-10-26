import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const css = fs.readFileSync(path.resolve(process.cwd(), 'app/globals.css'), 'utf-8')

/**
 * Course content is read on phones. A single long unbroken token in prose —
 * an ARN, a bucket path, a URL — used to push the whole page sideways.
 *
 * The fix has two halves, and both must stay in place:
 *  1. Text wraps (`overflow-wrap: anywhere`), including *inline* code.
 *  2. Code blocks scroll inside themselves instead of widening the page.
 */
describe('prose horizontal-overflow guard', () => {
  it('wraps body text', () => {
    expect(css).toMatch(/\.prose-measure :where\([\s\S]*?\)\s*\{[\s\S]*?overflow-wrap:\s*anywhere/)
  })

  it('does not exempt inline code from wrapping', () => {
    // The earlier bug: `code` shared a rule with `pre` and was set to
    // `overflow-wrap: normal`, so a long identifier in a sentence could not
    // break. Inline code must wrap.
    const inlineCodeRule = css.match(
      /\.prose-measure :where\([^)]*\) code\s*\{([^}]*)\}/
    )
    expect(inlineCodeRule, 'no rule targets inline code').not.toBeNull()
    expect(inlineCodeRule![1]).toMatch(/overflow-wrap:\s*anywhere/)
  })

  it('lets code blocks scroll rather than wrap', () => {
    const pre = css.match(/\.prose-measure pre\s*\{([^}]*)\}/)
    expect(pre, 'no rule targets `pre`').not.toBeNull()
    expect(pre![1]).toMatch(/overflow-x:\s*auto/)
    expect(pre![1]).toMatch(/white-space:\s*pre/)
  })

  it('caps media and tables to the column', () => {
    expect(css).toMatch(/\.prose-measure :where\(img, svg, video, iframe, canvas, table\)/)
  })

  it('gives the reading column its own containing block', () => {
    const measure = css.match(/\.prose-measure\s*\{([^}]*)\}/)
    expect(measure, 'no `.prose-measure` rule').not.toBeNull()
    expect(measure![1]).toMatch(/min-width:\s*0/)
    expect(measure![1]).toMatch(/overflow-x:\s*clip/)
  })
})

describe('layout safety net', () => {
  it('clips the main landmark', () => {
    const layout = fs.readFileSync(
      path.resolve(process.cwd(), 'app/[lang]/layout.tsx'),
      'utf-8'
    )
    expect(layout).toMatch(/overflow-x-clip/)
  })
})
