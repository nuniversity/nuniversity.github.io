import { beforeEach, describe, expect, it } from 'vitest'
import {
  LAST_VISITED_KEY,
  coursePercent,
  courseProgressKey,
  getCourseProgress,
  getLastVisited,
  isCourseComplete,
  isLessonComplete,
  markLessonComplete,
  markLessonIncomplete,
  recordVisit,
  setLastLesson,
} from '@/lib/progress/storage'

const meta = { courseTitle: 'Course T', lessonTitle: 'Lesson T', lang: 'en' }

beforeEach(() => {
  window.localStorage.clear()
})

describe('keys', () => {
  it('uses the v1: versioned prefix', () => {
    expect(courseProgressKey('intro-to-programming')).toBe('v1:course-progress-intro-to-programming')
    expect(LAST_VISITED_KEY).toBe('v1:last-visited')
  })
})

describe('recordVisit', () => {
  it('creates course progress and writes the global pointer', () => {
    recordVisit('c1', '01-a', meta)
    const progress = getCourseProgress('c1')
    expect(progress).not.toBeNull()
    expect(progress?.lastLesson).toBe('01-a')
    expect(progress?.completed).toEqual([])
    expect(progress?.startedAt).toBeTruthy()

    const pointer = getLastVisited()
    expect(pointer).toMatchObject({ courseSlug: 'c1', lessonSlug: '01-a', courseTitle: 'Course T', lessonTitle: 'Lesson T', lang: 'en' })
    expect(pointer?.at).toBeTruthy()
  })

  it('keeps startedAt stable while advancing lastLesson', () => {
    const first = recordVisit('c1', '01-a', meta)
    const second = recordVisit('c1', '02-b', meta)
    expect(second.startedAt).toBe(first.startedAt)
    expect(second.lastLesson).toBe('02-b')
    expect(getLastVisited()?.lessonSlug).toBe('02-b')
  })

  it('preserves completed lessons across visits', () => {
    recordVisit('c1', '01-a', meta)
    markLessonComplete('c1', '01-a')
    const next = recordVisit('c1', '02-b', meta)
    expect(next.completed).toEqual(['01-a'])
  })
})

describe('getLastVisited', () => {
  it('returns null when absent', () => {
    expect(getLastVisited()).toBeNull()
  })

  it('drops corrupted JSON and returns null', () => {
    window.localStorage.setItem(LAST_VISITED_KEY, '{nope')
    expect(getLastVisited()).toBeNull()
    expect(window.localStorage.getItem(LAST_VISITED_KEY)).toBeNull()
  })

  it('rejects pointers missing course/lesson slugs', () => {
    window.localStorage.setItem(LAST_VISITED_KEY, JSON.stringify({ courseSlug: 'c1' }))
    expect(getLastVisited()).toBeNull()
  })

  it('coerces optional meta fields to empty strings', () => {
    window.localStorage.setItem(LAST_VISITED_KEY, JSON.stringify({ courseSlug: 'c1', lessonSlug: '01' }))
    expect(getLastVisited()).toMatchObject({ courseTitle: '', lessonTitle: '', lang: '', at: '' })
  })
})

describe('markLessonComplete / markLessonIncomplete', () => {
  it('adds a lesson exactly once', () => {
    const first = markLessonComplete('c1', '01-a')
    expect(first.newlyCompleted).toBe(true)
    const second = markLessonComplete('c1', '01-a')
    expect(second.newlyCompleted).toBe(false)
    expect(second.progress.completed).toEqual(['01-a'])
  })

  it('creates progress when none exists yet', () => {
    const { progress } = markLessonComplete('c1', '01-a')
    expect(progress.courseSlug).toBe('c1')
    expect(progress.startedAt).toBeTruthy()
    expect(isLessonComplete('c1', '01-a')).toBe(true)
  })

  it('removes a lesson on incomplete', () => {
    markLessonComplete('c1', '01-a')
    markLessonComplete('c1', '02-b')
    const progress = markLessonIncomplete('c1', '01-a')
    expect(progress?.completed).toEqual(['02-b'])
    expect(isLessonComplete('c1', '01-a')).toBe(false)
  })

  it('returns null when marking incomplete with no progress', () => {
    expect(markLessonIncomplete('c1', '01-a')).toBeNull()
  })
})

describe('setLastLesson', () => {
  it('updates only existing progress', () => {
    expect(setLastLesson('c1', '01-a')).toBeNull()
    recordVisit('c1', '01-a', meta)
    const updated = setLastLesson('c1', '03-c')
    expect(updated?.lastLesson).toBe('03-c')
  })
})

describe('corruption hygiene', () => {
  it('returns null for corrupted course progress and removes the key', () => {
    window.localStorage.setItem(courseProgressKey('c1'), 'not-json')
    expect(getCourseProgress('c1')).toBeNull()
    expect(window.localStorage.getItem(courseProgressKey('c1'))).toBeNull()
  })

  it('drops entries where completed is not an array', () => {
    window.localStorage.setItem(courseProgressKey('c1'), JSON.stringify({ completed: 'nope' }))
    expect(getCourseProgress('c1')).toBeNull()
  })

  it('filters non-string entries from completed', () => {
    window.localStorage.setItem(
      courseProgressKey('c1'),
      JSON.stringify({ completed: ['01-a', 42, null, '02-b'], lastLesson: 7, startedAt: 1, lastVisitedAt: 2 })
    )
    const progress = getCourseProgress('c1')
    expect(progress?.completed).toEqual(['01-a', '02-b'])
    expect(progress?.lastLesson).toBeNull()
  })
})

describe('coursePercent / isCourseComplete', () => {
  it('computes percent from completed count', () => {
    recordVisit('c1', '01-a', meta)
    markLessonComplete('c1', '01-a')
    markLessonComplete('c1', '02-b')
    const progress = getCourseProgress('c1')
    expect(coursePercent(progress, 8)).toBe(25)
    expect(isCourseComplete(progress, 8)).toBe(false)
    expect(isCourseComplete(progress, 2)).toBe(true)
  })

  it('returns 0 for null progress or zero lessons', () => {
    expect(coursePercent(null, 8)).toBe(0)
    expect(coursePercent(getCourseProgress('missing'), 0)).toBe(0)
    expect(isCourseComplete(null, 8)).toBe(false)
    expect(isCourseComplete(getCourseProgress('missing'), 0)).toBe(false)
  })

  it('caps at 100 percent when completed exceeds total', () => {
    recordVisit('c1', '01-a', meta)
    markLessonComplete('c1', '01-a')
    markLessonComplete('c1', '02-b')
    expect(coursePercent(getCourseProgress('c1'), 1)).toBe(100)
  })
})
