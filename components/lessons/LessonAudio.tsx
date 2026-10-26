// components/lessons/LessonAudio.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, Pause, Square, Loader2 } from 'lucide-react'

interface LessonAudioProps {
  /** The text to read aloud. */
  text: string
  /** BCP-47 language tag for the reading voice, e.g. `en-US`. */
  lang: string
  /** Label for the control. */
  label?: string
  /** Accessible description of what the control does. */
  description?: string
}

type Status = 'idle' | 'speaking' | 'paused'

/**
 * Reads a lesson aloud using the browser's built-in speech engine.
 *
 * The Web Speech API is available in every current browser and needs no
 * dependency, no audio files, and no server round-trip. The control is
 * opt-in: nothing is read until the learner presses play.
 */
export default function LessonAudio({
  text,
  lang,
  label = 'Listen',
  description,
}: LessonAudioProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [supported, setSupported] = useState(true)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  /** Picks the best available voice for the lesson language. */
  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) return null
    const base = lang.split('-')[0].toLowerCase()
    return (
      voices.find(v => v.lang.toLowerCase() === lang.toLowerCase()) ??
      voices.find(v => v.lang.toLowerCase().startsWith(base)) ??
      voices.find(v => v.lang.toLowerCase().includes(base)) ??
      null
    )
  }, [lang])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    utteranceRef.current = null
    setStatus('idle')
  }, [])

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 1
    const voice = pickVoice()
    if (voice) utterance.voice = voice

    utterance.onend = () => setStatus('idle')
    utterance.onerror = () => setStatus('idle')

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setStatus('speaking')
  }, [text, lang, pickVoice])

  const toggle = useCallback(() => {
    if (status === 'speaking') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause()
      }
      setStatus('paused')
      return
    }
    if (status === 'paused') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume()
      }
      setStatus('speaking')
      return
    }
    speak()
  }, [status, speak])

  if (!supported || !text.trim()) return null

  return (
    <div className="not-prose my-6 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={status === 'speaking' ? 'Pause reading aloud' : label}
        title={description || label}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors hover:bg-primary/20"
      >
        {status === 'speaking' ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {status === 'speaking'
            ? 'Reading aloud…'
            : status === 'paused'
              ? 'Paused'
              : label}
        </p>
        {description && (
          <p className="truncate text-xs text-foreground-muted">{description}</p>
        )}
      </div>

      {status !== 'idle' && (
        <button
          type="button"
          onClick={stop}
          aria-label="Stop reading aloud"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
        >
          <Square className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
