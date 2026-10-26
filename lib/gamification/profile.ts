import {
  type GamificationProfile,
  type GamificationEvent,
  type EventResult,
  type BadgeId,
  XP_GAINS,
  XP_PER_LEVEL,
} from './types'
import { createSafeMap, isSafeKey, readJson, safeRemove, safeSet } from '@/lib/storage/safe-storage'

export const PROFILE_KEY = 'v1:profile'

const EMPTY_PROFILE: GamificationProfile = { xp: 0, badges: {}, streak: { current: 0, best: 0, lastDay: null } }

export function sanitizeProfile(raw: unknown): GamificationProfile {
  if (typeof raw !== 'object' || raw === null) return { ...EMPTY_PROFILE, streak: { ...EMPTY_PROFILE.streak } }
  const value = raw as Record<string, unknown>
  const xp = typeof value.xp === 'number' && Number.isFinite(value.xp) && value.xp >= 0 ? Math.floor(value.xp) : 0
  // Prototype-less map: a stored `__proto__` key can never become a prototype.
  const badges: Record<string, string> = createSafeMap<string>()
  if (typeof value.badges === 'object' && value.badges !== null) {
    for (const [id, at] of Object.entries(value.badges as Record<string, unknown>)) {
      if (!isSafeKey(id)) continue
      if (typeof at === 'string') badges[id] = at
    }
  }
  const rawStreak = typeof value.streak === 'object' && value.streak !== null ? (value.streak as Record<string, unknown>) : {}
  const current = typeof rawStreak.current === 'number' && rawStreak.current >= 0 ? Math.floor(rawStreak.current) : 0
  const best = typeof rawStreak.best === 'number' && rawStreak.best >= 0 ? Math.floor(rawStreak.best) : 0
  return {
    xp,
    badges,
    streak: {
      current,
      best: Math.max(best, current),
      lastDay: typeof rawStreak.lastDay === 'string' ? rawStreak.lastDay : null,
    },
  }
}

export function getProfile(): GamificationProfile {
  const parsed = readJson(PROFILE_KEY, sanitizeProfile)
  if (!parsed) return { ...EMPTY_PROFILE, streak: { ...EMPTY_PROFILE.streak } }
  return parsed
}

export function saveProfile(profile: GamificationProfile): void {
  safeSet(PROFILE_KEY, JSON.stringify(profile))
}

export function clearProfile(): void {
  safeRemove(PROFILE_KEY)
}

export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function yesterdayKey(date: Date): string {
  const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
  return dayKey(prev)
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function touchStreak(profile: GamificationProfile, now: Date): GamificationProfile['streak'] {
  const today = dayKey(now)
  const { streak } = profile
  if (streak.lastDay === today) return { ...streak }
  let current = 1
  if (streak.lastDay === yesterdayKey(now)) current = streak.current + 1
  return { current, best: Math.max(streak.best, current), lastDay: today }
}

export function evaluateBadges(profile: GamificationProfile, event: GamificationEvent, streakAfter: GamificationProfile['streak']): BadgeId[] {
  const earned: BadgeId[] = []
  const has = (id: BadgeId) => profile.badges[id] !== undefined
  if (event.type === 'lesson-complete' && !has('first-lesson')) earned.push('first-lesson')
  if (event.type === 'course-complete' && !has('course-complete')) earned.push('course-complete')
  if (event.type === 'quiz-pass') {
    if (!has('quiz-pass')) earned.push('quiz-pass')
    if (event.percent >= 100 && !has('perfect-quiz')) earned.push('perfect-quiz')
  }
  if (streakAfter.current >= 7 && !has('streak-7')) earned.push('streak-7')
  return earned
}

export function applyEvent(profile: GamificationProfile, event: GamificationEvent, now: Date): EventResult {
  const gainedXp = XP_GAINS[event.type]
  const streak = touchStreak(profile, now)
  const awardedBadges = evaluateBadges(profile, event, streak)
  const badges = { ...profile.badges }
  const at = now.toISOString()
  for (const id of awardedBadges) badges[id] = at
  const next: GamificationProfile = { xp: profile.xp + gainedXp, badges, streak }
  return { profile: next, gainedXp, awardedBadges }
}

export function recordEvent(event: GamificationEvent, now: Date = new Date()): EventResult {
  const result = applyEvent(getProfile(), event, now)
  saveProfile(result.profile)
  return result
}
