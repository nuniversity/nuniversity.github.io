/**
 * The ONLY module in the codebase allowed to import ts-fsrs (pinned 4.5.0).
 * Mapping: correct answer -> Rating.Good, incorrect -> Rating.Again.
 *
 * Short-term learning steps are disabled: this is a daily-review product, and
 * the default steps would re-serve a new card 10 minutes after a correct
 * answer. Intervals after Good: ~3d, 11d, 35d, 101d (capped at 180d).
 */
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
  type RecordLogItem,
  type State,
} from 'ts-fsrs'
import type { ReviewCardState } from './types'

const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    enable_fuzz: true,
    enable_short_term: false,
    maximum_interval: 180,
  })
)

export function toRating(correct: boolean): Grade {
  return correct ? Rating.Good : Rating.Again
}

export function newCard(key: string, courseSlug: string, lessonSlug: string, now: Date = new Date()): ReviewCardState {
  return serializeCard(createEmptyCard(now), key, courseSlug, lessonSlug)
}

export function reviewCard(
  state: ReviewCardState,
  correct: boolean,
  now: Date = new Date()
): { next: ReviewCardState; log: RecordLogItem } {
  const card = deserializeCard(state)
  const result = scheduler.next(card, now, toRating(correct))
  return { next: serializeCard(result.card, state.key, state.courseSlug, state.lessonSlug), log: result }
}

export function isDue(state: ReviewCardState, now: Date = new Date()): boolean {
  return new Date(state.due).getTime() <= now.getTime()
}

function serializeCard(card: Card, key: string, courseSlug: string, lessonSlug: string): ReviewCardState {
  return {
    key,
    courseSlug,
    lessonSlug,
    due: new Date(card.due).toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    lastReview: card.last_review ? new Date(card.last_review).toISOString() : null,
  }
}

function deserializeCard(state: ReviewCardState): Card {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsed_days,
    scheduled_days: state.scheduled_days,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state as State,
    last_review: state.lastReview ? new Date(state.lastReview) : null,
  } as unknown as Card
}
