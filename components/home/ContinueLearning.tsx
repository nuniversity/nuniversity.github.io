// components/home/ContinueLearning.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from '@/components/navigation/AppLink'
import { Play, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
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

/**
 * The "pick up where you left off" card.
 *
 * This is a *personal* surface, so it is placed directly beneath the hero:
 * a returning learner sees it first, and a first-time visitor never sees it
 * at all (the component renders nothing without saved progress).
 */
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
    <section className="relative z-10 -mt-12 md:-mt-14" data-testid="continue-learning">
      <div className="container-custom">
        <div className="card card-hover relative mx-auto flex max-w-4xl flex-col gap-5 overflow-hidden p-0 shadow-lg sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          {/* Section colour rail — Courses is violet in the colour map. */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1 bg-gradient-section-courses"
          />

          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-section-courses text-white sm:ml-2"
            aria-hidden="true"
          >
            <Play className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1 px-5 sm:px-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-section-courses">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {dict.lesson?.continue || 'Continue'}
            </p>
            <p className="mt-1 truncate text-lg font-bold text-foreground">{data.heading}</p>
            <p className="truncate text-sm text-foreground-muted">{data.sub}</p>

            {data.pct !== null && (
              <div className="mt-3">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
                  role="progressbar"
                  aria-valuenow={data.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={data.progressLine || 'Course progress'}
                >
                  <div
                    className="h-full rounded-full bg-gradient-section-courses transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.max(2, data.pct)}%` }}
                  />
                </div>
                {data.progressLine && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground-muted">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                    {data.progressLine}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border px-5 pt-4 sm:justify-end sm:border-l sm:border-t-0 sm:px-0 sm:pl-6 sm:pt-0">
            {data.pct !== null && (
              <span className="tabular text-2xl font-bold tracking-tight text-foreground">
                {data.pct}%
              </span>
            )}
            <Link href={data.href} className="btn btn-primary group whitespace-nowrap">
              {dict.lesson?.continue || 'Continue'}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
