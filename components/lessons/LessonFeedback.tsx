'use client'

import { useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react'
import { getLessonFeedback, saveLessonFeedback } from '@/lib/lessons/feedback'

interface LessonFeedbackProps {
  slug: string
  dict: any
}

type Verdict = 'up' | 'down' | null

export default function LessonFeedback({ slug, dict }: LessonFeedbackProps) {
  const [verdict, setVerdict] = useState<Verdict>(null)
  const [chosen, setChosen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setVerdict(getLessonFeedback(slug))
    setChosen(false)
    setHydrated(true)
  }, [slug])

  const choose = (value: 'up' | 'down') => {
    saveLessonFeedback({ slug, verdict: value, at: new Date().toISOString() })
    setVerdict(value)
    setChosen(true)
  }

  if (!hydrated) return null

  const labels = dict?.lesson?.feedback ?? {}

  return (
    <div className="mt-8 border-t pt-6" data-testid="lesson-feedback">
      <p className="mb-3 text-sm font-medium text-foreground">{labels.title || 'Was this helpful?'}</p>
      {chosen ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          {labels.thanks || 'Thanks for your feedback!'}
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => choose('up')}
            aria-pressed={verdict === 'up'}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            {labels.yes || 'Yes'}
          </button>
          <button
            type="button"
            onClick={() => choose('down')}
            aria-pressed={verdict === 'down'}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <ThumbsDown className="h-4 w-4" />
            {labels.no || 'No'}
          </button>
        </div>
      )}
      {!chosen && verdict !== null && (
        <p className="mt-2 text-xs text-muted-foreground">
          {verdict === 'up' ? (labels.yes || 'Yes') : (labels.no || 'No')}
        </p>
      )}
    </div>
  )
}
