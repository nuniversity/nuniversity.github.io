'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Layers, RefreshCw, XCircle } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { recordAndEmit } from '@/lib/gamification/bus'
import { dayKey } from '@/lib/gamification/profile'
import { listCoursesWithPractice } from '@/lib/practice/record'
import { getReviewCards, saveReviewCard } from '@/lib/practice/cards'
import { newCard, reviewCard } from '@/lib/practice/fsrs'

interface IndexQuestion {
  id: string
  lesson: string
  course: string
  type: 'multiple-choice' | 'true-false'
  question: string
  options: string[]
  correct: number
  explanation?: string
}

interface QuestionIndex {
  course: string
  lang: string
  questions: IndexQuestion[]
}

export interface ReviewClientProps {
  lang: Locale
  dict?: any
  /** When set: mixed-practice mode for one course (ignores due dates). */
  courseSlug?: string
}

type Phase = 'loading' | 'empty' | 'session' | 'done'

const REVIEW_XP_DAY_KEY = 'v1:review-xp-day'
const DUE_SESSION_LIMIT = 20
const MIXED_SESSION_LIMIT = 10
const MIN_CARDS_FOR_XP = 5

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Round-robin interleave across courses (interleaving principle). */
function interleave(groups: IndexQuestion[][]): IndexQuestion[] {
  const out: IndexQuestion[] = []
  let added = true
  for (let i = 0; added; i++) {
    added = false
    for (const group of groups) {
      if (i < group.length) {
        out.push(group[i])
        added = true
      }
    }
  }
  return out
}

/**
 * Daily review (FSRS-due, cross-course, interleaved) and per-course mixed
 * practice. All state is client-side; content comes from the static question
 * index generated at build time.
 */
export default function ReviewClient({ lang, dict, courseSlug }: ReviewClientProps) {
  const t = dict?.review
  const [phase, setPhase] = useState<Phase>('loading')
  const [session, setSession] = useState<IndexQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const load = useCallback(async () => {
    setPhase('loading')
    const slugs = courseSlug ? [courseSlug] : listCoursesWithPractice()
    const dueCards = getReviewCards()
    const now = new Date()

    const groups: IndexQuestion[][] = []
    for (const slug of slugs) {
      try {
        const res = await fetch(`/question-index/${lang}/${slug}.json`)
        if (!res.ok) continue
        const payload = (await res.json()) as QuestionIndex
        const questions: IndexQuestion[] = payload.questions.map((question) => ({
          ...question,
          course: payload.course,
        }))
        const pool = courseSlug
          ? questions
          : questions.filter((question) => {
              const card = dueCards[question.id]
              return card !== undefined && new Date(card.due).getTime() <= now.getTime()
            })
        if (pool.length > 0) groups.push(pool)
      } catch {
        // offline or missing index: skip this course
      }
    }

    const mixed = interleave(groups.map(shuffle))
    const sessionCards = courseSlug
      ? shuffle(mixed).slice(0, MIXED_SESSION_LIMIT)
      : mixed.slice(0, DUE_SESSION_LIMIT)
    setSession(sessionCards)
    setIndex(0)
    setSelected(null)
    setRevealed(false)
    setPhase(sessionCards.length === 0 ? 'empty' : 'session')
  }, [courseSlug, lang])

  useEffect(() => {
    load()
  }, [load])

  const current = session[index]

  const answer = (optionIndex: number) => {
    if (revealed || !current) return
    setSelected(optionIndex)
    setRevealed(true)

    const correct = optionIndex === current.correct
    const cards = getReviewCards()
    const existing = cards[current.id]
    const { next } = existing
      ? reviewCard(existing, correct)
      : reviewCard(newCard(current.id, current.course ?? courseSlug ?? '', current.lesson), correct)
    saveReviewCard(next)
  }

  const next = () => {
    if (index + 1 < session.length) {
      setIndex(index + 1)
      setSelected(null)
      setRevealed(false)
      return
    }
    // Session complete: award XP at most once per local day, sessions >= 5.
    if (session.length >= MIN_CARDS_FOR_XP) {
      const today = dayKey(new Date())
      let lastDay: string | null = null
      try {
        lastDay = window.localStorage.getItem(REVIEW_XP_DAY_KEY)
      } catch {
        lastDay = null
      }
      if (lastDay !== today) {
        try {
          window.localStorage.setItem(REVIEW_XP_DAY_KEY, today)
        } catch {
          // storage full: XP is simply ungated
        }
        recordAndEmit({ type: 'review-complete', reviewed: session.length })
      }
    }
    setPhase('done')
  }

  const emptyText = useMemo(
    () =>
      courseSlug
        ? t?.mixed_empty || 'No practice questions found for this course.'
        : t?.empty || 'Nothing due for review right now. Finish a lesson to start building your review deck.',
    [courseSlug, t]
  )

  if (phase === 'loading') {
    return (
      <div className="p-8 text-center text-muted-foreground" data-audio-skip>
        <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <div className="p-8 text-center text-muted-foreground" data-audio-skip data-testid="review-empty">
        {emptyText}
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="p-8 text-center" data-audio-skip data-testid="review-done">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <p className="mt-3 font-medium">{t?.done || 'Session complete.'}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          {t?.again || 'Practice again'}
        </button>
      </div>
    )
  }

  const correct = revealed && selected === current.correct
  return (
    <div className="rounded-xl border bg-card shadow-sm" data-testid="review-session" data-audio-skip>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4 text-primary" />
          {courseSlug ? t?.mixed_title || 'Mixed practice' : t?.title || 'Daily review'}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {session.length}
        </span>
      </div>
      <div className="p-4 sm:p-6">
        <p className="mb-4 font-medium leading-relaxed">{current.question}</p>
        <div className="space-y-2">
          {current.options.map((option, i) => {
            let variant = 'border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer'
            if (revealed) {
              if (i === current.correct) variant = 'border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default'
              else if (i === selected) variant = 'border-red-500 bg-red-50 dark:bg-red-950/30 cursor-default'
              else variant = 'border-border opacity-60 cursor-default'
            } else if (selected === i) {
              variant = 'border-primary bg-primary/5 cursor-pointer'
            }
            return (
              <button
                key={i}
                type="button"
                onClick={() => answer(i)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors sm:text-base ${variant}`}
              >
                {String.fromCharCode(65 + i)}. {option}
              </button>
            )
          })}
        </div>
        <div aria-live="polite">
          {revealed && (
            <div
              className={`mt-4 rounded-lg border p-4 ${
                correct
                  ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                  : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
              }`}
            >
              <p
                className={`flex items-center gap-2 text-sm font-semibold ${
                  correct ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}
              >
                {correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {correct ? t?.correct || 'Correct' : t?.incorrect || 'Incorrect'}
              </p>
              {current.explanation && <p className="mt-1 text-sm text-foreground/80">{current.explanation}</p>}
              <button
                type="button"
                onClick={next}
                className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {index + 1 < session.length ? t?.next || 'Next' : t?.finish || 'Finish'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
