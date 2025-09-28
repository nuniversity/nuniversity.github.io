'use client'

import Link from 'next/link'
import { Clock, Users, Star, ArrowRight, BookOpen, Code, Calculator, Beaker } from 'lucide-react'

const featuredCourses = [
  {
    id: 1,
    title: 'Full Stack Web Development',
    description: 'Master modern web development with React, Node.js, and databases. Build real-world applications.',
    category: 'Web Development',
    level: 'Beginner',
    duration: '12 weeks',
    students: 1247,
    rating: 4.9,
    image: '/courses/fullstack.jpg',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    href: '/courses/web-development/fullstack'
  },
  {
    id: 2,
    title: 'Data Structures & Algorithms',
    description: 'Essential computer science concepts with hands-on coding practice and visual explanations.',
    category: 'Computer Science',
    level: 'Intermediate',
    duration: '8 weeks',
    students: 892,
    rating: 4.8,
    image: '/courses/algorithms.jpg',
    icon: Calculator,
    color: 'from-purple-500 to-pink-500',
    href: '/courses/computer-science/algorithms'
  },
  {
    id: 3,
    title: 'Introduction to Machine Learning',
    description: 'Learn ML fundamentals, Python libraries, and build your first AI models with practical projects.',
    category: 'Artificial Intelligence',
    level: 'Intermediate',
    duration: '10 weeks',
    students: 2156,
    rating: 4.9,
    image: '/courses/ml.jpg',
    icon: Beaker,
    color: 'from-green-500 to-emerald-500',
    href: '/courses/ai/machine-learning'
  }
]

export default function FeaturedCourses() {
  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured{' '}
            <span className="text-gradient">Courses</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Start your learning journey with our most popular and highly-rated courses, 
            designed by industry experts and loved by students worldwide.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredCourses.map((course, index) => (
            <div
              key={course.id}
              className="group bg-gray-50 dark:bg-gray-700 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Course Image/Icon */}
              <div className={`h-48 bg-gradient-to-r ${course.color} flex items-center justify-center relative overflow-hidden`}>
                <course.icon className="w-16 h-16 text-white/80" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                    {course.category}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {course.level}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {course.rating}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                  {course.description}
                </p>

                {/* Course Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students.toLocaleString()} students</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href={course.href}
                  className="w-full btn-primary flex items-center justify-center space-x-2 group-hover:scale-105 transition-transform duration-300"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Start Learning</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Courses CTA */}
        <div className="text-center">
          <Link
            href="/courses"
            className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            <span>Explore all courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}