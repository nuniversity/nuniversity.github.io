/**
 * Learner-model storage schema v2. All data stays in localStorage; nothing
 * identifies the user. Keys are additive — no existing v1 key changes.
 */

export interface PracticeAnswerRecord {
  key: string
  lessonSlug: string
  label: string
  skill: string | null
  attempts: number
  correct: number
  /** Beta posterior mean (correct + 1) / (attempts + 2), 0..1. */
  mastery: number
  lastCorrect: boolean
  lastAnsweredAt: string
}

export interface PracticeAnswerStore {
  version: 2
  updatedAt: string
  answers: Record<string, PracticeAnswerRecord>
}

export interface ReviewCardState {
  key: string
  courseSlug: string
  lessonSlug: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: number
  lastReview: string | null
}

export type ReviewCardMap = Record<string, ReviewCardState>
