'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import type {
  FillBlankStep,
  GrammarStep,
  ListenStep,
  QuizStep,
  SelectStep,
} from '@/lib/language-courses/types'
import { speak, toSpeechLang } from '@/lib/speech/speech'
import { FeedbackBar, OptionButton, PromptHeading, pickText } from './step-ui'
import type { StepProps } from './steps-content'

/** Shared state machine for single-question choice steps. */
type ChoicePhase = 'answering' | 'feedback'

function useChoice(onResult: (correct: boolean) => void, onComplete: () => void) {
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<ChoicePhase>('answering')
  const recordedRef = useRef(false)

  const choose = (index: number, correct: number) => {
    if (phase !== 'answering') return
    setSelected(index)
    setPhase('feedback')
    if (!recordedRef.current) {
      recordedRef.current = true
      onResult(index === correct)
    }
  }

  const next = () => {
    onComplete()
  }

  return { selected, phase, choose, next }
}

// ---------------------------------------------------------------------------
// select — translation / meaning multiple choice.
// ---------------------------------------------------------------------------

export function StepSelect({
  step,
  target,
  t,
  onResult,
  onComplete,
}: StepProps & { step: SelectStep }) {
  const { selected, phase, choose, next } = useChoice(onResult, onComplete)
  return (
    <div data-testid="step-select">
      <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
      <div className="mb-4 rounded-xl border bg-card p-4 text-xl font-semibold">
        {step.question}
      </div>
      <div className="space-y-2">
        {step.options.map((option, index) => (
          <OptionButton
            key={index}
            index={index}
            onClick={() => choose(index, step.correct)}
            state={
              phase === 'answering'
                ? 'idle'
                : index === step.correct
                  ? 'correct'
                  : index === selected
                    ? 'wrong'
                    : 'dimmed'
            }
            disabled={phase !== 'answering'}
          >
            {option}
          </OptionButton>
        ))}
      </div>
      {phase === 'feedback' && (
        <FeedbackBar
          state={selected === step.correct ? 'correct' : 'wrong'}
          correctLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          explanation={step.explanation && pickText(step.explanation, 'pt')}
          nextLabel={t?.continue || 'Continue'}
          onNext={next}
        />
      )}
      {phase === 'answering' && step.speak && (
        <button
          type="button"
          onClick={() => speak(step.speak!, { lang: toSpeechLang(target) })}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Volume2 className="h-4 w-4" />
          {t?.play_audio || 'Play audio'}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// listen — hear a sentence, choose what you heard.
// ---------------------------------------------------------------------------

export function StepListen({
  step,
  target,
  t,
  onResult,
  onComplete,
}: StepProps & { step: ListenStep }) {
  const { selected, phase, choose, next } = useChoice(onResult, onComplete)
  const maxPlays = step.maxPlays ?? 3
  const [plays, setPlays] = useState(0)
  const autoPlayed = useRef(false)

  const play = () => {
    if (plays >= maxPlays && phase === 'answering') return
    setPlays((count) => count + 1)
    speak(step.audio, { lang: toSpeechLang(target) })
  }

  useEffect(() => {
    if (autoPlayed.current) return
    autoPlayed.current = true
    setPlays(1)
    speak(step.audio, { lang: toSpeechLang(target) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div data-testid="step-listen">
      <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={play}
          disabled={phase === 'answering' && plays >= maxPlays}
          data-testid="listen-play"
          aria-label={t?.replay || 'Replay'}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Volume2 className="h-6 w-6" />
        </button>
        {phase === 'answering' && (
          <span className="text-xs text-muted-foreground">
            {Math.max(0, maxPlays - plays)} / {maxPlays}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {step.options.map((option, index) => (
          <OptionButton
            key={index}
            index={index}
            onClick={() => choose(index, step.correct)}
            state={
              phase === 'answering'
                ? 'idle'
                : index === step.correct
                  ? 'correct'
                  : index === selected
                    ? 'wrong'
                    : 'dimmed'
            }
            disabled={phase !== 'answering'}
          >
            {option}
          </OptionButton>
        ))}
      </div>
      {phase === 'feedback' && (
        <FeedbackBar
          state={selected === step.correct ? 'correct' : 'wrong'}
          correctLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          nextLabel={t?.continue || 'Continue'}
          onNext={next}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// fillblank — cloze with options.
// ---------------------------------------------------------------------------

export function StepFillBlank({
  step,
  t,
  onResult,
  onComplete,
}: StepProps & { step: FillBlankStep }) {
  const { selected, phase, choose, next } = useChoice(onResult, onComplete)
  const [before, after] = step.sentence.split('___')
  return (
    <div data-testid="step-fillblank">
      <PromptHeading>{t?.choose_translation || 'Choose the correct answer'}</PromptHeading>
      <div className="mb-4 rounded-xl border bg-card p-4 text-lg leading-relaxed">
        {before}
        <span
          className={`mx-1 inline-block min-w-[3rem] rounded-md border-b-2 px-2 text-center font-semibold ${
            phase === 'feedback'
              ? selected === step.correct
                ? 'border-green-500 text-green-700 dark:text-green-300'
                : 'border-red-500 text-red-700 dark:text-red-300'
              : 'border-primary/50'
          }`}
          data-testid="blank"
        >
          {phase === 'feedback' && selected !== null ? step.options[selected] : '?'}
        </span>
        {after}
      </div>
      {step.translation && (
        <p className="mb-4 text-sm text-muted-foreground">{pickText(step.translation, 'pt')}</p>
      )}
      <div className="space-y-2">
        {step.options.map((option, index) => (
          <OptionButton
            key={index}
            index={index}
            onClick={() => choose(index, step.correct)}
            state={
              phase === 'answering'
                ? 'idle'
                : index === step.correct
                  ? 'correct'
                  : index === selected
                    ? 'wrong'
                    : 'dimmed'
            }
            disabled={phase !== 'answering'}
          >
            {option}
          </OptionButton>
        ))}
      </div>
      {phase === 'feedback' && (
        <FeedbackBar
          state={selected === step.correct ? 'correct' : 'wrong'}
          correctLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          explanation={step.explanation && pickText(step.explanation, 'pt')}
          nextLabel={t?.continue || 'Continue'}
          onNext={next}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// grammar — structured input (Processing Instruction): interpret the sentence.
// ---------------------------------------------------------------------------

export function StepGrammar({
  step,
  lang,
  target,
  t,
  onResult,
  onComplete,
}: StepProps & { step: GrammarStep }) {
  const { selected, phase, choose, next } = useChoice(onResult, onComplete)
  const autoPlayed = useRef(false)

  useEffect(() => {
    if (autoPlayed.current || step.speak === false) return
    autoPlayed.current = true
    speak(step.question, { lang: toSpeechLang(target) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div data-testid="step-grammar">
      <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
      <div className="mb-2 flex items-center gap-3 rounded-xl border bg-card p-4">
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
      <div className="space-y-2">
        {step.options.map((option, index) => (
          <OptionButton
            key={index}
            index={index}
            onClick={() => choose(index, step.correct)}
            state={
              phase === 'answering'
                ? 'idle'
                : index === step.correct
                  ? 'correct'
                  : index === selected
                    ? 'wrong'
                    : 'dimmed'
            }
            disabled={phase !== 'answering'}
          >
            {pickText(option, lang)}
          </OptionButton>
        ))}
      </div>
      {phase === 'feedback' && (
        <FeedbackBar
          state={selected === step.correct ? 'correct' : 'wrong'}
          correctLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          explanation={step.explanation && pickText(step.explanation, 'pt')}
          nextLabel={t?.continue || 'Continue'}
          onNext={next}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// quiz — unit-review question.
// ---------------------------------------------------------------------------

export function StepQuiz({
  step,
  t,
  onResult,
  onComplete,
}: StepProps & { step: QuizStep }) {
  const { selected, phase, choose, next } = useChoice(onResult, onComplete)
  return (
    <div data-testid="step-quiz">
      <PromptHeading>{pickText(step.question, 'pt')}</PromptHeading>
      <div className="space-y-2">
        {step.options.map((option, index) => (
          <OptionButton
            key={index}
            index={index}
            onClick={() => choose(index, step.correct)}
            state={
              phase === 'answering'
                ? 'idle'
                : index === step.correct
                  ? 'correct'
                  : index === selected
                    ? 'wrong'
                    : 'dimmed'
            }
            disabled={phase !== 'answering'}
          >
            {option}
          </OptionButton>
        ))}
      </div>
      {phase === 'feedback' && (
        <FeedbackBar
          state={selected === step.correct ? 'correct' : 'wrong'}
          correctLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          explanation={step.explanation && pickText(step.explanation, 'pt')}
          nextLabel={t?.continue || 'Continue'}
          onNext={next}
        />
      )}
    </div>
  )
}
