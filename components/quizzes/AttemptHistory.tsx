'use client'

import { Trash2, Trophy } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import type { QuizAttempt, QuizBest } from '@/lib/quizzes/storage'

interface AttemptHistoryProps {
  dict: any
  lang: Locale
  history: QuizAttempt[]
  best: QuizBest | null
  onClear: () => void
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

function modeLabel(dict: any, mode: QuizAttempt['mode']): string {
  if (mode === 'exam') return dict.quizzes?.history?.mode_exam || 'Exam'
  if (mode === 'course-exam') return dict.quizzes?.history?.mode_course_exam || 'Course Exam'
  return dict.quizzes?.history?.mode_practice || 'Practice'
}

export function AttemptHistory({ dict, lang, history, best, onClear }: AttemptHistoryProps) {
  return (
    <div className="bg-card border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          {dict.quizzes?.history?.title || 'Attempt History'}
        </h3>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {dict.quizzes?.history?.clear || 'Clear history'}
          </button>
        )}
      </div>

      {best && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-semibold">
            {`${dict.quizzes?.history?.best || 'Best'}: ${best.percent}%`}
          </span>
          <span className="text-xs text-muted-foreground">
            {best.passed
              ? dict.quizzes?.history?.passed || 'Passed'
              : dict.quizzes?.history?.failed || 'Failed'}
          </span>
        </div>
      )}

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {dict.quizzes?.history?.empty ||
            'No attempts yet: complete a quiz to build your history.'}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {history.length === 1
              ? dict.quizzes?.history?.attempts_one || '1 attempt'
              : tpl(dict.quizzes?.history?.attempts_other || '{n} attempts', { n: history.length })}
          </p>
          {history.map((attempt, i) => {
            const percent = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0
            let dateLabel = attempt.date
            try {
              dateLabel = new Date(attempt.date).toLocaleDateString(lang, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            } catch {
              dateLabel = attempt.date
            }
            return (
              <div
                key={`${attempt.date}-${i}`}
                className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border/50 last:border-0 min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      attempt.passed
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {attempt.passed
                      ? dict.quizzes?.history?.passed || 'Passed'
                      : dict.quizzes?.history?.failed || 'Failed'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {modeLabel(dict, attempt.mode)}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{dateLabel}</span>
                  <span className="font-semibold text-sm">{percent}%</span>
                  <span className="text-xs text-muted-foreground">
                    {attempt.score}/{attempt.total}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
