export interface CodeTestConfig {
  name: string
  call: string
  expected: unknown
}

export interface CodeTestResult {
  name: string
  passed: boolean
  actual?: unknown
  error?: string
}

/** Names that must never appear in authored exercise code (defence in depth). */
const FORBIDDEN_API = /\b(fetch|XMLHttpRequest|WebSocket|importScripts|eval|Function)\s*\(/

/** Author-time guard used by the validator and the client before sending code. */
export function containsForbiddenApi(source: string): boolean {
  return FORBIDDEN_API.test(source)
}

/** One-shot cache-busting nonce per run. */
export function newNonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
