import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepSpeak } from '@/components/language-course/steps-production'
import type { SpeakStep } from '@/lib/language-courses/types'

vi.stubGlobal('React', React)

const step: SpeakStep = {
  id: 's01',
  type: 'speak',
  skill: 'speaking',
  prompt: { en: 'Speak', pt: 'Fale' },
  mode: 'shadow',
  lines: [{ text: 'I am a student.', translation: 'Sou estudante.' }],
}

const baseProps = {
  lang: 'pt',
  source: 'pt',
  target: 'en',
  t: {},
  onResult: vi.fn(),
  onComplete: vi.fn(),
  vocabById: new Map(),
  grammarById: new Map(),
}

function renderSpeak() {
  return render(<StepSpeak step={step} {...baseProps} />)
}

function stubMediaDevices(getUserMedia: unknown) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  })
}

function stubObjectUrls() {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:fake'),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  })
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('React', React)
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('StepSpeak recording', () => {
  it('explains when the microphone is unavailable and keeps the lesson playable', async () => {
    const user = userEvent.setup()
    renderSpeak()

    await user.click(screen.getByTestId('speak-record'))

    expect(await screen.findByTestId('speak-note')).toHaveTextContent(/microphone not available/i)
    // The learner can still proceed: speaking is self-checked.
    await user.click(screen.getByTestId('said-it'))
    expect(baseProps.onComplete).toHaveBeenCalledTimes(1)
  })

  it('reports permission denial explicitly', async () => {
    const user = userEvent.setup()
    stubMediaDevices(
      vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError'))
    )

    renderSpeak()
    await user.click(screen.getByTestId('speak-record'))

    expect(await screen.findByTestId('speak-note')).toHaveTextContent(/permission denied/i)
    expect(screen.queryByTestId('speak-playback')).toBeNull()
  })

  it('records, stops and offers playback of a real blob', async () => {
    const user = userEvent.setup()

    class FakeRecorder {
      state = 'inactive'
      mimeType = 'audio/webm'
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      constructor(_stream: MediaStream) {}
      start() {
        this.state = 'recording'
        this.ondataavailable?.({ data: new Blob(['audio-bytes'], { type: 'audio/webm' }) })
      }
      stop() {
        if (this.state !== 'recording') return
        this.state = 'inactive'
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    stubMediaDevices(vi.fn().mockResolvedValue({ getTracks: () => [] }))
    stubObjectUrls()
    const playSpy = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('Audio', vi.fn().mockImplementation(() => ({ play: playSpy })))

    renderSpeak()
    await user.click(screen.getByTestId('speak-record'))
    // The component flips to the Stop button while recording.
    await user.click(screen.getByTestId('speak-stop'))

    const playback = await screen.findByTestId('speak-playback')
    await user.click(playback)
    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  it('surfaces an empty recording instead of a dead playback button', async () => {
    const user = userEvent.setup()

    class EmptyRecorder {
      state = 'inactive'
      mimeType = ''
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {
        this.state = 'recording'
        // No data ever arrives (quirky browser / stopped too fast).
      }
      stop() {
        if (this.state !== 'recording') return
        this.state = 'inactive'
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', EmptyRecorder)
    stubMediaDevices(vi.fn().mockResolvedValue({ getTracks: () => [] }))

    renderSpeak()
    await user.click(screen.getByTestId('speak-record'))
    await user.click(screen.getByTestId('speak-stop'))

    expect(await screen.findByTestId('speak-note')).toHaveTextContent(/came out empty/i)
    expect(screen.queryByTestId('speak-playback')).toBeNull()
  })
})
