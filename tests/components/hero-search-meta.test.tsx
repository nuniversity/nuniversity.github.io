import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSearch from '@/components/home/HeroSearch'

vi.stubGlobal('React', React)

const mocks = { push: vi.fn() }
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

const dict = { search: { trigger: 'Search', placeholder: 'Search', empty: 'No results', loading: 'Loading', close: 'Close' } } as any

const FIXTURE = [
  {
    id: 'en:lesson:x',
    type: 'lesson',
    title: 'Advanced Memory Tuning',
    description: 'Tuning agent memory',
    url: '/en/courses/agent/07-tuning/',
    lang: 'en',
    courseTitle: 'Agent Engineering',
    area: 'Artificial Intelligence',
    difficulty: 'beginner',
    duration: '30 min',
    position: 7,
    totalLessons: 12,
  },
]

describe('HeroSearch metadata rendering', () => {
  it('renders the metadata chips and the course context', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => FIXTURE }) as typeof fetch

    const { container } = render(
      <HeroSearch lang="en" dict={dict} placeholder="Search" label="Search" />
    )

    const input = screen.getByTestId('hero-search-input')
    input.focus()
    await vi.waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())

    // Type to trigger the results.
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(input, { target: { value: 'memory' } })

    await screen.findByText('Advanced Memory Tuning')

    expect(screen.getByText('Agent Engineering · Lesson 7 of 12')).toBeInTheDocument()
    expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument()
    expect(screen.getByText('beginner')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()

    // The chips must be inside a flex container so they wrap rather than
    // overflow, and must not be clipped by an ancestor.
    const chips = screen.getByText('Artificial Intelligence')
    const chipsRow = chips.parentElement as HTMLElement
    expect(chipsRow.className).toContain('flex')
    expect(chipsRow.className).toContain('flex-wrap')
  })
})
