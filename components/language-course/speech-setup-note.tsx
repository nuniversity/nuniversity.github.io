'use client'

import { useEffect, useMemo, useState } from 'react'
import { VolumeX, X } from 'lucide-react'
import { hasVoiceFor, toSpeechLang } from '@/lib/speech/speech'
import { useSpeechVoices } from '@/lib/speech/use-speech'

/**
 * Tells the learner when their device has no speech voice for one of the
 * course languages, and how to install one.
 *
 * Browser TTS reads with whatever voice the operating system provides. When
 * the needed language is missing, the engine silently substitutes another
 * language's voice and the pronunciation is wrong, so this note is the
 * difference between "the audio sounds broken" and "install one voice and it
 * works".
 *
 * Dismissal is stored per missing-language set: installing another language
 * later triggers the note again for that new gap, but an acknowledged gap
 * never nags on every page view.
 */

const DISMISS_PREFIX = 'v1:speech-setup-dismissed'

function languageDisplayName(code: string, uiLang: string): string {
  try {
    return new Intl.DisplayNames([uiLang], { type: 'language' }).of(code) || code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

function platformKey(userAgent: string): string | null {
  const ua = userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'voice_install_ios'
  if (/android/.test(ua)) return 'voice_install_android'
  if (/macintosh|mac os/.test(ua)) return 'voice_install_mac'
  if (/windows/.test(ua)) return 'voice_install_windows'
  return null
}

const INSTALL_FALLBACKS: Record<string, string> = {
  voice_install_windows: 'Windows: Settings → Time & Language → Speech → Add voices.',
  voice_install_mac: 'macOS: System Settings → Accessibility → Spoken Content → System Voice → Manage Voices.',
  voice_install_ios: 'iPhone/iPad: Settings → Accessibility → Spoken Content → Voices.',
  voice_install_android: 'Android: Settings → Accessibility → Text-to-speech output (install the language in the Google TTS app).',
  voice_install_generic: 'Add the language in your system speech settings.',
}

export function SpeechSetupNote({
  languages,
  dict,
  uiLang = 'en',
}: {
  /** Course language codes (L1 and L2), e.g. ['pt', 'en']. */
  languages: string[]
  dict?: any
  uiLang?: string
}) {
  const t = dict?.languageCourse ?? {}
  const voices = useSpeechVoices()
  const [dismissedSet, setDismissedSet] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DISMISS_PREFIX)
      setDismissedSet(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      setDismissedSet([])
    }
  }, [])

  const missing = useMemo(() => {
    // Zero voices installed: nothing to compare against, stay quiet (matches
    // LessonAudio's behaviour).
    if (voices.length === 0) return []
    return languages.filter((lang) => !hasVoiceFor(toSpeechLang(lang), voices))
  }, [languages, voices])

  const dismissedHere = useMemo(
    () => missing.length > 0 && dismissedSet.includes(missing.join(',')),
    [missing, dismissedSet]
  )

  if (voices.length === 0 || missing.length === 0 || dismissedHere) return null

  const names = missing.map((code) => languageDisplayName(code, uiLang)).join(', ')
  const hintKey = typeof navigator !== 'undefined' ? platformKey(navigator.userAgent) : null
  const hintText = hintKey
    ? (t?.[hintKey] ?? INSTALL_FALLBACKS[hintKey])
    : (t?.voice_install_generic ?? INSTALL_FALLBACKS.voice_install_generic)

  const dismiss = () => {
    const next = Array.from(new Set([...dismissedSet, missing.join(',')]))
    setDismissedSet(next)
    try {
      window.localStorage.setItem(DISMISS_PREFIX, JSON.stringify(next))
    } catch {
      // storage unavailable: the note just re-appears next visit
    }
  }

  return (
    <div
      data-testid="speech-setup-note"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/30"
      role="status"
    >
      <VolumeX className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-800 dark:text-amber-200">
          {t?.voice_missing_title || 'Audio voices missing'}
        </p>
        <p className="mt-1 text-amber-800 dark:text-amber-200/90">
          {(t?.voice_missing_body || 'Your device has no voice installed for: {langs}. Pronunciation may sound wrong. Install the language in your system speech settings.').replace(
            '{langs}',
            names
          )}
        </p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300/80">{hintText}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        data-testid="speech-setup-dismiss"
        aria-label={t?.voice_dismiss || 'Got it'}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
      >
        {t?.voice_dismiss || 'Got it'} <X className="inline h-3 w-3" />
      </button>
    </div>
  )
}
