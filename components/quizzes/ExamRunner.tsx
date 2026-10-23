'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, ChevronRight, ChevronLeft, Flag, CheckSquare,
  CheckCircle2, AlertTriangle, ClipboardList, RotateCcw, Trophy, AlertCircle,
} from 'lucide-react'
import type { QuizData, QuizQuestion } from '@/lib/quizzes/types'

interface ExamRunnerProps {
  quiz: QuizData
  dict: any
  screen: 'mock-config' | 'mock-exam'
  questions: QuizQuestion[]
  index: number
  answers: { selectedOption: number | null }[]
  flagged: Set<number>
  timeLeft: number
  answeredCount: number
  showSubmitConfirm: boolean
  onIndexChange: (index: number) => void
  onSelect: (optionIndex: number) => void
  onToggleFlag: (index: number) => void
  onOpenSubmit: () => void
  onCloseSubmit: () => void
  onSubmit: () => void
  onStart: () => void
  onBack: () => void
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getLetterLabel(index: number): string {
  return ['A', 'B', 'C', 'D'][index]
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

function getTimerColorClass(timeLeft: number): string {
  if (timeLeft > 10 * 60) return 'text-foreground'
  if (timeLeft > 5 * 60) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400 animate-pulse'
}

export function ExamRunner({
  quiz,
  dict,
  screen,
  questions,
  index,
  answers,
  flagged,
  timeLeft,
  answeredCount,
  showSubmitConfirm,
  onIndexChange,
  onSelect,
  onToggleFlag,
  onOpenSubmit,
  onCloseSubmit,
  onSubmit,
  onStart,
  onBack,
}: ExamRunnerProps) {
  const allocations = quiz.allocations ?? {}
  const totalQuestions = Object.values(allocations).reduce((s, v) => s + v, 0)
  const durationMinutes = Math.round(quiz.durationSeconds / 60)

  if (screen === 'mock-config') {
    const bySubdomain: Record<string, number> = {}
    for (const q of quiz.questions) {
      bySubdomain[q.subdomain] = (bySubdomain[q.subdomain] ?? 0) + 1
    }
    const gaps = Object.entries(allocations).filter(([sd, need]) => (bySubdomain[sd] ?? 0) < need)

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {dict.common?.back || 'Back'}
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{dict.quizzes?.home?.mock_title || 'Mock Exam'}</h1>
            <p className="text-muted-foreground">
              {tpl(dict.quizzes?.exam?.simulation_for || '{cert} Exam Simulation', { cert: quiz.certification })}
            </p>
          </div>

          <div className="bg-card border rounded-2xl p-6 mb-6 space-y-4">
            <h3 className="font-bold text-lg">{dict.quizzes?.exam?.rules_title || 'Exam Rules'}</h3>
            <div className="space-y-3">
              {[
                { icon: ClipboardList, text: tpl(dict.quizzes?.exam?.rule_drawn || '{count} questions drawn proportionally from all {domains} exam domains', { count: totalQuestions, domains: quiz.domains.length }) },
                { icon: Clock, text: tpl(dict.quizzes?.exam?.rule_timer || '{minutes} minutes to complete — the timer counts down from the moment you start', { minutes: durationMinutes }) },
                { icon: AlertTriangle, text: dict.quizzes?.exam?.rule_no_feedback || 'No answer feedback during the exam — results are shown only after submission' },
                { icon: Flag, text: dict.quizzes?.exam?.rule_flag || 'You can flag questions for review and navigate freely between all questions' },
                { icon: RotateCcw, text: dict.quizzes?.exam?.rule_change || 'You can change any answer before submitting' },
                { icon: Trophy, text: tpl(dict.quizzes?.exam?.rule_pass || '{score}% or higher is a passing score, matching the official exam threshold', { score: quiz.passingScore }) },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground/80 break-words">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 mb-6">
            <h3 className="font-bold mb-4">
              {tpl(dict.quizzes?.exam?.allocation_title || 'Domain Allocation — {count} Questions', { count: totalQuestions })}
            </h3>
            <div className="space-y-4">
              {quiz.domains.map(d => {
                const subs = d.subdomains.filter(sd => sd in allocations)
                const domTotal = subs.reduce((s, sd) => s + (allocations[sd] ?? 0), 0)
                return (
                  <div key={d.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getDomainAccentClass(d.color)}`} />
                        <span className="text-sm font-semibold truncate">{d.name}</span>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0">
                        {tpl(dict.quizzes?.exam?.qs || '{n} Qs', { n: domTotal })}
                      </span>
                    </div>
                    <div className="ml-5 space-y-1">
                      {subs.map(sd => {
                        const available = bySubdomain[sd] ?? 0
                        const target = allocations[sd] ?? 0
                        const hasGap = available < target
                        return (
                          <div key={sd} className="flex items-center justify-between text-xs gap-2">
                            <span className={`min-w-0 break-words ${hasGap ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                              {sd}
                            </span>
                            <span className={`font-medium flex-shrink-0 ${hasGap ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                              {tpl(dict.quizzes?.exam?.needed_available || '{needed} needed · {available} available', {
                                needed: target,
                                available,
                              })}
                              {hasGap ? ' ⚠' : ''}
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
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 break-words">
                <strong>{dict.quizzes?.exam?.gap_note_label || 'Note:'}</strong>{' '}
                {tpl(
                  dict.quizzes?.exam?.gap_note ||
                    'Some sub-domains have fewer questions than the ideal allocation. Available questions will be used and the exam will have slightly fewer than {count} questions for those sub-domains.',
                  { count: totalQuestions }
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5" />
            {tpl(dict.quizzes?.exam?.begin || 'Begin Exam — {time}', { time: formatCountdown(quiz.durationSeconds) })}
          </button>
        </div>
      </div>
    )
  }

  const question = questions[index]
  const currentAnswer = answers[index]
  const isFlagged = flagged.has(index)
  const unanswered = answers.filter(a => a.selectedOption === null).length
  const timerPct = (timeLeft / quiz.durationSeconds) * 100

  if (!question) return null

  return (
    <div className="container-custom py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">
              {index + 1} <span className="text-muted-foreground font-normal">/ {questions.length}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              {tpl(dict.quizzes?.exam?.status || '{answered} answered · {remaining} remaining · {flagged} flagged', {
                answered: answeredCount,
                remaining: unanswered,
                flagged: flagged.size,
              })}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 font-mono font-bold text-xl tabular-nums ${getTimerColorClass(timeLeft)}`}>
            <Clock className="w-5 h-5" />
            {formatCountdown(timeLeft)}
          </div>

          <button
            type="button"
            onClick={onOpenSubmit}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4" />
            {dict.quizzes?.exam?.submit || 'Submit'}
          </button>
        </div>

        <div className="h-1 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              timerPct > 30 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between mb-4 gap-3">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 min-w-0 break-words">
            {question.subdomain}
          </span>
          <button
            type="button"
            onClick={() => onToggleFlag(index)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 ${
              isFlagged
                ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
                : 'text-muted-foreground border-border hover:border-amber-400 hover:text-amber-600'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-current' : ''}`} />
            {isFlagged
              ? dict.quizzes?.exam?.flagged || 'Flagged'
              : dict.quizzes?.exam?.flag || 'Flag for review'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id + index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="bg-card border rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl font-semibold leading-relaxed mb-6 break-words">{question.question}</h2>

            <div className="space-y-3">
              {question.options.map((option, idx) => {
                const isSelected = currentAnswer?.selectedOption === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelect(idx)}
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
                    <span className="flex-1 font-medium break-words">{option}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              {dict.quizzes?.exam?.no_reveal || 'Answers are not revealed during the exam — submit to see results.'}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => onIndexChange(Math.max(0, index - 1))}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> {dict.common?.previous || 'Previous'}
          </button>
          <button
            type="button"
            onClick={() => onIndexChange(Math.min(questions.length - 1, index + 1))}
            disabled={index === questions.length - 1}
            className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {dict.common?.next || 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-card border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {dict.quizzes?.exam?.navigator || 'Question Navigator'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((_, i) => {
              const answered = answers[i]?.selectedOption !== null
              const isFlaggedTile = flagged.has(i)
              const active = i === index
              const tileLabel = isFlaggedTile && !answered
                ? tpl(dict.quizzes?.exam?.tile_flagged_unanswered || 'Q{n} (flagged) (unanswered)', { n: i + 1 })
                : isFlaggedTile
                ? tpl(dict.quizzes?.exam?.tile_flagged || 'Q{n} (flagged)', { n: i + 1 })
                : !answered
                ? tpl(dict.quizzes?.exam?.tile_unanswered || 'Q{n} (unanswered)', { n: i + 1 })
                : tpl(dict.quizzes?.exam?.tile || 'Q{n}', { n: i + 1 })
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  title={tileLabel}
                  aria-label={tileLabel}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    active ? 'ring-2 ring-offset-1 ring-amber-500 scale-110 z-10 relative' : ''
                  } ${
                    isFlaggedTile ? 'bg-amber-400 text-white'
                    : answered ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {isFlaggedTile ? '⚑' : i + 1}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" /> {dict.quizzes?.exam?.answered || 'Answered'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-muted" /> {dict.quizzes?.exam?.unanswered || 'Unanswered'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" /> {dict.quizzes?.exam?.flagged_legend || 'Flagged'}
            </span>
          </div>
        </div>
      </div>

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
              role="dialog"
              aria-modal="true"
              aria-label={dict.quizzes?.exam?.submit_title || 'Submit Exam?'}
              onKeyDown={(e) => { if (e.key === 'Escape') onCloseSubmit() }}
              className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
                  <CheckSquare className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {dict.quizzes?.exam?.submit_title || 'Submit Exam?'}
                </h3>
                {unanswered > 0 ? (
                  <p className="text-sm text-muted-foreground break-words">
                    {unanswered === 1
                      ? dict.quizzes?.exam?.submit_unanswered_one ||
                        'You have 1 unanswered question. Unanswered questions are marked incorrect.'
                      : tpl(
                          dict.quizzes?.exam?.submit_unanswered_many ||
                            'You have {n} unanswered questions. Unanswered questions are marked incorrect.',
                          { n: unanswered }
                        )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground break-words">
                    {tpl(
                      dict.quizzes?.exam?.submit_all_answered ||
                        'All {n} questions answered. Ready to submit?',
                      { n: questions.length }
                    )}
                  </p>
                )}
                {flagged.size > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 break-words">
                    {flagged.size === 1
                      ? dict.quizzes?.exam?.submit_flagged_one || '1 question still flagged for review.'
                      : tpl(
                          dict.quizzes?.exam?.submit_flagged_many ||
                            '{n} questions still flagged for review.',
                          { n: flagged.size }
                        )}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  autoFocus
                  onClick={onCloseSubmit}
                  className="flex-1 py-2.5 rounded-xl border font-semibold hover:bg-muted transition-colors"
                >
                  {dict.quizzes?.exam?.review_more || 'Review More'}
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity"
                >
                  {dict.quizzes?.exam?.submit_now || 'Submit Now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
