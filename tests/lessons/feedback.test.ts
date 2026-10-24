import { beforeEach, describe, expect, it } from 'vitest'
import {
  getLessonFeedback,
  getLessonFeedbacks,
  saveLessonFeedback,
} from '@/lib/lessons/feedback'

const KEY = 'v1:lesson-feedback'

function entry(slug: string, verdict: 'up' | 'down', at = '2026-10-01T00:00:00.000Z') {
  return { slug, verdict, at }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('feedback storage', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(getLessonFeedbacks()).toEqual([])
    expect(getLessonFeedback('a/b')).toBeNull()
  })

  it('saves and reads back a verdict per lesson', () => {
    saveLessonFeedback(entry('course/intro', 'up'))

    expect(getLessonFeedback('course/intro')).toBe('up')
    expect(getLessonFeedback('course/other')).toBeNull()
    expect(getLessonFeedbacks()).toHaveLength(1)
  })

  it('upserts the latest verdict for the same lesson', () => {
    saveLessonFeedback(entry('course/intro', 'up'))
    saveLessonFeedback(entry('course/intro', 'down', '2026-10-02T00:00:00.000Z'))

    const entries = getLessonFeedbacks()
    expect(entries).toHaveLength(1)
    expect(getLessonFeedback('course/intro')).toBe('down')
  })

  it('caps the stored list at 200 entries', () => {
    for (let i = 0; i < 210; i++) {
      saveLessonFeedback(entry(`course/lesson-${i}`, 'up'))
    }

    const entries = getLessonFeedbacks()
    expect(entries).toHaveLength(200)
    expect(entries[0].slug).toBe('course/lesson-10')
    expect(entries[199].slug).toBe('course/lesson-209')
  })

  it('clears corrupt JSON and invalid entries', () => {
    window.localStorage.setItem(KEY, 'not-json')
    expect(getLessonFeedbacks()).toEqual([])
    expect(window.localStorage.getItem(KEY)).toBeNull()

    window.localStorage.setItem(KEY, JSON.stringify([{ slug: 'x/y' }, entry('x/y', 'up')]))
    expect(getLessonFeedbacks()).toEqual([entry('x/y', 'up')])
  })
})
