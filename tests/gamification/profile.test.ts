import { beforeEach, describe, expect, it } from 'vitest'
import {
  PROFILE_KEY,
  applyEvent,
  clearProfile,
  dayKey,
  getProfile,
  levelFromXp,
  recordEvent,
  saveProfile,
  sanitizeProfile,
  touchStreak,
  yesterdayKey,
} from '@/lib/gamification/profile'
import type { GamificationProfile } from '@/lib/gamification/types'

function profile(overrides: Partial<GamificationProfile> = {}): GamificationProfile {
  return {
    xp: 0,
    badges: {},
    streak: { current: 0, best: 0, lastDay: null },
    ...overrides,
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('getProfile / saveProfile', () => {
  it('returns an empty profile when nothing is stored', () => {
    expect(getProfile()).toEqual({ xp: 0, badges: {}, streak: { current: 0, best: 0, lastDay: null } })
  })

  it('round-trips a saved profile', () => {
    saveProfile({ xp: 130, badges: { 'first-lesson': '2026-10-23T00:00:00.000Z' }, streak: { current: 3, best: 5, lastDay: '2026-10-23' } })
    expect(getProfile()).toEqual({
      xp: 130,
      badges: { 'first-lesson': '2026-10-23T00:00:00.000Z' },
      streak: { current: 3, best: 5, lastDay: '2026-10-23' },
    })
  })

  it('drops corrupted JSON and resets', () => {
    window.localStorage.setItem(PROFILE_KEY, '{broken')
    expect(getProfile()).toEqual({ xp: 0, badges: {}, streak: { current: 0, best: 0, lastDay: null } })
    expect(window.localStorage.getItem(PROFILE_KEY)).toBeNull()
  })

  it('clearProfile removes the key', () => {
    saveProfile(profile({ xp: 10 }))
    clearProfile()
    expect(window.localStorage.getItem(PROFILE_KEY)).toBeNull()
  })
})

describe('sanitizeProfile', () => {
  it('floors xp and rejects negative/non-finite values', () => {
    expect(sanitizeProfile({ xp: 59.9 }).xp).toBe(59)
    expect(sanitizeProfile({ xp: -10 }).xp).toBe(0)
    expect(sanitizeProfile({ xp: Number.NaN }).xp).toBe(0)
  })

  it('keeps only string badge timestamps', () => {
    const result = sanitizeProfile({ badges: { 'first-lesson': '2026-10-23', 'quiz-pass': 42 } })
    expect(result.badges).toEqual({ 'first-lesson': '2026-10-23' })
  })

  it('forces best >= current and tolerates junk streaks', () => {
    expect(sanitizeProfile({ streak: { current: 7, best: 2 } }).streak).toEqual({ current: 7, best: 7, lastDay: null })
    expect(sanitizeProfile({ streak: { current: -3, lastDay: 9 } }).streak).toEqual({ current: 0, best: 0, lastDay: null })
  })

  it('returns empty profile for non-objects', () => {
    expect(sanitizeProfile(null)).toEqual({ xp: 0, badges: {}, streak: { current: 0, best: 0, lastDay: null } })
    expect(sanitizeProfile('x')).toEqual({ xp: 0, badges: {}, streak: { current: 0, best: 0, lastDay: null } })
  })
})

describe('day keys', () => {
  it('formats local day keys', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(yesterdayKey(new Date(2026, 0, 5))).toBe('2026-01-04')
  })

  it('handles month and year boundaries', () => {
    expect(yesterdayKey(new Date(2026, 2, 1))).toBe('2026-02-28')
    expect(yesterdayKey(new Date(2026, 0, 1))).toBe('2025-12-31')
  })
})

describe('levelFromXp', () => {
  it('levels every 100 xp', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(99)).toBe(1)
    expect(levelFromXp(100)).toBe(2)
    expect(levelFromXp(1000)).toBe(11)
  })
})

