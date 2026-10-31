'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Trophy, RotateCcw, ArrowLeft, Search, Clock, Keyboard } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from '@/components/navigation/AppLink'
import {
  buildWordSearch,
  buildSelection,
  findPlacedWord,
  GRID_SIZE,
  type Position,
  type WordPlacement,
} from '@/lib/games/word-search'
import { tpl } from '@/lib/games/tpl'
import { getGameBest, saveGameBestLowIfNew, GAME_ID } from '@/lib/games/storage'

interface WordSearchGameData {
  title: string
  description: string
  categories?: Record<string, string[]>
  locales?: {
    [locale: string]: {
      title?: string
      description?: string
      category_labels?: Record<string, string>
    }
  }
}

interface WordSearchClientProps {
  lang: Locale
  game: WordSearchGameData
  dict: any
}

type GameMode = 'config' | 'playing' | 'complete'

export function WordSearchClient({ lang, game, dict }: WordSearchClientProps) {
  const [category, setCategory] = useState('programming')
  const [gameMode, setGameMode] = useState<GameMode>('config')
  const [grid, setGrid] = useState<string[][]>([])
  const [placements, setPlacements] = useState<WordPlacement[]>([])
  const [skippedCount, setSkippedCount] = useState(0)
  const [selectedCells, setSelectedCells] = useState<Position[]>([])
  const [startPos, setStartPos] = useState<Position | null>(null)
  const [cursor, setCursor] = useState<Position | null>(null)
  const [anchor, setAnchor] = useState<Position | null>(null)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [bestTime, setBestTime] = useState<number | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)

  const g = dict?.games ?? {}
  const ws = g?.word_search ?? {}

  const categoryLabel = (cat: string) => game.locales?.[lang]?.category_labels?.[cat] || cat

  // Load the best time for the initially selected category.
  useEffect(() => {
    setBestTime(getGameBest(GAME_ID.wordSearch, `best-time-${category}`))
  }, [gameMode, category])

  // Explicitly pass the category: the previous `startGame()` closed over the
  // *previous* category state and built the grid from the wrong word list.
  const startGame = useCallback((cat: string) => {
    const words = game.categories?.[cat] || []
    if (words.length === 0) return
    const { grid: newGrid, placements: newPlacements, skipped } = buildWordSearch(words, GRID_SIZE)
    setCategory(cat)
    setGrid(newGrid)
    // The placed placements are the authoritative word list: a word that the
    // physics of the grid could not fit is reported as skipped (the old code
    // silently dropped it while still gating completion on words.length,
    // which made the game unwinnable).
    setPlacements(newPlacements)
    setSkippedCount(skipped.length)
    setSelectedCells([])
    setStartPos(null)
    setCursor(null)
    setAnchor(null)
    setScore(0)
    setStartTime(Date.now())
    setElapsedTime(0)
    setGameMode('playing')
  }, [game.categories])

  useEffect(() => {
    if (gameMode === 'playing' && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameMode, startTime])

  const markFound = useCallback((placement: WordPlacement) => {
    setPlacements((prev) => prev.map((p) => (p.word === placement.word ? { ...p, found: true } : p)))
    setScore((prev) => prev + 10)
  }, [])

  const finishSelection = useCallback(() => {
    const selection = selectedCells
    isSelectingRef.current = false
    setStartPos(null)
    setAnchor(null)
    setSelectedCells([])
    const found = findPlacedWord(placements, selection.length >= 2 ? selection : null, grid)
    if (found) markFound(found)
    // Malformed or unmatched attempts are simply cleared (traditional word
    // search behaviour); the selection highlight must not linger.
  }, [selectedCells, placements, grid, markFound])

  // Pointer input — one code path for mouse and touch. Implicit pointer capture
  // on touch devices means per-cell mouseenter events never fire while dragging
  // with a finger, so movement is resolved from the coordinates instead.
  const cellFromPoint = (clientX: number, clientY: number): Position | null => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    const cell = el?.closest('[data-row][data-col]') as HTMLElement | null
    if (!cell || !gridRef.current?.contains(cell)) return null
    const row = Number(cell.dataset.row)
    const col = Number(cell.dataset.col)
    if (!Number.isInteger(row) || !Number.isInteger(col)) return null
    return { row, col }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const cell = cellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    e.preventDefault()
    isSelectingRef.current = true
    setStartPos(cell)
    setCursor(cell)
    setAnchor(null)
    setSelectedCells([cell])
    try { gridRef.current?.setPointerCapture(e.pointerId) } catch { /* jsdom / older browsers */ }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSelectingRef.current || !startPos) return
    const cell = cellFromPoint(e.clientX, e.clientY)
    if (!cell) return
    // Off-diagonal drags snap to the nearest valid direction rather than
    // visually erasing the selection mid-drag (the old onMouseLeave bug).
    const selection = buildSelection(startPos, cell)
    setCursor(cell)
    setSelectedCells(selection ?? [startPos])
  }

  const handlePointerUp = () => {
    if (!isSelectingRef.current) return
    finishSelection()
  }

  // Keyboard input — the grid is a single tab stop; arrows drive a virtual
  // cursor so the whole grid is playable without a mouse or touch screen.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameMode !== 'playing') return
    const delta: Record<string, Position> = {
      ArrowUp: { row: -1, col: 0 },
      ArrowDown: { row: 1, col: 0 },
      ArrowLeft: { row: 0, col: -1 },
      ArrowRight: { row: 0, col: 1 },
    }
    const move = delta[e.key]
    if (move) {
      e.preventDefault()
      const next: Position = cursor
        ? { row: cursor.row + move.row, col: cursor.col + move.col }
        : { row: Math.floor(GRID_SIZE / 2), col: Math.floor(GRID_SIZE / 2) }
      next.row = Math.min(GRID_SIZE - 1, Math.max(0, next.row))
      next.col = Math.min(GRID_SIZE - 1, Math.max(0, next.col))
      setCursor(next)
      if (anchor) setSelectedCells(buildSelection(anchor, next) ?? [anchor])
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!cursor) {
        setCursor({ row: Math.floor(GRID_SIZE / 2), col: Math.floor(GRID_SIZE / 2) })
        return
      }
      if (!anchor) {
        setAnchor(cursor)
        setSelectedCells([cursor])
      } else {
        // Second Enter validates the anchored selection.
        const selection = buildSelection(anchor, cursor)
        if (selection && selection.length >= 2) {
          setSelectedCells(selection)
          // findPlacedWord reads the current state snapshot.
          const found = findPlacedWord(placements, selection, grid)
          if (found) markFound(found)
          setAnchor(null)
          setSelectedCells([])
        } else {
          setAnchor(null)
          setSelectedCells([])
        }
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setAnchor(null)
      setSelectedCells([])
    }
  }

  const foundCount = useMemo(() => placements.filter((p) => p.found).length, [placements])
  const totalCount = placements.length

  useEffect(() => {
    if (gameMode === 'playing' && totalCount > 0 && foundCount === totalCount) {
      setGameMode('complete')
      if (saveGameBestLowIfNew(GAME_ID.wordSearch, `best-time-${category}`, elapsedTime)) {
        setBestTime(elapsedTime)
      }
    }
  }, [gameMode, totalCount, foundCount, elapsedTime, category])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  const selectedSet = useMemo(() => {
    const set = new Set<string>()
    for (const c of selectedCells) set.add(`${c.row}-${c.col}`)
    return set
  }, [selectedCells])

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {g.back_to_games || 'Back to Games'}
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
            <h2 className="text-2xl font-semibold mb-6">{ws.choose_category || 'Choose a Category'}</h2>
            <div className="space-y-3">
              {Object.keys(game.categories ?? {}).map((cat) => (
                <button
                  key={cat}
                  onClick={() => startGame(cat)}
                  className="w-full p-4 rounded-xl text-left font-medium transition-all bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <div className="text-lg">{categoryLabel(cat)}</div>
                  <div className="text-sm opacity-70">{tpl(ws.words_count || '{n} words', { n: game.categories?.[cat]?.length ?? 0 })}</div>
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
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Search className="w-3 h-3" /> {g.stats?.found || 'Found'}</div>
                <div className="text-xl font-bold">{foundCount}/{totalCount}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" /> {g.stats?.time || 'Time'}</div>
                <div className="text-xl font-bold">{formatTime(elapsedTime)}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Trophy className="w-3 h-3" /> {g.stats?.score || 'Score'}</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
            </div>

            {/* Word List */}
            <div className="flex flex-wrap gap-2 mb-4" aria-live="polite">
              {placements.map((p) => (
                <span key={p.word} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${p.found ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 line-through' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  {p.word}
                </span>
              ))}
              {skippedCount > 0 && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-400 line-through">
                  {tpl(ws.skipped_n || '{n} skipped', { n: skippedCount })}
                </span>
              )}
            </div>

            {/* Grid */}
            <div className="bg-card border rounded-2xl p-2 sm:p-4 overflow-x-auto">
              <div
                ref={gridRef}
                role="grid"
                aria-label={game.title}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="grid gap-0.5 w-full max-w-2xl mx-auto select-none touch-none focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
              >
                {grid.map((row, r) =>
                  row.map((char, c) => {
                    const isSelected = selectedSet.has(`${r}-${c}`)
                    const isFound = placements.some((p) => p.found && isOnPath(p, r, c))
                    const isCursor = cursor !== null && cursor.row === r && cursor.col === c
                    const isAnchor = anchor !== null && anchor.row === r && anchor.col === c
                    return (
                      <div
                        key={`${r}-${c}`}
                        data-row={r}
                        data-col={c}
                        role="gridcell"
                        aria-label={`${tpl(ws.cell_label || 'Row {row}, column {col}', { row: r + 1, col: c + 1 })}: ${char}`}
                        className={`
                          aspect-square flex items-center justify-center
                          text-xs sm:text-sm md:text-base font-bold rounded cursor-pointer select-none
                          transition-all duration-150
                          ${isFound ? 'bg-green-200 dark:bg-green-800/40 text-green-800 dark:text-green-200' :
                            isSelected ? 'bg-blue-500 text-white scale-110 z-10 shadow-md' :
                            isCursor || isAnchor ? 'ring-2 ring-primary bg-primary/10' :
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

            <div className="mt-4 text-xs text-muted-foreground text-center flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Keyboard className="w-3 h-3" />
                {ws.keyboard_hint || 'Keyboard: arrow keys to move, Enter to anchor and check, Escape to clear.'}
              </span>
              <span>{ws.drag_hint || "Drag across the grid to select letters — mouse, touch and keyboard all work."}</span>
            </div>

            <button
              onClick={() => startGame(category)}
              className="mt-4 mx-auto flex items-center gap-2 py-2 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> {g.restart || 'Restart'}
            </button>
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{ws.puzzle_complete || 'Puzzle Complete!'}</h2>
            <p className="text-muted-foreground mb-6">{tpl(ws.found_all || 'You found all {n} words!', { n: totalCount })}</p>
            <div className="text-2xl font-bold mb-6">{tpl(g.score_value || 'Score: {score}', { score })}</div>
            <div className="text-lg mb-2">{tpl(ws.time_with_n || 'Time: {time}', { time: formatTime(elapsedTime) })}</div>
            {bestTime !== null && (
              <div className="text-sm text-muted-foreground mb-6">{tpl(ws.best_time || 'Best Time: {time}', { time: formatTime(bestTime) })}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => startGame(category)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">{g.play_again || 'Play Again'}</button>
              <Link href={`/${lang}/games`} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors text-center">{g.more_games || 'More Games'}</Link>
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
