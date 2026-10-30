/**
 * SM-2 spaced-repetition scheduler.
 *
 * Fixes three defects in the previous inline implementation:
 *  - ease is only adjusted on successful recalls (quality >= 3), matching
 *    SM-2; failures reset the interval but no longer permanently punish ease;
 *  - the ease factor is clamped to the standard 1.3–3.0 range;
 *  - interval growth uses the *current* ease factor (SM-2) and is capped.
 */

export interface CardSchedule {
  ease: number
  interval: number
  repetitions: number
  nextReview: number
  lastReviewed: number | null
}

export interface ReviewOutcome extends CardSchedule {
  /** True when the card should be revisited in this same session. */
  relearn: boolean
}

export const MIN_EASE = 1.3
export const MAX_EASE = 3.0
export const DEFAULT_EASE = 2.5
const MAX_INTERVAL_DAYS = 3650
const DAY_MS = 86_400_000

/** Applies one SM-2 review to a card. `quality` is 0–5. */
export function reviewCard(
  card: CardSchedule,
  quality: number,
  now = Date.now()
): ReviewOutcome {
  const q = Math.max(0, Math.min(5, Math.round(quality)))
  let { ease, interval, repetitions } = card

  if (q >= 3) {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else interval = Math.min(MAX_INTERVAL_DAYS, Math.round(interval * ease))
    repetitions += 1
    ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  } else {
    repetitions = 0
    interval = 0
  }

  ease = Math.max(MIN_EASE, Math.min(MAX_EASE, Number(ease.toFixed(2))))

  return {
    ease,
    interval,
    repetitions,
    nextReview: q >= 3 ? now + interval * DAY_MS : now,
    lastReviewed: now,
    relearn: q < 3,
  }
}

/** True when a card is due for review. New cards (no repetitions) count as due. */
export function isCardDue(card: CardSchedule, now = Date.now()): boolean {
  return card.repetitions === 0 || card.nextReview <= now
}
