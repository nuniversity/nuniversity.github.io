import { getAllCourses } from '@/lib/courses/get-course-content'
import type { Locale } from '@/lib/i18n/config'
import type { LibraryResource } from './types'

/**
 * Projects the courses app catalog into library resources.
 *
 * The courses app remains the single source of truth: nothing is duplicated
 * into `content/library`, so a new course shows up in the library automatically
 * and edits to `course.json` flow through on the next build.
 *
 * Course pages are internal routes, which the library card renders as an
 * in-app link instead of an external one.
 */
export async function getCourseResources(lang: Locale): Promise<LibraryResource[]> {
  const courses = await getAllCourses(lang)

  return courses.map((course) => ({
    id: course.slug,
    title: course.title,
    description: course.description,
    type: 'course',
    category: course.area || 'Uncategorized',
    author: course.author || 'Nuniversity',
    url: `/${lang}/courses/${course.slug}/`,
    difficulty: course.difficulty,
    duration: course.duration,
    tags: course.area ? [course.area] : [],
    language: lang,
    isPaid: false,
    platform: 'Nuniversity',
  }))
}
