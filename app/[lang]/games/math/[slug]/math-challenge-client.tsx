'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, Clock, Zap, Target, CheckCircle2, XCircle, Star } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from '@/components/navigation/AppLink'
import { tpl } from '@/lib/games/tpl'
import { useInterval } from '@/lib/games/use-timer'
import { useSafeTimeouts } from '@/lib/games/use-safe-timeouts'
import { getGameBest, saveGameBestIfNew, GAME_ID } from '@/lib/games/storage'

interface Question {
  op: string
  answer: number
  display: string
}

interface MathChallengeClientProps {
  lang: Locale
  game: {
    title: string
    description: string
    operations?: string[]
    difficultyLevels?: Record<string, { maxNumber: number; timeSeconds: number }>
  }
  dict: any
}

const OP_META: Record<string, { symbol: string; color: string }> = {
  add: { symbol: '+', color: 'bg-green-600' },
  subtract: { symbol: '−', color: 'bg-blue-600' },
  multiply: { symbol: '×', color: 'bg-primary' },
  divide: { symbol: '÷', color: 'bg-orange-600' },
}

function generateQuestion(ops: string[], maxNum: number): Question {
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number

  switch (op) {
    case 'add':
      a = Math.floor(Math.random() * maxNum) + 1
      b = Math.floor(Math.random() * maxNum) + 1
      answer = a + b
      return { op: '+', answer, display: `${a} + ${b}` }
    case 'subtract':
      a = Math.floor(Math.random() * maxNum) + 1
      b = Math.floor(Math.random() * maxNum) + 1
      if (a < b) [a, b] = [b, a]
      answer = a - b
      return { op: '−', answer, display: `${a} − ${b}` }
    case 'multiply':
      a = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1
      b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1
      answer = a * b
      return { op: '×', answer, display: `${a} × ${b}` }
    case 'divide':
      b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1
      answer = Math.floor(Math.random() * Math.min(maxNum, 10)) + 1
      a = b * answer
      return { op: '÷', answer, display: `${a} ÷ ${b}` }
    default:
      return { op: '+', answer: 2, display: '1 + 1' }
  }
}

