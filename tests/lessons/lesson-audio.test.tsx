import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LessonAudio, {
  collectSectionText,
  collectSpokenText,
  findCurrentSectionId,
} from '@/components/lessons/LessonAudio'

vi.stubGlobal('React', React)

/** Minimal stand-in for SpeechSynthesisUtterance in jsdom. */
class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

describe('collectSpokenText', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('skips the audio control itself', () => {
    document.body.innerHTML = `
      <div data-lesson-content>
        <div data-lesson-audio>
          <p>Listen to this lesson</p>
          <p>Read the lesson aloud using your browser's speech engine.</p>
        </div>
        <p>The lesson body starts here.</p>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-lesson-content]')!
    const text = collectSpokenText(root)

    expect(text).toContain('The lesson body starts here.')
    expect(text).not.toContain('Listen to this lesson')
    expect(text).not.toContain('speech engine')
  })

  it('skips code, tables and diagrams', () => {
    document.body.innerHTML = `
      <div data-lesson-content>
        <p>Prose sentence.</p>
        <pre><code>const x = 1</code></pre>
        <table><tbody><tr><td>Cell text</td></tr></tbody></table>
        <figure><svg><text>Diagram label</text></svg></figure>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-lesson-content]')!
    const text = collectSpokenText(root)

    expect(text).toBe('Prose sentence.')
  })
})

