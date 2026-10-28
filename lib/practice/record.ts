import { isSafeKey, readJson, writeJson } from '@/lib/storage/safe-storage'
import type { PracticeAnswerRecord, PracticeAnswerStore } from './types'

export const PRACTICE_PREFIX = 'v1:practice-answers-'

export function practiceKey(courseSlug: string): string {
  return `${PRACTICE_PREFIX}${courseSlug}`
}

/**
 * Deterministic short key (djb2, base36). Used when a widget has no authored
 * id, so the same question maps to the same record across sessions.
 */
export function hashKey(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0
  }
  return `h-${(h >>> 0).toString(36)}`
}

/**
 * Globally unique practice key. Authored ids are unique per course only, so the
 * course slug prefix prevents collisions across the 49 courses.
 */
export function stablePracticeKey(
  courseSlug: string,
  authoredId: string | undefined,
  lessonSlug: string,
  label: string
): string {
  const base = authoredId && authoredId.trim() !== '' ? authoredId.trim() : hashKey(`${lessonSlug}::${label}`)
  return `${courseSlug}::${base}`
}

/** Beta posterior mean with a uniform prior. Shrinks small samples naturally. */
export function betaMastery(correct: number, attempts: number): number {
  const a = Math.max(0, Math.floor(attempts))
  const c = Math.min(a, Math.max(0, Math.floor(correct)))
  return (c + 1) / (a + 2)
}

function emptyStore(): PracticeAnswerStore {
  return { version: 2, updatedAt: new Date().toISOString(), answers: Object.create(null) }
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function sanitizeRecord(raw: unknown): PracticeAnswerRecord | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (typeof value.key !== 'string' || typeof value.lessonSlug !== 'string') return null
  const attempts = Math.max(1, Math.floor(finite(value.attempts, 1)))
  const correct = Math.min(attempts, Math.max(0, Math.floor(finite(value.correct, 0))))
  return {
    key: value.key,
    lessonSlug: value.lessonSlug,
    label: typeof value.label === 'string' ? value.label : '',
    skill: typeof value.skill === 'string' ? value.skill : null,
    attempts,
    correct,
    mastery: Math.min(1, Math.max(0, finite(value.mastery, betaMastery(correct, attempts)))),
    lastCorrect: value.lastCorrect === true,
    lastAnsweredAt: typeof value.lastAnsweredAt === 'string' ? value.lastAnsweredAt : new Date().toISOString(),
  }
}

function sanitizeStore(raw: unknown): PracticeAnswerStore | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (value.version !== 2 || typeof value.answers !== 'object' || value.answers === null) return null
  const answers: Record<string, PracticeAnswerRecord> = Object.create(null)
  for (const [k, v] of Object.entries(value.answers as Record<string, unknown>)) {
    if (!isSafeKey(k)) continue
    const record = sanitizeRecord(v)
    if (record) answers[k] = record
  }
  return {
    version: 2,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    answers,
  }
}

export function getPracticeStore(courseSlug: string): PracticeAnswerStore {
  return readJson<PracticeAnswerStore>(practiceKey(courseSlug), sanitizeStore) ?? emptyStore()
}

function saveStore(store: PracticeAnswerStore, courseSlug: string): void {
  store.updatedAt = new Date().toISOString()
  writeJson(practiceKey(courseSlug), store)
}

export interface RecordAnswerInput {
  key: string
  label: string
  skill?: string | null
  correct: boolean
}

/**
 * Records one answer event and recomputes the Beta mastery estimate.
 * The estimate is derived from counts, never incremented, so retries and
 * corrupt writes cannot drift it.
 */
export function recordPracticeAnswer(
  courseSlug: string,
  lessonSlug: string,
  input: RecordAnswerInput
): PracticeAnswerRecord {
  const store = getPracticeStore(courseSlug)
  const existing = store.answers[input.key]
  const attempts = (existing?.attempts ?? 0) + 1
  const correct = (existing?.correct ?? 0) + (input.correct ? 1 : 0)

  const record: PracticeAnswerRecord = {
    key: input.key,
    lessonSlug,
    label: input.label,
    skill: input.skill ?? existing?.skill ?? null,
    attempts,
    correct,
    mastery: betaMastery(correct, attempts),
    lastCorrect: input.correct,
    lastAnsweredAt: new Date().toISOString(),
  }

  store.answers[input.key] = record
  saveStore(store, courseSlug)
  return record
}

/** Mean mastery across a lesson's answered records, or null when none exist. */
export function lessonMastery(store: PracticeAnswerStore, lessonSlug: string): number | null {
  const records = Object.values(store.answers).filter((r) => r.lessonSlug === lessonSlug)
  if (records.length === 0) return null
  return records.reduce((sum, r) => sum + r.mastery, 0) / records.length
}

/** Slugs of courses that have at least one recorded practice answer. */
export function listCoursesWithPractice(): string[] {
  if (typeof window === 'undefined') return []
  const slugs: string[] = []
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(PRACTICE_PREFIX)) {
        slugs.push(k.slice(PRACTICE_PREFIX.length))
      }
    }
  } catch {
    return []
  }
  return slugs
}
