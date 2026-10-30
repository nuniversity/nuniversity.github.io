import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import BrainWritingSession from '@/components/tools/BrainWritingSession'

const KEY = 'mimir:tools:brainwriting'

function seed() {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      sessionName: 'Workshop',
      method: '6-3-5',
      participants: ['A', 'B'],
      rounds: 2,
      timePerRound: 5,
      currentRound: 1,
      ideas: {
        A: ['a1', 'a2', 'a3'],
        B: ['b1', 'b2', 'b3'],
      },
      completedRounds: [{ round: 1, ideas: { A: ['a1'], B: ['b1'] } }],
      isActive: false,
      deadline: null,
      remaining: 0,
    })
  )
}

describe('BrainWritingSession', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('rotates sheets to the next participant for the next round', () => {
    seed()
    render(<BrainWritingSession lang="en" dict={{}} />)

    const startRound = screen.getByRole('button', { name: /Start Round 2/i })
    fireEvent.click(startRound)

    const cardA = screen.getByRole('heading', { name: 'A' }).closest('div.bg-card')
    const cardB = screen.getByRole('heading', { name: 'B' }).closest('div.bg-card')

    // A receives B's sheet, and keeps room for new ideas.
    const firstA = cardA?.querySelector('textarea') as HTMLTextAreaElement
    const firstB = cardB?.querySelector('textarea') as HTMLTextAreaElement
    expect(firstA.value).toBe('b1')
    expect(firstB.value).toBe('a1')
    expect((cardA as HTMLElement).querySelectorAll('textarea')).toHaveLength(6)
  })

  it('keeps the inherited ideas labelled for the participant', () => {
    seed()
    render(<BrainWritingSession lang="en" dict={{}} />)

    fireEvent.click(screen.getByRole('button', { name: /Start Round 2/i }))

    expect(screen.getAllByText(/from previous round/i)).toHaveLength(6)
  })
})
