import type { QuizData, QuizQuestion } from './types'

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}

export function largestRemainder(values: Record<string, number>, total: number): Record<string, number> {
  const keys = Object.keys(values)
  const weightSum = keys.reduce((sum, key) => sum + values[key], 0)
  const result: Record<string, number> = {}
  if (keys.length === 0 || weightSum <= 0 || total <= 0) {
    for (const key of keys) result[key] = 0
    return result
  }

  const exact: { key: string; floor: number; fraction: number }[] = keys.map(key => {
    const exactValue = (values[key] / weightSum) * total
    const floor = Math.floor(exactValue)
    return { key, floor, fraction: exactValue - floor }
  })

  let assigned = 0
  for (const entry of exact) {
    result[entry.key] = entry.floor
    assigned += entry.floor
  }

  const leftovers = total - assigned
  const byRemainder = [...exact].sort((a, b) => {
    if (b.fraction !== a.fraction) return b.fraction - a.fraction
    return a.key.localeCompare(b.key)
  })
  for (let i = 0; i < leftovers; i++) {
    const key = byRemainder[i % byRemainder.length].key
    result[key] += 1
  }
  return result
}

export function mockExamSize(quiz: Pick<QuizData, 'allocations' | 'mockQuestionCount'>): number {
  if (quiz.mockQuestionCount && quiz.mockQuestionCount > 0) return quiz.mockQuestionCount
  return Object.values(quiz.allocations).reduce((sum, value) => sum + value, 0)
}

export function scaledTargets(quiz: QuizData): Record<string, number> {
  const size = mockExamSize(quiz)
  const allocations = quiz.allocations
  const allocationSum = Object.values(allocations).reduce((sum, value) => sum + value, 0)
  if (allocationSum === size) return { ...allocations }
  if (allocationSum <= 0) return {}

  const domainWeights: Record<string, number> = {}
  const subToDomain: Record<string, string> = {}
  for (const domain of quiz.domains) {
    let total = 0
    for (const sub of domain.subdomains) {
      const weight = allocations[sub]
      if (typeof weight === 'number') {
        total += weight
        subToDomain[sub] = domain.id
      }
    }
    domainWeights[domain.id] = total
  }
  for (const sub of Object.keys(allocations)) {
    if (!(sub in subToDomain)) {
      domainWeights.__other = (domainWeights.__other ?? 0) + allocations[sub]
      subToDomain[sub] = '__other'
    }
  }

  const domainTargets = largestRemainder(domainWeights, size)
  const targets: Record<string, number> = {}
  const grouped: Record<string, string[]> = {}
  for (const sub of Object.keys(allocations)) {
    const domainId = subToDomain[sub]
    if (!grouped[domainId]) grouped[domainId] = []
    grouped[domainId].push(sub)
  }
  for (const [domainId, subs] of Object.entries(grouped)) {
    const weights: Record<string, number> = {}
    for (const sub of subs) weights[sub] = allocations[sub]
    const domainTarget = domainTargets[domainId] ?? 0
    const scaled = largestRemainder(weights, domainTarget)
    for (const sub of subs) targets[sub] = scaled[sub] ?? 0
  }
  return targets
}

export function questionPools(quiz: QuizData): Record<string, QuizQuestion[]> {
  const pools: Record<string, QuizQuestion[]> = {}
  for (const question of quiz.questions) {
    if (!pools[question.subdomain]) pools[question.subdomain] = []
    pools[question.subdomain].push(question)
  }
  return pools
}

export function drawMockQuestions(quiz: QuizData, rng: () => number = Math.random): QuizQuestion[] {
  const targets = scaledTargets(quiz)
  const pools = questionPools(quiz)
  const drawn: QuizQuestion[] = []
  for (const [subdomain, target] of Object.entries(targets)) {
    const pool = pools[subdomain] ?? []
    drawn.push(...shuffle(pool, rng).slice(0, target))
  }
  return shuffle(drawn, rng)
}
