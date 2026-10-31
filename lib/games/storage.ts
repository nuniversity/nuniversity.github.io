/**
 * Best-score persistence for the games module.
 *
 * Mirrors the validated, versioned pattern of `lib/languages/storage.ts`:
 * keys are namespaced (`v1:game-best-`), values are shape-validated on read,
 * and the one legacy (unversioned) key written before this module existed is
 * migrated transparently.
 */
import { safeGet, safeSet, safeRemove } from '@/lib/storage/safe-storage'

const BEST_PREFIX = 'v1:game-best-'
const LEGACY_NUMBER_SEQUENCE_KEY = 'number_sequence_highscore'

export function gameBestKey(game: string, metric: string): string {
  return `${BEST_PREFIX}${game}-${metric}`
}

function readScoreString(key: string): number | null {
  const raw = safeGet(key)
  if (raw === null || raw === '') return null
  // Strict integer format: `parseInt` would happily accept '12abc' as 12, so a
  // hand-edited or truncated entry must be rejected entirely.
  if (!/^\d+$/.test(raw)) return null
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return parsed
}

export interface GameBest {
  score: number
  migrated?: boolean
}

/**
 * Reads the best value for `metric` of `game`. `null` when nothing valid is
 * stored (fresh browser, storage disabled, corrupt entry).
 */
export function getGameBest(game: string, metric: string): number | null {
  const current = readScoreString(gameBestKey(game, metric))
  if (current !== null) return current

  const legacy = readScoreString(LEGACY_NUMBER_SEQUENCE_KEY)
  if (legacy !== null) {
    // Promote the legacy value to the namespaced key once so the raw
    // unversioned key can be retired.
    safeSet(gameBestKey('number-sequence', metric), String(legacy))
    safeRemove(LEGACY_NUMBER_SEQUENCE_KEY)
    return legacy
  }
  return null
}

/**
 * Persists `value` for `metric` of `game` when it beats the stored best in a
 * *higher-is-better* metric (score). Returns `true` when it is a new best
 * (so callers can show a "new best" celebration).
 */
export function saveGameBestIfNew(game: string, metric: string, value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false
  const prev = getGameBest(game, metric)
  if (prev !== null && prev >= value) return false
  safeSet(gameBestKey(game, metric), String(value))
  return true
}

/**
 * Persists `value` for `metric` of `game` when it beats the stored best in a
 * *lower-is-better* metric (best time in seconds).
 */
export function saveGameBestLowIfNew(game: string, metric: string, value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false
  const prev = getGameBest(game, metric)
  if (prev !== null && prev <= value) return false
  safeSet(gameBestKey(game, metric), String(value))
  return true
}

export const GAME_ID = {
  numberSequence: 'number-sequence',
  mathChallenge: 'math-challenge',
  binaryHex: 'binary-hex',
  typingSpeed: 'typing-speed',
  periodicTable: 'periodic-table',
  wordSearch: 'word-search',
} as const
