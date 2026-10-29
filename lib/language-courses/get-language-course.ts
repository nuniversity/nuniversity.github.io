import 'server-only'

import fs from 'fs'
import path from 'path'

import type {
  LanguageCourseMeta,
  LanguageLesson,
  LocalizedText,
  UnitManifest,
  VocabItem,
} from './types'

/**
 * Build-time content loader for language courses. Reads, for each course id:
 *
 *   content/language-courses/<id>/course.json
 *   content/language-courses/<id>/vocab.json
 *   content/language-courses/<id>/units/<unit>/lessons/<lesson>.json
 *
 * Unlike the Languages app loader (which swallows errors), malformed course
 * files throw: a broken course must fail the build, not silently vanish.
 */

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'language-courses')

export interface LanguageCourseSummary {
  id: string
  name: LocalizedText
  description: LocalizedText
  source: string
  target: string
  cefrTarget: LanguageCourseMeta['cefrTarget']
  difficulty: LanguageCourseMeta['difficulty']
  emoji?: string
  flags?: { source: string; target: string }
  unitCount: number
  lessonCount: number
  vocabCount: number
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

function localized(value: LocalizedText | undefined, locale: string): string {
  if (!value) return ''
  const key = (['en', 'pt', 'es'] as const).includes(locale as 'en' | 'pt' | 'es')
    ? (locale as 'en' | 'pt' | 'es')
    : 'en'
  return value[key] ?? value.en ?? ''
}

/** Applies `locales[locale]` overrides for name/description. */
function applyCourseLocales(
  course: LanguageCourseMeta,
  locale: string
): LanguageCourseMeta {
  const override = course.locales?.[locale]
  if (!override) return course
  return {
    ...course,
    name: { ...course.name, ...(override.name ? { [locale]: override.name } : {}) },
    description: {
      ...course.description,
      ...(override.description ? { [locale]: override.description } : {}),
    },
  }
}

/** Applies `locales[locale]` overrides for lesson title/goal. */
export function localizeLesson(lesson: LanguageLesson, locale: string): LanguageLesson {
  const override = lesson.locales?.[locale]
  if (!override) return lesson
  return {
    ...lesson,
    title: { ...lesson.title, ...(override.title ? { [locale]: override.title } : {}) },
    goal: { ...lesson.goal, ...(override.goal ? { [locale]: override.goal } : {}) },
  }
}

export function getCourseDir(courseId: string): string {
  return path.join(CONTENT_ROOT, courseId)
}

export function getLanguageCourse(courseId: string, locale: string = 'en'): LanguageCourseMeta {
  const course = readJsonFile<LanguageCourseMeta>(
    path.join(getCourseDir(courseId), 'course.json')
  )
  if (!course?.id || !Array.isArray(course.units)) {
    throw new Error(`Invalid course manifest for ${courseId}`)
  }
  return applyCourseLocales(course, locale)
}

export function getCourseVocab(courseId: string): VocabItem[] {
  const vocabPath = path.join(getCourseDir(courseId), 'vocab.json')
  if (!fs.existsSync(vocabPath)) return []
  const items = readJsonFile<VocabItem[]>(vocabPath)
  return Array.isArray(items) ? items : []
}

/** Unit manifest from course.json (localized title/description only). */
export function getUnit(courseId: string, unitSlug: string, locale: string = 'en'): UnitManifest | null {
  const course = getLanguageCourse(courseId, locale)
  return course.units.find((unit) => unit.slug === unitSlug) ?? null
}

function lessonFilePath(courseId: string, unitSlug: string, lessonSlug: string): string {
  const fileSlug = resolveLessonFileSlug(courseId, unitSlug, lessonSlug)
  if (!fileSlug) {
    throw new Error(`Lesson ${lessonSlug} not found in ${courseId}/${unitSlug}`)
  }
  return path.join(CONTENT_ROOT, courseId, 'units', unitSlug, 'lessons', `${fileSlug}.json`)
}

export function getLesson(
  courseId: string,
  unitSlug: string,
  lessonSlug: string,
  locale: string = 'en'
): LanguageLesson {
  const lesson = readJsonFile<LanguageLesson>(
    lessonFilePath(courseId, unitSlug, lessonSlug)
  )
  return localizeLesson(lesson, locale)
}

/** All lesson slugs of a unit, sorted by the zero-padded file name. */
export function listUnitLessons(courseId: string, unitSlug: string): string[] {
  const dir = path.join(CONTENT_ROOT, courseId, 'units', unitSlug, 'lessons')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => parseLessonFileName(file))
}

