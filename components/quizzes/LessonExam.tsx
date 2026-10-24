'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, CheckCircle2, Clock, Send, XCircle } from 'lucide-react'
import QuestionBlock, { type LessonQuestion } from '@/components/markdown/QuestionBlock'
import { addAttempt } from '@/lib/quizzes/storage'
import { recordAndEmit } from '@/lib/gamification/bus'
import type { Locale } from '@/lib/i18n/config'

interface LessonExamProps {
  lang: Locale
  lessonId: string
  questions: LessonQuestion[]
  examMinutes: number
  dict: any
  children: ReactNode
}

type ExamMode = 'lesson' | 'exam' | 'results'

interface ExamResult {
  correct: number
  total: number
  percent: number
}

function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export default function LessonExam({
  lessonId,
  questions,
  examMinutes,
  dict,
  children,
}: LessonExamProps) {
  const lessonDict = dict?.quizzes?.lesson
  const [mode, setMode] = useState<ExamMode>('lesson')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [remaining, setRemaining] = useState<number>(examMinutes * 60)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)
  const submittedRef = useRef(false)

  const unansweredCount = questions.filter((q) => answers[q.id] === undefined).length
  const answeredCount = questions.length - unansweredCount

  const finishExam = useCallback(
    (finalAnswers: Record<string, number>) => {
      if (submittedRef.current) return
      submittedRef.current = true
      const total = questions.length
      const correct = questions.filter((q) => finalAnswers[q.id] === q.correct).length
      const percent = total > 0 ? Math.round((correct / total) * 100) : 0
      const passed = percent >= 70
      addAttempt(lessonId, {
        date: new Date().toISOString().slice(0, 10),
        mode: 'course-exam',
        score: correct,
        total,
        passed,
      })
      if (passed) {
        recordAndEmit({ type: 'quiz-pass', quizSlug: lessonId, percent, mode: 'course-exam' })
      }
      setResult({ correct, total, percent })
      setConfirmOpen(false)
      setMode('results')
    },
    [lessonId, questions]
  )

  useEffect(() => {
    if (mode !== 'exam') return undefined
    const intervalId = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [mode])

  useEffect(() => {
    if (mode === 'exam' && remaining === 0) {
      finishExam(answers)
    }
  }, [mode, remaining, answers, finishExam])

  const handleStart = () => {
    submittedRef.current = false
    setAnswers({})
    setResult(null)
    setConfirmOpen(false)
    setRemaining(examMinutes * 60)
    setMode('exam')
  }

  const handleExit = () => {
    submittedRef.current = false
    setAnswers({})
    setResult(null)
    setConfirmOpen(false)
    setMode('lesson')
  }

  const handleAnswer = (id: string, index: number) => {
    setAnswers((prev) => ({ ...prev, [id]: index }))
  }

  const scrollToQuestion = (index: number) => {
    document.getElementById(`q-${index}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  if (mode === 'exam') {
    const timerUrgent = remaining < 60

    return (
      <div className="w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div
            className={`flex items-center gap-2 font-mono font-bold text-xl whitespace-nowrap tabular-nums ${
              timerUrgent ? 'text-red-500 dark:text-red-400' : 'text-foreground'
            }`}
          >
            <Clock className="w-5 h-5 flex-shrink-0" />
            <span>{formatClock(remaining)}</span>
            <span className="font-sans text-xs font-normal text-muted-foreground">
              {lessonDict?.time_remaining || 'Time remaining'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Send className="w-4 h-4" />
            {lessonDict?.submit || 'Submit Exam'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr] items-start">
          <nav className="lg:sticky lg:top-24 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {dict?.quizzes?.exam?.navigator || 'Question Navigator'}
            </p>
            <div className="grid grid-cols-8 sm:grid-cols-12 lg:grid-cols-4 gap-1.5">
              {questions.map((question, index) => {
                const isAnswered = answers[question.id] !== undefined
                const stateLabel = isAnswered
                  ? dict?.quizzes?.exam?.answered || 'Answered'
                  : lessonDict?.unanswered || 'Unanswered'
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => scrollToQuestion(index)}
                    aria-label={`${index + 1} — ${stateLabel}`}
                    title={`${index + 1} — ${stateLabel}`}
                    className={`h-9 rounded-lg text-xs font-bold border transition-colors ${
                      isAnswered
                        ? 'bg-primary/15 border-primary/40 text-primary hover:bg-primary/25'
                        : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground tabular-nums">
              {answeredCount}/{questions.length}
            </p>
          </nav>

          <div className="min-w-0 space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} id={`q-${index}`} className="scroll-mt-24 min-w-0">
                <QuestionBlock
                  data={question}
                  dict={dict}
                  reveal={false}
                  onAnswer={handleAnswer}
                  key={question.id}
                />
              </div>
            ))}
          </div>
        </div>

        {confirmOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            role="dialog"
            aria-modal="true"
            aria-label={lessonDict?.confirm_title || 'Submit exam?'}
          >
            <div className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold mb-2 break-words min-w-0">
                {lessonDict?.confirm_title || 'Submit exam?'}
              </h3>
              <p className="text-sm text-muted-foreground break-words min-w-0">
                {lessonDict?.confirm_body || 'Unanswered questions count as incorrect.'}
              </p>
              <p className="text-sm font-medium mt-3 break-words min-w-0">
                {`${unansweredCount} ${lessonDict?.unanswered || 'Unanswered'}`}
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border font-semibold hover:bg-muted transition-colors"
                >
                  {dict?.common?.cancel || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => finishExam(answers)}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
                >
                  {lessonDict?.submit || 'Submit Exam'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (mode === 'results' && result) {
    const typeTotals: Record<string, { correct: number; total: number }> = {}
    for (const question of questions) {
      const bucket = typeTotals[question.type] ?? { correct: 0, total: 0 }
      bucket.total += 1
      if (answers[question.id] === question.correct) bucket.correct += 1
      typeTotals[question.type] = bucket
    }

    return (
      <div className="w-full min-w-0 space-y-6">
        <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-2 break-words min-w-0">
            {lessonDict?.complete_title || 'Exam Complete'}
          </h2>
          <p className="font-mono tabular-nums font-bold text-3xl text-primary mb-3 whitespace-nowrap">
            {result.correct}/{result.total}
            <span className="text-lg text-muted-foreground font-normal">
              {' '}
              · {result.percent}%
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="break-words">{lessonDict?.saved || 'Attempt saved to your history'}</span>
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-3 break-words min-w-0">
            {lessonDict?.breakdown || 'Breakdown by type'}
          </h3>
          <ul className="space-y-2">
            {Object.entries(typeTotals).map(([type, bucket]) => (
              <li key={type} className="flex items-center justify-between gap-3 text-sm min-w-0">
                <span className="break-words min-w-0">{type}</span>
                <span className="font-semibold tabular-nums flex-shrink-0">
                  {bucket.correct}/{bucket.total}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border bg-card p-5 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 break-words min-w-0">
            {lessonDict?.review || 'Review answers'}
          </h3>
          <ol className="space-y-6">
            {questions.map((question, index) => {
              const picked = answers[question.id]
              return (
                <li key={question.id} className="min-w-0">
                  <div className="flex items-start gap-2 mb-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground flex-shrink-0 mt-1">
                      Q{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground leading-relaxed break-words">
                        {question.question}
                      </p>
                      {picked === undefined && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {lessonDict?.unanswered || 'Unanswered'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:ml-7">
                    {question.options.map((option, optionIndex) => {
                      const isCorrectOption = optionIndex === question.correct
                      const isPicked = picked === optionIndex
                      const rowVariant = isCorrectOption
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100'
                        : isPicked
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100'
                        : 'border-border text-foreground/90'
                      return (
                        <div
                          key={optionIndex}
                          className={`flex items-start gap-2 p-2 rounded-lg border min-w-0 ${rowVariant}`}
                        >
                          <span className="flex-shrink-0 w-5 h-5 mt-0.5">
                            {isCorrectOption ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : isPicked ? (
                              <XCircle className="w-5 h-5 text-red-600" />
                            ) : null}
                          </span>
                          <span className="text-sm leading-relaxed break-words min-w-0">{option}</span>
                        </div>
                      )
                    })}
                  </div>
                  {question.explanation && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed break-words min-w-0 sm:ml-7">
                      {question.explanation}
                    </p>
                  )}
                </li>
              )
            })}
          </ol>
          <button
            type="button"
            onClick={handleExit}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {lessonDict?.exit || 'Back to lesson'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 rounded-xl border bg-card p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="break-words min-w-0 tabular-nums">
              {examMinutes} min
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-1 break-words min-w-0">
            {lessonDict?.start_hint || 'Answer every question — you can navigate freely and the timer counts down.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex-shrink-0"
        >
          <Clock className="w-4 h-4" />
          {lessonDict?.start || 'Start Exam'}
        </button>
      </div>
      {children}
    </div>
  )
}
