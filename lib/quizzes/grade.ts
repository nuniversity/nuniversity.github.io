import type { QuizQuestion, QuizResponse } from './types'

export function emptyResponse(question: QuizQuestion): QuizResponse {
  switch (question.type) {
    case 'mcq':
    case 'tf':
      return { type: question.type, selected: null }
    case 'multi':
      return { type: 'multi', selected: [] }
    case 'ordering':
      return { type: 'ordering', sequence: [] }
    case 'matching':
      return { type: 'matching', pairs: question.prompts.map(() => null) }
  }
}

function normalizeIndices(values: number[]): number[] {
  return Array.from(new Set(values.filter(v => Number.isInteger(v)))).sort((a, b) => a - b)
}

function isSingleAnswer(question: QuizQuestion): question is Extract<QuizQuestion, { type: 'mcq' | 'tf' }> {
  return question.type === 'mcq' || question.type === 'tf'
}

export function isAnswered(question: QuizQuestion, response: QuizResponse | null | undefined): boolean {
  if (!response) return false
  if (isSingleAnswer(question)) {
    return response.type === 'mcq' || response.type === 'tf' ? response.selected !== null : false
  }
  if (question.type === 'multi') {
    return response.type === 'multi' && response.selected.length > 0
  }
  if (question.type === 'ordering') {
    return response.type === 'ordering' && response.sequence.length > 0
  }
  return response.type === 'matching' && response.pairs.some(pair => pair !== null)
}

export function gradeAnswer(question: QuizQuestion, response: QuizResponse | null | undefined): boolean {
  if (!response) return false

  if (isSingleAnswer(question)) {
    if (response.type !== 'mcq' && response.type !== 'tf') return false
    return response.selected !== null && response.selected === question.correct
  }

  if (question.type === 'multi') {
    if (response.type !== 'multi') return false
    const selected = normalizeIndices(response.selected)
    const correct = normalizeIndices(question.correct)
    return (
      selected.length === correct.length &&
      selected.every((value, i) => value === correct[i])
    )
  }

  if (question.type === 'ordering') {
    if (response.type !== 'ordering') return false
    const sequence = response.sequence
    if (sequence.length !== question.correct.length) return false
    if (normalizeIndices(sequence).length !== sequence.length) return false
    return sequence.every((value, i) => value === question.correct[i])
  }

  if (response.type !== 'matching') return false
  if (response.pairs.length !== question.prompts.length) return false
  return question.correct.every((value, i) => response.type === 'matching' && response.pairs[i] === value)
}

export function responseFor(question: QuizQuestion, response: QuizResponse | null | undefined): QuizResponse {
  if (!response || response.type !== question.type) return emptyResponse(question)
  return response
}
