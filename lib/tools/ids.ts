/**
 * Collision-free numeric ids for tool records.
 *
 * `Date.now()` alone repeats when two records are created in the same
 * millisecond (holding Enter in an input is enough), which produced duplicate
 * React keys and made "delete" remove two rows at once. A process-local
 * counter disambiguates records created within the same millisecond while
 * keeping the numeric shape existing localStorage payloads expect.
 */
let lastId = 0

export function createId(): number {
  const now = Date.now()
  lastId = now > lastId ? now : lastId + 1
  return lastId
}

/** True when `value` looks like an id produced by `createId` or legacy `Date.now`. */
export function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
