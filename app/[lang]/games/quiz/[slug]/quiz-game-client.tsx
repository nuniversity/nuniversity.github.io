'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Trophy, RotateCcw, CheckCircle2, XCircle,
  Clock, Star, ChevronRight, BookOpen, Target, Award,
  Shuffle, Filter, AlertCircle, Flag, ChevronLeft,
  ClipboardList, AlertTriangle, CheckSquare, Square,
  BarChart3, Zap, Circle
} from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { QuizGame, QuizQuestion } from '@/lib/games/get-game-content'
import Link from 'next/link'

interface QuizGameClientProps {
  lang: Locale
  game: QuizGame
  dict: any
}

// ── Exam domain/sub-domain proportions (100-question mock exam) ───────────────
// Mirrors the official COF-C03 blueprint weightings
const MOCK_EXAM_ALLOCATIONS: Record<string, number> = {
  '1.1 - Snowflake Architecture':            8,
  '1.2 - Snowflake Interfaces and Tools':    3,
  '1.3 - Snowflake Object Hierarchy and Types': 6,
  '1.4 - Virtual Warehouses':                7,
  '1.5 - Storage Concepts':                  5,
  '1.6 - AI/ML and Application Development': 2,
  '2.1 - Security Model':                    9,
  '2.2 - Data Governance':                   7,
  '2.3 - Monitoring and Cost Management':    4,
  '3.1 - Data Loading and Unloading':        8,
  '3.2 - Automated Data Ingestion':          7,
  '3.3 - Connectors and Integrations':       3,
  '4.1 - Query Performance':                 5,
  '4.2 - Query Optimization':                7,
  '4.3 - Snowflake Caching':                 4,
  '4.4 - Data Transformation':               5,
  '5.1 - Data Collaboration and Protection': 4,
  '5.2 - Data Sharing Capabilities':         4,
  '5.3 - Snowflake Marketplace':             2,
}

const MOCK_EXAM_DURATION_SECONDS = 115 * 60 // 115 minutes

// Domain display grouping
const DOMAIN_GROUPS: Record<string, { label: string; color: string; subdomains: string[] }> = {
  '1.0': {
    label: '1.0 Architecture & Features',
    color: 'blue',
    subdomains: ['1.1','1.2','1.3','1.4','1.5','1.6'],
  },
  '2.0': {
    label: '2.0 Account Mgmt & Governance',
    color: 'purple',
    subdomains: ['2.1','2.2','2.3'],
  },
  '3.0': {
    label: '3.0 Data Loading & Connectivity',
    color: 'teal',
    subdomains: ['3.1','3.2','3.3'],
  },
  '4.0': {
    label: '4.0 Performance & Transformation',
    color: 'orange',
    subdomains: ['4.1','4.2','4.3','4.4'],
  },
  '5.0': {
    label: '5.0 Data Collaboration',
    color: 'green',
    subdomains: ['5.1','5.2','5.3'],
  },
}

type GameMode = 'config' | 'playing' | 'review' | 'complete' | 'mock-config' | 'mock-exam' | 'mock-complete'

interface UserAnswer {
  questionId: string
  selectedOption: number | null
  isCorrect: boolean
  timeSpent: number
}

interface MockAnswer {
  selectedOption: number | null
}

