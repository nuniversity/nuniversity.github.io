// app/[lang]/courses/page.tsx
export const dynamic = "force-dynamic"

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllCourses, getAllLessons } from '@/lib/courses/get-course-content'
import Link from 'next/link'
import { BookOpen, Search, Clock, Target } from 'lucide-react'
import { Metadata } from 'next'

interface CoursesPageProps {
  params: { lang: Locale }
  searchParams?: { q?: string }
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    title: dict.courses?.title || 'Courses',
    description: dict.courses?.subtitle || 'Explore all available learning paths',
  }
}

export default async function CoursesPage({ params, searchParams }: CoursesPageProps) {
  const { lang } = params
  const dict = await getDictionary(lang)
  
  // Get all courses
  const allCourses = await getAllCourses(lang)
  
  // Get all lessons to find first lesson for each course
  const allLessonsData = await getAllLessons(null, lang)

  const query = (searchParams?.q ?? '').toLowerCase()

  // Filter courses by search query
  const filteredCourses = query
    ? allCourses.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.area.toLowerCase().includes(query)
      )
    : allCourses

  // Group courses by area
  const groupedByArea: Record<string, typeof allCourses> = {}
  for (const course of filteredCourses) {
    const areaKey = course.area?.toLowerCase().replace(/\s+/g, '_') ?? 'uncategorized'
    const areaLabel = dict.courses?.areas?.[areaKey] ?? course.area ?? 'Uncategorized'
    
    if (!groupedByArea[areaLabel]) {
      groupedByArea[areaLabel] = []
    }
    groupedByArea[areaLabel].push(course)
  }

  // Difficulty badge colors
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">
            {dict.courses?.title || 'Courses'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {dict.courses?.subtitle || 'Explore all available learning paths'}
          </p>
        </div>

        {/* Search Bar */}
        <form method="GET" action={`/${lang}/courses`} className="relative mb-10">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            name="q"
            placeholder={dict.courses?.search_placeholder || 'Search courses...'}
            defaultValue={query}
            className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg">
              {query 
                ? dict.courses?.no_results || 'No courses found matching your search'
                : dict.courses?.no_courses || 'No courses available yet'}
            </p>
          </div>
        )}

        {/* Grouped Courses */}
        <div className="space-y-12">
          {Object.entries(groupedByArea).map(([area, courses]) => (
            <div key={area}>
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                {area}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  // Find first lesson for this course
                  const courseData = allLessonsData.find(c => c.slug === course.slug)
                  const firstLessonSlug = courseData?.lessons?.[0]?.slug

                  return (
                    <Link
                      key={course.slug}
                      href={
                        firstLessonSlug
                          ? `/${lang}/courses/${course.slug}/${firstLessonSlug}`
                          : `/${lang}/courses/${course.slug}`
                      }
                      className="group block bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Header with icon and difficulty */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        {course.difficulty && (
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground line-clamp-3 mb-4 text-sm">
                        {course.description}
                      </p>

                      {/* Footer with metadata */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                        {course.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                          </div>
                        )}
                        {courseData?.lessons && (
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>{courseData.lessons.length} {dict.courses?.lessons || 'lessons'}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}