'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { coursePercent, getCourseProgress } from '@/lib/progress/storage'

interface CourseProgressBadgeProps {
  courseSlug: string
  lessonCount: number
  dict: any
}

export default function CourseProgressBadge({ courseSlug, lessonCount, dict }: CourseProgressBadgeProps) {
  const [pct, setPct] = useState<number | null>(null)

  useEffect(() => {
    const progress = getCourseProgress(courseSlug)
    if (!progress) return
    setPct(coursePercent(progress, lessonCount))
  }, [courseSlug, lessonCount])

  if (pct === null) return null

  return (
    <div
      className="flex items-center gap-1 text-green-600 dark:text-green-400"
      title={`${pct}% ${dict.courses?.progress || 'Progress'}`}
      data-testid="course-progress-badge"
    >
      <CheckCircle2 className="w-4 h-4" />
      <span className="font-medium">{pct}%</span>
      <span className="sr-only">{dict.courses?.progress || 'Progress'}</span>
    </div>
  )
}
