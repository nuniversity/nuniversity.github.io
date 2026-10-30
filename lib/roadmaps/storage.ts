import { readJson, safeRemove, writeJson } from '@/lib/storage/safe-storage'
import type { RoadmapProgress } from './types'

const PREFIX = 'v1:roadmap-progress-'
const LEGACY_PREFIX = 'roadmap-progress-'
const REWARD_PREFIX = 'v1:roadmap-reward-'

export function roadmapProgressKey(roadmapId: string): string {
  return `${PREFIX}${roadmapId}`
}

export function sanitizeRoadmapProgress(raw: unknown, roadmapId: string): RoadmapProgress | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (!Array.isArray(value.completedSteps)) return null
  const completedSteps = value.completedSteps.filter((step): step is string => typeof step === 'string')
  return {
    roadmapId: typeof value.roadmapId === 'string' ? value.roadmapId : roadmapId,
    completedSteps: Array.from(new Set(completedSteps)),
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : new Date().toISOString(),
    lastAccessed: typeof value.lastAccessed === 'string' ? value.lastAccessed : new Date().toISOString(),
  }
}

export function getRoadmapProgress(roadmapId: string): RoadmapProgress | null {
  const saved = readJson(roadmapProgressKey(roadmapId), (raw) => sanitizeRoadmapProgress(raw, roadmapId))
  if (saved) return saved

  // One-time migration from the pre-v1 key. Keeping it out of the normal
  // path means the new namespace is the only place future reads/writes go.
  const legacy = readJson(`${LEGACY_PREFIX}${roadmapId}`, (raw) => sanitizeRoadmapProgress(raw, roadmapId))
  if (!legacy) return null
  saveRoadmapProgress(legacy)
  safeRemove(`${LEGACY_PREFIX}${roadmapId}`)
  return legacy
}

export function saveRoadmapProgress(progress: RoadmapProgress): void {
  writeJson(roadmapProgressKey(progress.roadmapId), progress)
}

export function emptyRoadmapProgress(roadmapId: string, now: Date = new Date()): RoadmapProgress {
  const at = now.toISOString()
  return { roadmapId, completedSteps: [], startedAt: at, lastAccessed: at }
}

export function resetRoadmapProgress(roadmapId: string, now: Date = new Date()): RoadmapProgress {
  const progress = emptyRoadmapProgress(roadmapId, now)
  saveRoadmapProgress(progress)
  safeRemove(`${REWARD_PREFIX}${roadmapId}`)
  return progress
}

/** Toggles a step and stamps lastAccessed; pure enough to test with a fixed date. */
export function toggleRoadmapStep(
  progress: RoadmapProgress,
  stepId: string,
  now: Date = new Date()
): RoadmapProgress {
  const completed = progress.completedSteps.includes(stepId)
  return {
    ...progress,
    completedSteps: completed
      ? progress.completedSteps.filter((id) => id !== stepId)
      : [...progress.completedSteps, stepId],
    lastAccessed: now.toISOString(),
  }
}

export function completionPercent(completed: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((Math.min(completed, total) / total) * 100)
}

/** Ensures a completion reward is granted at most once per roadmap. */
export function hasRoadmapReward(roadmapId: string): boolean {
  return readJson<boolean>(`${REWARD_PREFIX}${roadmapId}`) === true
}

export function markRoadmapReward(roadmapId: string): void {
  writeJson(`${REWARD_PREFIX}${roadmapId}`, true)
}
