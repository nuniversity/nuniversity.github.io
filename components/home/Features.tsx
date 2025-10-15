// components/home/Features.tsx
'use client'

import { Code, BookOpen, Calculator, GamepadIcon, Video, Users } from 'lucide-react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface FeaturesProps {
  lang: Locale
  dict: Dictionary
}

export default function Features({ lang, dict }: FeaturesProps) {
  const features = [
    {
      icon: BookOpen,
      title: dict.features.items.courses.title,
      description: dict.features.items.courses.description,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Code,
      title: dict.features.items.coding.title,
      description: dict.features.items.coding.description,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Calculator,
      title: dict.features.items.study.title,
      description: dict.features.items.study.description,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: GamepadIcon,
      title: dict.features.items.games.title,
      description: dict.features.items.games.description,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Video,
      title: dict.features.items.video.title,
      description: dict.features.items.video.description,
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Users,
      title: dict.features.items.community.title,
      description: dict.features.items.community.description,
      gradient: 'from-pink-500 to-purple-500',
    },
  ]

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {dict.features.title}{' '}
            <span className="text-gradient">{dict.features.titleHighlight}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {dict.features.subtitle}
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
        {/* <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
            <span>{dict.features.cta}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div> */}
      </div>
    </section>
  )
}