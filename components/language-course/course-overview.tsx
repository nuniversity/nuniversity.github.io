'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from '@/components/navigation/AppLink'
import { ArrowRight, BookOpen, CheckCircle2, Circle, Flame, Target } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { LanguageCourseMeta } from '@/lib/language-courses/types'
import {
  coursePercent,
  getCourseProgress,
  isLessonComplete,
  unitPercent,
  type LanguageCourseProgress,
} from '@/lib/language-courses/storage'
import { pairChipLabel, tpl } from '@/lib/languages/format'
import { DAILY_GOAL_XP } from '@/lib/gamification/types'
import { getXpToday } from '@/lib/gamification/profile'
import { SpeechSetupNote } from './speech-setup-note'
import { FlagPair } from './flag-pair'

interface CourseOverviewProps {
  lang: Locale
  course: LanguageCourseMeta
  dict: any
}

/** Percent ring for a value 0..100. */
function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)
  return (
    <div className="relative h-16 w-16 shrink-0" role="img" aria-label={`${label}: ${percent}%`}>
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-primary transition-all"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">
        {percent}%
      </span>
    </div>
  )
}

export function CourseOverview({ lang, course, dict }: CourseOverviewProps) {
  const t = useMemo(() => dict?.languageCourse ?? {}, [dict])
  const [progress, setProgress] = useState<LanguageCourseProgress | null>(null)
  const [xpToday, setXpToday] = useState(0)

  useEffect(() => {
    setProgress(getCourseProgress(course.id))
    setXpToday(getXpToday())
  }, [course.id])

  const totalLessons = useMemo(
    () => course.units.reduce((sum, unit) => sum + Math.max(unit.lessons.length, 0), 0),
    [course.units]
  )
  const overall = progress ? coursePercent(progress, totalLessons) : 0
  const goalPercent = Math.min(100, Math.round((xpToday / DAILY_GOAL_XP) * 100))

  const continueTarget = useMemo(() => {
    if (!progress?.lastLesson) {
      const firstUnit = course.units[0]
      const firstLesson = firstUnit?.lessons[0]
      return firstUnit && firstLesson
        ? { unit: firstUnit.slug, lesson: firstLesson.slug, label: t.start || 'Start' }
        : null
    }
    return {
      unit: progress.lastLesson.unit,
      lesson: progress.lastLesson.lesson,
      label: t.continue || 'Continue',
    }
  }, [progress, course.units, t])

  const localized = (value: { en: string; pt: string; es?: string } | undefined) =>
    (value && (value[lang] || value.en)) || ''

  return (
    <div className="mx-auto max-w-4xl px-4 py-10" data-testid="language-course-overview">
      <SpeechSetupNote languages={[course.source, course.target]} dict={dict} uiLang={lang} />
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{course.emoji}</span>
          {course.flags ? (
            <FlagPair
              languages={{ source: course.source, target: course.target }}
              flags={course.flags}
              size={22}
            />
          ) : (
            <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold">
              {pairChipLabel({ source: course.source, target: course.target })}
            </span>
          )}
          <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold">{t.cefr || 'Level'}: {course.cefrTarget}</span>
        </div>
        <h1 className="text-3xl font-bold">{localized(course.name)}</h1>
        <p className="mt-2 text-muted-foreground">{localized(course.description)}</p>
      </header>

      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <ProgressRing percent={overall} label={t.progress || 'Progress'} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t.progress || 'Progress'}</p>
            <p className="text-xs text-muted-foreground">
              {tpl(t.completion || '{n}% complete', { n: overall })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4" data-testid="daily-goal">
          <ProgressRing percent={goalPercent} label={t.daily_goal || 'Daily goal'} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-sm font-semibold">
              <Target className="h-4 w-4 text-primary" />
              {t.daily_goal || 'Daily goal'}
            </p>
            <p className="text-xs text-muted-foreground">
              {xpToday >= DAILY_GOAL_XP
                ? t.goal_done || 'Goal reached!'
                : tpl(t.xp_today || '{n} XP today', { n: xpToday })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Flame className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t.vocabulary || 'Vocabulary'}</p>
            <p className="text-xs text-muted-foreground">
              {course.units.length} {t.units || 'Units'} · {totalLessons} {t.lessons || 'Lessons'}
            </p>
          </div>
        </div>
      </div>

      {continueTarget && (
        <Link
          href={`/${lang}/languages/courses/${course.id}/${continueTarget.unit}/${continueTarget.lesson}/`}
          data-testid="continue-cta"
          className="mb-8 flex items-center justify-between rounded-2xl bg-primary px-6 py-4 text-primary-foreground transition-opacity hover:opacity-90"
        >
          <span className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5" />
            {continueTarget.label}
          </span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      )}

      <div className="space-y-6">
        {course.units.map((unit) => {
          const percent = progress ? unitPercent(progress, unit.slug, unit.lessons.length) : 0
          return (
            <section key={unit.slug} className="rounded-2xl border bg-card" data-testid={`unit-${unit.slug}`}>
              <div className="flex items-center gap-3 border-b p-4">
                <span className="text-2xl">{unit.emoji}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{localized(unit.title)}</h2>
                  <p className="truncate text-xs text-muted-foreground">{localized(unit.description)}</p>
                </div>
                <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold">{unit.cefr}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
              </div>
              <ol className="divide-y">
                {unit.lessons.map((entry) => {
                  const done = progress ? isLessonComplete(progress, unit.slug, entry.slug) : false
                  const best = progress?.units[unit.slug]?.lessons[entry.slug]?.bestPercent
                  return (
                    <li key={entry.slug}>
                      <Link
                        href={`/${lang}/languages/courses/${course.id}/${unit.slug}/${entry.slug}/`}
                        className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent/50"
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" data-testid="lesson-complete-icon" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {localized(entry.title)}
                        </span>
                        {entry.kind === 'review' && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            ★
                          </span>
                        )}
                        {typeof best === 'number' && (
                          <span className="text-xs tabular-nums text-muted-foreground">{best}%</span>
                        )}
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}
