import { describe, expect, it } from 'vitest'
import { drawMockQuestions, largestRemainder, mockExamSize, scaledTargets } from '@/lib/quizzes/draw'
import type { QuizData, QuizQuestion } from '@/lib/quizzes/types'

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ALLOCATIONS: Record<string, number> = {
  '1.1 - Alpha': 7,
  '1.2 - Beta': 6,
  '1.3 - Gamma': 7,
  '2.1 - Delta': 8,
  '2.2 - Epsilon': 8,
  '2.3 - Zeta': 8,
  '3.1 - Eta': 7,
  '3.2 - Theta': 8,
  '3.3 - Iota': 6,
  '3.4 - Kappa': 7,
  '4.1 - Lambda': 8,
  '4.2 - Mu': 6,
  '5.1 - Nu': 7,
  '5.2 - Xi': 7,
}

function makeQuestions(): QuizQuestion[] {
  const questions: QuizQuestion[] = []
  let counter = 1
  for (const [subdomain, weight] of Object.entries(ALLOCATIONS)) {
    for (let i = 0; i < weight * 2 + 4; i++) {
      questions.push({
        id: `q${String(counter).padStart(3, '0')}`,
        subdomain,
        type: 'mcq',
        question: `Question ${counter} for ${subdomain}`,
        options: ['a', 'b', 'c', 'd'],
        correct: i % 4,
        explanation: 'explanation',
      })
      counter++
    }
  }
  return questions
}

function makeQuiz(overrides: Partial<QuizData> = {}): QuizData {
  return {
    id: 'aif-c01-test',
    slug: 'aif-c01-test',
    kind: 'certification',
    category: 'Cloud & AI',
    title: 'Test Quiz',
    description: 'Test quiz for draw logic',
    difficulty: 'intermediate',
    topic: 'AWS',
    certification: 'AWS Certified AI Practitioner (AIF-C01)',
    durationSeconds: 5400,
    passingScore: 70,
    domains: [
      { id: 'D1', name: 'Domain 1', color: 'blue', subdomains: ['1.1 - Alpha', '1.2 - Beta', '1.3 - Gamma'] },
      { id: 'D2', name: 'Domain 2', color: 'purple', subdomains: ['2.1 - Delta', '2.2 - Epsilon', '2.3 - Zeta'] },
      { id: 'D3', name: 'Domain 3', color: 'teal', subdomains: ['3.1 - Eta', '3.2 - Theta', '3.3 - Iota', '3.4 - Kappa'] },
      { id: 'D4', name: 'Domain 4', color: 'orange', subdomains: ['4.1 - Lambda', '4.2 - Mu'] },
      { id: 'D5', name: 'Domain 5', color: 'green', subdomains: ['5.1 - Nu', '5.2 - Xi'] },
    ],
    allocations: { ...ALLOCATIONS },
    questions: makeQuestions(),
    ...overrides,
  }
}

describe('largestRemainder', () => {
  it('keeps exact integer shares unchanged', () => {
    expect(largestRemainder({ a: 1, b: 1, c: 2 }, 8)).toEqual({ a: 2, b: 2, c: 4 })
  })

  it('distributes leftovers to the largest fractional parts', () => {
    const result = largestRemainder({ a: 20, b: 24, c: 28, d: 14, e: 14 }, 65)
    expect(Object.values(result).reduce((sum, v) => sum + v, 0)).toBe(65)
    expect(result).toEqual({ a: 13, b: 16, c: 18, d: 9, e: 9 })
  })

  it('breaks ties deterministically by key order', () => {
    expect(largestRemainder({ b: 1, a: 1 }, 1)).toEqual({ a: 1, b: 0 })
    expect(largestRemainder({ b: 1, a: 1 }, 1)).toEqual(largestRemainder({ a: 1, b: 1 }, 1))
  })

  it('returns zeros for empty or non-positive input', () => {
    expect(largestRemainder({}, 10)).toEqual({})
    expect(largestRemainder({ a: 0, b: 0 }, 10)).toEqual({ a: 0, b: 0 })
    expect(largestRemainder({ a: 1 }, 0)).toEqual({ a: 0 })
  })
})

