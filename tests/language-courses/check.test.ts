import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  checkDictation,
  levenshtein,
  normalizeAnswer,
  sameTokenSequence,
  shuffle,
} from '@/lib/language-courses/check'

describe('normalizeAnswer', () => {
  it('lowercases, strips punctuation and collapses spaces', () => {
    expect(normalizeAnswer('  Hello, World! ')).toBe('hello world')
    expect(normalizeAnswer('Eu... não sei')).toBe('eu não sei')
  })

  it('keeps accented letters distinct (PT/ES matter)', () => {
    expect(normalizeAnswer('avó')).not.toBe(normalizeAnswer('avô'))
  })
})

describe('levenshtein', () => {
  it('computes classic edit distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('abc', 'abc')).toBe(0)
    expect(levenshtein('', 'abc')).toBe(3)
  })
})

describe('checkDictation', () => {
  it('accepts exact answers regardless of case or punctuation', () => {
    expect(checkDictation('She works at a bank.', 'she works at a bank')).toBe('correct')
  })

  it('tolerates one typo per ~12 characters as "almost"', () => {
    // 22 chars → tolerance 2
    expect(checkDictation('She works at a bank', 'She workx at a bank')).toBe('almost')
    expect(checkDictation('I am twenty years old', 'I am tweny years old')).toBe('almost')
  })

  it('rejects wrong words', () => {
    expect(checkDictation('She works at a bank', 'He plays in the park')).toBe('wrong')
    // think → sink is 2 edits (t→s, h deleted): minimal pairs must fail.
    expect(checkDictation('think', 'sink')).toBe('wrong')
    expect(checkDictation('thinks', 'sinks')).toBe('wrong')
  })

  it('marks single slips as almost', () => {
    expect(checkDictation('think', 'tink')).toBe('almost')
  })

  it('never allows distance above tolerance to pass', () => {
    expect(checkDictation('I would like a coffee please', 'I wood like a coffe please')).toBe('almost')
    expect(checkDictation('The weather is very nice today', 'The wether is nice today')).toBe('wrong')
  })
})

describe('sameTokenSequence', () => {
  it('ignores case and punctuation when comparing sequences', () => {
    expect(sameTokenSequence(['I', 'am', 'fine'], ['i', 'AM', 'fine.'])).toBe(true)
    expect(sameTokenSequence(['I', 'am', 'fine'], ['I', 'fine', 'am'])).toBe(false)
  })
})

describe('shuffle', () => {
  it('keeps every element (permutation) and does not mutate input', () => {
    const input = [1, 2, 3, 4, 5]
    const output = shuffle(input)
    expect([...output].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})
