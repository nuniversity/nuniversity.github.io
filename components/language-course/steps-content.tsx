'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Volume2 } from 'lucide-react'
import type { LanguageLesson, VocabItem, GrammarPoint } from '@/lib/language-courses/types'
import {
  getVoices,
  pickNarratorVoice,
  pickVoice,
  speak,
  speakTurns,
  toSpeechLang,
  type SpeakTurn,
} from '@/lib/speech/speech'
import { PromptHeading, pickText } from './step-ui'

/**
 * Common props for every step component. `onResult(correct)` records one
 * graded trial; `onComplete()` advances the player. Content steps call
 * `onResult(true)` once before advancing.
 */
export interface StepProps {
  lang: string
  /** Course L1 (learner's language) for TTS. */
  source: string
  /** Course L2 (target language) for TTS. */
  target: string
  t: any
  onResult: (correct: boolean) => void
  onComplete: () => void
  vocabById: Map<string, VocabItem>
  grammarById: Map<string, GrammarPoint>
}

// ---------------------------------------------------------------------------
// knowledge — graded general-knowledge fact (CLIL).
// ---------------------------------------------------------------------------

export function StepKnowledge({
  step,
  lang,
  target,
  t,
  onComplete,
}: StepProps & { step: Extract<LanguageLesson['steps'][number], { type: 'knowledge' }> }) {
  const [showTranslation, setShowTranslation] = useState(false)
  const translation = pickText(step.translation, lang)
  return (
    <div data-testid="step-knowledge">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        💡 {t?.knowledge_title || 'Did you know?'}
      </div>
      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{pickText(step.title, lang)}</h3>
          <button
            type="button"
            onClick={() => speak(step.text, { lang: toSpeechLang(target) })}
            aria-label={t?.play_audio || 'Play audio'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
        {step.emoji && <p className="mb-3 text-4xl">{step.emoji}</p>}
        <p className="leading-relaxed">{step.text}</p>
        {showTranslation ? (
          <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">{translation}</p>
        ) : (
          <button
            type="button"
            onClick={() => setShowTranslation(true)}
            className="mt-3 text-sm font-medium text-primary hover:opacity-80"
          >
            {lang === 'pt' ? 'Mostrar tradução' : lang === 'es' ? 'Mostrar traducción' : 'Show translation'}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          // Content steps are exposure, not testing: they never deduct score.
          onComplete()
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
      >
        {t?.continue || 'Continue'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/**
 * Renders a line with its target forms bolded (textual input enhancement,
 * Lee & Huang 2008): draws noticing to the grammar the lesson teaches while
 * the line keeps its meaning-first reading.
 */
export function renderEnhancedText(text: string, enhance?: string[]): ReactNode {
  if (!enhance || enhance.length === 0) return text
  const parts: ReactNode[] = []
  let rest = text
  let key = 0
  for (const form of enhance) {
    const at = rest.indexOf(form)
    if (at === -1) continue
    if (at > 0) parts.push(rest.slice(0, at))
    parts.push(
      <strong key={`enh-${key++}`} className="font-extrabold text-primary">
        {form}
      </strong>
    )
    rest = rest.slice(at + form.length)
  }
  if (rest) parts.push(rest)
  return parts
}

// ---------------------------------------------------------------------------
// input — dialogue / story with per-line audio.
// ---------------------------------------------------------------------------

export function StepInput({
  step,
  lang,
  target,
  t,
  onComplete,
}: StepProps & { step: Extract<LanguageLesson['steps'][number], { type: 'input' }> }) {
  const [revealed, setRevealed] = useState<number>(0)

  // Play the dialogue as a mini audioplay: each speaker gets their preferred
  // voice gender (name-matched voice, or pitch compensation when the system
  // only has one voice for the language). The narrator (any line without a
  // gender) gets a distinct voice when the system has a spare one, and
  // otherwise a lower pitch at a slower rate, storyteller style.
  const turnFor = (line: { text: string; gender?: 'male' | 'female' }): SpeakTurn => {
    if (line.gender === 'male' || line.gender === 'female') {
      return { text: line.text, gender: line.gender }
    }
    const voices = getVoices()
    const speechLang = toSpeechLang(target)
    const narrator = pickNarratorVoice(speechLang, voices, [
      pickVoice(speechLang, voices, 'male')?.voiceURI,
      pickVoice(speechLang, voices, 'female')?.voiceURI,
    ])
    return {
      text: line.text,
      voiceURI: narrator.voiceURI,
      pitch: narrator.pitch,
      rate: narrator.rate ?? 0.95,
    }
  }

  const playAll = () => {
    speakTurns(step.lines.map(turnFor), { lang: toSpeechLang(target) })
  }

  return (
    <div data-testid="step-input">
      {step.title && <PromptHeading>{pickText(step.title, lang)}</PromptHeading>}
      <div className="space-y-2">
        {step.lines.map((line, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl border bg-card p-3"
          >
            <button
              type="button"
              onClick={() =>
                speak(line.text, { ...turnFor(line), lang: toSpeechLang(target) })
              }
              aria-label={`${t?.play_audio || 'Play audio'}: ${line.text}`}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary hover:bg-primary/20"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted-foreground">
                {line.gender === 'male' ? '👨' : line.gender === 'female' ? '👩' : '📖'} {line.speaker}
              </p>
              <p className="font-medium leading-snug">{renderEnhancedText(line.text, line.enhance)}</p>
              {revealed > index && (
                <p className="mt-1 text-sm text-muted-foreground">{line.translation}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {revealed < step.lines.length ? (
          <button
            type="button"
            onClick={() => setRevealed(step.lines.length)}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t?.reveal || 'Reveal'} ({revealed}/{step.lines.length})
          </button>
        ) : null}
        <button
          type="button"
          onClick={playAll}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          {t?.play_audio || 'Play audio'}
        </button>
        <button
          type="button"
          onClick={() => onComplete()}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t?.continue || 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// vocab — new-word introduction cards with auto audio.
// ---------------------------------------------------------------------------

export function StepVocab({
  step,
  lang,
  target,
  source,
  t,
  vocabById,
  onResult,
  onComplete,
}: StepProps & { step: Extract<LanguageLesson['steps'][number], { type: 'vocab' }> }) {
  const items = useMemo(
    () => step.vocabIds.map((id) => vocabById.get(id)).filter(Boolean) as VocabItem[],
    [step.vocabIds, vocabById]
  )
  const [index, setIndex] = useState(0)
  const current = items[index]

  useEffect(() => {
    if (!current) return
    speak(current.source, { lang: toSpeechLang(target) })
    // Auto-play when a new word card appears (progressive enhancement: on iOS
    // the tap that opened the step counts as the user gesture).
  }, [current, target])

  if (!current) {
    // Unknown ids: validator blocks this; fail soft in the player.
    return null
  }

  const last = index === items.length - 1
  return (
    <div data-testid="step-vocab">
      <PromptHeading>{t?.new_words || 'New words'}</PromptHeading>
      <div className="rounded-2xl border bg-card p-8 text-center">
        {current.emoji && <p className="mb-3 text-5xl">{current.emoji}</p>}
        <p className="text-3xl font-bold">{current.source}</p>
        <p className="mt-2 text-lg text-muted-foreground">{current.target}</p>
        {current.example && (
          <div className="mt-4 rounded-xl bg-accent/40 p-3 text-sm">
            <p className="italic">{current.example}</p>
            {current.exampleTarget && <p className="mt-1 text-muted-foreground">{current.exampleTarget}</p>}
          </div>
        )}
        {current.mnemonic && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-snug text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            💡 {pickText(current.mnemonic, lang)}
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => speak(current.source, { lang: toSpeechLang(target) })}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            🔊 {target.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => speak(current.target, { lang: toSpeechLang(source) })}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            🔊 {source.toUpperCase()}
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
          data-testid="vocab-back"
          aria-label={t?.back || 'Back'}
          className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          ←
        </button>
        <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={() => setIndex(index + 1)}
          disabled={last}
          data-testid="vocab-forward"
          aria-label={t?.forward || 'Forward'}
          className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          →
        </button>
      </div>
      <div className="mt-4 flex justify-center">
        {last ? (
          <button
            type="button"
            onClick={() => {
              onResult(true)
              onComplete()
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t?.continue || 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex(index + 1)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t?.continue || 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// tip — grammar pattern card (the only "teaching" moment, ≤3 lines).
// ---------------------------------------------------------------------------

export function StepTip({
  step,
  lang,
  t,
  grammarById,
  onComplete,
}: StepProps & { step: Extract<LanguageLesson['steps'][number], { type: 'tip' }> }) {
  const point = grammarById.get(step.grammarId)
  const [showExamples, setShowExamples] = useState(false)
  if (!point) return null
  return (
    <div data-testid="step-tip">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        ⚡ {t?.grammar_tip || 'Pattern'}
      </div>
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="text-lg font-semibold">{pickText(point.title, lang)}</h3>
        <p className="mt-2 rounded-lg bg-accent/40 px-3 py-2 font-mono text-sm">{point.pattern}</p>
        <p className="mt-3 leading-relaxed">{pickText(point.tip, lang)}</p>
        {point.compare && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t?.compare_title || 'L1 habit vs target'}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30">
                <p className="font-semibold text-red-700 dark:text-red-300">✗ {point.compare.pt}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/30">
                <p className="font-semibold text-green-700 dark:text-green-300">✓ {point.compare.en}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{pickText(point.compare.note, lang)}</p>
          </div>
        )}
        {point.examples.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="text-sm font-medium text-primary hover:opacity-80"
            >
              {showExamples ? '▾' : '▸'} {lang === 'pt' ? 'Exemplos' : lang === 'es' ? 'Ejemplos' : 'Examples'} ({point.examples.length})
            </button>
            {showExamples && (
              <ul className="mt-2 space-y-1 text-sm">
                {point.examples.map((example, index) => (
                  <li key={index} className="rounded-lg bg-accent/40 px-3 py-2">
                    {example.en} <span className="text-muted-foreground">— {example.pt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onComplete()}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
      >
        {t?.continue || 'Continue'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}
