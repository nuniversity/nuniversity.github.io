import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  dueVocabCards,
  dueVocabCount,
  getVocabCards,
  isVocabCard,
  parseVocabCardKey,
  scheduleVocab,
  seedFromLegacyBuckets,
} from '@/lib/language-courses/schedule'
import { getReviewCards } from '@/lib/practice/cards'
import { setFlashcardProgress } from '@/lib/languages/storage'

const PAST = new Date('2026-01-01T10:00:00Z')
const NOW = new Date('2026-01-10T10:00:00Z')

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('parseVocabCardKey', () => {
  it('parses lang keys and rejects foreign keys', () => {
    expect(parseVocabCardKey('lang::pt-en::w001')).toEqual({ pair: 'pt-en', vocabId: 'w001' })
    expect(parseVocabCardKey('some-course::question-1')).toBeNull()
    expect(parseVocabCardKey('lang')).toBeNull()
  })

  it('isVocabCard filters mixed card maps', () => {
    expect(isVocabCard({ key: 'lang::pt-en::w001', due: '' } as any)).toBe(true)
    expect(isVocabCard({ key: 'course::q1', due: '' } as any)).toBe(false)
  })
})

describe('scheduleVocab', () => {
  it('creates a card on the first answer and advances on correct recalls', () => {
    const first = scheduleVocab('pt-en', 'w001', 'english-for-pt', true, PAST)
    expect(first.created).toBe(true)
    expect(first.card.key).toBe('lang::pt-en::w001')
    expect(first.card.reps).toBe(1)

    const second = scheduleVocab('pt-en', 'w001', 'english-for-pt', true, NOW)
    expect(second.created).toBe(false)
    expect(second.card.reps).toBe(2)
    expect(new Date(second.card.due).getTime()).toBeGreaterThan(NOW.getTime())
  })

  it('an incorrect answer lapses the card back into the near-term queue', () => {
    scheduleVocab('pt-en', 'w002', 'english-for-pt', true, PAST)
    const after = scheduleVocab('pt-en', 'w002', 'english-for-pt', false, NOW)
    expect(after.card.lapses).toBe(1)
  })

  it('dueVocabCount reflects only due cards', () => {
    scheduleVocab('pt-en', 'w003', 'english-for-pt', true, PAST)
    // A card answered now is scheduled days ahead, so nothing is due yet.
    scheduleVocab('pt-en', 'w004', 'english-for-pt', true, NOW)
    const due = dueVocabCards('pt-en', NOW)
    expect(due.some((card) => card.key === 'lang::pt-en::w003')).toBe(true)
    expect(due.some((card) => card.key === 'lang::pt-en::w004')).toBe(false)
    expect(dueVocabCount('pt-en', NOW)).toBeGreaterThanOrEqual(1)
    expect(getVocabCards('other-pair', ).length ?? 0).toBe(0)
  })
})

describe('seedFromLegacyBuckets', () => {
  it('seeds learned cards from legacy streak buckets exactly once', () => {
    setFlashcardProgress('pt-en', 'deck-1', {
      w010: { streak: 3, totalReviews: 5, lastReviewed: 1 },
      w011: { streak: 1, totalReviews: 1, lastReviewed: 1 },
    })
    const seeded = seedFromLegacyBuckets('pt-en', 'english-for-pt', 'deck-1', ['w010', 'w011'], NOW)
    expect(seeded).toBe(1)
    const cards = getReviewCards()
    expect(cards['lang::pt-en::w010']).toBeDefined()
    expect(cards['lang::pt-en::w010'].reps).toBe(3)
    expect(new Date(cards['lang::pt-en::w010'].due).getTime()).toBeGreaterThan(NOW.getTime())
    expect(cards['lang::pt-en::w011']).toBeUndefined()

    // Idempotent: second run seeds nothing.
    expect(seedFromLegacyBuckets('pt-en', 'english-for-pt', 'deck-1', ['w010', 'w011'], NOW)).toBe(0)
  })
})
