import { beforeEach, describe, expect, it } from 'vitest'
import { isDue, newCard, reviewCard } from '@/lib/practice/fsrs'
import { getDueCards, getReviewCards, pickDueSession, pruneCards, saveReviewCard } from '@/lib/practice/cards'

beforeEach(() => {
  window.localStorage.clear()
})

describe('fsrs wrapper (long-term mode)', () => {
  it('a new card is due immediately and schedules days ahead after Good', () => {
    const now = new Date('2026-01-01T09:00:00Z')
    const card = newCard('course::q1', 'course', '01-lesson', now)
    expect(isDue(card, now)).toBe(true)

    const { next } = reviewCard(card, true, now)
    const days = (new Date(next.due).getTime() - now.getTime()) / 86400000
    expect(days).toBeGreaterThanOrEqual(1)
    expect(days).toBeLessThanOrEqual(180)
    expect(next.reps).toBe(1)
  })

  it('Again schedules sooner than Good', () => {
    const now = new Date('2026-01-01T09:00:00Z')
    const card = newCard('course::q2', 'course', '01-lesson', now)
    const good = reviewCard(card, true, now).next
    const again = reviewCard(card, false, now).next
    expect(new Date(again.due).getTime()).toBeLessThan(new Date(good.due).getTime())
  })

  it('caps intervals near 180 days (maximum_interval plus fuzz) across successful reviews', () => {
    let card = newCard('course::q3', 'course', '01-lesson', new Date('2026-01-01T09:00:00Z'))
    let now = new Date('2026-01-01T09:00:00Z')
    for (let i = 0; i < 8; i++) {
      const { next } = reviewCard(card, true, now)
      const days = (new Date(next.due).getTime() - now.getTime()) / 86400000
      // maximum_interval is 180; fuzz may add up to 5%.
      expect(days).toBeLessThanOrEqual(190)
      card = next
      now = new Date(next.due)
    }
  })
})

describe('card store', () => {
  it('persists and returns saved cards', () => {
    const card = newCard('store-k', 'course', '01-lesson', new Date('2026-01-01T09:00:00Z'))
    saveReviewCard(card)
    expect(getReviewCards()['store-k'].key).toBe('store-k')
  })

  it('returns only due cards and caps the session', () => {
    const past = new Date('2026-01-01T09:00:00Z')
    const future = new Date('2099-01-01T09:00:00Z')
    saveReviewCard(newCard('due-1', 'course', '01', past))
    saveReviewCard({ ...newCard('future-1', 'course', '01', past), due: future.toISOString() })
    expect(getDueCards(past).map((c) => c.key)).not.toContain('future-1')
    expect(pickDueSession(1, past)).toHaveLength(1)
  })

  it('evicts the oldest-reviewed card when the cap is exceeded', () => {
    const map = {
      old: { ...newCard('old', 'course', '01', new Date('2026-01-01T09:00:00Z')), lastReview: '2026-01-01T00:00:00.000Z' },
      newer: { ...newCard('newer', 'course', '01', new Date('2026-01-01T09:00:00Z')), lastReview: '2026-02-01T00:00:00.000Z' },
      newest: { ...newCard('newest', 'course', '01', new Date('2026-01-01T09:00:00Z')), lastReview: '2026-03-01T00:00:00.000Z' },
    }
    const pruned = pruneCards(map, 2)
    expect(Object.keys(pruned)).toEqual(['newer', 'newest'])
  })
})
