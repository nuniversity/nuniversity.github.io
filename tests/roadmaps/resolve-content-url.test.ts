import { describe, expect, it } from 'vitest'
import { resolveContentUrl, stepContentTarget } from '@/lib/roadmaps/resolve-content-url'
import type { RoadmapStep } from '@/lib/roadmaps/types'

function step(overrides: Partial<RoadmapStep>): RoadmapStep {
  return {
    id: 's',
    title: 'Step',
    type: 'course',
    description: '',
    prerequisites: [],
    conditionals: [],
    comments: '',
    ideas: [],
    relationships: [],
    ...overrides,
  }
}

describe('roadmap content URLs', () => {
  it('supports the legacy course/lesson form', () => {
    expect(stepContentTarget(step({ contentRef: 'processes-flowchart/01-intro' }), 'en')).toEqual({
      href: '/en/courses/processes-flowchart/01-intro',
      kind: 'course',
    })
  })

  it('supports an explicit courses path', () => {
    expect(resolveContentUrl(step({ contentRef: 'courses/a/b' }), 'pt')).toBe('/pt/courses/a/b')
  })

  it('maps tool, game and library step types', () => {
    expect(resolveContentUrl(step({ type: 'tool', contentRef: 'brain-writing-session' }), 'en')).toBe(
      '/en/tools/brain-writing-session'
    )
    expect(resolveContentUrl(step({ type: 'game', contentRef: 'logic/number-sequence' }), 'en')).toBe(
      '/en/games/logic/number-sequence'
    )
    expect(resolveContentUrl(step({ type: 'library', contentRef: 'book' }), 'en')).toBe('/en/library')
  })

  it('prefers external URLs', () => {
    expect(stepContentTarget(step({ externalUrl: 'https://example.com/x' }), 'en')).toEqual({
      href: 'https://example.com/x',
      kind: 'external',
    })
  })

  it('returns null for milestones and empty refs', () => {
    expect(stepContentTarget(step({ type: 'milestone' }), 'en')).toBeNull()
    expect(stepContentTarget(step({ contentRef: '..' }), 'en')).toBeNull()
  })
})
