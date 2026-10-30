import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReviewClient from '@/components/review/ReviewClient'
import { saveReviewCard } from '@/lib/practice/cards'
import { newCard } from '@/lib/practice/fsrs'


/** Puts one due vocab card in the shared store, as a finished lesson would. */
function seedDueVocabCard() {
  const card = newCard('lang::pt-en::w001', 'english-for-pt', 'vocabulary', new Date('2026-01-01T00:00:00Z'))
  saveReviewCard(card)
}

const vocabIndex = {
  pair: 'pt-en',
  course: 'english-for-pt',
  generatedAt: '2026-01-01T00:00:00Z',
  items: [{ key: 'lang::pt-en::w001', source: 'hello', target: 'olá' }],
}

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (String(url).includes('/vocab-index/pt-en.json')) {
      return { ok: true, json: async () => vocabIndex } as Response
    }
    return { ok: false } as Response
  }))
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('ReviewClient with vocabulary cards', () => {
  it('renders due vocab cards as recall items and updates FSRS on self-grade', async () => {
    seedDueVocabCard()
    const user = userEvent.setup()

    render(<ReviewClient lang="pt" dict={{ review: {}, languageCourse: {} }} />)

    // The recall card appears with the L1 prompt.
    const card = await screen.findByTestId('vocab-review-card')
    expect(card).toBeDefined()
    expect(screen.getByTestId('vocab-prompt').textContent).toBe('olá')

    // Reveal → self-grade → FSRS card advances.
    await user.click(screen.getByTestId('vocab-reveal'))
    expect(screen.getByTestId('vocab-answer').textContent).toBe('hello')
    await user.click(screen.getByTestId('vocab-knew-it'))
    await user.click(screen.getByTestId('vocab-next'))

    await waitFor(() => expect(screen.getByTestId('review-done')).toBeInTheDocument())

    // The card was reviewed: its due date moved into the future.
    const stored = JSON.parse(window.localStorage.getItem('v1:review-cards')!)
    const reviewed = stored['lang::pt-en::w001']
    expect(reviewed).toBeDefined()
    expect(reviewed.reps).toBeGreaterThan(0)
    expect(new Date(reviewed.due).getTime()).toBeGreaterThan(new Date('2026-01-01T00:00:00Z').getTime())
  })

  it('shows the empty state when only foreign cards exist and none are due', async () => {
    render(<ReviewClient lang="pt" dict={{ review: {} }} />)
    await waitFor(() => expect(screen.getByTestId('review-empty')).toBeInTheDocument())
  })
})
