export interface CourseProgress {
  courseSlug: string
  completed: string[]
  lastLesson: string | null
  startedAt: string
  lastVisitedAt: string
}

export interface LastVisited {
  courseSlug: string
  lessonSlug: string
  courseTitle: string
  lessonTitle: string
  lang: string
  at: string
}

const PROGRESS_PREFIX = 'v1:course-progress-'
export const LAST_VISITED_KEY = 'v1:last-visited'

export function courseProgressKey(courseSlug: string): string {
  return `${PROGRESS_PREFIX}${courseSlug}`
}

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

function readJson(key: string): unknown {
  const raw = safeGet(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    safeRemove(key)
    return null
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    return
  }
}

function sanitizeProgress(courseSlug: string, raw: unknown): CourseProgress | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>
  if (!Array.isArray(value.completed)) return null
  const completed = value.completed.filter((s): s is string => typeof s === 'string')
  return {
    courseSlug,
    completed,
    lastLesson: typeof value.lastLesson === 'string' ? value.lastLesson : null,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : new Date().toISOString(),
    lastVisitedAt: typeof value.lastVisitedAt === 'string' ? value.lastVisitedAt : new Date().toISOString(),
  }
}

export function getCourseProgress(courseSlug: string): CourseProgress | null {
  const parsed = readJson(courseProgressKey(courseSlug))
  if (parsed === null) return null
  return sanitizeProgress(courseSlug, parsed)
}

function saveCourseProgress(progress: CourseProgress): void {
  safeSet(courseProgressKey(progress.courseSlug), JSON.stringify(progress))
}

export function recordVisit(
  courseSlug: string,
  lessonSlug: string,
  meta: { courseTitle: string; lessonTitle: string; lang: string }
): CourseProgress {
  const now = new Date().toISOString()
  const existing = getCourseProgress(courseSlug) ?? {
    courseSlug,
    completed: [],
    lastLesson: lessonSlug,
    startedAt: now,
    lastVisitedAt: now,
  }
  existing.lastLesson = lessonSlug
  existing.lastVisitedAt = now
  saveCourseProgress(existing)

  const pointer: LastVisited = {
    courseSlug,
    lessonSlug,
    courseTitle: meta.courseTitle,
    lessonTitle: meta.lessonTitle,
    lang: meta.lang,
    at: now,
  }
  safeSet(LAST_VISITED_KEY, JSON.stringify(pointer))
  return existing
}

export function getLastVisited(): LastVisited | null {
  const parsed = readJson(LAST_VISITED_KEY)
  if (typeof parsed !== 'object' || parsed === null) return null
  const value = parsed as Record<string, unknown>
  if (typeof value.courseSlug !== 'string' || typeof value.lessonSlug !== 'string') return null
  return {
    courseSlug: value.courseSlug,
    lessonSlug: value.lessonSlug,
    courseTitle: typeof value.courseTitle === 'string' ? value.courseTitle : '',
    lessonTitle: typeof value.lessonTitle === 'string' ? value.lessonTitle : '',
    lang: typeof value.lang === 'string' ? value.lang : '',
    at: typeof value.at === 'string' ? value.at : '',
  }
}

export function setLastLesson(courseSlug: string, lessonSlug: string): CourseProgress | null {
  const progress = getCourseProgress(courseSlug)
  if (!progress) return null
  progress.lastLesson = lessonSlug
  progress.lastVisitedAt = new Date().toISOString()
  saveCourseProgress(progress)
  return progress
}

export function markLessonComplete(courseSlug: string, lessonSlug: string): { progress: CourseProgress; newlyCompleted: boolean } {
  const now = new Date().toISOString()
  const progress = getCourseProgress(courseSlug) ?? {
    courseSlug,
    completed: [],
    lastLesson: lessonSlug,
    startedAt: now,
    lastVisitedAt: now,
  }
  const newlyCompleted = !progress.completed.includes(lessonSlug)
  if (newlyCompleted) progress.completed = [...progress.completed, lessonSlug]
  progress.lastVisitedAt = now
  saveCourseProgress(progress)
  return { progress, newlyCompleted }
}

export function markLessonIncomplete(courseSlug: string, lessonSlug: string): CourseProgress | null {
  const progress = getCourseProgress(courseSlug)
  if (!progress) return null
  progress.completed = progress.completed.filter((s) => s !== lessonSlug)
  progress.lastVisitedAt = new Date().toISOString()
  saveCourseProgress(progress)
  return progress
}

export function isLessonComplete(courseSlug: string, lessonSlug: string): boolean {
  return getCourseProgress(courseSlug)?.completed.includes(lessonSlug) === true
}

export function coursePercent(progress: CourseProgress | null, totalLessons: number): number {
  if (!progress || totalLessons <= 0) return 0
  return Math.min(100, Math.round((progress.completed.length / totalLessons) * 100))
}

export function isCourseComplete(progress: CourseProgress | null, totalLessons: number): boolean {
  return totalLessons > 0 && progress !== null && progress.completed.length >= totalLessons
}
