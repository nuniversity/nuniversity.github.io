// components/lessons/LessonAudio.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, Pause, Square, RotateCcw } from 'lucide-react'
import {
  cancelSpeech,
  hasVoiceFor,
  isSpeechSupported,
  pauseSpeech,
  resumeSpeech,
  speakSequence,
} from '@/lib/speech/speech'
import { useSpeechVoices } from '@/lib/speech/use-speech'

interface LessonAudioProps {
  /**
   * CSS selector for the element whose text should be read.
   *
   * The text is extracted in the browser rather than passed as a prop: a prop
   * would be serialised into the RSC payload, duplicating the whole lesson
   * body in every page (see R-03 in the 2026-10-27 review).
   */
  selector?: string
  /** BCP-47 language tag for the reading voice, e.g. `en-US`. */
  lang: string
  /** Label for the control. */
  label?: string
  /** Accessible description of what the control does. */
  description?: string
  /**
   * Short sentence spoken before the lesson, so the learner knows the feature
   * is on and what is about to happen. It is spoken, never displayed.
   */
  intro?: string
  /**
   * Shown when the browser has no voice for the lesson's language. Speech
   * synthesis voices come from the operating system, so a machine with only
   * Portuguese and English voices reads Spanish with the wrong one.
   */
  voiceNote?: string
  /** Visible label for the section picker. */
  sectionLabel?: string
  /** Picker option: follow the reader's position. */
  sectionAutoLabel?: string
  /** Picker option: read everything. */
  sectionAllLabel?: string
  /** Label for the stop control. */
  stopLabel?: string
  /** Label for the restart control. */
  restartLabel?: string
  /** Status shown while speaking. */
  readingLabel?: string
  /** Status shown while paused. */
  pausedLabel?: string
  /** Rate control: slower playback label. */
  rateSlowLabel?: string
  /** Rate control: normal playback label. */
  rateNormalLabel?: string
  /** Rate control: faster playback label. */
  rateFastLabel?: string
  /**
   * Sections to offer. The lesson outline already collects the headings and
   * tracks which one is in view, so it owns the list; when omitted the
   * component collects them from the DOM itself.
   */
  sections?: AudioSection[]
  /** Heading currently in view, used by the "section I am reading" option. */
  activeSectionId?: string | null
}

type Status = 'idle' | 'speaking' | 'paused'

/** `auto` follows the reader, `all` is the whole lesson, anything else is an id. */
type Selection = 'auto' | 'all' | string

export interface AudioSection {
  id: string
  text: string
  level: number
}

/**
 * Collects readable prose from a container, skipping code, tables, diagrams
 * and other content that does not make sense spoken aloud.
 */
export function collectSpokenText(root: HTMLElement): string {
  const SKIP = new Set(['PRE', 'CODE', 'TABLE', 'FIGURE', 'SVG', 'SCRIPT', 'STYLE', 'NAV'])
  const KEEP = new Set(['P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'DD', 'DT'])

  // Focus mode hides sections with display:none; listening must match what is
  // visible on screen, otherwise audio and text disagree.
  if (root.hidden || root.style.display === 'none') return ''

  // Callers may hand over a single readable element (a section's paragraph)
  // rather than a container, so read it directly instead of walking its text
  // children — those are text nodes and would be skipped.
  if (KEEP.has(root.tagName) && !root.hasAttribute('data-audio-skip')) {
    const own = (root.textContent ?? '').replace(/\s+/g, ' ').trim()
    return own.length > 2 && /[a-zA-ZÀ-ÿ0-9]/.test(own) ? own : ''
  }

  const parts: string[] = []
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) return
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    if (SKIP.has(el.tagName)) return
    if (el.hidden || el.style.display === 'none') return
    // The audio control's own labels ("Listen to this lesson", "Reading
    // aloud…", the hint) are UI chrome. Reading them aloud is what made the
    // engine start by narrating its own buttons.
    if (el.hasAttribute('data-lesson-audio')) return
    // Score widgets and other live regions are status chrome, not lesson text.
    if (el.hasAttribute('data-audio-skip')) return
    if (el.getAttribute('aria-hidden') === 'true') return
    if (KEEP.has(el.tagName)) {
      const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim()
      // Skip fragments that are mostly symbols — a text-to-speech engine
      // reads them as noise.
      if (text.length > 2 && /[a-zA-ZÀ-ÿ0-9]/.test(text)) parts.push(text)
      return
    }
    for (const child of Array.from(el.childNodes)) walk(child)
  }

  for (const child of Array.from(root.childNodes)) walk(child)
  return parts.join('. ').replace(/\.\s*\./g, '.').slice(0, 60000)
}

