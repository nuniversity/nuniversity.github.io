'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, RotateCcw, BookOpen, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Flag, Clock,
} from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import type { QuizData, QuizQuestion } from '@/lib/quizzes/types'
import { CertificateCard } from './CertificateCard'
import Link from 'next/link'

interface ScoreReportProps {
  lang: Locale
  quiz: QuizData
  dict: any
  screen: 'complete' | 'review' | 'mock-complete'
  score: number
  accuracy: number
  total: number
  totalTime: number
  domainResults: Record<string, { correct: number; total: number }>
  userAnswers: { questionId: string; selectedOption: number | null; isCorrect: boolean; timeSpent: number }[]
  reviewIndex: number
  onReviewIndexChange: (index: number) => void
  activeQuestions: QuizQuestion[]
  mockScore: number
  mockAccuracy: number
  mockPassed: boolean
  mockTimedOut: boolean
  timeUsed: number
  mockQuestions: QuizQuestion[]
  mockAnswers: { selectedOption: number | null }[]
  mockFlagged: Set<number>
  mockMajorDomainResults: Record<string, { correct: number; total: number; label: string; color: string }>
  mockReviewMode: 'all' | 'wrong' | 'flagged'
  mockReviewIndex: number
  onMockReviewModeChange: (mode: 'all' | 'wrong' | 'flagged') => void
  onMockReviewIndexChange: (index: number) => void
  onOpenReview: () => void
  onBackToResults: () => void
  onRestart: () => void
  onRetake: () => void
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

function getScoreRating(pct: number, dict: any): { label: string; color: string } {
  if (pct >= 90) return { label: dict.quizzes?.score?.rating_excellent || 'Excellent! Ready to certify 🚀', color: 'text-green-600 dark:text-green-400' }
  if (pct >= 75) return { label: dict.quizzes?.score?.rating_great || 'Great job! Keep it up 💪', color: 'text-blue-600 dark:text-blue-400' }
  if (pct >= 60) return { label: dict.quizzes?.score?.rating_good || 'Good effort — review weak areas', color: 'text-yellow-600 dark:text-yellow-400' }
  return { label: dict.quizzes?.score?.rating_keep || "Keep studying — you'll get there!", color: 'text-red-600 dark:text-red-400' }
}

export function ScoreReport(props: ScoreReportProps) {
  const {
    lang, quiz, dict, screen,
    score, accuracy, total, totalTime, domainResults, userAnswers,
    reviewIndex, onReviewIndexChange, activeQuestions,
    mockScore, mockAccuracy, mockPassed, mockTimedOut, timeUsed,
    mockQuestions, mockAnswers, mockFlagged, mockMajorDomainResults,
    mockReviewMode, mockReviewIndex, onMockReviewModeChange, onMockReviewIndexChange,
    onOpenReview, onBackToResults, onRestart, onRetake,
  } = props

  if (screen === 'complete') {
    const rating = getScoreRating(accuracy, dict)
    const practicePassed = accuracy >= quiz.passingScore

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
            <h1 className="text-4xl font-bold mb-2">
              {dict.quizzes?.score?.complete_title || 'Quiz Complete!'}
            </h1>
            <p className={`text-lg font-semibold ${rating.color}`}>{rating.label}</p>
          </motion.div>

          <div className="bg-card border rounded-2xl p-6 mb-6">
            <div className="text-center mb-6 pb-6 border-b">
              <div className="text-7xl font-black mb-1 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{accuracy}%</div>
              <p className="text-muted-foreground break-words">
                {tpl(dict.quizzes?.score?.correct_out_of || '{score} correct out of {total} questions', {
                  score,
                  total,
                })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{score}</div>
                <div className="text-xs text-muted-foreground mt-1">{dict.quizzes?.score?.correct || 'Correct'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{total - score}</div>
                <div className="text-xs text-muted-foreground mt-1">{dict.quizzes?.score?.incorrect || 'Incorrect'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
                <div className="text-xs text-muted-foreground mt-1">{dict.quizzes?.score?.time || 'Time'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                {dict.quizzes?.score?.domain_breakdown || 'Domain Breakdown'}
              </h3>
              <div className="space-y-3">
                {Object.entries(domainResults).map(([domain, { correct, total: domainTotal }]) => {
                  const pct = domainTotal > 0 ? Math.round((correct / domainTotal) * 100) : 0
                  return (
                    <div key={domain}>
                      <div className="flex justify-between text-sm mb-1 gap-3">
                        <span className="text-foreground/80 truncate pr-2 min-w-0">{domain}</span>
                        <span className="font-semibold flex-shrink-0">{correct}/{domainTotal} ({pct}%)</span>
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

          {practicePassed && (
            <CertificateCard
              dict={dict}
              slug={quiz.slug}
              score={accuracy}
              pass={quiz.passingScore}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onOpenReview}
              className="py-3 rounded-xl border-2 font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> {dict.quizzes?.score?.review_answers || 'Review Answers'}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> {dict.quizzes?.play_again || 'Play Again'}
            </button>
          </div>
          <Link
            href={`/${lang}/quizzes/`}
            className="block text-center mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← {dict.quizzes?.back_to_quizzes || 'Back to Quizzes'}
          </Link>
        </div>
      </div>
    )
  }

  if (screen === 'review') {
    const answer = userAnswers[reviewIndex]
    const question = activeQuestions[reviewIndex]
    if (!question) return null

    return (
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6 gap-3">
            <button
              type="button"
              onClick={onBackToResults}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> {dict.quizzes?.back_to_results || 'Back to Results'}
            </button>
            <span className="text-sm text-muted-foreground">{reviewIndex + 1} / {activeQuestions.length}</span>
          </div>

          <div className="flex gap-1.5 mb-6 flex-wrap">
            {activeQuestions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onReviewIndexChange(i)}
                aria-label={tpl(dict.quizzes?.exam?.tile || 'Q{n}', { n: i + 1 })}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${i === reviewIndex ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''} ${userAnswers[i]?.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 break-words">
              {question.subdomain}
            </span>
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
                {answer?.isCorrect
                  ? <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />}
                <h2 className="text-lg font-semibold leading-relaxed break-words">{question.question}</h2>
              </div>
              <div className="space-y-2">
                {question.options.map((option, idx) => {
                  const isCorrect = idx === question.correct
                  const wasSelected = answer?.selectedOption === idx
                  let cls = 'border-border bg-background opacity-50'
                  if (isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  else if (wasSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  return (
                    <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border-2 ${cls}`}>
                      <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${isCorrect ? 'bg-green-500 text-white' : wasSelected ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>{getLetterLabel(idx)}</span>
                      <span className="flex-1 text-sm font-medium break-words">{option}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      {wasSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  {dict.quizzes?.explanation || '💡 Explanation'}
                </p>
                <p className="text-sm text-foreground/80 break-words">{question.explanation}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onReviewIndexChange(Math.max(0, reviewIndex - 1))}
              disabled={reviewIndex === 0}
              className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> {dict.common?.previous || 'Previous'}
            </button>
            <button
              type="button"
              onClick={() => onReviewIndexChange(Math.min(activeQuestions.length - 1, reviewIndex + 1))}
              disabled={reviewIndex === activeQuestions.length - 1}
              className="flex-1 py-3 rounded-xl border font-semibold hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {dict.common?.next || 'Next'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={onRestart}
              className="py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> {dict.quizzes?.play_again || 'Play Again'}
            </button>
            <Link
              href={`/${lang}/quizzes/`}
              className="py-3 rounded-xl border font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              {dict.quizzes?.more_quizzes || 'More Quizzes'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const reviewList = mockReviewMode === 'wrong'
    ? mockQuestions.map((q, i) => ({ q, i })).filter(({ q, i }) => mockAnswers[i]?.selectedOption !== q.correct)
    : mockReviewMode === 'flagged'
    ? mockQuestions.map((q, i) => ({ q, i })).filter(({ i }) => mockFlagged.has(i))
    : mockQuestions.map((q, i) => ({ q, i }))
  const isReviewing = mockReviewIndex >= 0 && mockReviewIndex < reviewList.length

  return (
    <div className="container-custom py-12">
      <div className="max-w-2xl mx-auto">
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
              <Clock className="w-3.5 h-3.5" /> {dict.quizzes?.exam?.time_expired || 'Time expired — auto-submitted'}
            </div>
          )}

          <div className={`text-3xl font-black mb-1 px-5 py-2 rounded-full inline-block ${
            mockPassed
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {mockPassed ? '✓' : '✗'} {mockPassed
              ? dict.quizzes?.exam?.pass || 'PASS'
              : dict.quizzes?.exam?.fail || 'FAIL'}
          </div>
          <p className="text-muted-foreground mt-2 text-sm break-words">
            {tpl(
              dict.quizzes?.exam?.passing_line || 'Passing score: {score}% · Official {cert} threshold',
              { score: quiz.passingScore, cert: quiz.certification }
            )}
          </p>
        </motion.div>

        <div className="bg-card border rounded-2xl p-6 mb-6">
          <div className="text-center mb-6 pb-6 border-b">
            <div className={`text-7xl font-black mb-1 bg-gradient-to-r bg-clip-text text-transparent ${
              mockPassed ? 'from-green-500 to-emerald-400' : 'from-red-500 to-rose-400'
            }`}>
              {mockAccuracy}%
            </div>
            <p className="text-muted-foreground break-words">
              {tpl(dict.quizzes?.score?.correct_out_of || '{score} correct out of {total} questions', {
                score: mockScore,
                total: mockQuestions.length,
              })}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { val: mockScore, label: dict.quizzes?.score?.correct || 'Correct', cls: 'text-green-600 dark:text-green-400' },
              { val: mockQuestions.length - mockScore, label: dict.quizzes?.score?.incorrect || 'Incorrect', cls: 'text-red-500' },
              { val: mockAnswers.filter(a => a.selectedOption === null).length, label: dict.quizzes?.score?.skipped || 'Skipped', cls: 'text-muted-foreground' },
              { val: formatTime(timeUsed), label: dict.quizzes?.score?.time_used || 'Time used', cls: '' },
            ].map(({ val, label, cls }) => (
              <div key={label} className="text-center min-w-0">
                <div className={`text-2xl font-bold ${cls} break-words`}>{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5 break-words">{label}</div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
              {dict.quizzes?.score?.domain_breakdown || 'Domain Breakdown'}
            </h3>
            <div className="space-y-3">
              {Object.entries(mockMajorDomainResults).map(([domKey, { correct, total: domainTotal, label, color }]) => {
                if (domainTotal === 0) return null
                const pct = Math.round((correct / domainTotal) * 100)
                return (
                  <div key={domKey}>
                    <div className="flex items-center justify-between text-sm mb-1 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getDomainAccentClass(color)}`} />
                        <span className="text-foreground/80 truncate pr-2">{label}</span>
                      </div>
                      <span className={`font-semibold flex-shrink-0 ${
                        pct >= 75 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                      }`}>
                        {correct}/{domainTotal} ({pct}%)
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

        {mockPassed && (
          <CertificateCard
            dict={dict}
            slug={quiz.slug}
            score={mockAccuracy}
            pass={quiz.passingScore}
          />
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={() => onMockReviewModeChange('all')}
            className="py-3 rounded-xl border-2 font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            {dict.quizzes?.exam?.review_all || 'Review All Answers'}
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {dict.quizzes?.exam?.retake || 'Retake Exam'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => onMockReviewModeChange('wrong')}
            className="py-2.5 rounded-xl border font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4 text-red-500" />
            {tpl(dict.quizzes?.exam?.review_incorrect || 'Review Incorrect ({n})', { n: mockQuestions.length - mockScore })}
          </button>
          <button
            type="button"
            onClick={() => onMockReviewModeChange('flagged')}
            className="py-2.5 rounded-xl border font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <Flag className="w-4 h-4 text-amber-500" />
            {tpl(dict.quizzes?.exam?.review_flagged || 'Review Flagged ({n})', { n: mockFlagged.size })}
          </button>
        </div>

        {reviewList.length > 0 && (
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'wrong', 'flagged'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onMockReviewModeChange(mode)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                      mockReviewMode === mode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode === 'all'
                      ? tpl(dict.quizzes?.exam?.filter_all || 'All ({n})', { n: mockQuestions.length })
                      : mode === 'wrong'
                      ? tpl(dict.quizzes?.exam?.filter_wrong || 'Wrong ({n})', { n: mockQuestions.length - mockScore })
                      : tpl(dict.quizzes?.exam?.filter_flagged || 'Flagged ({n})', { n: mockFlagged.size })}
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
                        : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                          {mockFlagged.has(i) && (
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                              <Flag className="w-3 h-3 fill-current" /> {dict.quizzes?.exam?.flagged || 'Flagged'}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold leading-relaxed break-words">{q.question}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {q.options.map((option, idx) => {
                        const isCorrect = idx === q.correct
                        const wasSelected = ans?.selectedOption === idx
                        let cls = 'border-border bg-background opacity-50'
                        if (isCorrect) cls = 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        else if (wasSelected) cls = 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        return (
                          <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${cls}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                              isCorrect ? 'bg-green-500 text-white'
                              : wasSelected ? 'bg-red-500 text-white'
                              : 'bg-muted text-muted-foreground'
                            }`}>{getLetterLabel(idx)}</span>
                            <span className="flex-1 text-sm font-medium break-words">{option}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                            {wasSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                          </div>
                        )
                      })}
                    </div>

                    {ans?.selectedOption === null && (
                      <div className="mb-3 text-xs font-medium text-muted-foreground italic">
                        — {dict.quizzes?.exam?.not_answered || 'Question was not answered'}
                      </div>
                    )}

                    <div className="rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        {dict.quizzes?.explanation || '💡 Explanation'}
                      </p>
                      <p className="text-sm text-foreground/80 break-words">{q.explanation}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )
            })()}

            <div className="p-4 border-t flex gap-3">
              <button
                type="button"
                onClick={() => onMockReviewIndexChange(Math.max(0, mockReviewIndex - 1))}
                disabled={mockReviewIndex === 0}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> {dict.common?.previous || 'Previous'}
              </button>
              <button
                type="button"
                onClick={() => onMockReviewIndexChange(Math.min(reviewList.length - 1, mockReviewIndex + 1))}
                disabled={mockReviewIndex === reviewList.length - 1}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {dict.common?.next || 'Next'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Link
          href={`/${lang}/quizzes/`}
          className="block text-center mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← {dict.quizzes?.back_to_quizzes || 'Back to Quizzes'}
        </Link>
      </div>
    </div>
  )
}
