/**
 * Pure regex evaluation engine.
 *
 * Runs in the main thread (fallback) and inside `regex.worker.ts`, so the
 * component only orchestrates. Fixes:
 *  - zero-length matches advance `lastIndex` instead of aborting the loop, so
 *    counts agree with `String.prototype.matchAll`;
 *  - an empty replacement is valid (previously the output was hidden);
 *  - the replacement pass builds a fresh RegExp so it cannot inherit a stale
 *    `lastIndex` from the match loop.
 */

export interface RegexMatch {
  full: string
  groups: string[]
  index: number
}

export interface RegexRequest {
  pattern: string
  flags: string
  testString: string
  replacement: string
  showReplace: boolean
  maxMatches?: number
}

export interface RegexEvaluation {
  valid: boolean
  matches: RegexMatch[]
  matchCount: number
  totalLength: number
  replaced: string | null
  error: string | null
  truncated: boolean
}

const DEFAULT_MAX_MATCHES = 500

export function evaluateRegex(request: RegexRequest): RegexEvaluation {
  const {
    pattern,
    flags,
    testString,
    replacement,
    showReplace,
    maxMatches = DEFAULT_MAX_MATCHES,
  } = request

  try {
    const regex = new RegExp(pattern, flags)
    const isGlobal = flags.includes('g')
    const matches: RegexMatch[] = []
    let truncated = false

    if (isGlobal) {
      let match: RegExpExecArray | null
      while ((match = regex.exec(testString)) !== null) {
        matches.push({ full: match[0], groups: match.slice(1), index: match.index })
        if (matches.length >= maxMatches) {
          truncated = true
          break
        }
        // A zero-length match never advances lastIndex on exec; advance
        // manually (code-point aware under the `u` flag) so we make progress
        // and report every position, matching matchAll semantics.
        if (match[0].length === 0) {
          if (flags.includes('u')) {
            const codePoint = testString.codePointAt(regex.lastIndex)
            regex.lastIndex += codePoint !== undefined && codePoint > 0xffff ? 2 : 1
          } else {
            regex.lastIndex += 1
          }
        }
      }
    } else {
      const match = regex.exec(testString)
      if (match) {
        matches.push({ full: match[0], groups: match.slice(1), index: match.index })
      }
    }

    let replaced: string | null = null
    if (showReplace) {
      const replaceRegex = new RegExp(pattern, flags)
      replaced = testString.replace(replaceRegex, replacement)
    }

    const totalLength = matches.reduce((sum, match) => sum + match.full.length, 0)

    return {
      valid: true,
      matches,
      matchCount: matches.length,
      totalLength,
      replaced,
      error: null,
      truncated,
    }
  } catch (error) {
    return {
      valid: false,
      matches: [],
      matchCount: 0,
      totalLength: 0,
      replaced: null,
      error: error instanceof Error ? error.message : String(error),
      truncated: false,
    }
  }
}

/** Splits text into highlighted/normal segments for rendering. */
export function highlightMatches(
  text: string,
  matches: Array<{ full: string; index: number }>
): Array<{ text: string; isMatch: boolean }> {
  if (matches.length === 0) return text ? [{ text, isMatch: false }] : []
  const segments: Array<{ text: string; isMatch: boolean }> = []
  let cursor = 0

  for (const match of matches) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), isMatch: false })
    }
    if (match.full.length > 0) {
      segments.push({ text: match.full, isMatch: true })
    }
    cursor = Math.max(cursor, match.index + match.full.length)
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false })
  }

  return segments
}
