import { getProfile, levelFromXp, recordEvent } from './profile'
import type { BadgeId, EventResult, GamificationEvent } from './types'

export interface AwardEvent {
  xp: number
  badges: BadgeId[]
  level: number
  previousLevel: number
}

type Listener = (event: AwardEvent) => void

const listeners = new Set<Listener>()

export function onAward(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitAward(event: AwardEvent): void {
  listeners.forEach(listener => listener(event))
}

export function recordAndEmit(event: GamificationEvent): EventResult {
  const before = getProfile()
  const result = recordEvent(event)
  emitAward({
    xp: result.gainedXp,
    badges: result.awardedBadges as BadgeId[],
    level: levelFromXp(result.profile.xp),
    previousLevel: levelFromXp(before.xp),
  })
  return result
}
