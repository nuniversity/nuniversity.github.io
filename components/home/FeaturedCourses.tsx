'use client'

import Link from 'next/link'
import { Clock, ArrowRight, BookOpen, Code, GitBranch, Beaker, Calculator, Database, Cpu, Globe, Sparkles, Brain, type LucideIcon } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import type { CourseInfo } from '@/lib/courses/get-course-content'

const iconMap: Record<string, LucideIcon> = {
  code: Code,
  'git-branch': GitBranch,
  beaker: Beaker,
  calculator: Calculator,
  database: Database,
  cpu: Cpu,
  globe: Globe,
  brain: Brain,
  sparkles: Sparkles,
  'book-open': BookOpen,
}

const gradients = [
  'from-blue-500 to-cyan-500',
  'from-cyan-500 to-teal-500',
  'from-emerald-500 to-green-500',
  'from-amber-500 to-orange-500',
  'from-sky-400 to-blue-500',
  'from-rose-400 to-pink-500',
  'from-teal-500 to-cyan-500',
  'from-yellow-500 to-amber-500',
]

function getIcon(icon?: string): LucideIcon {
  if (icon && iconMap[icon]) return iconMap[icon]
  return BookOpen
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

interface FeaturedCoursesProps {
  lang: Locale
  dict: Dictionary
  courses: CourseInfo[]
}

export default function FeaturedCourses({ lang, dict, courses }: FeaturedCoursesProps) {
  const displayCourses = courses.slice(0, 6)

  return (
    <section className="section bg-surface-sunken/60">
      <div className="container-custom">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {dict.featured?.title || 'Featured'}{' '}
            <span className="text-gradient">{dict.featured?.titleHighlight || 'Courses'}</span>
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">
            {dict.courses?.subtitle ||
              'Start your learning journey with our most popular courses, designed by industry experts.'}
          </p>
        </div>

        <ul className="stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayCourses.map((course, index) => {
            const Icon = getIcon(course.icon)
            const gradient = gradients[index % gradients.length]

            return (
              <li key={course.slug} style={{ '--i': index } as React.CSSProperties}>
                <article className="card card-hover group flex h-full flex-col overflow-hidden">
                  <div
                    className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${gradient}`}
                  >
                    <Icon
                      className="h-14 w-14 text-white/90 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {(dict.courses?.areas as Record<string, string> | undefined)?.[course.area] ||
                        course.area}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-section-courses">
                      {course.difficulty
                        ? dict.courses?.difficulty_labels?.[course.difficulty] || capitalize(course.difficulty)
                        : dict.courses?.all_levels || 'All Levels'}
                    </span>

                    <h3 className="mt-2 text-lg font-bold leading-snug text-foreground">
                      {course.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground-muted">
                      {course.description}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-foreground-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {course.duration || 'Self-paced'}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        {course.lessonCount ?? 0}{' '}
                        {(course.lessonCount ?? 0) === 1
                          ? dict.courses?.lesson || 'Lesson'
                          : dict.courses?.lessons || 'Lessons'}
                      </span>
                    </div>

                    <Link
                      href={`/${lang}/courses/${course.slug}/`}
                      className="btn btn-secondary mt-5 w-full group/btn"
                    >
                      <span>{dict.courses?.cta?.start_learning || 'Start Learning'}</span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

        <div className="mt-12 text-center">
          <Link
            href={`/${lang}/courses`}
            className="btn btn-secondary group"
          >
            <span>{dict.courses?.cta?.view_all || 'Explore all courses'}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
