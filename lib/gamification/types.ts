export interface StreakState {
  current: number
  best: number
  lastDay: string | null
}

export interface GamificationProfile {
  xp: number
  badges: Record<string, string>
  streak: StreakState
}

export type GamificationEvent =
  | { type: 'lesson-complete'; courseSlug: string; lessonSlug: string }
  | { type: 'quiz-pass'; quizSlug: string; percent: number; mode: 'practice' | 'exam' | 'course-exam' }
  | { type: 'course-complete'; courseSlug: string }
  | { type: 'review-complete'; reviewed: number }
  | { type: 'language-lesson-complete'; courseSlug: string; unitSlug: string; lessonSlug: string; percent: number }
  | { type: 'language-course-complete'; courseSlug: string }

export interface EventResult {
  profile: GamificationProfile
  gainedXp: number
  awardedBadges: string[]
}

export const XP_PER_LEVEL = 100
export const XP_GAINS = {
  'lesson-complete': 10,
  'quiz-pass': 20,
  'course-complete': 100,
  'review-complete': 10,
  'language-lesson-complete': 15,
  'language-course-complete': 100,
} as const

export const BADGE_IDS = [
  'first-lesson',
  'quiz-pass',
  'perfect-quiz',
  'course-complete',
  'streak-7',
  'polyglot-start',
] as const

/** Daily-goal target for the LanguageCourse app: one lesson ≈ this much XP. */
export const DAILY_GOAL_XP = 20

export type BadgeId = (typeof BADGE_IDS)[number]
