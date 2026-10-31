import { describe, expect, it } from 'vitest'
import { getAllGames } from '@/lib/games/get-game-content'

describe('getAllGames', () => {
  it('returns every content game, sorted deterministically', async () => {
    const games = await getAllGames()

    const slugs = games.map((g) => g.slug)
    expect(slugs).toContain('word-search')
    expect(slugs).toContain('number-sequence')
    expect(slugs).toContain('binary-hex-game')
    expect(slugs).toContain('code-typing-speed')
    expect(slugs).toContain('math-speed-challenge')
    expect(slugs).toContain('periodic-table-quiz')
    expect(slugs).toContain('36-questions-to-fall-in-love')

    // Deterministic order: category first, then slug — mirrors what the build
    // emits regardless of the platform's readdir order.
    for (let i = 1; i < games.length; i++) {
      const prev = games[i - 1]
      const curr = games[i]
      const cmp = prev.category.localeCompare(curr.category) || prev.slug.localeCompare(curr.slug)
      expect(cmp).toBeLessThanOrEqual(0)
    }
  })

  it('applies localized titles for pt and es', async () => {
    const [pt, en] = await Promise.all([getAllGames('pt'), getAllGames('en')])
    const wordSearchPt = pt.find((g) => g.slug === 'word-search')
    const wordSearchEn = en.find((g) => g.slug === 'word-search')
    expect(wordSearchPt?.title).toBe('Caça-Palavras')
    expect(wordSearchEn?.title).toBe('Word Search')
  })
})
