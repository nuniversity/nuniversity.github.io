import { describe, expect, it } from 'vitest'
import { emptyResponse, gradeAnswer, isAnswered, responseFor } from '@/lib/quizzes/grade'
import type { QuizQuestion, QuizResponse } from '@/lib/quizzes/types'

const mcq: QuizQuestion = {
  id: 'q001',
  subdomain: '1.1 - Test',
  type: 'mcq',
  question: 'Pick one',
  options: ['a', 'b', 'c', 'd'],
  correct: 2,
  explanation: 'because c',
}

const tf: QuizQuestion = {
  id: 'q002',
  subdomain: '1.1 - Test',
  type: 'tf',
  question: 'True or false?',
  options: ['True', 'False'],
  correct: 0,
  explanation: 'because true',
}

const multi: QuizQuestion = {
  id: 'q003',
  subdomain: '2.1 - Test',
  type: 'multi',
  question: 'Pick many',
  options: ['a', 'b', 'c', 'd', 'e'],
  correct: [0, 3, 4],
  explanation: 'a, d, e',
}

const ordering: QuizQuestion = {
  id: 'q004',
  subdomain: '3.2 - Test',
  type: 'ordering',
  question: 'Order these',
  options: ['step one', 'step two', 'step three', 'distractor'],
  correct: [0, 1, 2],
  explanation: 'first, second, third',
}

const matching: QuizQuestion = {
  id: 'q005',
  subdomain: '4.1 - Test',
  type: 'matching',
  question: 'Match these',
  options: ['left one', 'left two', 'left three'],
  prompts: ['prompt a', 'prompt b', 'prompt c'],
  correct: [2, 0, 1],
  explanation: 'a->left three',
}

describe('emptyResponse', () => {
  it('returns a type-matched empty response for every question type', () => {
    expect(emptyResponse(mcq)).toEqual({ type: 'mcq', selected: null })
    expect(emptyResponse(tf)).toEqual({ type: 'tf', selected: null })
    expect(emptyResponse(multi)).toEqual({ type: 'multi', selected: [] })
    expect(emptyResponse(ordering)).toEqual({ type: 'ordering', sequence: [] })
    expect(emptyResponse(matching)).toEqual({ type: 'matching', pairs: [null, null, null] })
  })
})

describe('isAnswered', () => {
  it('treats single-answer questions as answered only when an option is selected', () => {
    expect(isAnswered(mcq, { type: 'mcq', selected: null })).toBe(false)
    expect(isAnswered(mcq, { type: 'mcq', selected: 3 })).toBe(true)
    expect(isAnswered(mcq, null)).toBe(false)
    expect(isAnswered(mcq, undefined)).toBe(false)
  })

  it('treats multi questions as answered with at least one pick', () => {
    expect(isAnswered(multi, { type: 'multi', selected: [] })).toBe(false)
    expect(isAnswered(multi, { type: 'multi', selected: [1] })).toBe(true)
  })

  it('treats ordering questions as answered once an item is placed', () => {
    expect(isAnswered(ordering, { type: 'ordering', sequence: [] })).toBe(false)
    expect(isAnswered(ordering, { type: 'ordering', sequence: [1] })).toBe(true)
  })

  it('treats matching questions as answered once one pair is set', () => {
    expect(isAnswered(matching, { type: 'matching', pairs: [null, null, null] })).toBe(false)
    expect(isAnswered(matching, { type: 'matching', pairs: [null, 2, null] })).toBe(true)
  })
})

describe('gradeAnswer: single answer', () => {
  it('grades mcq and tf by exact option match', () => {
    expect(gradeAnswer(mcq, { type: 'mcq', selected: 2 })).toBe(true)
    expect(gradeAnswer(mcq, { type: 'mcq', selected: 0 })).toBe(false)
    expect(gradeAnswer(mcq, { type: 'mcq', selected: null })).toBe(false)
    expect(gradeAnswer(tf, { type: 'tf', selected: 0 })).toBe(true)
    expect(gradeAnswer(tf, { type: 'tf', selected: 1 })).toBe(false)
    expect(gradeAnswer(mcq, null)).toBe(false)
  })
})

describe('gradeAnswer: multiple response', () => {
  it('requires exactly the correct set, all-or-nothing', () => {
    expect(gradeAnswer(multi, { type: 'multi', selected: [0, 3, 4] })).toBe(true)
    expect(gradeAnswer(multi, { type: 'multi', selected: [4, 0, 3] })).toBe(true)
    expect(gradeAnswer(multi, { type: 'multi', selected: [0, 3] })).toBe(false)
    expect(gradeAnswer(multi, { type: 'multi', selected: [0, 3, 4, 1] })).toBe(false)
    expect(gradeAnswer(multi, { type: 'multi', selected: [] })).toBe(false)
  })

  it('tolerates duplicate picks without double counting', () => {
    expect(gradeAnswer(multi, { type: 'multi', selected: [0, 3, 4, 4] })).toBe(true)
    expect(gradeAnswer(multi, { type: 'multi', selected: [0, 0] })).toBe(false)
  })
})

describe('gradeAnswer: ordering', () => {
  it('requires the full sequence in the exact order', () => {
    expect(gradeAnswer(ordering, { type: 'ordering', sequence: [0, 1, 2] })).toBe(true)
    expect(gradeAnswer(ordering, { type: 'ordering', sequence: [0, 2, 1] })).toBe(false)
    expect(gradeAnswer(ordering, { type: 'ordering', sequence: [0, 1] })).toBe(false)
    expect(gradeAnswer(ordering, { type: 'ordering', sequence: [] })).toBe(false)
  })

  it('rejects sequences containing the distractor or duplicates', () => {
    expect(gradeAnswer(ordering, { type: 'ordering', sequence: [0, 1, 3] })).toBe(false)
    expect(gradeAnswer(ordering, { type: 'ordering', sequence: [0, 1, 1] })).toBe(false)
  })
})

describe('gradeAnswer: matching', () => {
  it('requires every pair correct, all-or-nothing', () => {
    expect(gradeAnswer(matching, { type: 'matching', pairs: [2, 0, 1] })).toBe(true)
    expect(gradeAnswer(matching, { type: 'matching', pairs: [2, 0, null] })).toBe(false)
    expect(gradeAnswer(matching, { type: 'matching', pairs: [0, 1, 2] })).toBe(false)
    expect(gradeAnswer(matching, { type: 'matching', pairs: [2, 0] })).toBe(false)
    expect(gradeAnswer(matching, null)).toBe(false)
  })
})

describe('responseFor', () => {
  it('returns the response when types match', () => {
    const response: QuizResponse = { type: 'mcq', selected: 1 }
    expect(responseFor(mcq, response)).toBe(response)
  })

  it('falls back to an empty response on missing or mismatched types', () => {
    expect(responseFor(mcq, null)).toEqual({ type: 'mcq', selected: null })
    expect(responseFor(mcq, { type: 'multi', selected: [1] })).toEqual({ type: 'mcq', selected: null })
    expect(responseFor(multi, undefined)).toEqual({ type: 'multi', selected: [] })
  })
})
