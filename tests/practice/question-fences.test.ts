import { describe, expect, it } from 'vitest'
import { extractQuestionFences } from '../../scripts/lib/question-fences.mjs'

const fence = (json: string) => '```question\n' + json + '\n```'

describe('extractQuestionFences', () => {
  it('extracts valid question fences and skips invalid ones', () => {
    const md = [
      'intro',
      fence(JSON.stringify({ id: 'a-01-q1', type: 'multiple-choice', question: 'Q1?', options: ['x', 'y'], correct: 1 })),
      '```question\n{not json',
      '```',
      fence(JSON.stringify({ question: 'Q2?', options: ['a'], correct: 0 })),
    ].join('\n')
    const found = extractQuestionFences(md)
    expect(found).toHaveLength(2)
    expect(found[0].data.id).toBe('a-01-q1')
    // The invalid fence still consumes an ordinal, so ids do not shift.
    expect(found[1].index).toBe(3)
  })

  it('handles Windows line endings and template literals inside code', () => {
    const md =
      '```question\r\n' +
      JSON.stringify({ question: 'Q?', options: ['a'], correct: 0, explanation: 'uses `backticks`' }) +
      '\r\n```\r\n'
    const found = extractQuestionFences(md)
    expect(found).toHaveLength(1)
    expect(found[0].data.correct).toBe(0)
  })
})
