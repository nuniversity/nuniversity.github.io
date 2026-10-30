export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import {
  getAllLanguageCourses,
  getLanguageCourse,
  getLanguageCourseSummary,
  getLesson,
} from '@/lib/language-courses/get-language-course'
import type { SkillArea } from '@/lib/language-courses/types'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CourseOverview } from '@/components/language-course/course-overview'
import type { PracticeLesson } from '@/components/language-course/practice-chooser'
import { buildAlternates } from '@/lib/seo/alternates'

interface CoursePageProps {
  params: Promise<{ lang: Locale; course: string }>
}

export async function generateStaticParams() {
  return getAllLanguageCourses().flatMap((course) =>
    [{ course: course.id }]
  )
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale; course: string }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const summary = getLanguageCourseSummary(params.course, params.lang)
  const name = summary ? summary.name[params.lang] || summary.name.en : params.course
  const description = summary
    ? summary.description[params.lang] || summary.description.en
    : 'Interactive language course.'
  return {
    alternates: buildAlternates(params.lang, `languages/courses/${params.course}`),
    title: name,
    description,
  }
}

export default async function LanguageCoursePage(props: CoursePageProps) {
  const params = await props.params;
  const { lang, course: courseId } = params
  const dict = await getDictionary(lang)

  const known = getAllLanguageCourses().some((course) => course.id === courseId)
  if (!known) notFound()

  const course = getLanguageCourse(courseId, lang)

  // Build the chooser index from the lesson steps at export time: unit/level
  // are the subject, and each lesson advertises the skills it actually trains.
  const practiceLessons: PracticeLesson[] = course.units.flatMap((unit) =>
    unit.lessons.map((entry) => {
      const lesson = getLesson(courseId, unit.slug, entry.slug, lang)
      const skills = Array.from(
        new Set(
          lesson.steps
            .map((step) => step.skill)
            .filter((skill): skill is SkillArea => Boolean(skill))
        )
      )
      return {
        unit: unit.slug,
        unitTitle: unit.title,
        cefr: unit.cefr,
        lesson: entry.slug,
        title: entry.title,
        goal: lesson.goal,
        skills,
      }
    })
  )

  return (
    <CourseOverview
      lang={lang}
      course={course}
      dict={dict}
      practiceLessons={practiceLessons}
    />
  )
}

export type { CoursePageProps }
