import { readJson, writeJson } from '@/lib/storage/safe-storage'
import type { ReviewCardMap, ReviewCardState } from './types'
import { isDue } from './fsrs'

const REVIEW_CARDS_KEY = 'v1:review-cards'
/** Defensive cap so a long-lived profile cannot exceed localStorage limits. */
const MAX_CARDS = 5000

function sanitize(raw: unknown): ReviewCardMap | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  const map: ReviewCardMap = Object.create(null)
  for (const [k, v] of Object.entries(value)) {
    if (typeof v !== 'object' || v === null) continue
    const card = v as Record<string, unknown>
    if (typeof card.key !== 'string' || typeof card.due !== 'string') continue
    map[k] = v as unknown as ReviewCardState
  }
  return map
}

export function getReviewCards(): ReviewCardMap {
  return readJson<ReviewCardMap>(REVIEW_CARDS_KEY, sanitize) ?? Object.create(null)
}

/**
 * Evicts the oldest-reviewed cards when a map exceeds `max`. Exported so the
 * pruning rule can be tested without writing 5,000 entries.
 */
export function pruneCards(map: ReviewCardMap, max: number = MAX_CARDS): ReviewCardMap {
  const keys = Object.keys(map)
  if (keys.length <= max) return map
  keys
    .sort((a, b) => (map[a].lastReview ?? '').localeCompare(map[b].lastReview ?? ''))
    .slice(0, keys.length - max)
    .forEach((key) => delete map[key])
  return map
}

/**
 * Persists one card. When the cap is hit, the card with the oldest review
 * date is evicted so recent learning always survives.
 */
export function saveReviewCard(state: ReviewCardState): void {
  const map = getReviewCards()
  map[state.key] = state
  writeJson(REVIEW_CARDS_KEY, pruneCards(map))
}

export function getDueCards(now: Date = new Date()): ReviewCardState[] {
  return Object.values(getReviewCards()).filter((c) => isDue(c, now))
}

/** Cards due for review, earliest-due first, capped. */
export function pickDueSession(limit = 20, now: Date = new Date()): ReviewCardState[] {
  return getDueCards(now)
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
    .slice(0, limit)
}