describe('mockExamSize', () => {
  it('defaults to the allocation sum when mockQuestionCount is absent (legacy quizzes)', () => {
    expect(mockExamSize({ allocations: ALLOCATIONS })).toBe(100)
  })

  it('prefers mockQuestionCount when present', () => {
    expect(mockExamSize({ allocations: ALLOCATIONS, mockQuestionCount: 65 })).toBe(65)
  })
})

describe('scaledTargets', () => {
  it('returns allocations unchanged for legacy quizzes whose allocations sum to the mock size', () => {
    const quiz = makeQuiz()
    expect(scaledTargets(quiz)).toEqual(ALLOCATIONS)
  })

  it('scales hierarchically to mockQuestionCount with exact domain weights', () => {
    const quiz = makeQuiz({ mockQuestionCount: 65 })
    const targets = scaledTargets(quiz)
    const total = Object.values(targets).reduce((sum, v) => sum + v, 0)
    expect(total).toBe(65)

    const domainOf: Record<string, string> = {}
    for (const domain of quiz.domains) {
      for (const sub of domain.subdomains) domainOf[sub] = domain.id
    }
    const byDomain: Record<string, number> = {}
    for (const [sub, target] of Object.entries(targets)) {
      byDomain[domainOf[sub]] = (byDomain[domainOf[sub]] ?? 0) + target
    }
    expect(byDomain).toEqual({ D1: 13, D2: 16, D3: 18, D4: 9, D5: 9 })
  })

  it('caps nothing when the requested size exceeds the allocation sum', () => {
    const quiz = makeQuiz({ mockQuestionCount: 200 })
    const targets = scaledTargets(quiz)
    expect(Object.values(targets).reduce((sum, v) => sum + v, 0)).toBe(200)
  })
})

describe('drawMockQuestions', () => {
  it('draws exactly the scaled target per subdomain without duplicates', () => {
    const quiz = makeQuiz({ mockQuestionCount: 65 })
    const drawn = drawMockQuestions(quiz, mulberry32(42))
    const targets = scaledTargets(quiz)

    expect(drawn.length).toBe(65)
    const ids = drawn.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)

    const counts: Record<string, number> = {}
    for (const question of drawn) counts[question.subdomain] = (counts[question.subdomain] ?? 0) + 1
    for (const [subdomain, target] of Object.entries(targets)) {
      expect(counts[subdomain] ?? 0).toBe(target)
    }
  })

  it('is deterministic for a given rng seed', () => {
    const quiz = makeQuiz({ mockQuestionCount: 65 })
    const first = drawMockQuestions(quiz, mulberry32(7)).map(q => q.id)
    const second = drawMockQuestions(quiz, mulberry32(7)).map(q => q.id)
    expect(first).toEqual(second)
  })

  it('draws every question when the pool is short of the target', () => {
    const quiz = makeQuiz({ mockQuestionCount: 65 })
    quiz.questions = quiz.questions.filter(q => q.subdomain !== '1.1 - Alpha')
    const drawn = drawMockQuestions(quiz, mulberry32(1))
    expect(drawn.some(q => q.subdomain === '1.1 - Alpha')).toBe(false)
    expect(drawn.length).toBe(65 - 5)
  })

  it('keeps legacy 100-item quizzes at their allocation counts', () => {
    const quiz = makeQuiz()
    const drawn = drawMockQuestions(quiz, mulberry32(3))
    expect(drawn.length).toBe(100)
    const counts: Record<string, number> = {}
    for (const question of drawn) counts[question.subdomain] = (counts[question.subdomain] ?? 0) + 1
    expect(counts).toEqual(ALLOCATIONS)
  })
})
