// app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx
import { getCourseContent, getAllLessons, getAllCourses } from '@/lib/courses/get-course-content'
import { type Locale, i18n } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen, Home } from 'lucide-react'
import { Metadata } from 'next'


interface CoursePageProps {
  params: {
    lang: Locale
    courseSlug: string
    lessonSlug: string
  }
}


export async function generateStaticParams() {
  const params: {
    lang: Locale
    courseSlug: string
    lessonSlug: string
  }[] = []

  for (const lang of i18n.locales) {
    try {
      const coursesWithLessons = await getAllLessons(null, lang)
      
      for (const course of coursesWithLessons) {
        for (const lesson of course.lessons) {
          params.push({
            lang,
            courseSlug: course.slug,
            lessonSlug: lesson.slug,
          })
        }
      }
    } catch (error) {
      console.error(`Error generating params for ${lang}:`, error)
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { lang, courseSlug, lessonSlug } = params
  
  try {
    const lesson = await getCourseContent(courseSlug, lessonSlug, lang)
    
    if (!lesson) {
      return {
        title: 'Lesson Not Found',
      }
    }

    return {
      title: lesson.metadata.title,
      description: lesson.metadata.description || lesson.metadata.title,
    }
  } catch (error) {
    return {
      title: 'Lesson',
    }
  }
}

export default async function CourseLessonPage({ params }: CoursePageProps) {
  const { lang, courseSlug, lessonSlug } = params
  const dict = await getDictionary(lang)

  // Load lesson content
  const lesson = await getCourseContent(courseSlug, lessonSlug, lang)
  if (!lesson) {
    notFound()
  }

  // Load all lessons in this course
  const coursesWithLessons = await getAllLessons(courseSlug, lang)
  
  // Get the current course's lessons
  const currentCourse = coursesWithLessons.find(c => c.slug === courseSlug)
  if (!currentCourse) {
    notFound()
  }

  const allLessons = currentCourse.lessons
  const currentIndex = allLessons.findIndex((l) => l.slug === lessonSlug)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Get course info for breadcrumb
  const allCourses = await getAllCourses(lang)
  const courseInfo = allCourses.find(c => c.slug === courseSlug)

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center flex-wrap gap-2 text-sm text-muted-foreground">

          <Link href={`/${lang}`} className="hover:text-foreground flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span>{dict.navigation.home}</span>
          </Link>

          <span>/</span>

          <Link href={`/${lang}/courses`} className="hover:text-foreground flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{dict.navigation.courses}</span>
          </Link>

          <span>/</span>

          {courseInfo && (
            <>
              <span className="hover:text-foreground max-w-[200px] truncate">
                {courseInfo.title}
              </span>
              <span>/</span>
            </>
          )}

          <span className="text-foreground font-medium max-w-[200px] truncate">
            {lesson.metadata.title}
          </span>

        </nav>

        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {lesson.metadata.difficulty && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  lesson.metadata.difficulty === 'beginner'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : lesson.metadata.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {lesson.metadata.difficulty}
              </span>
            )}
            {lesson.metadata.duration && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <span>⏱</span>
                {lesson.metadata.duration}
              </span>
            )}
            {currentIndex >= 0 && (
              <span className="text-sm text-muted-foreground">
                {dict.courses?.lesson || 'Lesson'} {currentIndex + 1} {dict.common?.of || 'of'} {allLessons.length}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">{lesson.metadata.title}</h1>
          {lesson.metadata.description && (
            <p className="text-xl text-muted-foreground">
              {lesson.metadata.description}
            </p>
          )}
        </div>

        {/* Lesson Content */}
        <div className="bg-card rounded-lg border p-8 mb-8 shadow-sm">
          <MarkdownRenderer content={lesson.content} />
        </div>

        {/* Progress Bar */}
        {allLessons.length > 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{dict.courses?.progress || 'Progress'}</span>
              <span>{Math.round(((currentIndex + 1) / allLessons.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / allLessons.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            {prevLesson ? (
              <Link
                href={`/${lang}/courses/${courseSlug}/${prevLesson.slug}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
              >
                <ChevronLeft className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {dict.common.previous}
                  </div>
                  <div className="font-medium truncate">{prevLesson.metadata.title}</div>
                </div>
              </Link>
            ) : (
              <div></div>
            )}
          </div>
          
          <div className="flex-1 flex justify-end">
            {nextLesson ? (
              <Link
                href={`/${lang}/courses/${courseSlug}/${nextLesson.slug}`}
                className="group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
              >
                <div className="text-right min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {dict.common.next}
                  </div>
                  <div className="font-medium truncate">{nextLesson.metadata.title}</div>
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href={`/${lang}/courses`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>{dict.courses?.back_to_courses || 'Back to Courses'}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Course Overview Sidebar (Optional) */}
        {allLessons.length > 1 && (
          <div className="mt-12 p-6 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {dict.courses?.course_content || 'Course Content'}
            </h3>
            <div className="space-y-2">
              {allLessons.map((l, index) => (
                <Link
                  key={l.slug}
                  href={`/${lang}/courses/${courseSlug}/${l.slug}`}
                  className={`block px-3 py-2 rounded-lg transition-colors ${
                    l.slug === lessonSlug
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-sm">
                    {index + 1}. {l.metadata.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
