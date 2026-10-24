import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emitAward, onAward, recordAndEmit } from '@/lib/gamification/bus'
import { PROFILE_KEY, clearProfile, getProfile, saveProfile } from '@/lib/gamification/profile'

beforeEach(() => {
  clearProfile()
})

describe('award bus', () => {
  it('delivers events to subscribers and stops after unsubscribe', () => {
    const seen: number[] = []
    const off = onAward(event => seen.push(event.xp))

    emitAward({ xp: 5, badges: [], level: 1, previousLevel: 1 })
    off()
    emitAward({ xp: 7, badges: [], level: 1, previousLevel: 1 })

    expect(seen).toEqual([5])
  })

  it('recordAndEmit persists lesson XP and the first-lesson badge', () => {
    const result = recordAndEmit({ type: 'lesson-complete', courseSlug: 'c', lessonSlug: 'l' })

    expect(result.gainedXp).toBe(10)
    expect(result.awardedBadges).toEqual(['first-lesson'])
    const stored = getProfile()
    expect(stored.xp).toBe(10)
    expect(stored.badges['first-lesson']).toBeTruthy()
    expect(stored.streak.current).toBe(1)
  })

  it('recordAndEmit awards the course badge with 100 XP', () => {
    const result = recordAndEmit({ type: 'course-complete', courseSlug: 'c' })

    expect(result.gainedXp).toBe(100)
    expect(result.awardedBadges).toEqual(['course-complete'])
    expect(getProfile().xp).toBe(100)
  })

  it('emits a level-up when XP crosses a level boundary', () => {
    saveProfile({ xp: 95, badges: {}, streak: { current: 3, best: 3, lastDay: null } })
    const events: { level: number; previousLevel: number }[] = []
    const off = onAward(event =>
      events.push({ level: event.level, previousLevel: event.previousLevel })
    )

    recordAndEmit({ type: 'lesson-complete', courseSlug: 'c', lessonSlug: 'l' })
    off()

    expect(getProfile().xp).toBe(105)
    expect(events).toEqual([{ level: 2, previousLevel: 1 }])
  })

  it('does not re-award badges that already exist', () => {
    recordAndEmit({ type: 'lesson-complete', courseSlug: 'c', lessonSlug: 'l' })
    const second = recordAndEmit({ type: 'lesson-complete', courseSlug: 'c', lessonSlug: 'l2' })

    expect(second.awardedBadges).toEqual([])
    expect(getProfile().xp).toBe(20)
    expect(localStorage.getItem(PROFILE_KEY)).toBeTruthy()
  })
})
