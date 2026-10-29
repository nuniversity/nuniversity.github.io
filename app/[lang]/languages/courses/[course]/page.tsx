export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import {
  getAllLanguageCourses,
  getLanguageCourse,
  getLanguageCourseSummary,
} from '@/lib/language-courses/get-language-course'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CourseOverview } from '@/components/language-course/course-overview'
import { buildAlternates } from '@/lib/seo/alternates'

interface CoursePageProps {
  params: { lang: Locale; course: string }
}

export async function generateStaticParams() {
  return getAllLanguageCourses().flatMap((course) =>
    [{ course: course.id }]
  )
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; course: string }
}): Promise<Metadata> {
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

export default async function LanguageCoursePage({ params }: CoursePageProps) {
  const { lang, course: courseId } = params
  const dict = await getDictionary(lang)

  const known = getAllLanguageCourses().some((course) => course.id === courseId)
  if (!known) notFound()

  const course = getLanguageCourse(courseId, lang)

  return (
    <CourseOverview
      lang={lang}
      course={course}
      dict={dict}
    />
  )
}

export type { CoursePageProps }
