import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const globalsPath = path.resolve(process.cwd(), 'app/globals.css')
const css = fs.readFileSync(globalsPath, 'utf-8')

/**
 * Entrance animations run with `animation-fill-mode: both`, so the value in
 * the `to` frame persists after the animation ends.
 *
 * If that final value is an identity transform (`translateY(0)`, `scale(1)`)
 * rather than `none`, the element keeps a transform and therefore keeps a
 * **stacking context** for the rest of the page's life. Any dropdown or
 * popover inside it is then painted behind later content instead of above it
 * — the bug where the hero search results rendered behind the CTAs.
 */
const ENTRANCE_KEYFRAMES = ['nu-fade-in-up', 'nu-scale-in', 'nu-slide-down']

describe('globals.css motion', () => {
  it.each(ENTRANCE_KEYFRAMES)('%s ends on `transform: none`', (name) => {
    const block = css.match(new RegExp(`@keyframes\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`))
    expect(block, `keyframe ${name} not found`).not.toBeNull()

    const body = block![1]
    const toFrame = body.split(/\n\s*to\s*\{/)[1]
    expect(toFrame, `keyframe ${name} has no "to" frame`).toBeDefined()

    const transform = toFrame.match(/transform:\s*([^;]+);/)
    expect(transform, `keyframe ${name} does not animate transform`).toBeTruthy()
    expect(
      transform![1].trim(),
      `keyframe ${name} must end on "transform: none" so it leaves no stacking context behind`
    ).toBe('none')
  })

  it('does not leave an identity transform in any entrance animation', () => {
    const offenders = css.match(/to\s*\{[^}]*transform:\s*(translateY\(0\)|scale\(1\)|translate\(-?[0-9.]+px\))\s*;/g)
    expect(offenders, `identity transforms found: ${offenders?.join(', ')}`).toBeNull()
  })

  it('honours prefers-reduced-motion', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })
})
