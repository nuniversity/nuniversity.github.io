'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, ArrowRight, BookOpen } from 'lucide-react'
import { coursePercent, getCourseProgress, getLastVisited } from '@/lib/progress/storage'
import type { CourseInfo } from '@/lib/courses/get-course-content'

interface ContinueLearningProps {
  lang: string
  dict: any
  courses: Pick<CourseInfo, 'slug' | 'lessonCount'>[]
}

interface ContinueData {
  href: string
  heading: string
  sub: string
  pct: number | null
  progressLine: string | null
}

export default function ContinueLearning({ lang, dict, courses }: ContinueLearningProps) {
  const [data, setData] = useState<ContinueData | null>(null)

  useEffect(() => {
    const pointer = getLastVisited()
    if (!pointer) return
    const langMatch = pointer.lang === lang
    const course = courses.find(c => c.slug === pointer.courseSlug)
    const progress = course ? getCourseProgress(pointer.courseSlug) : null
    const pct = course ? coursePercent(progress, course.lessonCount ?? 0) : null
    const done = progress?.completed.length ?? 0
    const total = course?.lessonCount ?? 0
    const progressLine =
      course && progress
        ? (dict.lesson?.progress_of || '{done} of {total} completed')
            .replace('{done}', String(done))
            .replace('{total}', String(total))
        : null

    setData({
      href: `/${lang}/courses/${pointer.courseSlug}/${pointer.lessonSlug}/`,
      heading: langMatch ? pointer.courseTitle : dict.navigation?.courses || 'Courses',
      sub: langMatch ? pointer.lessonTitle : pointer.lessonSlug,
      pct,
      progressLine,
    })
  }, [lang, dict, courses])

  if (!data) return null

  return (
    <section className="pb-10" data-testid="continue-learning">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
            <Play className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="h-3 w-3" />
              {dict.lesson?.continue || 'Continue'}
            </p>
            <p className="truncate font-semibold text-foreground">{data.heading}</p>
            <p className="truncate text-sm text-muted-foreground">{data.sub}</p>
          </div>

          <div className="flex items-center gap-4">
            {data.pct !== null && (
              <div className="hidden sm:block text-right">
                <p className="text-lg font-bold text-primary">{data.pct}%</p>
                {data.progressLine && (
                  <p className="text-xs text-muted-foreground">{data.progressLine}</p>
                )}
              </div>
            )}
            <Link
              href={data.href}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {dict.lesson?.continue || 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
