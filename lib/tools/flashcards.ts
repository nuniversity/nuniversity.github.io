import { isCardDue, type CardSchedule } from './srs'

export interface QueueCard extends CardSchedule {
  id: number
}

/**
 * Builds a study queue without duplicates.
 *
 * New cards (`repetitions === 0`) are due by definition, so the previous
 * implementation included them in both `due` and `newCards` and every new card
 * appeared twice per session — rating it twice double-advanced its interval.
 * Due and new cards are disjoint here by construction.
 */
export function buildStudyQueue<T extends QueueCard>(
  cards: T[],
  now = Date.now(),
  shuffle: <V>(items: V[]) => V[] = identity
): T[] {
  const due = cards.filter((card) => card.repetitions > 0 && isCardDue(card, now))
  const fresh = cards.filter((card) => card.repetitions === 0)
  const pool = [...due, ...fresh]
  // Nothing scheduled and nothing new: fall back to a free-review pass.
  return shuffle(pool.length > 0 ? pool : cards)
}

function identity<T>(items: T[]): T[] {
  return items
}
