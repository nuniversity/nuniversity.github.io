'use client'

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speak, toSpeechLang } from '@/lib/speech/speech'
import { PairFlags } from '@/components/languages/pair-flags'

export interface VocabReviewItem {
  kind: 'vocab'
  key: string
  pair: string
  course: string
  source: string
  target: string
}

/** Recall card for vocabulary due in the daily review: L1 prompt, recall L2, self-grade. */
export function VocabReviewCard({
  item,
  dict,
  onGrade,
}: {
  item: VocabReviewItem
  dict?: any
  onGrade: (correct: boolean) => void
}) {
  const t = dict?.languageCourse ?? dict?.review ?? {}
  const [revealed, setRevealed] = useState(false)
  const sourceLang = item.pair.split('-')[1] || 'en'
  const targetLang = item.pair.split('-')[0] || 'pt'

  return (
    <div className="p-4 sm:p-6" data-testid="vocab-review-card">
      <div className="mb-4 flex items-center justify-between">
        <PairFlags source={targetLang} target={sourceLang} size={18} />
        <span className="text-xs text-muted-foreground">{dict?.review?.title || 'Daily review'}</span>
      </div>
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t?.vocabulary || 'Vocabulary'}
        </p>
        <p className="mt-2 text-3xl font-bold" data-testid="vocab-prompt">{item.target}</p>
        <button
          type="button"
          onClick={() => speak(item.target, { lang: toSpeechLang(targetLang) })}
          aria-label={t?.play_audio || 'Play audio'}
          className="mx-auto mt-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        {revealed ? (
          <div className="mt-4 border-t pt-4">
            <p className="text-2xl font-semibold text-primary" data-testid="vocab-answer">{item.source}</p>
            <button
              type="button"
              onClick={() => speak(item.source, { lang: toSpeechLang(sourceLang) })}
              aria-label={t?.play_audio || 'Play audio'}
              className="mx-auto mt-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => onGrade(false)}
                data-testid="vocab-didnt-know"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                {t?.didnt_know || 'Still learning'}
              </button>
              <button
                type="button"
                onClick={() => onGrade(true)}
                data-testid="vocab-knew-it"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {t?.knew_it || 'I knew it'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            data-testid="vocab-reveal"
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t?.reveal || 'Reveal'}
          </button>
        )}
      </div>
    </div>
  )
}

/** Type guard used by ReviewClient to branch its rendering. */
export function isVocabReviewItem(item: unknown): item is VocabReviewItem {
  return typeof item === 'object' && item !== null && (item as VocabReviewItem).kind === 'vocab'
}
