'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Star, ArrowRight, BookOpen, Code, GitBranch, Beaker, Calculator, Database, Cpu, Globe, Sparkles, Brain, type LucideIcon } from 'lucide-react'
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
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-blue-500',
  'from-pink-500 to-purple-500',
  'from-teal-500 to-cyan-500',
  'from-yellow-500 to-orange-500',
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

function getIcon(icon?: string): LucideIcon {
  if (icon && iconMap[icon]) return iconMap[icon]
  return BookOpen
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function pseudoRating(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i)
    hash |= 0
  }
  return 4.0 + Math.abs(hash % 10) / 10
}

interface FeaturedCoursesProps {
  lang: Locale
  dict: Dictionary
  courses: CourseInfo[]
}

export default function FeaturedCourses({ lang, dict, courses }: FeaturedCoursesProps) {
  const displayCourses = courses.slice(0, 6)

  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container-custom">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured{' '}
            <span className="text-gradient">Courses</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {dict.courses?.subtitle || 'Start your learning journey with our most popular courses, designed by industry experts.'}
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {displayCourses.map((course, index) => {
            const Icon = getIcon(course.icon)
            const gradient = gradients[index % gradients.length]

            return (
              <motion.div
                key={course.slug}
                variants={cardVariants}
                className="group bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 card-hover"
              >
                <div className={`h-48 bg-gradient-to-r ${gradient} flex items-center justify-center relative overflow-hidden`}>
                  <Icon className="w-16 h-16 text-white/80" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                      {course.area}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {course.difficulty ? capitalize(course.difficulty) : 'All Levels'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {pseudoRating(course.slug)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration || 'Self-paced'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>Course</span>
                    </div>
                  </div>

                  <Link
                    href={course.firstLessonSlug
                      ? `/${lang}/courses/${course.slug}/${course.firstLessonSlug}`
                      : `/${lang}/courses/${course.slug}`
                    }
                    className="w-full btn-primary flex items-center justify-center space-x-2 group-hover:scale-105 transition-transform duration-300"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{dict.courses?.cta?.start_learning || 'Start Learning'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href={`/${lang}/courses`}
            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            <span>{dict.courses?.cta?.view_all || 'Explore all courses'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
