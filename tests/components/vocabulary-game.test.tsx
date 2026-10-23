import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { VocabularyGameClient } from '@/components/languages/vocabulary-game-client'
import type { VocabularyGame } from '@/lib/languages/types'

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

const dict = {
  languages: {
    matching: {
      subtitle: 'Master new skills through interactive games and challenges',
      restart: 'Restart',
      how_to_play: 'How to Play',
      congratulations: 'Congratulations!',
      game_complete: "You've completed the game!",
      play_again: 'Play Again',
      more_activities: 'More Languages',
      best_score: 'Best score: {score}%',
      cards_count: '{n} cards',
      instructions: [
        'Click on cards to select them',
        'Match words in the source language with their translations',
        'Find all matching pairs to complete the game',
        'Try to complete with the highest accuracy in the shortest time!',
      ],
      stats: {
        score: 'Score',
        time: 'Time',
        matches: 'Matches',
        accuracy: 'Accuracy',
        final_score: 'Final Score',
      },
    },
    card: {
      words: '{n} words',
      not_attempted: 'Not attempted',
    },
    back_to_languages: 'Back to Languages',
  },
  games: {
    difficulty: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
  },
}

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

    expect(screen.getByText('1/2')).toBeDefined()
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