export function QuizGameClient({ lang, game, dict }: QuizGameClientProps) {
  // ── Config state ─────────────────────────────────────────────────────────────
  const [gameMode, setGameMode] = useState<GameMode>('config')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [shuffleQuestions, setShuffleQuestions] = useState(true)

  // ── Regular quiz state ───────────────────────────────────────────────────────
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

  // ── Mock exam state ──────────────────────────────────────────────────────────
  const [mockQuestions, setMockQuestions]           = useState<QuizQuestion[]>([])
  const [mockCurrentIndex, setMockCurrentIndex]     = useState(0)
  const [mockAnswers, setMockAnswers]               = useState<MockAnswer[]>([])
  const [mockFlagged, setMockFlagged]               = useState<Set<number>>(new Set())
  const [mockTimeLeft, setMockTimeLeft]             = useState(MOCK_EXAM_DURATION_SECONDS)
  const [mockStartTime, setMockStartTime]           = useState<number | null>(null)
  const [mockSubmitted, setMockSubmitted]           = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm]   = useState(false)
  const [mockTimedOut, setMockTimedOut]             = useState(false)
  const [mockReviewIndex, setMockReviewIndex]       = useState(0)
  const [mockReviewMode, setMockReviewMode]         = useState<'all' | 'wrong' | 'flagged'>('all')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allDomains = useMemo(() => {
    const domains = Array.from(new Set(game.questions.map(q => q.domain)))
    return domains.sort()
  }, [game.questions])

  const currentQuestion    = activeQuestions[currentIndex]
  const isLastQuestion     = currentIndex === activeQuestions.length - 1
  const score              = useMemo(() => userAnswers.filter(a => a.isCorrect).length, [userAnswers])
  const accuracy           = useMemo(() => {
    if (userAnswers.length === 0) return 0
    return Math.round((score / userAnswers.length) * 100)
  }, [score, userAnswers])

  const availableCount = useMemo(() =>
    game.questions.filter(q => selectedDomains.length === 0 || selectedDomains.includes(q.domain)).length,
    [game.questions, selectedDomains])

  const domainResults = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {}
    activeQuestions.forEach((q, i) => {
      if (!map[q.domain]) map[q.domain] = { correct: 0, total: 0 }
      map[q.domain].total++
      if (userAnswers[i]?.isCorrect) map[q.domain].correct++
    })
    return map
  }, [activeQuestions, userAnswers])

  // Mock exam derived
  const mockScore = useMemo(() => {
    return mockAnswers.filter((a, i) =>
      a.selectedOption !== null && a.selectedOption === mockQuestions[i]?.correct
    ).length
  }, [mockAnswers, mockQuestions])

  const mockAccuracy = useMemo(() =>
    mockQuestions.length === 0 ? 0 : Math.round((mockScore / mockQuestions.length) * 100),
    [mockScore, mockQuestions])

  const mockPassed = mockAccuracy >= 75

  const mockAnsweredCount = useMemo(() =>
    mockAnswers.filter(a => a.selectedOption !== null).length,
    [mockAnswers])

  const mockDomainResults = useMemo(() => {
    const map: Record<string, { correct: number; total: number; subdomain: string }> = {}
    mockQuestions.forEach((q, i) => {
      const key = q.domain
      if (!map[key]) map[key] = { correct: 0, total: 0, subdomain: key }
      map[key].total++
      const ans = mockAnswers[i]
      if (ans?.selectedOption !== null && ans?.selectedOption === q.correct) map[key].correct++
    })
    return map
  }, [mockQuestions, mockAnswers])

  const mockMajorDomainResults = useMemo(() => {
    const map: Record<string, { correct: number; total: number; label: string; color: string }> = {}
    Object.entries(DOMAIN_GROUPS).forEach(([key, grp]) => {
      map[key] = { correct: 0, total: 0, label: grp.label, color: grp.color }
    })
    mockQuestions.forEach((q, i) => {
      const majorKey = q.domain.split(' ')[0].split('.').slice(0,2).join('.').replace(/\.\d$/,'') + '.0'
      // e.g. "1.1" → "1.0"
      const parts = q.domain.split('.')
      const domKey = parts[0] + '.0'
      if (map[domKey]) {
        map[domKey].total++
        const ans = mockAnswers[i]
        if (ans?.selectedOption !== null && ans?.selectedOption === q.correct) map[domKey].correct++
      }
    })
    return map
  }, [mockQuestions, mockAnswers])

  // ── Initialise domains ───────────────────────────────────────────────────────
  useEffect(() => { setSelectedDomains(allDomains) }, [allDomains])

  // ── Regular quiz timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'playing' || !startTime) return
    const interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [gameMode, startTime])

  // ── Mock exam countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gameMode !== 'mock-exam' || !mockStartTime || mockSubmitted) return
    timerRef.current = setInterval(() => {
      setMockTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setMockTimedOut(true)
          setMockSubmitted(true)
          setGameMode('mock-complete')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameMode, mockStartTime, mockSubmitted])

  // ── Helpers ───────────────────────────────────────────────────────────────────
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function formatCountdown(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    return `${m}:${s.toString().padStart(2,'0')}`
  }

  function getLetterLabel(index: number): string { return ['A','B','C','D'][index] }

  function getDifficultyColor(difficulty?: string) {
    switch (difficulty) {
      case 'beginner':     return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
      case 'advanced':     return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      default:             return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  function getScoreRating(pct: number): { label: string; color: string } {
    if (pct >= 90) return { label: 'Excellent! Ready to certify 🚀',        color: 'text-green-600 dark:text-green-400' }
    if (pct >= 75) return { label: 'Great job! Keep it up 💪',               color: 'text-blue-600 dark:text-blue-400' }
    if (pct >= 60) return { label: 'Good effort — review weak areas',        color: 'text-yellow-600 dark:text-yellow-400' }
    return             { label: "Keep studying — you'll get there!",          color: 'text-red-600 dark:text-red-400' }
  }

  function getDomainAccentClass(color: string) {
    const map: Record<string, string> = {
      blue:   'bg-blue-500',
      purple: 'bg-purple-500',
      teal:   'bg-teal-500',
      orange: 'bg-orange-500',
      green:  'bg-green-500',
    }
    return map[color] ?? 'bg-gray-500'
  }

  function getTimerColorClass() {
    if (mockTimeLeft > 10 * 60) return 'text-foreground'
    if (mockTimeLeft > 5  * 60) return 'text-yellow-500 dark:text-yellow-400'
    return 'text-red-500 dark:text-red-400 animate-pulse'
  }

  // ── Build proportional mock exam question set ─────────────────────────────────
  function buildMockExamQuestions(): QuizQuestion[] {
    const bySubdomain: Record<string, QuizQuestion[]> = {}
    for (const q of game.questions) {
      if (!bySubdomain[q.domain]) bySubdomain[q.domain] = []
      bySubdomain[q.domain].push(q)
    }

    const result: QuizQuestion[] = []
    const warnings: string[] = []

    for (const [subdomain, target] of Object.entries(MOCK_EXAM_ALLOCATIONS)) {
      const pool = bySubdomain[subdomain] ?? []
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, target)
      if (picked.length < target) {
        warnings.push(`${subdomain}: needed ${target}, got ${picked.length}`)
      }
      result.push(...picked)
    }

    // Final shuffle of the combined 100-question set
    return result.sort(() => Math.random() - 0.5)
  }

  // ── Regular quiz actions ──────────────────────────────────────────────────────
  function startGame() {
    const pool = game.questions.filter(q =>
      selectedDomains.length === 0 || selectedDomains.includes(q.domain))
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
    setUserAnswers(prev => [...prev, { questionId: currentQuestion.id, selectedOption: optionIndex, isCorrect, timeSpent }])
  }

  function handleNext() {
    if (isLastQuestion) { setTotalTime(elapsedTime); setGameMode('complete'); return }
    setCurrentIndex(prev => prev + 1)
    setSelectedOption(null)
    setIsAnswered(false)
    setShowExplanation(false)
    setQuestionStartTime(Date.now())
  }

  function restartGame() {
    setGameMode('config')
    setSelectedDomains(allDomains)
    setQuestionCount(10)
    setShuffleQuestions(true)
  }

  function toggleDomain(domain: string) {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain])
  }

  // ── Mock exam actions ─────────────────────────────────────────────────────────
  function startMockExam() {
    const questions = buildMockExamQuestions()
    setMockQuestions(questions)
    setMockCurrentIndex(0)
    setMockAnswers(questions.map(() => ({ selectedOption: null })))
    setMockFlagged(new Set())
    setMockTimeLeft(MOCK_EXAM_DURATION_SECONDS)
    setMockSubmitted(false)
    setMockTimedOut(false)
    setShowSubmitConfirm(false)
    const now = Date.now()
    setMockStartTime(now)
    setGameMode('mock-exam')
  }

  function handleMockSelect(optionIndex: number) {
    setMockAnswers(prev => {
      const next = [...prev]
      next[mockCurrentIndex] = { selectedOption: optionIndex }
      return next
    })
  }

  function toggleMockFlag(index: number) {
    setMockFlagged(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  function submitMockExam() {
    if (timerRef.current) clearInterval(timerRef.current)
    setMockSubmitted(true)
    setShowSubmitConfirm(false)
    setGameMode('mock-complete')
  }

  function restartMockExam() {
    setGameMode('mock-config')
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MAIN CONFIG SCREEN
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

          {/* Mode cards */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            {/* Practice Quiz Card */}
            <div className="bg-card border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1">Practice Quiz</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your domains, question count, and get instant feedback after each answer. Perfect for focused study sessions.
                  </p>

                  {/* Domain filter */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3 h-3" /> Domains
                      </span>
                      <button
                        onClick={() => selectedDomains.length === allDomains.length
                          ? setSelectedDomains([])
                          : setSelectedDomains(allDomains)}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedDomains.length === allDomains.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allDomains.map(domain => (
                        <button
                          key={domain}
                          onClick={() => toggleDomain(domain)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                            selectedDomains.includes(domain)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary'
                          }`}
                        >
                          {domain}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{availableCount} questions available</p>
                  </div>

                  {/* Question count */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Target className="w-3 h-3" /> Questions
                      </span>
                      <input
                        type="range"
                        min={5}
                        max={Math.min(availableCount, 100)}
                        step={5}
                        value={Math.min(questionCount, availableCount)}
                        onChange={e => setQuestionCount(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="font-bold text-xl w-8 text-right">{Math.min(questionCount, availableCount)}</span>
                    </div>
                  </div>

                  {/* Shuffle */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Shuffle className="w-3 h-3" /> Shuffle
                    </span>
                    <button
                      onClick={() => setShuffleQuestions(prev => !prev)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${shuffleQuestions ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${shuffleQuestions ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <button
                    onClick={startGame}
                    disabled={selectedDomains.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Start Practice — {Math.min(questionCount, availableCount)} Questions
                  </button>
                </div>
              </div>
            </div>

            {/* Mock Exam Card */}
            <div className="bg-card border-2 border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-900/10 dark:to-orange-900/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">Mock Exam</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-wider">
                        Exam Simulation
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Simulates the real COF-C03 exam: 100 questions, 115-minute countdown, proportional domain sampling. No feedback until you submit — just like the real thing.
                    </p>

                    {/* Exam specs grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { icon: ClipboardList, label: '100 questions', sub: 'Fixed exam length' },
                        { icon: Clock,         label: '115 minutes',   sub: 'Timed countdown' },
                        { icon: BarChart3,     label: '5 domains',     sub: 'Proportional sampling' },
                        { icon: Trophy,        label: '75% to pass',   sub: 'Official threshold' },
                      ].map(({ icon: Icon, label, sub }) => (
                        <div key={label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/60 dark:bg-white/5 border border-amber-100 dark:border-amber-800/40">
                          <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-bold">{label}</div>
                            <div className="text-xs text-muted-foreground">{sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Domain allocation preview */}
                    <div className="mb-4 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-amber-100 dark:border-amber-800/40">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Exam Blueprint</p>
                      <div className="space-y-1.5">
                        {Object.entries(DOMAIN_GROUPS).map(([key, grp]) => {
                          const total = Object.entries(MOCK_EXAM_ALLOCATIONS)
                            .filter(([k]) => k.startsWith(key[0]))
                            .reduce((s, [,v]) => s + v, 0)
                          const pct = total
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getDomainAccentClass(grp.color)}`} />
                              <span className="text-xs text-foreground/70 flex-1 truncate">{grp.label}</span>
                              <span className="text-xs font-bold flex-shrink-0 w-16 text-right">{total} Qs ({pct}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => setGameMode('mock-config')}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Start Mock Exam
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MOCK EXAM CONFIG SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'mock-config') {
    // Calculate actual available questions per sub-domain
    const bySubdomain: Record<string, number> = {}
    for (const q of game.questions) {
      bySubdomain[q.domain] = (bySubdomain[q.domain] ?? 0) + 1
    }
    const gaps = Object.entries(MOCK_EXAM_ALLOCATIONS).filter(([sd, need]) => (bySubdomain[sd] ?? 0) < need)

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setGameMode('config')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Mock Exam</h1>
            <p className="text-muted-foreground">COF-C03 Exam Simulation</p>
          </div>

          {/* Rules */}
          <div className="bg-card border rounded-2xl p-6 mb-6 space-y-4">
            <h3 className="font-bold text-lg">Exam Rules</h3>
            <div className="space-y-3">
              {[
                { icon: ClipboardList, text: '100 questions drawn proportionally from all 5 exam domains' },
                { icon: Clock,         text: '115 minutes to complete — the timer counts down from the moment you start' },
                { icon: AlertTriangle, text: 'No answer feedback during the exam — results are shown only after submission' },
                { icon: Flag,          text: 'You can flag questions for review and navigate freely between all questions' },
                { icon: RotateCcw,     text: 'You can change any answer before submitting' },
                { icon: Trophy,        text: '75% or higher is a passing score, matching the official exam threshold' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground/80">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Domain allocation table */}
          <div className="bg-card border rounded-2xl p-6 mb-6">
            <h3 className="font-bold mb-4">Domain Allocation — 100 Questions</h3>
            <div className="space-y-4">
              {Object.entries(DOMAIN_GROUPS).map(([domKey, grp]) => {
                const subs = Object.entries(MOCK_EXAM_ALLOCATIONS).filter(([k]) => k.startsWith(domKey[0]))
                const domTotal = subs.reduce((s, [,v]) => s + v, 0)
                return (
                  <div key={domKey}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getDomainAccentClass(grp.color)}`} />
                        <span className="text-sm font-semibold">{grp.label}</span>
                      </div>
                      <span className="text-sm font-bold">{domTotal} Qs</span>
                    </div>
                    <div className="ml-5 space-y-1">
                      {subs.map(([sd, count]) => {
                        const available = bySubdomain[sd] ?? 0
                        const hasGap = available < count
                        return (
                          <div key={sd} className="flex items-center justify-between text-xs">
                            <span className={`text-muted-foreground ${hasGap ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                              {sd}
                            </span>
                            <span className={`font-medium ${hasGap ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                              {count} needed · {available} available{hasGap ? ' ⚠' : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {gaps.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> Some sub-domains have fewer questions than the ideal allocation. Available questions will be used and the exam will have slightly fewer than 100 questions for those sub-domains.
              </div>
            )}
          </div>

          <button
            onClick={startMockExam}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5" />
            Begin Exam — 115:00
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MOCK EXAM SCREEN
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'mock-exam' && mockQuestions.length > 0) {
    const mq        = mockQuestions[mockCurrentIndex]
    const ma        = mockAnswers[mockCurrentIndex]
    const isFlagged = mockFlagged.has(mockCurrentIndex)
    const unanswered = mockAnswers.filter(a => a.selectedOption === null).length
    const timerPct  = (mockTimeLeft / MOCK_EXAM_DURATION_SECONDS) * 100

    return (
      <div className="container-custom py-6">
        <div className="max-w-3xl mx-auto">

          {/* ── Top bar ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-4 gap-4">
            {/* Left: question counter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">
                {mockCurrentIndex + 1} <span className="text-muted-foreground font-normal">/ {mockQuestions.length}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {mockAnsweredCount} answered · {unanswered} remaining · {mockFlagged.size} flagged
              </span>
            </div>

            {/* Center: timer */}
            <div className={`flex items-center gap-1.5 font-mono font-bold text-xl tabular-nums ${getTimerColorClass()}`}>
              <Clock className="w-5 h-5" />
              {formatCountdown(mockTimeLeft)}
            </div>

            {/* Right: submit */}
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              Submit
            </button>
          </div>

          {/* Timer progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                timerPct > 30 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${timerPct}%` }}
            />
          </div>

          {/* Domain badge + flag button */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {mq.domain}
            </span>
            <button
              onClick={() => toggleMockFlag(mockCurrentIndex)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                isFlagged
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
                  : 'text-muted-foreground border-border hover:border-amber-400 hover:text-amber-600'
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
              {isFlagged ? 'Flagged' : 'Flag for review'}
            </button>
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mq.id + mockCurrentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-card border rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-semibold leading-relaxed mb-6">{mq.question}</h2>

              <div className="space-y-3">
                {mq.options.map((option, idx) => {
                  const isSelected = ma?.selectedOption === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => handleMockSelect(idx)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-150 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-border bg-background hover:border-amber-400 hover:bg-muted/40 cursor-pointer'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {getLetterLabel(idx)}
                      </span>
                      <span className="flex-1 font-medium">{option}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              <p className="mt-4 text-xs text-center text-muted-foreground">
                Answers are not revealed during the exam — submit to see results.
              </p>
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setMockCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={mockCurrentIndex === 0}
              className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setMockCurrentIndex(prev => Math.min(mockQuestions.length - 1, prev + 1))}
              disabled={mockCurrentIndex === mockQuestions.length - 1}
              className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── Question grid navigator ────────────────────────────────────── */}
          <div className="bg-card border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Question Navigator
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mockQuestions.map((_, i) => {
                const answered = mockAnswers[i]?.selectedOption !== null
                const flagged  = mockFlagged.has(i)
                const active   = i === mockCurrentIndex
                return (
                  <button
                    key={i}
                    onClick={() => setMockCurrentIndex(i)}
                    title={`Q${i+1}${flagged ? ' (flagged)' : ''}${!answered ? ' (unanswered)' : ''}`}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      active   ? 'ring-2 ring-offset-1 ring-amber-500 scale-110 z-10 relative' : ''
                    } ${
                      flagged  ? 'bg-amber-400 text-white'
                      : answered ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {flagged ? '⚑' : i + 1}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" /> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-muted" /> Unanswered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400" /> Flagged
              </span>
            </div>
          </div>
        </div>

        {/* ── Submit confirmation modal ──────────────────────────────────────── */}
        <AnimatePresence>
          {showSubmitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                    <CheckSquare className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Submit Exam?</h3>
                  {unanswered > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You have <strong className="text-amber-600">{unanswered} unanswered</strong> question{unanswered > 1 ? 's' : ''}.
                      Unanswered questions are marked incorrect.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      All {mockQuestions.length} questions answered. Ready to submit?
                    </p>
                  )}
                  {mockFlagged.size > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      {mockFlagged.size} question{mockFlagged.size > 1 ? 's' : ''} still flagged for review.
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border font-semibold hover:bg-muted transition-colors"
                  >
                    Review More
                  </button>
                  <button
                    onClick={submitMockExam}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity"
                  >
                    Submit Now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MOCK EXAM COMPLETE
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'mock-complete') {
    const rating = getScoreRating(mockAccuracy)
    const timeUsed = MOCK_EXAM_DURATION_SECONDS - mockTimeLeft
    const reviewList = mockReviewMode === 'wrong'
      ? mockQuestions.map((q, i) => ({ q, i })).filter(({ i }) => mockAnswers[i]?.selectedOption !== q.correct)
      : mockReviewMode === 'flagged'
      ? mockQuestions.map((q, i) => ({ q, i })).filter(({ i }) => mockFlagged.has(i))
      : mockQuestions.map((q, i) => ({ q, i }))
    const isReviewing = mockReviewIndex >= 0 && mockReviewIndex < reviewList.length

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">

          {/* Pass / Fail header */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center mb-8"
          >
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 shadow-lg ${
              mockPassed
                ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                : 'bg-gradient-to-br from-red-400 to-rose-600'
            }`}>
              {mockPassed ? <Trophy className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
            </div>

            {mockTimedOut && (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 mb-3">
                <Clock className="w-3.5 h-3.5" /> Time expired — auto-submitted
              </div>
            )}

            <div className={`text-3xl font-black mb-1 px-5 py-2 rounded-full inline-block ${
              mockPassed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {mockPassed ? '✓ PASS' : '✗ FAIL'}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">Passing score: 75% · Official COF-C03 threshold</p>
          </motion.div>

          {/* Score card */}
          <div className="bg-card border rounded-2xl p-6 mb-6">
            {/* Big score */}
            <div className="text-center mb-6 pb-6 border-b">
              <div className={`text-7xl font-black mb-1 bg-gradient-to-r bg-clip-text text-transparent ${
                mockPassed ? 'from-green-500 to-emerald-400' : 'from-red-500 to-rose-400'
              }`}>
                {mockAccuracy}%
              </div>
              <p className="text-muted-foreground">
                {mockScore} correct out of {mockQuestions.length} questions
              </p>
              <p className={`text-sm font-semibold mt-1 ${rating.color}`}>{rating.label}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { val: mockScore,                     label: 'Correct',   cls: 'text-green-600 dark:text-green-400' },
                { val: mockQuestions.length - mockScore, label: 'Incorrect', cls: 'text-red-500' },
                { val: mockAnswers.filter(a => a.selectedOption === null).length, label: 'Skipped', cls: 'text-muted-foreground' },
                { val: formatTime(timeUsed),          label: 'Time used', cls: '' },
              ].map(({ val, label, cls }) => (
                <div key={label} className="text-center">
                  <div className={`text-2xl font-bold ${cls}`}>{val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Major domain breakdown */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                Domain Breakdown
              </h3>
              <div className="space-y-3">
                {Object.entries(mockMajorDomainResults).map(([domKey, { correct, total, label, color }]) => {
                  if (total === 0) return null
                  const pct = Math.round((correct / total) * 100)
                  return (
                    <div key={domKey}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getDomainAccentClass(color)}`} />
                          <span className="text-foreground/80 truncate pr-2">{label}</span>
                        </div>
                        <span className={`font-semibold flex-shrink-0 ${
                          pct >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                        }`}>
                          {correct}/{total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
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
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => { setMockReviewMode('all'); setMockReviewIndex(0); setGameMode('mock-complete') }}
              className="py-3 rounded-xl border-2 font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Review All Answers
            </button>
            <button
              onClick={restartMockExam}
              className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Exam
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => { setMockReviewMode('wrong'); setMockReviewIndex(0) }}
              className="py-2.5 rounded-xl border font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4 text-red-500" />
              Review Incorrect ({mockQuestions.length - mockScore})
            </button>
            <button
              onClick={() => { setMockReviewMode('flagged'); setMockReviewIndex(0) }}
              className="py-2.5 rounded-xl border font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <Flag className="w-4 h-4 text-amber-500" />
              Review Flagged ({mockFlagged.size})
            </button>
          </div>

          {/* Inline answer review */}
          {reviewList.length > 0 && (
            <div className="bg-card border rounded-2xl overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex gap-2">
                  {(['all','wrong','flagged'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setMockReviewMode(mode); setMockReviewIndex(0) }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                        mockReviewMode === mode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mode === 'all' ? `All (${mockQuestions.length})` : mode === 'wrong' ? `Wrong (${mockQuestions.length - mockScore})` : `Flagged (${mockFlagged.size})`}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{mockReviewIndex + 1} / {reviewList.length}</span>
              </div>

              {isReviewing && (() => {
                const { q, i } = reviewList[mockReviewIndex]
                const ans = mockAnswers[i]
                const wasCorrect = ans?.selectedOption === q.correct
                return (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={q.id + mockReviewIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="p-5"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        {wasCorrect
                          ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        }
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">Q{i+1}</span>
                            {mockFlagged.has(i) && (
                              <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                                <Flag className="w-3 h-3 fill-current" /> Flagged
                              </span>
                            )}
                          </div>
                          <p className="font-semibold leading-relaxed">{q.question}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {q.options.map((option, idx) => {
                          const isCorrect  = idx === q.correct
                          const wasSelected = ans?.selectedOption === idx
                          let cls = 'border-border bg-background opacity-50'
                          if (isCorrect)    cls = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          else if (wasSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          return (
                            <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${cls}`}>
                              <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                                isCorrect ? 'bg-green-500 text-white'
                                : wasSelected ? 'bg-red-500 text-white'
                                : 'bg-muted text-muted-foreground'
                              }`}>{getLetterLabel(idx)}</span>
                              <span className="flex-1 text-sm font-medium">{option}</span>
                              {isCorrect    && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                              {wasSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            </div>
                          )
                        })}
                      </div>

                      {ans?.selectedOption === null && (
                        <div className="mb-3 text-xs font-medium text-muted-foreground italic">— Question was not answered</div>
                      )}

                      <div className="rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Explanation</p>
                        <p className="text-sm text-foreground/80">{q.explanation}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )
              })()}

              {/* Review pagination */}
              <div className="p-4 border-t flex gap-3">
                <button
                  onClick={() => setMockReviewIndex(prev => Math.max(0, prev - 1))}
                  disabled={mockReviewIndex === 0}
                  className="flex-1 py-2.5 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() => setMockReviewIndex(prev => Math.min(reviewList.length - 1, prev + 1))}
                  disabled={mockReviewIndex === reviewList.length - 1}
                  className="flex-1 py-2.5 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

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
  // REGULAR QUIZ — PLAYING
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'playing' && currentQuestion) {
    const progressPct = (currentIndex / activeQuestions.length) * 100

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href={`/${lang}/games`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Exit
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(elapsedTime)}</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4" />{score}/{currentIndex}</span>
            </div>
          </div>

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

          <div className="mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {currentQuestion.domain}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="bg-card border rounded-2xl p-6 mb-6"
            >
              <h2 className="text-xl font-semibold leading-relaxed mb-6">{currentQuestion.question}</h2>
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx
                  const isCorrect  = idx === currentQuestion.correct
                  let cls = 'border-border bg-background hover:border-primary hover:bg-muted/50 cursor-pointer'
                  if (isAnswered) {
                    if (isCorrect)         cls = 'border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default'
                    else if (isSelected)   cls = 'border-red-500 bg-red-50 dark:bg-red-900/20 cursor-default'
                    else                   cls = 'border-border bg-background opacity-50 cursor-default'
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isAnswered}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${cls}`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isAnswered && isCorrect ? 'bg-green-500 text-white'
                        : isAnswered && isSelected ? 'bg-red-500 text-white'
                        : 'bg-muted text-muted-foreground'
                      }`}>{getLetterLabel(idx)}</span>
                      <span className="flex-1 font-medium">{option}</span>
                      {isAnswered && isCorrect  && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                      {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

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
                        selectedOption === currentQuestion.correct ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                      }`} />
                      <div>
                        <p className={`text-sm font-semibold mb-1 ${
                          selectedOption === currentQuestion.correct ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
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

          {isAnswered && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isLastQuestion ? <><Trophy className="w-5 h-5" /> See Results</> : <>Next Question <ChevronRight className="w-5 h-5" /></>}
            </motion.button>
          )}
          {!isAnswered && (
            <p className="text-center text-xs text-muted-foreground mt-4">Select an answer to continue</p>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // REGULAR QUIZ — COMPLETE
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'complete') {
    const rating = getScoreRating(accuracy)
    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
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

          <div className="bg-card border rounded-2xl p-6 mb-6">
            <div className="text-center mb-6 pb-6 border-b">
              <div className="text-7xl font-black mb-1 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{accuracy}%</div>
              <p className="text-muted-foreground">{score} correct out of {activeQuestions.length} questions</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center"><div className="text-2xl font-bold text-green-600 dark:text-green-400">{score}</div><div className="text-xs text-muted-foreground mt-1">Correct</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-red-500">{activeQuestions.length - score}</div><div className="text-xs text-muted-foreground mt-1">Incorrect</div></div>
              <div className="text-center"><div className="text-2xl font-bold">{formatTime(totalTime)}</div><div className="text-xs text-muted-foreground mt-1">Time</div></div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">Domain Breakdown</h3>
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
                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setGameMode('review')} className="py-3 rounded-xl border-2 font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" /> Review Answers
            </button>
            <button onClick={restartGame} className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
          </div>
          <Link href={`/${lang}/games`} className="block text-center mt-4 text-sm text-muted-foreground hover:text-primary transition-colors">← Back to all games</Link>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // REGULAR QUIZ — REVIEW
  // ══════════════════════════════════════════════════════════════════════════════
  if (gameMode === 'review') {
    const answer   = userAnswers[currentIndex]
    const question = activeQuestions[currentIndex]
    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setGameMode('complete')} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Results
            </button>
            <span className="text-sm text-muted-foreground">{currentIndex + 1} / {activeQuestions.length}</span>
          </div>

          <div className="flex gap-1.5 mb-6 flex-wrap">
            {activeQuestions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${i === currentIndex ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''} ${userAnswers[i]?.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
              >{i + 1}</button>
            ))}
          </div>

          <div className="mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{question.domain}</span>
          </div>

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
                {answer?.isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />}
                <h2 className="text-lg font-semibold leading-relaxed">{question.question}</h2>
              </div>
              <div className="space-y-2">
                {question.options.map((option, idx) => {
                  const isCorrect  = idx === question.correct
                  const wasSelected = answer?.selectedOption === idx
                  let cls = 'border-border bg-background opacity-50'
                  if (isCorrect)    cls = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  else if (wasSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  return (
                    <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border-2 ${cls}`}>
                      <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${isCorrect ? 'bg-green-500 text-white' : wasSelected ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>{getLetterLabel(idx)}</span>
                      <span className="flex-1 text-sm font-medium">{option}</span>
                      {isCorrect    && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      {wasSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">💡 Explanation</p>
                <p className="text-sm text-foreground/80">{question.explanation}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3">
            <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={() => setCurrentIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))} disabled={currentIndex === activeQuestions.length - 1} className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={restartGame} className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Play Again
            </button>
            <Link href={`/${lang}/games`} className="py-3 rounded-xl border font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2">
              More Games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}