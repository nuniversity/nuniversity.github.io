'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, Star, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  AlertCircle, Trophy, Flag,
} from 'lucide-react'
import type { QuizQuestion, QuizResponse } from '@/lib/quizzes/types'
import { isAnswered } from '@/lib/quizzes/grade'
import { QuestionBody } from './QuestionBody'

export type QuizTileState = 'blank' | 'staged' | 'correct' | 'wrong'

interface QuizPlayerProps {
  dict: any
  question: QuizQuestion | undefined
  index: number
  total: number
  response: QuizResponse | null
  checked: boolean
  isCorrect: boolean | null
  elapsed: number
  score: number
  gradedCount: number
  tileStates: QuizTileState[]
  onChange: (response: QuizResponse) => void
  onCheck: () => void
  onNavigate: (index: number) => void
  onNext: () => void
  onFinish: () => void
  onExit: () => void
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce((str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)), template)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function QuizPlayer({
  dict,
  question,
  index,
  total,
  response,
  checked,
  isCorrect,
  elapsed,
  score,
  gradedCount,
  tileStates,
  onChange,
  onCheck,
  onNavigate,
  onNext,
  onFinish,
  onExit,
}: QuizPlayerProps) {
  if (!question) return null
  const isLastQuestion = index === total - 1
  const progressPct = total > 0 ? Math.round((gradedCount / total) * 100) : 0
  const canCheck = !checked && isAnswered(question, response)

  const tileClass = (state: QuizTileState, active: boolean) => {
    const base = active ? 'ring-2 ring-offset-1 ring-primary scale-110 z-10 relative ' : ''
    if (state === 'correct') return `${base}bg-green-500 text-white`
    if (state === 'wrong') return `${base}bg-red-500 text-white`
    if (state === 'staged') return `${base}bg-blue-500 text-white`
    return `${base}bg-muted text-muted-foreground hover:bg-muted/70`
  }

  const tileLabel = (state: QuizTileState, i: number) => {
    const key = state === 'correct' ? 'tile_correct'
      : state === 'wrong' ? 'tile_wrong'
      : state === 'staged' ? 'tile_staged'
      : 'tile_blank'
    const fallback = state === 'correct' ? `Q{n} (checked, correct)`
      : state === 'wrong' ? `Q{n} (checked, incorrect)`
      : state === 'staged' ? `Q{n} (answered, not checked)`
      : `Q{n} (not answered)`
    return tpl(dict.quizzes?.practice?.[key] || fallback, { n: i + 1 })
  }

  return (
    <div className="container-custom py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {dict.quizzes?.exit || 'Exit'}
          </button>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(elapsed)}</span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {tpl(dict.quizzes?.practice?.scored_of || '{score} correct of {checked}', { score, checked: gradedCount })}
            </span>
            <button
              type="button"
              onClick={onFinish}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              <Flag className="w-3.5 h-3.5" /> {dict.quizzes?.practice?.finish || 'Finish'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>
              {tpl(dict.quizzes?.practice?.question_of || 'Question {current} of {total}', {
                current: index + 1,
                total,
              })}
            </span>
            <span>{tpl(dict.quizzes?.practice?.percent_complete || '{n}% checked', { n: progressPct })}</span>
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

        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 break-words">
            {question.subdomain}
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground break-words">
            {question.type}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="bg-card border rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl font-semibold leading-relaxed mb-6 break-words">{question.question}</h2>

            <QuestionBody
              question={question}
              response={response}
              onChange={checked ? undefined : onChange}
              mode={checked ? 'reveal' : 'interactive'}
              dict={dict}
            />

            <AnimatePresence>
              {checked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className={`rounded-xl p-4 flex gap-3 ${
                    isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  }`}>
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      isCorrect ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                    }`} />
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${
                        isCorrect ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                      }`}>
                        {isCorrect
                          ? dict.quizzes?.practice?.correct || 'Correct!'
                          : dict.quizzes?.practice?.incorrect || 'Incorrect'}
                      </p>
                      <p className="text-sm text-foreground/80 break-words">{question.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {!checked && (
          <div className="mb-6 space-y-3">
            <button
              type="button"
              onClick={onCheck}
              disabled={!canCheck}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              {dict.quizzes?.practice?.check_answer || 'Check answer'}
            </button>
            {!canCheck && (
              <p className="text-center text-xs text-muted-foreground">
                {dict.quizzes?.practice?.select_answer || 'Select an answer to continue'}
              </p>
            )}
          </div>
        )}

        {checked && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onNext}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isLastQuestion ? (
              <>
                <Trophy className="w-5 h-5" /> {dict.quizzes?.practice?.see_results || 'See Results'}
              </>
            ) : (
              <>
                {dict.quizzes?.practice?.next_question || 'Next Question'} <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        )}

        <div className="flex items-center justify-between gap-3 mb-6 mt-4">
          <button
            type="button"
            onClick={() => onNavigate(Math.max(0, index - 1))}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> {dict.common?.previous || 'Previous'}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isLastQuestion}
            className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {checked ? (dict.common?.next || 'Next') : (dict.quizzes?.practice?.skip || 'Skip for now')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-card border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {dict.quizzes?.exam?.navigator || 'Question Navigator'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tileStates.map((state, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate(i)}
                title={tileLabel(state, i)}
                aria-label={tileLabel(state, i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${tileClass(state, i === index)}`}
              >
                {state === 'correct' ? '✓' : state === 'wrong' ? '✗' : state === 'staged' ? '●' : i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" /> {dict.quizzes?.practice?.legend_correct || 'Checked · correct'}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500" /> {dict.quizzes?.practice?.legend_wrong || 'Checked · incorrect'}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" /> {dict.quizzes?.practice?.legend_staged || 'Answered · not checked'}</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border" /> {dict.quizzes?.practice?.legend_blank || 'Not answered'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
