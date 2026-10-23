'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, Star, ChevronRight, Trophy, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { QuizQuestion } from '@/lib/quizzes/types'

interface QuizPlayerProps {
  dict: any
  question: QuizQuestion | undefined
  index: number
  total: number
  selectedOption: number | null
  isAnswered: boolean
  showExplanation: boolean
  elapsed: number
  score: number
  onSelect: (optionIndex: number) => void
  onNext: () => void
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

function getLetterLabel(index: number): string {
  return ['A', 'B', 'C', 'D'][index]
}

export function QuizPlayer({
  dict,
  question,
  index,
  total,
  selectedOption,
  isAnswered,
  showExplanation,
  elapsed,
  score,
  onSelect,
  onNext,
  onExit,
}: QuizPlayerProps) {
  if (!question) return null
  const progressPct = (index / total) * 100
  const isLastQuestion = index === total - 1

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {dict.quizzes?.exit || 'Exit'}
          </button>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(elapsed)}</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" />{score}/{index}</span>
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
            <span>{tpl(dict.quizzes?.practice?.percent_complete || '{n}% complete', { n: Math.round(progressPct) })}</span>
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
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 break-words">
            {question.subdomain}
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
            <div className="space-y-3">
              {question.options.map((option, idx) => {
                const isSelected = selectedOption === idx
                const isCorrect = idx === question.correct
                let cls = 'border-border bg-background hover:border-primary hover:bg-muted/50 cursor-pointer'
                if (isAnswered) {
                  if (isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default'
                  else if (isSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-900/20 cursor-default'
                  else cls = 'border-border bg-background opacity-50 cursor-default'
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelect(idx)}
                    aria-disabled={isAnswered}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${cls}`}
                  >
                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isAnswered && isCorrect ? 'bg-green-500 text-white'
                      : isAnswered && isSelected ? 'bg-red-500 text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}>{getLetterLabel(idx)}</span>
                    <span className="flex-1 font-medium break-words">{option}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
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
                    selectedOption === question.correct
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  }`}>
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      selectedOption === question.correct ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                    }`} />
                    <div>
                      <p className={`text-sm font-semibold mb-1 ${
                        selectedOption === question.correct ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                      }`}>
                        {selectedOption === question.correct
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

        {isAnswered && (
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
        {!isAnswered && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {dict.quizzes?.practice?.select_answer || 'Select an answer to continue'}
          </p>
        )}
      </div>
    </div>
  )
}