/**
 * Reads one section: its heading, then every sibling up to the next heading of
 * the same or a higher level. `h3` subsections are therefore included inside
 * their `h2`, and start their own reading when picked directly.
 */
export function collectSectionText(root: HTMLElement, id: string): string {
  const heading = root.querySelector<HTMLElement>(`[id="${id}"]`)
  if (!heading) return ''

  const level = Number(heading.tagName[1])
  const parts: string[] = []
  const headingText = (heading.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (headingText) parts.push(headingText)

  let sibling = heading.nextElementSibling
  while (sibling) {
    const isHeading = /^H[1-6]$/.test(sibling.tagName)
    if (isHeading && Number(sibling.tagName[1]) <= level) break
    const text = collectSpokenText(sibling as HTMLElement)
    if (text) parts.push(text)
    sibling = sibling.nextElementSibling
  }

  return parts.join('. ')
}

/** The section whose heading is the last one above the reading position. */
export function findCurrentSectionId(root: HTMLElement, sections: AudioSection[]): string | null {
  if (sections.length === 0) return null
  let current = sections[0].id
  for (const section of sections) {
    const heading = root.querySelector<HTMLElement>(`[id="${section.id}"]`)
    if (!heading) continue
    if (heading.getBoundingClientRect().top <= 140) {
      current = section.id
    } else {
      break
    }
  }
  return current
}

/**
 * Reads a lesson aloud using the browser's built-in speech engine.
 *
 * The Web Speech API is available in every current browser and needs no
 * dependency, no audio files, and no server round-trip. The control is
 * opt-in: nothing is read until the learner presses play.
 *
 * Audio follows the lesson's sections rather than the whole document: the
 * picker offers the section currently in view, any specific section, or the
 * full lesson.
 */
export default function LessonAudio({
  selector = '[data-lesson-content]',
  lang,
  label = 'Listen',
  description,
  intro = 'Audio is on. Reading this lesson aloud.',
  voiceNote = 'No voice for this language is installed in your browser, so another voice is used and the pronunciation may sound wrong. Install one in your system’s speech settings to fix it.',
  sectionLabel = 'Section',
  sectionAutoLabel = 'The section I am reading',
  sectionAllLabel = 'The whole lesson',
  stopLabel = 'Stop',
  restartLabel = 'Restart',
  readingLabel = 'Reading',
  pausedLabel = 'Paused',
  rateSlowLabel = 'Slower',
  rateNormalLabel = 'Normal',
  rateFastLabel = 'Faster',
  sections: providedSections,
  activeSectionId = null,
}: LessonAudioProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [rate, setRate] = useState(1)
  const [supported, setSupported] = useState(true)
  const [domSections, setDomSections] = useState<AudioSection[]>([])
  const [selection, setSelection] = useState<Selection>('auto')
  const [nowReading, setNowReading] = useState<string | null>(null)
  const selectId = useRef(`lesson-audio-section-${Math.random().toString(36).slice(2, 8)}`)
  const voices = useSpeechVoices()

  useEffect(() => {
    setSupported(isSpeechSupported())
    return () => {
      cancelSpeech()
    }
  }, [])

  // The outline and the audio picker offer the same set of headings, so the
  // two always agree about what a "section" is.
  useEffect(() => {
    // The outline passes its own list; only scan the DOM when used alone.
    if (providedSections) return
    const root = document.querySelector<HTMLElement>(selector)
    if (!root) return
    setDomSections(
      Array.from(root.querySelectorAll<HTMLElement>('h2[id], h3[id]')).map(heading => ({
        id: heading.id,
        text: (heading.textContent ?? '').replace(/\s+/g, ' ').trim(),
        level: Number(heading.tagName[1]),
      }))
    )
  }, [selector, providedSections])

  const sections = providedSections ?? domSections

  // Voice loading lives in `useSpeechVoices` (shared speech service), which
  // also re-reads the list when the OS fires `voiceschanged`.

  /** True when the browser has voices, but none for the lesson's language. */
  const languageVoiceMissing = voices.length > 0 && !hasVoiceFor(lang, voices)

  const stop = useCallback(() => {
    cancelSpeech()
    setNowReading(null)
    setStatus('idle')
  }, [])

  const speak = useCallback(
    (nextSelection?: Selection) => {
      if (!isSpeechSupported()) return

      const root = document.querySelector<HTMLElement>(selector)
      if (!root) return

      const choice = nextSelection ?? selection
      let text = ''
      let title: string | null = null

      if (choice === 'all' || sections.length === 0) {
        text = collectSpokenText(root)
      } else {
        const id =
          choice === 'auto'
            ? activeSectionId ?? findCurrentSectionId(root, sections)
            : choice
        if (id) {
          text = collectSectionText(root, id)
          title = sections.find(section => section.id === id)?.text ?? null
        }
        if (!text) text = collectSpokenText(root)
      }

      if (!text) return

      // Two utterances, queued: a one-line confirmation, then the section. The
      // learner hears what is happening immediately, and the confirmation is
      // never mixed into the lesson text itself.
      speakSequence([intro, text], {
        lang,
        rate,
        onEnd: () => {
          setNowReading(null)
          setStatus('idle')
        },
      })
      setNowReading(title)
      setStatus('speaking')
    },
    [selector, lang, rate, intro, selection, sections, activeSectionId]
  )

  const toggle = useCallback(() => {
    if (status === 'speaking') {
      pauseSpeech()
      setStatus('paused')
      return
    }
    if (status === 'paused') {
      resumeSpeech()
      setStatus('speaking')
      return
    }
    speak()
  }, [status, speak])

  /** Start the current selection again from its first word. */
  const restart = useCallback(() => {
    speak()
  }, [speak])

  const chooseSection = useCallback(
    (next: string) => {
      setSelection(next)
      // Changing the section while listening restarts with the new choice,
      // rather than leaving the previous section playing under a new label.
      if (status !== 'idle') speak(next)
    },
    [status, speak]
  )

  /** Changing the speed while listening restarts the current selection. */
  const changeRate = useCallback(
    (next: number) => {
      setRate(next)
      if (status !== 'idle') speak()
    },
    [status, speak]
  )

  if (!supported) return null

  const statusText =
    status === 'speaking'
      ? nowReading
        ? `${readingLabel}: ${nowReading}`
        : readingLabel
      : status === 'paused'
        ? pausedLabel
        : label

  return (
    <div
      data-lesson-audio
      className="not-prose rounded-xl border border-border bg-surface p-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={status === 'speaking' ? 'Pause reading aloud' : label}
          title={description || label}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors hover:bg-primary/20"
        >
          {status === 'speaking' ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{statusText}</p>
          {description && (
            <p className="truncate text-xs text-foreground-muted">{description}</p>
          )}
        </div>

        {/* Stop and restart stay mounted so they are discoverable, and are
            disabled while nothing is playing. */}
        <button
          type="button"
          onClick={restart}
          disabled={status === 'idle'}
          aria-label={restartLabel}
          title={restartLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-sunken hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={status === 'idle'}
          aria-label={stopLabel}
          title={stopLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-sunken hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Square className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div
        role="group"
        aria-label="Playback speed"
        className="mt-2 flex items-center gap-1"
        data-audio-skip
      >
        {(
          [
            [0.75, rateSlowLabel],
            [1, rateNormalLabel],
            [1.25, rateFastLabel],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeRate(value)}
            aria-pressed={rate === value}
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              rate === value
                ? 'bg-primary-soft font-medium text-primary'
                : 'text-foreground-muted hover:bg-surface-sunken hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sections.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor={selectId.current} className="shrink-0 text-xs text-foreground-muted">
            {sectionLabel}
          </label>
          <select
            id={selectId.current}
            value={selection}
            onChange={event => chooseSection(event.target.value)}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
          >
            <option value="auto">{sectionAutoLabel}</option>
            <option value="all">{sectionAllLabel}</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                {section.text}
              </option>
            ))}
          </select>
        </div>
      )}

      {languageVoiceMissing && (
        <p className="mt-2 text-xs leading-snug text-amber-700 dark:text-amber-400">{voiceNote}</p>
      )}
    </div>
  )
}
