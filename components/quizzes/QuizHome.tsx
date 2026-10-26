'use client'

import { type Locale } from '@/lib/i18n/config'
import type { QuizData } from '@/lib/quizzes/types'
import { mockExamSize, scaledTargets } from '@/lib/quizzes/draw'
import type { QuizAttempt, QuizBest } from '@/lib/quizzes/storage'
import { PracticeConfig } from './PracticeConfig'
import { AttemptHistory } from './AttemptHistory'
import Link from 'next/link'

interface QuizHomeProps {
  lang: Locale
  quiz: QuizData
  dict: any
  best: QuizBest | null
  history: QuizAttempt[]
  allDomains: string[]
  selectedDomains: string[]
  availableCount: number
  questionCount: number
  shuffle: boolean
  onToggleDomain: (domain: string) => void
  onSelectAllDomains: () => void
  onClearDomains: () => void
  onQuestionCountChange: (count: number) => void
  onShuffleToggle: () => void
  onStartPractice: () => void
  onStartExam: () => void
  onClearHistory: () => void
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

function difficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
    case 'advanced':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

function getDomainAccentClass(color: string): string {
  const map: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
  }
  return map[color] ?? 'bg-gray-500'
}

export function QuizHome({
  lang,
  quiz,
  dict,
  best,
  history,
  allDomains,
  selectedDomains,
  availableCount,
  questionCount,
  shuffle,
  onToggleDomain,
  onSelectAllDomains,
  onClearDomains,
  onQuestionCountChange,
  onShuffleToggle,
  onStartPractice,
  onStartExam,
  onClearHistory,
}: QuizHomeProps) {
  const hasExam = Object.keys(quiz.allocations ?? {}).length > 0
  const totalQuestions = mockExamSize(quiz)
  const targets = scaledTargets(quiz)
  const durationMinutes = Math.round(quiz.durationSeconds / 60)

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/${lang}/quizzes/`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          {dict.quizzes?.back_to_quizzes || 'Back to Quizzes'}
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 mb-4">
            <span className="text-white text-2xl font-bold">Q</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-muted-foreground mb-3">{quiz.description}</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${difficultyColor(quiz.difficulty)}`}>
              {dict.quizzes?.difficulty?.[quiz.difficulty] || quiz.difficulty}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {quiz.certification}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {tpl(dict.quizzes?.home?.questions_total || '{n} questions total', { n: quiz.questions.length })}
            </span>
            {best && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                {`${dict.quizzes?.home?.best_score || 'Best score'}: ${best.percent}%`}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-card border rounded-2xl p-5">
            <PracticeConfig
              dict={dict}
              allDomains={allDomains}
              selectedDomains={selectedDomains}
              availableCount={availableCount}
              questionCount={questionCount}
              shuffle={shuffle}
              onToggleDomain={onToggleDomain}
              onSelectAllDomains={onSelectAllDomains}
              onClearDomains={onClearDomains}
              onQuestionCountChange={onQuestionCountChange}
              onShuffleToggle={onShuffleToggle}
              onStartPractice={onStartPractice}
            />
          </div>

          {hasExam && (
            <div className="bg-card border-2 border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-900/10 dark:to-orange-900/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <span className="text-amber-600 dark:text-amber-400 text-xl font-bold">E</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-lg">
                        {dict.quizzes?.home?.mock_title || 'Mock Exam'}
                      </h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-wider">
                        {dict.quizzes?.home?.exam_simulation || 'Exam Simulation'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {tpl(
                        dict.quizzes?.home?.mock_description ||
                          'Simulates the real {cert} exam: {count} questions, {minutes}-minute countdown, proportional domain sampling. No feedback until you submit — just like the real thing.',
                        { cert: quiz.certification, count: totalQuestions, minutes: durationMinutes }
                      )}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { label: tpl(dict.quizzes?.home?.spec_questions || '{n} questions', { n: totalQuestions }), sub: dict.quizzes?.home?.spec_fixed || 'Fixed exam length' },
                        { label: tpl(dict.quizzes?.home?.spec_minutes || '{n} minutes', { n: durationMinutes }), sub: dict.quizzes?.home?.spec_countdown || 'Timed countdown' },
                        { label: tpl(dict.quizzes?.home?.spec_domains || '{n} domains', { n: quiz.domains.length }), sub: dict.quizzes?.home?.spec_sampling || 'Proportional sampling' },
                        { label: tpl(dict.quizzes?.home?.spec_pass || '{score}% to pass', { score: quiz.passingScore }), sub: dict.quizzes?.home?.spec_threshold || 'Official threshold' },
                      ].map(({ label, sub }) => (
                        <div key={label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/60 dark:bg-white/5 border border-amber-100 dark:border-amber-800/40 min-w-0">
                          <div className="min-w-0">
                            <div className="text-xs font-bold">{label}</div>
                            <div className="text-xs text-muted-foreground truncate">{sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-amber-100 dark:border-amber-800/40">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {dict.quizzes?.home?.exam_blueprint || 'Exam Blueprint'}
                      </p>
                      <div className="space-y-1.5">
                        {quiz.domains.map(d => {
                          const domQuestions = d.subdomains.reduce((s, sd) => s + (targets[sd] ?? 0), 0)
                          const domPct = d.subdomains.reduce((s, sd) => s + (quiz.allocations?.[sd] ?? 0), 0)
                          return (
                            <div key={d.id} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getDomainAccentClass(d.color)}`} />
                              <span className="text-xs text-foreground/70 flex-1 truncate">{d.name}</span>
                              <span className="text-xs font-bold flex-shrink-0 w-24 text-right">
                                {tpl(dict.quizzes?.home?.qs_pct || '{count} Qs ({pct}%)', { count: domQuestions, pct: domPct })}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onStartExam}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      {dict.quizzes?.home?.start_mock || 'Start Mock Exam'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <AttemptHistory
          dict={dict}
          lang={lang}
          history={history}
          best={best}
          onClear={onClearHistory}
        />
      </div>
    </div>
  )
}
