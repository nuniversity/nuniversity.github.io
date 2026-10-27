import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = fs.readFileSync(path.resolve(process.cwd(), 'app/globals.css'), 'utf-8')
// Comments mention the properties being banned, so they are stripped before
// the negative assertions look for them.
const css = source.replace(/\/\*[\s\S]*?\*\//g, ' ')

/**
 * Course content is read on phones. A single long unbroken token in prose —
 * an ARN, a bucket path, a URL — used to push the whole page sideways.
 *
 * The guard must break *tokens*, not words:
 *  - `overflow-wrap: break-word` wraps a token that cannot fit;
 *  - automatic hyphenation is off, so nothing is split with a visible "-";
 *  - `anywhere` is not used, because it offers a break between every pair of
 *    characters and splits things like `4.1` across lines.
 */
describe('prose horizontal-overflow guard', () => {
  it('wraps long tokens without hyphenating', () => {
    const guard = css.match(/\.prose-measure :where\([\s\S]*?\)\s*\{([^}]*)\}/)
    expect(guard, 'no rule guards prose text').not.toBeNull()
    expect(guard![1]).toMatch(/overflow-wrap:\s*break-word/)
    expect(guard![1]).toMatch(/hyphens:\s*manual/)
    expect(guard![1]).not.toMatch(/overflow-wrap:\s*anywhere/)
    expect(guard![1]).not.toMatch(/hyphens:\s*auto/)
  })

  it('never hyphenates prose automatically', () => {
    // `hyphens: auto` is what produced "infor-mação" style breaks mid-word.
    expect(css).not.toMatch(/hyphens:\s*auto/)
  })

  it('does not offer a break between every character', () => {
    // `anywhere` is what split "4.1" over two lines.
    expect(css).not.toMatch(/overflow-wrap:\s*anywhere/)
  })

  it('does not exempt inline code from wrapping', () => {
    // The earlier bug: `code` shared a rule with `pre` and was set to
    // `overflow-wrap: normal`, so a long identifier in a sentence could not
    // break. Inline code must wrap.
    const inlineCodeRule = css.match(
      /\.prose-measure :where\([^)]*\) code\s*\{([^}]*)\}/
    )
    expect(inlineCodeRule, 'no rule targets inline code').not.toBeNull()
    expect(inlineCodeRule![1]).toMatch(/overflow-wrap:\s*break-word/)
  })

  it('lets code blocks scroll rather than wrap', () => {
    const pre = css.match(/\.prose-measure pre\s*\{([^}]*)\}/)
    expect(pre, 'no rule targets `pre`').not.toBeNull()
    expect(pre![1]).toMatch(/overflow-x:\s*auto/)
    expect(pre![1]).toMatch(/white-space:\s*pre/)
  })

  it('caps media to the column', () => {
    expect(css).toMatch(/\.prose-measure :where\(img, svg, video, iframe, canvas\)/)
  })

  it('sizes tables to their content instead of squeezing the columns', () => {
    // Tables used to be `width: 100%` and capped, which flattened wide tables
    // into ribbons of wrapped text. They now take their natural width and the
    // wrapper scrolls; `min-width: 100%` keeps narrow tables filling the
    // column.
    const table = css.match(/\.prose-measure table\s*\{([^}]*)\}/)
    expect(table, 'no rule targets `.prose-measure table`').not.toBeNull()
    expect(table![1]).toMatch(/width:\s*max-content/)
    expect(table![1]).toMatch(/min-width:\s*100%/)
    // `max-width: 100%` here would defeat `max-content` and bring the
    // squeezing back.
    expect(css).not.toMatch(/\.prose-measure :where\([^)]*\btable\b[^)]*\)\s*\{[^}]*max-width/)
  })

  it('caps a table cell at a readable measure', () => {
    const cell = css.match(/\.prose-measure \.prose-cell\s*\{([^}]*)\}/)
    expect(cell, 'no rule targets `.prose-cell`').not.toBeNull()
    expect(cell![1]).toMatch(/max-width:/)
  })

  it('scrolls a table that is taller than the screen, keeping its header', () => {
    const box = css.match(/\.prose-measure \.table-scroll\s*\{([^}]*)\}/)
    expect(box, 'no rule targets `.table-scroll`').not.toBeNull()
    expect(box![1]).toMatch(/max-height:/)
    expect(box![1]).toMatch(/overflow-y:\s*auto/)

    const head = css.match(/\.prose-measure \.table-scroll thead th\s*\{([^}]*)\}/)
    expect(head, 'the table header is not pinned').not.toBeNull()
    expect(head![1]).toMatch(/position:\s*sticky/)
  })

  it('keeps the lesson in one aligned column', () => {
    const measure = css.match(/\.prose-measure\s*\{([^}]*)\}/)
    expect(measure, 'no `.prose-measure` rule').not.toBeNull()
    expect(measure![1]).toMatch(/width:\s*100%/)
    expect(measure![1]).toMatch(/min-width:\s*0/)
    expect(measure![1]).toMatch(/overflow-x:\s*clip/)
    // Capping the column (or capping individual prose elements) put the prose
    // to the right of the title and the footer navigation — the staggered look
    // this rule exists to prevent.
    expect(measure![1]).not.toMatch(/max-width:\s*var\(--(lesson-)?measure/)
    expect(css).not.toMatch(/\.prose-measure > :where\(/)
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
