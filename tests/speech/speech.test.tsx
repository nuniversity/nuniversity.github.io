import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import {
  cancelSpeech,
  detectVoiceGender,
  getVoices,
  hasVoiceFor,
  isSpeechSupported,
  pauseSpeech,
  pickNarratorVoice,
  pickVoice,
  resumeSpeech,
  speak,
  speakSequence,
  speakTurns,
  toSpeechLang,
} from '@/lib/speech/speech'
import { useSpeechVoices } from '@/lib/speech/use-speech'

vi.stubGlobal('React', React)

class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  volume = 1
  pitch = 1
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

function installSynth(voices: Array<{ lang: string; name: string }> = []) {
  const spoken: FakeUtterance[] = []
  const cancel = vi.fn()
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speak: (utterance: FakeUtterance) => spoken.push(utterance),
      cancel,
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: () => voices,
    },
  })
  return { spoken, cancel }
}

describe('toSpeechLang', () => {
  it('maps UI locales to BCP-47 tags', () => {
    expect(toSpeechLang('pt')).toBe('pt-BR')
    expect(toSpeechLang('en')).toBe('en-US')
    expect(toSpeechLang('es')).toBe('es-ES')
    expect(toSpeechLang('fr')).toBe('fr-FR')
  })

  it('passes full tags and unknown locales through', () => {
    expect(toSpeechLang('pt-BR')).toBe('pt-BR')
    expect(toSpeechLang('xx')).toBe('xx')
  })
})

describe('voice helpers', () => {
  it('returns empty voices when unsupported', () => {
    // @ts-expect-error deliberately removing the API
    delete window.speechSynthesis
    expect(getVoices()).toEqual([])
    expect(isSpeechSupported()).toBe(false)
  })

  it('picks an exact voice before prefix and substring matches', () => {
    const voices = [
      { lang: 'en-GB', name: 'UK' },
      { lang: 'en-US', name: 'US' },
      { lang: 'pt-PT', name: 'PT' },
    ] as unknown as SpeechSynthesisVoice[]
    expect(pickVoice('en-US', voices)?.name).toBe('US')
    expect(pickVoice('pt-BR', voices)?.name).toBe('PT')
    expect(pickVoice('zh-CN', voices)).toBeNull()
  })

  it('hasVoiceFor is quiet when nothing is installed', () => {
    expect(hasVoiceFor('es-ES', [])).toBe(true)
    expect(hasVoiceFor('es-ES', [{ lang: 'en-US', name: 'US' }] as unknown as SpeechSynthesisVoice[])).toBe(false)
    expect(hasVoiceFor('es-ES', [{ lang: 'es-MX', name: 'MX' }] as unknown as SpeechSynthesisVoice[])).toBe(true)
  })
})

describe('speak', () => {
  let spoken: FakeUtterance[]
  let cancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ;({ spoken, cancel } = installSynth([
      { lang: 'en-US', name: 'US' },
      { lang: 'pt-BR', name: 'BR' },
    ]))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('cancels, queues one utterance and resolves the voice', () => {
    let ended = false
    speak('Hello world', { lang: 'en-US', onEnd: () => (ended = true) })

    expect(cancel).toHaveBeenCalledTimes(1)
    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toBe('Hello world')
    expect(spoken[0].lang).toBe('en-US')
    expect(spoken[0].rate).toBe(1)
    expect((spoken[0].voice as { name: string }).name).toBe('US')

    spoken[0].onend?.()
    expect(ended).toBe(true)
  })

  it('queues a sequence and ends only after the last utterance', () => {
    let ended = 0
    speakSequence(['Alpha', 'Beta', 'Gamma'], { lang: 'en', onEnd: () => (ended += 1) })

    expect(spoken).toHaveLength(3)
    expect(spoken.map((u) => u.text)).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(spoken[2].onend).not.toBeNull()
    expect(spoken[0].onend).toBeNull()

    spoken[0].onend?.()
    expect(ended).toBe(0)
    spoken[2].onend?.()
    expect(ended).toBe(1)
  })

  it('clamps the rate and skips blank texts', () => {
    speakSequence(['  ', 'Only this'], { rate: 9 })
    expect(spoken).toHaveLength(1)
    expect(spoken[0].rate).toBe(2)
  })

  it('still fires onEnd when the API is unsupported', () => {
    // @ts-expect-error deliberately removing the API
    delete window.speechSynthesis
    let ended = false
    speak('nothing', { onEnd: () => (ended = true) })
    expect(ended).toBe(true)
  })
})

