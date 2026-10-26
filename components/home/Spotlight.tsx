// components/home/Spotlight.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles, Clock, BookOpen, Layers } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import { getAreaGradient } from '@/lib/courses/area-colors'
import type { CourseInfo } from '@/lib/courses/get-course-content'

interface SpotlightProps {
  lang: Locale
  dict: Dictionary
  courses: CourseInfo[]
}

/** How long each slide stays on screen. */
const ROTATE_MS = 7000

/**
 * A rotating showcase of real courses.
 *
 * Follows the WAI-ARIA carousel pattern: the rotation stops on hover and on
 * focus, is disabled entirely under `prefers-reduced-motion`, and the live
 * region is switched off while auto-rotating so screen readers are not
 * interrupted every few seconds.
 */
export default function Spotlight({ lang, dict, courses }: SpotlightProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const slides = courses.slice(0, 6)
  const count = slides.length

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const go = useCallback(
    (next: number) => {
      if (count === 0) return
      setIndex(((next % count) + count) % count)
    },
    [count]
  )

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) return
    timer.current = setInterval(() => {
      setIndex(current => (current + 1) % count)
    }, ROTATE_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [count, paused, reducedMotion])

  if (count === 0) return null

  const course = slides[index]
  const gradient = getAreaGradient(index)

  return (
    <section
      className="section bg-background"
      aria-roledescription="carousel"
      aria-label={dict.featured?.title || 'Featured courses'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container-custom">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground-muted">
            <Sparkles className="h-3.5 w-3.5 text-section-courses" aria-hidden="true" />
            {dict.featured?.title || 'Featured'}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {dict.featured?.titleHighlight || 'Courses'}
          </h2>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div
            className="card overflow-hidden"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            aria-live={paused || reducedMotion ? 'polite' : 'off'}
          >
            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {/* Visual panel — the area colour drives it. */}
              <div className={`relative flex min-h-[16rem] items-center justify-center overflow-hidden ${gradient}`}>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 55%), radial-gradient(circle at 75% 80%, rgba(255,255,255,0.35), transparent 50%)',
                  }}
                />
                <span
                  key={`icon-${index}`}
                  className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm animate-scale-in"
                  aria-hidden="true"
                >
                  <Sparkles className="h-11 w-11" />
                </span>
              </div>

              {/* Content */}
              <div key={`content-${index}`} className="p-6 sm:p-8 animate-fade-in-up">
                <span className="badge badge-neutral">{course.area}</span>
                <h3 className="mt-3 text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                  {course.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
                  {course.description}
                </p>

                <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground-muted">
                  {typeof course.lessonCount === 'number' && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      <dt className="sr-only">Lessons</dt>
                      <dd>
                        {course.lessonCount}{' '}
                        {(course.lessonCount ?? 0) === 1
                          ? dict.courses?.lesson || 'Lesson'
                          : dict.courses?.lessons || 'Lessons'}
                      </dd>
                    </div>
                  )}
                  {course.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <dt className="sr-only">Duration</dt>
                      <dd>{course.duration}</dd>
                    </div>
                  )}
                  {course.difficulty && (
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4" aria-hidden="true" />
                      <dt className="sr-only">Level</dt>
                      <dd>
                        {dict.courses?.difficulty_labels?.[course.difficulty] || course.difficulty}
                      </dd>
                    </div>
                  )}
                </dl>

                <Link href={`/${lang}/courses/${course.slug}/`} className="btn btn-primary mt-6 group">
                  {dict.courses?.cta?.start_learning || 'Start Learning'}
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={dict.search?.results ? 'Previous course' : 'Previous course'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <ul className="flex items-center gap-2">
              {slides.map((slide, i) => (
                <li key={slide.slug}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index ? 'true' : undefined}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === index ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-foreground-subtle'
                    }`}
                  />
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next course"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href={`/${lang}/courses`}
              className="btn btn-secondary group"
            >
              {dict.courses?.cta?.view_all || 'Explore all courses'}
              <ChevronRight
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
