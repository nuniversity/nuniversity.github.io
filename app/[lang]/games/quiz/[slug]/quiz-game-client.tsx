// app/[lang]/games/quiz/[slug]/quiz-game-client.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Trophy, RotateCcw, CheckCircle2, XCircle,
  Clock, Star, ChevronRight, BookOpen, Target, Award,
  Shuffle, Filter, AlertCircle, ThumbsUp
} from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { QuizGame, QuizQuestion } from '@/lib/games/get-game-content'
import Link from 'next/link'

interface QuizGameClientProps {
  lang: Locale
  game: QuizGame
  dict: any
}

type GameMode = 'config' | 'playing' | 'review' | 'complete'

interface UserAnswer {
  questionId: string
  selectedOption: number | null
  isCorrect: boolean
  timeSpent: number
}

export function QuizGameClient({ lang, game, dict }: QuizGameClientProps) {
  // ── Config state ─────────────────────────────────────────────────────────────
  const [gameMode, setGameMode] = useState<GameMode>('config')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [shuffleQuestions, setShuffleQuestions] = useState(true)

  // ── Game state ───────────────────────────────────────────────────────────────
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [totalTime, setTotalTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allDomains = useMemo(() => {
    const domains = Array.from(new Set(game.questions.map(q => q.domain)))
    return domains.sort()
  }, [game.questions])

  const currentQuestion = activeQuestions[currentIndex]
  const isLastQuestion = currentIndex === activeQuestions.length - 1

  const score = useMemo(() => userAnswers.filter(a => a.isCorrect).length, [userAnswers])

  const accuracy = useMemo(() => {
    if (userAnswers.length === 0) return 0
    return Math.round((score / userAnswers.length) * 100)
  }, [score, userAnswers])

  const availableCount = useMemo(() => {
    return game.questions.filter(q =>
      selectedDomains.length === 0 || selectedDomains.includes(q.domain)
    ).length
  }, [game.questions, selectedDomains])

  const domainResults = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {}
    activeQuestions.forEach((q, i) => {
      if (!map[q.domain]) map[q.domain] = { correct: 0, total: 0 }
      map[q.domain].total++
      if (userAnswers[i]?.isCorrect) map[q.domain].correct++
    })
    return map
  }, [activeQuestions, userAnswers])

  // ── Initialise domains: all selected by default ──────────────────────────────
  useEffect(() => {
    setSelectedDomains(allDomains)
  }, [allDomains])

  // ── Timer (only runs while playing) ─────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'playing' || !startTime) return
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [gameMode, startTime])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function getLetterLabel(index: number): string {
    return ['A', 'B', 'C', 'D'][index]
  }

  function getDifficultyColor(difficulty?: string) {
    switch (difficulty) {
      case 'beginner':     return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
      case 'advanced':     return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      default:             return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  function getScoreRating(pct: number): { label: string; color: string } {
    if (pct >= 90) return { label: 'Excellent! Ready to certify 🚀', color: 'text-green-600 dark:text-green-400' }
    if (pct >= 75) return { label: 'Great job! Keep it up 💪',        color: 'text-blue-600 dark:text-blue-400' }
    if (pct >= 60) return { label: 'Good effort — review weak areas',  color: 'text-yellow-600 dark:text-yellow-400' }
    return             { label: "Keep studying — you'll get there!",   color: 'text-red-600 dark:text-red-400' }
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  function startGame() {
    const pool = game.questions.filter(q =>
      selectedDomains.length === 0 || selectedDomains.includes(q.domain)
    )
    let selected = shuffleQuestions ? [...pool].sort(() => Math.random() - 0.5) : [...pool]
    selected = selected.slice(0, Math.min(questionCount, pool.length))

    setActiveQuestions(selected)
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsAnswered(false)
    setShowExplanation(false)
    setUserAnswers([])
    const now = Date.now()
    setStartTime(now)
    setQuestionStartTime(now)
    setElapsedTime(0)
    setTotalTime(0)
    setGameMode('playing')
  }

  function handleOptionSelect(optionIndex: number) {
    if (isAnswered) return
    setSelectedOption(optionIndex)
    setIsAnswered(true)
    setShowExplanation(true)
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    const isCorrect = optionIndex === currentQuestion.correct
    setUserAnswers(prev => [...prev, {
      questionId: currentQuestion.id,
      selectedOption: optionIndex,
      isCorrect,
      timeSpent
    }])
  }

  function handleNext() {
    if (isLastQuestion) {
      setTotalTime(elapsedTime)
      setGameMode('complete')
      return
    }
    setCurrentIndex(prev => prev + 1)
    setSelectedOption(null)
    setIsAnswered(false)
    setShowExplanation(false)
    setQuestionStartTime(Date.now())
  }

  function reviewAnswers() {
    setGameMode('review')
    setCurrentIndex(0)
  }

  function restartGame() {
    setGameMode('config')
    setSelectedDomains(allDomains)
    setQuestionCount(10)
    setShuffleQuestions(true)
  }

  function toggleDomain(domain: string) {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // CONFIG SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'config') {
    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/${lang}/games`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
            <p className="text-muted-foreground mb-3">{game.description}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${getDifficultyColor(game.difficulty)}`}>
                {game.difficulty}
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {game.certification}
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {game.questions.length} questions total
              </span>
            </div>
          </div>

          {/* Config Card */}
          <div className="bg-card border rounded-2xl p-6 space-y-6">
            {/* Domain filter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter by Domain
                </h3>
                <button
                  onClick={() =>
                    selectedDomains.length === allDomains.length
                      ? setSelectedDomains([])
                      : setSelectedDomains(allDomains)
                  }
                  className="text-xs text-primary hover:underline"
                >
                  {selectedDomains.length === allDomains.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allDomains.map(domain => (
                  <button
                    key={domain}
                    onClick={() => toggleDomain(domain)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      selectedDomains.includes(domain)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary'
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {availableCount} questions available in selected domains
              </p>
            </div>

            {/* Number of questions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Number of Questions
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={Math.min(availableCount, 40)}
                  step={5}
                  value={Math.min(questionCount, availableCount)}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="font-bold text-2xl w-10 text-right">
                  {Math.min(questionCount, availableCount)}
                </span>
              </div>
            </div>

            {/* Shuffle toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4" />
                <span className="font-semibold">Shuffle Questions</span>
              </div>
              <button
                onClick={() => setShuffleQuestions(prev => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  shuffleQuestions ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  shuffleQuestions ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={selectedDomains.length === 0}
            className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            Start Quiz — {Math.min(questionCount, availableCount)} Questions
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // PLAYING SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'playing' && currentQuestion) {
    const progressPct = (currentIndex / activeQuestions.length) * 100

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/${lang}/games`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(elapsedTime)}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                {score}/{currentIndex}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Question {currentIndex + 1} of {activeQuestions.length}</span>
              <span>{Math.round(progressPct)}% complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Domain badge */}
          <div className="mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {currentQuestion.domain}
            </span>
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="bg-card border rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-semibold leading-relaxed mb-6">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx
                  const isCorrect  = idx === currentQuestion.correct
                  let cls = 'border-border bg-background hover:border-primary hover:bg-muted/50 cursor-pointer'
                  if (isAnswered) {
                    if (isCorrect)                cls = 'border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default'
                    else if (isSelected)          cls = 'border-red-500 bg-red-50 dark:bg-red-900/20 cursor-default'
                    else                          cls = 'border-border bg-background opacity-50 cursor-default'
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isAnswered}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${cls}`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isAnswered && isCorrect            ? 'bg-green-500 text-white'
                        : isAnswered && isSelected         ? 'bg-red-500 text-white'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                        {getLetterLabel(idx)}
                      </span>
                      <span className="flex-1 font-medium">{option}</span>
                      {isAnswered && isCorrect  && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-5 overflow-hidden"
                  >
                    <div className={`rounded-xl p-4 flex gap-3 ${
                      selectedOption === currentQuestion.correct
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    }`}>
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        selectedOption === currentQuestion.correct
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`} />
                      <div>
                        <p className={`text-sm font-semibold mb-1 ${
                          selectedOption === currentQuestion.correct
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}>
                          {selectedOption === currentQuestion.correct ? 'Correct!' : 'Incorrect'}
                        </p>
                        <p className="text-sm text-foreground/80">{currentQuestion.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Next / See Results button */}
          {isAnswered && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isLastQuestion ? (
                <><Trophy className="w-5 h-5" /> See Results</>
              ) : (
                <>Next Question <ChevronRight className="w-5 h-5" /></>
              )}
            </motion.button>
          )}

          {!isAnswered && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Select an answer to continue
            </p>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // COMPLETE SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'complete') {
    const rating = getScoreRating(accuracy)

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          {/* Trophy header */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Quiz Complete!</h1>
            <p className={`text-lg font-semibold ${rating.color}`}>{rating.label}</p>
          </motion.div>

          {/* Score card */}
          <div className="bg-card border rounded-2xl p-6 mb-6">
            {/* Big percentage */}
            <div className="text-center mb-6 pb-6 border-b">
              <div className="text-7xl font-black mb-1 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {accuracy}%
              </div>
              <p className="text-muted-foreground">
                {score} correct out of {activeQuestions.length} questions
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{score}</div>
                <div className="text-xs text-muted-foreground mt-1">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{activeQuestions.length - score}</div>
                <div className="text-xs text-muted-foreground mt-1">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
                <div className="text-xs text-muted-foreground mt-1">Time</div>
              </div>
            </div>

            {/* Domain breakdown */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                Domain Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(domainResults).map(([domain, { correct, total }]) => {
                  const pct = Math.round((correct / total) * 100)
                  return (
                    <div key={domain}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground/80 truncate pr-2">{domain}</span>
                        <span className="font-semibold flex-shrink-0">{correct}/{total} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={reviewAnswers}
              className="py-3 rounded-xl border-2 font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Review Answers
            </button>
            <button
              onClick={restartGame}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          </div>

          <Link
            href={`/${lang}/games`}
            className="block text-center mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to all games
          </Link>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // REVIEW SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'review') {
    const answer   = userAnswers[currentIndex]
    const question = activeQuestions[currentIndex]

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setGameMode('complete')}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Results
            </button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {activeQuestions.length}
            </span>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6 flex-wrap">
            {activeQuestions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
                  i === currentIndex ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''
                } ${userAnswers[i]?.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Domain badge */}
          <div className="mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {question.domain}
            </span>
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-card border rounded-2xl p-6 mb-6"
            >
              <div className="flex items-start gap-3 mb-5">
                {answer?.isCorrect
                  ? <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  : <XCircle     className="w-6 h-6 text-red-500   flex-shrink-0 mt-0.5" />
                }
                <h2 className="text-lg font-semibold leading-relaxed">{question.question}</h2>
              </div>

              <div className="space-y-2">
                {question.options.map((option, idx) => {
                  const isCorrect  = idx === question.correct
                  const wasSelected = answer?.selectedOption === idx
                  let cls = 'border-border bg-background opacity-50'
                  if (isCorrect)               cls = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  else if (wasSelected)        cls = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  return (
                    <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border-2 ${cls}`}>
                      <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCorrect ? 'bg-green-500 text-white'
                        : wasSelected ? 'bg-red-500 text-white'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                        {getLetterLabel(idx)}
                      </span>
                      <span className="flex-1 text-sm font-medium">{option}</span>
                      {isCorrect    && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      {wasSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>

              {/* Explanation box */}
              <div className="mt-4 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Explanation</p>
                <p className="text-sm text-foreground/80">{question.explanation}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))}
              disabled={currentIndex === activeQuestions.length - 1}
              className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={restartGame}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <Link
              href={`/${lang}/games`}
              className="py-3 rounded-xl border font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              More Games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
