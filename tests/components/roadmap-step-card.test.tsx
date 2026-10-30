import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoadmapStepCard } from '@/components/roadmaps/RoadmapStepCard'
import type { RoadmapMetadata, RoadmapStep } from '@/lib/roadmaps/types'
import type { RoadmapStepState } from '@/lib/roadmaps/step-graph'

const dict = {
  roadmaps: {
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
  },
}

const roadmap: RoadmapMetadata = {
  id: 'r',
  title: 'Roadmap',
  description: '',
  icon: 'Map',
  order: 1,
  difficulty: 'beginner',
  estimatedDuration: '2h',
  steps: [],
}

function state(overrides: Partial<RoadmapStepState> = {}): RoadmapStepState {
  const step: RoadmapStep = {
    id: 'a',
    title: 'First step',
    type: 'course',
    contentRef: 'processes-flowchart/01-intro',
    description: 'Step description',
    prerequisites: [],
    conditionals: [],
    comments: '',
    ideas: [],
    relationships: [],
  }
  return {
    step,
    index: 0,
    completed: false,
    locked: false,
    current: true,
    status: 'current',
    lockedBy: [],
    content: { href: '/en/courses/processes-flowchart/01-intro/', kind: 'course' },
    ...overrides,
  }
}

const baseProps = {
  roadmap,
  isExpanded: false,
  onToggle: vi.fn(),
  onToggleComplete: vi.fn(),
  lang: 'en' as const,
  dict,
  lockedByLabel: (id: string) => id,
}

describe('RoadmapStepCard', () => {
  it('is an accessible expand/collapse control', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<RoadmapStepCard {...baseProps} state={state()} onToggle={onToggle} />)

    const header = screen.getByRole('button', { name: /First step/ })
    expect(header).toHaveAttribute('aria-expanded', 'false')
    await user.click(header)
    expect(onToggle).toHaveBeenCalled()
  })

  it('renders the expanded region, content link and completion action', () => {
    render(<RoadmapStepCard {...baseProps} state={state()} isExpanded />)

    const region = screen.getByRole('region', { name: 'First step' })
    expect(region).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to course' })).toHaveAttribute(
      'href',
      '/en/courses/processes-flowchart/01-intro/'
    )
    expect(screen.getAllByRole('button', { name: 'Mark as complete' }).length).toBeGreaterThan(0)
  })

  it('shows the blocking prerequisites and disables completion when locked', () => {
    render(
      <RoadmapStepCard
        {...baseProps}
        state={state({
          completed: false,
          current: false,
          status: 'locked',
          locked: true,
          lockedBy: ['previous'],
        })}
        isExpanded
      />
    )

    expect(screen.getByText('Finish these steps first:')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'previous' })).toHaveAttribute('href', '#step-previous')
    expect(screen.getAllByRole('button', { name: 'Mark as complete' })[0]).toBeDisabled()
  })

  it('uses an external link affordance for external content', () => {
    render(
      <RoadmapStepCard
        {...baseProps}
        state={state({ content: { href: 'https://example.com', kind: 'external' } })}
        isExpanded
      />
    )

    expect(screen.getByRole('link', { name: 'Open resource' })).toHaveAttribute(
      'href',
      'https://example.com'
    )
  })
})
