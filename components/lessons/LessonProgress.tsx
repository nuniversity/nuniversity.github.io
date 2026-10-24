'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll } from 'framer-motion'
import { Check, CheckCircle2 } from 'lucide-react'
import { isLessonComplete, markLessonComplete, markLessonIncomplete, recordVisit } from '@/lib/progress/storage'
import { recordAndEmit } from '@/lib/gamification/bus'

export function LessonScrollProgress() {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      aria-hidden="true"
      data-testid="lesson-scroll-progress"
      className="fixed left-0 right-0 top-16 z-40 h-1 origin-left bg-primary"
      style={{ scaleX: scrollYProgress }}
    />
  )
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function LessonKeyboardNav({ prevHref, nextHref }: { prevHref: string | null; nextHref: string | null }) {
  const router = useRouter()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      if (event.key === 'ArrowLeft' && prevHref) {
        event.preventDefault()
        router.push(prevHref)
      } else if (event.key === 'ArrowRight' && nextHref) {
        event.preventDefault()
        router.push(nextHref)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prevHref, nextHref, router])

  return null
}

export function LessonCompleteButton({ courseSlug, lessonSlug, lessonSlugs, dict }: {
  courseSlug: string
  lessonSlug: string
  lessonSlugs?: string[]
  dict: any
}) {
  const [completed, setCompleted] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCompleted(isLessonComplete(courseSlug, lessonSlug))
    setHydrated(true)
  }, [courseSlug, lessonSlug])

  const toggle = () => {
    if (completed) {
      markLessonIncomplete(courseSlug, lessonSlug)
      setCompleted(false)
    } else {
      const { progress, newlyCompleted } = markLessonComplete(courseSlug, lessonSlug)
      setCompleted(true)
      if (newlyCompleted) {
        recordAndEmit({ type: 'lesson-complete', courseSlug, lessonSlug })
        const completeCourse =
          (lessonSlugs?.length ?? 0) > 0 &&
          (lessonSlugs ?? []).every(slug => progress.completed.includes(slug))
        if (completeCourse) {
          recordAndEmit({ type: 'course-complete', courseSlug })
        }
      }
    }
  }

  if (!hydrated) return <div className="h-10" aria-hidden="true" />

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={completed}
        data-testid="lesson-complete-button"
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
          completed
            ? 'border-green-600 bg-green-600 text-white hover:bg-green-700'
            : 'border-border bg-card text-foreground hover:bg-accent'
        }`}
      >
        {completed ? <Check className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        {completed ? dict?.lesson?.mark_incomplete || 'Mark as incomplete' : dict?.lesson?.mark_complete || 'Mark lesson as complete'}
      </button>
      {completed && (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
          <Check className="h-3 w-3" />
          {dict?.lesson?.completed_badge || 'Completed'}
        </span>
      )}
    </div>
  )
}

export function LessonVisitTracker({ courseSlug, lessonSlug, courseTitle, lessonTitle, lang }: {
  courseSlug: string
  lessonSlug: string
  courseTitle: string
  lessonTitle: string
  lang: string
}) {
  const visited = useRef<string | null>(null)

  useEffect(() => {
    const key = `${courseSlug}/${lessonSlug}`
    if (visited.current === key) return
    visited.current = key
    recordVisit(courseSlug, lessonSlug, { courseTitle, lessonTitle, lang })
  }, [courseSlug, lessonSlug, courseTitle, lessonTitle, lang])

  return null
}
