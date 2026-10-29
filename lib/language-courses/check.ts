/**
 * Pure answer-checking helpers for language exercises. No DOM, no storage:
 * everything here is unit-testable and shared by dictation, build and
 * word-bank comparison logic.
 */

/** Lowercase, strip punctuation/diacritics-agnostic spacing for comparison. */
export function normalizeAnswer(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,!?;:'"“”„«»()\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Classic Levenshtein distance with a single row buffer. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current: number[] = [i]
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution)
    }
    previous = current
  }
  return previous[b.length]
}

export type DictationVerdict = 'correct' | 'almost' | 'wrong'

/**
 * Grades typed dictation. One typo per ~12 characters still counts as
 * "almost": language learners typing on foreign keyboards make small slips,
 * and the goal is retrieval practice, not typing perfection.
 */
export function checkDictation(expected: string, typed: string): DictationVerdict {
  const a = normalizeAnswer(expected)
  const b = normalizeAnswer(typed)
  if (a.length === 0) return b.length === 0 ? 'correct' : 'wrong'
  const distance = levenshtein(a, b)
  if (distance === 0) return 'correct'
  const tolerance = Math.max(1, Math.ceil(a.length / 12))
  return distance <= tolerance ? 'almost' : 'wrong'
}

/** Compares two token sequences (word-bank assembly), case/punctuation-insensitive. */
export function sameTokenSequence(expected: string[], actual: string[]): boolean {
  if (expected.length !== actual.length) return false
  return expected.every(
    (word, index) => normalizeAnswer(word) === normalizeAnswer(actual[index])
  )
}

/** Shuffles a copy of an array (Fisher-Yates) without mutating the input. */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
