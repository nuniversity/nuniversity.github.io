import { readJson, safeGetString, safeRemove, safeSet } from '@/lib/storage/safe-storage'

export type QuizAttemptMode = 'practice' | 'exam' | 'course-exam'

export interface QuizAttempt {
  date: string
  mode: QuizAttemptMode
  score: number
  total: number
  passed: boolean
  perDomain?: Record<string, { correct: number; total: number }>
}

export interface QuizBest {
  score: number
  total: number
  percent: number
  passed: boolean
  date: string
}

const HISTORY_PREFIX = 'v1:quizzes-history-'
const BEST_PREFIX = 'v1:quizzes-best-'
export const QUIZ_CERT_NAME_KEY = 'v1:quizzes-cert-name'
const HISTORY_LIMIT = 50
const MODES: QuizAttemptMode[] = ['practice', 'exam', 'course-exam']

export function quizHistoryKey(slug: string): string {
  return `${HISTORY_PREFIX}${slug}`
}

export function quizBestKey(slug: string): string {
  return `${BEST_PREFIX}${slug}`
}

export function attemptPercent(attempt: Pick<QuizAttempt, 'score' | 'total'>): number {
  if (!attempt.total) return 0
  return Math.round((attempt.score / attempt.total) * 100)
}

function sanitizeAttempt(raw: unknown): QuizAttempt | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (typeof value.date !== 'string') return null
  if (typeof value.score !== 'number' || typeof value.total !== 'number') return null
  if (!MODES.includes(value.mode as QuizAttemptMode)) return null
  const attempt: QuizAttempt = {
    date: value.date,
    mode: value.mode as QuizAttemptMode,
    score: value.score,
    total: value.total,
    passed: value.passed === true,
  }
  if (typeof value.perDomain === 'object' && value.perDomain !== null) {
    attempt.perDomain = value.perDomain as QuizAttempt['perDomain']
  }
  return attempt
}

export function getHistory(slug: string): QuizAttempt[] {
  const parsed = readJson<unknown[]>(quizHistoryKey(slug))
  if (!Array.isArray(parsed)) return []
  const attempts: QuizAttempt[] = []
  for (const entry of parsed) {
    const attempt = sanitizeAttempt(entry)
    if (attempt) attempts.push(attempt)
  }
  return attempts
}

export function getBest(slug: string): QuizBest | null {
  const parsed = readJson<unknown>(quizBestKey(slug))
  if (typeof parsed !== 'object' || parsed === null) return null
  const value = parsed as Record<string, unknown>
  if (typeof value.score !== 'number' || typeof value.total !== 'number') return null
  if (typeof value.date !== 'string') return null
  return {
    score: value.score,
    total: value.total,
    percent: attemptPercent({ score: value.score, total: value.total }),
    passed: value.passed === true,
    date: value.date,
  }
}

export function addAttempt(slug: string, attempt: QuizAttempt): QuizAttempt[] {
  const history = [attempt, ...getHistory(slug)].slice(0, HISTORY_LIMIT)
  safeSet(quizHistoryKey(slug), JSON.stringify(history))

  const percent = attemptPercent(attempt)
  const currentBest = getBest(slug)
  if (!currentBest || percent > currentBest.percent) {
    const best: QuizBest = {
      score: attempt.score,
      total: attempt.total,
      percent,
      passed: attempt.passed,
      date: attempt.date,
    }
    safeSet(quizBestKey(slug), JSON.stringify(best))
  }
  return history
}

export function clearHistory(slug: string): void {
  safeRemove(quizHistoryKey(slug))
  safeRemove(quizBestKey(slug))
}

/**
 * Maximum length of a stored certificate name.
 *
 * A display name has no legitimate use beyond this, and the bound prevents a
 * hand-edited storage entry from injecting an unbounded string into the page.
 */
export const CERT_NAME_MAX_LENGTH = 120

/**
 * Normalises a certificate name: trims whitespace, collapses internal runs of
 * whitespace, and enforces the length bound.
 */
export function normalizeCertName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, CERT_NAME_MAX_LENGTH)
}

/**
 * Reads the learner's saved certificate name.
 *
 * This is the only piece of personal data the platform stores. It never leaves
 * the browser — it is not transmitted to any server by the site.
 */
export function getCertName(): string {
  const raw = safeGetString(QUIZ_CERT_NAME_KEY, CERT_NAME_MAX_LENGTH)
  return raw ? normalizeCertName(raw) : ''
}

/**
 * Persists the learner's certificate name locally.
 * An empty value removes the stored entry entirely.
 */
export function setCertName(name: string): void {
  const normalized = normalizeCertName(name)
  if (normalized) safeSet(QUIZ_CERT_NAME_KEY, normalized)
  else safeRemove(QUIZ_CERT_NAME_KEY)
}

/**
 * Removes the stored certificate name from the browser.
 */
export function clearCertName(): void {
  safeRemove(QUIZ_CERT_NAME_KEY)
}
