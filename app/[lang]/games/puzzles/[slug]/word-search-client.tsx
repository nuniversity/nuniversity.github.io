'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, Search, CheckCircle2, Clock, List } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from 'next/link'

interface GridCell {
  char: string
  row: number
  col: number
  selected: boolean
  found: boolean
  partOf: string | null
}

interface Position {
  row: number
  col: number
}

interface WordPlacement {
  word: string
  start: Position
  end: Position
  found: boolean
}

interface WordSearchClientProps {
  lang: Locale
  game: any
  dict: any
}

const DIRS = [
  { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
  { dr: 1, dc: 0 }, { dr: -1, dc: 0 },
  { dr: 1, dc: 1 }, { dr: -1, dc: -1 },
  { dr: 1, dc: -1 }, { dr: -1, dc: 1 },
]

const GRID_SIZE = 12

function buildGrid(words: string[]): { grid: string[][]; placements: WordPlacement[] } {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''))
  const placements: WordPlacement[] = []

  for (const word of words) {
    let placed = false
    const attempts = 0
    while (!placed && attempts < 200) {
      const dir = DIRS[Math.floor(Math.random() * DIRS.length)]
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)

      const endRow = row + dir.dr * (word.length - 1)
      const endCol = col + dir.dc * (word.length - 1)

      if (endRow < 0 || endRow >= GRID_SIZE || endCol < 0 || endCol >= GRID_SIZE) continue

      let canPlace = true
      for (let i = 0; i < word.length; i++) {
        const r = row + dir.dr * i
        const c = col + dir.dc * i
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
          canPlace = false
          break
        }
      }

      if (canPlace) {
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
        placed = true
      }
    }
  }

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
      }
    }
  }

  return { grid, placements }
}

export function WordSearchClient({ lang, game, dict }: WordSearchClientProps) {
  const [category, setCategory] = useState('programming')
  const [gameMode, setGameMode] = useState<'config' | 'playing' | 'complete'>('config')
  const [grid, setGrid] = useState<string[][]>([])
  const [placements, setPlacements] = useState<WordPlacement[]>([])
  const [selectedCells, setSelectedCells] = useState<Position[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [startPos, setStartPos] = useState<Position | null>(null)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isSelecting, setIsSelecting] = useState(false)

  const words = game.categories[category] || []

  const startGame = () => {
    const { grid: g, placements: p } = buildGrid(words)
    setGrid(g)
    setPlacements(p)
    setSelectedCells([])
    setFoundWords([])
    setScore(0)
    setStartTime(Date.now())
    setElapsedTime(0)
    setGameMode('playing')
  }

  useEffect(() => {
    if (gameMode === 'playing' && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameMode, startTime])

  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true)
    setStartPos({ row, col })
    setSelectedCells([{ row, col }])
  }

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !startPos) return

    const dr = row - startPos.row
    const dc = col - startPos.col

    if (dr === 0 && dc === 0) {
      setSelectedCells([startPos])
      return
    }

    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return
    if (dr !== 0 && dc === 0) {} // vertical
    else if (dr === 0 && dc !== 0) {} // horizontal
    else if (Math.abs(dr) === Math.abs(dc)) {} // diagonal
    else return

    const gdr = dr === 0 ? 0 : dr > 0 ? 1 : -1
    const gdc = dc === 0 ? 0 : dc > 0 ? 1 : -1
    const steps = Math.max(Math.abs(dr), Math.abs(dc))

    const cells: Position[] = []
    for (let i = 0; i <= steps; i++) {
      cells.push({ row: startPos.row + gdr * i, col: startPos.col + gdc * i })
    }
    setSelectedCells(cells)
  }

  const handleCellMouseUp = () => {
    setIsSelecting(false)
    if (selectedCells.length < 2) return

    const word = selectedCells.map(c => grid[c.row]?.[c.col] || '').join('')
    const reversed = word.split('').reverse().join('')

    for (const placement of placements) {
      if (placement.found) continue
      if (placement.word === word || placement.word === reversed) {
        setPlacements(prev => prev.map(p => p.word === placement.word ? { ...p, found: true } : p))
        setFoundWords(prev => [...prev, placement.word])
        setScore(prev => prev + 10)
        break
      }
    }

    setSelectedCells([])
    setStartPos(null)
  }

  useEffect(() => {
    if (gameMode === 'playing' && foundWords.length === words.length) {
      setGameMode('complete')
    }
  }, [foundWords.length, words.length, gameMode])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8 max-w-lg mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Choose a Category</h2>
            <div className="space-y-3">
              {Object.keys(game.categories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); startGame() }}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${category === cat ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <div className="capitalize text-lg">{cat}</div>
                  <div className="text-sm opacity-70">{game.categories[cat].length} words</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {gameMode === 'playing' && grid.length > 0 && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Search className="w-3 h-3" /> Found</div>
                <div className="text-xl font-bold">{foundWords.length}/{words.length}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" /> Time</div>
                <div className="text-xl font-bold">{formatTime(elapsedTime)}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Trophy className="w-3 h-3" /> Score</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
            </div>

            {/* Word List */}
            <div className="flex flex-wrap gap-2 mb-4">
              {placements.map(p => (
                <span key={p.word} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${p.found ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 line-through' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  {p.word}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div className="bg-card border rounded-2xl p-4 overflow-x-auto">
              <div
                className="grid gap-0.5 mx-auto select-none touch-none"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`, maxWidth: `${GRID_SIZE * 2.5}rem` }}
                onMouseLeave={() => { setIsSelecting(false); setSelectedCells([]) }}
              >
                {grid.map((row, r) =>
                  row.map((char, c) => {
                    const isSelected = selectedCells.some(s => s.row === r && s.col === c)
                    const isFound = placements.some(p => p.found && isOnPath(p, r, c))
                    return (
                      <div
                        key={`${r}-${c}`}
                        onMouseDown={() => handleCellMouseDown(r, c)}
                        onMouseEnter={() => handleCellMouseEnter(r, c)}
                        onMouseUp={handleCellMouseUp}
                        className={`
                          aspect-square flex items-center justify-center
                          text-sm font-bold rounded cursor-pointer select-none
                          transition-all duration-150
                          ${isFound ? 'bg-green-200 dark:bg-green-800/40 text-green-800 dark:text-green-200' :
                            isSelected ? 'bg-blue-500 text-white scale-110 z-10 shadow-md' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}
                        `}
                      >
                        {char}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center">
              Click and drag across the grid to select letters. Release to check if it&apos;s a word.
            </div>
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Puzzle Complete!</h2>
            <p className="text-muted-foreground mb-6">You found all {words.length} words!</p>
            <div className="text-2xl font-bold mb-6">Score: {score}</div>
            <div className="text-lg mb-6">Time: {formatTime(elapsedTime)}</div>
            <div className="flex gap-3">
              <button onClick={startGame} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">Play Again</button>
              <Link href={`/${lang}/games`} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors text-center">More Games</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function isOnPath(placement: WordPlacement, row: number, col: number): boolean {
  const { start, end } = placement
  const dr = end.row === start.row ? 0 : end.row > start.row ? 1 : -1
  const dc = end.col === start.col ? 0 : end.col > start.col ? 1 : -1
  const steps = Math.max(Math.abs(end.row - start.row), Math.abs(end.col - start.col))

  for (let i = 0; i <= steps; i++) {
    if (start.row + dr * i === row && start.col + dc * i === col) return true
  }
  return false
}
