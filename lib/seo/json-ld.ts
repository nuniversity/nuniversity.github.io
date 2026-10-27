import type { Locale } from '@/lib/i18n/config'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_ORIGIN,
  SOCIAL_PROFILES,
} from './site'

/**
 * Structured-data builders.
 *
 * Every object is plain data; the `<JsonLd>` component serialises it safely.
 * Schema references:
 *  - Organization: https://schema.org/EducationalOrganization
 *  - Course: https://schema.org/Course
 *  - Lesson: https://schema.org/LearningResource
 *  - Breadcrumbs: https://schema.org/BreadcrumbList
 */

export interface JsonLdObject {
  '@context': 'https://schema.org'
  '@type': string | string[]
  [key: string]: unknown
}

/** Absolute URL for a site path. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString()
}

/** The publisher/organisation block reused by several schemas. */
function organisation() {
  return {
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icon.svg'),
    },
    sameAs: SOCIAL_PROFILES,
  }
}

/** Site-wide organisation schema. */
export function organizationSchema(description: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icon.svg'),
    },
    description,
    sameAs: SOCIAL_PROFILES,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'thenuniversitybr@gmail.com',
      availableLanguage: ['English', 'Portuguese', 'Spanish'],
    },
  }
}

/** A website schema, so search engines tie the pages to one entity. */
export function websiteSchema(lang: Locale): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    inLanguage: lang,
    publisher: organisation(),
  }
}

export interface CourseSchemaInput {
  title: string
  description: string
  url: string
  lang: Locale
  difficulty?: string
  duration?: string
  author?: string
  area?: string
  lessonTitles?: string[]
}

/** A course, plus its syllabus when the lesson titles are known. */
export function courseSchema(course: CourseSchemaInput): JsonLdObject {
  const schema: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    url: absoluteUrl(course.url),
    inLanguage: course.lang,
    provider: organisation(),
    isAccessibleForFree: true,
    educationalLevel: course.difficulty,
    about: course.area,
    author: course.author
      ? { '@type': 'Organization', name: course.author }
      : undefined,
  }

  if (course.lessonTitles && course.lessonTitles.length > 0) {
    schema.hasPart = course.lessonTitles.slice(0, 60).map(title => ({
      '@type': 'LearningResource',
      name: title,
    }))
  }

  if (course.duration) {
    // Schema expects an ISO-8601 duration; only emit it when we can derive one.
    const iso = toIsoDuration(course.duration)
    if (iso) schema.timeRequired = iso
  }

  return stripUndefined(schema)
}

export interface LessonSchemaInput {
  title: string
  description: string
  url: string
  lang: Locale
  courseTitle?: string
  courseUrl?: string
  position?: number
  duration?: string
}

/** A single lesson as a `LearningResource`. */
export function lessonSchema(lesson: LessonSchemaInput): JsonLdObject {
  const schema: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: lesson.title,
    description: lesson.description,
    url: absoluteUrl(lesson.url),
    inLanguage: lesson.lang,
    learningResourceType: 'Lesson',
    isAccessibleForFree: true,
    publisher: organisation(),
    isPartOf: lesson.courseTitle
      ? {
          '@type': 'Course',
          name: lesson.courseTitle,
          url: lesson.courseUrl ? absoluteUrl(lesson.courseUrl) : undefined,
        }
      : undefined,
    position: lesson.position,
  }

  if (lesson.duration) {
    const iso = toIsoDuration(lesson.duration)
    if (iso) schema.timeRequired = iso
  }

  return stripUndefined(schema)
}

export interface QuizSchemaInput {
  title: string
  description: string
  url: string
  lang: Locale
  questionCount?: number
  durationSeconds?: number
}

/** A certification quiz. */
export function quizSchema(quiz: QuizSchemaInput): JsonLdObject {
  const schema: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quiz.title,
    description: quiz.description,
    url: absoluteUrl(quiz.url),
    inLanguage: quiz.lang,
    educationalLevel: 'Professional',
    numberOfQuestions: quiz.questionCount,
    isAccessibleForFree: true,
    provider: organisation(),
  }
  if (quiz.durationSeconds) {
    schema.timeRequired = `PT${Math.round(quiz.durationSeconds / 60)}M`
  }
  return stripUndefined(schema)
}

export interface BreadcrumbEntry {
  name: string
  url: string
}

/** A breadcrumb trail matching the visible breadcrumb. */
export function breadcrumbSchema(entries: BreadcrumbEntry[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.url),
    })),
  }
}

/**
 * Converts the human-readable durations used in `course.json`
 * ("4 Weeks", "90 minutes", "12 weeks") into an ISO-8601 duration.
 * Returns `null` when the value cannot be interpreted.
 */
export function toIsoDuration(value: string): string | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(minute|min|hour|hr|day|week|month|year)s?\s*$/i.exec(value)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount) || amount <= 0) return null
  const unit = match[2].toLowerCase()
  switch (unit) {
    case 'minute':
    case 'min':
      return `PT${Math.round(amount)}M`
    case 'hour':
    case 'hr':
      return `PT${Math.round(amount)}H`
    case 'day':
      return `P${Math.round(amount)}D`
    case 'week':
      return `P${Math.round(amount * 7)}D`
    case 'month':
      return `P${Math.round(amount)}M`
    case 'year':
      return `P${Math.round(amount)}Y`
    default:
      return null
  }
}

/** Removes `undefined` values so the emitted JSON stays clean. */
function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) delete value[key]
  }
  return value
}
