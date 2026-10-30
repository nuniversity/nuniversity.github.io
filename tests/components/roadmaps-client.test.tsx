import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RoadmapsClient } from '@/app/[lang]/roadmaps/roadmaps-client'
import { saveRoadmapProgress, emptyRoadmapProgress } from '@/lib/roadmaps/storage'

const dict = {
  roadmaps: {
    title: 'Roadmaps',
    subtitle: 'Structured paths',
    searchPlaceholder: 'Search roadmaps',
    noResults: 'No roadmaps found',
    noRoadmaps: 'No roadmaps available yet',
    tryDifferentSearch: 'Try a different search term',
    checkBackSoon: 'Check back soon',
    clearSearch: 'Clear search',
    startLearning: 'Start Learning',
    continue: 'Continue',
    completed: 'Completed',
    totalRoadmaps: 'roadmaps',
    totalSteps: 'total steps',
    steps: 'steps',
    of: 'of',
    stepsCompleted: 'steps completed',
    yourProgress: 'Your progress',
    difficultyLevels: {
      all: 'All Levels',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
  },
}

const ROADMAPS = [
  {
    id: 'a',
    order: 1,
    title: 'Roadmap A',
    description: 'First path',
    icon: 'Map',
    difficulty: 'beginner',
    estimatedDuration: '2h',
    stepCount: 2,
  },
  {
    id: 'b',
    order: 2,
    title: 'Roadmap B',
    description: 'Second path',
    icon: 'Map',
    difficulty: 'advanced',
    estimatedDuration: '4h',
    stepCount: 4,
  },
]

beforeEach(() => {
  window.localStorage.clear()
})

describe('RoadmapsClient', () => {
  it('shows saved progress and a Continue label', async () => {
    saveRoadmapProgress({
      ...emptyRoadmapProgress('a'),
      completedSteps: ['one'],
    })
    render(<RoadmapsClient lang="en" roadmaps={ROADMAPS} dict={dict} />)

    expect(await screen.findByText('Continue')).toBeInTheDocument()
    const progress = screen.getAllByRole('progressbar').find((bar) => bar.getAttribute('aria-label') === 'Roadmap A: 50%')
    expect(progress).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByText(/1 of 2 steps completed/)).toBeInTheDocument()
  })

  it('sorts started roadmaps first', async () => {
    saveRoadmapProgress({ ...emptyRoadmapProgress('b'), completedSteps: ['one'] })
    render(<RoadmapsClient lang="en" roadmaps={ROADMAPS} dict={dict} />)

    await waitFor(() => expect(screen.getByRole('link', { name: /Roadmap B/ })).toBeInTheDocument())
    const links = screen.getAllByRole('link').filter((link) => /Roadmap [AB]/.test(link.textContent ?? ''))
    expect(links[0]).toHaveTextContent('Roadmap B')
  })

  it('filters by difficulty and search', async () => {
    render(<RoadmapsClient lang="en" roadmaps={ROADMAPS} dict={dict} />)

    fireEvent.click(screen.getByRole('button', { name: 'Advanced' }))
    expect(screen.queryByText('Roadmap A')).not.toBeInTheDocument()
    expect(screen.getByText('Roadmap B')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All Levels' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'nothing' } })
    expect(screen.getByText('No roadmaps found')).toBeInTheDocument()
  })
})
