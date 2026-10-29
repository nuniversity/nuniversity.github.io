import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import HeroSearch from '@/components/home/HeroSearch'
import type { SearchDoc } from '@/lib/search/matcher'


const mocks = { push: vi.fn() }
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

const dict = {
  search: {
    trigger: 'Search',
    placeholder: 'Search courses, lessons, tools…',
    empty: 'No results for "{query}"',
    loading: 'Loading search index…',
    close: 'Close',
    results: '{n} results',
    hint_navigate: 'Navigate',
    hint_open: 'Open',
    hint_close: 'to close',
  },
} as any

const FIXTURE: SearchDoc[] = [
  {
    id: 'en:lesson:memory',
    type: 'lesson',
    title: 'Advanced Memory Tuning',
    description: 'Tuning agent memory',
    url: '/en/courses/agent/07-tuning/',
    lang: 'en',
  },
  {
    id: 'en:tool:pomodoro',
    type: 'tool',
    title: 'Pomodoro Timer',
    description: 'Focus timer',
    url: '/en/tools/pomodoro-timer/',
    lang: 'en',
  },
  {
    id: 'en:course:agent',
    type: 'course',
    title: 'Agent Engineering',
    description: 'Build agents',
    url: '/en/courses/agent/',
    lang: 'en',
  },
]

describe('HeroSearch', () => {
  beforeEach(() => {
    mocks.push.mockClear()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => FIXTURE,
    }) as typeof fetch
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the search index lazily and shows type-ahead results', async () => {
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)

    const input = screen.getByTestId('hero-search-input')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'memory' } })

    expect(await screen.findByText('Advanced Memory Tuning')).toBeInTheDocument()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('navigates to the top result when Enter is pressed', async () => {
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)

    const input = screen.getByTestId('hero-search-input')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'memory' } })
    await screen.findByText('Advanced Memory Tuning')

    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mocks.push).toHaveBeenCalledWith('/en/courses/agent/07-tuning/')
  })

  it('navigates to the highlighted result when Enter is pressed', async () => {
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)

    const input = screen.getByTestId('hero-search-input')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'agent' } })
    await screen.findByText('Agent Engineering')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mocks.push).toHaveBeenCalledTimes(1)
    expect(mocks.push.mock.calls[0][0]).not.toBe('/en/courses/agent/')
  })

  it('navigates when a result is clicked', async () => {
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)

    const input = screen.getByTestId('hero-search-input')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'pomodoro' } })

    const result = await screen.findByText('Pomodoro Timer')
    fireEvent.click(result)

    expect(mocks.push).toHaveBeenCalledWith('/en/tools/pomodoro-timer/')
  })

  it('shows the empty state when nothing matches', async () => {
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)

    const input = screen.getByTestId('hero-search-input')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'zzzzzz' } })

    await waitFor(() => {
      expect(screen.getByText(/No results for/)).toBeInTheDocument()
    })
  })

  it('does not fetch the index before the field is used', () => {
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('clears the query with the clear button', async () => {
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)

    const input = screen.getByTestId('hero-search-input')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'memory' } })
    await screen.findByText('Advanced Memory Tuning')

    fireEvent.click(screen.getByLabelText('Close'))
    expect(input).toHaveValue('')
  })

  it('renders the results panel above the continue-learning card', async () => {
    // The dropdown and the resume card sit in different stacking contexts, so
    // the dropdown's z-index has to be the higher of the two — otherwise the
    // results are painted behind the card.
    render(<HeroSearch lang="en" dict={dict} placeholder="Search…" label="Search" />)

    const input = screen.getByTestId('hero-search-input')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'memory' } })
    await screen.findByText('Advanced Memory Tuning')

    const panel = screen.getByRole('listbox')
    const panelZ = Number(panel.className.match(/z-\[?(\d+)\]?/)?.[1] ?? 0)

    // The resume card is rendered by ContinueLearning with z-10.
    expect(panelZ).toBeGreaterThan(10)
  })
})
