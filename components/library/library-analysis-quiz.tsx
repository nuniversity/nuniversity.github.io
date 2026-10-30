'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { readJson, writeJson } from '@/lib/storage/safe-storage'
import type { LibraryAnalysisQuestion } from '@/lib/library/types'

interface LibraryAnalysisQuizProps {
  analysisId: string
  questions: LibraryAnalysisQuestion[]
  dict: any
}

interface StoredProgress {
  answers: Record<string, number>
  score: number
  total: number
  passed: boolean
  completedAt: string
}

const PASS_RATIO = 0.7

function progressKey(id: string) {
  return `v1:library-analysis-progress-${id}`
}

function sanitizeProgress(raw: unknown): StoredProgress | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (typeof value.answers !== 'object' || value.answers === null) return null
  if (typeof value.score !== 'number' || typeof value.total !== 'number') return null
  const answers: Record<string, number> = {}
  for (const [key, answer] of Object.entries(value.answers as Record<string, unknown>)) {
    if (typeof answer === 'number') answers[key] = answer
  }
  return {
    answers,
    score: value.score,
    total: value.total,
    passed: value.passed === true,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : '',
  }
}

export function LibraryAnalysisQuiz({ analysisId, questions, dict }: LibraryAnalysisQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState<StoredProgress | null>(null)

  useEffect(() => {
    setSaved(readJson(progressKey(analysisId), sanitizeProgress))
  }, [analysisId])

  if (questions.length === 0) return null

  const allAnswered = questions.every((question) => answers[question.id] !== undefined)
  const score = questions.reduce(
    (total, question) => total + (answers[question.id] === question.correct ? 1 : 0),
    0
  )
  const passed = score / questions.length >= PASS_RATIO

  const submit = () => {
    if (!allAnswered) return
    const next: StoredProgress = {
      answers,
      score,
      total: questions.length,
      passed,
      completedAt: new Date().toISOString(),
    }
    writeJson(progressKey(analysisId), next)
    setSaved(next)
    setSubmitted(true)
  }

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <section
      className="mt-10 rounded-2xl border bg-card p-5 sm:p-6"
      aria-labelledby="analysis-quiz-title"
      data-testid="analysis-quiz"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="analysis-quiz-title" className="text-xl font-semibold">
            {dict.library?.analysis_quiz || 'Check your understanding'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {dict.library?.analysis_quiz_hint || 'Answer the questions, then reveal the explanations.'}
          </p>
        </div>
        {saved && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              saved.passed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
            }`}
          >
            {dict.library?.best_score || 'Best score'}: {saved.score}/{saved.total}
          </span>
        )}
      </div>

      <ol className="space-y-5">
        {questions.map((question, index) => {
          const selected = answers[question.id]
          const isCorrect = selected === question.correct
          return (
            <li key={question.id} className="rounded-xl border p-4">
              <fieldset>
                <legend className="mb-3 font-medium">
                  {index + 1}. {question.question}
                </legend>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const id = `${question.id}-${optionIndex}`
                    let tone = 'border-border'
                    if (submitted) {
                      if (optionIndex === question.correct) tone = 'border-green-500 bg-green-50 dark:bg-green-950/30'
                      else if (optionIndex === selected) tone = 'border-red-500 bg-red-50 dark:bg-red-950/30'
                    }
                    return (
                      <label
                        key={id}
                        htmlFor={id}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${tone}`}
                      >
                        <input
                          id={id}
                          type="radio"
                          name={question.id}
                          checked={selected === optionIndex}
                          disabled={submitted}
                          onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                          className="mt-0.5"
                        />
                        <span>{option}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {submitted && (
                <div className="mt-3 text-sm" aria-live="polite">
                  <p className={`flex items-center gap-1.5 font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {isCorrect ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isCorrect
                      ? dict.library?.correct || 'Correct'
                      : dict.library?.incorrect || 'Incorrect'}
                  </p>
                  {question.explanation && (
                    <p className="mt-1 text-muted-foreground">{question.explanation}</p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {dict.library?.submit_quiz || 'Check answers'}
          </button>
        ) : (
          <>
            <p className="text-sm font-semibold" aria-live="polite">
              {dict.library?.your_score || 'Your score'}: {score}/{questions.length}
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {dict.library?.try_again || 'Try again'}
            </button>
          </>
        )}
        {!allAnswered && !submitted && (
          <span className="text-xs text-muted-foreground">
            {dict.library?.answer_all || 'Answer every question first.'}
          </span>
        )}
      </div>
    </section>
  )
}
