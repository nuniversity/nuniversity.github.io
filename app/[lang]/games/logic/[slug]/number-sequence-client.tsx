'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, Brain, Star, Target, Zap, Eye, EyeOff } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from 'next/link'

interface NumberSequenceClientProps {
  lang: Locale
  game: any
  dict: any
}

export function NumberSequenceClient({ lang, game, dict }: NumberSequenceClientProps) {
  const [gameMode, setGameMode] = useState<'config' | 'memorize' | 'recall' | 'complete' | 'gameover'>('config')
  const [sequence, setSequence] = useState<number[]>([])
  const [displayIndex, setDisplayIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [level, setLevel] = useState(game.startingLength || 3)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [showSequence, setShowSequence] = useState(true)
  const [correctCount, setCorrectCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('number_sequence_highscore')
    if (saved) { try { setHighScore(parseInt(saved)); } catch {} }
  }, [])

  const generateSequence = useCallback((length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1)
  }, [])

  const startLevel = useCallback((lvl: number) => {
    const seq = generateSequence(lvl)
    setSequence(seq)
    setDisplayIndex(0)
    setUserInput('')
    setShowSequence(true)
    setGameMode('memorize')
  }, [generateSequence])

  const startGame = () => {
    setLevel(game.startingLength || 3)
    setScore(0)
    setLives(3)
    setCorrectCount(0)
    startLevel(game.startingLength || 3)
  }

  // Show sequence one digit at a time
  useEffect(() => {
    if (gameMode === 'memorize' && sequence.length > 0) {
      const displayTime = game.displayTimeMs || 1000
      timeoutRef.current = setTimeout(() => {
        if (displayIndex < sequence.length - 1) {
          setDisplayIndex(prev => prev + 1)
        } else {
          // Done showing
          setTimeout(() => {
            setShowSequence(false)
            setGameMode('recall')
            setTimeout(() => inputRef.current?.focus(), 50)
          }, displayTime / 2)
        }
      }, displayTime)

      return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
    }
  }, [gameMode, displayIndex, sequence, game])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!userInput.trim() || gameMode !== 'recall') return

    const userSeq = userInput.trim().split('').map(Number)
    const correct = sequence.join('')

    if (userSeq.join('') === correct) {
      setScore(prev => prev + level * 10)
      setCorrectCount(prev => prev + 1)
      const newLevel = level + 1
      setLevel(newLevel)
      setTimeout(() => {
        setUserInput('')
        startLevel(newLevel)
      }, 800)
    } else {
      const newLives = lives - 1
      setLives(newLives)
      setUserInput('')
      if (newLives <= 0) {
        if (score > highScore) {
          setHighScore(score)
          localStorage.setItem('number_sequence_highscore', score.toString())
        }
        setGameMode('gameover')
      } else {
        setTimeout(() => {
          setUserInput('')
          startLevel(level)
        }, 1000)
      }
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="container-custom py-12">
      <div className="max-w-lg mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <ul className="text-left space-y-2 mb-8 text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-purple-600 mt-1">•</span> Watch the sequence of numbers</li>
              <li className="flex items-start gap-2"><span className="text-purple-600 mt-1">•</span> Remember the order!</li>
              <li className="flex items-start gap-2"><span className="text-purple-600 mt-1">•</span> Type the sequence back correctly</li>
              <li className="flex items-start gap-2"><span className="text-purple-600 mt-1">•</span> Each level adds one more digit</li>
              <li className="flex items-start gap-2"><span className="text-purple-600 mt-1">•</span> You have {lives} lives — use them wisely!</li>
            </ul>
            {highScore > 0 && <p className="text-lg font-semibold mb-6">🏆 High Score: {highScore}</p>}
            <button onClick={startGame} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold hover:shadow-lg transition-all">
              Start Game
            </button>
          </div>
        )}

        {(gameMode === 'memorize' || gameMode === 'recall') && (
          <div>
            {/* Stats */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: lives }).map((_, i) => (
                  <span key={i} className="text-2xl">❤️</span>
                ))}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Level {level - (game.startingLength || 3) + 1}</div>
                <div className="font-bold">Score: {score}</div>
              </div>
            </div>

            {/* Display */}
            <div className="bg-card border rounded-2xl p-12 text-center mb-6 min-h-[200px] flex flex-col items-center justify-center">
              {gameMode === 'memorize' ? (
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
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Enter the sequence</span>
                  </div>
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                      placeholder="Type digits..."
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-border text-2xl font-mono font-bold text-center outline-none focus:border-primary"
                      autoFocus
                      inputMode="numeric"
                    />
                    <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all">OK</button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-3">{sequence.length} digits</p>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="flex justify-center gap-1 mb-4">
              <Eye className="w-4 h-4 text-purple-600" />
              {sequence.slice(0, 6).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${i <= displayIndex && gameMode === 'memorize' ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
              ))}
              {sequence.length > 6 && <span className="text-xs text-muted-foreground">+{sequence.length - 6}</span>}
            </div>
          </div>
        )}

        {gameMode === 'gameover' && (
          <div className="bg-card border rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
            <p className="text-muted-foreground mb-2">You reached level {level - (game.startingLength || 3)}</p>
            <p className="text-lg mb-2">Correct sequences: {correctCount}</p>
            <div className="text-4xl font-bold text-primary mb-6">{score}</div>
            {score >= highScore && score > 0 && <p className="text-amber-600 font-semibold mb-4">🏆 New High Score!</p>}
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
