import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { VocabularyGameClient } from '@/app/[lang]/games/vocabulary/[slug]/vocabulary-game-client'
import type { VocabularyGame } from '@/lib/games/get-game-content'

vi.stubGlobal('React', React)

const game: VocabularyGame = {
  id: 'test-vocab',
  title: 'Test Vocabulary',
  description: 'A test vocabulary game',
  difficulty: 'beginner',
  category: 'general',
  language_pair: { source: 'en', target: 'pt' },
  words: [
    { id: 'w1', source: 'hello', target: 'olá', context: 'greeting' },
    { id: 'w2', source: 'world', target: 'mundo', context: 'noun' },
  ],
}

const dict = { games: {} }

function matchPair(source: string, target: string) {
  fireEvent.click(screen.getByRole('button', { name: source }))
  fireEvent.click(screen.getByRole('button', { name: target }))
  act(() => {
    vi.advanceTimersByTime(600)
  })
}

describe('VocabularyGameClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a card for each source and target word', () => {
    render(<VocabularyGameClient lang="en" game={game} dict={dict} />)

    for (const word of game.words) {
      expect(screen.getByRole('button', { name: word.source })).toBeDefined()
      expect(screen.getByRole('button', { name: word.target })).toBeDefined()
    }
  })

  it('marks a matching pair and adds score after the delay', () => {
    render(<VocabularyGameClient lang="en" game={game} dict={dict} />)

    matchPair('hello', 'olá')

    expect(screen.getByText('1/8')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
  })

  it('shows the completion overlay when every pair is matched', () => {
    render(<VocabularyGameClient lang="en" game={game} dict={dict} />)

    matchPair('hello', 'olá')
    matchPair('world', 'mundo')

    expect(screen.getByText('Congratulations!')).toBeDefined()
  })

  it('does not show the overlay when only some pairs are matched', () => {
    render(<VocabularyGameClient lang="en" game={game} dict={dict} />)

    matchPair('hello', 'olá')

    expect(screen.queryByText('Congratulations!')).toBeNull()
  })
})
