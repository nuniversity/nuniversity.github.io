import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeechSetupNote } from '@/components/language-course/speech-setup-note'

vi.stubGlobal('React', React)

function installVoices(voices: Array<{ lang: string; name: string }>) {
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { getVoices: () => voices, addEventListener: vi.fn(), removeEventListener: vi.fn() },
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

describe('SpeechSetupNote', () => {
  it('shows a note with the missing language name and dismisses it persistently', async () => {
    const user = userEvent.setup()
    installVoices([
      { lang: 'pt-BR', name: 'Luciana' },
      // no English voice installed
    ])

    render(<SpeechSetupNote languages={['pt', 'en']} dict={{}} uiLang="pt" />)

    const note = await screen.findByTestId('speech-setup-note')
    expect(note.textContent).toContain('inglês')
    expect(note.textContent).toContain('system speech settings')

    await user.click(screen.getByTestId('speech-setup-dismiss'))
    await waitFor(() => expect(screen.queryByTestId('speech-setup-note')).toBeNull())

    const stored = JSON.parse(window.localStorage.getItem('v1:speech-setup-dismissed')!)
    expect(stored).toContain('en')

    // Re-render: the same gap stays dismissed.
    render(<SpeechSetupNote languages={['pt', 'en']} dict={{}} uiLang="pt" />)
    await waitFor(() => expect(screen.queryByTestId('speech-setup-note')).toBeNull())
  })

  it('stays hidden when every course language has a voice', async () => {
    installVoices([
      { lang: 'pt-BR', name: 'Luciana' },
      { lang: 'en-US', name: 'Samantha' },
    ])
    render(<SpeechSetupNote languages={['pt', 'en']} dict={{}} uiLang="pt" />)
    await waitFor(() => expect(screen.queryByTestId('speech-setup-note')).toBeNull())
  })

  it('stays quiet when the device has no voices at all (nothing to compare)', async () => {
    installVoices([])
    render(<SpeechSetupNote languages={['pt', 'en']} dict={{}} uiLang="pt" />)
    await waitFor(() => expect(screen.queryByTestId('speech-setup-note')).toBeNull())
  })

  it('re-appears for a newly missing language after a previous gap was dismissed', async () => {
    const user = userEvent.setup()
    installVoices([{ lang: 'pt-BR', name: 'Luciana' }])

    // Pretend the user already dismissed a "fr" gap.
    window.localStorage.setItem('v1:speech-setup-dismissed', JSON.stringify(['fr']))

    render(<SpeechSetupNote languages={['pt', 'en']} dict={{}} uiLang="pt" />)
    await user.click(await screen.findByTestId('speech-setup-dismiss'))

    const stored = JSON.parse(window.localStorage.getItem('v1:speech-setup-dismissed')!)
    expect(stored).toEqual(expect.arrayContaining(['fr', 'en']))
  })
})
