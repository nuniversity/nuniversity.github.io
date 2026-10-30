import { beforeEach, describe, expect, it } from 'vitest'
import {
  completionPercent,
  emptyRoadmapProgress,
  getRoadmapProgress,
  hasRoadmapReward,
  markRoadmapReward,
  resetRoadmapProgress,
  roadmapProgressKey,
  saveRoadmapProgress,
  toggleRoadmapStep,
} from '@/lib/roadmaps/storage'

const NOW = new Date('2026-01-10T10:00:00Z')

beforeEach(() => {
  window.localStorage.clear()
})

describe('roadmap storage', () => {
  it('uses the v1 namespace', () => {
    expect(roadmapProgressKey('r1')).toBe('v1:roadmap-progress-r1')
  })

  it('round-trips progress', () => {
    const progress = { ...emptyRoadmapProgress('r1', NOW), completedSteps: ['a'] }
    saveRoadmapProgress(progress)
    expect(getRoadmapProgress('r1')).toEqual(progress)
  })

  it('migrates the legacy key once', () => {
    window.localStorage.setItem(
      'roadmap-progress-r1',
      JSON.stringify({
        roadmapId: 'r1',
        completedSteps: ['a', 'a', 'b'],
        startedAt: NOW.toISOString(),
        lastAccessed: NOW.toISOString(),
      })
    )

    expect(getRoadmapProgress('r1')?.completedSteps).toEqual(['a', 'b'])
    expect(window.localStorage.getItem('roadmap-progress-r1')).toBeNull()
    expect(window.localStorage.getItem('v1:roadmap-progress-r1')).not.toBeNull()
  })

  it('discards corrupt data', () => {
    window.localStorage.setItem('v1:roadmap-progress-r1', '{broken')
    expect(getRoadmapProgress('r1')).toBeNull()
    expect(window.localStorage.getItem('v1:roadmap-progress-r1')).toBeNull()
  })

  it('toggles with a fixed date and does not mutate input', () => {
    const progress = emptyRoadmapProgress('r1', NOW)
    const next = toggleRoadmapStep(progress, 'a', NOW)

    expect(progress.completedSteps).toEqual([])
    expect(next.completedSteps).toEqual(['a'])
    expect(next.lastAccessed).toBe(NOW.toISOString())
    expect(toggleRoadmapStep(next, 'a', NOW).completedSteps).toEqual([])
  })

  it('computes percentages and clamps them', () => {
    expect(completionPercent(0, 0)).toBe(0)
    expect(completionPercent(1, 3)).toBe(33)
    expect(completionPercent(5, 3)).toBe(100)
  })

  it('resets progress and the reward flag', () => {
    markRoadmapReward('r1')
    expect(hasRoadmapReward('r1')).toBe(true)

    const reset = resetRoadmapProgress('r1', NOW)
    expect(reset.completedSteps).toEqual([])
    expect(hasRoadmapReward('r1')).toBe(false)
  })
})
