import { describe, expect, it } from 'vitest'
import {
  buildWordSearch,
  buildSelection,
  findPlacedWord,
  GRID_SIZE,
} from '@/lib/games/word-search'

describe('buildWordSearch', () => {
  it('places all reasonably-sized words and fills the grid', () => {
    const words = ['ARRAY', 'BINARY', 'CACHE', 'CLASS', 'DEBUG', 'QUEUE', 'STACK', 'LOOP', 'SORT', 'TREE']
    const { grid, placements, skipped } = buildWordSearch(words)

    expect(skipped).toEqual([])
    expect(placements.map((p) => p.word).sort()).toEqual([...words].sort())
    // Grid fully filled with uppercase letters.
    for (const row of grid) {
      expect(row).toHaveLength(GRID_SIZE)
      for (const char of row) {
        expect(char).toMatch(/^[A-Z]$/)
      }
    }
  })

  it('never bricks the game: every valid word is placed even with many long words', () => {
    // This comment reproduces the original bug report: the stochastic placement
    // silently dropped words while the completion gate assumed all words placed.
    const words = ['MOUNTAIN', 'GLACIER', 'PLATEAU', 'DESERT', 'FOREST', 'ISLAND', 'VALLEY', 'OCEAN', 'RIVER', 'CANAL']
    for (let round = 0; round < 5; round++) {
      const { placements, skipped } = buildWordSearch(words)
      expect(skipped).toEqual([])
      expect(placements).toHaveLength(words.length)
    }
  })

  it('skips words longer than the grid instead of bricking completion', () => {
    const { placements, skipped } = buildWordSearch(['SUPERCALIFRAGILISTIC', 'BUG'])
    expect(skipped).toEqual(['SUPERCALIFRAGILISTIC'])
    // BUG was not passed (below the 2-letter minimum? 3 letters — it is placed).
    expect(placements.map((p) => p.word)).toContain('BUG')
  })

  it('skips words that would not fit in the grid dimension', () => {
    const tiny = buildWordSearch(['ABCDEFGHIJKLM'], 12)
    expect(tiny.skipped).toEqual(['ABCDEFGHIJKLM'])
  })

  it('each placement matches the letters actually written into the grid', () => {
    const { grid, placements } = buildWordSearch(['QUICKSORT', 'HEAP'])
    for (const placement of placements) {
      const dr = Math.sign(placement.end.row - placement.start.row)
      const dc = Math.sign(placement.end.col - placement.start.col)
      const steps = Math.max(
        Math.abs(placement.end.row - placement.start.row),
        Math.abs(placement.end.col - placement.start.col)
      )
      let spelled = ''
      for (let i = 0; i <= steps; i++) {
        spelled += grid[placement.start.row + dr * i][placement.start.col + dc * i]
      }
      expect(spelled).toBe(placement.word)
    }
  })
})

describe('buildSelection', () => {
  it('builds a horizontal, vertical and diagonal selection', () => {
    expect(buildSelection({ row: 0, col: 0 }, { row: 0, col: 3 })).toEqual([
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
    ])
    expect(buildSelection({ row: 4, col: 4 }, { row: 1, col: 4 })).toEqual([
      { row: 4, col: 4 }, { row: 3, col: 4 }, { row: 2, col: 4 }, { row: 1, col: 4 },
    ])
    expect(buildSelection({ row: 2, col: 2 }, { row: 5, col: 5 })).toEqual([
      { row: 2, col: 2 }, { row: 3, col: 3 }, { row: 4, col: 4 }, { row: 5, col: 5 },
    ])
  })

  it('returns null for non-linear paths (the L-shape bug)', () => {
    expect(buildSelection({ row: 0, col: 0 }, { row: 1, col: 2 })).toBeNull()
    expect(buildSelection({ row: 0, col: 0 }, { row: 2, col: 1 })).toBeNull()
  })

  it('returns a single cell for the anchor only', () => {
    expect(buildSelection({ row: 3, col: 3 }, { row: 3, col: 3 })).toEqual([{ row: 3, col: 3 }])
  })
})

describe('findPlacedWord', () => {
  const grid = [
    ['C', 'A', 'T'],
    ['X', 'X', 'X'],
    ['X', 'X', 'X'],
  ]
  const placements = [
    { word: 'CAT', start: { row: 0, col: 0 }, end: { row: 0, col: 2 }, found: false },
  ]

  it('matches forward', () => {
    expect(findPlacedWord(placements, [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], grid)?.word).toBe('CAT')
  })

  it('matches reversed', () => {
    expect(findPlacedWord(placements, [{ row: 0, col: 2 }, { row: 0, col: 1 }, { row: 0, col: 0 }], grid)?.word).toBe('CAT')
  })

  it('returns null for selections shorter than two letters', () => {
    expect(findPlacedWord(placements, [{ row: 0, col: 0 }], grid)).toBeNull()
    expect(findPlacedWord(placements, null, grid)).toBeNull()
  })

  it('never matches an already-found placement twice', () => {
    const found = [{ ...placements[0], found: true }]
    expect(findPlacedWord(found, [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], grid)).toBeNull()
  })

  it('returns null when the selection spells filler letters', () => {
    expect(findPlacedWord(placements, [{ row: 1, col: 0 }, { row: 1, col: 1 }], grid)).toBeNull()
  })
})
