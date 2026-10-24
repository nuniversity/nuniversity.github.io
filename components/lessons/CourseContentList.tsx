'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { getCourseProgress } from '@/lib/progress/storage'

interface CourseContentListProps {
  lang: string
  courseSlug: string
  lessonSlug: string
  lessons: { slug: string; title: string }[]
  dict: any
}

export default function CourseContentList({ lang, courseSlug, lessonSlug, lessons, dict }: CourseContentListProps) {
  const [completed, setCompleted] = useState<Set<string> | null>(null)

  useEffect(() => {
    setCompleted(new Set(getCourseProgress(courseSlug)?.completed ?? []))
  }, [courseSlug])

  const doneCount = completed ? lessons.filter(l => completed.has(l.slug)).length : 0
  const progressLine = (dict.lesson?.progress_of || '{done} of {total} completed')
    .replace('{done}', String(doneCount))
    .replace('{total}', String(lessons.length))

  return (
    <div className="space-y-2" data-testid="course-content-list">
      {completed && (
        <p className="text-xs text-muted-foreground" data-testid="course-content-progress">
          {progressLine}
        </p>
      )}
      {lessons.map((l, index) => (
        <Link
          key={l.slug}
          href={`/${lang}/courses/${courseSlug}/${l.slug}/`}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            l.slug === lessonSlug
              ? 'bg-primary text-primary-foreground font-medium'
              : 'hover:bg-accent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="text-sm">
            {index + 1}. {l.title}
          </span>
          {completed?.has(l.slug) && (
            <span
              title={dict.lesson?.completed_badge || 'Completed'}
              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
            >
              <Check className="h-3 w-3" />
              <span className="hidden sm:inline">{dict.lesson?.completed_badge || 'Completed'}</span>
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
