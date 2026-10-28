import { beforeEach, describe, expect, it } from 'vitest'
import {
  betaMastery,
  getPracticeStore,
  hashKey,
  lessonMastery,
  listCoursesWithPractice,
  recordPracticeAnswer,
  stablePracticeKey,
} from '@/lib/practice/record'

beforeEach(() => {
  window.localStorage.clear()
})

describe('betaMastery', () => {
  it('shrinks small samples and converges on the observed rate', () => {
    expect(betaMastery(0, 0)).toBe(0.5)
    expect(betaMastery(1, 1)).toBeCloseTo(0.667, 3)
    expect(betaMastery(0, 1)).toBeCloseTo(0.333, 3)
    expect(betaMastery(5, 5)).toBeCloseTo(0.857, 3)
    expect(betaMastery(0, 5)).toBeCloseTo(0.143, 3)
  })

  it('never exceeds the attempt count in the numerator', () => {
    expect(betaMastery(10, 2)).toBeCloseTo(3 / 4, 5)
  })
})

describe('hashKey', () => {
  it('is deterministic and prefixed', () => {
    expect(hashKey('a')).toBe(hashKey('a'))
    expect(hashKey('a')).toMatch(/^h-/)
    expect(hashKey('a')).not.toBe(hashKey('b'))
  })
})

describe('stablePracticeKey', () => {
  it('prefixes the course slug and prefers the authored id', () => {
    expect(stablePracticeKey('sql-beginner', 'sql-01-q1', '01-lesson', 'question text')).toBe(
      'sql-beginner::sql-01-q1'
    )
    expect(stablePracticeKey('sql-beginner', undefined, '01-lesson', 'question text')).toMatch(
      /^sql-beginner::h-/
    )
  })

  it('keeps identical authored ids from different courses distinct', () => {
    const a = stablePracticeKey('course-a', 'q1', '01', 'text')
    const b = stablePracticeKey('course-b', 'q1', '01', 'text')
    expect(a).not.toBe(b)
  })
})

describe('recordPracticeAnswer + lessonMastery', () => {
  it('initializes with the Beta posterior and stores the course-scoped key', () => {
    const key = stablePracticeKey('course-a', 'q1', '01-lesson', 'q')
    const rec = recordPracticeAnswer('course-a', '01-lesson', { key, label: 'q', skill: null, correct: true })
    expect(rec.attempts).toBe(1)
    expect(rec.mastery).toBeCloseTo(2 / 3, 5)
    expect(getPracticeStore('course-a').answers[key]).toBeDefined()
  })

  it('recomputes mastery from counts on every attempt', () => {
    const key = stablePracticeKey('course-b', 'q1', '01-lesson', 'q')
    recordPracticeAnswer('course-b', '01-lesson', { key, label: 'q', skill: null, correct: true })
    const rec = recordPracticeAnswer('course-b', '01-lesson', { key, label: 'q', skill: null, correct: false })
    expect(rec.attempts).toBe(2)
    expect(rec.mastery).toBeCloseTo(2 / 4, 5)
  })

  it('lessonMastery averages mastery over the lesson records only', () => {
    recordPracticeAnswer('course-c', '01-a', {
      key: stablePracticeKey('course-c', 'q1', '01-a', 'q1'),
      label: 'q1',
      skill: null,
      correct: true,
    })
    recordPracticeAnswer('course-c', '01-a', {
      key: stablePracticeKey('course-c', 'q2', '01-a', 'q2'),
      label: 'q2',
      skill: null,
      correct: false,
    })
    recordPracticeAnswer('course-c', '02-b', {
      key: stablePracticeKey('course-c', 'q3', '02-b', 'q3'),
      label: 'q3',
      skill: null,
      correct: true,
    })
    const store = getPracticeStore('course-c')
    expect(lessonMastery(store, '01-a')).toBeCloseTo((2 / 3 + 1 / 3) / 2, 5)
    expect(lessonMastery(store, '02-b')).toBeCloseTo(2 / 3, 5)
    expect(lessonMastery(store, '03-missing')).toBeNull()
  })

  it('discards corrupt stored records instead of crashing', () => {
    window.localStorage.setItem(
      'v1:practice-answers-course-d',
      JSON.stringify({
        version: 2,
        updatedAt: 'x',
        answers: {
          bad: { attempts: 'NaN' },
          good: { key: 'k', lessonSlug: 'l', attempts: '3', correct: 9, mastery: 9 },
        },
      })
    )
    const store = getPracticeStore('course-d')
    expect(store.answers.bad).toBeUndefined()
    expect(store.answers.good.attempts).toBe(1)
    expect(store.answers.good.correct).toBe(1)
    expect(store.answers.good.mastery).toBe(1)
  })

  it('rejects prototype-polluting keys in storage', () => {
    const raw = JSON.parse('{"version":2,"updatedAt":"x","answers":{"__proto__":{"key":"x","lessonSlug":"l"}}}')
    window.localStorage.setItem('v1:practice-answers-course-e', JSON.stringify(raw))
    const store = getPracticeStore('course-e')
    expect(Object.prototype.hasOwnProperty.call(store.answers, '__proto__')).toBe(false)
  })
})

describe('listCoursesWithPractice', () => {
  it('lists only courses with a practice store', () => {
    recordPracticeAnswer('course-f', '01', {
      key: stablePracticeKey('course-f', 'q1', '01', 'q'),
      label: 'q',
      skill: null,
      correct: true,
    })
    expect(listCoursesWithPractice()).toContain('course-f')
  })
})
