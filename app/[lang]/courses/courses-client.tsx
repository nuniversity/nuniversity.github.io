// app/[lang]/courses/courses-client.tsx
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Search, Clock, Target, GraduationCap, Sparkles, User } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'

interface Course {
  slug: string
  title: string
  description: string
  area: string
  author?: string
  difficulty?: string
  duration?: string
}

interface LessonData {
  slug: string
  lessons?: { slug: string }[]
}

interface CoursesClientProps {
  lang: Locale
  courses: Course[]
  lessonsData: LessonData[]
  dict: any
}

export function CoursesClient({ lang, courses, lessonsData, dict }: CoursesClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Filter courses based on search query and difficulty
  const filteredCourses = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    
    return courses.filter((c) => {
      const matchesSearch = !query || 
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.area.toLowerCase().includes(query) ||
        (c.author && c.author.toLowerCase().includes(query))
      
      const matchesDifficulty = selectedDifficulty === 'all' || 
        c.difficulty === selectedDifficulty

      return matchesSearch && matchesDifficulty
    })
  }, [courses, searchQuery, selectedDifficulty])

  // Group courses by area
  const groupedByArea = useMemo(() => {
    const grouped: Record<string, Course[]> = {}
    
    for (const course of filteredCourses) {
      const areaKey = course.area?.toLowerCase().replace(/\s+/g, '_') ?? 'uncategorized'
      const areaLabel = dict.courses?.areas?.[areaKey] ?? course.area ?? 'Uncategorized'
      
      if (!grouped[areaLabel]) {
        grouped[areaLabel] = []
      }
      grouped[areaLabel].push(course)
    }
    
    return grouped
  }, [filteredCourses, dict])

  // Get unique difficulties
  const difficulties = useMemo(() => {
    const uniqueDifficulties = new Set(courses.map(c => c.difficulty).filter(Boolean))
    return Array.from(uniqueDifficulties)
  }, [courses])

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

  // Get area icon color
  const getAreaColor = (index: number) => {
    const colors = [
      'from-blue-600 to-purple-600',
      'from-purple-600 to-pink-600',
      'from-pink-600 to-rose-600',
      'from-orange-600 to-red-600',
      'from-green-600 to-emerald-600',
      'from-cyan-600 to-blue-600',
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            {dict.courses?.title || 'Courses'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {dict.courses?.subtitle || 'Explore all available learning paths'}
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{courses.length} {dict.courses?.total_courses || 'courses'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>{Object.keys(groupedByArea).length} {dict.courses?.categories || 'categories'}</span>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-card border rounded-2xl p-6 mb-10">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={dict.courses?.search_placeholder || 'Search courses, authors...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Difficulty Filter */}
          {difficulties.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                {dict.courses?.filter_by_difficulty || 'Filter by difficulty'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDifficulty('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedDifficulty === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {dict.courses?.all_levels || 'All Levels'}
                </button>
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty || '')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                      selectedDifficulty === difficulty
                        ? getDifficultyColor(difficulty) + ' ring-2 ring-offset-2 ring-current'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || selectedDifficulty !== 'all'
                ? dict.courses?.no_results || 'No courses found'
                : dict.courses?.no_courses || 'No courses available yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedDifficulty !== 'all'
                ? dict.courses?.try_different_filters || 'Try adjusting your filters'
                : dict.courses?.check_back_soon || 'Check back soon for new content'}
            </p>
            {(searchQuery || selectedDifficulty !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedDifficulty('all')
                }}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {dict.courses?.clear_filters || 'Clear Filters'}
              </button>
            )}
          </div>
        )}

        {/* Grouped Courses */}
        <div className="space-y-12">
          {Object.entries(groupedByArea).map(([area, areaCourses], areaIndex) => (
            <div key={area}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAreaColor(areaIndex)} flex items-center justify-center`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{area}</h2>
                  <p className="text-sm text-muted-foreground">
                    {areaCourses.length} {areaCourses.length === 1 ? 'course' : 'courses'}
                  </p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {areaCourses.map((course) => {
                  // Find first lesson for this course
                  const courseData = lessonsData.find(c => c.slug === course.slug)
                  const firstLessonSlug = courseData?.lessons?.[0]?.slug
                  const lessonCount = courseData?.lessons?.length || 0

                  return (
                    <Link
                      key={course.slug}
                      href={
                        firstLessonSlug
                          ? `/${lang}/courses/${course.slug}/${firstLessonSlug}`
                          : `/${lang}/courses/${course.slug}`
                      }
                      className="group block bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Card Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getAreaColor(areaIndex)} flex items-center justify-center`}>
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
                        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed mb-3">
                          {course.description}
                        </p>

                        {/* Author */}
                        {course.author && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <User className="w-3 h-3" />
                            <span>{course.author}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {course.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{course.duration}</span>
                            </div>
                          )}
                          {lessonCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>{lessonCount} {dict.courses?.lessons || 'lessons'}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                          {dict.courses?.start_learning || 'Start →'}
                        </span>
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