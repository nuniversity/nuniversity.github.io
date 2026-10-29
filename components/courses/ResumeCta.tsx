'use client'

import { useEffect, useState } from 'react'
import Link from '@/components/navigation/AppLink'
import { BookOpen, ArrowRight, Play } from 'lucide-react'
import { coursePercent, getCourseProgress } from '@/lib/progress/storage'

interface ResumeCtaProps {
  lang: string
  courseSlug: string
  lessonSlugs: string[]
  lessonCount: number
  dict: any
}

type CtaState = { mode: 'start' } | { mode: 'continue'; href: string; pct: number }

export default function ResumeCta({ lang, courseSlug, lessonSlugs, lessonCount, dict }: ResumeCtaProps) {
  const [state, setState] = useState<CtaState>({ mode: 'start' })

  useEffect(() => {
    const progress = getCourseProgress(courseSlug)
    if (!progress) return
    const resumeSlug =
      progress.lastLesson && lessonSlugs.includes(progress.lastLesson)
        ? progress.lastLesson
        : lessonSlugs[0]
    setState({
      mode: 'continue',
      href: `/${lang}/courses/${courseSlug}/${resumeSlug}/`,
      pct: coursePercent(progress, lessonCount),
    })
  }, [lang, courseSlug, lessonSlugs, lessonCount])

  if (state.mode === 'start') {
    return (
      <Link
        href={`/${lang}/courses/${courseSlug}/${lessonSlugs[0]}/`}
        className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        <BookOpen className="w-4 h-4" />
        {dict.courses?.start_learning || 'Start Learning'}
        <ArrowRight className="w-4 h-4" />
      </Link>
    )
  }

  return (
    <span className="inline-flex items-center gap-3 mt-8 flex-wrap">
      <Link
        href={state.href}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        data-testid="resume-cta"
      >
        <Play className="w-4 h-4" />
        {dict.lesson?.continue || 'Continue'}
        <ArrowRight className="w-4 h-4" />
      </Link>
      <span
        role="status"
        aria-label={`${state.pct}% ${dict.courses?.progress || 'Progress'}`}
        className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold"
        data-testid="resume-percent"
      >
        {state.pct}%
      </span>
    </span>
  )
}
