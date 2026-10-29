import {
  getReviewCards,
  saveReviewCard,
} from '@/lib/practice/cards'
import { isDue, newCard, reviewCard } from '@/lib/practice/fsrs'
import { getFlashcardProgress } from '@/lib/languages/storage'
import type { ReviewCardState } from '@/lib/practice/types'
import { vocabCardKey } from './types'

/**
 * Spaced-repetition scheduling for language vocabulary.
 *
 * Reuses the shared FSRS engine (`lib/practice/fsrs.ts`) and the shared card
 * store (`v1:review-cards`) under a reserved key namespace:
 *
 *   `lang::<pair>::<vocabId>`   e.g. `lang::pt-en::w001`
 *
 * So language cards join the same daily review queue as course questions, and
 * a word learned in one deck is scheduled everywhere it appears.
 */

/** Extracts the vocab id from a `lang::` card key, or null for other keys. */
export function parseVocabCardKey(key: string): { pair: string; vocabId: string } | null {
  const parts = key.split('::')
  if (parts.length !== 3 || parts[0] !== 'lang') return null
  return { pair: parts[1], vocabId: parts[2] }
}

export function isVocabCard(card: ReviewCardState): boolean {
  return parseVocabCardKey(card.key) !== null
}

export interface ScheduleOutcome {
  card: ReviewCardState
  created: boolean
}

/**
 * Upserts one vocab card: a correct recall advances the FSRS schedule (Good),
 * a miss resets it (Again). Idempotent and safe to call repeatedly.
 */
export function scheduleVocab(
  pair: string,
  vocabId: string,
  courseSlug: string,
  correct: boolean,
  now: Date = new Date()
): ScheduleOutcome {
  const key = vocabCardKey(pair, vocabId)
  const existing = getReviewCards()[key]
  if (existing) {
    const { next } = reviewCard(existing, correct, now)
    saveReviewCard(next)
    return { card: next, created: false }
  }
  const fresh = newCard(key, courseSlug, 'vocabulary', now)
  const { next } = reviewCard(fresh, correct, now)
  saveReviewCard(next)
  return { card: next, created: true }
}

/** All scheduled vocab cards for a pair, regardless of due date. */
export function getVocabCards(pair: string): ReviewCardState[] {
  return Object.values(getReviewCards()).filter((card) => {
    const parsed = parseVocabCardKey(card.key)
    return parsed !== null && parsed.pair === pair
  })
}

/** Vocab cards due right now, earliest due first. */
export function dueVocabCards(pair: string, now: Date = new Date()): ReviewCardState[] {
  return getVocabCards(pair)
    .filter((card) => isDue(card, now))
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
}

export function dueVocabCount(pair: string, now: Date = new Date()): number {
  return dueVocabCards(pair, now).length
}

/**
 * One-time migration: legacy flashcard decks tracked progress as streak
 * buckets (`v1:lang-progress-<pair>-<slug>`). Learners should not lose that
 * work, so every card at or above the "learned" threshold seeds an FSRS card
 * due immediately: it is re-retrieved once, then follows the normal schedule.
 * Idempotent: cards that already exist are left untouched.
 */
export function seedFromLegacyBuckets(
  pair: string,
  courseSlug: string,
  deckSlug: string,
  wordIds: string[],
  now: Date = new Date()
): number {
  const { progress } = getFlashcardProgress(pair, deckSlug)
  let seeded = 0
  for (const wordId of wordIds) {
    const bucket = progress[wordId]
    if (!bucket || bucket.streak < 3) continue
    const key = vocabCardKey(pair, wordId)
    if (getReviewCards()[key]) continue
    // Rebuild a real FSRS history: `reps` consecutive Good reviews grow the
    // stability honestly, so the scheduler keeps a sane due date instead of
    // receiving a Review-state card with zero stability (invalid math).
    let card = newCard(key, courseSlug, 'vocabulary', now)
    const reps = Math.min(bucket.streak, 5)
    for (let i = 0; i < reps; i++) {
      card = reviewCard(card, true, now).next
    }
    saveReviewCard(card)
    seeded += 1
  }
  return seeded
}
