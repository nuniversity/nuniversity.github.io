'use client'

import { useState, type ReactNode } from 'react'
import { CheckCircle2, Play, Square, Volume2, XCircle } from 'lucide-react'
import { cancelSpeech, speak, type SpeakOptions } from '@/lib/speech/speech'
import { toSpeechLang } from '@/lib/speech/speech'

/** Plays one text with the shared speech engine; owns its own playing state. */
export function AudioButton({
  text,
  lang,
  title,
  className = '',
  autoKey,
  icon,
}: {
  text: string
  /** Bare UI locale or BCP-47 tag. */
  lang: string
  title: string
  className?: string
  /** Changes whenever the audio should restart (e.g. new card shown). */
  autoKey?: string
  icon?: ReactNode
}) {
  const [playing, setPlaying] = useState(false)

  const play = () => {
    const options: SpeakOptions = {
      lang: toSpeechLang(lang),
      rate: 1,
      onEnd: () => setPlaying(false),
    }
    setPlaying(true)
    speak(text, options)
  }

  return (
    <button
      type="button"
      onClick={play}
      title={title}
      aria-label={`${title}: ${text}`}
      data-testid="audio-button"
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors hover:bg-primary/20 ${className}`}
    >
      {icon ?? <Volume2 className="h-4 w-4" />}
    </button>
  )
}

/** Step prompt heading with the skill chip. */
export function PromptHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-lg font-semibold leading-snug">{children}</h2>
}

/** Bottom feedback strip used by every graded step. */
export function FeedbackBar({
  state,
  correctLabel,
  almostLabel,
  incorrectLabel,
  explanation,
  nextLabel,
  onNext,
  autoFocus = true,
}: {
  state: 'correct' | 'almost' | 'wrong'
  correctLabel: string
  almostLabel?: string
  incorrectLabel: string
  explanation?: ReactNode
  nextLabel: string
  onNext: () => void
  autoFocus?: boolean
}) {
  const tone =
    state === 'correct'
      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
      : state === 'almost'
        ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30'
        : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
  const label =
    state === 'correct' ? correctLabel : state === 'almost' ? almostLabel || incorrectLabel : incorrectLabel
  return (
    <div className={`mt-4 rounded-lg border p-4 ${tone}`} aria-live="polite" data-testid="step-feedback">
      <p
        className={`flex items-center gap-2 text-sm font-semibold ${
          state === 'correct'
            ? 'text-green-800 dark:text-green-200'
            : state === 'almost'
              ? 'text-amber-800 dark:text-amber-200'
              : 'text-red-800 dark:text-red-200'
        }`}
      >
        {state === 'wrong' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        {label}
      </p>
      {explanation && <div className="mt-1 text-sm text-foreground/80">{explanation}</div>}
      <button
        type="button"
        onClick={onNext}
        autoFocus={autoFocus}
        className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {nextLabel}
      </button>
    </div>
  )
}

/** Standard multiple-choice option button. */
export function OptionButton({
  children,
  onClick,
  state,
  index,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  state: 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed'
  index: number
  disabled?: boolean
}) {
  const variant =
    state === 'correct'
      ? 'border-green-500 bg-green-50 dark:bg-green-950/30 cursor-default'
      : state === 'wrong'
        ? 'border-red-500 bg-red-50 dark:bg-red-950/30 cursor-default'
        : state === 'dimmed'
          ? 'border-border opacity-60 cursor-default'
          : state === 'selected'
            ? 'border-primary bg-primary/5 cursor-pointer'
            : 'border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={`option-${index}`}
      className={`w-full rounded-lg border p-3 text-left text-sm transition-colors sm:text-base ${variant}`}
    >
      <span className="mr-2 font-semibold text-muted-foreground">{String.fromCharCode(65 + index)}.</span>
      {children}
    </button>
  )
}

/** Localized label lookup with EN fallback, shared by all steps. */
export function pickText(
  value: { en: string; pt: string; es?: string } | undefined,
  lang: string
): string {
  if (!value) return ''
  const key = (['en', 'pt', 'es'] as const).includes(lang as 'en' | 'pt' | 'es')
    ? (lang as 'en' | 'pt' | 'es')
    : 'en'
  return value[key] ?? value.en ?? ''
}

export { cancelSpeech, Play, Square }
