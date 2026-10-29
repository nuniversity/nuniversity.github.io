/**
 * Shared browser text-to-speech service.
 *
 * Every audio feature in the app (lesson read-aloud, language-course dialogues,
 * listening exercises, flashcards, review cards) speaks through this module so
 * voice selection, queue semantics and rate handling stay consistent.
 *
 * Design notes:
 * - No module-level voice cache: voices are resolved at call/mount time. The
 *   voice list is populated asynchronously by the OS (Chrome fires
 *   `voiceschanged` late), so consumers that display the list must load it on
 *   mount (see `useSpeechVoices`).
 * - `speakSequence` cancels once, then queues every text as its own utterance.
 *   The last utterance carries `onEnd`, so a consumer's "playing" state ends
 *   exactly when the audio does. WebKit cancels queued utterances
 *   asynchronously; queueing immediately after `cancel()` matches the
 *   behaviour proven by `tests/lessons/lesson-audio.test.tsx`.
 * - Errors are treated as "ended": a missing voice or a cancelled utterance
 *   must never leave a consumer stuck in a playing state.
 * - iOS/Safari only start audio within a user gesture; all call sites therefore
 *   trigger speech from a click handler first, and auto-play is a progressive
 *   enhancement that falls back to an explicit play button.
 */

/** UI locale (or bare language code) → BCP-47 tag for speech synthesis. */
const SPEECH_LANG_MAP: Record<string, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  de: 'de-DE',
}

