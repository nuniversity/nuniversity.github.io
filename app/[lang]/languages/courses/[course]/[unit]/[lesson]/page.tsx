export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import {
  getCourseVocab,
  getLanguageCourse,
  getLesson,
  listAllLessonRoutes,
  listUnitLessons,
} from '@/lib/language-courses/get-language-course'
import type { GrammarPoint, VocabItem } from '@/lib/language-courses/types'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LessonPlayer } from '@/components/language-course/lesson-player'
import { buildAlternates } from '@/lib/seo/alternates'

interface LessonPageProps {
  params: { lang: Locale; course: string; unit: string; lesson: string }
}

export async function generateStaticParams() {
  return listAllLessonRoutes().map(({ courseId, unitSlug, lessonSlug }) => ({
    course: courseId,
    unit: unitSlug,
    lesson: lessonSlug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; course: string; unit: string; lesson: string }
}): Promise<Metadata> {
  let title = params.lesson
  let description = 'Interactive language lesson.'
  try {
    const lesson = getLesson(params.course, params.unit, params.lesson, params.lang)
    title = lesson.title[params.lang] || lesson.title.en
    description = lesson.goal[params.lang] || lesson.goal.en
  } catch {
    // static build: fall back to the slug
  }
  return {
    alternates: buildAlternates(params.lang, `languages/courses/${params.course}/${params.unit}/${params.lesson}`),
    title,
    description,
  }
}

/** Steps reference vocab and grammar by id; the page resolves those slices. */
export default async function LanguageLessonPage({
  params,
}: LessonPageProps) {
  const { lang, course: courseId, unit: unitSlug, lesson: lessonSlug } = params
  const dict = await getDictionary(lang)

  let course
  try {
    course = getLanguageCourse(courseId, lang)
  } catch {
    notFound()
  }

  const unit = course.units.find((candidate) => candidate.slug === unitSlug)
  if (!unit) notFound()
  if (!listUnitLessons(courseId, unitSlug).includes(lessonSlug)) notFound()

  const lesson = getLesson(courseId, unitSlug, lessonSlug, lang)
  const allVocab = getCourseVocab(courseId)
  const neededIds = new Set<string>([
    ...lesson.vocabIds,
    ...(lesson.reviewVocabIds ?? []),
    // steps may also reference vocab directly (match/select pairs)
    ...lesson.steps.flatMap((step) => {
      if (step.type === 'vocab') return step.vocabIds
      return []
    }),
  ])
  const vocabSlice: VocabItem[] = allVocab.filter((item) => neededIds.has(item.id))

  const grammarIds = new Set<string>(lesson.grammarIds ?? [])
  for (const step of lesson.steps) {
    if (step.type === 'tip') grammarIds.add(step.grammarId)
  }
  const grammarSlice: GrammarPoint[] = course.grammar.filter((point) => grammarIds.has(point.id))

  const unitLessons = listUnitLessons(courseId, unitSlug)
  const index = unitLessons.indexOf(lessonSlug)
  const nextLessonSlug = index >= 0 && index + 1 < unitLessons.length ? unitLessons[index + 1] : null
  const nextUnit = course.units.find((candidate) => candidate.order === unit.order + 1)
  const nextHref = nextLessonSlug
    ? `/${lang}/languages/courses/${courseId}/${unitSlug}/${nextLessonSlug}/`
    : nextUnit
      ? `/${lang}/languages/courses/${courseId}/${nextUnit.slug}/${listUnitLessons(courseId, nextUnit.slug)[0] ?? ''}/`
      : `/${lang}/languages/courses/${courseId}/`

  return (
    <LessonPlayer
      lang={lang}
      course={course}
      unit={unit}
      lesson={lesson}
      vocab={vocabSlice}
      grammar={grammarSlice}
      nextHref={nextHref}
      dict={dict}
    />
  )
}
