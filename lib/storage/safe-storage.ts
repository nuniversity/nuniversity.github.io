/**
 * Shared, defensive browser-storage helpers.
 *
 * Every read/write in the application goes through this module so that:
 *  - Storage access never throws (private mode, disabled cookies, quota exhaustion).
 *  - Corrupt JSON is purged rather than re-parsed on every render.
 *  - Stored values are shape-validated by the caller, so a hand-edited or
 *    stale `localStorage` entry can never crash a render.
 *  - Object maps are created without a prototype, so a `__proto__` key in
 *    stored JSON cannot manipulate an object's prototype chain.
 */

/** Keys that must never be copied into a plain object as own properties. */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * True when the given object owns the key as a plain data property.
 * Used to reject prototype-polluting keys before assignment.
 */
export function isSafeKey(key: string): boolean {
  return !FORBIDDEN_KEYS.has(key)
}

/**
 * Creates a prototype-less map. Safe for arbitrary, attacker-controlled keys.
 */
export function createSafeMap<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>
}

/**
 * Reads a raw string from `localStorage`.
 * Returns `null` when storage is unavailable (SSR, private mode, blocked cookies).
 */
export function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Writes a raw string to `localStorage`. Silently no-ops when unavailable.
 */
export function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

/**
 * Removes a key from `localStorage`. Silently no-ops when unavailable.
 */
export function safeRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}

/**
 * Reads and parses JSON from `localStorage`.
 *
 * On a parse failure the corrupt entry is removed so the next read starts clean.
 *
 * @param key    Storage key.
 * @param parse  Optional validator. Returning `null`/`undefined` discards the
 *               value and removes the key, so malformed data cannot reach a render.
 */
export function readJson<T>(key: string): T | null
export function readJson<T>(key: string, parse: (raw: unknown) => T | null | undefined): T | null
export function readJson<T>(
  key: string,
  parse?: (raw: unknown) => T | null | undefined
): T | null {
  const raw = safeGet(key)
  if (raw === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    safeRemove(key)
    return null
  }
  if (!parse) return parsed as T
  const result = parse(parsed)
  if (result === null || result === undefined) {
    safeRemove(key)
    return null
  }
  return result
}

/**
 * Reads, parses and writes back a JSON value in one step.
 */
export function writeJson(key: string, value: unknown): void {
  try {
    safeSet(key, JSON.stringify(value))
  } catch {
    return
  }
}

/**
 * Reads a plain (non-JSON) string value and validates it.
 *
 * @param maxLength  Truncates the value defensively so a hand-edited storage
 *                   entry cannot inject an unbounded string into the DOM.
 */
export function safeGetString(key: string, maxLength?: number): string | null {
  const raw = safeGet(key)
  if (raw === null) return null
  if (maxLength === undefined) return raw
  return raw.length > maxLength ? raw.slice(0, maxLength) : raw
}
