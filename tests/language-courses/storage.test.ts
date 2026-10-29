import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  coursePercent,
  getCourseProgress,
  isLessonComplete,
  saveLessonResult,
  unitPercent,
  updateLastLesson,
} from '@/lib/language-courses/storage'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('language-course storage', () => {
  it('records attempts, keeps the best score and marks completion', () => {
    const first = saveLessonResult('english-for-pt', 'u1', 'l1', 90)
    expect(first.newlyCompleted).toBe(true)

    const second = saveLessonResult('english-for-pt', 'u1', 'l1', 70)
    expect(second.newlyCompleted).toBe(false)

    const progress = getCourseProgress('english-for-pt')
    const lesson = progress.units.u1?.lessons.l1
    expect(lesson?.bestPercent).toBe(90)
    expect(lesson?.lastPercent).toBe(70)
    expect(lesson?.attempts).toBe(2)
    expect(isLessonComplete(progress, 'u1', 'l1')).toBe(true)
    expect(isLessonComplete(progress, 'u1', 'l2')).toBe(false)
  })

  it('clamps percent to 0..100', () => {
    saveLessonResult('c', 'u', 'l', 250)
    expect(getCourseProgress('c').units.u?.lessons.l?.bestPercent).toBe(100)
    saveLessonResult('c', 'u', 'l', -5)
    expect(getCourseProgress('c').units.u?.lessons.l?.bestPercent).toBe(100)
  })

  it('computes unit and course percentages', () => {
    saveLessonResult('english-for-pt', 'u1', 'l1', 100)
    const progress = getCourseProgress('english-for-pt')
    expect(unitPercent(progress, 'u1', 2)).toBe(50)
    expect(unitPercent(progress, 'u2', 2)).toBe(0)
    expect(coursePercent(progress, 4)).toBe(25)
  })

  it('updateLastLesson records the resume point', () => {
    updateLastLesson('c', 'u2', 'l9')
    expect(getCourseProgress('c').lastLesson).toEqual({ unit: 'u2', lesson: 'l9' })
  })

  it('survives corrupt stored JSON (purged, not thrown)', () => {
    window.localStorage.setItem('v1:language-course-progress-c', '{not json')
    expect(getCourseProgress('c').units).toEqual({})
    // The corrupt entry is purged by readJson.
  })

  it('rejects prototype-polluting keys', () => {
    window.localStorage.setItem(
      'v1:language-course-progress-c',
      JSON.stringify({ units: { __proto__: { lessons: { x: {} } } }, startedAt: '2026-01-01' })
    )
    const progress = getCourseProgress('c')
    expect(Object.keys(progress.units)).toHaveLength(0)
  })
})
