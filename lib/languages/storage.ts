import { createSafeMap, isSafeKey, readJson, safeRemove, safeSet } from '@/lib/storage/safe-storage'

export interface CardProgress {
  streak: number
  totalReviews: number
  lastReviewed: number
}

export type FlashcardProgressMap = Record<string, CardProgress>

export interface FlashcardLoadResult {
  progress: FlashcardProgressMap
  migrated: boolean
}

export interface MatchingBest {
  score: number
  accuracy: number
  elapsedMs: number
  numPairs: number
  date: string
}

export interface MatchingResult {
  score: number
  accuracy: number
  elapsedMs: number
  numPairs: number
}

const PROGRESS_PREFIX = 'v1:lang-progress-'
const BEST_PREFIX = 'v1:lang-best-'
const LEGACY_FLASHCARD_PREFIX = 'flashcard_progress_'
export const LEARNED_THRESHOLD = 3

export function langProgressKey(pair: string, slug: string): string {
  return `${PROGRESS_PREFIX}${pair}-${slug}`
}

export function langBestKey(pair: string, slug: string): string {
  return `${BEST_PREFIX}${pair}-${slug}`
}

export function legacyFlashcardKey(gameId: string): string {
  return `${LEGACY_FLASHCARD_PREFIX}${gameId}`
}

function migrateLegacyFormat(data: Record<string, unknown>): {
  progress: FlashcardProgressMap
  migrated: boolean
} {
  let migrated = false
  // Prototype-less map plus a reserved-key guard: a stored `__proto__` entry
  // can never reach an object's prototype chain.
  const progress: FlashcardProgressMap = createSafeMap<CardProgress>()
  for (const [wordId, value] of Object.entries(data)) {
    if (!isSafeKey(wordId)) continue
    if (value && typeof value === 'object' && ('ease' in value || 'repetitions' in value)) {
      migrated = true
      const v = value as Record<string, unknown>
      const reps = typeof v.repetitions === 'number' ? v.repetitions : 0
      progress[wordId] = {
        streak: reps >= LEARNED_THRESHOLD ? LEARNED_THRESHOLD : reps > 0 ? reps : 0,
        totalReviews: reps,
        lastReviewed:
          typeof v.lastReviewed === 'number'
            ? v.lastReviewed
            : typeof v.nextReview === 'number'
              ? v.nextReview
              : Date.now(),
      }
    } else if (value && typeof value === 'object' && 'streak' in value) {
      const v = value as Record<string, unknown>
      progress[wordId] = {
        streak: typeof v.streak === 'number' ? v.streak : 0,
        totalReviews: typeof v.totalReviews === 'number' ? v.totalReviews : 0,
        lastReviewed: typeof v.lastReviewed === 'number' ? v.lastReviewed : Date.now(),
      }
    }
  }
  return { progress, migrated }
}

export function normalizeFlashcardProgress(data: unknown): FlashcardLoadResult {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return migrateLegacyFormat(data as Record<string, unknown>)
  }
  return { progress: {}, migrated: false }
}

export function getFlashcardProgress(
  pair: string,
  slug: string,
  legacyGameId?: string
): FlashcardLoadResult {
  const current = readJson<unknown>(langProgressKey(pair, slug))
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    return migrateLegacyFormat(current as Record<string, unknown>)
  }
  if (legacyGameId) {
    const legacy = readJson<unknown>(legacyFlashcardKey(legacyGameId))
    if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
      return migrateLegacyFormat(legacy as Record<string, unknown>)
    }
  }
  return { progress: {}, migrated: false }
}

export function setFlashcardProgress(
  pair: string,
  slug: string,
  progress: FlashcardProgressMap
): void {
  safeSet(langProgressKey(pair, slug), JSON.stringify(progress))
}

export function getMatchingBest(pair: string, slug: string): MatchingBest | null {
  const parsed = readJson<unknown>(langBestKey(pair, slug))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
  const value = parsed as Record<string, unknown>
  if (typeof value.score !== 'number') return null
  if (typeof value.accuracy !== 'number') return null
  if (typeof value.elapsedMs !== 'number') return null
  if (typeof value.numPairs !== 'number') return null
  if (typeof value.date !== 'string') return null
  return {
    score: value.score,
    accuracy: value.accuracy,
    elapsedMs: value.elapsedMs,
    numPairs: value.numPairs,
    date: value.date,
  }
}

export function recordMatchingBest(pair: string, slug: string, result: MatchingResult): MatchingBest {
  const previous = getMatchingBest(pair, slug)
  const candidate: MatchingBest = { ...result, date: new Date().toISOString() }
  if (
    !previous ||
    candidate.accuracy > previous.accuracy ||
    (candidate.accuracy === previous.accuracy && candidate.elapsedMs < previous.elapsedMs)
  ) {
    safeSet(langBestKey(pair, slug), JSON.stringify(candidate))
    return candidate
  }
  return previous
}

export function clearMatchingBest(pair: string, slug: string): void {
  safeRemove(langBestKey(pair, slug))
}
