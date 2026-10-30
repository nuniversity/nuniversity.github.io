import { describe, expect, it } from 'vitest'
import { buildRoadmapGraph, stepTitle } from '@/lib/roadmaps/step-graph'
import type { RoadmapMetadata, RoadmapStep } from '@/lib/roadmaps/types'

function makeStep(overrides: Partial<RoadmapStep> & Pick<RoadmapStep, 'id'>): RoadmapStep {
  return {
    title: overrides.id,
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

const roadmap: RoadmapMetadata = {
  id: 'r1',
  title: 'Roadmap',
  description: '',
  icon: 'Map',
  order: 1,
  difficulty: 'beginner',
  estimatedDuration: '3h',
  steps: [
    makeStep({ id: 'a', contentRef: 'course/lesson-a' }),
    makeStep({ id: 'b', prerequisites: ['a'], contentRef: 'course/lesson-b' }),
    makeStep({ id: 'c', prerequisites: ['b'] }),
  ],
}

describe('roadmap graph', () => {
  it('marks the first step current and later steps locked', () => {
    const graph = buildRoadmapGraph(roadmap, [], 'en')

    expect(graph.states.map((state) => state.status)).toEqual(['current', 'locked', 'locked'])
    expect(graph.states[1].lockedBy).toEqual(['a'])
    expect(graph.currentStepId).toBe('a')
    expect(graph.percent).toBe(0)
  })

  it('opens the next step as prerequisites complete', () => {
    const graph = buildRoadmapGraph(roadmap, ['a'], 'en')

    expect(graph.states[0].status).toBe('completed')
    expect(graph.states[1].status).toBe('current')
    expect(graph.states[2].status).toBe('locked')
    expect(graph.percent).toBe(33)
    expect(graph.nextStepId).toBe('b')
  })

  it('reports completion and never produces an invalid percentage', () => {
    const graph = buildRoadmapGraph(roadmap, ['a', 'b', 'c'], 'en')

    expect(graph.complete).toBe(true)
    expect(graph.percent).toBe(100)
    expect(graph.currentStepId).toBeNull()
    expect(graph.nextStepId).toBeNull()
  })

  it('resolves human titles for prerequisites', () => {
    expect(stepTitle(roadmap, 'a')).toBe('a')
    expect(stepTitle(roadmap, 'missing')).toBe('missing')
  })
})
