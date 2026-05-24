'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Shuffle, Target } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from 'next/link'

type Mode = 'dec-to-bin' | 'bin-to-dec' | 'dec-to-hex' | 'hex-to-dec' | 'bin-to-hex' | 'hex-to-bin'

interface Question {
  display: string
  answer: string
  mode: Mode
  value: number
}

interface BinaryHexClientProps {
  lang: Locale
  game: any
  dict: any
}

const modeLabels: Record<Mode, string> = {
  'dec-to-bin': 'Decimal → Binary',
  'bin-to-dec': 'Binary → Decimal',
  'dec-to-hex': 'Decimal → Hex',
  'hex-to-dec': 'Hex → Decimal',
  'bin-to-hex': 'Binary → Hex',
  'hex-to-bin': 'Hex → Binary',
}

const modeColors: Record<Mode, string> = {
  'dec-to-bin': 'from-blue-600 to-indigo-600',
  'bin-to-dec': 'from-indigo-600 to-purple-600',
  'dec-to-hex': 'from-purple-600 to-pink-600',
  'hex-to-dec': 'from-pink-600 to-rose-600',
  'bin-to-hex': 'from-teal-600 to-cyan-600',
  'hex-to-bin': 'from-cyan-600 to-blue-600',
}

function generateQuestion(mode: Mode, maxBits: number): Question {
  const maxVal = Math.pow(2, maxBits) - 1
  const value = Math.floor(Math.random() * maxVal) + 1

  switch (mode) {
    case 'dec-to-bin':
      return { display: value.toString(10), answer: value.toString(2), mode, value }
    case 'bin-to-dec':
      return { display: value.toString(2), answer: value.toString(10), mode, value }
    case 'dec-to-hex':
      return { display: value.toString(10), answer: value.toString(16).toUpperCase(), mode, value }
    case 'hex-to-dec':
      return { display: value.toString(16).toUpperCase(), answer: value.toString(10), mode, value }
    case 'bin-to-hex':
      return { display: value.toString(2), answer: value.toString(16).toUpperCase(), mode, value }
    case 'hex-to-bin':
      return { display: value.toString(16).toUpperCase(), answer: value.toString(2), mode, value }
  }
}

export function BinaryHexClient({ lang, game, dict }: BinaryHexClientProps) {
  const [selectedModes, setSelectedModes] = useState<Mode[]>(['bin-to-dec'])
  const [difficulty, setDifficulty] = useState<string>('beginner')
  const [gameMode, setGameMode] = useState<'config' | 'playing' | 'complete'>('config')
  const [question, setQuestion] = useState<Question | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const totalQuestions = 15
  const inputRef = useRef<HTMLInputElement>(null)

  const maxBits = game.difficultyLevels[difficulty]?.maxBits || 4

  const startGame = () => {
    setGameMode('playing')
    setScore(0)
    setCorrect(0)
    setTotal(0)
    setQuestionsAnswered(0)
    setUserAnswer('')
    setFeedback(null)
    const mode = selectedModes[Math.floor(Math.random() * selectedModes.length)]
    setQuestion(generateQuestion(mode, maxBits))
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const nextQuestion = () => {
    const mode = selectedModes[Math.floor(Math.random() * selectedModes.length)]
    setQuestion(generateQuestion(mode, maxBits))
    setUserAnswer('')
    setFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!question || !userAnswer.trim()) return

    setTotal(prev => prev + 1)
    setQuestionsAnswered(prev => prev + 1)

    if (userAnswer.trim().toUpperCase() === question.answer) {
      setScore(prev => prev + 10)
      setCorrect(prev => prev + 1)
      setFeedback('correct')
    } else {
      setFeedback('wrong')
    }

    setTimeout(() => {
      if (questionsAnswered + 1 >= totalQuestions) {
        setGameMode('complete')
      } else {
        nextQuestion()
      }
    }, 1200)
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
            <Shuffle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Game Setup</h2>
            <div className="mb-6">
              <label className="block font-medium mb-3">Conversion Modes</label>
              <div className="flex flex-wrap gap-2">
                {game.modes.map((mode: Mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode])}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedModes.includes(mode) ? `bg-gradient-to-r ${modeColors[mode]} text-white shadow-lg` : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {modeLabels[mode]}
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
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${difficulty === d ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <div className="capitalize">{d}</div>
                    <div className="text-xs opacity-70 mt-1">{game.difficultyLevels[d].maxBits} bits</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startGame} disabled={selectedModes.length === 0} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold hover:shadow-lg transition-all disabled:opacity-50">
              Start Challenge ({totalQuestions} questions)
            </button>
          </div>
        )}

        {gameMode === 'playing' && question && (
          <div>
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Question {questionsAnswered + 1} of {totalQuestions}</span>
              <span className="text-sm font-semibold">Score: {score}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${((questionsAnswered) / totalQuestions) * 100}%` }} />
            </div>

            {/* Mode Badge */}
            <div className="text-center mb-4">
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${modeColors[question.mode]} text-white`}>
                {modeLabels[question.mode]}
              </span>
            </div>

            {/* Question */}
            <motion.div
              key={question.display + feedback}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border rounded-2xl p-10 text-center mb-6"
            >
              <div className="text-sm text-muted-foreground mb-2">Convert:</div>
              <div className="text-5xl font-mono font-bold mb-6 tracking-wider">{question.display}</div>

              <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm mx-auto">
                <input
                  ref={inputRef}
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                  placeholder="Answer..."
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-2xl font-mono font-bold text-center outline-none transition-all ${
                    feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                    feedback === 'wrong' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    'border-border focus:border-primary'
                  }`}
                  autoFocus
                />
                <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all">OK</button>
              </form>

              {feedback && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`mt-4 font-semibold flex items-center justify-center gap-2 ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback === 'correct' ? <><CheckCircle2 className="w-5 h-5" /> Correct!</> : <><XCircle className="w-5 h-5" /> Answer: {question.answer}</>}
                </motion.div>
              )}
            </motion.div>
          </div>
        )}

        {gameMode === 'complete' && (
          <div className="bg-card border rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Challenge Complete!</h2>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto my-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-600">{correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 rounded-xl p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{total - correct}</div>
                <div className="text-sm text-muted-foreground">Wrong</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
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
