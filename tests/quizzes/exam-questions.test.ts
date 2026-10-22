import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { extractExamQuestions } from '@/lib/markdown/exam-questions'

const fixture = [
  'Intro prose before any fence.',
  '',
  '```question',
  '{ "id": "q-one", "type": "multiple-choice", "question": "First?", "options": ["Alpha", "Beta"], "correct": 0, "explanation": "Because alpha." }',
  '```',
  '',
  'Teardown prose between blocks.',
  '',
  '```question',
  '{ this is not valid json',
  '```',
  '',
  '```interactive',
  '{ "type": "matching", "title": "Not a question fence", "pairs": [["a", "b"]] }',
  '```',
  '',
  '```question',
  'plain text body with no json',
  '```',
  '',
  '```question',
  '{ "id": "q-two", "type": "true-false", "question": "Second?", "options": ["True", "False"], "correct": 1 }',
  '```',
  '',
  '```question',
  '[1, 2, 3]',
  '```',
  '',
  '```question',
  '{ "id": "q-three", "type": "multiple-choice", "question": "Third?", "options": ["One", "Two", "Three"], "correct": 2 }',
  '```',
  '',
].join('\n')

describe('extractExamQuestions', () => {
  it('preserves document order and returns only valid question blocks', () => {
    const questions = extractExamQuestions(fixture)

    expect(questions.map((q) => q.id)).toEqual(['q-one', 'q-two', 'q-three'])
    expect(questions[0]).toMatchObject({
      id: 'q-one',
      type: 'multiple-choice',
      question: 'First?',
      options: ['Alpha', 'Beta'],
      correct: 0,
      explanation: 'Because alpha.',
    })
    expect(questions[1]).toMatchObject({
      id: 'q-two',
      type: 'true-false',
      question: 'Second?',
      options: ['True', 'False'],
      correct: 1,
    })
    expect(questions[2].correct).toBe(2)
  })

  it('skips malformed json, non-object json and interactive fences silently', () => {
    const questions = extractExamQuestions(fixture)

    expect(questions).toHaveLength(3)
    expect(questions.every((q) => typeof q.id === 'string')).toBe(true)
    expect(questions.some((q) => q.id === 'Not a question fence')).toBe(false)
  })

  it('returns an empty array for empty input', () => {
    expect(extractExamQuestions('')).toEqual([])
    expect(extractExamQuestions('\n\n')).toEqual([])
  })

  it('extracts all question fences from the real EN CLF-C02 lesson 15 file', () => {
    const filePath = path.join(
      process.cwd(),
      'content',
      'courses',
      'aws-clf-c02',
      'en',
      '15-exam-simulation-a.md'
    )
    const content = fs.readFileSync(filePath, 'utf8')
    const questions = extractExamQuestions(content)

    expect(questions).toHaveLength(22)
    expect(questions[0].id).toBe('clf-15-q1')
    expect(questions.every((q) => typeof q.correct === 'number')).toBe(true)
  })
})
