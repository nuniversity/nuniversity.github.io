'use client'

import { Code, BookOpen, Calculator, GamepadIcon, Video, Users } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Courses',
    description: 'Comprehensive courses in technology, engineering, and sciences with hands-on projects and real-world applications.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Code,
    title: 'Coding Tools',
    description: 'Built-in code editors, compilers, and interactive environments to practice programming in multiple languages.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Calculator,
    title: 'Study Tools',
    description: 'Advanced calculators, formula references, and interactive tools to support your learning journey.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: GamepadIcon,
    title: 'Educational Games',
    description: 'Gamified learning experiences that make complex concepts fun and engaging to master.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Video,
    title: 'Video Integration',
    description: 'Seamless YouTube integration for video lectures and tutorials embedded directly in courses.',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Join a community of learners and educators sharing knowledge and collaborating on projects.',
    gradient: 'from-pink-500 to-purple-500',
  },
]

export default function Features() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to{' '}
            <span className="text-gradient">Excel</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Our platform combines the best of interactive learning, practical tools, and community support 
            to create an unparalleled educational experience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`w-full h-1 rounded-full bg-gradient-to-r ${feature.gradient}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
            <span>Discover all features</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}