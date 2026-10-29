'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Play, Square, Volume2 } from 'lucide-react'
import type { BuildStep, DictationStep, SpeakStep } from '@/lib/language-courses/types'
import { speak, toSpeechLang } from '@/lib/speech/speech'
import { checkDictation, normalizeAnswer, sameTokenSequence, shuffle, type DictationVerdict } from '@/lib/language-courses/check'
import { FeedbackBar, PromptHeading, pickText } from './step-ui'
import type { StepProps } from './steps-content'

// ---------------------------------------------------------------------------
// dictation — hear a sentence, type it.
// ---------------------------------------------------------------------------

export function StepDictation({
  step,
  target,
  t,
  onResult,
  onComplete,
}: StepProps & { step: DictationStep }) {
  const [typed, setTyped] = useState('')
  const [verdict, setVerdict] = useState<DictationVerdict | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recordedRef = useRef(false)

  useEffect(() => {
    speak(step.audio, { lang: toSpeechLang(target) })
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const check = () => {
    if (verdict) return
    const result = checkDictation(step.answer, typed)
    setVerdict(result)
    if (!recordedRef.current) {
      recordedRef.current = true
      onResult(result !== 'wrong')
    }
  }

  return (
    <div data-testid="step-dictation">
      <PromptHeading>{t?.type_what_you_hear || 'Type what you hear'}</PromptHeading>
      <div className="mb-4 flex items-center justify-center">
        <button
          type="button"
          onClick={() => speak(step.audio, { lang: toSpeechLang(target) })}
          data-testid="dictation-play"
          aria-label={t?.replay || 'Replay'}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          <Volume2 className="h-6 w-6" />
        </button>
      </div>
      {step.hint && <p className="mb-3 text-center text-sm text-muted-foreground">{pickText(step.hint, 'pt')}</p>}
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && typed.trim().length > 0) check()
        }}
        disabled={verdict !== null}
        placeholder={t?.type_what_you_hear || 'Type what you hear'}
        aria-label={t?.type_what_you_hear || 'Type what you hear'}
        className="w-full rounded-xl border bg-card px-4 py-3 text-lg outline-none focus:border-primary"
        data-testid="dictation-input"
      />
      {verdict === null ? (
        <button
          type="button"
          onClick={check}
          disabled={typed.trim().length === 0}
          className="mt-4 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          data-testid="dictation-check"
        >
          {t?.check || 'Check'}
        </button>
      ) : (
        <FeedbackBar
          state={verdict}
          correctLabel={t?.correct || 'Correct'}
          almostLabel={t?.almost_correct || 'Almost! Check the highlighted word.'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          explanation={verdict !== 'correct' ? <p className="font-mono">{step.answer}</p> : undefined}
          nextLabel={t?.continue || 'Continue'}
          onNext={() => onComplete()}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// build — assemble the sentence from a word bank.
// ---------------------------------------------------------------------------

export function StepBuild({
  step,
  target,
  t,
  onResult,
  onComplete,
}: StepProps & { step: BuildStep }) {
  const bank = useMemo(() => shuffle(step.bank), [step.bank])
  const [chosen, setChosen] = useState<number[]>([])
  const [phase, setPhase] = useState<'answering' | 'correct' | 'wrong'>('answering')
  const recordedRef = useRef(false)

  const answerTokens = chosen.map((bankIndex) => bank[bankIndex])
  const correct = sameTokenSequence(
    step.answer.replace(/\s+([.,!?;:'"])/g, '$1').split(/\s+/),
    answerTokens
  )

  const submit = () => {
    if (phase !== 'answering' || chosen.length === 0) return
    const isCorrect = correct
    setPhase(isCorrect ? 'correct' : 'wrong')
    if (!recordedRef.current) {
      recordedRef.current = true
      onResult(isCorrect)
    }
    if (isCorrect) speak(step.answer, { lang: toSpeechLang(target) })
  }

  const retry = () => {
    setChosen([])
    setPhase('answering')
  }

  const available = bank.map((_, index) => index).filter((index) => !chosen.includes(index))

  return (
    <div data-testid="step-build">
      <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
      <p className="mb-4 rounded-xl border bg-card p-4 text-lg font-medium">{step.source}</p>
      <div
        className="mb-4 min-h-[4rem] rounded-xl border border-dashed bg-card p-3"
        data-testid="build-answer"
        aria-live="polite"
      >
        {answerTokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t?.bank_empty || 'Tap words below'}</p>
        ) : (
          <p className="text-lg leading-relaxed">{answerTokens.join(' ')}</p>
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-2" data-testid="build-bank">
        {bank.map((token, index) => (
          <button
            key={`${token}-${index}`}
            type="button"
            disabled={!available.includes(index) || phase !== 'answering'}
            onClick={() => setChosen((current) => [...current, index])}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              available.includes(index)
                ? 'bg-card hover:border-primary/50 hover:bg-accent/50'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {token}
          </button>
        ))}
      </div>
      {phase === 'answering' ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={chosen.length === 0}
            data-testid="build-check"
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {t?.check || 'Check'}
          </button>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t?.reset_words || 'Reset'}
          </button>
        </div>
      ) : (
        <FeedbackBar
          state={phase === 'correct' ? 'correct' : 'wrong'}
          correctLabel={t?.correct || 'Correct'}
          incorrectLabel={t?.incorrect || 'Not quite'}
          explanation={phase === 'wrong' ? <p className="font-mono">{step.answer}</p> : undefined}
          nextLabel={t?.continue || 'Continue'}
          onNext={() => onComplete()}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// speak — shadowing: play, repeat aloud, optional self-recording.
//
// Recording must degrade gracefully: permission prompts can be denied, some
// browsers only record to specific mime types, insecure contexts (plain HTTP
// on a non-localhost host) hide `navigator.mediaDevices` entirely, and
// `MediaRecorder.stop()` throws when called on an inactive recorder. Every
// failure path lands on an explicit, translated note instead of a dead button.
// ---------------------------------------------------------------------------

type MediaState = 'idle' | 'recording' | 'recorded' | 'error'
type MediaError = 'unsupported' | 'insecure' | 'denied' | 'not-found' | 'empty' | 'failed'

const MEDIA_NOTE_KEYS: Record<MediaError, string> = {
  unsupported: 'mic_unavailable',
  insecure: 'mic_insecure',
  denied: 'mic_denied',
  'not-found': 'mic_not_found',
  empty: 'recording_empty',
  failed: 'recording_failed',
}

const MEDIA_NOTE_FALLBACKS: Record<MediaError, string> = {
  unsupported: 'Microphone not available here. Just say it out loud.',
  insecure: 'Recording needs a secure page (HTTPS or localhost).',
  denied: 'Microphone permission denied. Allow the microphone in your browser to record.',
  'not-found': 'No microphone found on this device.',
  empty: 'The recording came out empty. Try again.',
  failed: 'Recording failed. Try again.',
}

/** First supported recording mime type, or '' to let the browser choose. */
function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported?.(type)) return type
    } catch {
      // keep looking
    }
  }
  return ''
}

export function StepSpeak({
  step,
  lang,
  target,
  source,
  t,
  onResult,
  onComplete,
}: StepProps & { step: SpeakStep }) {
  const [lineIndex, setLineIndex] = useState(0)
  const [saidIt, setSaidIt] = useState<boolean[]>([])
  const [mediaState, setMediaState] = useState<MediaState>('idle')
  const [mediaError, setMediaError] = useState<MediaError | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)
  const recordedRef = useRef(false)

  const line = step.lines[lineIndex]
  const last = lineIndex === step.lines.length - 1

  const playLine = () => {
    speak(line.text, { lang: toSpeechLang(target) })
  }

  useEffect(() => {
    playLine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex])

  const fail = (reason: MediaError) => {
    setMediaError(reason)
    setMediaState('error')
  }

  const startRecording = async () => {
    setMediaError(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // An insecure context (plain HTTP on a non-localhost host) hides
      // `navigator.mediaDevices` entirely.
      fail(typeof window !== 'undefined' && window.isSecureContext === false ? 'insecure' : 'unsupported')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      const name = (error as DOMException)?.name
      if (name === 'NotAllowedError' || name === 'SecurityError') fail('denied')
      else if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'NotReadableError') fail('not-found')
      else fail('failed')
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      // Permission was granted but the browser cannot record: tell the
      // learner the feature is unavailable rather than hanging.
      try {
        stream.getTracks().forEach((track) => track.stop())
      } catch {
        // ignore
      }
      fail('unsupported')
      return
    }

    try {
      const mimeType = pickRecorderMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onerror = () => {
        try {
          stream.getTracks().forEach((track) => track.stop())
        } catch {
          // ignore
        }
        fail('failed')
      }
      recorder.onstop = () => {
        try {
          stream.getTracks().forEach((track) => track.stop())
        } catch {
          // ignore
        }
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        const blobType = recorder.mimeType || mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })
        if (blob.size === 0) {
          fail('empty')
          return
        }
        audioUrlRef.current = URL.createObjectURL(blob)
        setMediaState('recorded')
      }
      recorderRef.current = recorder
      // Timeslice: some browsers never fire `ondataavailable` without one.
      recorder.start(250)
      setMediaState('recording')
    } catch {
      try {
        stream.getTracks().forEach((track) => track.stop())
      } catch {
        // ignore
      }
      fail('failed')
    }
  }

  const stopRecording = () => {
    const recorder = recorderRef.current
    if (!recorder) return
    // Calling stop() on an inactive recorder throws InvalidStateError and
    // would leave the UI stuck in "recording".
    if (recorder.state === 'recording') {
      try {
        recorder.stop()
      } catch {
        fail('failed')
      }
    } else if (chunksRef.current.length === 0) {
      fail('empty')
    } else {
      setMediaState('idle')
    }
  }

  const playRecording = () => {
    const url = audioUrlRef.current
    if (!url) return
    try {
      const audio = new Audio(url)
      audio.play().catch(() => fail('failed'))
    } catch {
      fail('failed')
    }
  }

  const confirmSaid = () => {
    if (!recordedRef.current) {
      recordedRef.current = true
      // Speaking practice is self-graded: showing up is the win (R7: shadowing
      // trains the listening muscle; ASR scoring is deliberately out of scope).
      onResult(true)
    }
    const nextSaid = [...saidIt]
    nextSaid[lineIndex] = true
    setSaidIt(nextSaid)
    if (last) {
      onComplete()
    } else {
      setLineIndex(lineIndex + 1)
      setMediaState('idle')
      setMediaError(null)
    }
  }

  const noteText = mediaError
    ? (t?.[MEDIA_NOTE_KEYS[mediaError]] ?? MEDIA_NOTE_FALLBACKS[mediaError])
    : null

  return (
    <div data-testid="step-speak">
      <PromptHeading>{pickText(step.prompt, 'pt')}</PromptHeading>
      <p className="mb-4 text-sm text-muted-foreground">{t?.shadow_hint || 'Play the audio, then repeat out loud.'}</p>
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="text-2xl font-semibold leading-snug">{line.text}</p>
        <p className="mt-2 text-sm text-muted-foreground">{line.translation}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={playLine}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Play className="h-4 w-4" />
            {t?.listen_again || 'Listen again'}
          </button>
          {mediaState === 'recording' ? (
            <button
              type="button"
              onClick={stopRecording}
              data-testid="speak-stop"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Square className="h-4 w-4" />
              {t?.stop_recording || 'Stop'}
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              data-testid="speak-record"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <Mic className="h-4 w-4" />
              {t?.record || 'Record'}
            </button>
          )}
          {mediaState === 'recorded' && (
            <button
              type="button"
              onClick={playRecording}
              data-testid="speak-playback"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <Play className="h-4 w-4" />
              {t?.playback || 'Play my recording'}
            </button>
          )}
        </div>
        {noteText && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-400" data-testid="speak-note" role="status">
            {noteText}
          </p>
        )}
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={confirmSaid}
          data-testid="said-it"
          className="rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700"
        >
          ✓ {t?.i_said_it || 'I said it'}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            setLineIndex(lineIndex - 1)
            setMediaState('idle')
            setMediaError(null)
          }}
          disabled={lineIndex === 0}
          data-testid="speak-back"
          aria-label={t?.back || 'Back'}
          className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          ←
        </button>
        <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">
          {lineIndex + 1} / {step.lines.length}
        </span>
        <button
          type="button"
          onClick={() => {
            setLineIndex(lineIndex + 1)
            setMediaState('idle')
            setMediaError(null)
          }}
          disabled={last}
          data-testid="speak-forward"
          aria-label={t?.forward || 'Forward'}
          className="rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  )
}
