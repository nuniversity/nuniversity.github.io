import { createSafeMap, isSafeKey, readJson, safeSet } from '@/lib/storage/safe-storage'

/**
 * Progress for the LanguageCourse app. One key per course:
 * `v1:language-course-progress-<course>`.
 */

export interface LessonProgress {
  completedAt: string
  bestPercent: number
  lastPercent: number
  attempts: number
}

export interface UnitProgress {
  lessons: Record<string, LessonProgress>
}

export interface LanguageCourseProgress {
  units: Record<string, UnitProgress>
  lastLesson?: { unit: string; lesson: string }
  startedAt: string
}

export interface LessonResult {
  progress: LanguageCourseProgress
  /** True when this call completed the lesson for the first time. */
  newlyCompleted: boolean
}

const PROGRESS_PREFIX = 'v1:language-course-progress-'
/** A lesson counts as mastered from this score; below it, "almost". */
export const LESSON_PASS_PERCENT = 80

export function courseProgressKey(courseId: string): string {
  return `${PROGRESS_PREFIX}${courseId}`
}

function sanitizePercent(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : 0
}

function sanitize(raw: unknown): LanguageCourseProgress | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  const units = createSafeMap<UnitProgress>()
  if (typeof value.units === 'object' && value.units !== null) {
    for (const [unitSlug, unitValue] of Object.entries(value.units as Record<string, unknown>)) {
      if (!isSafeKey(unitSlug) || typeof unitValue !== 'object' || unitValue === null) continue
      const lessons = createSafeMap<LessonProgress>()
      const rawLessons = (unitValue as Record<string, unknown>).lessons
      if (typeof rawLessons === 'object' && rawLessons !== null) {
        for (const [lessonSlug, lessonValue] of Object.entries(
          rawLessons as Record<string, unknown>
        )) {
          if (!isSafeKey(lessonSlug) || typeof lessonValue !== 'object' || lessonValue === null) continue
          const lesson = lessonValue as Record<string, unknown>
          lessons[lessonSlug] = {
            completedAt: typeof lesson.completedAt === 'string' ? lesson.completedAt : new Date().toISOString(),
            bestPercent: sanitizePercent(lesson.bestPercent),
            lastPercent: sanitizePercent(lesson.lastPercent),
            attempts: typeof lesson.attempts === 'number' && Number.isFinite(lesson.attempts)
              ? Math.max(1, Math.floor(lesson.attempts))
              : 1,
          }
        }
      }
      units[unitSlug] = { lessons }
    }
  }
  let lastLesson: LanguageCourseProgress['lastLesson']
  if (
    typeof value.lastLesson === 'object' &&
    value.lastLesson !== null &&
    isSafeKey(String((value.lastLesson as Record<string, unknown>).unit)) &&
    isSafeKey(String((value.lastLesson as Record<string, unknown>).lesson))
  ) {
    const last = value.lastLesson as Record<string, unknown>
    if (typeof last.unit === 'string' && typeof last.lesson === 'string') {
      lastLesson = { unit: last.unit, lesson: last.lesson }
    }
  }
  return {
    units,
    lastLesson,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : new Date().toISOString(),
  }
}

function emptyProgress(): LanguageCourseProgress {
  return { units: createSafeMap<UnitProgress>(), startedAt: new Date().toISOString() }
}

export function getCourseProgress(courseId: string): LanguageCourseProgress {
  return readJson<LanguageCourseProgress>(courseProgressKey(courseId), sanitize) ?? emptyProgress()
}

/** Records one lesson attempt. Best score is kept; completion is sticky. */
export function saveLessonResult(
  courseId: string,
  unitSlug: string,
  lessonSlug: string,
  percent: number
): LessonResult {
  const progress = getCourseProgress(courseId)
  const unit = progress.units[unitSlug] ?? { lessons: createSafeMap<LessonProgress>() }
  const existing = unit.lessons[lessonSlug]
  const clamped = sanitizePercent(percent)
  const newlyCompleted = !existing

  unit.lessons[lessonSlug] = {
    completedAt: existing?.completedAt ?? new Date().toISOString(),
    bestPercent: Math.max(existing?.bestPercent ?? 0, clamped),
    lastPercent: clamped,
    attempts: (existing?.attempts ?? 0) + 1,
  }
  progress.units[unitSlug] = unit
  progress.lastLesson = { unit: unitSlug, lesson: lessonSlug }
  safeSet(courseProgressKey(courseId), JSON.stringify(progress))
  return { progress, newlyCompleted }
}

export function updateLastLesson(
  courseId: string,
  unitSlug: string,
  lessonSlug: string
): void {
  const progress = getCourseProgress(courseId)
  progress.lastLesson = { unit: unitSlug, lesson: lessonSlug }
  safeSet(courseProgressKey(courseId), JSON.stringify(progress))
}

export function isLessonComplete(
  progress: LanguageCourseProgress,
  unitSlug: string,
  lessonSlug: string
): boolean {
  return progress.units[unitSlug]?.lessons[lessonSlug] !== undefined
}

/** Percent of a unit's lessons completed. */
export function unitPercent(
  progress: LanguageCourseProgress,
  unitSlug: string,
  totalLessons: number
): number {
  if (totalLessons <= 0) return 0
  const done = Object.keys(progress.units[unitSlug]?.lessons ?? {}).length
  return Math.min(100, Math.round((done / totalLessons) * 100))
}

/** Percent of the whole course completed, across all units. */
export function coursePercent(
  progress: LanguageCourseProgress,
  totalLessons: number
): number {
  if (totalLessons <= 0) return 0
  let done = 0
  for (const unit of Object.values(progress.units)) done += Object.keys(unit.lessons).length
  return Math.min(100, Math.round((done / totalLessons) * 100))
}
