'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle, Atom, Target } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import Link from 'next/link'

type Mode = 'symbol-to-name' | 'name-to-symbol' | 'number-to-element' | 'element-to-number'

interface Question {
  prompt: string
  correct: string
  options: string[]
  mode: Mode
}

interface PeriodicTableClientProps {
  lang: Locale
  game: any
  dict: any
}

const modeLabels: Record<Mode, string> = {
  'symbol-to-name': 'Symbol → Name',
  'name-to-symbol': 'Name → Symbol',
  'number-to-element': 'Number → Element',
  'element-to-number': 'Element → Number',
}

function generateQuestion(elements: any[], mode: Mode): Question {
  const element = elements[Math.floor(Math.random() * elements.length)]
  let prompt: string, correct: string, options: string[], allOptions: string[]

  switch (mode) {
    case 'symbol-to-name':
      prompt = `What element has the symbol "${element.symbol}"?`
      correct = element.name
      allOptions = elements.map((e: any) => e.name)
      options = generateOptions(correct, allOptions)
      break
    case 'name-to-symbol':
      prompt = `What is the symbol for "${element.name}"?`
      correct = element.symbol
      allOptions = elements.map((e: any) => e.symbol)
      options = generateOptions(correct, allOptions)
      break
    case 'number-to-element':
      prompt = `Which element has atomic number ${element.number}?`
      correct = element.name
      allOptions = elements.map((e: any) => e.name)
      options = generateOptions(correct, allOptions)
      break
    case 'element-to-number':
      prompt = `What is the atomic number of "${element.name}"?`
      correct = element.number.toString()
      options = generateNumberOptions(element.number, elements.length)
      break
  }

  return { prompt, correct, options, mode }
}

function generateOptions(correct: string, allOptions: string[]): string[] {
  const opts = new Set<string>([correct])
  while (opts.size < 4) {
    opts.add(allOptions[Math.floor(Math.random() * allOptions.length)])
  }
  return Array.from(opts).sort(() => Math.random() - 0.5).slice(0, 4).sort(() => Math.random() - 0.5)
}

function generateNumberOptions(correct: number, max: number): string[] {
  const opts = new Set<string>([correct.toString()])
  while (opts.size < 4) {
    opts.add((Math.floor(Math.random() * max) + 1).toString())
  }
  return Array.from(opts).sort(() => Math.random() - 0.5).slice(0, 4).sort(() => Math.random() - 0.5)
}

export function PeriodicTableClient({ lang, game, dict }: PeriodicTableClientProps) {
  const [selectedModes, setSelectedModes] = useState<Mode[]>(['symbol-to-name', 'name-to-symbol'])
  const [questionCount, setQuestionCount] = useState(10)
  const [gameMode, setGameMode] = useState<'config' | 'playing' | 'complete'>('config')
  const [question, setQuestion] = useState<Question | null>(null)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const elements = game.elements

  const startGame = () => {
    setGameMode('playing')
    setScore(0)
    setCorrect(0)
    setTotal(0)
    setAnswered(0)
    setSelectedAnswer(null)
    setShowResult(false)
    nextQuestion()
  }

  const nextQuestion = () => {
    const mode = selectedModes[Math.floor(Math.random() * selectedModes.length)]
    setQuestion(generateQuestion(elements, mode))
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const handleAnswer = (answer: string) => {
    if (showResult || !question) return
    setSelectedAnswer(answer)
    setShowResult(true)
    setTotal(prev => prev + 1)
    setAnswered(prev => prev + 1)

    if (answer === question.correct) {
      setScore(prev => prev + 10)
      setCorrect(prev => prev + 1)
    }

    setTimeout(() => {
      if (answered + 1 >= questionCount) {
        setGameMode('complete')
      } else {
        nextQuestion()
      }
    }, 1500)
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-red-600 mb-4">
            <Atom className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{game.title}</h1>
          <p className="text-muted-foreground">{game.description}</p>
        </div>

        {gameMode === 'config' && (
          <div className="bg-card border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Game Setup</h2>
            <div className="mb-6">
              <label className="block font-medium mb-3">Quiz Modes</label>
              <div className="flex flex-wrap gap-2">
                {game.modes.map((mode: Mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode])}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedModes.includes(mode) ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {modeLabels[mode]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label className="block font-medium mb-3">Questions: {questionCount}</label>
              <input type="range" min={5} max={20} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full accent-primary" />
            </div>
            <button onClick={startGame} disabled={selectedModes.length === 0} className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white text-lg font-bold hover:shadow-lg transition-all disabled:opacity-50">
              Start Quiz
            </button>
          </div>
        )}

        {gameMode === 'playing' && question && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Question {answered + 1} of {questionCount}</span>
              <span className="text-sm font-semibold">Score: {score}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all" style={{ width: `${(answered / questionCount) * 100}%` }} />
            </div>

            <motion.div key={question.prompt + answered} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-card border rounded-2xl p-8 text-center mb-6">
              <div className="text-sm text-muted-foreground mb-2">{modeLabels[question.mode]}</div>
              <div className="text-2xl font-bold mb-8">{question.prompt}</div>

              <div className="grid grid-cols-2 gap-3">
                {question.options.map((opt, i) => {
                  const isSelected = selectedAnswer === opt
                  const isCorrect = opt === question.correct
                  const showCorrect = showResult && isCorrect
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      disabled={showResult}
                      className={`p-4 rounded-xl text-lg font-semibold border-2 transition-all ${
                        showResult && isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700' :
                        showResult && isSelected && !isCorrect ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700' :
                        isSelected ? 'border-primary bg-primary/10' :
                        'border-border hover:border-primary hover:bg-muted/50'
                      }`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

              {showResult && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`mt-6 text-lg font-semibold flex items-center justify-center gap-2 ${selectedAnswer === question.correct ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAnswer === question.correct ? <><CheckCircle2 className="w-6 h-6" /> Correct!</> : <><XCircle className="w-6 h-6" /> {question.correct}</>}
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
            <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
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
