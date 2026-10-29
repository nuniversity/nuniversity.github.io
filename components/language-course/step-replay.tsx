'use client'

import { ArrowRight, Volume2 } from 'lucide-react'
import type { Step } from '@/lib/language-courses/types'
import { speak, toSpeechLang } from '@/lib/speech/speech'
import { PromptHeading, pickText } from './step-ui'

/**
 * Read-only rendering of an already-completed graded step.
 *
 * When the learner navigates back to an answered step, re-answering would
 * corrupt the recorded score, so graded steps switch to this replay view:
 * question, correct answer, and the audio, with a Continue that returns
 * forward. Content steps (knowledge, input, tip, vocab) remain interactive
 * because they carry no score.
 */

interface ReplayProps {
  step: Step
  lang: string
  source: string
  target: string
  t: any
  onForward: () => void
}

function CorrectCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/30">
      {children}
    </div>
  )
}

function ContinueButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="replay-forward"
      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  )
}

export function StepReplayView({ step, lang, source, target, t, onForward }: ReplayProps) {
  const continueLabel = t?.continue || 'Continue'
  const doneBadge = (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      ✓ {t?.already_done || 'Already completed'}
    </p>
  )

  const body = (() => {
    switch (step.type) {
      case 'select': {
        const correct = step.options[step.correct]
        return (
          <>
            <PromptHeading>{pickText(step.prompt, lang)}</PromptHeading>
            <p className="mb-4 rounded-xl border bg-card p-4 text-lg font-semibold">{step.question}</p>
            <CorrectCard>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {t?.correct_answer || 'Correct answer'}:
              </span>{' '}
              {correct}
            </CorrectCard>
          </>
        )
      }
      case 'grammar': {
        const correct = step.options[step.correct]
        return (
          <>
            <PromptHeading>{pickText(step.prompt, lang)}</PromptHeading>
            <div className="mb-4 flex items-center gap-3 rounded-xl border bg-card p-4">
              <button
                type="button"
                onClick={() => speak(step.question, { lang: toSpeechLang(target) })}
                aria-label={t?.play_audio || 'Play audio'}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <p className="text-lg font-semibold">{step.question}</p>
            </div>
            <CorrectCard>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {t?.correct_answer || 'Correct answer'}:
              </span>{' '}
              {pickText(correct, lang)}
            </CorrectCard>
          </>
        )
      }
      case 'quiz': {
        const correct = step.options[step.correct]
        return (
          <>
            <PromptHeading>{pickText(step.question, lang)}</PromptHeading>
            <CorrectCard>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {t?.correct_answer || 'Correct answer'}:
              </span>{' '}
              {correct}
            </CorrectCard>
          </>
        )
      }
      case 'listen':
        return (
          <>
            <PromptHeading>{pickText(step.prompt, lang)}</PromptHeading>
            <div className="mb-4 flex items-center justify-center">
              <button
                type="button"
                onClick={() => speak(step.audio, { lang: toSpeechLang(target) })}
                aria-label={t?.replay || 'Replay'}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>
            <CorrectCard>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {t?.correct_answer || 'Correct answer'}:
              </span>{' '}
              {step.options[step.correct]}
            </CorrectCard>
          </>
        )
      case 'fillblank': {
        const [before, after] = step.sentence.split('___')
        return (
          <>
            <PromptHeading>{t?.choose_translation || 'Choose the correct answer'}</PromptHeading>
            <p className="mb-4 rounded-xl border bg-card p-4 text-lg">
              {before}
              <span className="mx-1 font-semibold text-green-700 dark:text-green-300">
                {step.options[step.correct]}
              </span>
              {after}
            </p>
            {step.explanation && <p className="mb-4 text-sm text-muted-foreground">{pickText(step.explanation, lang)}</p>}
          </>
        )
      }
      case 'dictation':
        return (
          <>
            <PromptHeading>{t?.type_what_you_hear || 'Type what you hear'}</PromptHeading>
            <div className="mb-4 flex items-center justify-center">
              <button
                type="button"
                onClick={() => speak(step.audio, { lang: toSpeechLang(target) })}
                aria-label={t?.replay || 'Replay'}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>
            <CorrectCard>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {t?.expected_answer || 'Answer'}:
              </span>{' '}
              <span className="font-mono">{step.answer}</span>
            </CorrectCard>
          </>
        )
      case 'build':
        return (
          <>
            <PromptHeading>{pickText(step.prompt, lang)}</PromptHeading>
            <p className="mb-4 rounded-xl border bg-card p-4 font-medium">{step.source}</p>
            <CorrectCard>
              <span className="font-semibold text-green-700 dark:text-green-300">
                {t?.expected_answer || 'Answer'}:
              </span>{' '}
              <span className="font-mono">{step.answer}</span>
            </CorrectCard>
          </>
        )
      case 'pairs':
        return (
          <>
            <PromptHeading>{pickText(step.prompt, lang)}</PromptHeading>
            <ul className="space-y-2">
              {step.trials.map((trial, index) => (
                <li key={index} className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
                  <span>
                    <button
                      type="button"
                      onClick={() => speak(trial.audio, { lang: toSpeechLang(target) })}
                      aria-label={t?.play_audio || 'Play audio'}
                      className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    A: {trial.choiceA} · B: {trial.choiceB}
                  </span>
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    ✓ {trial.correct === 'a' ? `A: ${trial.choiceA}` : `B: ${trial.choiceB}`}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )
      case 'match':
        return (
          <>
            <PromptHeading>{pickText(step.prompt, lang)}</PromptHeading>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {step.pairs.map((pair, index) => (
                <li key={index} className="rounded-xl border bg-card p-3 text-sm">
                  <span className="font-semibold">{pair.source}</span>
                  <span className="text-muted-foreground"> → {pair.target}</span>
                </li>
              ))}
            </ul>
          </>
        )
      case 'review':
        return (
          <>
            <PromptHeading>{t?.review_step_title || 'Review time'}</PromptHeading>
            <p className="text-sm text-muted-foreground">
              {t?.review_empty || 'No cards were due in this step.'}
            </p>
          </>
        )
      default:
        return null
    }
  })()

  if (body === null) return null

  return (
    <div data-testid="step-replay">
      {doneBadge}
      {body}
      <ContinueButton label={continueLabel} onClick={onForward} />
    </div>
  )
}
