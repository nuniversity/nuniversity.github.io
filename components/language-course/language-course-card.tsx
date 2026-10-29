'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from '@/components/navigation/AppLink'
import { ArrowRight, BookOpen, Layers } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { LanguageCourseSummary } from '@/lib/language-courses/get-language-course'
import { FlagPair, flagPairTitle } from './flag-pair'
import {
  coursePercent,
  getCourseProgress,
  type LanguageCourseProgress,
} from '@/lib/language-courses/storage'
import { dueVocabCount } from '@/lib/language-courses/schedule'
import { pairChipLabel, tpl } from '@/lib/languages/format'

/**
 * Rich hub card for a language course: hero-style gradient panel with the
 * course emoji, meta chips and the learner's live progress (read from
 * localStorage after mount), so the hub doubles as a resume point.
 */
export function LanguageCourseCard({
  lang,
  course,
  dict,
}: {
  lang: Locale
  course: LanguageCourseSummary
  dict: any
}) {
  const t = dict?.languageCourse ?? {}
  const [progress, setProgress] = useState<LanguageCourseProgress | null>(null)
  const [due, setDue] = useState(0)

  useEffect(() => {
    setProgress(getCourseProgress(course.id))
    setDue(dueVocabCount(`${course.source}-${course.target}`, new Date()))
  }, [course.id])

  const overall = progress ? coursePercent(progress, course.lessonCount) : 0
  const started = overall > 0
  const resumeTarget = useMemo(() => {
    if (!progress?.lastLesson) return null
    return progress.lastLesson
  }, [progress])

  const name = course.name[lang] || course.name.en
  const description = course.description[lang] || course.description.en

  return (
    <Link
      href={`/${lang}/languages/courses/${course.id}/`}
      data-testid={`language-course-${course.id}`}
      className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* decorative watermark */}
      {course.emoji && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-3 -top-8 select-none text-[7rem] leading-none opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
        >
          {course.emoji}
        </span>
      )}

      <div className="relative flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 text-3xl shadow-inner">
          {course.emoji || <BookOpen className="h-6 w-6 text-primary" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
              {name}
            </h3>
            {course.flags ? (
              <FlagPair
                languages={{ source: course.source, target: course.target }}
                flags={course.flags}
                size={16}
              />
            ) : (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                {pairChipLabel({ source: course.source, target: course.target })}
              </span>
            )}
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {course.cefrTarget}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {course.unitCount} {t.units || 'Units'}
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.lessonCount} {t.lessons || 'Lessons'}
            </span>
            {due > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" data-testid={`course-due-${course.id}`}>
                {tpl(t.review_needed || '{n} cards to review', { n: due })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* progress + CTA */}
      <div className="relative mt-4 flex items-center gap-3 border-t pt-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t.progress || 'Progress'}</span>
            <span className="tabular-nums font-semibold">{overall}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
              style={{ width: `${Math.max(overall, started ? 2 : 0)}%` }}
              data-testid={`course-progress-${course.id}`}
            />
          </div>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition-all group-hover:gap-2 group-hover:shadow-md"
          data-testid={`course-cta-${course.id}`}
        >
          {started ? (t.continue || 'Continue') : (t.start || 'Start')}
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
