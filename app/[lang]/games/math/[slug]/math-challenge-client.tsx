'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, Clock, Zap, Target, CheckCircle2, XCircle, Star, ArrowLeft } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from 'next/link'

interface Question {
  a: number
  b: number
  op: string
  answer: number
  display: string
}

interface MathChallengeClientProps {
  lang: Locale
  game: any
  dict: any
}

function generateQuestion(ops: string[], maxNum: number): Question {
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a: number, b: number, answer: number

  switch (op) {
    case 'add':
      a = Math.floor(Math.random() * maxNum) + 1
      b = Math.floor(Math.random() * maxNum) + 1
      answer = a + b
      return { a, b, op: '+', answer, display: `${a} + ${b}` }
    case 'subtract':
      a = Math.floor(Math.random() * maxNum) + 1
      b = Math.floor(Math.random() * maxNum) + 1
      if (a < b) [a, b] = [b, a]
      answer = a - b
      return { a, b, op: '−', answer, display: `${a} − ${b}` }
    case 'multiply':
      a = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1
      b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1
      answer = a * b
      return { a, b, op: '×', answer, display: `${a} × ${b}` }
    case 'divide':
      b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1
      answer = Math.floor(Math.random() * Math.min(maxNum, 10)) + 1
      a = b * answer
      return { a, b, op: '÷', answer, display: `${a} ÷ ${b}` }
    default:
      return { a: 1, b: 1, op: '+', answer: 2, display: '1 + 1' }
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
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const maxNum = game.difficultyLevels[difficulty]?.maxNumber || 10
  const totalTime = game.difficultyLevels[difficulty]?.timeSeconds || 60

  const ops = [
    { key: 'add', label: '+', color: 'bg-green-600' },
    { key: 'subtract', label: '−', color: 'bg-blue-600' },
    { key: 'multiply', label: '×', color: 'bg-purple-600' },
    { key: 'divide', label: '÷', color: 'bg-orange-600' },
  ]

  const startGame = () => {
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
    if (inputRef.current) inputRef.current.focus()
  }

  useEffect(() => {
    if (gameMode === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameMode('complete')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameMode, timeLeft])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!question || !userAnswer.trim()) return

    const num = parseInt(userAnswer)
    if (num === question.answer) {
      setScore(prev => prev + (10 + streak * 2))
      setCorrect(prev => prev + 1)
      setStreak(prev => {
        const s = prev + 1
        if (s > bestStreak) setBestStreak(s)
        return s
      })
      setFeedback('correct')
    } else {
      setScore(prev => Math.max(0, prev - 5))
      setWrong(prev => prev + 1)
      setStreak(0)
      setFeedback('wrong')
    }

    setTimeout(() => {
      setFeedback(null)
      setUserAnswer('')
      setQuestion(generateQuestion(selectedOps, maxNum))
      if (inputRef.current) inputRef.current.focus()
    }, 400)
  }

  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Game Setup</h2>
            <div className="mb-6">
              <label className="block font-medium mb-3">Operations</label>
              <div className="flex flex-wrap gap-2">
                {ops.map(op => (
                  <button
                    key={op.key}
                    onClick={() => setSelectedOps(prev => prev.includes(op.key) ? prev.filter(k => k !== op.key) : [...prev, op.key])}
                    className={`w-14 h-14 rounded-xl text-2xl font-bold transition-all ${selectedOps.includes(op.key) ? `${op.color} text-white shadow-lg scale-110` : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label className="block font-medium mb-3">Difficulty</label>
              <div className="flex gap-2">
                {['beginner', 'intermediate', 'advanced'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${difficulty === d ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <div className="capitalize">{d}</div>
                    <div className="text-xs opacity-70 mt-1">≤ {game.difficultyLevels[d].maxNumber} · {game.difficultyLevels[d].timeSeconds}s</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startGame} disabled={selectedOps.length === 0} className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold hover:shadow-lg transition-all disabled:opacity-50">
              Start Challenge!
            </button>
          </div>
        )}

        {gameMode === 'playing' && (
          <div>
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Clock className="w-3 h-3" /> Time</div>
                <div className="text-xl font-bold">{timeLeft}s</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Star className="w-3 h-3" /> Score</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Target className="w-3 h-3" /> Streak</div>
                <div className="text-xl font-bold">{streak}</div>
              </div>
              <div className="bg-card border rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1"><Trophy className="w-3 h-3" /> Correct</div>
                <div className="text-xl font-bold">{correct}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all" style={{ width: `${(timeLeft / totalTime) * 100}%` }} />
            </div>

            {/* Question Card */}
            <motion.div
              key={question?.display + feedback}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border rounded-2xl p-10 text-center mb-6"
            >
              <div className="text-5xl font-bold mb-6">{question?.display}</div>

              <form onSubmit={handleSubmit} className="flex gap-3 max-w-xs mx-auto">
                <input
                  ref={inputRef}
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder="?"
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-2xl font-bold text-center outline-none transition-all ${
                    feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                    feedback === 'wrong' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    'border-border focus:border-primary'
                  }`}
                  autoFocus
                />
                <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all">
                  OK
                </button>
              </form>

              {feedback === 'correct' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 text-green-600 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Correct!
                </motion.div>
              )}
              {feedback === 'wrong' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 text-red-600 font-semibold flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5" /> Answer was {question?.answer}
                </motion.div>
              )}
            </motion.div>

            <button onClick={() => { setGameMode('config'); if (timerRef.current) clearInterval(timerRef.current) }} className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Quit
            </button>
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
            <p className="text-muted-foreground mb-6">Here's how you did:</p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 rounded-xl p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{wrong}</div>
                <div className="text-sm text-muted-foreground">Wrong</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 rounded-xl p-4 border border-amber-200">
                <div className="text-3xl font-bold text-amber-600">{bestStreak}</div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
            </div>
            <div className="text-2xl font-bold mb-6">Score: {score}</div>
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