export function toSpeechLang(locale: string): string {
  const lower = locale.toLowerCase()
  if (SPEECH_LANG_MAP[lower]) return SPEECH_LANG_MAP[lower]
  // Already a BCP-47 tag (e.g. `pt-BR`): pass through unchanged.
  return locale
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// ---------------------------------------------------------------------------
// Voice gender.
//
// The standard Web Speech API does not expose gender metadata (native OS APIs
// like Windows.Media or AVFoundation do), so the browser approximation is:
//  1. Match gendered voice NAMES (Microsoft Zira/Female, Google UK English
//     Male, Luciana, Antonio, David, Samantha, ...).
//  2. When no gendered voice exists for the language, compensate with pitch
//     so two speakers still sound distinct with a single installed voice.
// ---------------------------------------------------------------------------

export type VoiceGender = 'male' | 'female'

/** `female` must be tested before `male`: `\bmale\b` does not match "female". */
const FEMALE_NAME_HINTS =
  /female|woman|girl|zira|hazel|maria|luciana|francisca|joana|samantha|victoria|karen|moira|tessa|fiona|serena|allison|ava\b|susan|zoe|catherine|anna\b|amelie|audrey|sabina|elvira|helena|isabela|carmen|monica|paulina|alva|nora|salome|yuna|kyoko|tingting|sinji|meijia|female$|martha/i
const MALE_NAME_HINTS =
  /\bmale\b|\bman\b|\bboy\b|david|mark|daniel|alex\b|fred|george|oliver|rishi|aaron|arthur|jorge|antonio|diego|pablo|ralph|reed|rocko|bruce|jacques|nicholas|gordon|gilroy|juan\b|felipe|thomas|william|liam\b/i

/** Best-effort gender inference from a voice's display name, or null. */
export function detectVoiceGender(voice: SpeechSynthesisVoice): VoiceGender | null {
  const name = voice.name ?? ''
  if (FEMALE_NAME_HINTS.test(name)) return 'female'
  if (MALE_NAME_HINTS.test(name)) return 'male'
  return null
}

/**
 * Pitch applied when the requested gender has no matching voice: a lower
 * (male) or higher (female) pitch on the same voice still reads as a
 * different speaker.
 */
export const GENDER_PITCH_COMPENSATION: Record<VoiceGender, number> = {
  male: 0.85,
  female: 1.15,
}

/** Language-matched voices, ordered by match quality (exact > prefix > contains). */
function languageCandidates(lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[][] {
  const base = lang.split('-')[0].toLowerCase()
  return [
    voices.filter((v) => v.lang.toLowerCase() === lang.toLowerCase()),
    voices.filter((v) => v.lang.toLowerCase().startsWith(base)),
    voices.filter((v) => v.lang.toLowerCase().includes(base)),
  ]
}

/** Ordered, de-duplicated voices for a language (by voiceURI). */
export function languageVoices(lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const seen = new Set<string>()
  const out: SpeechSynthesisVoice[] = []
  for (const tier of languageCandidates(lang, voices)) {
    for (const voice of tier) {
      if (seen.has(voice.voiceURI)) continue
      seen.add(voice.voiceURI)
      out.push(voice)
    }
  }
  return out
}

export interface NarratorPlan {
  /** Distinct voice when the system has one the speakers are not using. */
  voiceURI?: string
  /**
   * When every voice for the language is already spoken by a character, the
   * narrator falls back to the shared voice at a lower pitch and a slower
   * rate, which still reads as a storyteller rather than a dialogue speaker.
   */
  pitch?: number
  rate?: number
}

/**
 * Voice plan for a dialogue's narrator: the browser engine has no
 * "narrator" concept, so we look for a language voice none of the gendered
 * speakers use; when none exists (single-voice systems) we compensate with
 * pitch and rate instead.
 */
export function pickNarratorVoice(
  lang: string,
  voices: SpeechSynthesisVoice[],
  excludeURIs: Array<string | undefined>
): NarratorPlan {
  const excluded = new Set(excludeURIs.filter(Boolean) as string[])
  for (const voice of languageVoices(lang, voices)) {
    if (!excluded.has(voice.voiceURI)) {
      return { voiceURI: voice.voiceURI }
    }
  }
  return { pitch: 0.9, rate: 0.95 }
}

/** Current voice list, or an empty array when unsupported. */
export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return []
  try {
    return window.speechSynthesis.getVoices() ?? []
  } catch {
    return []
  }
}

/**
 * Best voice for a language: exact BCP-47 match, then language-prefix match,
 * then a loose substring match, then `null` (caller falls back to the
 * synthesizer default). With `gender`, a gendered voice is preferred inside
 * each tier; when none exists the best neutral voice is returned and callers
 * apply `GENDER_PITCH_COMPENSATION`.
 */
export function pickVoice(
  lang: string,
  voices: SpeechSynthesisVoice[],
  gender?: VoiceGender
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null
  const tiers = languageCandidates(lang, voices)

  if (gender) {
    for (const tier of tiers) {
      const gendered = tier.find((v) => detectVoiceGender(v) === gender)
      if (gendered) return gendered
    }
  }
  for (const tier of tiers) {
    if (tier.length > 0) return tier[0]
  }
  return null
}

/** True when the browser has voices, but none for the language's base code. */
export function hasVoiceFor(lang: string, voices: SpeechSynthesisVoice[]): boolean {
  if (voices.length === 0) return true // nothing installed at all: stay quiet
  const base = lang.split('-')[0].toLowerCase()
  return voices.some((v) => v.lang.toLowerCase().startsWith(base))
}

export interface SpeakOptions {
  /** BCP-47 tag (use `toSpeechLang` for UI locales). */
  lang?: string
  /** Playback rate, 0.5–2 per the spec; the app offers 0.75 / 1 / 1.25. */
  rate?: number
  /** Pitch, 0–2 per the spec. Used directly or as gender compensation. */
  pitch?: number
  /** Preferred speaker gender; picks a gendered voice or compensates with pitch. */
  gender?: VoiceGender
  /** Fire-and-forget audio: cancel any current speech first. */
  interrupt?: boolean
  onEnd?: () => void
  onStart?: () => void
}

/** One utterance in a multi-speaker queue (e.g. a dialogue). */
export interface SpeakTurn {
  text: string
  lang?: string
  gender?: VoiceGender
  pitch?: number
  rate?: number
  /** Explicit voice (by `voiceURI`) when the caller resolved it itself. */
  voiceURI?: string
}

/** Speaks one text: cancels current speech, then queues the utterance. */
export function speak(text: string, options: SpeakOptions = {}): void {
  speakTurns([{ text, gender: options.gender, lang: options.lang, pitch: options.pitch }], options)
}

/**
 * Speaks several texts as one queued sequence with a shared voice. `onEnd`
 * fires when the last utterance finishes (or fails). For per-line voices
 * (dialogues with male and female speakers) use `speakTurns`.
 */
export function speakSequence(texts: string[], options: SpeakOptions = {}): void {
  speakTurns(texts.map((text) => ({ text })), options)
}

/**
 * Splits a long text into utterance-sized chunks.
 *
 * Chrome/Edge silently stop a single utterance after ~15 seconds, especially
 * with remote voices: the control stays "Reading" but no audio comes out.
 * Sentence-sized chunks keep the queue alive and let `onend` fire on the last
 * one. Chunks prefer sentence boundaries and hard-wrap only when a sentence is
 * longer than the limit.
 */
export const MAX_SPEECH_CHUNK = 220

export function splitForSpeech(text: string): string[] {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (!trimmed) return []
  if (trimmed.length <= MAX_SPEECH_CHUNK) return [trimmed]

  const sentences = trimmed.match(/[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/g) ?? [trimmed]
  const chunks: string[] = []
  let buffer = ''

  const flush = () => {
    if (buffer.trim()) chunks.push(buffer.trim())
    buffer = ''
  }

  for (const sentence of sentences) {
    if (sentence.length > MAX_SPEECH_CHUNK) {
      flush()
      for (let i = 0; i < sentence.length; i += MAX_SPEECH_CHUNK) {
        const piece = sentence.slice(i, i + MAX_SPEECH_CHUNK).trim()
        if (piece) chunks.push(piece)
      }
      continue
    }
    if ((buffer + sentence).length > MAX_SPEECH_CHUNK) flush()
    buffer += sentence
  }
  flush()
  return chunks
}

/**
 * Speaks turns with per-turn voice selection: each turn resolves its own
 * voice (honouring `gender`) and pitch. `onEnd` fires when the last turn
 * finishes (or fails). `onStart` fires when the first is queued.
 */
export function speakTurns(turns: SpeakTurn[], options: SpeakOptions = {}): void {
  if (!isSpeechSupported()) {
    // Never leave a consumer stuck in a "playing" state.
    options.onStart?.()
    options.onEnd?.()
    return
  }
  const synth = window.speechSynthesis
  const chunks: Array<{ turn: SpeakTurn; text: string }> = []
  for (const turn of turns) {
    for (const text of splitForSpeech(turn.text)) chunks.push({ turn, text })
  }
  if (chunks.length === 0) {
    options.onStart?.()
    options.onEnd?.()
    return
  }

  if (options.interrupt !== false) synth.cancel()

  options.onStart?.()

  const rate = options.rate && options.rate > 0 ? Math.min(2, Math.max(0.5, options.rate)) : 1

  chunks.forEach(({ turn, text }, index) => {
    const lang = turn.lang ?? options.lang
    const voices = getVoices()

    let voice: SpeechSynthesisVoice | null = null
    if (turn.voiceURI) {
      voice = voices.find((v) => v.voiceURI === turn.voiceURI) ?? null
    } else if (turn.gender) {
      voice = lang ? pickVoice(lang, voices, turn.gender) : null
    } else if (lang) {
      voice = pickVoice(lang, voices)
    }

    let pitch = turn.pitch ?? options.pitch ?? 1
    if (turn.gender) {
      const matched = voice !== null && detectVoiceGender(voice) === turn.gender
      if (!matched && turn.pitch === undefined && options.pitch === undefined) {
        pitch = GENDER_PITCH_COMPENSATION[turn.gender]
      }
    }

    const turnRate =
      turn.rate && turn.rate > 0 ? Math.min(2, Math.max(0.5, turn.rate)) : rate

    const utterance = new SpeechSynthesisUtterance(text)
    if (lang) utterance.lang = lang
    utterance.rate = turnRate
    utterance.pitch = Math.min(2, Math.max(0, pitch))
    if (voice) {
      try {
        utterance.voice = voice
      } catch {
        // Some browsers expose a voice that cannot be assigned. Speaking with
        // the default voice is better than not speaking at all.
      }
    }
    if (index === chunks.length - 1) {
      utterance.onend = () => options.onEnd?.()
      utterance.onerror = () => options.onEnd?.()
    }
    synth.speak(utterance)
  })
}

export function cancelSpeech(): void {
  if (!isSpeechSupported()) return
  try {
    window.speechSynthesis.cancel()
  } catch {
    // ignore
  }
}

export function pauseSpeech(): void {
  if (!isSpeechSupported()) return
  try {
    window.speechSynthesis.pause()
  } catch {
    // ignore
  }
}

export function resumeSpeech(): void {
  if (!isSpeechSupported()) return
  try {
    window.speechSynthesis.resume()
  } catch {
    // ignore
  }
}
