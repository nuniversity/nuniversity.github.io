import { describe, expect, it } from 'vitest'
import { tpl } from '@/lib/games/tpl'

describe('tpl', () => {
  it('returns the template untouched without vars', () => {
    expect(tpl('Score: {score}')).toBe('Score: {score}')
  })

  it('replaces all occurrences of each variable', () => {
    expect(tpl('{n} of {n}', { n: 3 })).toBe('3 of 3')
  })

  it('replaces multiple different variables', () => {
    expect(tpl('{current} of {total}', { current: 2, total: 15 })).toBe('2 of 15')
  })

  it('leaves placeholders without a matching variable', () => {
    expect(tpl('{a} and {b}', { a: 1 })).toBe('1 and {b}')
  })

  it('handles numeric zero correctly', () => {
    expect(tpl('level {n}', { n: 0 })).toBe('level 0')
  })
})
