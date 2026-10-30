/**
 * Local-calendar date helpers.
 *
 * `toISOString().split('T')[0]` labels a Date with its **UTC** day. West of
 * UTC (the primary pt/es audience) an evening tap is stored under tomorrow and
 * a morning tap under yesterday, shifting every habit calendar and streak.
 * Everything here works in local time and uses sortable `YYYY-MM-DD` keys.
 */

/** Formats a date as a sortable local calendar key (`YYYY-MM-DD`). */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parses a `YYYY-MM-DD` key into local midnight. Returns null when invalid. */
export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Returns a new date moved by `days` (can be negative). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Whole calendar days from `fromKey` to `toKey` (positive when `to` is later). */
export function daysBetween(fromKey: string, toKey: string): number | null {
  const from = parseDateKey(fromKey)
  const to = parseDateKey(toKey)
  if (!from || !to) return null
  const ms = to.getTime() - from.getTime()
  return Math.round(ms / 86_400_000)
}

/** Whole days elapsed since a timestamp, using local calendar boundaries. */
export function daysSince(timestamp: number, now: Date = new Date()): number {
  const start = new Date(timestamp)
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) /
      86_400_000
  )
  return Math.max(0, days)
}

/** True for valid `YYYY-MM-DD` keys. */
export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && parseDateKey(value) !== null
}
