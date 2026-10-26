'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { type Locale } from '@/lib/i18n/config'
import type { QuizData, QuizQuestion, QuizResponse, UserAnswer } from '@/lib/quizzes/types'
import { emptyResponse, gradeAnswer, isAnswered } from '@/lib/quizzes/grade'
import { drawMockQuestions, scaledTargets } from '@/lib/quizzes/draw'
import { addAttempt, getBest, getHistory, type QuizAttempt, type QuizBest } from '@/lib/quizzes/storage'
import { recordAndEmit } from '@/lib/gamification/bus'
import { QuizHome } from './QuizHome'
import { QuizPlayer, type QuizTileState } from './QuizPlayer'
import { ExamRunner } from './ExamRunner'
import { ScoreReport } from './ScoreReport'

export type QuizMode = 'config' | 'playing' | 'review' | 'complete' | 'mock-config' | 'mock-exam' | 'mock-complete'

interface QuizDetailProps {
  lang: Locale
  quiz: QuizData
  dict: any
}

export function QuizDetail({ lang, quiz, dict }: QuizDetailProps) {
  const [gameMode, setGameMode] = useState<QuizMode>('config')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [questionCount, setQuestionCount] = useState(10)
  const [shuffleQuestions, setShuffleQuestions] = useState(true)

  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, QuizResponse>>({})
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [totalTime, setTotalTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  const [mockQuestions, setMockQuestions] = useState<QuizQuestion[]>([])
  const [mockCurrentIndex, setMockCurrentIndex] = useState(0)
  const [mockAnswers, setMockAnswers] = useState<QuizResponse[]>([])
  const [mockFlagged, setMockFlagged] = useState<Set<number>>(new Set())
  const [mockTimeLeft, setMockTimeLeft] = useState(quiz.durationSeconds)
  const [mockStartTime, setMockStartTime] = useState<number | null>(null)
  const [mockSubmitted, setMockSubmitted] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [mockTimedOut, setMockTimedOut] = useState(false)
  const [mockReviewIndex, setMockReviewIndex] = useState(0)
  const [mockReviewMode, setMockReviewMode] = useState<'all' | 'wrong' | 'flagged'>('all')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const persistedRef = useRef(false)

  const [best, setBest] = useState<QuizBest | null>(null)
  const [history, setHistory] = useState<QuizAttempt[]>([])

  useEffect(() => {
    setBest(getBest(quiz.slug))
    setHistory(getHistory(quiz.slug))
  }, [quiz.slug])

  const allDomains = useMemo(() => {
    const domains = Array.from(new Set(quiz.questions.map(q => q.subdomain)))
    return domains.sort()
  }, [quiz.questions])

  const currentQuestion = activeQuestions[currentIndex]
  const isLastQuestion = currentIndex === activeQuestions.length - 1
  const score = useMemo(() => userAnswers.filter(a => a.isCorrect).length, [userAnswers])
  const accuracy = useMemo(() => {
    if (userAnswers.length === 0) return 0
    return Math.round((score / userAnswers.length) * 100)
  }, [score, userAnswers])

  const gradedCount = useMemo(() => {
    let count = 0
    for (const q of activeQuestions) {
      if (q.id in results || isAnswered(q, drafts[q.id] ?? null)) count++
    }
    return count
  }, [activeQuestions, results, drafts])

  const tileStates = useMemo<QuizTileState[]>(() => {
    return activeQuestions.map(q => {
      if (q.id in results) return results[q.id] ? 'correct' : 'wrong'
      const draft = drafts[q.id]
      if (draft && isAnswered(q, draft)) return 'staged'
      return 'blank'
    })
  }, [activeQuestions, results, drafts])

  const availableCount = useMemo(() =>
    quiz.questions.filter(q => selectedDomains.length === 0 || selectedDomains.includes(q.subdomain)).length,
    [quiz.questions, selectedDomains])

  const domainResults = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {}
    for (const answer of userAnswers) {
      if (!map[answer.subdomain]) map[answer.subdomain] = { correct: 0, total: 0 }
      map[answer.subdomain].total++
      if (answer.isCorrect) map[answer.subdomain].correct++
    }
    return map
  }, [userAnswers])

  const mockScore = useMemo(() => {
    return mockQuestions.reduce((count, question, i) => {
      return count + (gradeAnswer(question, mockAnswers[i] ?? null) ? 1 : 0)
    }, 0)
  }, [mockAnswers, mockQuestions])

  const mockAccuracy = useMemo(() =>
    mockQuestions.length === 0 ? 0 : Math.round((mockScore / mockQuestions.length) * 100),
    [mockScore, mockQuestions])

  const mockPassed = mockAccuracy >= quiz.passingScore

  const mockAnsweredCount = useMemo(() =>
    mockQuestions.reduce((count, question, i) => {
      return count + (isAnswered(question, mockAnswers[i] ?? null) ? 1 : 0)
    }, 0),
    [mockAnswers, mockQuestions])

  const mockMajorDomainResults = useMemo(() => {
    const subToDomain: Record<string, { label: string; color: string }> = {}
    quiz.domains.forEach(d => {
      d.subdomains.forEach(sd => {
        subToDomain[sd] = { label: d.name, color: d.color }
      })
    })
    const map: Record<string, { correct: number; total: number; label: string; color: string }> = {}
    quiz.domains.forEach(d => {
      map[d.id] = { correct: 0, total: 0, label: d.name, color: d.color }
    })
    mockQuestions.forEach((q, i) => {
      const domain = subToDomain[q.subdomain]
      if (!domain) return
      const entry = Object.entries(map).find(([, v]) => v.label === domain.label)
      if (!entry) return
      entry[1].total++
      if (gradeAnswer(q, mockAnswers[i] ?? null)) entry[1].correct++
    })
    return map
  }, [mockQuestions, mockAnswers, quiz.domains])

  useEffect(() => { setSelectedDomains(allDomains) }, [allDomains])

  useEffect(() => {
    if (gameMode !== 'playing' || !startTime) return
    const interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [gameMode, startTime])

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

  useEffect(() => {
    if (persistedRef.current) return
    if (gameMode === 'complete' && userAnswers.length > 0) {
      persistedRef.current = true
      const total = userAnswers.length
      const correct = userAnswers.filter(a => a.isCorrect).length
      const percent = total > 0 ? Math.round((correct / total) * 100) : 0
      const answeredAll = userAnswers.length === activeQuestions.length
      const passed = percent >= quiz.passingScore && answeredAll
      const perDomain: Record<string, { correct: number; total: number }> = {}
      Object.entries(domainResults).forEach(([key, value]) => { perDomain[key] = value })
      addAttempt(quiz.slug, {
        date: new Date().toISOString(),
        mode: 'practice',
        score: correct,
        total,
        passed,
        perDomain,
      })
      if (passed) {
        recordAndEmit({ type: 'quiz-pass', quizSlug: quiz.slug, percent, mode: 'practice' })
      }
      setHistory(getHistory(quiz.slug))
      setBest(getBest(quiz.slug))
    }
    if (gameMode === 'mock-complete' && mockSubmitted && mockQuestions.length > 0) {
      persistedRef.current = true
      const perDomain: Record<string, { correct: number; total: number }> = {}
      Object.values(mockMajorDomainResults).forEach(v => {
        if (v.total > 0) perDomain[v.label] = { correct: v.correct, total: v.total }
      })
      addAttempt(quiz.slug, {
        date: new Date().toISOString(),
        mode: 'exam',
        score: mockScore,
        total: mockQuestions.length,
        passed: mockPassed,
        perDomain,
      })
      if (mockPassed) {
        recordAndEmit({
          type: 'quiz-pass',
          quizSlug: quiz.slug,
          percent: mockQuestions.length > 0 ? Math.round((mockScore / mockQuestions.length) * 100) : 0,
          mode: 'exam',
        })
      }
      setHistory(getHistory(quiz.slug))
      setBest(getBest(quiz.slug))
    }
  }, [gameMode, userAnswers, activeQuestions.length, domainResults, mockSubmitted, mockQuestions.length, mockScore, mockPassed, mockMajorDomainResults, quiz])

  function startGame() {
    const pool = quiz.questions.filter(q =>
      selectedDomains.length === 0 || selectedDomains.includes(q.subdomain))
    let selected = shuffleQuestions ? [...pool].sort(() => Math.random() - 0.5) : [...pool]
    selected = selected.slice(0, Math.min(questionCount, pool.length))
    setActiveQuestions(selected)
    setCurrentIndex(0)
    setDrafts({})
    setResults({})
    setUserAnswers([])
    const now = Date.now()
    setStartTime(now)
    setElapsedTime(0)
    setTotalTime(0)
    persistedRef.current = false
    setGameMode('playing')
  }

  function handleBodyChange(response: QuizResponse) {
    if (!currentQuestion) return
    setDrafts(prev => ({ ...prev, [currentQuestion.id]: response }))
  }

  function handleCheck() {
    if (!currentQuestion) return
    const draft = drafts[currentQuestion.id] ?? null
    const response = draft && isAnswered(currentQuestion, draft) ? draft : emptyResponse(currentQuestion)
    const correct = gradeAnswer(currentQuestion, response)
    setDrafts(prev => ({ ...prev, [currentQuestion.id]: response }))
    setResults(prev => ({ ...prev, [currentQuestion.id]: correct }))
  }

  function handleNext() {
    if (isLastQuestion || activeQuestions.length === 0) {
      finishGame()
      return
    }
    setCurrentIndex(prev => prev + 1)
  }

  function finishGame() {
    const answers: UserAnswer[] = []
    for (const question of activeQuestions) {
      const draft = drafts[question.id] ?? null
      if (question.id in results) {
        answers.push({
          questionId: question.id,
          subdomain: question.subdomain,
          response: draft,
          isCorrect: results[question.id],
          timeSpent: 0,
        })
      } else if (draft && isAnswered(question, draft)) {
        answers.push({
          questionId: question.id,
          subdomain: question.subdomain,
          response: draft,
          isCorrect: gradeAnswer(question, draft),
          timeSpent: 0,
        })
      }
    }
    setUserAnswers(answers)
    setTotalTime(elapsedTime)
    setGameMode('complete')
  }

  function restartGame() {
    setGameMode('config')
    setSelectedDomains(allDomains)
    setQuestionCount(10)
    setShuffleQuestions(true)
    setDrafts({})
    setResults({})
    setUserAnswers([])
  }

  function toggleDomain(domain: string) {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain])
  }

  function startMockExam() {
    const questions = drawMockQuestions(quiz)
    setMockQuestions(questions)
    setMockCurrentIndex(0)
    setMockAnswers(questions.map(q => emptyResponse(q)))
    setMockFlagged(new Set())
    setMockTimeLeft(quiz.durationSeconds)
    setMockSubmitted(false)
    setMockTimedOut(false)
    setShowSubmitConfirm(false)
    const now = Date.now()
    setMockStartTime(now)
    persistedRef.current = false
    setGameMode('mock-exam')
  }

  function handleMockChange(response: QuizResponse) {
    setMockAnswers(prev => {
      const next = [...prev]
      next[mockCurrentIndex] = response
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

  if (gameMode === 'config') {
    return (
      <QuizHome
        lang={lang}
        quiz={quiz}
        dict={dict}
        best={best}
        history={history}
        allDomains={allDomains}
        selectedDomains={selectedDomains}
        availableCount={availableCount}
        questionCount={questionCount}
        shuffle={shuffleQuestions}
        onToggleDomain={toggleDomain}
        onSelectAllDomains={() => setSelectedDomains(allDomains)}
        onClearDomains={() => setSelectedDomains([])}
        onQuestionCountChange={setQuestionCount}
        onShuffleToggle={() => setShuffleQuestions(prev => !prev)}
        onStartPractice={startGame}
        onStartExam={() => setGameMode('mock-config')}
        onClearHistory={() => { setHistory([]); setBest(null) }}
      />
    )
  }

  if (gameMode === 'playing') {
    const draft = currentQuestion ? drafts[currentQuestion.id] ?? null : null
    const checked = currentQuestion ? currentQuestion.id in results : false
    return (
      <QuizPlayer
        dict={dict}
        question={currentQuestion}
        index={currentIndex}
        total={activeQuestions.length}
        response={draft}
        checked={checked}
        isCorrect={checked && currentQuestion ? results[currentQuestion.id] : null}
        elapsed={elapsedTime}
        score={score}
        gradedCount={gradedCount}
        tileStates={tileStates}
        onChange={handleBodyChange}
        onCheck={handleCheck}
        onNavigate={setCurrentIndex}
        onNext={handleNext}
        onFinish={finishGame}
        onExit={() => setGameMode('config')}
      />
    )
  }

  if (gameMode === 'mock-config' || gameMode === 'mock-exam') {
    const targets = scaledTargets(quiz)
    return (
      <ExamRunner
        quiz={quiz}
        dict={dict}
        screen={gameMode}
        targets={targets}
        questions={mockQuestions}
        index={mockCurrentIndex}
        answers={mockAnswers}
        flagged={mockFlagged}
        timeLeft={mockTimeLeft}
        answeredCount={mockAnsweredCount}
        showSubmitConfirm={showSubmitConfirm}
        onIndexChange={setMockCurrentIndex}
        onChange={handleMockChange}
        onToggleFlag={toggleMockFlag}
        onOpenSubmit={() => setShowSubmitConfirm(true)}
        onCloseSubmit={() => setShowSubmitConfirm(false)}
        onSubmit={submitMockExam}
        onStart={startMockExam}
        onBack={() => setGameMode('config')}
      />
    )
  }

  if (gameMode === 'complete' || gameMode === 'review' || gameMode === 'mock-complete') {
    return (
      <ScoreReport
        lang={lang}
        quiz={quiz}
        dict={dict}
        screen={gameMode}
        score={score}
        accuracy={accuracy}
        total={userAnswers.length}
        totalTime={totalTime}
        domainResults={domainResults}
        userAnswers={userAnswers}
        reviewIndex={currentIndex}
        onReviewIndexChange={setCurrentIndex}
        activeQuestions={activeQuestions}
        mockScore={mockScore}
        mockAccuracy={mockAccuracy}
        mockPassed={mockPassed}
        mockTimedOut={mockTimedOut}
        timeUsed={quiz.durationSeconds - mockTimeLeft}
        mockQuestions={mockQuestions}
        mockAnswers={mockAnswers}
        mockFlagged={mockFlagged}
        mockMajorDomainResults={mockMajorDomainResults}
        mockReviewMode={mockReviewMode}
        mockReviewIndex={mockReviewIndex}
        onMockReviewModeChange={(mode) => { setMockReviewMode(mode); setMockReviewIndex(0) }}
        onMockReviewIndexChange={setMockReviewIndex}
        onOpenReview={() => setGameMode('review')}
        onBackToResults={() => setGameMode('complete')}
        onRestart={restartGame}
        onRetake={restartMockExam}
      />
    )
  }

  return null
}
