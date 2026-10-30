import type { RoadmapMetadata, RoadmapStep } from './types'
import { stepContentTarget, type ContentTarget } from './resolve-content-url'
import type { Locale } from '@/lib/i18n/config'

export type StepStatus = 'completed' | 'current' | 'available' | 'locked'

export interface RoadmapStepState {
  step: RoadmapStep
  index: number
  completed: boolean
  locked: boolean
  current: boolean
  status: StepStatus
  lockedBy: string[]
  content: ContentTarget | null
}

export interface RoadmapGraph {
  states: RoadmapStepState[]
  completedCount: number
  totalCount: number
  percent: number
  currentStepId: string | null
  nextStepId: string | null
  complete: boolean
}

/** Pure graph projection: derive every UI state the roadmap needs. */
export function buildRoadmapGraph(
  roadmap: RoadmapMetadata,
  completedSteps: string[],
  locale: Locale
): RoadmapGraph {
  const completed = new Set(completedSteps)
  const steps = roadmap.steps
  let currentStepId: string | null = null

  const states: RoadmapStepState[] = steps.map((step, index) => {
    const missing = step.prerequisites.filter((id) => !completed.has(id))
    const isCompleted = completed.has(step.id)
    // The first step is always open; later steps open when every prerequisite
    // is complete. The graph is ordered, so the first incomplete open step is
    // the one the learner should do next.
    const unlocked = index === 0 || missing.length === 0
    const locked = !isCompleted && !unlocked
    const current = !isCompleted && unlocked && currentStepId === null
    if (current) currentStepId = step.id

    return {
      step,
      index,
      completed: isCompleted,
      locked,
      current,
      status: isCompleted ? 'completed' : locked ? 'locked' : current ? 'current' : 'available',
      lockedBy: missing,
      content: stepContentTarget(step, locale),
    }
  })

  const completedCount = states.filter((state) => state.completed).length
  const totalCount = steps.length
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const nextStepId =
    currentStepId ??
    states.find((state) => !state.completed && !state.locked)?.step.id ??
    null

  return {
    states,
    completedCount,
    totalCount,
    percent,
    currentStepId,
    nextStepId,
    complete: totalCount > 0 && completedCount === totalCount,
  }
}

/** Resolve a prerequisite id to the human title used in the card. */
export function stepTitle(roadmap: RoadmapMetadata, stepId: string): string {
  return roadmap.steps.find((step) => step.id === stepId)?.title ?? stepId
}
