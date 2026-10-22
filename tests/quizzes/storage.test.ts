import { beforeEach, describe, expect, it } from 'vitest'
import {
  QUIZ_CERT_NAME_KEY,
  addAttempt,
  attemptPercent,
  clearHistory,
  getBest,
  getCertName,
  getHistory,
  quizBestKey,
  quizHistoryKey,
  setCertName,
  type QuizAttempt,
} from '@/lib/quizzes/storage'

const slug = 'snowpro-core-cof-c03'

function attempt(overrides: Partial<QuizAttempt> = {}): QuizAttempt {
  return {
    date: '2026-10-22T10:00:00.000Z',
    mode: 'practice',
    score: 8,
    total: 10,
    passed: true,
    ...overrides,
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('quiz storage keys', () => {
  it('uses versioned key names', () => {
    expect(quizHistoryKey(slug)).toBe(`v1:quizzes-history-${slug}`)
    expect(quizBestKey(slug)).toBe(`v1:quizzes-best-${slug}`)
    expect(QUIZ_CERT_NAME_KEY).toBe('v1:quizzes-cert-name')
  })
})

describe('attempt percent', () => {
  it('rounds to a whole percent', () => {
    expect(attemptPercent({ score: 8, total: 10 })).toBe(80)
    expect(attemptPercent({ score: 2, total: 3 })).toBe(67)
  })

  it('returns 0 for an empty attempt', () => {
    expect(attemptPercent({ score: 0, total: 0 })).toBe(0)
  })
})

describe('history', () => {
  it('round-trips attempts newest first', () => {
    addAttempt(slug, attempt({ date: '2026-10-01T00:00:00.000Z' }))
    addAttempt(slug, attempt({ date: '2026-10-02T00:00:00.000Z', mode: 'exam' }))

    const history = getHistory(slug)
    expect(history).toHaveLength(2)
    expect(history[0].date).toBe('2026-10-02T00:00:00.000Z')
    expect(history[0].mode).toBe('exam')
    expect(history[1].date).toBe('2026-10-01T00:00:00.000Z')
  })

  it('caps stored history at 50 attempts', () => {
    for (let i = 0; i < 60; i++) {
      addAttempt(slug, attempt({ date: `2026-10-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z` }))
    }
    expect(getHistory(slug)).toHaveLength(50)
  })

  it('drops malformed entries and survives corrupt JSON', () => {
    window.localStorage.setItem(quizHistoryKey(slug), '{not json')
    expect(getHistory(slug)).toEqual([])

    window.localStorage.setItem(
      quizHistoryKey(slug),
      JSON.stringify([attempt(), { score: 'bad' }, null, 42])
    )
    expect(getHistory(slug)).toHaveLength(1)
  })

  it('keeps history separate per quiz slug', () => {
    addAttempt(slug, attempt())
    expect(getHistory('another-quiz')).toEqual([])
  })
})

describe('best score', () => {
  it('stores the first attempt as best', () => {
    addAttempt(slug, attempt({ score: 7, total: 10, passed: false }))
    const best = getBest(slug)
    expect(best).not.toBeNull()
    expect(best?.percent).toBe(70)
    expect(best?.passed).toBe(false)
  })

  it('is only replaced by a strictly better percent', () => {
    addAttempt(slug, attempt({ score: 9, total: 10 }))
    addAttempt(slug, attempt({ score: 8, total: 10, date: '2026-10-03T00:00:00.000Z' }))
    expect(getBest(slug)?.percent).toBe(90)
    expect(getBest(slug)?.date).toBe('2026-10-22T10:00:00.000Z')

    addAttempt(slug, attempt({ score: 10, total: 10, date: '2026-10-04T00:00:00.000Z' }))
    expect(getBest(slug)?.percent).toBe(100)
    expect(getBest(slug)?.date).toBe('2026-10-04T00:00:00.000Z')
  })

  it('returns null when absent or corrupt', () => {
    expect(getBest(slug)).toBeNull()
    window.localStorage.setItem(quizBestKey(slug), '[]')
    expect(getBest(slug)).toBeNull()
  })
})

describe('clearHistory', () => {
  it('removes history and best for the slug only', () => {
    addAttempt(slug, attempt())
    addAttempt('other-quiz', attempt())
    clearHistory(slug)

    expect(getHistory(slug)).toEqual([])
    expect(getBest(slug)).toBeNull()
    expect(getHistory('other-quiz')).toHaveLength(1)
  })
})

describe('certificate name', () => {
  it('round-trips a name and clears on empty value', () => {
    expect(getCertName()).toBe('')
    setCertName('Ada Lovelace')
    expect(getCertName()).toBe('Ada Lovelace')
    setCertName('')
    expect(getCertName()).toBe('')
    expect(window.localStorage.getItem(QUIZ_CERT_NAME_KEY)).toBeNull()
  })
})
