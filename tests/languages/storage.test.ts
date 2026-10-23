import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearMatchingBest,
  getFlashcardProgress,
  getMatchingBest,
  langBestKey,
  langProgressKey,
  legacyFlashcardKey,
  recordMatchingBest,
  setFlashcardProgress,
  type FlashcardProgressMap,
  type MatchingResult,
} from '@/lib/languages/storage'

const pair = 'en-pt'
const slug = 'en-to-pt'

function sampleProgress(): FlashcardProgressMap {
  return {
    'hello-ola': { streak: 2, totalReviews: 5, lastReviewed: 1700000000000 },
    'world-mundo': { streak: 3, totalReviews: 8, lastReviewed: 1700000001000 },
  }
}

function result(overrides: Partial<MatchingResult> = {}): MatchingResult {
  return { score: 70, accuracy: 88, elapsedMs: 42000, numPairs: 8, ...overrides }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('language storage keys', () => {
  it('uses versioned key names for progress and best score', () => {
    expect(langProgressKey(pair, slug)).toBe('v1:lang-progress-en-pt-en-to-pt')
    expect(langBestKey(pair, slug)).toBe('v1:lang-best-en-pt-en-to-pt')
    expect(legacyFlashcardKey('en-to-pt')).toBe('flashcard_progress_en-to-pt')
  })
})

describe('flashcard progress', () => {
  it('round-trips a progress map', () => {
    setFlashcardProgress(pair, slug, sampleProgress())
    const loaded = getFlashcardProgress(pair, slug)
    expect(loaded.progress).toEqual(sampleProgress())
    expect(loaded.migrated).toBe(false)
  })

  it('returns an empty map when nothing is stored', () => {
    const loaded = getFlashcardProgress(pair, slug)
    expect(loaded).toEqual({ progress: {}, migrated: false })
  })

  it('keeps progress separate per pair and slug', () => {
    setFlashcardProgress(pair, slug, sampleProgress())
    expect(getFlashcardProgress(pair, 'en-to-pt-advanced').progress).toEqual({})
    expect(getFlashcardProgress('es-en', slug).progress).toEqual({})
  })

  it('dual-reads legacy flashcard keys without writing back', () => {
    window.localStorage.setItem(legacyFlashcardKey(slug), JSON.stringify(sampleProgress()))
    const loaded = getFlashcardProgress(pair, slug, slug)
    expect(loaded.progress).toEqual(sampleProgress())
    expect(loaded.migrated).toBe(false)
    expect(window.localStorage.getItem(langProgressKey(pair, slug))).toBeNull()
    expect(window.localStorage.getItem(legacyFlashcardKey(slug))).not.toBeNull()
  })

  it('migrates the old ease/repetitions format from a legacy key', () => {
    window.localStorage.setItem(
      legacyFlashcardKey(slug),
      JSON.stringify({
        'hello-ola': { ease: 2.5, repetitions: 4, lastReviewed: 1690000000000 },
        'slow-word': { repetitions: 1, nextReview: 1690000005000 },
        'never-seen': { repetitions: 0 },
        junk: 42,
      })
    )
    const loaded = getFlashcardProgress(pair, slug, slug)
    expect(loaded.migrated).toBe(true)
    expect(loaded.progress['hello-ola']).toEqual({
      streak: 3,
      totalReviews: 4,
      lastReviewed: 1690000000000,
    })
    expect(loaded.progress['slow-word']).toEqual({
      streak: 1,
      totalReviews: 1,
      lastReviewed: 1690000005000,
    })
    expect(loaded.progress['never-seen']).toEqual({
      streak: 0,
      totalReviews: 0,
      lastReviewed: expect.any(Number),
    })
    expect(loaded.progress.junk).toBeUndefined()
  })

  it('prefers the current key over the legacy fallback', () => {
    setFlashcardProgress(pair, slug, sampleProgress())
    window.localStorage.setItem(
      legacyFlashcardKey(slug),
      JSON.stringify({ 'old-word': { streak: 1, totalReviews: 1, lastReviewed: 1 } })
    )
    const loaded = getFlashcardProgress(pair, slug, slug)
    expect(loaded.progress).toEqual(sampleProgress())
  })

  it('survives corrupt JSON in both keys', () => {
    window.localStorage.setItem(langProgressKey(pair, slug), '{not json')
    window.localStorage.setItem(legacyFlashcardKey(slug), 'also not json')
    const loaded = getFlashcardProgress(pair, slug, slug)
    expect(loaded).toEqual({ progress: {}, migrated: false })
  })

  it('ignores arrays and non-object payloads', () => {
    window.localStorage.setItem(langProgressKey(pair, slug), '[]')
    expect(getFlashcardProgress(pair, slug).progress).toEqual({})
    window.localStorage.setItem(langProgressKey(pair, slug), '"string"')
    expect(getFlashcardProgress(pair, slug).progress).toEqual({})
  })
})

describe('matching best score', () => {
  it('stores the first completed run as best', () => {
    const best = recordMatchingBest(pair, slug, result())
    expect(best.score).toBe(70)
    expect(getMatchingBest(pair, slug)?.accuracy).toBe(88)
  })

  it('replaces the best on strictly higher accuracy', () => {
    recordMatchingBest(pair, slug, result({ score: 60, accuracy: 75, elapsedMs: 20000 }))
    recordMatchingBest(pair, slug, result({ score: 70, accuracy: 88, elapsedMs: 42000 }))
    const best = getMatchingBest(pair, slug)
    expect(best?.accuracy).toBe(88)
    expect(best?.score).toBe(70)
  })

  it('keeps the faster run on an accuracy tie', () => {
    recordMatchingBest(pair, slug, result({ elapsedMs: 42000 }))
    recordMatchingBest(pair, slug, result({ elapsedMs: 30000 }))
    expect(getMatchingBest(pair, slug)?.elapsedMs).toBe(30000)
  })

  it('ignores a slower run on an accuracy tie', () => {
    recordMatchingBest(pair, slug, result({ elapsedMs: 30000 }))
    recordMatchingBest(pair, slug, result({ elapsedMs: 50000 }))
    expect(getMatchingBest(pair, slug)?.elapsedMs).toBe(30000)
  })

  it('ignores a lower accuracy run even with a better time', () => {
    recordMatchingBest(pair, slug, result({ accuracy: 88, elapsedMs: 42000 }))
    recordMatchingBest(pair, slug, result({ accuracy: 70, elapsedMs: 10000 }))
    const best = getMatchingBest(pair, slug)
    expect(best?.accuracy).toBe(88)
    expect(best?.elapsedMs).toBe(42000)
  })

  it('returns null when absent or corrupt', () => {
    expect(getMatchingBest(pair, slug)).toBeNull()
    window.localStorage.setItem(langBestKey(pair, slug), '[]')
    expect(getMatchingBest(pair, slug)).toBeNull()
    window.localStorage.setItem(langBestKey(pair, slug), JSON.stringify({ score: 'bad' }))
    expect(getMatchingBest(pair, slug)).toBeNull()
  })

  it('keeps best scores separate per activity', () => {
    recordMatchingBest(pair, slug, result())
    expect(getMatchingBest(pair, 'en-to-pt-advanced')).toBeNull()
    expect(getMatchingBest('es-en', slug)).toBeNull()
  })

  it('clears only the requested best score', () => {
    recordMatchingBest(pair, slug, result())
    recordMatchingBest(pair, 'en-to-pt-advanced', result())
    clearMatchingBest(pair, slug)
    expect(getMatchingBest(pair, slug)).toBeNull()
    expect(getMatchingBest(pair, 'en-to-pt-advanced')).not.toBeNull()
  })
})
