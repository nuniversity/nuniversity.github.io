import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoadmapTimeline } from '@/components/roadmaps/RoadmapTimeline'
import type { RoadmapMetadata, RoadmapStep } from '@/lib/roadmaps/types'
import { emptyRoadmapProgress, saveRoadmapProgress } from '@/lib/roadmaps/storage'

const dict = {
  roadmaps: {
    duration: 'Duration',
    steps: 'Steps',
    difficulty: 'Difficulty',
    progress: 'Progress',
    overallProgress: 'Overall Progress',
    of: 'of',
    stepsCompleted: 'steps completed',
    continue: 'Continue',
    shareStep: 'Share step',
    linkCopied: 'Copied',
    reset: 'Reset',
    prerequisites: 'Prerequisites',
    nextSteps: 'Next Steps',
    ideas: 'Ideas to Practice',
    comments: 'Comment',
    goToCourse: 'Go to course',
    markComplete: 'Mark as complete',
    markIncomplete: 'Mark step as not complete',
    completed: 'Completed',
    current: 'Current',
    locked: 'Locked',
    available: 'Available',
    lockedHint: 'Finish these steps first:',
    optional: 'optional',
    openResource: 'Open resource',
    congratulations: 'Congratulations!',
    roadmapComplete: 'You have completed this roadmap!',
    difficultyLevels: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  },
}

function makeStep(id: string, title: string, prerequisites: string[] = []): RoadmapStep {
  return {
    id,
    title,
    type: 'course',
    contentRef: `course/${id}`,
    description: `${title} description`,
    prerequisites,
    conditionals: [],
    comments: '',
    ideas: [],
    relationships: [],
  }
}

const roadmap: RoadmapMetadata = {
  id: 'r',
  title: 'Test roadmap',
  description: 'A test roadmap',
  icon: 'Map',
  order: 1,
  difficulty: 'beginner',
  estimatedDuration: '3h',
  steps: [makeStep('first', 'First step'), makeStep('second', 'Second step', ['first']), makeStep('third', 'Third step', ['second'])],
}

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('RoadmapTimeline', () => {
  it('tracks completed steps and persists them under the v1 key', async () => {
    const user = userEvent.setup()
    render(<RoadmapTimeline roadmap={roadmap} lang="en" dict={dict} />)

    await screen.findByText(/0 of 3 steps completed/)
    await user.click(screen.getAllByRole('button', { name: 'Mark as complete' })[0])

    await screen.findByText(/1 of 3 steps completed/)
    const stored = JSON.parse(window.localStorage.getItem('v1:roadmap-progress-r') ?? 'null')
    expect(stored.completedSteps).toEqual(['first'])
  })

  it('opens the step named in the share URL', async () => {
    window.history.replaceState({}, '', '/?step=second')
    render(<RoadmapTimeline roadmap={roadmap} lang="en" dict={dict} />)

    expect(await screen.findByRole('region', { name: 'Second step' })).toBeInTheDocument()
  })

  it('shows the completion state and grants the roadmap reward once', async () => {
    saveRoadmapProgress({ ...emptyRoadmapProgress('r'), completedSteps: ['first', 'second'] })
    const user = userEvent.setup()
    render(<RoadmapTimeline roadmap={roadmap} lang="en" dict={dict} />)

    await screen.findByText(/2 of 3 steps completed/)
    await user.click(screen.getAllByRole('button', { name: 'Mark as complete' })[0])

    expect(await screen.findByText(/Congratulations/)).toBeInTheDocument()
    const profile = JSON.parse(window.localStorage.getItem('v1:profile') ?? 'null')
    expect(profile.xp).toBe(100)
    expect(window.localStorage.getItem('v1:roadmap-reward-r')).toBe('true')
  })

  it('copies a shareable step URL', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    render(<RoadmapTimeline roadmap={roadmap} lang="en" dict={dict} />)
    await screen.findByText(/0 of 3 steps completed/)
    await user.click(screen.getByRole('button', { name: 'Share step' }))

    await waitFor(() => expect(writeText).toHaveBeenCalled())
    expect(writeText.mock.calls[0][0]).toContain('step=')
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })
})
