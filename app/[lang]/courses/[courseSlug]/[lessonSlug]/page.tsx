// app/[lang]/courses/[courseSlug]/[lessonSlug]/page.tsx
import { getCourseContent, getAllLessons, getAllCourses } from '@/lib/courses/get-course-content'
import { type Locale, i18n } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'
import LessonExam from '@/components/quizzes/LessonExam'
import { LessonScoreProvider, LessonScoreSummary } from '@/components/lessons/LessonScoreContext'
import LessonErrorBoundary from '@/components/lessons/LessonErrorBoundary'
import PracticeRecorder from '@/components/lessons/PracticeRecorder'
import LessonMasteryHint from '@/components/lessons/LessonMasteryHint'
import LessonOutline from '@/components/lessons/LessonOutline'
import { PdfExportButton } from '@/components/pdf/PdfExportButton'
import FocusableScrollers from '@/components/lessons/FocusableScrollers'
import {
  LessonScrollProgress,
  LessonKeyboardNav,
  LessonCompleteButton,
  LessonVisitTracker } from '@/components/lessons/LessonProgress'
import LessonFeedback from '@/components/lessons/LessonFeedback'
import CourseContentList from '@/components/lessons/CourseContentList'
import { extractExamQuestions } from '@/lib/markdown/exam-questions'
import { notFound } from 'next/navigation'
import Link from '@/components/navigation/AppLink'
import { ChevronLeft, ChevronRight, BookOpen, Home, Brain } from 'lucide-react'
import { Metadata } from 'next'
import { buildAlternates } from '@/lib/seo/alternates'
import { pageMetadata } from '@/lib/seo/metadata'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbSchema, lessonSchema } from '@/lib/seo/json-ld'


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
            lessonSlug: lesson.slug })
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
  const path = `courses/${courseSlug}/${lessonSlug}`

  try {
    const lesson = await getCourseContent(courseSlug, lessonSlug, lang)

    if (!lesson) {
      return {
        title: 'Lesson Not Found',
        alternates: buildAlternates(params.lang, path),
      }
    }

    return pageMetadata({
      lang,
      path,
      title: lesson.metadata.title,
      description: lesson.metadata.description || lesson.metadata.title,
      type: 'article',
    })
  } catch {
    return {
      title: 'Lesson',
      alternates: buildAlternates(params.lang, path),
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

  const lessonQuestions = lesson.metadata.exam ? extractExamQuestions(lesson.content) : []

  // BCP-47 tag for the reading voice. The spoken text itself is extracted in
  // the browser so the lesson body is not serialised into the RSC payload.

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

  const words = lesson.content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  const readingMinutes = Math.max(1, Math.ceil(words / 200))
  const prevHref = prevLesson ? `/${lang}/courses/${courseSlug}/${prevLesson.slug}` : null
  const nextHref = nextLesson ? `/${lang}/courses/${courseSlug}/${nextLesson.slug}` : null

  const lessonUrl = `/${lang}/courses/${courseSlug}/${lessonSlug}/`
  const courseTitle = courseInfo?.title ?? courseSlug

  return (
    <div className="container-custom py-12">
      <JsonLd
        data={[
          lessonSchema({
            title: lesson.metadata.title,
            description: lesson.metadata.description || lesson.metadata.title,
            url: lessonUrl,
            lang,
            courseTitle,
            courseUrl: `/${lang}/courses/${courseSlug}/`,
            position: currentIndex >= 0 ? currentIndex + 1 : undefined,
            duration: lesson.metadata.duration,
          }),
          breadcrumbSchema([
            { name: dict.navigation.home, url: `/${lang}/` },
            { name: dict.navigation.courses, url: `/${lang}/courses/` },
            { name: courseTitle, url: `/${lang}/courses/${courseSlug}/` },
            { name: lesson.metadata.title, url: lessonUrl },
          ]),
        ]}
      />
      <FocusableScrollers />
      <LessonScrollProgress />
      <LessonKeyboardNav prevHref={prevHref} nextHref={nextHref} />
      <LessonVisitTracker
        courseSlug={courseSlug}
        lessonSlug={lessonSlug}
        courseTitle={courseInfo?.title ?? courseSlug}
        lessonTitle={lesson.metadata.title}
        lang={lang}
      />
      {/* The outline owns the desktop split: it can be resized by dragging
          its edge, or hidden entirely for more reading room. */}
      <LessonOutline
        lang={lang}
        courseSlug={courseSlug}
        lessonSlug={lessonSlug}
        courseTitle={courseInfo?.title ?? courseSlug}
        lessonTitle={lesson.metadata.title}
        lessons={allLessons.map(l => ({ slug: l.slug, title: l.metadata.title }))}
        dict={dict}
      >
          <div className="mx-auto w-full" style={{ maxWidth: 'var(--lesson-content-max, 56rem)' }}>
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
              // Hidden on phones: a truncated course title plus its separator
              // was wrapping to a line of its own ("…Par… /").
              <span className="hidden items-center gap-2 sm:inline-flex">
                <Link
                  href={`/${lang}/courses/${courseSlug}/`}
                  className="hover:text-foreground max-w-[200px] truncate"
                >
                  {courseInfo.title}
                </Link>
                <span>/</span>
              </span>
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
                  {dict.courses?.difficulty_labels?.[lesson.metadata.difficulty] || lesson.metadata.difficulty}
                </span>
              )}
              {lesson.metadata.duration && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>⏱</span>
                  {lesson.metadata.duration}
                </span>
              )}
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <span>📖</span>
                {(dict.lesson?.reading_time || '{n} min read').replace('{n}', String(readingMinutes))}
              </span>
              {currentIndex >= 0 && (
                <span className="text-sm text-muted-foreground">
                  {dict.courses?.lesson || 'Lesson'} {currentIndex + 1} {dict.common?.of || 'of'} {allLessons.length}
                </span>
              )}
              <PdfExportButton
                mode="lesson"
                lang={lang}
                courseSlug={courseSlug}
                lessonSlug={lessonSlug}
                lessonTitle={lesson.metadata.title}
                lessonDescription={lesson.metadata.description ?? ''}
                dict={dict}
              />
            </div>
            <h1 className="text-4xl font-bold mb-4">{lesson.metadata.title}</h1>
            {lesson.metadata.description && (
              <p className="text-xl text-muted-foreground">
                {lesson.metadata.description}
              </p>
            )}
          </div>

          <LessonScoreProvider key={`${courseSlug}/${lessonSlug}`}>
          {/* Lesson Content */}
          <div
            className="bg-card rounded-2xl border border-border p-6 sm:p-8 mb-8 shadow-sm overflow-x-clip"
            data-lesson-content
          >
            <div className="prose-measure">
            <LessonErrorBoundary>
            {lesson.metadata.exam && lessonQuestions.length > 0 ? (
              <LessonExam
                lang={lang}
                lessonId={`${courseSlug}/${lessonSlug}`}
                questions={lessonQuestions}
                examMinutes={lesson.metadata.examMinutes ?? 90}
                dict={dict}
              >
                <MarkdownRenderer
                  content={lesson.content}
                  lang={lang}
                  dict={dict}
                  pageTitle={lesson.metadata.title}
                />
              </LessonExam>
            ) : (
              <>
                <MarkdownRenderer
                  content={lesson.content}
                  lang={lang}
                  dict={dict}
                  pageTitle={lesson.metadata.title}
                />
                <LessonScoreSummary dict={dict} />
              </>
            )}
            </LessonErrorBoundary>
            </div>
          </div>

          {/* Completion CTA */}
          <div className="mb-8">
            {!lesson.metadata.exam && <LessonMasteryHint dict={dict} />}
            <div className="mt-4">
              <LessonCompleteButton
                courseSlug={courseSlug}
                lessonSlug={lessonSlug}
                lessonSlugs={allLessons.map(lesson => lesson.slug)}
                dict={dict}
              />
            </div>
          </div>

          {!lesson.metadata.exam && (
            <PracticeRecorder
              courseSlug={courseSlug}
              lessonSlug={lessonSlug}
              skills={lesson.metadata.skills ?? []}
            />
          )}
          </LessonScoreProvider>

          {/* Feedback */}
          <LessonFeedback slug={`${courseSlug}/${lessonSlug}`} dict={dict} />

          {/* Progress Bar */}
          {allLessons.length > 1 && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{dict.courses?.progress || 'Progress'}</span>
                <span>{Math.round(((currentIndex + 1) / allLessons.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / allLessons.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mx-auto flex w-full items-center justify-between gap-4" style={{ maxWidth: 'var(--lesson-content-max, 56rem)' }}>
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
                    <div className="font-medium break-words max-w-[calc(100%-2rem)]">{prevLesson.metadata.title}</div>
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
                    <div className="font-medium break-words max-w-[calc(100%-2rem)] text-right">{nextLesson.metadata.title}</div>
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

          <p className="mt-6 text-center text-xs text-muted-foreground hidden lg:block">
            {dict.lesson?.keyboard_hint}
          </p>

          {/* Course Overview — the sidebar already lists the lessons on
              desktop, so this is a mobile-only fallback. */}
          {allLessons.length > 1 && (
            <div className="mt-12 p-6 bg-muted/50 rounded-lg border lg:hidden">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {dict.courses?.course_content || 'Course Content'}
              </h3>
              <CourseContentList
                lang={lang}
                courseSlug={courseSlug}
                lessonSlug={lessonSlug}
                lessons={allLessons.map(l => ({ slug: l.slug, title: l.metadata.title }))}
                dict={dict}
              />
            </div>
          )}
          </div>
      </LessonOutline>
    </div>
  )
}