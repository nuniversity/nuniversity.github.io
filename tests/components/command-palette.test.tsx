import React from 'react'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import CommandPalette from '@/components/search/CommandPalette'
import type { SearchDoc } from '@/lib/search/matcher'

vi.stubGlobal('React', React)

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
    hint_close: 'Close',
  },
  navigation: {
    courses: 'Courses',
    tools: 'Tools',
    games: 'Games',
    quizzes: 'Quizzes',
    library: 'Library',
    roadmaps: 'Roadmaps',
    languages: 'Languages',
  },
  courses: { lessons: 'Lessons' },
} as any

const FIXTURE: SearchDoc[] = [
  {
    id: 'en:lesson:foundations',
    type: 'lesson',
    title: 'Foundations of Agent Memory',
    description: 'Short and long term memory',
    url: '/en/courses/agent/01-foundations/',
    lang: 'en',
  },
  {
    id: 'en:lesson:advanced',
    type: 'lesson',
    title: 'Advanced Memory Tuning',
    description: 'Tune retrieval quality',
    url: '/en/courses/agent/07-tuning/',
    lang: 'en',
  },
  {
    id: 'en:course:aif',
    type: 'course',
    title: 'AWS AI Practitioner',
    description: 'Exam preparation course',
    url: '/en/courses/aws-aif-c01/',
    lang: 'en',
  },
  {
    id: 'en:library:mlops',
    type: 'library',
    title: 'MLOps Continuous Delivery',
    description: 'CI CD practices',
    url: 'https://example.com/mlops',
    lang: 'en',
  },
]

const originalFetch = globalThis.fetch
const originalOpen = globalThis.open

afterAll(() => {
  globalThis.fetch = originalFetch
  globalThis.open = originalOpen
})

beforeEach(() => {
  mocks.push.mockClear()
  document.body.style.overflow = ''
})

const renderPalette = (open: boolean, onClose = vi.fn()) => {
  const onOpen = vi.fn()
  render(
    <CommandPalette lang="en" dict={dict} open={open} onOpen={onOpen} onClose={onClose} />
  )
  return { onOpen, onClose }
}

describe('CommandPalette', () => {
  it('renders nothing when closed and toggles via Cmd/Ctrl+K', () => {
    const { onOpen, onClose } = renderPalette(false)

    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onOpen).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(onOpen).toHaveBeenCalledTimes(2)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes via Cmd/Ctrl+K while open', () => {
    const { onOpen, onClose } = renderPalette(true)
    expect(screen.getByTestId('command-palette')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('shows the loading state until the index resolves', async () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof fetch

    renderPalette(true)
    expect(screen.getByText('Loading search index…')).toBeInTheDocument()
    expect(screen.queryByTestId('search-result')).not.toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/search-index/en.json')
  })

  it('shows hints, then grouped results for a query, and opens with Enter', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    const { onClose } = renderPalette(true)
    await screen.findByText('Navigate')

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'memory' } })

    expect(await screen.findByTestId('search-count')).toHaveTextContent('2 results')
    const results = screen.getAllByTestId('search-result')
    expect(results).toHaveLength(2)
    expect(screen.queryByText('Courses')).not.toBeInTheDocument()
    expect(screen.getByText('Lessons')).toBeInTheDocument()
    expect(results[0]).toHaveAttribute('aria-selected', 'true')
    expect(results[0]).toHaveTextContent('Advanced Memory Tuning')

    await act(async () => {
      fireEvent.keyDown(screen.getByTestId('search-input'), { key: 'Enter' })
    })
    expect(mocks.push).toHaveBeenCalledWith('/en/courses/agent/07-tuning/')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves the active option with arrow keys', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    renderPalette(true)
    await screen.findByText('Navigate')
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'memory' } })
    await screen.findByText('Lessons')

    const input = screen.getByTestId('search-input')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    const results = screen.getAllByTestId('search-result')
    expect(results[0]).toHaveAttribute('aria-selected', 'false')
    expect(results[1]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(screen.getAllByTestId('search-result')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('opens external results in a new tab', async () => {
    const openMock = vi.fn()
    globalThis.open = openMock as unknown as typeof window.open
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    const { onClose } = renderPalette(true)
    await screen.findByText('Navigate')
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'mlops' } })

    await act(async () => {
      fireEvent.click(await screen.findByTestId('search-result'))
    })
    expect(openMock).toHaveBeenCalledWith('https://example.com/mlops', '_blank', 'noopener,noreferrer')
    expect(mocks.push).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the templated empty state when nothing matches', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    renderPalette(true)
    await screen.findByText('Navigate')
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'zzz' } })

    expect(await screen.findByTestId('search-empty')).toHaveTextContent('No results for "zzz"')
    expect(screen.queryByTestId('search-result')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    const { onClose } = renderPalette(true)
    await screen.findByText('Navigate')

    fireEvent.keyDown(screen.getByTestId('search-input'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes via the visible close button', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    const { onClose } = renderPalette(true)
    await screen.findByText('Navigate')

    const closeButton = screen.getByTestId('search-close')
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveAttribute('aria-label', 'Close')

    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    const { onClose } = renderPalette(true)
    await screen.findByText('Navigate')

    const backdrop = screen.getByTestId('command-palette').firstElementChild as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('exposes the dialog with an accessible name and modal semantics', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    renderPalette(true)
    await screen.findByText('Navigate')

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Search')
  })

  it('finds localized lessons by title in pt and es indexes', async () => {
    const localeFixture: SearchDoc[] = [
      {
        id: 'pt:lesson:memoria',
        type: 'lesson',
        title: 'Memória de Trabalho',
        description: 'Curto e longo prazo',
        url: '/pt/courses/agent/01-foundations/',
        lang: 'pt',
      },
      {
        id: 'es:lesson:memoria',
        type: 'lesson',
        title: 'Memoria a Corto Plazo',
        description: 'Recuerdo reciente',
        url: '/es/courses/agent/01-foundations/',
        lang: 'es',
      },
    ]
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => localeFixture }) as typeof fetch

    renderPalette(true)
    await screen.findByText('Navigate')

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'memoria' } })
    const results = await screen.findAllByTestId('search-result')
    expect(results).toHaveLength(2)
    expect(screen.getByText('Memória de Trabalho')).toBeInTheDocument()
    expect(screen.getByText('Memoria a Corto Plazo')).toBeInTheDocument()
    expect(screen.getByTestId('search-count')).toHaveTextContent('2 results')

    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'trabalho' } })
    expect(await screen.findAllByTestId('search-result')).toHaveLength(1)
    expect(screen.getByText('Memória de Trabalho')).toBeInTheDocument()
  })

  it('ignores Cmd/Ctrl+K while typing outside the palette', () => {
    const { onOpen } = renderPalette(false)

    const field = document.createElement('input')
    document.body.appendChild(field)
    fireEvent.keyDown(field, { key: 'k', metaKey: true })

    expect(onOpen).not.toHaveBeenCalled()

    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onOpen).toHaveBeenCalledTimes(1)
  })
})