describe('voice gender', () => {
  let spoken: FakeUtterance[]
  const genderedVoices = [
    { lang: 'en-US', name: 'Microsoft David Desktop', voiceURI: 'david' },
    { lang: 'en-US', name: 'Microsoft Zira Desktop', voiceURI: 'zira' },
    { lang: 'pt-BR', name: 'Luciana', voiceURI: 'luciana' },
    { lang: 'en-GB', name: 'Google UK English Male', voiceURI: 'uk-male' },
    { lang: 'en-GB', name: 'Google UK English Female', voiceURI: 'uk-female' },
  ] as unknown as SpeechSynthesisVoice[]

  it('infers gender from voice names', () => {
    expect(detectVoiceGender(genderedVoices[0])).toBe('male')
    expect(detectVoiceGender(genderedVoices[1])).toBe('female')
    expect(detectVoiceGender(genderedVoices[2])).toBe('female')
    // "female" must never be read as containing \bmale\b
    expect(detectVoiceGender(genderedVoices[4])).toBe('female')
    expect(detectVoiceGender({ lang: 'en-US', name: 'Custom Voice Pack' } as unknown as SpeechSynthesisVoice)).toBeNull()
  })

  it('prefers a gendered voice of the language when asked', () => {
    expect(pickVoice('en-US', genderedVoices, 'male')?.name).toBe('Microsoft David Desktop')
    expect(pickVoice('en-US', genderedVoices, 'female')?.name).toBe('Microsoft Zira Desktop')
    expect(pickVoice('en-GB', genderedVoices, 'male')?.name).toBe('Google UK English Male')
    expect(pickVoice('pt-BR', genderedVoices, 'male')?.name).toBe('Luciana') // no male pt voice: falls back
  })

  it('compensates with pitch when the requested gender has no voice', () => {
    ;({ spoken } = installSynth([
      { lang: 'en-US', name: 'Google US English' }, // single ungendered voice
    ]))

    speak('Hello', { lang: 'en-US', gender: 'male' })
    expect(spoken[0].pitch).toBeCloseTo(0.85)
    spoken.length = 0

    speak('Hello', { lang: 'en-US', gender: 'female' })
    expect(spoken[0].pitch).toBeCloseTo(1.15)
    spoken.length = 0

    // A matched gendered voice keeps the natural pitch.
    ;({ spoken } = installSynth(genderedVoices))
    speak('Hello', { lang: 'en-US', gender: 'male' })
    expect(spoken[0].pitch).toBe(1)
    expect((spoken[0].voice as { name: string }).name).toBe('Microsoft David Desktop')
  })
})

describe('speakTurns (multi-speaker dialogues)', () => {
  let spoken: FakeUtterance[]
  it('assigns per-turn voices and pitches', () => {    ;({ spoken } = installSynth([
      { lang: 'en-US', name: 'Microsoft Zira Desktop' },
      { lang: 'en-US', name: 'Microsoft David Desktop' },
    ]))

    speakTurns(
      [
        { text: 'Hello! I am Ana.', gender: 'female' },
        { text: 'Hi Ana! I am Tom.', gender: 'male' },
      ],
      { lang: 'en-US' }
    )

    expect(spoken).toHaveLength(2)
    expect((spoken[0].voice as { name: string }).name).toBe('Microsoft Zira Desktop')
    expect((spoken[1].voice as { name: string }).name).toBe('Microsoft David Desktop')
    expect(spoken[1].pitch).toBe(1)
  })
})

describe('narrator voice planning', () => {
  let spoken: FakeUtterance[]
  const voices = [
    { lang: 'en-US', name: 'Microsoft Zira Desktop', voiceURI: 'zira' },
    { lang: 'en-US', name: 'Microsoft David Desktop', voiceURI: 'david' },
    { lang: 'en-US', name: 'Google US English', voiceURI: 'google-us' },
  ] as unknown as SpeechSynthesisVoice[]

  it('gives the narrator a voice the speakers are not using', () => {
    const male = pickVoice('en-US', voices, 'male')
    const female = pickVoice('en-US', voices, 'female')
    const plan = pickNarratorVoice('en-US', voices, [male?.voiceURI, female?.voiceURI])
    expect(plan.voiceURI).toBeDefined()
    expect(plan.voiceURI).not.toBe(male?.voiceURI)
    expect(plan.voiceURI).not.toBe(female?.voiceURI)
    expect(plan.pitch).toBeUndefined()
  })

  it('falls back to pitch+rate when the single voice is already spoken', () => {
    const only = [voices[0]]
    const plan = pickNarratorVoice('en-US', only, [voices[0].voiceURI])
    expect(plan.voiceURI).toBeUndefined()
    expect(plan.pitch).toBe(0.9)
    expect(plan.rate).toBe(0.95)
  })

  it('speakTurns honours explicit voiceURI and per-turn rate', () => {
    ;({ spoken } = installSynth(voices))
    speakTurns(
      [
        { text: 'Once upon a time.', voiceURI: voices[2].voiceURI, rate: 0.95 },
        { text: 'Hello!', gender: 'female' },
      ],
      { lang: 'en-US' }
    )
    expect(spoken).toHaveLength(2)
    expect((spoken[0].voice as { name: string }).name).toBe('Google US English')
    expect(spoken[0].rate).toBe(0.95)
    expect((spoken[1].voice as { name: string }).name).toBe('Microsoft Zira Desktop')
  })

  it('an unknown voiceURI falls back to the language default', () => {
    ;({ spoken } = installSynth(voices))
    speakTurns([{ text: 'Hello', voiceURI: 'missing-uri' }], { lang: 'en-US' })
    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toBe('Hello')
  })
})

describe('transport controls', () => {
  it('cancel, pause and resume are safe when supported and unsupported', () => {
    const { cancel } = installSynth()
    cancelSpeech()
    expect(cancel).toHaveBeenCalledTimes(1)
    pauseSpeech()
    resumeSpeech()

    // @ts-expect-error deliberately removing the API
    delete window.speechSynthesis
    expect(() => cancelSpeech()).not.toThrow()
    expect(() => pauseSpeech()).not.toThrow()
    expect(() => resumeSpeech()).not.toThrow()
  })
})

describe('useSpeechVoices', () => {
  it('loads voices on mount and refreshes on voiceschanged', async () => {
    let voices: Array<{ lang: string; name: string }> = [{ lang: 'en-US', name: 'US' }]
    const listeners = new Set<() => void>()
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => voices,
        addEventListener: (_: string, fn: () => void) => listeners.add(fn),
        removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
      },
    })

    function Probe() {
      const list = useSpeechVoices()
      return <p data-testid="count">{list.length}</p>
    }
    render(<Probe />)
    expect(screen.getByTestId('count').textContent).toBe('1')

    voices = [...voices, { lang: 'pt-BR', name: 'BR' }]
    listeners.forEach((fn) => fn())
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('2'))
  })
})
