import { getAllCourses, getAllLessons } from '@/lib/courses/get-course-content'
import { i18n, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ResumeCta from '@/components/courses/ResumeCta'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Home,
  Target,
  User,
} from 'lucide-react'

interface CourseLandingPageProps {
  params: {
    lang: Locale
    courseSlug: string
  }
}

export const dynamic = 'force-static'
export const revalidate = false

export async function generateStaticParams() {
  const params: { lang: Locale; courseSlug: string }[] = []

  for (const lang of i18n.locales) {
    try {
      const coursesWithLessons = await getAllLessons(null, lang)
      for (const course of coursesWithLessons) {
        params.push({ lang, courseSlug: course.slug })
      }
    } catch (error) {
      console.error(`Error generating course landing params for ${lang}:`, error)
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: CourseLandingPageProps): Promise<Metadata> {
  const { lang, courseSlug } = params
  const courses = await getAllCourses(lang)
  const course = courses.find((c) => c.slug === courseSlug)

  if (!course) {
    return { title: 'Course' }
  }

  return {
    title: course.title,
    description: course.description || course.title,
  }
}

function difficultyClasses(difficulty?: string): string {
  if (difficulty === 'beginner') {
    return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
  }
  if (difficulty === 'intermediate') {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
  }
  if (difficulty === 'advanced') {
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }
  return 'bg-muted text-muted-foreground'
}

export default async function CourseLandingPage({
  params,
}: CourseLandingPageProps) {
  const { lang, courseSlug } = params
  const dict = await getDictionary(lang)

  const allCourses = await getAllCourses(lang)
  const course = allCourses.find((c) => c.slug === courseSlug)

  const allWithLessons = await getAllLessons(null, lang)
  const courseLessons = allWithLessons.find((c) => c.slug === courseSlug)

  if (!course || !courseLessons || courseLessons.lessons.length === 0) {
    notFound()
  }

  const lessons = courseLessons.lessons
  const labels = dict.courses?.labels ?? {}

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-8 flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
          <Link href={`/${lang}/`} className="hover:text-foreground flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span>{dict.navigation.home}</span>
          </Link>
          <span>/</span>
          <Link
            href={`/${lang}/courses/`}
            className="hover:text-foreground flex items-center gap-1"
          >
            <BookOpen className="w-4 h-4" />
            <span>{dict.navigation.courses}</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium max-w-[280px] truncate">
            {course.title}
          </span>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
          <p className="text-lg text-muted-foreground mb-6">{course.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {course.difficulty && (
              <span
                className={`px-3 py-1 rounded-full font-medium ${difficultyClasses(course.difficulty)}`}
              >
                {course.difficulty === 'beginner'
                  ? dict.courses?.difficulty_labels?.beginner || 'Beginner'
                  : course.difficulty === 'intermediate'
                    ? dict.courses?.difficulty_labels?.intermediate || 'Intermediate'
                    : dict.courses?.difficulty_labels?.advanced || 'Advanced'}
              </span>
            )}
            {course.duration && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {course.duration}
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-4 h-4" />
              {lessons.length} {dict.courses?.lessons || 'Lessons'}
            </span>
            {course.author && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <User className="w-4 h-4" />
                {course.author}
              </span>
            )}
          </div>

          <ResumeCta
            lang={lang}
            courseSlug={course.slug}
            lessonSlugs={lessons.map((l) => l.slug)}
            lessonCount={lessons.length}
            dict={dict}
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {dict.courses?.course_content || 'Course Content'}
          </h2>
          <ol className="space-y-3">
            {lessons.map((lesson, index) => (
              <li key={lesson.slug}>
                <Link
                  href={`/${lang}/courses/${course.slug}/${lesson.slug}/`}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:border-primary/50 hover:bg-accent/50 transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-medium flex-1 min-w-0 truncate">
                    {lesson.metadata.title}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            {labels.lessons}: {lessons.length}
            {course.duration ? ` · ${course.duration}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