/** `01-greetings-1.json` → `greetings-1` (files are zero-padded, slugs are clean). */
export function parseLessonFileName(file: string): string {
  return file.replace(/\.json$/, '').replace(/^\d{2}-/, '')
}

/** Resolves a clean slug to its zero-padded file stem on disk. */
export function resolveLessonFileSlug(courseId: string, unitSlug: string, lessonSlug: string): string | null {
  const dir = path.join(CONTENT_ROOT, courseId, 'units', unitSlug, 'lessons')
  if (!fs.existsSync(dir)) return null
  const match = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .find((file) => parseLessonFileName(file) === lessonSlug)
  return match ? match.replace(/\.json$/, '') : null
}

/** Every unit directory, ordered by course.json. */
export function listUnitSlugs(courseId: string): string[] {
  const course = getLanguageCourse(courseId)
  return course.units.map((unit) => unit.slug)
}

export function getAllLanguageCourses(locale: string = 'en'): LanguageCourseSummary[] {
  if (!fs.existsSync(CONTENT_ROOT)) return []
  const summaries: LanguageCourseSummary[] = []
  for (const entry of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    try {
      const course = getLanguageCourse(entry.name, locale)
      const lessonCount = course.units.reduce(
        (sum, unit) => sum + listUnitLessons(course.id, unit.slug).length,
        0
      )
      summaries.push({
        id: course.id,
        name: course.name,
        description: course.description,
        source: course.source,
        target: course.target,
        cefrTarget: course.cefrTarget,
        difficulty: course.difficulty,
        emoji: course.emoji,
        flags: course.flags,
        unitCount: course.units.length,
        lessonCount,
        vocabCount: getCourseVocab(course.id).length,
      })
    } catch (error) {
      console.error(`[language-courses] Failed to load ${entry.name}:`, error)
    }
  }
  return summaries.sort((a, b) => a.id.localeCompare(b.id))
}

export function getLanguageCourseSummary(
  courseId: string,
  locale: string = 'en'
): LanguageCourseSummary | null {
  try {
    const course = getLanguageCourse(courseId, locale)
    const lessonCount = course.units.reduce(
      (sum, unit) => sum + listUnitLessons(course.id, unit.slug).length,
      0
    )
    return {
      id: course.id,
      name: course.name,
      description: course.description,
      source: course.source,
      target: course.target,
      cefrTarget: course.cefrTarget,
      difficulty: course.difficulty,
      emoji: course.emoji,
      flags: course.flags,
      unitCount: course.units.length,
      lessonCount,
      vocabCount: getCourseVocab(course.id).length,
    }
  } catch {
    return null
  }
}

/** Static-route enumeration: courseId × unitSlug × lessonSlug. */
export function listAllLessonRoutes(): Array<{
  courseId: string
  unitSlug: string
  lessonSlug: string
}> {
  const routes: Array<{ courseId: string; unitSlug: string; lessonSlug: string }> = []
  if (!fs.existsSync(CONTENT_ROOT)) return routes
  for (const course of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
    if (!course.isDirectory()) continue
    for (const unitSlug of listUnitSlugs(course.name)) {
      for (const lessonSlug of listUnitLessons(course.name, unitSlug)) {
        routes.push({ courseId: course.name, unitSlug, lessonSlug })
      }
    }
  }
  return routes
}
