'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { MatchStep, PairsStep, ReviewStep } from '@/lib/language-courses/types'
import type { ReviewCardState } from '@/lib/practice/types'
import { speak, toSpeechLang } from '@/lib/speech/speech'
import { shuffle } from '@/lib/language-courses/check'
import { FeedbackBar, OptionButton, PromptHeading, pickText } from './step-ui'
import type { StepProps } from './steps-content'

// ---------------------------------------------------------------------------
// match — tap-to-match two columns (word to translation).
// ---------------------------------------------------------------------------

interface MatchTile {
  key: string
  text: string
  pairId: number
  side: 'source' | 'target'
}

export function StepMatch({
  step,
  t,
  onResult,
  onComplete,
}: StepProps & { step: MatchStep }) {
  const tiles = useMemo<MatchTile[]>(() => {
    const all: MatchTile[] = []
    step.pairs.forEach((pair, index) => {
      all.push({ key: `s-${index}`, text: pair.source, pairId: index, side: 'source' })
      all.push({ key: `t-${index}`, text: pair.target, pairId: index, side: 'target' })
    })
    return shuffle(all)
  }, [step.pairs])

  const [selected, setSelected] = useState<MatchTile | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'feedback'>('playing')
  const recordedRef = useRef(false)

  const pick = (tile: MatchTile) => {
    if (phase !== 'playing' || matched.has(tile.key)) return
    if (!selected) {
      setSelected(tile)
      return
    }
    if (selected.key === tile.key) {
      setSelected(null)
      return
    }
    if (selected.pairId === tile.pairId && selected.side !== tile.side) {
      const nextMatched = new Set(matched)
      nextMatched.add(selected.key)
      nextMatched.add(tile.key)
      setMatched(nextMatched)
      setSelected(null)
      if (nextMatched.size === tiles.length) {
        setPhase('feedback')
        if (!recordedRef.current) {
          recordedRef.current = true
          onResult(mistakes === 0)
        }
      }
    } else {
      setMistakes((count) => count + 1)
      setSelected(null)
    }
  }

  if (phase === 'feedback') {
    return (
      <div data-testid="step-match">
        <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
        <FeedbackBar
          state={mistakes === 0 ? 'correct' : mistakes <= 2 ? 'almost' : 'wrong'}
          correctLabel={t?.correct || 'Correct'}
          almostLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          nextLabel={t?.continue || 'Continue'}
          onNext={() => onComplete()}
        />
      </div>
    )
  }

  return (
    <div data-testid="step-match">
      <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((tile) => {
          const isMatched = matched.has(tile.key)
          const isSelected = selected?.key === tile.key
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => pick(tile)}
              data-testid={`match-${tile.key}`}
              className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                isMatched
                  ? 'border-green-400 bg-green-50 text-green-700 opacity-60 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300'
                  : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'bg-card hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              {tile.text}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {matched.size / 2} / {step.pairs.length}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// pairs — minimal-pair listening discrimination (L1 interference training).
// ---------------------------------------------------------------------------

export function StepPairs({
  step,
  target,
  t,
  onResult,
  onComplete,
}: StepProps & { step: PairsStep }) {
  const [trialIndex, setTrialIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [phase, setPhase] = useState<'playing' | 'feedback'>('playing')
  const autoPlayed = useRef(false)
  const trial = step.trials[trialIndex]

  useEffect(() => {
    if (autoPlayed.current) return
    autoPlayed.current = true
    speak(trial.audio, { lang: toSpeechLang(target) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choose = (choice: 'a' | 'b') => {
    if (phase !== 'playing') return
    const isCorrect = choice === trial.correct
    const nextResults = [...results, isCorrect]
    setResults(nextResults)
    if (trialIndex + 1 < step.trials.length) {
      setTrialIndex(trialIndex + 1)
      speak(step.trials[trialIndex + 1].audio, { lang: toSpeechLang(target) })
    } else {
      setPhase('feedback')
      if (nextResults.length > 0) {
        onResult(nextResults.every(Boolean))
      }
    }
  }

  if (phase === 'feedback') {
    const allCorrect = results.every(Boolean)
    return (
      <div data-testid="step-pairs">
        <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
        <FeedbackBar
          state={allCorrect ? 'correct' : 'almost'}
          correctLabel={t?.correct || 'Correct'}
          almostLabel={t?.almost_correct || 'Almost!'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          nextLabel={t?.continue || 'Continue'}
          onNext={() => onComplete()}
        />
      </div>
    )
  }

  return (
    <div data-testid="step-pairs">
      <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => speak(trial.audio, { lang: toSpeechLang(target) })}
          data-testid="pairs-play"
          aria-label={t?.replay || 'Replay'}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          <Volume2 className="h-6 w-6" />
        </button>
        <span className="text-xs text-muted-foreground">
          {trialIndex + 1} / {step.trials.length}
        </span>
      </div>
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => choose('a')}
          data-testid="pairs-a"
          className="rounded-xl border bg-card p-6 text-xl font-semibold hover:border-primary/50 hover:bg-accent/50"
        >
          A. {trial.choiceA}
        </button>
        <button
          type="button"
          onClick={() => choose('b')}
          data-testid="pairs-b"
          className="rounded-xl border bg-card p-6 text-xl font-semibold hover:border-primary/50 hover:bg-accent/50"
        >
          B. {trial.choiceB}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// review — woven FSRS retrieval (self-graded recall).
// ---------------------------------------------------------------------------

export function StepReview({
  step,
  lang,
  source,
  target,
  t,
  vocabById,
  reviewItems,
  onResult,
  onReviewGrade,
  onComplete,
}: StepProps & {
  step: ReviewStep
  /** Due cards resolved by the player for this step. */
  reviewItems: ReviewCardState[]
  /** Reports the learner's self-grade so the player updates the FSRS card. */
  onReviewGrade: (card: ReviewCardState, knewIt: boolean) => void
}) {
  const count = step.count ?? 3
  const items = reviewItems.slice(0, count)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [mcqSelected, setMcqSelected] = useState<number | null>(null)
  const [mcqAnswered, setMcqAnswered] = useState<boolean | null>(null)
  const [phase, setPhase] = useState<'playing' | 'feedback'>('playing')

  const item = items[index]
  const vocab = item ? vocabById.get(item.key.split('::')[2]) : undefined

  /**
   * Varied retrieval (transfer-appropriate practice): items alternate between
   * production-style recall (L1 prompt → recall L2, self-graded) and
   * recognition (L2 word → choose the L1 translation, auto-graded).
   */
  const isMcq = index % 2 === 1
  const mcqOptions = useMemo(() => {
    if (!vocab) return null
    const others = Array.from(vocabById.values()).filter(
      (candidate) => candidate.id !== vocab.id && candidate.target && candidate.target !== vocab.target
    )
    if (others.length < 2) return null
    const picked = shuffle(others).slice(0, 2).map((candidate) => candidate.target)
    return shuffle([vocab.target, ...picked])
  }, [vocab, vocabById])
  const useMcq = isMcq && mcqOptions !== null && vocab !== undefined
  const mcqCorrect = useMcq && vocab ? mcqOptions!.indexOf(vocab.target) : -1

  // The player skips this step entirely when nothing is due, so reaching the
  // component with an empty list is a defensive no-op only.
  if (items.length === 0 || !item || !vocab) {
    return null
  }

  const grade = (knewIt: boolean) => {
    onReviewGrade(item, knewIt)
    onResult(knewIt)
    if (index + 1 < items.length) {
      setIndex(index + 1)
      setRevealed(false)
      setMcqSelected(null)
      setMcqAnswered(null)
    } else {
      setPhase('feedback')
    }
  }

  const chooseMcq = (choice: number) => {
    if (mcqAnswered !== null) return
    setMcqSelected(choice)
    setMcqAnswered(choice === mcqCorrect)
  }

  if (phase === 'feedback') {
    return (
      <div data-testid="step-review">
        <PromptHeading>{t?.review_step_title || 'Review time'}</PromptHeading>
        <FeedbackBar
          state="correct"
          correctLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.correct || 'Correct'}
          nextLabel={t?.continue || 'Continue'}
          onNext={() => onComplete()}
        />
      </div>
    )
  }

  return (
    <div data-testid="step-review">
      <PromptHeading>{t?.review_step_title || 'Review time'}</PromptHeading>
      {useMcq ? (
        <div className="mx-auto max-w-md">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t?.choose_translation || 'Choose the correct answer'}
          </p>
          <p className="mt-2 text-center text-3xl font-bold" data-testid="review-mcq-word">
            {vocab.source}
          </p>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => speak(vocab.source, { lang: toSpeechLang(target) })}
              aria-label={t?.play_audio || 'Play audio'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {mcqOptions!.map((option, optionIndex) => {
              let state: 'idle' | 'correct' | 'wrong' | 'dimmed' = 'idle'
              if (mcqAnswered !== null) {
                if (optionIndex === mcqCorrect) state = 'correct'
                else if (optionIndex === mcqSelected) state = 'wrong'
                else state = 'dimmed'
              }
              return (
                <OptionButton
                  key={optionIndex}
                  index={optionIndex}
                  onClick={() => chooseMcq(optionIndex)}
                  state={state}
                  disabled={mcqAnswered !== null}
                >
                  {option}
                </OptionButton>
              )
            })}
          </div>
          {mcqAnswered !== null && (
            <FeedbackBar
              state={mcqAnswered ? 'correct' : 'wrong'}
              correctLabel={t?.correct || 'Correct'}
              incorrectLabel={t?.incorrect || 'Not quite'}
              nextLabel={t?.continue || 'Continue'}
              onNext={() => grade(mcqAnswered)}
              autoFocus={false}
            />
          )}
        </div>
      ) : (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {pickText({ en: 'Recall', pt: 'Lembre', es: 'Recuerda' }, lang)}
        </p>
        <p className="mt-2 text-3xl font-bold">{vocab.target}</p>
        <button
          type="button"
          onClick={() => speak(vocab.target, { lang: toSpeechLang(source) })}
          aria-label={t?.play_audio || 'Play audio'}
          className="mx-auto mt-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        {revealed ? (
          <div className="mt-4 border-t pt-4">
            <p className="text-2xl font-semibold text-primary">{vocab.source}</p>
            <button
              type="button"
              onClick={() => speak(vocab.source, { lang: toSpeechLang(target) })}
              aria-label={t?.play_audio || 'Play audio'}
              className="mx-auto mt-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => grade(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                {t?.didnt_know || 'Still learning'}
              </button>
              <button
                type="button"
                onClick={() => grade(true)}
                data-testid="knew-it"
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
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t?.reveal || 'Reveal'}
          </button>
        )}
      </div>
      )}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {index + 1} / {items.length}
      </p>
    </div>
  )
}
