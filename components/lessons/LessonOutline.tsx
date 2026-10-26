'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Menu, X, BookOpen, Check } from 'lucide-react'
import { getCourseProgress } from '@/lib/progress/storage'

interface OutlineLesson {
  slug: string
  title: string
}

interface LessonOutlineProps {
  lang: string
  courseSlug: string
  lessonSlug: string
  courseTitle: string
  lessonTitle: string
  lessons: OutlineLesson[]
  dict: any
}

interface TocHeading {
  id: string
  text: string
  level: number
}

export default function LessonOutline({ lang, courseSlug, lessonSlug, courseTitle, lessonTitle, lessons, dict }: LessonOutlineProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const [activeId, setActiveId] = useState('')
  const [completed, setCompleted] = useState<Set<string> | null>(null)

  useEffect(() => {
    setCompleted(new Set(getCourseProgress(courseSlug)?.completed ?? []))
  }, [courseSlug])

  useEffect(() => {
    setDrawerOpen(false)
    const root = document.querySelector('[data-lesson-content]')
    const elements = Array.from(root?.querySelectorAll<HTMLElement>('h2[id], h3[id]') ?? [])
    setHeadings(
      elements.map(el => ({
        id: el.id,
        text: el.textContent || el.id,
        level: el.tagName === 'H3' ? 3 : 2,
      }))
    )
    setActiveId('')
  }, [lessonSlug])

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || headings.length === 0) return
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id
          if (entry.isIntersecting) visible.add(id)
          else visible.delete(id)
        }
        const first = headings.find(h => visible.has(h.id))
        if (first) setActiveId(first.id)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
    )
    for (const heading of headings) {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [headings])

  return (
    <>
      <div className="lg:hidden sticky top-16 z-40 flex items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          aria-label={dict?.lesson?.menu_toggle || 'Lesson menu'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(open => !open)}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span>{dict?.lesson?.menu_toggle || 'Lesson menu'}</span>
        </button>
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{lessonTitle}</span>
      </div>

      {drawerOpen && (
        <div
          data-testid="lesson-drawer-overlay"
          className="fixed inset-0 top-16 z-20 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        aria-label={courseTitle}
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-80 shrink-0 overflow-y-auto border-r bg-card transition-transform duration-300 ease-in-out lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:self-start lg:translate-x-0 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6 p-4 pt-14 lg:pt-4">
          <Link
            href={`/${lang}/courses`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {dict?.courses?.back_to_courses || 'Back to Courses'}
          </Link>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-mark">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug text-foreground">{courseTitle}</p>
            </div>
          </div>

          <nav aria-label={dict?.courses?.course_content || 'Course Content'} className="space-y-1">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.slug}
                href={`/${lang}/courses/${courseSlug}/${lesson.slug}`}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  lesson.slug === lessonSlug
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span className="shrink-0 tabular-nums opacity-70">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 leading-snug break-words">{lesson.title}</span>
                {completed?.has(lesson.slug) && (
                  <span
                    className="ml-auto shrink-0"
                    title={dict?.lesson?.completed_badge || 'Completed'}
                    data-testid="outline-check"
                  >
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="border-t pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dict?.lesson?.outline_title || 'On this page'}
            </p>
            {headings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{dict?.lesson?.toc_empty || 'No sections in this lesson'}</p>
            ) : (
              <nav aria-label={dict?.lesson?.outline_title || 'On this page'} className="space-y-0.5">
                {headings.map(heading => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    onClick={() => setDrawerOpen(false)}
                    className={`block rounded-md py-1.5 pr-2 text-sm leading-snug transition-colors ${
                      heading.level === 3 ? 'pl-8' : 'pl-3'
                    } ${
                      activeId === heading.id
                        ? 'border-l-2 border-primary bg-primary/10 pl-[calc(0.75rem-2px)] font-medium text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            )}
          </div>

          <p className="hidden border-t pt-4 text-xs text-muted-foreground lg:block">
            {dict?.lesson?.keyboard_hint || 'Tip: use ← and → to switch lessons'}
          </p>
        </div>
      </aside>
    </>
  )
}