export function MathChallengeClient({ lang, game, dict }: MathChallengeClientProps) {
  const [selectedOps, setSelectedOps] = useState<string[]>(['add', 'subtract'])
  const [difficulty, setDifficulty] = useState<string>('beginner')
  const [gameMode, setGameMode] = useState<'config' | 'playing' | 'complete'>('config')
  const [question, setQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [bestScore, setBestScore] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const { setSafeTimeout, clearSafeTimeout, clearAll } = useSafeTimeouts()

  const maxNum = game.difficultyLevels?.[difficulty]?.maxNumber || 10
  const totalTime = game.difficultyLevels?.[difficulty]?.timeSeconds || 60

  const g = dict?.games ?? {}
  const mc = g?.math_challenge ?? {}

  // The JSON `operations` field is the source of truth; the previous client
  // hard-coded the four operations and ignored the content.
  const availableOps = useMemo(
    () => (game.operations?.length ? game.operations : Object.keys(OP_META)),
    [game.operations]
  )
  const ops = useMemo(
    () => availableOps
      .filter((key) => OP_META[key])
      .map((key) => ({ key, label: OP_META[key].symbol, color: OP_META[key].color })),
    [availableOps]
  )

  useEffect(() => {
    if (gameMode === 'config' || gameMode === 'complete') {
      setBestScore(getGameBest(GAME_ID.mathChallenge, 'score'))
    }
  }, [gameMode])

  const startGame = () => {
    clearAll()
    setGameMode('playing')
    setScore(0)
    setCorrect(0)
    setWrong(0)
    setStreak(0)
    setBestStreak(0)
    setTimeLeft(totalTime)
    setUserAnswer('')
    setFeedback(null)
    setQuestion(generateQuestion(selectedOps, maxNum))
    // Focusing happens in the effect below — the input is not mounted yet at
    // this point, so the previous in-place focus() call was always a no-op.
  }

  // Focus the answer input whenever the playing screen mounts (fixes the
  // missing focus on the *first* question of every round).
  useEffect(() => {
    if (gameMode !== 'playing') return
    const id = setSafeTimeout(() => inputRef.current?.focus(), 50)
    return () => clearSafeTimeout(id)
  }, [gameMode, setSafeTimeout, clearSafeTimeout])

  // Main timer: created once per round — the previous effect re-created the
  // interval every second because `timeLeft` (the ticking value) was in the
  // dependency array.
  useInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setGameMode('complete')
        return 0
      }
      return prev - 1
    })
  }, gameMode === 'playing' ? 1000 : null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!question || !userAnswer.trim() || feedback) return

    const trimmed = userAnswer.trim()
    // Strict integer match: the input type is numeric, but the previous
    // parseInt happily accepted prefixes like '7x'.
    const num = /^\d+$/.test(trimmed) ? Number.parseInt(trimmed, 10) : Number.NaN
    if (num === question.answer) {
      // Pure, single-event computation: the previous code ran setBestStreak
      // *inside* a setStreak updater (impure, double-invoked in StrictMode).
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > bestStreak) setBestStreak(newStreak)
      setScore((prev) => prev + (10 + streak * 2))
      setCorrect((prev) => prev + 1)
      setFeedback('correct')
    } else {
      setScore((prev) => Math.max(0, prev - 5))
      setWrong((prev) => prev + 1)
      setStreak(0)
      setFeedback('wrong')
    }

    // The registry clears this on quit and unmount (the previous quit button
    // left the pending 400 ms callback firing into a dead screen).
    setSafeTimeout(() => {
      setFeedback(null)
      setUserAnswer('')
      setQuestion(generateQuestion(selectedOps, maxNum))
      inputRef.current?.focus()
    }, 400)
  }

  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0

  const quitGame = () => {
    clearAll()
    setGameMode('config')
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {g.back_to_games || 'Back to Games'}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
          {bestScore !== null && bestScore > 0 && gameMode === 'config' && (
            <p className="text-sm font-semibold text-primary mt-2">🏆 {tpl(g.best_score || 'Best Score: {score}', { score: bestScore })}</p>
          )}
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">{g.game_setup || 'Game Setup'}</h2>
            <div className="mb-6">
              <label className="block font-medium mb-3">{mc.operations || 'Operations'}</label>
              <div className="flex flex-wrap gap-2" role="group" aria-label={mc.operations || 'Operations'}>
                {ops.map((op) => (
                  <button
                    key={op.key}
                    onClick={() => setSelectedOps((prev) => (prev.includes(op.key) ? prev.filter((k) => k !== op.key) : [...prev, op.key]))}
                    aria-pressed={selectedOps.includes(op.key)}
                    aria-label={op.label}
                    className={`w-14 h-14 rounded-xl text-2xl font-bold transition-all ${selectedOps.includes(op.key) ? `${op.color} text-white shadow-lg scale-110` : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label className="block font-medium mb-3">{g.difficulty_label || 'Difficulty'}</label>
              <div className="flex gap-2" role="group" aria-label={g.difficulty_label || 'Difficulty'}>
                {['beginner', 'intermediate', 'advanced'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    aria-pressed={difficulty === d}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${difficulty === d ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <div className="capitalize">{g.difficulty?.[d] || d}</div>
                    <div className="text-xs opacity-70 mt-1">≤ {game.difficultyLevels?.[d]?.maxNumber} · {game.difficultyLevels?.[d]?.timeSeconds}s</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startGame} disabled={selectedOps.length === 0} className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold hover:shadow-lg transition-all disabled:opacity-50">
              {g.start_challenge || 'Start Challenge!'}
            </button>
          </div>
        )}

        {gameMode === 'playing' && (
          <div>
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" /> {g.stats?.time || 'Time'}</div>
                <div className="text-xl font-bold" role="timer" aria-label={`${g.stats?.time || 'Time'}: ${timeLeft}`}>{timeLeft}s</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Star className="w-3 h-3" /> {g.stats?.score || 'Score'}</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Target className="w-3 h-3" /> {g.stats?.streak || 'Streak'}</div>
                <div className="text-xl font-bold">{streak}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Trophy className="w-3 h-3" /> {g.stats?.correct || 'Correct'}</div>
                <div className="text-xl font-bold">{correct}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${(timeLeft / totalTime) * 100}%` }} />
            </div>

            {/* Question Card */}
            <motion.div
              key={`${question?.display ?? ''}${feedback ?? ''}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border rounded-2xl p-10 text-center mb-6"
            >
              <div dir="ltr" className="text-5xl font-bold mb-6">{question?.display}</div>

              <form onSubmit={handleSubmit} className="flex gap-3 max-w-xs mx-auto">
                <input
                  ref={inputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                  disabled={feedback !== null}
                  aria-label={(mc.answer_label || 'Your answer')}
                  placeholder="?"
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-2xl font-bold text-center outline-none transition-all disabled:opacity-70 ${
                    feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                    feedback === 'wrong' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    'border-border focus:border-primary'
                  }`}
                  autoFocus
                />
                <button type="submit" disabled={feedback !== null} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {g.ok || 'OK'}
                </button>
              </form>

              {feedback && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} aria-live="polite" className={`mt-4 font-semibold flex items-center justify-center gap-2 ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback === 'correct'
                    ? <><CheckCircle2 className="w-5 h-5" /> {g.correct_exclamation || 'Correct!'}</>
                    : <><XCircle className="w-5 h-5" /> {tpl(g.answer_was || 'Answer was {answer}', { answer: question?.answer ?? '' })}</>}
                </motion.div>
              )}
            </motion.div>

            <button onClick={quitGame} className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> {g.quit || 'Quit'}
            </button>
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center" aria-live="polite">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{g.time_s_up || "Time's Up!"}</h2>
            <p className="text-muted-foreground mb-6">{g.hereshow || "Here's how you did:"}</p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{correct}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.correct || 'Correct'}</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 rounded-xl p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{wrong}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.wrong || 'Wrong'}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">{g.stats?.accuracy || 'Accuracy'}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 rounded-xl p-4 border border-amber-200">
                <div className="text-3xl font-bold text-amber-600">{bestStreak}</div>
                <div className="text-sm text-muted-foreground">{g.stats?.best_streak || 'Best Streak'}</div>
              </div>
            </div>
            <div className="text-2xl font-bold mb-6">{tpl(g.score_value || 'Score: {score}', { score })}</div>
            {bestScore !== null && score >= bestScore && score > 0 && (
              <p className="text-amber-600 font-semibold mb-4">🏆 {tpl(g.best_score || 'Best Score: {score}', { score: bestScore })} ★</p>
            )}
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
