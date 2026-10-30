/**
 * Pomodoro phase rules.
 *
 * Long breaks land after every fourth **completed** work session (4, 8, 12…).
 * The previous inline check evaluated `sessionCount % 4` against the value
 * from *before* the increment, so the long break fired after sessions 5, 9…
 */
export const SESSIONS_PER_CYCLE = 4

/** True when the break that follows `completedSessions` work sessions is long. */
export function isLongBreakDue(completedSessions: number): boolean {
  return completedSessions > 0 && completedSessions % SESSIONS_PER_CYCLE === 0
}

/** Duration in minutes of the break after `completedSessions` work sessions. */
export function breakMinutesFor(
  completedSessions: number,
  shortMinutes: number,
  longMinutes: number
): number {
  return isLongBreakDue(completedSessions) ? longMinutes : shortMinutes
}

/** Dots filled in the current four-session cycle. */
export function cycleProgress(completedSessions: number): number {
  return ((completedSessions % SESSIONS_PER_CYCLE) + SESSIONS_PER_CYCLE) % SESSIONS_PER_CYCLE
}