describe('touchStreak', () => {
  it('starts at 1 on first activity', () => {
    expect(touchStreak(profile(), new Date(2026, 9, 23))).toEqual({ current: 1, best: 1, lastDay: '2026-10-23' })
  })

  it('keeps the streak on the same day', () => {
    const start = touchStreak(profile(), new Date(2026, 9, 23, 9))
    const later = touchStreak(profile({ streak: start }), new Date(2026, 9, 23, 22))
    expect(later).toEqual({ current: 1, best: 1, lastDay: '2026-10-23' })
  })

  it('increments on consecutive days', () => {
    const streak = touchStreak(profile({ streak: { current: 2, best: 2, lastDay: '2026-10-22' } }), new Date(2026, 9, 23))
    expect(streak).toEqual({ current: 3, best: 3, lastDay: '2026-10-23' })
  })

  it('resets after a missed day but keeps best', () => {
    const streak = touchStreak(profile({ streak: { current: 6, best: 9, lastDay: '2026-10-20' } }), new Date(2026, 9, 23))
    expect(streak).toEqual({ current: 1, best: 9, lastDay: '2026-10-23' })
  })
})

describe('applyEvent', () => {
  const day = new Date(2026, 9, 23)

  it('grants xp per event type and touches the streak', () => {
    const lesson = applyEvent(profile(), { type: 'lesson-complete', courseSlug: 'c', lessonSlug: '01' }, day)
    expect(lesson.gainedXp).toBe(10)
    expect(lesson.profile.xp).toBe(10)
    expect(lesson.profile.streak.current).toBe(1)

    expect(applyEvent(profile(), { type: 'quiz-pass', quizSlug: 'q', percent: 80, mode: 'exam' }, day).gainedXp).toBe(20)
    expect(applyEvent(profile(), { type: 'course-complete', courseSlug: 'c' }, day).gainedXp).toBe(100)
  })

  it('awards first-lesson on lesson complete only', () => {
    const result = applyEvent(profile(), { type: 'lesson-complete', courseSlug: 'c', lessonSlug: '01' }, day)
    expect(result.awardedBadges).toEqual(['first-lesson'])
    expect(result.profile.badges['first-lesson']).toBe(day.toISOString())
  })

  it('awards quiz-pass and perfect-quiz at 100 percent', () => {
    const pass = applyEvent(profile(), { type: 'quiz-pass', quizSlug: 'q', percent: 80, mode: 'exam' }, day)
    expect(pass.awardedBadges).toEqual(['quiz-pass'])

    const perfect = applyEvent(profile(), { type: 'quiz-pass', quizSlug: 'q', percent: 100, mode: 'exam' }, day)
    expect(perfect.awardedBadges).toEqual(['quiz-pass', 'perfect-quiz'])
  })

  it('awards course-complete on course completion', () => {
    const result = applyEvent(profile(), { type: 'course-complete', courseSlug: 'c' }, day)
    expect(result.awardedBadges).toEqual(['course-complete'])
  })

  it('never re-awards existing badges', () => {
    const seed = profile({ badges: { 'first-lesson': day.toISOString() } })
    const result = applyEvent(seed, { type: 'lesson-complete', courseSlug: 'c', lessonSlug: '01' }, day)
    expect(result.awardedBadges).toEqual([])
  })

  it('awards streak-7 once the streak reaches 7', () => {
    const seed = profile({ streak: { current: 6, best: 6, lastDay: '2026-10-22' } })
    const result = applyEvent(seed, { type: 'lesson-complete', courseSlug: 'c', lessonSlug: '01' }, day)
    expect(result.profile.streak.current).toBe(7)
    expect(result.awardedBadges).toEqual(['first-lesson', 'streak-7'])

    const again = applyEvent(result.profile, { type: 'lesson-complete', courseSlug: 'c', lessonSlug: '02' }, new Date(2026, 9, 24))
    expect(again.awardedBadges).toEqual([])
  })
})

describe('recordEvent', () => {
  it('persists the resulting profile', () => {
    const result = recordEvent({ type: 'lesson-complete', courseSlug: 'c', lessonSlug: '01' }, new Date(2026, 9, 23))
    expect(result.profile.xp).toBe(10)
    const stored = getProfile()
    expect(stored.xp).toBe(10)
    expect(stored.badges['first-lesson']).toBeTruthy()
    expect(stored.streak.lastDay).toBe('2026-10-23')
  })
})