describe('LessonAudio playback', () => {
  let spoken: FakeUtterance[]
  let cancel: ReturnType<typeof vi.fn>
  let installedVoices: Array<{ lang: string; name: string }>

  beforeEach(() => {
    document.body.innerHTML = ''
    spoken = []
    installedVoices = []
    cancel = vi.fn()
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak: (utterance: FakeUtterance) => spoken.push(utterance),
        cancel,
        pause: vi.fn(),
        resume: vi.fn(),
        getVoices: () => installedVoices,
      },
    })
  })

  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('speaks a short confirmation, then the lesson — never its own labels', async () => {
    const user = userEvent.setup()

    render(
      <div data-lesson-content>
        <LessonAudio
          lang="en-US"
          label="Listen to this lesson"
          description="Read the lesson aloud using your browser's speech engine."
          intro="Audio is on. Reading this lesson aloud."
        />
        <p>The lesson body starts here.</p>
      </div>
    )

    await user.click(screen.getByRole('button', { name: /listen to this lesson/i }))

    expect(spoken).toHaveLength(2)
    expect(spoken[0].text).toBe('Audio is on. Reading this lesson aloud.')
    expect(spoken[1].text).toContain('The lesson body starts here.')
    // The control's own copy must not be narrated.
    expect(spoken[1].text).not.toContain('Listen to this lesson')
    expect(spoken[1].text).not.toContain('speech engine')
  })

  it('warns when the browser has no voice for the lesson language', () => {
    installedVoices = [
      { lang: 'pt-BR', name: 'Portuguese (Brazil)' },
      { lang: 'en-US', name: 'English (United States)' },
    ]

    render(<LessonAudio lang="es-ES" voiceNote="No Spanish voice installed." />)

    expect(screen.getByText('No Spanish voice installed.')).toBeInTheDocument()
  })

  it('stays quiet when the lesson language has a voice', () => {
    installedVoices = [
      { lang: 'es-ES', name: 'Spanish (Spain)' },
      { lang: 'en-US', name: 'English (United States)' },
    ]

    render(<LessonAudio lang="es-ES" voiceNote="No Spanish voice installed." />)

    expect(screen.queryByText('No Spanish voice installed.')).toBeNull()
  })

  it('stays quiet when the browser reports no voices at all', () => {
    installedVoices = []

    render(<LessonAudio lang="es-ES" voiceNote="No Spanish voice installed." />)

    expect(screen.queryByText('No Spanish voice installed.')).toBeNull()
  })

  const renderLesson = () =>
    render(
      <div data-lesson-content>
        <LessonAudio lang="en-US" intro="Intro." />
        <h2 id="alpha">Alpha section</h2>
        <p>Alpha body.</p>
        <h3 id="alpha-detail">Alpha detail</h3>
        <p>Detail body.</p>
        <h2 id="beta">Beta section</h2>
        <p>Beta body.</p>
      </div>
    )

  it('offers the lesson sections in a picker', async () => {
    renderLesson()

    const picker = await screen.findByRole('combobox')
    const options = Array.from(picker.querySelectorAll('option')).map(o => o.textContent)

    expect(options).toEqual([
      'The section I am reading',
      'The whole lesson',
      'Alpha section',
      'Alpha detail',
      'Beta section',
    ])
  })

  it('reads only the chosen section', async () => {
    const user = userEvent.setup()
    renderLesson()

    const picker = await screen.findByRole('combobox')
    await user.selectOptions(picker, 'beta')
    await user.click(screen.getByRole('button', { name: /listen/i }))

    expect(spoken[1].text).toContain('Beta section')
    expect(spoken[1].text).toContain('Beta body')
    expect(spoken[1].text).not.toContain('Alpha body')
  })

  it('reads the whole lesson when asked', async () => {
    const user = userEvent.setup()
    renderLesson()

    const picker = await screen.findByRole('combobox')
    await user.selectOptions(picker, 'all')
    await user.click(screen.getByRole('button', { name: /listen/i }))

    expect(spoken[1].text).toContain('Alpha body')
    expect(spoken[1].text).toContain('Beta body')
  })

  it('follows the reader when set to the current section', async () => {
    const user = userEvent.setup()
    renderLesson()

    const alpha = document.getElementById('alpha')!
    const detail = document.getElementById('alpha-detail')!
    const beta = document.getElementById('beta')!
    alpha.getBoundingClientRect = () => ({ top: 80 } as DOMRect)
    detail.getBoundingClientRect = () => ({ top: 400 } as DOMRect)
    beta.getBoundingClientRect = () => ({ top: 900 } as DOMRect)

    await user.click(screen.getByRole('button', { name: /listen/i }))

    expect(spoken[1].text).toContain('Alpha section')
    expect(spoken[1].text).toContain('Alpha body')
    expect(spoken[1].text).not.toContain('Beta body')
  })

  it('includes nested subsections in their parent', () => {
    renderLesson()
    const root = document.querySelector<HTMLElement>('[data-lesson-content]')!

    const alpha = collectSectionText(root, 'alpha')
    expect(alpha).toContain('Alpha body.')
    expect(alpha).toContain('Detail body.')
    expect(alpha).not.toContain('Beta body.')

    const detail = collectSectionText(root, 'alpha-detail')
    expect(detail).toContain('Detail body.')
    expect(detail).not.toContain('Alpha body.')
  })

  it('resolves the current section from scroll position', () => {
    renderLesson()
    const root = document.querySelector<HTMLElement>('[data-lesson-content]')!
    const sections = [
      { id: 'alpha', text: 'Alpha section', level: 2 },
      { id: 'beta', text: 'Beta section', level: 2 },
    ]

    document.getElementById('alpha')!.getBoundingClientRect = () => ({ top: -400 } as DOMRect)
    document.getElementById('beta')!.getBoundingClientRect = () => ({ top: 220 } as DOMRect)

    expect(findCurrentSectionId(root, sections)).toBe('alpha')
  })

  it('keeps stop and restart visible but disabled while idle', async () => {
    renderLesson()

    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled()

    await userEvent.setup().click(screen.getByRole('button', { name: /listen/i }))

    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled()
  })

  it('stops playback and goes back to idle', async () => {
    const user = userEvent.setup()
    renderLesson()

    await user.click(screen.getByRole('button', { name: /listen/i }))
    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(cancel).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled()
    expect(screen.getByText('Listen')).toBeInTheDocument()
  })

  it('restarts the section from the beginning', async () => {
    const user = userEvent.setup()
    renderLesson()

    await user.click(screen.getByRole('button', { name: /listen/i }))
    expect(spoken).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Restart' }))

    expect(spoken).toHaveLength(4)
    expect(spoken[2].text).toBe('Intro.')
  })

  it('falls back to the English confirmation when no intro is supplied', async () => {
    const user = userEvent.setup()

    render(
      <div data-lesson-content>
        <LessonAudio lang="en-US" />
        <p>Body.</p>
      </div>
    )

    await user.click(screen.getByRole('button', { name: /listen/i }))

    expect(spoken[0].text).toBe('Audio is on. Reading this lesson aloud.')
  })
})
