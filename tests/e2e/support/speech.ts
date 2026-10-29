/**
 * Deterministic speech synthesis for E2E.
 *
 * Headless browsers have no OS voices, so the real engine either stays silent
 * or fails depending on the host. Tests assert the app's behaviour (what it
 * sends to the engine, at which rate, and its UI state) against this fake.
 */

export interface SpokenUtterance {
  text: string
  rate: number
  pitch: number
  lang: string
}

export interface SpeechLog {
  spoken: SpokenUtterance[]
  paused: boolean
  cancelled: number
  resumed: number
}

declare global {
  interface Window {
    __speech: SpeechLog
  }
}

/** Runs in the browser before any page script (Playwright addInitScript). */
export function installFakeSpeech(): void {
  const log: SpeechLog = { spoken: [], paused: false, cancelled: 0, resumed: 0 }
  window.__speech = log

  class FakeUtterance {
    text: string
    rate = 1
    pitch = 1
    lang = ''
    voice: unknown = null
    onstart: (() => void) | null = null
    onend: (() => void) | null = null
    onerror: (() => void) | null = null
    constructor(text: string) {
      this.text = text
    }
  }

  const voices = [
    { lang: 'en-US', name: 'Test English', voiceURI: 'test-en', default: true },
    { lang: 'pt-BR', name: 'Test Portuguese', voiceURI: 'test-pt', default: false },
    { lang: 'es-ES', name: 'Test Spanish', voiceURI: 'test-es', default: false },
  ]

  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: FakeUtterance,
  })

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak(utterance: FakeUtterance) {
        log.spoken.push({
          text: utterance.text,
          rate: utterance.rate,
          pitch: utterance.pitch,
          lang: utterance.lang,
        })
        setTimeout(() => utterance.onstart?.(), 0)
      },
      cancel() {
        log.cancelled += 1
      },
      pause() {
        log.paused = true
      },
      resume() {
        log.paused = false
        log.resumed += 1
      },
      getVoices() {
        return voices
      },
      addEventListener() {},
      removeEventListener() {},
    },
  })
}
