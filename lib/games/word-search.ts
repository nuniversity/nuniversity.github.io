/**
 * Pure logic for the Word Search game, extracted from the client component so
 * it can be unit-tested (placement failure, generation bounds, selection
 * validation) without rendering React.
 */

export interface Position {
  row: number
  col: number
}

export interface WordPlacement {
  word: string
  start: Position
  end: Position
  found: boolean
}

export const DIRS = [
  { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
  { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
  { dr: 1, dc: 1 }, { dr: -1, dc: -1 },
  { dr: 1, dc: -1 }, { dr: -1, dc: 1 },
] as const

export const GRID_SIZE = 12
/** The longer a word, and the fuller the grid gets, the more retries it needs. */
const BASE_ATTEMPTS = 200

/**
 * Places every word that fits; words that cannot be placed after exhaustive
 * retries are reported in `skipped` instead of silently vanishing.
 *
 * The previous implementation dropped failed words silently, while the
 * completion gate compared `found.length === words.length` — a single
 * unplaceable word made the game unwinnable. Callers must treat
 * `placements.length` as the authoritative word count.
 */
export function buildWordSearch(
  words: string[],
  size: number = GRID_SIZE
): { grid: string[][]; placements: WordPlacement[]; skipped: string[] } {
  const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(''))
  const placements: WordPlacement[] = []
  const skipped: string[] = []

  for (const rawWord of words) {
    const word = rawWord.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    // Degenerate words (empty after normalisation) can never be placed.
    if (word.length < 2) {
      if (rawWord.trim().length > 0) skipped.push(rawWord)
      continue
    }
    if (word.length > size) {
      skipped.push(rawWord)
      continue
    }

    // Stochastic placement with a deterministic fallback: sweep the whole
    // placement space once before giving up, so completion never depends on
    // luck (the bricking bug).
    let placed = false
    const maxAttempts = BASE_ATTEMPTS + word.length * 40
    for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
      const dir = DIRS[Math.floor(Math.random() * DIRS.length)]
      const row = Math.floor(Math.random() * size)
      const col = Math.floor(Math.random() * size)
      if (tryPlace(grid, size, word, dir, row, col, placements)) placed = true
    }

    if (!placed) {
      // Exhaustive deterministic sweep: first fit wins, anyhow of direction
      // preference. Ordered sweep over every direction and origin keeps the
      // game finishable even in the pathological case.
      outer: for (const dir of DIRS) {
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (tryPlace(grid, size, word, dir, row, col, placements)) {
              placed = true
              break outer
            }
          }
        }
      }
    }
    if (!placed) skipped.push(rawWord)
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
      }
    }
  }

  return { grid, placements, skipped }
}

function tryPlace(
  grid: string[][],
  size: number,
  word: string,
  dir: { dr: number; dc: number },
  row: number,
  col: number,
  placements: WordPlacement[]
): boolean {
  const endRow = row + dir.dr * (word.length - 1)
  const endCol = col + dir.dc * (word.length - 1)

  if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) return false

  for (let i = 0; i < word.length; i++) {
    const r = row + dir.dr * i
    const c = col + dir.dc * i
    if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false
  }

  for (let i = 0; i < word.length; i++) {
    const r = row + dir.dr * i
    const c = col + dir.dc * i
    grid[r][c] = word[i]
  }
  placements.push({
    word,
    start: { row, col },
    end: { row: endRow, col: endCol },
    found: false,
  })
  return true
}

/**
 * Computes the straight-line (horizontal / vertical / 45° diagonal) selection
 * from `start` to `end`, or `null` when the two cells cannot be joined.
 * Shared by the pointer, touch and keyboard input paths so the rules cannot
 * drift apart.
 */
export function buildSelection(start: Position, end: Position): Position[] | null {
  const dr = end.row - start.row
  const dc = end.col - start.col

  if (dr === 0 && dc === 0) return [start]

  // Only the 8 compass directions are valid word paths — exactly one of the
  // following: same row, same column, or a perfect 45° diagonal.
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null

  const gdr = dr === 0 ? 0 : dr > 0 ? 1 : -1
  const gdc = dc === 0 ? 0 : dc > 0 ? 1 : -1
  const steps = Math.max(Math.abs(dr), Math.abs(dc))

  const cells: Position[] = []
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + gdr * i, col: start.col + gdc * i })
  }
  return cells
}

/**
 * Matches a guessed path against the placements. Conventionally, any selection
 * that happens to spell a hidden word forward or backward counts; it never
 * matches an already-found placement twice.
 */
export function findPlacedWord(
  placements: WordPlacement[],
  cells: Position[] | null,
  grid: string[][]
): WordPlacement | null {
  if (!cells || cells.length < 2) return null
  const word = cells.map((c) => grid[c.row]?.[c.col] ?? '').join('')
  if (!word) return null
  const reversed = word.split('').reverse().join('')

  for (const placement of placements) {
    if (placement.found) continue
    if (placement.word === word || placement.word === reversed) return placement
  }
  return null
}
