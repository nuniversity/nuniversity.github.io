'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  BookOpen,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import LessonAudio from './LessonAudio'
import { getCourseProgress } from '@/lib/progress/storage'
import { safeGet, safeSet } from '@/lib/storage/safe-storage'

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
  /** The lesson body — the outline owns the split so it can resize itself. */
  children?: ReactNode
}

interface TocHeading {
  id: string
  text: string
  level: number
}

/** Sidebar sizing, in pixels. */
const MIN_WIDTH = 240
const DEFAULT_WIDTH = 320
const MAX_WIDTH = 520
const KEYBOARD_STEP = 24

const WIDTH_KEY = 'lesson-outline-width'
const COLLAPSED_KEY = 'lesson-outline-collapsed'
const LESSONS_OPEN_KEY = 'lesson-outline-lessons-open'

/** Clamps a width to the allowed range. */
function clampWidth(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_WIDTH
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)))
}

export default function LessonOutline({
  lang,
  courseSlug,
  lessonSlug,
  courseTitle,
  lessonTitle,
  lessons,
  dict,
  children,
}: LessonOutlineProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const [activeId, setActiveId] = useState('')
  const [completed, setCompleted] = useState<Set<string> | null>(null)

  // Desktop split state, restored from the previous session.
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [collapsed, setCollapsed] = useState(false)
  // The syllabus is long; it starts closed so the page outline and the audio
  // controls are visible without scrolling the sidebar.
  const [lessonsOpen, setLessonsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [dragging, setDragging] = useState(false)
  const widthRef = useRef(width)
  widthRef.current = width

  useEffect(() => {
    const storedWidth = Number.parseInt(safeGet(WIDTH_KEY) ?? '', 10)
    if (Number.isFinite(storedWidth)) setWidth(clampWidth(storedWidth))
    setCollapsed(safeGet(COLLAPSED_KEY) === '1')
    setLessonsOpen(safeGet(LESSONS_OPEN_KEY) === '1')
    setHydrated(true)
  }, [])

  const persist = useCallback((nextWidth: number, nextCollapsed: boolean) => {
    safeSet(WIDTH_KEY, String(clampWidth(nextWidth)))
    safeSet(COLLAPSED_KEY, nextCollapsed ? '1' : '0')
  }, [])

  const changeWidth = useCallback(
    (next: number) => {
      const clamped = clampWidth(next)
      setWidth(clamped)
      persist(clamped, false)
    },
    [persist]
  )

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      persist(widthRef.current, next)
      return next
    })
  }, [persist])

  const toggleLessons = useCallback(() => {
    setLessonsOpen(prev => {
      const next = !prev
      safeSet(LESSONS_OPEN_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  // ── Drag to resize ────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      const startX = event.clientX
      const startWidth = widthRef.current
      setDragging(true)

      const onMove = (moveEvent: PointerEvent) => {
        changeWidth(startWidth + (moveEvent.clientX - startX))
      }
      const onUp = () => {
        setDragging(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }

      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [changeWidth]
  )

  /** Keyboard resizing for the separator (WAI-ARIA Window Splitter). */
  const onSeparatorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          changeWidth(widthRef.current - (event.shiftKey ? KEYBOARD_STEP * 2 : KEYBOARD_STEP))
          break
        case 'ArrowRight':
          event.preventDefault()
          changeWidth(widthRef.current + (event.shiftKey ? KEYBOARD_STEP * 2 : KEYBOARD_STEP))
          break
        case 'Home':
          event.preventDefault()
          changeWidth(MIN_WIDTH)
          break
        case 'End':
          event.preventDefault()
          changeWidth(MAX_WIDTH)
          break
        case 'Enter':
        case ' ':
          // The splitter pattern uses Enter to collapse and restore.
          event.preventDefault()
          toggleCollapsed()
          break
      }
    },
    [changeWidth, toggleCollapsed]
  )

  // ── Outline data ──────────────────────────────────────────────────
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
      {/* Mobile: drawer header */}
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

      <div
        // The outline width and the content's reading width are published as
        // custom properties so the content can reclaim the space when the
        // outline is hidden — a fixed `max-w-4xl` would leave a dead margin.
        style={{
          ['--outline-w' as string]: `${width}px`,
          // Hiding the outline hands its width to the lesson. The card grows
          // with it, so the freed space is used rather than left as a margin.
          ['--lesson-content-max' as string]: collapsed ? '62rem' : '56rem',
        }}
        className={[
          'lg:flex lg:items-start lg:gap-0',
          // While dragging, suppress the sticky element's own transitions.
          dragging ? 'select-none' : '',
        ].join(' ')}
      >
        <aside
          id="lesson-outline"
          aria-label={courseTitle}
          className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-80 shrink-0 overflow-y-auto border-r bg-card transition-transform duration-300 ease-in-out lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-[var(--outline-w)] lg:self-start lg:translate-x-0 ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          } ${collapsed ? 'lg:hidden' : ''}`}
        >
          <div className="space-y-6 p-4 pt-14 lg:pt-4">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/${lang}/courses`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {dict?.courses?.back_to_courses || 'Back to Courses'}
              </Link>

              {/* Desktop: hide the outline for more room. */}
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={dict?.lesson?.hide_outline || 'Hide course outline'}
                title={dict?.lesson?.hide_outline || 'Hide course outline'}
                className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:flex"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-mark">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-foreground break-words">{courseTitle}</p>
              </div>
            </div>

            {/* Read-aloud lives in the outline so it stays reachable while
                the reader scrolls. It reads the section in view by default. */}
            <div className="border-t border-border pt-4">
              <LessonAudio
                lang={lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US'}
                label={dict?.lesson?.listen || 'Listen to this lesson'}
                intro={dict?.lesson?.listen_intro || 'Audio is on. Reading this lesson aloud.'}
                voiceNote={dict?.lesson?.listen_voice_missing}
                sectionLabel={dict?.lesson?.listen_section || 'Section'}
                sectionAutoLabel={dict?.lesson?.listen_section_auto || 'The section I am reading'}
                sectionAllLabel={dict?.lesson?.listen_section_all || 'The whole lesson'}
                stopLabel={dict?.lesson?.listen_stop || 'Stop'}
                restartLabel={dict?.lesson?.listen_restart || 'Restart'}
                readingLabel={dict?.lesson?.listen_reading || 'Reading'}
                pausedLabel={dict?.lesson?.listen_paused || 'Paused'}
                rateSlowLabel={dict?.lesson?.listen_slow || 'Slower'}
                rateNormalLabel={dict?.lesson?.listen_normal || 'Normal'}
                rateFastLabel={dict?.lesson?.listen_fast || 'Faster'}
                sections={headings}
                activeSectionId={activeId}
              />
            </div>

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={toggleLessons}
                aria-expanded={lessonsOpen}
                aria-controls="lesson-outline-lessons"
                className="mb-2 flex w-full items-center justify-between gap-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
              >
                <span>
                  {dict?.courses?.course_content || 'Course Content'} ({lessons.length})
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${lessonsOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              <nav
                id="lesson-outline-lessons"
                aria-label={dict?.courses?.course_content || 'Course Content'}
                hidden={!lessonsOpen}
                className="space-y-1"
              >
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
            </div>

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
                      className={`block rounded-md py-1.5 pr-2 text-sm leading-snug transition-colors break-words ${
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

        {/* Resize handle — desktop only, hidden while collapsed.
            Follows the WAI-ARIA Window Splitter pattern: focusable separator,
            arrow keys to resize, Home/End for the bounds, Enter to collapse.
            The hit area is 24 px wide (WCAG 2.5.8) around a 1 px visible line. */}
        {!collapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={dict?.lesson?.resize_outline || 'Resize course outline'}
            aria-controls="lesson-outline"
            aria-valuenow={width}
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuetext={`${width} pixels`}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onKeyDown={onSeparatorKeyDown}
            onDoubleClick={() => changeWidth(DEFAULT_WIDTH)}
            data-testid="outline-resizer"
            className={`group sticky top-16 hidden h-[calc(100vh-4rem)] w-6 shrink-0 cursor-col-resize items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:flex ${
              dragging ? 'bg-primary/20' : ''
            }`}
          >
            {/* The visible line; widens on hover so the target is easy to hit. */}
            <span
              aria-hidden="true"
              className={`h-full w-px transition-colors duration-150 ${
                dragging ? 'bg-primary' : 'bg-border group-hover:bg-primary/60'
              }`}
            />
          </div>
        )}

        <div className="min-w-0 flex-1 lg:pl-6">
          {/* Desktop: reopen the outline after hiding it. The row is capped to
              the same column as the lesson, so the button lines up with the
              card instead of floating at the far left of the freed space. */}
          {collapsed && (
            <div
              className="mx-auto hidden w-full lg:flex sticky top-16 z-20 justify-start pb-2"
              style={{ maxWidth: 'var(--lesson-content-max, 56rem)' }}
            >
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={dict?.lesson?.show_outline || 'Show course outline'}
                title={dict?.lesson?.show_outline || 'Show course outline'}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/95 px-2.5 py-1.5 text-xs font-medium text-foreground-muted backdrop-blur transition-colors hover:bg-accent hover:text-foreground"
              >
                <PanelLeftOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {dict?.lesson?.show_outline || 'Show outline'}
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </>
  )
}
