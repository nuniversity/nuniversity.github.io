import { daysBetween, isDateKey, localDateKey } from './date'

/**
 * Consecutive-day streak for a set of completed dates.
 *
 * A streak survives when the most recent completion is today **or yesterday**:
 * a user who has not studied yet this morning still sees yesterday's streak.
 * The previous implementations disagreed on this point (and on UTC vs local
 * days), so both the habit tracker and the Pomodoro stats share this one.
 *
 * @param dates   Any iterable of `YYYY-MM-DD` keys (duplicates are ignored).
 * @param today   Local "today" key; injectable for deterministic tests.
 */
export function calculateStreak(
  dates: Iterable<string>,
  today: string = localDateKey()
): number {
  const unique = Array.from(new Set(Array.from(dates).filter(isDateKey))).sort().reverse()
  if (unique.length === 0) return 0

  const firstGap = daysBetween(unique[0], today)
  if (firstGap === null || firstGap > 1) return 0

  let streak = 1
  for (let i = 1; i < unique.length; i += 1) {
    const gap = daysBetween(unique[i], unique[i - 1])
    if (gap === 1) streak += 1
    else if (gap === 0) continue
    else break
  }
  return streak
}
