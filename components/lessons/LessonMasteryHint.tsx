'use client'

import { useMemo } from 'react'
import { useLessonScore } from './LessonScoreContext'

interface LessonMasteryHintProps {
  dict?: any
  /** Mastery bar; the completion nudge stays at 70% in LessonScoreSummary. */
  threshold?: number
}

/**
 * Live practice-mastery bar for the current lesson. Renders nothing until at
 * least one widget is registered. Soft signal only — never blocks anything.
 *
 * States: <70% review recommended · 70–79% solid · >=80% mastery reached.
 * The 80% bar follows the mastery-learning literature; 70% remains the
 * existing completion nudge, so the two messages do not contradict.
 */
export default function LessonMasteryHint({ dict, threshold = 0.8 }: LessonMasteryHintProps) {
  const { registered, results } = useLessonScore()
  const t = dict?.lesson?.mastery

  const model = useMemo(() => {
    const widgets = Object.values(registered)
    const expected = widgets.reduce((sum, w) => sum + w.total, 0)
    const answered = Object.values(results).filter((r) => r.answered)
    const correct = answered.reduce((sum, r) => sum + r.correct, 0)
    const total = answered.reduce((sum, r) => sum + r.total, 0)
    const unanswered = widgets.filter((w) => results[w.id]?.answered !== true).length
    return { expected, correct, total, unanswered, percent: total > 0 ? correct / total : 0 }
  }, [registered, results])

  if (model.expected === 0) return null

  const pct = Math.round(model.percent * 100)
  const state =
    model.unanswered > 0 ? 'pending' : model.percent >= threshold ? 'strong' : model.percent >= 0.7 ? 'solid' : 'review'
  const label =
    state === 'pending'
      ? t?.pending || 'Answer the practice questions to measure your mastery'
      : state === 'strong'
        ? t?.strong || 'Mastery reached'
        : state === 'solid'
          ? t?.solid || 'Solid progress: review the missed items to reach 80% mastery'
          : t?.review || 'Review recommended before moving on'

  return (
    <div
      data-testid="lesson-mastery-hint"
      data-audio-skip
      className="rounded-xl border bg-muted/30 p-4"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{t?.title || 'Practice mastery'}</span>
        <span className="tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            state === 'strong' ? 'bg-green-600' : state === 'review' ? 'bg-yellow-500' : 'bg-gray-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p
        className={`mt-2 text-xs ${
          state === 'review' ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'
        }`}
      >
        {label}
      </p>
    </div>
  )
}
