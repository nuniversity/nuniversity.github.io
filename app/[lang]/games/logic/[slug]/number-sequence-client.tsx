'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, Brain, Eye, EyeOff } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from '@/components/navigation/AppLink'
import { tpl } from '@/lib/games/tpl'
import { useSafeTimeouts } from '@/lib/games/use-safe-timeouts'
import { getGameBest, saveGameBestIfNew, GAME_ID } from '@/lib/games/storage'

interface NumberSequenceClientProps {
  lang: Locale
  game: {
    title: string
    description: string
    startingLength?: number
    maxLength?: number
    displayTimeMs?: number
    maxDigits?: number
  }
  dict: any
}

export function NumberSequenceClient({ lang, game, dict }: NumberSequenceClientProps) {
  const [gameMode, setGameMode] = useState<'config' | 'memorize' | 'recall' | 'gameover'>('config')
  const [sequence, setSequence] = useState<number[]>([])
  const [displayIndex, setDisplayIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [level, setLevel] = useState(game.startingLength || 3)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [correctCount, setCorrectCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setSafeTimeout, clearSafeTimeout, clearAll } = useSafeTimeouts()

  // Honor the game JSON's maxLength cap: the previous implementation grew the
  // level unbounded because maxLength/maxDigits were never read.
  const maxLength = game.maxLength || 15
  const startingLength = game.startingLength || 3

  const g = dict?.games ?? {}
  const gn = g?.number_sequence ?? {}
  const instr = gn.instructions ?? [
    'Watch the sequence of numbers',
    'Remember the order!',
    'Type the sequence back correctly',
    'Each level adds one more digit',
    'You have {lives} lives, use them wisely!',
  ]

  useEffect(() => {
    // getGameBest transparently migrates the legacy `number_sequence_highscore`
    // key into the versioned `v1:game-best-*` namespace.
    const saved = getGameBest(GAME_ID.numberSequence, 'score')
    if (saved !== null) setHighScore(saved)
  }, [])

  const generateSequence = useCallback((length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1)
  }, [])

  const startLevel = useCallback((lvl: number) => {
    const seq = generateSequence(lvl)
    setSequence(seq)
    setDisplayIndex(0)
    setUserInput('')
    setGameMode('memorize')
  }, [generateSequence])

  const startGame = () => {
    clearAll()
    setLevel(startingLength)
    setScore(0)
    setLives(3)
    setCorrectCount(0)
    startLevel(startingLength)
  }

  // Show the sequence one digit at a time. Every timer lives in the shared
  // registry and is cleaned up when the effect that owns it re-runs: the
  // previously nested "done showing" callback (inside the outer timeout)
  // survived restarts and unmounts, throwing restarted games straight into
  // recall mode.
  useEffect(() => {
    if (gameMode !== 'memorize' || sequence.length === 0) return

    const displayTime = game.displayTimeMs || 1000
    let id: number | undefined
    if (displayIndex < sequence.length - 1) {
      id = setSafeTimeout(() => setDisplayIndex((prev) => prev + 1), displayTime)
    } else {
      // Done showing: reveal recall phase, then focus the input.
      id = setSafeTimeout(() => {
        setGameMode('recall')
        setSafeTimeout(() => inputRef.current?.focus(), 50)
      }, displayTime / 2)
    }
    return () => { if (id !== undefined) clearSafeTimeout(id) }
  }, [gameMode, sequence, displayIndex, game.displayTimeMs, setSafeTimeout, clearSafeTimeout])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!userInput.trim() || gameMode !== 'recall') return

    const userSeq = userInput.trim().split('').map(Number)
    const correct = sequence.join('')

    if (userSeq.join('') === correct) {
      setScore((prev) => prev + level * 10)
      setCorrectCount((prev) => prev + 1)
      // Cap growth at the configured maxLength so the digits never outgrow
      // the display or the game JSON's declared difficulty curve.
      const newLevel = Math.min(level + 1, maxLength)
      setLevel(newLevel)
      setSafeTimeout(() => startLevel(newLevel), 800)
    } else {
      const newLives = lives - 1
      setLives(newLives)
      setUserInput('')
      if (newLives <= 0) {
        // `highScore` was loaded from storage at mount and is fresh in this
        // render's closure; saving through the shared storage API (which
        // migrates and validates) replaces the old raw `safeSet('number_sequence_highscore')`.
        if (score > highScore) {
          setHighScore(score)
          saveGameBestIfNew(GAME_ID.numberSequence, 'score', score)
        }
        clearAll()
        setGameMode('gameover')
      } else {
        setSafeTimeout(() => startLevel(level), 1000)
      }
    }
  }

  const quitGame = () => {
    clearAll()
    setGameMode('config')
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-lg mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {g.back_to_games || 'Back to Games'}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-mark mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-soft to-cyan-100/60 dark:from-primary/15 dark:to-cyan-900/20 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">{g.how_to_play || 'How to Play'}</h2>
            <ul className="text-left space-y-2 mb-8 text-muted-foreground">
              {instr.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2"><span className="text-primary mt-1">•</span> {tpl(item, { lives })}</li>
              ))}
            </ul>
            {highScore > 0 && <p className="text-lg font-semibold mb-6">{tpl(g.high_score || '🏆 High Score: {score}', { score: highScore })}</p>}
            <button onClick={startGame} className="w-full py-4 rounded-xl bg-brand text-white text-lg font-bold hover:shadow-lg transition-all">
              {g.start_game || 'Start Game'}
            </button>
          </div>
        )}

        {(gameMode === 'memorize' || gameMode === 'recall') && (
          <div>
            {/* Stats */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1" aria-label={`${lives} lives`}>
                {Array.from({ length: lives }).map((_, i) => (
                  <span key={i} className="text-2xl" role="img" aria-hidden="true">❤️</span>
                ))}
                {lives === 0 && <span className="text-xs text-muted-foreground">0 ❤️</span>}
              </div>
              <div className="text-right">
                {/* Same level formula in play and on game-over: the previous
                    game-over variant showed "level 0" after failing the very
                    first sequence. */}
                <div className="text-sm text-muted-foreground">{tpl(gn.level_with_n || 'Level {n}', { n: level - startingLength + 1 })}</div>
                <div className="font-bold">{tpl(g.score_value || 'Score: {score}', { score })}</div>
              </div>
            </div>

            {/* Display */}
            <div className="bg-card border rounded-2xl p-12 text-center mb-6 min-h-[200px] flex flex-col items-center justify-center">
              {gameMode === 'memorize' ? (
                <div aria-live="assertive">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={displayIndex}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="text-6xl font-bold text-primary"
                    >
                      {sequence[displayIndex]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{gn.enter_sequence || 'Enter the sequence'}</span>
                  </div>
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value.replace(/\D/g, '').slice(0, sequence.length))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                      aria-label={gn.type_digits || 'Type digits...'}
                      placeholder={gn.type_digits || 'Type digits...'}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-border text-2xl font-mono font-bold text-center outline-none focus:border-primary"
                      autoFocus
                      inputMode="numeric"
                    />
                    <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all">{g.ok || 'OK'}</button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-3">{tpl(gn.digits_count || '{n} digits', { n: sequence.length })}</p>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="flex justify-center gap-1 mb-4" aria-hidden="true">
              <Eye className="w-4 h-4 text-primary" />
              {sequence.slice(0, 6).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i <= displayIndex && gameMode === 'memorize' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`} />
              ))}
              {sequence.length > 6 && <span className="text-xs text-muted-foreground">+{sequence.length - 6}</span>}
            </div>

            <button onClick={quitGame} className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> {g.quit || 'Quit'}
            </button>
          </div>
        )}

        {gameMode === 'gameover' && (
          <div className="bg-card border rounded-2xl p-8 text-center" aria-live="polite">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{g.game_over || 'Game Over!'}</h2>
            <p className="text-muted-foreground mb-2">{tpl(gn.reached_level || 'You reached level {n}', { n: Math.max(level - startingLength + 1, 1) })}</p>
            <p className="text-lg mb-2">{tpl(gn.correct_sequences || 'Correct sequences: {n}', { n: correctCount })}</p>
            <div className="text-4xl font-bold text-primary mb-6">{score}</div>
            {score >= highScore && score > 0 && <p className="text-amber-600 font-semibold mb-4">{g.new_high_score || '🏆 New High Score!'}</p>}
            <div className="flex gap-3">
              <button onClick={startGame} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all">{g.play_again || 'Play Again'}</button>
              <Link href={`/${lang}/games`} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors text-center">{g.more_games || 'More Games'}</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
